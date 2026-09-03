import { app, protocol, ipcMain } from 'electron';
import { ensureDirectoriesExist, appendToResultJson } from './utils/storage';
import { createChatSessionId } from './utils/helpers';
import {
  createWindows,
  getMainWindow,
  getWorkerWindow,
  getSelectedProvider,
  registerWindowControlListeners,
} from './windows';
import { registerNotesIpcHandlers } from './ipc/notes';
import { registerUpdaterHandlers } from './ipc/updater';
import { processAiPrompt } from './ai';
import { AIProvider, ChatSession } from './types';

const sessionState: {
  pendingChatUrl: string | null;
  activeChatSessionId: string | null;
  activeChatSession: ChatSession | null;
  isGeminiSessionInitialized: boolean;
  createChatSessionId: () => string;
} = {
  pendingChatUrl: null,
  activeChatSessionId: null,
  activeChatSession: null,
  isGeminiSessionInitialized: false,
  createChatSessionId,
};

function resetSessionState(): void {
  sessionState.activeChatSessionId = null;
  sessionState.activeChatSession = null;
  sessionState.isGeminiSessionInitialized = false;
}

ensureDirectoriesExist();

// --- AI Prompt Execution Handlers ---
ipcMain.handle('fill-chatgpt-input', async (_event, userText: string) => {
  const workerWindow = getWorkerWindow();
  const mainWindow = getMainWindow();
  if (!workerWindow) return false;

  const provider = (await getSelectedProvider()) as AIProvider || 'chatgpt';

  try {
    const { resultPayload, newSessionId, newSession, newGeminiInitialized } = await processAiPrompt(
      workerWindow,
      mainWindow,
      userText,
      provider,
      sessionState.activeChatSessionId,
      sessionState.activeChatSession,
      sessionState.isGeminiSessionInitialized,
    );

    sessionState.activeChatSessionId = newSessionId;
    sessionState.activeChatSession = newSession;
    sessionState.isGeminiSessionInitialized = newGeminiInitialized;

    return resultPayload;
  } catch (err) {
    const error = err as Error;
    console.error('Failed to execute fluxnotes API script:', error);
    appendToResultJson({
      sessionId: sessionState.activeChatSessionId || null,
      error: error && error.message ? String(error.message) : String(error),
      errorStack: error && error.stack ? String(error.stack) : null,
    });
    return false;
  }
});

// --- Protocol & App Initialization ---
app.whenReady().then(() => {
  protocol.registerFileProtocol('local', (request, callback) => {
    const url = request.url.replace(/^local:\/\//, '');
    let decodedPath = decodeURI(url);
    if (process.platform === 'win32' && decodedPath.startsWith('/')) {
      decodedPath = decodedPath.slice(1);
    }
    callback({ path: decodedPath });
  });

  registerWindowControlListeners();
  registerNotesIpcHandlers(getMainWindow, getWorkerWindow, getSelectedProvider, sessionState);
  registerUpdaterHandlers(getMainWindow);

  createWindows(resetSessionState);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
