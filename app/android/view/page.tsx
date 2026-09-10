'use client';

/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendMobileCommand } from '../mobile-api';
import { downloadNoteImages, getCachedNotes, getMobileValue, mobileKeys, setCachedNotes, toHttpApiUrl } from '../mobile-storage';

type NoteItem = {
  topicId: string;
  topicName: string;
  images?: Array<{ filePath: string; pageNumber: number }>;
  subTopics?: { names: string[]; pageNumber: string | number }[];
  timestamp?: number;
  pinned?: boolean;
};

function imageSource(image: string | { filePath: string; pageNumber: number }, hostUrl: string): string {
  const imagePath = typeof image === 'string' ? image : image.filePath;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) return imagePath;
  return toHttpApiUrl(hostUrl, imagePath);
}

export default function AndroidNoteViewPage() {
  const router = useRouter();
  const [note, setNote] = useState<NoteItem | null>(null);
  const [status, setStatus] = useState('Loading note');
  const [error, setError] = useState('');
  const [hostUrl, setHostUrl] = useState('');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    const loadNote = async () => {
      const requestedId = new URLSearchParams(window.location.search).get('id');
      const [configuredHost, authToken] = await Promise.all([
        getMobileValue(mobileKeys.hostUrl),
        getMobileValue(mobileKeys.hostToken),
      ]);
      setHostUrl(configuredHost);
      if (!requestedId) {
        setError('No note was selected.');
        setStatus('');
        return;
      }
      const cachedNotes = await getCachedNotes();
      const cachedNote = cachedNotes.find((candidate) => candidate.topicId === requestedId);
      if (cachedNote) {
        setNote(cachedNote);
        setStatus(configuredHost && authToken ? 'Updating note' : 'Cached locally');
      }
      if (!configuredHost || !authToken) {
        if (!cachedNote) setError('Configure the host connection first.');
        setStatus('');
        return;
      }

      setStatus('Connecting');
      try {
        const message = await sendMobileCommand<{ notes?: NoteItem[] }>({ type: 'list_notes' });
        const receivedNotes = Array.isArray(message.notes) ? message.notes : [];
        const selectedNote = receivedNotes.find((candidate) => candidate.topicId === requestedId);
        if (!selectedNote) {
          setError('This note is no longer available.');
          setStatus('');
          return;
        }
        const sanitizedUrl = configuredHost.replace(/\/ws$/, '');
        const downloadedNotes = await Promise.all(receivedNotes.map(async (candidate) => ({
          ...candidate,
          images: await downloadNoteImages(candidate.images, sanitizedUrl, candidate.topicId),
        })));
        await setCachedNotes(downloadedNotes);
        setNote(downloadedNotes.find((candidate) => candidate.topicId === requestedId) || selectedNote);
        setStatus('');
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load this note.');
        setStatus('');
      }
    };
    void loadNote();
  }, []);

  return (
    <main className="min-h-dvh bg-[#091012] text-slate-100">
      <div className="mx-auto min-h-dvh w-full max-w-lg px-5 pb-10 pt-[calc(1.5rem+env(safe-area-inset-top))]">
        <header className="-mx-5 flex items-center gap-4 bg-[#091012] px-5">
          <button type="button" onClick={() => router.push('/android/dashboard')} aria-label="Back to dashboard" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-xl text-slate-300 active:scale-95">&#8592;</button>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-300">FluxNotes Mobile</p>
            <h1 className="mt-1 truncate text-xl font-semibold text-white">{note?.topicName || 'Note viewer'}</h1>
          </div>
        </header>

        {status && <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-500">{status}</div>}
        {error && (
          <section className="mt-8 rounded-3xl border border-rose-300/15 bg-rose-300/[0.06] p-5">
            <p className="text-sm text-rose-200">{error}</p>
            <button type="button" onClick={() => router.push('/android/settings')} className="mt-4 rounded-xl bg-rose-200 px-4 py-2 text-xs font-semibold text-[#281116]">Open connection settings</button>
          </section>
        )}

        {note && (
          <>
            <section className="mt-8 px-1">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-teal-300/80">{note.images?.length || 0} pages</p>
                  <h2 className="mt-2 text-2xl font-semibold leading-tight text-white">{note.topicName || 'Untitled Topic'}</h2>
                </div>
                {note.pinned && <span className="rounded-full bg-amber-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-300">Pinned</span>}
              </div>
              <p className="mt-3 text-sm text-slate-500">{note.subTopics?.length || 0} subtopics · {formatDate(note.timestamp)}</p>
            </section>

            <section className="mt-8 space-y-8">
              {note.images?.map((image, index) => (
                <figure key={`${image}-${index}`}>
                  <button type="button" onClick={() => setZoomedImage(imageSource(image, hostUrl))} className="block w-full cursor-zoom-in"><img src={imageSource(image, hostUrl)} alt={`Page ${index + 1} of ${note.topicName}`} className="block h-auto w-full" /></button>
                </figure>
              ))}
            </section>
          </>
        )}
      </div>
      {zoomedImage && <button type="button" onClick={() => setZoomedImage(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" aria-label="Close image viewer"><img src={zoomedImage} alt="Expanded note page" className="max-h-full max-w-full object-contain" /></button>}
    </main>
  );
}

function formatDate(timestamp?: number): string {
  if (!timestamp) return 'New note';
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
