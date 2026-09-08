import React from 'react';
import { SettingSection, SettingRow, Toggle } from '../SettingsUIComponents';

export function SettingsGeneral() {
  return (
    <SettingSection title="General" description="Control how FluxNotes behaves on this computer.">
      <SettingRow title="Launch at login" description="Start FluxNotes when you sign in to your computer.">
        <Toggle />
      </SettingRow>
      <SettingRow title="Keep data local" description="Notes, generated pages, and settings stay on this device.">
        <Toggle enabled />
      </SettingRow>
      <SettingRow title="Confirm before deleting" description="Ask before removing notes and their generated pages.">
        <Toggle enabled />
      </SettingRow>
    </SettingSection>
  );
}
