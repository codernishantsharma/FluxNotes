import React from 'react';
import { SettingSection, SettingRow } from '../SettingsUIComponents';

export function SettingsAbout() {
  return (
    <SettingSection title="About FluxNotes" description="A quiet workspace for turning ideas into visual study notes.">
      <SettingRow title="Version" description="FluxNotes 0.2.3">
        <span className="font-mono text-xs text-slate-400">0.2.3</span>
      </SettingRow>
      <SettingRow title="Storage" description="Your notes and generated pages are stored locally.">
        <span className="text-xs text-teal-300">Local-first</span>
      </SettingRow>
    </SettingSection>
  );
}
