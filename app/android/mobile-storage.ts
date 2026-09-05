import { Preferences } from '@capacitor/preferences';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Http } from '@capacitor/http';

export const mobileKeys = {
  hostUrl: 'fluxnotes-android-host-url',
  hostToken: 'fluxnotes-android-host-token',
  deviceId: 'fluxnotes-android-device-id',
  sessionId: 'fluxnotes-android-session-id',
  sessionToken: 'fluxnotes-android-session-token',
  renewToken: 'fluxnotes-android-renew-token',
} as const;

export async function getMobileValue(key: string): Promise<string> {
  const { value } = await Preferences.get({ key });
  return value || '';
}

export async function setMobileValue(key: string, value: string): Promise<void> {
  await Preferences.set({ key, value });
}

export function toWebSocketUrl(hostUrl: string): string {
  const value = hostUrl.trim().replace(/\/$/, '');
  if (/^wss?:\/\//.test(value)) {
    if (value.endsWith('/ws/api')) return value;
    if (value.endsWith('/ws')) return `${value}/api`;
    return `${value}/ws/api`;
  }
  const url = new URL(value);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws/api';
  return url.toString().replace(/\/$/, '');
}

export function toHttpApiUrl(hostUrl: string, resourcePath: string): string {
  const url = new URL(hostUrl.trim());
  const resource = new URL(resourcePath, 'http://fluxnotes.local');
  url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
  const resourceName = resource.pathname.startsWith('/api/') || resource.pathname === '/api'
    ? resource.pathname
    : `/api${resource.pathname.startsWith('/') ? resource.pathname : `/${resource.pathname}`}`;
  url.pathname = resourceName;
  url.search = resource.search;
  return url.toString();
}

function imageRequestUrl(imagePath: string, hostUrl: string): string {
  if (/^https?:\/\//.test(imagePath)) return imagePath;
  return toHttpApiUrl(hostUrl, imagePath);
}

function base64FromBytes(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

export async function downloadNoteImages(
  images: string[] | undefined,
  hostUrl: string,
  filePrefix: string,
): Promise<string[]> {
  if (!images?.length || !Capacitor.isNativePlatform()) return images || [];

  return Promise.all(images.map(async (imagePath, index) => {
    if (imagePath.startsWith('local://') || imagePath.startsWith('data:')) return imagePath;
    try {
      const imageUrl = imageRequestUrl(imagePath, hostUrl);
      let contentType = 'image/png';
      let webResponse: Response | null = null;
      if (!Capacitor.isNativePlatform()) {
        webResponse = await fetch(imageUrl);
        if (!webResponse.ok) throw new Error(`Image request failed with ${webResponse.status}`);
        contentType = webResponse.headers.get('content-type') || contentType;
      }
      const extension = contentType.includes('jpeg') ? 'jpg' : contentType.includes('webp') ? 'webp' : contentType.includes('gif') ? 'gif' : 'png';
      const safePrefix = filePrefix.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48);
      const filePath = `images/${safePrefix}-${index}.${extension}`;
      const existing = await Filesystem.getUri({ directory: Directory.Data, path: filePath }).catch(() => null);
      if (existing?.uri) return Capacitor.convertFileSrc(existing.uri);
      if (Capacitor.isNativePlatform()) {
        await Http.downloadFile({ url: imageUrl, filePath, fileDirectory: Directory.Data });
      } else {
        const bytes = new Uint8Array(await webResponse!.arrayBuffer());
        await Filesystem.writeFile({ directory: Directory.Data, path: filePath, data: base64FromBytes(bytes), recursive: true });
      }
      const saved = await Filesystem.getUri({ directory: Directory.Data, path: filePath });
      return Capacitor.convertFileSrc(saved.uri);
    } catch (error) {
      console.error('Failed to download note image:', error);
      return imagePath;
    }
  }));
}

export async function getMobileDeviceInfo(): Promise<Record<string, string>> {
  const [id, info] = await Promise.all([Device.getId(), Device.getInfo()]);
  return {
    deviceId: id.identifier,
    deviceName: info.name || info.model || 'Android device',
    platform: info.platform,
    model: info.model,
    osVersion: info.osVersion,
    appVersion: '1.0.0',
    clientType: 'fluxnotes-android',
  };
}
