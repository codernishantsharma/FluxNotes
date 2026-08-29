const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  startNewChat: () => ipcRenderer.invoke('start-new-chat'),
  setNoteChatSession: (chat) => ipcRenderer.invoke('set-note-chat-session', chat),
  fillChatGptInput: (text) => ipcRenderer.invoke('fill-chatgpt-input', text),
  getStoredImages: () => ipcRenderer.invoke('get-stored-images'),
  getAllNotes: () => ipcRenderer.invoke('get-all-notes'),
  getNoteById: (topicId) => ipcRenderer.invoke('get-note-by-id', topicId),
  saveNote: (note) => ipcRenderer.invoke('save-note', note),
  renameNote: (topicId, topicName) => ipcRenderer.invoke('rename-note', { topicId, topicName }),
  setNotePinned: (topicId, pinned) => ipcRenderer.invoke('set-note-pinned', { topicId, pinned }),
  deleteNote: (topicId) => ipcRenderer.invoke('delete-note', topicId),
  exportNote: (note) => ipcRenderer.invoke('export-note', note),
  onNewImage: (callback) => {
    ipcRenderer.removeAllListeners('new-image');
    ipcRenderer.on('new-image', (_event, value) => callback(value));
  },
  onProgressUpdate: (callback) => {
    ipcRenderer.removeAllListeners('image-progress-update');
    ipcRenderer.on('image-progress-update', (_event, val) => callback(val));
  },
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  restartAndInstall: () => ipcRenderer.send('restart-to-update'),
  onUpdaterEvent: (callback) => {
    ipcRenderer.removeAllListeners('updater-event');
    ipcRenderer.on('updater-event', (_event, data) => callback(data));
  }
});
