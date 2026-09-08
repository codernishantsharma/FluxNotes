'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { AIProvider } from '@/types/notes';
import { SettingsTitleBar } from '@/components/settings/SettingsTitleBar';
import { SettingsNavigation, SettingsSectionId } from '@/components/settings/SettingsNavigation';
import { SettingsGeneral } from '@/components/settings/sections/SettingsGeneral';
import { SettingsProvider } from '@/components/settings/sections/SettingsProvider';
import { SettingsNgrok, NgrokState } from '@/components/settings/sections/SettingsNgrok';
import { SettingsDocker } from '@/components/settings/sections/SettingsDocker';
import { SettingsAppearance } from '@/components/settings/sections/SettingsAppearance';
import { SettingsUpdates } from '@/components/settings/sections/SettingsUpdates';
import { SettingsAbout } from '@/components/settings/sections/SettingsAbout';

const PROVIDER_STORAGE_KEY = 'fluxnotes-ai-provider';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('ngrok');
  const [provider, setProvider] = useState<AIProvider>('chatgpt');
  const [ngrokToken, setNgrokToken] = useState('');
  const [ngrokPort, setNgrokPort] = useState('8787');
  const [ngrokDomain, setNgrokDomain] = useState('');
  const [ngrokState, setNgrokState] = useState<NgrokState>({ configured: false, active: false, url: null, port: 8787, domain: '' });
  const [apiToken, setApiToken] = useState('');
  const [pairingQr, setPairingQr] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  const [dockerServerUrl, setDockerServerUrl] = useState('');
  const [dockerPassword, setDockerPassword] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    const savedProvider = window.localStorage.getItem(PROVIDER_STORAGE_KEY);
    if (savedProvider === 'chatgpt' || savedProvider === 'gemini') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProvider(savedProvider as AIProvider);
    }

    void window.electronAPI?.getApiToken().then(setApiToken);
    void window.electronAPI?.getNgrokSettings().then((settings) => {
      if (!settings) return;
      setNgrokState(settings);
      setNgrokPort(String(settings.port));
      setNgrokDomain(settings.domain);
    });
  }, []);

  const saveProvider = (nextProvider: AIProvider) => {
    setProvider(nextProvider);
    window.localStorage.setItem(PROVIDER_STORAGE_KEY, nextProvider);
  };

  const saveNgrok = async () => {
    const port = Number(ngrokPort);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      window.alert('Enter a valid port between 1 and 65535.');
      return;
    }
    if (!ngrokToken.trim() && !ngrokState.configured) {
      window.alert('Enter an ngrok auth token first.');
      return;
    }

    setIsSaving(true);
    const result = await window.electronAPI?.configureNgrok(ngrokToken, port, ngrokDomain);
    setIsSaving(false);
    if (!result?.success) {
      window.alert(result?.error || 'Unable to configure ngrok.');
      return;
    }
    setNgrokState({
      configured: Boolean(result.configured),
      active: Boolean(result.active),
      url: result.url || null,
      port: result.port || port,
      domain: result.domain || ngrokDomain,
    });
    setNgrokToken('');
  };

  const disableNgrok = async () => {
    setIsSaving(true);
    const result = await window.electronAPI?.configureNgrok('', Number(ngrokPort), '');
    setIsSaving(false);
    if (!result?.success) {
      window.alert(result?.error || 'Unable to disable ngrok.');
      return;
    }
    setNgrokState({ configured: false, active: false, url: null, port: Number(ngrokPort), domain: '' });
    setNgrokToken('');
  };

  const handleSyncSession = async () => {
    if (!dockerServerUrl.trim()) {
      window.alert('Please enter your Docker Server WSS URL.');
      return;
    }
    if (!dockerPassword.trim()) {
      window.alert('Please enter your Docker Server Connect Password.');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('idle');
    setSyncMessage('Connecting to Docker server and sending ChatGPT session cookies...');

    const res = await window.electronAPI?.syncSessionToServer(dockerServerUrl, dockerPassword);
    setIsSyncing(false);

    if (res?.success) {
      setSyncStatus('success');
      setSyncMessage(`Session successfully synced to Docker server! Server logged in: ${res.loggedIn ? 'Yes' : 'No'}`);
    } else {
      setSyncStatus('error');
      setSyncMessage(res?.error || 'Failed to sync session to Docker server.');
    }
  };

  const checkForUpdates = async () => {
    setUpdateMessage('Checking for updates...');
    const result = await window.electronAPI?.checkForUpdates();
    if (result?.status === 'dev-mode') setUpdateMessage('Updates are disabled in development mode.');
    else if (result?.error) setUpdateMessage(result.error);
    else setUpdateMessage('You are running the latest available version.');
  };

  const websocketUrl = ngrokState.url
    ? `${ngrokState.url.replace(/^https?:\/\//, 'wss://').replace(/\/$/, '')}/ws/api`
    : null;

  useEffect(() => {
    if (!websocketUrl || !apiToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPairingQr('');
      return;
    }
    void QRCode.toDataURL(JSON.stringify({ host: websocketUrl, authToken: apiToken }), {
      width: 220,
      margin: 2,
      color: { dark: '#d5fff6', light: '#111a1c' },
    }).then(setPairingQr);
  }, [apiToken, websocketUrl]);

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return <SettingsGeneral />;
      case 'provider':
        return <SettingsProvider provider={provider} onSaveProvider={saveProvider} />;
      case 'ngrok':
        return (
          <SettingsNgrok
            ngrokState={ngrokState}
            ngrokToken={ngrokToken}
            setNgrokToken={setNgrokToken}
            ngrokPort={ngrokPort}
            setNgrokPort={setNgrokPort}
            ngrokDomain={ngrokDomain}
            setNgrokDomain={setNgrokDomain}
            apiToken={apiToken}
            pairingQr={pairingQr}
            isSaving={isSaving}
            websocketUrl={websocketUrl}
            onSaveNgrok={saveNgrok}
            onDisableNgrok={disableNgrok}
          />
        );
      case 'docker':
        return (
          <SettingsDocker
            dockerServerUrl={dockerServerUrl}
            setDockerServerUrl={setDockerServerUrl}
            dockerPassword={dockerPassword}
            setDockerPassword={setDockerPassword}
            isSyncing={isSyncing}
            syncStatus={syncStatus}
            syncMessage={syncMessage}
            onSyncSession={handleSyncSession}
          />
        );
      case 'appearance':
        return <SettingsAppearance />;
      case 'updates':
        return <SettingsUpdates updateMessage={updateMessage} onCheckForUpdates={checkForUpdates} />;
      case 'about':
      default:
        return <SettingsAbout />;
    }
  };

  return (
    <div className="fixed inset-0 flex h-dvh flex-col overflow-hidden bg-[#090a0c] text-white">
      <SettingsTitleBar />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <SettingsNavigation activeSection={activeSection} onSelectSection={setActiveSection} />

        <main className="min-h-0 flex-1 overflow-y-auto p-5 md:p-10">
          <div className="mx-auto max-w-3xl">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}
