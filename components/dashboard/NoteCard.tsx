/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import { NoteItem } from '@/types/notes';

type NoteCardProps = {
  note: NoteItem;
  isOpenMenu: boolean;
  onOpenNote: (topicId: string) => void;
  onToggleMenu: (topicId: string) => void;
  onTogglePin: (note: NoteItem) => void;
  onRename: (note: NoteItem) => void;
  onDelete: (note: NoteItem) => void;
};

const toImageSource = (image: string | { filePath: string; pageNumber: number }) => {
  const imagePath = typeof image === 'string' ? image : image.filePath;
  return imagePath.startsWith('local://') ? imagePath : `local://${encodeURI(imagePath.replace(/\\/g, '/'))}`;
};

export function NoteCard({
  note,
  isOpenMenu,
  onOpenNote,
  onToggleMenu,
  onTogglePin,
  onRename,
  onDelete,
}: NoteCardProps) {
  return (
    <div
      onClick={() => onOpenNote(note.topicId)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenNote(note.topicId);
        }
      }}
      className="group relative flex h-56 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#111217] p-5 shadow-xl transition-all duration-300 hover:border-teal-500/40 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
    >
      {note.images?.[0] && (
        <>
          <img
            src={toImageSource(note.images[0])}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="pointer-events-none absolute inset-0 h-full w-full scale-[1.03] object-cover opacity-45 blur-[1px] transition duration-300 group-hover:opacity-55"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-[#111217]/30 to-[#111217]/60" />
        </>
      )}

      <div className="relative z-10 space-y-2">
        <div className="flex items-start justify-between">
          <span className="rounded border border-white/5 bg-white/10 px-2 py-0.5 font-mono text-[10px] text-slate-300">
            {note.images?.length || 0} Pages
          </span>
          <div className="flex items-center gap-1">
            {note.pinned && <span className="text-[10px] text-teal-300">Pinned</span>}
            <span className="text-[10px] font-medium text-slate-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              {new Date(note.timestamp).toLocaleDateString()}
            </span>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onToggleMenu(note.topicId);
              }}
              aria-label={`More options for ${note.topicName || 'note'}`}
              title="More options"
              className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19" cy="12" r="1.5" />
              </svg>
            </button>
          </div>
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-200 transition group-hover:text-teal-300">
          {note.topicName || 'Untitled Topic'}
        </h3>
      </div>

      <div className="relative z-10 space-y-2 border-t border-white/5 pt-3">
        <div className="line-clamp-1 text-[11px] text-slate-400">
          {note.subTopics?.length || 0} Subtopics outlined
        </div>
        {note.chatUrl && (
          <div className="truncate font-mono text-[9px] text-teal-400/70">
            🔗 {note.chatUrl}
          </div>
        )}
      </div>

      {isOpenMenu && (
        <div
          onClick={(event) => event.stopPropagation()}
          className="absolute right-4 top-12 z-10 w-36 rounded-lg border border-white/10 bg-[#17181f] p-1 shadow-2xl"
        >
          <button
            onClick={() => onTogglePin(note)}
            className="w-full rounded px-2.5 py-2 text-left text-xs text-slate-300 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400"
          >
            {note.pinned ? 'Unpin note' : 'Pin note'}
          </button>
          <button
            onClick={() => onRename(note)}
            className="w-full rounded px-2.5 py-2 text-left text-xs text-slate-300 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400"
          >
            Change name
          </button>
          <button
            onClick={() => onDelete(note)}
            className="w-full rounded px-2.5 py-2 text-left text-xs text-red-300 transition hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400"
          >
            Delete note
          </button>
        </div>
      )}
    </div>
  );
}
