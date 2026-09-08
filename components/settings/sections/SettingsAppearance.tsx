import React from 'react';
import { SettingSection, SettingRow, Toggle } from '../SettingsUIComponents';

export function SettingsAppearance() {
  return (
    <SettingSection title="Appearance" description="Tune the interface for your preferred working rhythm.">
      <SettingRow title="Dark interface" description="Use the focused dark workspace throughout the app.">
        <Toggle enabled />
      </SettingRow>
      <SettingRow title="Compact note cards" description="Fit more saved notes into the library view.">
        <Toggle />
      </SettingRow>
    </SettingSection>
  );
}
