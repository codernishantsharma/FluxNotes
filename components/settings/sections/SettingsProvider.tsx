import React from 'react';
import { AIProvider } from '@/types/notes';
import { SettingSection, ProviderCard } from '../SettingsUIComponents';

type SettingsProviderProps = {
  provider: AIProvider;
  onSaveProvider: (provider: AIProvider) => void;
};

export function SettingsProvider({ provider, onSaveProvider }: SettingsProviderProps) {
  return (
    <SettingSection title="AI Provider" description="Choose which assistant powers your note generation.">
      <div className="grid gap-3 sm:grid-cols-2">
        <ProviderCard
          name="ChatGPT"
          detail="Browser-assisted generation"
          active={provider === 'chatgpt'}
          onClick={() => onSaveProvider('chatgpt')}
        />
        <ProviderCard
          name="Gemini"
          detail="Available in development"
          active={provider === 'gemini'}
          onClick={() => onSaveProvider('gemini')}
        />
      </div>
    </SettingSection>
  );
}
