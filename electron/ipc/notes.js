"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerNotesIpcHandlers = registerNotesIpcHandlers;
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const storage_1 = require("../utils/storage");
const helpers_1 = require("../utils/helpers");
const windows_1 = require("../windows");
function registerNotesIpcHandlers(getMainWindow, getWorkerWindow, getSelectedProvider, sessionState) {
    electron_1.ipcMain.handle('get-all-notes', async () => {
        return await (0, storage_1.getStoredNotes)();
    });
    electron_1.ipcMain.handle('get-note-by-id', async (_, topicId) => {
        const notes = await (0, storage_1.getStoredNotes)();
        return notes.find((n) => n.topicId === topicId) || null;
    });
    electron_1.ipcMain.handle('get-stored-images', async () => {
        const records = await (0, storage_1.getStoredRecords)();
        return records
            .filter((rec) => fs_1.default.existsSync(rec.filePath))
            .map((rec) => (0, helpers_1.toLocalImageUrl)(rec.filePath));
    });
    electron_1.ipcMain.handle('start-new-chat', async () => {
        sessionState.pendingChatUrl = null;
        sessionState.activeChatSessionId = sessionState.createChatSessionId();
        sessionState.activeChatSession = { conversationId: null, parentMessageId: null };
        sessionState.isGeminiSessionInitialized = false;
        const workerWindow = getWorkerWindow();
        if (workerWindow && !workerWindow.isDestroyed()) {
            const provider = await getSelectedProvider();
            await workerWindow.loadURL(provider === 'gemini' ? windows_1.GEMINI_SIGN_IN_URL : windows_1.CHATGPT_URL);
        }
        return { sessionId: sessionState.activeChatSessionId };
    });
    electron_1.ipcMain.handle('set-note-chat-session', (_, { chatUrl, sessionId, session }) => {
        sessionState.pendingChatUrl = typeof chatUrl === 'string' && chatUrl.includes('chatgpt.com') ? chatUrl : null;
        sessionState.activeChatSessionId = typeof sessionId === 'string' && sessionId ? sessionId : sessionState.createChatSessionId();
        sessionState.activeChatSession = session && typeof session === 'object'
            ? {
                conversationId: typeof session.conversationId === 'string' ? session.conversationId : null,
                parentMessageId: typeof session.parentMessageId === 'string' ? session.parentMessageId : null,
            }
            : {
                conversationId: sessionState.pendingChatUrl ? sessionState.pendingChatUrl.match(/\/c\/([^/?#]+)/)?.[1] || null : null,
                parentMessageId: null,
            };
        sessionState.isGeminiSessionInitialized = true;
        return true;
    });
    electron_1.ipcMain.handle('save-note', async (_, noteData) => {
        const workerWindow = getWorkerWindow();
        const notes = await (0, storage_1.getStoredNotes)();
        const chatUrl = noteData.chatUrl || (workerWindow ? workerWindow.webContents.getURL() : '');
        const savedImages = Array.isArray(noteData.images)
            ? noteData.images
                .map((imagePath) => typeof imagePath === 'string' ? (0, helpers_1.fromLocalImageUrl)(imagePath) : '')
                .filter((imagePath) => imagePath.startsWith(storage_1.imagesDir) && fs_1.default.existsSync(imagePath))
                .map(helpers_1.toLocalImageUrl)
            : [];
        const fullNoteRecord = {
            ...noteData,
            images: savedImages,
            chatUrl,
            chatSessionId: noteData.chatSessionId || sessionState.activeChatSessionId || null,
            chatSession: noteData.chatSession || sessionState.activeChatSession || null,
            timestamp: Date.now(),
        };
        const existingIndex = notes.findIndex((n) => n.topicId === noteData.topicId);
        if (existingIndex >= 0) {
            notes[existingIndex] = { ...notes[existingIndex], ...fullNoteRecord };
        }
        else {
            notes.push(fullNoteRecord);
        }
        await (0, storage_1.saveNotesCollection)(notes);
        return true;
    });
    electron_1.ipcMain.handle('rename-note', async (_, { topicId, topicName }) => {
        const name = typeof topicName === 'string' ? topicName.trim() : '';
        if (!name)
            return { success: false, error: 'A note name is required.' };
        const notes = await (0, storage_1.getStoredNotes)();
        const index = notes.findIndex((note) => note.topicId === topicId);
        if (index === -1)
            return { success: false, error: 'Note not found.' };
        notes[index] = { ...notes[index], topicName: name };
        await (0, storage_1.saveNotesCollection)(notes);
        return { success: true };
    });
    electron_1.ipcMain.handle('set-note-pinned', async (_, { topicId, pinned }) => {
        const notes = await (0, storage_1.getStoredNotes)();
        const index = notes.findIndex((note) => note.topicId === topicId);
        if (index === -1)
            return { success: false, error: 'Note not found.' };
        notes[index] = { ...notes[index], pinned: Boolean(pinned) };
        await (0, storage_1.saveNotesCollection)(notes);
        return { success: true };
    });
    electron_1.ipcMain.handle('delete-note', async (_, topicId) => {
        const notes = await (0, storage_1.getStoredNotes)();
        const noteToDelete = notes.find((note) => note.topicId === topicId);
        if (!noteToDelete)
            return { success: false, error: 'Note not found.' };
        const remainingNotes = notes.filter((note) => note.topicId !== topicId);
        const remainingImagePaths = new Set(remainingNotes.flatMap((note) => (Array.isArray(note.images) ? note.images.map(helpers_1.fromLocalImageUrl) : [])));
        const removableImagePaths = (noteToDelete.images || [])
            .map(helpers_1.fromLocalImageUrl)
            .filter((imagePath) => imagePath.startsWith(storage_1.imagesDir) && !remainingImagePaths.has(imagePath));
        await Promise.all(removableImagePaths.map(async (imagePath) => {
            try {
                await fs_1.default.promises.unlink(imagePath);
            }
            catch (error) {
                const err = error;
                if (err.code !== 'ENOENT')
                    throw error;
            }
        }));
        await (0, storage_1.saveNotesCollection)(remainingNotes);
        const removedPaths = new Set(removableImagePaths);
        const records = await (0, storage_1.getStoredRecords)();
        await (0, storage_1.saveImageRecords)(records.filter((record) => !removedPaths.has(record.filePath)));
        return { success: true };
    });
    electron_1.ipcMain.handle('export-note', async (_, { images, topicName, format }) => {
        const mainWindow = getMainWindow();
        const imagePaths = Array.isArray(images)
            ? images.map((imagePath) => typeof imagePath === 'string' ? (0, helpers_1.fromLocalImageUrl)(imagePath) : '')
                .filter((imagePath) => fs_1.default.existsSync(imagePath))
            : [];
        if (imagePaths.length === 0) {
            return { success: false, error: 'There are no generated pages to export.' };
        }
        const fileName = (0, helpers_1.safeFileName)(topicName);
        if (format === 'pdf') {
            if (!mainWindow)
                return { success: false, error: 'Main window unavailable.' };
            const { canceled, filePath } = await electron_1.dialog.showSaveDialog(mainWindow, {
                title: 'Export notes as PDF',
                defaultPath: `${fileName}.pdf`,
                filters: [{ name: 'PDF document', extensions: ['pdf'] }],
            });
            if (canceled || !filePath)
                return { success: false, canceled: true };
            const printWindow = new electron_1.BrowserWindow({ show: false, webPreferences: { sandbox: true, devTools: false } });
            try {
                const pagesHtml = imagePaths.map((imagePath, index) => (`<section class="page"><img src="${(0, helpers_1.toLocalImageUrl)(imagePath)}" alt="Page ${index + 1}" /></section>`)).join('');
                const html = `<!doctype html><html><head><meta charset="utf-8" />
          <title>${(0, helpers_1.escapeHtml)(topicName || 'Notes')}</title>
          <style>
            @page { size: A4; margin: 0; }
            html, body { margin: 0; padding: 0; background: white; }
            .page { width: 210mm; height: 297mm; break-after: page; overflow: hidden; display: flex; align-items: center; justify-content: center; }
            .page:last-child { break-after: auto; }
            img { display: block; width: 100%; height: 100%; object-fit: contain; }
          </style>
          </head><body>${pagesHtml}</body></html>`;
                await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
                const pdf = await printWindow.webContents.printToPDF({ printBackground: true, preferCSSPageSize: true });
                await fs_1.default.promises.writeFile(filePath, pdf);
                return { success: true, path: filePath, count: imagePaths.length };
            }
            finally {
                if (!printWindow.isDestroyed())
                    printWindow.destroy();
            }
        }
        if (format === 'png' || format === 'jpeg') {
            if (!mainWindow)
                return { success: false, error: 'Main window unavailable.' };
            const { canceled, filePaths } = await electron_1.dialog.showOpenDialog(mainWindow, {
                title: `Export notes as ${format.toUpperCase()} images`,
                properties: ['openDirectory', 'createDirectory'],
            });
            const outputDirectory = filePaths[0];
            if (canceled || !outputDirectory)
                return { success: false, canceled: true };
            await Promise.all(imagePaths.map(async (imagePath, index) => {
                const pageNumber = String(index + 1).padStart(2, '0');
                const outputPath = path_1.default.join(outputDirectory, `${fileName}-page-${pageNumber}.${format === 'jpeg' ? 'jpg' : 'png'}`);
                if (format === 'png') {
                    await fs_1.default.promises.copyFile(imagePath, outputPath);
                }
                else {
                    const jpegData = electron_1.nativeImage.createFromPath(imagePath).toJPEG(95);
                    await fs_1.default.promises.writeFile(outputPath, jpegData);
                }
            }));
            return { success: true, path: outputDirectory, count: imagePaths.length };
        }
        return { success: false, error: 'Unsupported export format.' };
    });
    electron_1.ipcMain.handle('save-raw-result', async (_, { sessionId, rawContent, conversationId }) => {
        try {
            const safeId = (sessionId || 'default').replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
            const resultFilePath = path_1.default.join(storage_1.resultsDir, `result-${safeId}.json`);
            const fileData = {
                sessionId,
                conversationId: conversationId || null,
                timestamp: Date.now(),
                rawResponse: rawContent,
            };
            await fs_1.default.promises.writeFile(resultFilePath, JSON.stringify(fileData, null, 2), 'utf-8');
            console.log('[ELECTRON] Raw result saved to:', resultFilePath);
            return { success: true };
        }
        catch (err) {
            const error = err;
            console.error('Failed to save raw result file:', error);
            return { success: false, error: error.message };
        }
    });
}
