'use client';

import React from 'react';
import { SettingSection, SettingRow } from '../SettingsUIComponents';

type SettingsUpdatesProps = {
  updateMessage: string;
  onCheckForUpdates: () => void;
};

export function SettingsUpdates({ updateMessage, onCheckForUpdates }: SettingsUpdatesProps) {
  return (
    <SettingSection title="Updates" description="Keep FluxNotes current with the latest release.">
      <SettingRow title="Current version" description="FluxNotes 0.2.3">
        <span className="text-xs text-slate-400">Installed</span>
      </SettingRow>
      <div className="pt-4">
        <button onClick={onCheckForUpdates} className="settings-primary">
          Check for updates
        </button>
        {updateMessage && <p className="mt-3 text-xs text-slate-400">{updateMessage}</p>}
      </div>
    </SettingSection>
  );
}
