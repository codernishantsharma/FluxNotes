'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { WindowControls } from '@/components/ui/WindowControls';

export function SettingsTitleBar() {
  const router = useRouter();

  return (
    <div
      className="flex h-9 shrink-0 select-none items-center justify-between border-b border-white/10 bg-black px-3 text-xs text-slate-400"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={() => router.push('/')}
          aria-label="Back to notes"
          title="Back to notes"
          className="flex h-7 w-7 items-center justify-center rounded text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400"
        >
          <span className="text-base">‹</span>
        </button>
        <span className="font-semibold text-slate-200">FluxNotes</span>
        <span className="text-slate-600">/</span>
        <span>Settings</span>
      </div>
      <WindowControls />
    </div>
  );
}
