import { getMobileDeviceInfo, getMobileValue, mobileKeys, setMobileValue, toWebSocketUrl } from './mobile-storage';

export type MobileCommand = {
  type: string;
  [key: string]: unknown;
};

export const MOBILE_HOST_TIMEOUT_MS = 5 * 60 * 1000;
const MOBILE_HOST_MAX_RETRIES = 5;
const MOBILE_HOST_RETRY_DELAY_MS = 1500;

export function isHostUnreachableError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  return (
    normalized.includes('unable to reach the host')
    || normalized.includes('host not configured')
    || normalized.includes('network request failed')
    || normalized.includes('network error')
  );
}

async function sendMobileCommandOnce<T = Record<string, unknown>>(command: MobileCommand): Promise<T> {
  const [hostUrl, authToken, deviceInfo] = await Promise.all([
    getMobileValue(mobileKeys.hostUrl),
    getMobileValue(mobileKeys.hostToken),
    getMobileDeviceInfo(),
  ]);
  if (!hostUrl || !authToken) throw new Error('Host not configured.');

  return new Promise<T>((resolve, reject) => {
    const socket = new WebSocket(toWebSocketUrl(hostUrl));
    let settled = false;
    const timeout = window.setTimeout(() => finish(new Error('Host connection timed out.')), MOBILE_HOST_TIMEOUT_MS);
    const finish = (error?: Error, value?: T) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      socket.close();
      if (error) reject(error);
      else resolve(value as T);
    };

    socket.onopen = () => socket.send(JSON.stringify({ type: 'auth', authToken, deviceInfo }));
    socket.onerror = () => finish(new Error('Unable to reach the host.'));
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data) as Record<string, unknown>;
      if (message.type === 'authenticated') {
        void setMobileValue(mobileKeys.sessionId, String(message.sessionId || ''));
        void setMobileValue(mobileKeys.sessionToken, String(message.token || ''));
        void setMobileValue(mobileKeys.renewToken, String(message.renewToken || ''));
        socket.send(JSON.stringify({ ...command, sessionId: message.sessionId, token: message.token }));
      } else if (message.type === 'error' || message.type === 'command_error') {
        finish(new Error(String(message.message || 'Host command failed.')));
      } else if (message.type === 'notes' || message.type === 'logs' || message.type === 'command_result' || message.type === 'device_info' || message.type === 'mobile_info') {
        finish(undefined, message as T);
      }
    };
  });
}

export async function sendMobileCommand<T = Record<string, unknown>>(command: MobileCommand): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MOBILE_HOST_MAX_RETRIES; attempt++) {
    try {
      return await sendMobileCommandOnce<T>(command);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (isHostUnreachableError(err)) throw err;

      lastError = err;
      if (attempt < MOBILE_HOST_MAX_RETRIES) {
        console.warn('[Mobile API] Host command failed, retrying...', {
          attempt,
          command: command.type,
          reason: err.message,
        });
        await new Promise((resolve) => window.setTimeout(resolve, MOBILE_HOST_RETRY_DELAY_MS));
      }
    }
  }

  throw lastError ?? new Error('Host command failed after retries.');
}
