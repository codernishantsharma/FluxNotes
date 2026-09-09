'use client';

import React from 'react';
import { SubTopic } from '@/types/notes';
import { TypingGenerationText } from './TypingGenerationText';

type PageSkeletonProps = {
  targetPageNum: number;
  subTopic?: SubTopic;
  isCurrentlyBuilding: boolean;
  startTs?: number;
  nowMs: number;
  failedMsg?: string;
  idx: number;
  onRetry?: () => void;
  isProcessing?: boolean;
};

export function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (hours > 0) return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  if (minutes > 0) return `${minutes}m ${pad(seconds)}s`;
  return `${seconds}s`;
}

export function PageSkeleton({
  targetPageNum,
  subTopic,
  isCurrentlyBuilding,
  startTs,
  nowMs,
  failedMsg,
  idx,
  onRetry,
  isProcessing,
}: PageSkeletonProps) {
  const elapsedMs = startTs ? nowMs - startTs : 0;

  if (failedMsg) {
    return (
      <div
        className="fail-shake relative flex h-[600px] w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-md border border-red-500/40 bg-red-500/10 shadow-inner"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.18),transparent_60%)]" />
        <div className="relative flex flex-col items-center gap-3 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-red-400/60 bg-red-500/20 text-red-200">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-semibold text-red-100">
              Page {targetPageNum} failed to generate
            </div>
            <div className="max-w-md text-xs text-red-200/80">
              {failedMsg}
            </div>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              disabled={isProcessing}
              className="mt-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="isolate relative flex h-[600px] w-full flex-col overflow-hidden rounded-md border border-white/10 shadow-inner"
    >
      {/* Animated cozy background */}
      <div className="cozy-bg absolute inset-0 opacity-90" aria-hidden />
      <div
        className="absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '22px 22px, 48px 48px',
          backgroundPosition: '0 0, 11px 11px',
          mixBlendMode: 'overlay',
        }}
      />
      <div
        className="cozy-twinkle absolute -left-16 top-10 h-48 w-48 rounded-full bg-cyan-300/30 blur-3xl"
        style={{ animationDelay: `${(idx * 0.3) % 3}s` }}
        aria-hidden
      />
      <div
        className="cozy-twinkle absolute right-10 top-40 h-40 w-40 rounded-full bg-fuchsia-300/30 blur-3xl"
        style={{ animationDelay: `${(0.7 + idx * 0.45) % 3}s` }}
        aria-hidden
      />
      <div
        className="cozy-twinkle absolute bottom-24 left-1/2 h-36 w-56 -translate-x-1/2 rounded-full bg-teal-300/30 blur-3xl"
        style={{ animationDelay: `${(1.4 + idx * 0.6) % 3}s` }}
        aria-hidden
      />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-between px-8 py-8 text-center">
        <div className="flex w-full items-start justify-between text-[11px] uppercase tracking-[0.22em] text-white/75">
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 backdrop-blur-sm">
            Page {targetPageNum}
          </span>
          {isCurrentlyBuilding ? (
            <span className="rounded-full border border-teal-300/30 bg-teal-500/30 px-3 py-1.5 text-teal-50 backdrop-blur-sm">
              In progress
            </span>
          ) : (
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-white/80 backdrop-blur-sm">
              Queued
            </span>
          )}
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="cozy-breathe absolute inset-0 rounded-full bg-white/20 blur-xl" aria-hidden />
            <div
              className={`relative flex h-20 w-20 items-center justify-center rounded-full border-2 ${
                isCurrentlyBuilding
                  ? 'border-teal-200/60 bg-white/20 backdrop-blur-md'
                  : 'border-white/30 bg-white/10 backdrop-blur-sm'
              }`}
            >
              {isCurrentlyBuilding ? (
                <>
                  <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-teal-300" style={{ animationDuration: '1.1s' }} />
                  <div className="absolute inset-1.5 animate-spin rounded-full border border-transparent border-b-cyan-200/70" style={{ animationDuration: '1.8s', animationDirection: 'reverse' }} />
                  <svg className="cozy-breathe" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 17l4.35-9.22a2 2 0 0 1 1.8-1.18h5.7a2 2 0 0 1 1.8 1.18L21 17" />
                    <path d="M7.5 12.5a3 3 0 0 1 6 0" />
                    <circle cx="8.5" cy="19" r="1" fill="white" />
                    <circle cx="15.5" cy="19" r="1" fill="white" />
                  </svg>
                  <span className="cozy-spark absolute -top-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-fuchsia-300" style={{ animationDelay: `${(idx * 0.6) % 3}s` }} />
                  <span className="cozy-spark absolute -top-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-200" style={{ animationDelay: `${(0.9 + idx * 0.7) % 3}s` }} />
                </>
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeOpacity="0.85" strokeWidth="1.8">
                  <path d="M12 4v6m0 0-2.5-2M12 10l2.5-2M6.5 12H4M20 12h-2.5M6.8 18.2l-1.8 1.8M19 20l-1.8-1.8M6.8 5.8 5 4M19 4l-1.8 1.8" />
                  <circle cx="12" cy="15" r="3.25" />
                </svg>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="text-base font-semibold text-white drop-shadow-sm">
              {isCurrentlyBuilding ? (
                <TypingGenerationText active={isCurrentlyBuilding} pageNumber={targetPageNum} />
              ) : (
                `Page ${targetPageNum} is ready to render`
              )}
            </div>
            <div
              className={`min-h-[22px] text-xs text-white/90 ${
                isCurrentlyBuilding ? '' : 'opacity-80'
              }`}
            >
              {isCurrentlyBuilding
                ? 'Dressing the canvas with a fresh visual rhythm.'
                : 'Everything is lined up and waiting for the next warm pass.'}
            </div>
            {subTopic?.names?.[0] && (
              <div className="line-clamp-1 pt-1 text-[11px] text-white/70">
                Theme — <span className="text-white/90">{subTopic.names[0]}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex w-full items-end justify-between text-[11px] text-white/80">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 backdrop-blur-sm">
            <span className="cozy-twinkle inline-block h-1.5 w-1.5 rounded-full bg-white/70" />
            <span className="font-mono tabular-nums tracking-wide">
              {startTs ? formatElapsed(elapsedMs) : '—'}
            </span>
            <span className="text-white/60">elapsed</span>
          </div>
          <div className="text-right text-white/70">
            {isCurrentlyBuilding
              ? 'Hang tight — it takes time to look this cozy.'
              : 'Your turn is coming up softly.'}
          </div>
        </div>
      </div>
    </div>
  );
}
