import { app, ipcMain, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

export function registerUpdaterHandlers(getMainWindow: () => BrowserWindow | null): void {
  ipcMain.handle('check-for-updates', async () => {
    if (!app.isPackaged) return { status: 'dev-mode' };
    try {
      const res = await autoUpdater.checkForUpdatesAndNotify();
      return { status: 'checking', info: res };
    } catch (err) {
      const error = err as Error;
      return { error: error.message };
    }
  });

  ipcMain.on('restart-to-update', () => {
    autoUpdater.quitAndInstall(false, true);
  });

  autoUpdater.on('update-available', (info) => {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater-event', { type: 'update-available', info });
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater-event', { type: 'download-progress', progress: progressObj.percent });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater-event', { type: 'update-downloaded', info });
    }
  });
}

export function checkForUpdatesIfPackaged(): void {
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.log('Failed to check for updates:', err);
    });
  }
}
