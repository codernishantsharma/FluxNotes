/* eslint-disable @next/next/no-img-element */
'use client';

import React, { RefObject } from 'react';
import { AssistantData, AIProvider } from '@/types/notes';
import { FileTypeIcon, formatFileSize, getFileKind } from './FileTypeIcon';

type ChatInputAreaProps = {
  inputText: string;
  setInputText: (val: string) => void;
  isProcessing: boolean;
  hasStartedGeneration: boolean;
  assistantData: AssistantData | null;
  selectedFiles: ChatAttachment[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<ChatAttachment[]>>;
  attachmentError: string | null;
  exportMessage: string | null;
  provider: AIProvider;
  promptInputRef: RefObject<HTMLTextAreaElement | null>;
  onSendPrompt: (promptText: string) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
};

export function ChatInputArea({
  inputText,
  setInputText,
  isProcessing,
  hasStartedGeneration,
  assistantData,
  selectedFiles,
  setSelectedFiles,
  attachmentError,
  exportMessage,
  provider,
  promptInputRef,
  onSendPrompt,
  onFileChange,
  onKeyDown,
}: ChatInputAreaProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center px-0 pb-4 sm:pb-6 lg:pb-10">
      <div className={`pointer-events-none relative flex w-full flex-col gap-3 px-3 transition-all duration-300 sm:px-5 ${assistantData ? 'pr-64 sm:pr-80' : ''}`}>
        {!hasStartedGeneration && assistantData?.aiResponse && (
          <div className="pointer-events-auto mx-auto w-full max-w-4xl rounded-2xl bg-[#111217]/70 px-6 py-4 text-sm text-slate-200 shadow-lg backdrop-blur-xl">
            {assistantData.aiResponse}
          </div>
        )}

        {!hasStartedGeneration && assistantData?.recommendedResponse && assistantData.recommendedResponse.length > 0 && (
          <div className="pointer-events-auto mx-auto flex w-full max-w-4xl flex-wrap justify-end gap-2">
            {assistantData.recommendedResponse.map((rec, idx) => (
              <button
                key={idx}
                onClick={() => onSendPrompt(rec)}
                disabled={isProcessing}
                className="cursor-pointer rounded-full bg-[#111217]/70 px-4 py-2 text-xs text-slate-300 shadow-lg backdrop-blur-xl transition hover:bg-white/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400"
              >
                {rec}
              </button>
            ))}
          </div>
        )}

        {/* Input Text Box */}
        <div className="pointer-events-auto relative mx-auto mt-1 w-full max-w-4xl">
          <div className="pointer-events-none absolute -inset-1 rounded-full bg-teal-500/15 blur-2xl transition-all duration-300" />
          <div className="pointer-events-none absolute -inset-2 rounded-full bg-cyan-400/10 blur-[30px] transition-all duration-300" />

          {selectedFiles.length > 0 && (
            <div className="mb-2 flex max-h-36 flex-wrap gap-2 overflow-y-auto rounded-lg border border-teal-500/30 bg-[#111217]/90 p-2 shadow-lg">
              {selectedFiles.map((file, index) => (
                <div key={`${file.filename}-${index}`} className="relative flex min-w-44 max-w-60 items-center gap-2 overflow-hidden rounded-md border border-white/10 bg-white/5 p-2" title={file.filename}>
                  {file.mimeType.startsWith('image/') ? (
                    <img src={`data:${file.mimeType};base64,${file.base64}`} alt={file.filename} className="h-10 w-10 shrink-0 rounded object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-black/20">
                      <FileTypeIcon kind={getFileKind(file.mimeType, file.filename)} />
                    </span>
                  )}
                  <span className="min-w-0 pr-4">
                    <span className="block truncate text-xs font-medium text-slate-200">{file.filename}</span>
                    <span className="block text-[10px] uppercase tracking-wide text-slate-500">
                      {getFileKind(file.mimeType, file.filename)} · {formatFileSize(file.fileSize)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                    className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-[11px] text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400"
                    aria-label={`Remove ${file.filename}`}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
          {attachmentError && <p className="mb-2 text-center text-xs text-red-300">{attachmentError}</p>}
          <div className="relative flex items-end rounded-xl border border-teal-500/30 bg-[#111217]/80 pr-2 shadow-2xl backdrop-blur-xl focus-within:border-cyan-400/50">
            {provider === 'chatgpt' && (
              <>
                <input id="chat-attachment" type="file" multiple onChange={onFileChange} disabled={isProcessing || selectedFiles.length >= 10} className="sr-only" />
                <label
                  htmlFor="chat-attachment"
                  title="Attach file"
                  aria-label="Attach file"
                  className="mb-2 ml-2 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-xl leading-none text-teal-200 transition hover:bg-white/10"
                >
                  +
                </label>
              </>
            )}
            <textarea
              ref={promptInputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              disabled={isProcessing}
              placeholder={isProcessing ? 'Responding ...' : 'Type your prompt to generate your notes'}
              className="relative min-h-14 min-w-0 flex-1 resize-none rounded-xl bg-transparent px-4 py-4 text-sm leading-6 text-white outline-none placeholder-slate-400 disabled:cursor-not-allowed disabled:opacity-90"
            />
          </div>
          {exportMessage && (
            <p className="mt-2 text-center text-xs text-teal-300">{exportMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
