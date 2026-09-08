import React from 'react';

export function SettingSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="border-b border-white/10 pb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
      </div>
      <div className="divide-y divide-white/10">{children}</div>
    </div>
  );
}

export function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-5">
      <div>
        <div className="text-sm font-medium text-slate-200">{title}</div>
        <div className="mt-1 text-xs text-slate-500">{description}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs text-slate-300">
      <span>{label}</span>
      {hint && <span className="ml-2 text-[10px] text-slate-500">{hint}</span>}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

export function Toggle({ enabled = false }: { enabled?: boolean }) {
  return (
    <span className={`flex h-6 w-10 items-center rounded-full p-1 ${enabled ? 'justify-end bg-teal-400' : 'bg-white/10'}`}>
      <span className={`h-4 w-4 rounded-full ${enabled ? 'bg-black' : 'bg-slate-500'}`} />
    </span>
  );
}

export function ProviderCard({
  name,
  detail,
  active,
  onClick,
}: {
  name: string;
  detail: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition ${
        active ? 'border-teal-300/50 bg-teal-300/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white">{name}</span>
        <span className={`h-2 w-2 rounded-full ${active ? 'bg-teal-300' : 'bg-slate-700'}`} />
      </div>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </button>
  );
}
