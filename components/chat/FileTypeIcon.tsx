import React from 'react';

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileKind(mimeType: string, filename: string) {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf' || extension === 'pdf') return 'pdf';
  if (mimeType.includes('spreadsheet') || ['csv', 'xls', 'xlsx'].includes(extension)) return 'spreadsheet';
  if (mimeType.includes('zip') || mimeType.includes('compressed') || ['7z', 'rar', 'tar', 'gz', 'zip'].includes(extension)) return 'archive';
  if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('text/')) return 'code';
  if (mimeType.includes('word') || mimeType.includes('document') || ['doc', 'docx', 'rtf'].includes(extension)) return 'document';
  return 'file';
}

export function FileTypeIcon({ kind }: { kind: string }) {
  const colors: Record<string, string> = {
    pdf: 'text-red-300',
    document: 'text-blue-300',
    spreadsheet: 'text-emerald-300',
    archive: 'text-amber-300',
    code: 'text-cyan-300',
    audio: 'text-pink-300',
    video: 'text-violet-300',
    file: 'text-slate-300',
  };
  if (kind === 'image') return null;
  return (
    <svg width="28" height="32" viewBox="0 0 24 28" fill="none" className={colors[kind] || colors.file} aria-hidden="true">
      <path d="M4 1.5h10l5 5V26.5H4z" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="1.4" />
      <path d="M14 1.5v5h5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 15h9M7 18.5h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
