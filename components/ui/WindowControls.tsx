'use client';

import React from 'react';

export function WindowControls() {
  const minimizeWindow = () => window.electronAPI?.minimize();
  const maximizeWindow = () => window.electronAPI?.maximize();
  const closeWindow = () => window.electronAPI?.close();

  return (
    <div className="flex items-center gap-1 -mr-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
      <button
        onClick={minimizeWindow}
        aria-label="Minimize window"
        title="Minimize"
        className="flex h-9 w-11 items-center justify-center text-slate-400 transition hover:bg-[#27272a] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400"
      >
        <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
          <path d="M0 0h10v1H0z" />
        </svg>
      </button>
      <button
        onClick={maximizeWindow}
        aria-label="Maximize window"
        title="Maximize"
        className="flex h-9 w-11 items-center justify-center text-slate-400 transition hover:bg-[#27272a] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor">
          <rect x="0.5" y="0.5" width="9" height="9" />
        </svg>
      </button>
      <button
        onClick={closeWindow}
        aria-label="Close window"
        title="Close"
        className="flex h-9 w-11 items-center justify-center text-slate-400 transition hover:bg-red-600 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <path d="M1.07 0L0 1.07l3.93 3.93L0 8.93 1.07 10l3.93-3.93L8.93 10 10 8.93 6.07 5 10 1.07 8.93 0 5 3.93 1.07 0z" />
        </svg>
      </button>
    </div>
  );
}
