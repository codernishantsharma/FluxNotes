'use client';

import React from 'react';

type UpdateBannerProps = {
  onRestartAndInstall: () => void;
};

export function UpdateBanner({ onRestartAndInstall }: UpdateBannerProps) {
  return (
    <div className="z-40 flex items-center justify-between border-b border-teal-500/30 bg-teal-500/10 px-6 py-2.5 text-xs">
      <div className="flex items-center gap-2 font-medium text-teal-300">
        <span className="h-2 w-2 animate-ping rounded-full bg-teal-400" />
        A new version of FluxNotes has been downloaded from GitHub.
      </div>
      <button
        onClick={onRestartAndInstall}
        className="cursor-pointer rounded-md bg-teal-500 px-3 py-1 font-semibold text-black shadow-lg transition hover:bg-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
      >
        Restart & Install Now
      </button>
    </div>
  );
}
