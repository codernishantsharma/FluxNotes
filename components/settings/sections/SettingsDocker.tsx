'use client';

import React from 'react';
import { SettingSection, Field } from '../SettingsUIComponents';

type SettingsDockerProps = {
  dockerServerUrl: string;
  setDockerServerUrl: (val: string) => void;
  dockerPassword: string;
  setDockerPassword: (val: string) => void;
  isSyncing: boolean;
  syncStatus: 'idle' | 'success' | 'error';
  syncMessage: string;
  onSyncSession: () => void;
};

export function SettingsDocker({
  dockerServerUrl,
  setDockerServerUrl,
  dockerPassword,
  setDockerPassword,
  isSyncing,
  syncStatus,
  syncMessage,
  onSyncSession,
}: SettingsDockerProps) {
  return (
    <SettingSection title="Remote Server (Docker)" description="Sync your desktop ChatGPT session and cookies to a remote FluxNotes Docker server.">
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Server WSS URL" hint="e.g. wss://your-app.onrender.com/ws/api or ws://192.168.1.50:8787/ws/api">
          <input
            type="text"
            value={dockerServerUrl}
            onChange={(event) => setDockerServerUrl(event.target.value)}
            placeholder="wss://your-app.onrender.com/ws/api"
            className="settings-input font-mono"
          />
        </Field>
        <Field label="Connect Password" hint="Logged on server startup or DESKTOP_CONNECT_PASSWORD">
          <input
            type="password"
            value={dockerPassword}
            onChange={(event) => setDockerPassword(event.target.value)}
            placeholder="Enter server connect password"
            className="settings-input"
          />
        </Field>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onSyncSession}
          disabled={isSyncing || !dockerServerUrl.trim() || !dockerPassword.trim()}
          className="settings-primary disabled:opacity-50"
        >
          {isSyncing ? 'Syncing Session...' : 'Sync ChatGPT Session to Server'}
        </button>
      </div>
      {syncMessage && (
        <div className={`mt-4 rounded-lg border p-3 text-xs ${
          syncStatus === 'success' ? 'border-teal-500/30 bg-teal-500/10 text-teal-200' :
          syncStatus === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-200' :
          'border-white/10 bg-black/20 text-slate-300'
        }`}>
          {syncMessage}
        </div>
      )}
      <p className="mt-4 text-xs leading-5 text-slate-500">
        This sends your logged-in ChatGPT cookies and session storage from Electron to your remote Docker server so it can execute prompts on your behalf without manual browser re-login.
      </p>
    </SettingSection>
  );
}
