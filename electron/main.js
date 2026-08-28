const { app, BrowserWindow, dialog, ipcMain, nativeImage, protocol, shell } = require("electron");
const serve = require("electron-serve");
const path = require("path");
const fs = require("fs");
const Keyv = require("keyv");
const KeyvSqlite = require("@keyv/sqlite");
const { autoUpdater } = require('electron-updater');

// Configure autoUpdater settings
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

const appServe = app.isPackaged ? serve({
  directory: path.join(__dirname, "../out")
}) : null;

let mainWindow;
let hiddenWorkerWindow;
let processedUrls = new Set();
let pendingChatUrl = null;
let loginCheckInterval = null;

function disableDevTools(window) {
  window.webContents.on('before-input-event', (event, input) => {
    const isDevToolsShortcut = input.key === 'F12'
      || ((input.control || input.meta) && input.shift && input.key.toLowerCase() === 'i');
    if (isDevToolsShortcut) event.preventDefault();
  });
  window.webContents.on('devtools-opened', () => window.webContents.closeDevTools());
}

function openAppLinksExternally(window) {
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => {
    const isAppUrl = app.isPackaged ? url.startsWith('app://') : url.startsWith('http://localhost:3000');
    if (!isAppUrl) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });
}

function isChatGptUrl(url) {
  try {
    return new URL(url).hostname === 'chatgpt.com';
  } catch {
    return false;
  }
}

function completeTruncatedJson(jsonText) {
  const stack = [];
  let inString = false;
  let isEscaped = false;
  let unfinishedStringIsKey = false;
  let previousNonWhitespace = '';

  for (const character of jsonText) {
    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (character === '\\') {
        isEscaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
      unfinishedStringIsKey = previousNonWhitespace === '{'
        || (previousNonWhitespace === ',' && stack.at(-1) === '}');
    } else if (character === '{') {
      stack.push('}');
    } else if (character === '[') {
      stack.push(']');
    } else if (character === '}' || character === ']') {
      if (stack.at(-1) === character) stack.pop();
    }

    if (!/\s/.test(character)) previousNonWhitespace = character;
  }

  let completed = jsonText.trim();
  if (inString) completed += unfinishedStringIsKey ? '": null' : '"';
  if (/:\\s*$/.test(completed)) completed += 'null';
  completed = completed.replace(/,\\s*$/, '');

  return completed + stack.reverse().join('');
}

function completeNotePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;
  if (!['new', 'update'].includes(payload.status)) return payload;

  const subTopics = Array.isArray(payload.subTopics) ? payload.subTopics : [];
  const recommendedResponse = Array.isArray(payload.recommendedResponse)
    ? payload.recommendedResponse.filter((response) => typeof response === 'string' && response.trim())
    : [];
  if (!recommendedResponse.some((response) => response.trim().toLowerCase() === 'continue')) {
    recommendedResponse.push('Continue');
  }

  return {
    ...payload,
    status: payload.status,
    topicName: typeof payload.topicName === 'string' ? payload.topicName : '',
    topicId: typeof payload.topicId === 'string' ? payload.topicId : '',
    subTopics: subTopics.map((subTopic, index) => ({
      names: Array.isArray(subTopic?.names)
        ? subTopic.names.filter((name) => typeof name === 'string' && name.trim())
        : [],
      pageNumber: subTopic?.pageNumber ?? String(index + 1),
    })),
    aiResponse: typeof payload.aiResponse === 'string' ? payload.aiResponse : '',
    recommendedResponse,
  };
}

// Setup Keyv with SQLite storage in user data folder
const dbPath = path.join(app.getPath('userData'), 'notes.sqlite');
const imagesDir = path.join(app.getPath('userData'), 'images');

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Initialize Keyv database
const keyvSqlite = new KeyvSqlite.KeyvSqlite(`sqlite://${dbPath}`);
const db = new Keyv.Keyv({ store: keyvSqlite});

db.on('error', err => console.error('Keyv Database Connection Error:', err));

async function getStoredNotes() {
  const notes = await db.get('notes_collection');
  return notes || [];
}

async function getStoredRecords() {
  const records = await db.get('image_records');
  return records || [];
}

async function saveRecordToDb(record) {
  const records = await getStoredRecords();
  records.push(record);
  await db.set('image_records', records);
}

function toLocalImageUrl(filePath) {
  return `local://${encodeURI(filePath.replace(/\\/g, '/'))}`;
}

