import path from 'path';
import fs from 'fs';
import { BrowserWindow } from 'electron';

let chatGptEngineScript = '';

export function loadChatGptEngineScript(): string {
  if (chatGptEngineScript) return chatGptEngineScript;
  try {
    const scriptPath = path.join(__dirname, '..', 'chatgpt-engine.js');
    chatGptEngineScript = fs.readFileSync(scriptPath, 'utf8');
  } catch (err) {
    console.error('WARNING: Could not load ChatGPT engine script from', path.join(__dirname, '..', 'chatgpt-engine.js'), err);
  }
  return chatGptEngineScript;
}

export async function injectChatGptEngineIfNeeded(workerWindow: BrowserWindow): Promise<void> {
  const script = loadChatGptEngineScript();
  const isEngineLoaded = await workerWindow.webContents.executeJavaScript(`typeof window.__fluxnotesChatGPT !== 'undefined'`);
  if (!isEngineLoaded && script) {
    console.log('[ELECTRON] fluxnotes ChatGPT engine missing. Injecting now...');
    await workerWindow.webContents.executeJavaScript(script);
  }
}
