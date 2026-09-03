"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUpdaterHandlers = registerUpdaterHandlers;
exports.checkForUpdatesIfPackaged = checkForUpdatesIfPackaged;
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
electron_updater_1.autoUpdater.autoDownload = true;
electron_updater_1.autoUpdater.autoInstallOnAppQuit = true;
function registerUpdaterHandlers(getMainWindow) {
    electron_1.ipcMain.handle('check-for-updates', async () => {
        if (!electron_1.app.isPackaged)
            return { status: 'dev-mode' };
        try {
            const res = await electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
            return { status: 'checking', info: res };
        }
        catch (err) {
            const error = err;
            return { error: error.message };
        }
    });
    electron_1.ipcMain.on('restart-to-update', () => {
        electron_updater_1.autoUpdater.quitAndInstall(false, true);
    });
    electron_updater_1.autoUpdater.on('update-available', (info) => {
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('updater-event', { type: 'update-available', info });
        }
    });
    electron_updater_1.autoUpdater.on('download-progress', (progressObj) => {
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('updater-event', { type: 'download-progress', progress: progressObj.percent });
        }
    });
    electron_updater_1.autoUpdater.on('update-downloaded', (info) => {
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('updater-event', { type: 'update-downloaded', info });
        }
    });
}
function checkForUpdatesIfPackaged() {
    if (electron_1.app.isPackaged) {
        electron_updater_1.autoUpdater.checkForUpdatesAndNotify().catch((err) => {
            console.log('Failed to check for updates:', err);
        });
    }
}
