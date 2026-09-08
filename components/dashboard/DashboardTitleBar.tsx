'use client';

import React from 'react';
import { ChatGptMark, GeminiMark } from '@/components/icons/ProviderIcons';
import { WindowControls } from '@/components/ui/WindowControls';
import { AIProvider } from '@/types/notes';

type DashboardTitleBarProps = {
  provider: AIProvider;
  onChangeProvider: (provider: AIProvider) => void;
  updateStatus: 'idle' | 'checking' | 'downloading' | 'ready';
  downloadProgress: number;
  onCheckForUpdates: () => void;
  onOpenSettings: () => void;
};

export function DashboardTitleBar({
  provider,
  onChangeProvider,
  updateStatus,
  downloadProgress,
  onCheckForUpdates,
  onOpenSettings,
}: DashboardTitleBarProps) {
  return (
    <div
      className="z-50 flex h-9 w-full shrink-0 select-none items-center justify-between border-b border-none bg-black px-3 text-xs text-[#a1a1aa] backdrop-blur-md"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 font-medium text-white" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <span className="pl-1 font-semibold text-slate-200">FluxNotes</span>
        <div className="ml-3 flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-0.5" aria-label="AI provider">
          <button
            type="button"
            onClick={() => onChangeProvider('chatgpt')}
            aria-label="Use ChatGPT"
            title="Use ChatGPT"
            aria-pressed={provider === 'chatgpt'}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 ${
              provider === 'chatgpt' ? 'bg-teal-300/20 text-teal-200' : 'text-slate-500 hover:text-white'
            }`}
          >
            <ChatGptMark />
          </button>
          <button
            type="button"
            onClick={() => onChangeProvider('gemini')}
            aria-label="Use Gemini"
            title="Use Gemini"
            aria-pressed={provider === 'gemini'}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 ${
              provider === 'gemini' ? 'bg-blue-400/20 text-blue-200' : 'text-slate-500 hover:text-white'
            }`}
          >
            <GeminiMark />
          </button>
          <span className="mr-1 text-[8px] font-semibold tracking-wide text-blue-300/80">DEV</span>
        </div>

        {/* Updater status indicator / trigger button */}
        <button
          onClick={onCheckForUpdates}
          className="ml-3 cursor-pointer rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400"
          title="Click to check for updates manually"
          aria-label="Check for updates"
        >
          {updateStatus === 'checking' && 'Checking updates...'}
          {updateStatus === 'downloading' && `Downloading (${downloadProgress}%)`}
          {updateStatus === 'ready' && 'Update Ready!'}
          {updateStatus === 'idle' && 'Check for updates'}
        </button>
      </div>

      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={onOpenSettings}
          aria-label="Open settings"
          title="Settings"
          className="flex h-9 w-11 items-center justify-center text-slate-400 transition hover:bg-[#27272a] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
            <path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4V19a2 2 0 1 1-4 0v-.1a2 2 0 0 0-3.4-1.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A2 2 0 0 0 1.6 11H1.5a2 2 0 1 1 0-4h.1A2 2 0 0 0 3 3.6l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A2 2 0 0 0 9.2 1.5V1.4a2 2 0 1 1 4 0v.1a2 2 0 0 0 3.4 1.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A2 2 0 0 0 20.8 7h.1a2 2 0 1 1 0 4h-.1a2 2 0 0 0-1.4 3.4Z" />
          </svg>
        </button>
        <WindowControls />
      </div>
    </div>
  );
}
