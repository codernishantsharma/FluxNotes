/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import { SettingSection, Field } from '../SettingsUIComponents';

export type NgrokState = {
  configured: boolean;
  active: boolean;
  url: string | null;
  port: number;
  domain: string;
};

type SettingsNgrokProps = {
  ngrokState: NgrokState;
  ngrokToken: string;
  setNgrokToken: (val: string) => void;
  ngrokPort: string;
  setNgrokPort: (val: string) => void;
  ngrokDomain: string;
  setNgrokDomain: (val: string) => void;
  apiToken: string;
  pairingQr: string;
  isSaving: boolean;
  websocketUrl: string | null;
  onSaveNgrok: () => void;
  onDisableNgrok: () => void;
};

export function SettingsNgrok({
  ngrokState,
  ngrokToken,
  setNgrokToken,
  ngrokPort,
  setNgrokPort,
  ngrokDomain,
  setNgrokDomain,
  apiToken,
  pairingQr,
  isSaving,
  websocketUrl,
  onSaveNgrok,
  onDisableNgrok,
}: SettingsNgrokProps) {
  return (
    <SettingSection title="Ngrok Tunnel" description="Expose the local app or a WebSocket terminal through a secure public URL.">
      <div className="rounded-lg border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-white">Tunnel status</div>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
              <span className={`h-2 w-2 rounded-full ${ngrokState.active ? 'bg-teal-400' : 'bg-slate-600'}`} />
              {ngrokState.active ? 'Active' : ngrokState.configured ? 'Configured, inactive' : 'Not configured'}
            </div>
          </div>
          {websocketUrl && (
            <span className="max-w-[48%] truncate font-mono text-xs text-teal-300" title={websocketUrl}>
              {websocketUrl}
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Mobile API token" hint="Use this token in the WebSocket auth message.">
          <input type="text" readOnly value={apiToken} className="settings-input font-mono" />
        </Field>
        <Field label="Auth token" hint={ngrokState.configured ? 'Leave blank to keep the saved token.' : undefined}>
          <input
            type="password"
            value={ngrokToken}
            onChange={(event) => setNgrokToken(event.target.value)}
            placeholder={ngrokState.configured ? 'Saved token' : 'Paste your ngrok token'}
            className="settings-input"
          />
        </Field>
        <Field label="Local port">
          <input
            type="number"
            min="1"
            max="65535"
            value={ngrokPort}
            onChange={(event) => setNgrokPort(event.target.value)}
            className="settings-input"
          />
        </Field>
        <Field label="Permanent domain" hint="Optional; leave blank for a dynamic URL.">
          <input
            type="text"
            value={ngrokDomain}
            onChange={(event) => setNgrokDomain(event.target.value)}
            placeholder="my-app.ngrok.app"
            className="settings-input"
          />
        </Field>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onDisableNgrok}
          disabled={isSaving || !ngrokState.configured}
          className="settings-danger disabled:opacity-40"
        >
          Disable tunnel
        </button>
        <button
          onClick={onSaveNgrok}
          disabled={isSaving}
          className="settings-primary disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save and start tunnel'}
        </button>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Mobile clients use the tunnel URL with <code className="text-slate-300">wss://</code> at <code className="text-slate-300">/ws/api</code>. The local API defaults to port <code className="text-slate-300">8787</code>.
      </p>

      {pairingQr && (
        <div className="mt-5 flex items-center gap-4 rounded-lg border border-white/10 bg-black/20 p-3">
          <img src={pairingQr} alt="Mobile pairing QR code" className="h-28 w-28 rounded-md" />
          <div>
            <div className="text-xs font-medium text-slate-200">Pair Android app</div>
            <p className="mt-1 text-[10px] leading-4 text-slate-500">
              Scan this code from the first Android screen to import the host URL and auth token.
            </p>
          </div>
        </div>
      )}
    </SettingSection>
  );
}