function fromLocalImageUrl(value) {
  return value.startsWith('local://') ? decodeURI(value.replace(/^local:\/\//, '')) : value;
}

function safeFileName(name) {
  return (name || 'notes').replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim() || 'notes';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

// --- Auto-Updater IPC Handlers & Events ---

ipcMain.handle('check-for-updates', async () => {
  if (!app.isPackaged) return { status: 'dev-mode' };
  try {
    const res = await autoUpdater.checkForUpdatesAndNotify();
    return { status: 'checking', info: res };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.on('restart-to-update', () => {
  autoUpdater.quitAndInstall(false, true);
});

autoUpdater.on('update-available', (info) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater-event', { type: 'update-available', info });
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater-event', { type: 'download-progress', progress: progressObj.percent });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater-event', { type: 'update-downloaded', info });
  }
});

// --- Notes App IPC Handlers ---

ipcMain.handle('get-all-notes', async () => {
  return await getStoredNotes();
});

ipcMain.handle('get-note-by-id', async (_, topicId) => {
  const notes = await getStoredNotes();
  return notes.find(n => n.topicId === topicId) || null;
});

ipcMain.handle('start-new-chat', async () => {
  pendingChatUrl = null;
  if (hiddenWorkerWindow && !hiddenWorkerWindow.isDestroyed()) {
    await hiddenWorkerWindow.loadURL('https://chatgpt.com/');
  }
  return true;
});

ipcMain.handle('set-note-chat-url', (_, chatUrl) => {
  pendingChatUrl = typeof chatUrl === 'string' && isChatGptUrl(chatUrl) ? chatUrl : null;
  return true;
});

ipcMain.handle('save-note', async (_, noteData) => {
  const notes = await getStoredNotes();
  const chatUrl = hiddenWorkerWindow ? hiddenWorkerWindow.webContents.getURL() : "";
  const savedImages = Array.isArray(noteData.images)
    ? noteData.images
      .map((imagePath) => typeof imagePath === 'string' ? fromLocalImageUrl(imagePath) : '')
      .filter((imagePath) => imagePath.startsWith(imagesDir) && fs.existsSync(imagePath))
      .map(toLocalImageUrl)
    : [];
  
  const fullNoteRecord = {
    ...noteData,
    images: savedImages,
    chatUrl,
    timestamp: Date.now()
  };

  const existingIndex = notes.findIndex(n => n.topicId === noteData.topicId);
  if (existingIndex >= 0) {
    notes[existingIndex] = { ...notes[existingIndex], ...fullNoteRecord };
  } else {
    notes.push(fullNoteRecord);
  }

  await db.set('notes_collection', notes);
  return true;
});

ipcMain.handle('rename-note', async (_, { topicId, topicName }) => {
  const name = typeof topicName === 'string' ? topicName.trim() : '';
  if (!name) return { success: false, error: 'A note name is required.' };

  const notes = await getStoredNotes();
  const index = notes.findIndex((note) => note.topicId === topicId);
  if (index === -1) return { success: false, error: 'Note not found.' };

  notes[index] = { ...notes[index], topicName: name };
  await db.set('notes_collection', notes);
  return { success: true };
});

ipcMain.handle('set-note-pinned', async (_, { topicId, pinned }) => {
  const notes = await getStoredNotes();
  const index = notes.findIndex((note) => note.topicId === topicId);
  if (index === -1) return { success: false, error: 'Note not found.' };

  notes[index] = { ...notes[index], pinned: Boolean(pinned) };
  await db.set('notes_collection', notes);
  return { success: true };
});

ipcMain.handle('delete-note', async (_, topicId) => {
  const notes = await getStoredNotes();
  const noteToDelete = notes.find((note) => note.topicId === topicId);
  if (!noteToDelete) return { success: false, error: 'Note not found.' };

  const remainingNotes = notes.filter((note) => note.topicId !== topicId);
  const remainingImagePaths = new Set(remainingNotes.flatMap((note) => (
    Array.isArray(note.images) ? note.images.map(fromLocalImageUrl) : []
  )));
  const removableImagePaths = (noteToDelete.images || [])
    .map(fromLocalImageUrl)
    .filter((imagePath) => imagePath.startsWith(imagesDir) && !remainingImagePaths.has(imagePath));

  await Promise.all(removableImagePaths.map(async (imagePath) => {
    try {
      await fs.promises.unlink(imagePath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }));
  await db.set('notes_collection', remainingNotes);

  const removedPaths = new Set(removableImagePaths);
  const records = await getStoredRecords();
  await db.set('image_records', records.filter((record) => !removedPaths.has(record.filePath)));
  return { success: true };
});

ipcMain.handle('export-note', async (_, { images, topicName, format }) => {
  const imagePaths = Array.isArray(images)
    ? images.map((imagePath) => typeof imagePath === 'string' ? fromLocalImageUrl(imagePath) : '')
      .filter((imagePath) => fs.existsSync(imagePath))
    : [];

  if (imagePaths.length === 0) {
    return { success: false, error: 'There are no generated pages to export.' };
  }

  const fileName = safeFileName(topicName);

  if (format === 'pdf') {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export notes as PDF',
      defaultPath: `${fileName}.pdf`,
      filters: [{ name: 'PDF document', extensions: ['pdf'] }],
    });
    if (canceled || !filePath) return { success: false, canceled: true };

    const printWindow = new BrowserWindow({ show: false, webPreferences: { sandbox: true, devTools: false } });
    disableDevTools(printWindow);
    try {
      const pagesHtml = imagePaths.map((imagePath, index) => (
        `<section class="page"><img src="${toLocalImageUrl(imagePath)}" alt="Page ${index + 1}" /></section>`
      )).join('');
      const html = `<!doctype html><html><head><meta charset="utf-8" />
        <title>${escapeHtml(topicName || 'Notes')}</title>
        <style>@page { margin: 0; } body { margin: 0; background: white; } .page { break-after: page; } .page:last-child { break-after: auto; } img { display: block; width: 100%; height: auto; }</style>
        </head><body>${pagesHtml}</body></html>`;
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
      const pdf = await printWindow.webContents.printToPDF({ printBackground: true, preferCSSPageSize: true });
      await fs.promises.writeFile(filePath, pdf);
      return { success: true, path: filePath, count: imagePaths.length };
    } finally {
      if (!printWindow.isDestroyed()) printWindow.destroy();
    }
  }

  if (format === 'png' || format === 'jpeg') {
    const { canceled, filePaths } = await dialog.openDialog(mainWindow, {
      title: `Export notes as ${format.toUpperCase()} images`,
      properties: ['openDirectory', 'createDirectory'],
    });
    const outputDirectory = filePaths[0];
    if (canceled || !outputDirectory) return { success: false, canceled: true };

    await Promise.all(imagePaths.map(async (imagePath, index) => {
      const pageNumber = String(index + 1).padStart(2, '0');
      const outputPath = path.join(outputDirectory, `${fileName}-page-${pageNumber}.${format === 'jpeg' ? 'jpg' : 'png'}`);
      if (format === 'png') {
        await fs.promises.copyFile(imagePath, outputPath);
      } else {
        const jpegData = nativeImage.createFromPath(imagePath).toJPEG(95);
        await fs.promises.writeFile(outputPath, jpegData);
      }
    }));

    return { success: true, path: outputDirectory, count: imagePaths.length };
  }

  return { success: false, error: 'Unsupported export format.' };
});

// Setup Login Verification and Window Toggling Routine
function startLoginCheckRoutine() {
  if (loginCheckInterval) clearInterval(loginCheckInterval);

  loginCheckInterval = setInterval(async () => {
    if (!hiddenWorkerWindow || hiddenWorkerWindow.isDestroyed()) return;

    try {
      const currentUrl = hiddenWorkerWindow.webContents.getURL();
      
      // If the hidden worker is currently on an auth/login redirect url (e.g., Auth0, Google Sign-in, login endpoints), pause checking
      if (!currentUrl.includes('chatgpt.com')) {
        return; 
      }

      // Check if "Log in" or "Sign up" text elements exist on the chatgpt.com page content
      const hasLoginText = await hiddenWorkerWindow.webContents.executeJavaScript(`
        (function() {
          const bodyText = document.body ? document.body.innerText : "";
          // Check for login buttons or text presence
          return bodyText.includes("Log in") || bodyText.includes("Sign up");
        })();
      `);

      if (hasLoginText) {
        // User is not logged in: Hide main app window and show hidden worker window to let them sign in
        if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
          mainWindow.hide();
        }
        if (hiddenWorkerWindow && !hiddenWorkerWindow.isVisible()) {
          hiddenWorkerWindow.show();
        }
      } else {
        // User is logged in: Hide hidden worker window and show main app window
        if (hiddenWorkerWindow && !hiddenWorkerWindow.isDestroyed() && hiddenWorkerWindow.isVisible()) {
          hiddenWorkerWindow.hide();
        }
        if (mainWindow && !mainWindow.isVisible()) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    } catch (err) {
      // Ignore routine script evaluation errors during page transitions
    }
  }, 1000);
}

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false, 
    frame: false,
    icon: path.join(__dirname, '../app/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: !app.isPackaged,
    }
  });
//open dev tools if not packaged
  hiddenWorkerWindow = new BrowserWindow({
    show: false, 
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false,
    },
    frame: false,
  });

  disableDevTools(mainWindow);
  disableDevTools(hiddenWorkerWindow);
  openAppLinksExternally(mainWindow);

  if (app.isPackaged) {
    await appServe(mainWindow);
    mainWindow.loadURL("app://-");
  } else {
    mainWindow.loadURL("http://localhost:3000");
  }

  await hiddenWorkerWindow.loadURL("https://chatgpt.com/");

  // Start checking login state continuously
   startLoginCheckRoutine();

  // Trigger check for updates once window is up and app is packaged
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify().catch(err => {
      console.log("Failed to check for updates:", err);
    });
  }

  // Load existing records on startup
  const existingRecords = await getStoredNotes();
  existingRecords.forEach(rec => processedUrls.add(rec.id));

  // Intercept DALL-E images
  hiddenWorkerWindow.webContents.session.webRequest.onCompleted({ 
    urls: ['https://chatgpt.com/backend-api/estuary/content*'] 
  }, async (details) => {
    const imgUrl = details.url;
    const urlObj = new URL(imgUrl);
    const fileId = urlObj.searchParams.get('id') || imgUrl;
    
    if (processedUrls.has(fileId)) return;
    processedUrls.add(fileId);

    try {
      const base64 = await hiddenWorkerWindow.webContents.executeJavaScript(`
        fetch("${imgUrl}")
          .then(r => r.blob())
          .then(blob => new Promise(res => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result);
            reader.readAsDataURL(blob);
          }))
      `);

      if (base64) {
        const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
        const filePath = path.join(imagesDir, `note_${fileId}_${Date.now()}.png`);
        fs.writeFileSync(filePath, base64Data, 'base64');
        
        // Save record into SQLite via Keyv
        await saveRecordToDb({ id: fileId, filePath, timestamp: Date.now() });

        if (mainWindow) {
          mainWindow.webContents.send('new-image', toLocalImageUrl(filePath));
        }
      }
    } catch (err) {
      console.error("Failed to download image:", err);
    }
  });
};

