'use client';

import React from 'react';

export type SettingsSectionId = 'general' | 'provider' | 'ngrok' | 'docker' | 'appearance' | 'updates' | 'about';

export const SETTINGS_SECTIONS: { id: SettingsSectionId; label: string; description: string }[] = [
  { id: 'general', label: 'General', description: 'App behavior and local data' },
  { id: 'provider', label: 'AI Provider', description: 'Choose your generation engine' },
  { id: 'ngrok', label: 'Ngrok Tunnel', description: 'Expose a local WebSocket service' },
  { id: 'docker', label: 'Remote Server (Docker)', description: 'Sync ChatGPT session to remote server' },
  { id: 'appearance', label: 'Appearance', description: 'Theme and interface density' },
  { id: 'updates', label: 'Updates', description: 'Version and release settings' },
  { id: 'about', label: 'About FluxNotes', description: 'Version and project details' },
];

type SettingsNavigationProps = {
  activeSection: SettingsSectionId;
  onSelectSection: (section: SettingsSectionId) => void;
};

export function SettingsNavigation({ activeSection, onSelectSection }: SettingsNavigationProps) {
  return (
    <aside className="w-full shrink-0 border-b border-white/10 bg-[#0d0e11] p-3 md:w-72 md:border-b-0 md:border-r md:p-5">
      <div className="mb-4 px-2 pt-1">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300/80">Workspace</div>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-white">Settings</h1>
      </div>
      <nav className="flex gap-1 overflow-x-auto md:block md:space-y-1">
        {SETTINGS_SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => onSelectSection(section.id)}
            className={`group flex min-w-max items-center gap-3 rounded-lg px-3 py-2.5 text-left transition md:w-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 ${
              activeSection === section.id ? 'bg-teal-300/10 text-teal-200' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${activeSection === section.id ? 'bg-teal-300' : 'bg-slate-700 group-hover:bg-slate-400'}`} />
            <span>
              <span className="block text-xs font-medium">{section.label}</span>
              <span className="mt-0.5 hidden text-[10px] text-slate-500 md:block">{section.description}</span>
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
