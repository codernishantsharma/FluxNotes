'use client';

import React from 'react';

type CreateNoteCardProps = {
  onCreateNewNote: () => void;
};

export function CreateNoteCard({ onCreateNewNote }: CreateNoteCardProps) {
  return (
    <div
      onClick={onCreateNewNote}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onCreateNewNote();
        }
      }}
      className="group flex h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-[#111217]/30 p-5 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-teal-500/50 hover:bg-[#111217]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-slate-400 transition group-hover:bg-teal-500/10 group-hover:text-teal-400">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </div>
      <div className="text-center">
        <div className="text-sm font-medium text-slate-200 transition group-hover:text-teal-300">Create New Note</div>
        <div className="mt-0.5 text-xs text-slate-500">Start a fresh AI study session</div>
      </div>
    </div>
  );
}
