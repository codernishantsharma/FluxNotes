import path from 'path';
import fs from 'fs';
import { BrowserWindow } from 'electron';
import { GeneratedImageInfo } from '../types';
import { createChatSessionId } from '../utils/helpers';

let geminiEngineScript = '';

export function loadGeminiEngineScript(): string {
  if (geminiEngineScript) return geminiEngineScript;
  try {
    const scriptPath = path.join(__dirname, '..', 'gemini-engine.js');
    geminiEngineScript = fs.readFileSync(scriptPath, 'utf8');
  } catch (err) {
    console.error('WARNING: Could not load Gemini engine script from', path.join(__dirname, '..', 'gemini-engine.js'), err);
  }
  return geminiEngineScript;
}

export function extractGeminiImageLinks(rawText: string): string[] {
  if (typeof rawText !== 'string') return [];

  const normalizedText = rawText
    .replace(/\\\//g, '/')
    .replace(/\\u0026/gi, '&')
    .replace(/\\u003d/gi, '=');
  const links = normalizedText.match(/https?:\/\/lh3\.googleusercontent\.com\/[^\s"'<>`\\)]+/gi) || [];

  return [...new Set(links.map((link) => link.replace(/[.,;!?]+$/, '')))];
}

export async function downloadGeminiImages(rawText: string): Promise<GeneratedImageInfo[]> {
  const links = extractGeminiImageLinks(rawText);
  const downloadedImages: GeneratedImageInfo[] = [];

  for (const imageUrl of links) {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentType = response.headers.get('content-type') || 'image/png';
      const imageData = Buffer.from(await response.arrayBuffer());
      if (imageData.length === 0) throw new Error('Empty image response');

      const fileId = createChatSessionId();
      downloadedImages.push({
        imagePath: imageUrl,
        fileId,
        generationId: fileId,
        download: {
          base64: imageData.toString('base64'),
          mimeType: contentType.split(';')[0] || 'image/png',
        },
      });
    } catch (error) {
      const err = error as Error;
      console.error('[ELECTRON] Failed to download Gemini image:', imageUrl, err.message);
    }
  }

  return downloadedImages;
}

export async function injectGeminiEngineIfNeeded(workerWindow: BrowserWindow): Promise<void> {
  const script = loadGeminiEngineScript();
  const isEngineLoaded = await workerWindow.webContents.executeJavaScript(`typeof window.__fluxnotesGeminiUnified !== 'undefined'`);
  if (!isEngineLoaded && script) {
    console.log('[ELECTRON] Gemini engine missing. Injecting now...');
    await workerWindow.webContents.executeJavaScript(script);
  }
}