// IPC Handler to load history from SQLite on startup
ipcMain.handle('get-stored-images', async () => {
  const records = await getStoredRecords();
  return records
    .filter(rec => fs.existsSync(rec.filePath))
    .map(rec => toLocalImageUrl(rec.filePath));
});

ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('window-close', () => mainWindow?.close());

ipcMain.handle('fill-chatgpt-input', async (event, userText) => {
  if (!hiddenWorkerWindow) return false;

  if (pendingChatUrl) {
    const chatUrl = pendingChatUrl;
    pendingChatUrl = null;
    await hiddenWorkerWindow.loadURL(chatUrl);
  }

  const currentUrl = hiddenWorkerWindow.webContents.getURL();
  const isExistingChat = currentUrl.match(/chatgpt\.com\/c\/[a-f0-9\-]+/i);
  let promptContent = "";

  if (!isExistingChat) {
    try {
      const promptPath = path.join(__dirname, '../prompt.md');
      if (fs.existsSync(promptPath)) {
        promptContent = fs.readFileSync(promptPath, 'utf-8');
      }
    } catch (error) {
      console.error("Failed to read prompt.md:", error);
    }
  }

  const script = `
    (async function() {
      const existingAssistantMessages = document.querySelectorAll('div[data-message-author-role="assistant"]');
      const isNewChat = existingAssistantMessages.length === 0;

      const promptText = ${JSON.stringify(promptContent)};
      const userText = ${JSON.stringify(userText)};

      async function insertAndSend(text) {
        const targets = document.querySelectorAll('#prompt-textarea');
        let success = false;
        
        targets.forEach(target => {
          if (target.tagName.toLowerCase() === 'textarea') {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
            nativeInputValueSetter.call(target, text);
            target.dispatchEvent(new Event('input', { bubbles: true }));
            success = true;
          } else if (target.tagName.toLowerCase() === 'div') {
            const lines = text.split('\\n');
            let htmlContent = '';
            lines.forEach(line => {
              if (line === '') htmlContent += '<p dir="auto"><br class="ProseMirror-trailingBreak"></p>';
              else htmlContent += '<p dir="auto">' + line + '</p>';
            });
            target.innerHTML = htmlContent;
            target.dispatchEvent(new Event('input', { bubbles: true }));
            success = true;
          }
        });

        if (success) {
          await new Promise(resolve => setTimeout(resolve, 150));
          const submitButton = document.getElementById('composer-submit-button');
          if (submitButton) submitButton.click();
        }
        return success;
      }

      async function waitForGenerationToFinish() {
        return new Promise(resolve => {
          const checkInterval = setInterval(() => {
            const progressBar = document.querySelector('[data-testid="image-gen-loading-progress"]');
            if (progressBar) {
              const currentVal = progressBar.textContent || progressBar.getAttribute('aria-valuenow');
              if (currentVal) {
                console.log("PROG:" + currentVal.trim());
              }
            }

            const submitBtn = document.getElementById('composer-submit-button');
            const voiceBtn = document.querySelector('[aria-label*="Start voice" i], [aria-label*="Start Voice" i]');
            
            let isDone = false;
            if (submitBtn) {
              const aria = (submitBtn.getAttribute('aria-label') || '').toLowerCase();
              if (aria.includes('start voice') || aria.includes('send prompt')) isDone = true;
            }
            if (voiceBtn) isDone = true;

            if (isDone) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 300); 
        });
      }

      if (isNewChat && promptText.trim() !== "") {
        await insertAndSend(promptText);
        await new Promise(resolve => setTimeout(resolve, 2000));
        await waitForGenerationToFinish();
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      await insertAndSend(userText);
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      await waitForGenerationToFinish();
      
      const assistantMessages = document.querySelectorAll('div[data-message-author-role="assistant"]');
      const lastMessageNode = assistantMessages[assistantMessages.length - 1];

      if (lastMessageNode) {
        const markdownContainer = lastMessageNode.querySelector('.markdown');
        return markdownContainer ? markdownContainer.textContent : lastMessageNode.textContent;
      }
      return null;
    })();
  `;

  const consoleListener = (event, level, message) => {
    if (message.startsWith("PROG:")) {
      const val = message.replace("PROG:", "").trim();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('image-progress-update', val);
      }
    }
  };
  hiddenWorkerWindow.webContents.on('console-message', consoleListener);

  try {
    const rawText = await hiddenWorkerWindow.webContents.executeJavaScript(script);
    hiddenWorkerWindow.webContents.removeListener('console-message', consoleListener);
    
    if (rawText) {
      console.log("[ELECTRON] Raw text received from ChatGPT:", rawText.substring(0, 150) + "...");
      
      try {
        const firstBrace = rawText.indexOf('{');
        if (firstBrace === -1) {
          throw new Error("No JSON brackets found in response");
        }
        
        const jsonStr = rawText.substring(firstBrace);
        const cleanText = jsonStr
          .replace(/<br\s*[\/]?>/gi, '\n')
          .replace(/<\/?[^>]+(>|$)/g, "")
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');
          
        const jsonData = completeNotePayload(JSON.parse(completeTruncatedJson(cleanText)));
        console.log("[ELECTRON] Successfully parsed JSON:", jsonData.topicName);

        return jsonData;
      } catch (parseErr) {
        console.error("[ELECTRON] JSON Parse Error:", parseErr.message);
        console.log("[ELECTRON] The text that failed to parse was:", rawText);
        return { error: "Failed to parse JSON", raw: rawText };
      }
    }
    return null;
  } catch (err) {
    hiddenWorkerWindow.webContents.removeListener('console-message', consoleListener);
    console.error("Failed to execute ChatGPT injection script:", err);
    return false;
  }
});

app.whenReady().then(() => {
  protocol.registerFileProtocol('local', (request, callback) => {
    const url = request.url.replace(/^local:\/\//, '');
    let decodedPath = decodeURI(url);
    if (process.platform === 'win32' && decodedPath.startsWith('/')) {
      decodedPath = decodedPath.slice(1);
    }
    callback({ path: decodedPath });
  });

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});