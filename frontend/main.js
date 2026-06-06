// main.js

const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow;
let fakeWindow;
let isHidden = false;
let isListening = true; // global listen state

function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow = new BrowserWindow({
        width: 620, height: 560, x: width - 680, y: 50,
        alwaysOnTop: true, transparent: true, frame: false,
        resizable: true, skipTaskbar: true, hasShadow: false,
        webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true }
    });
    mainWindow.loadFile('index.html');
    fakeWindow = new BrowserWindow({ width: 1, height: 1, x: 0, y: 0, show: false, transparent: true, frame: false, webPreferences: { nodeIntegration: false } });
    fakeWindow.loadURL('about:blank');
    // Shortcuts
    globalShortcut.register('CommandOrControl+Shift+H', toggleVisibility);
    globalShortcut.register('F12', toggleVisibility);
    globalShortcut.register('CommandOrControl+R', () => {
        isListening = true;
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('set-listening', true);
            mainWindow.webContents.send('start-listening');
        }
    });
    globalShortcut.register('CommandOrControl+P', () => {
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('pause-and-process');
    });
    globalShortcut.register('CommandOrControl+Shift+M', () => {
        isListening = !isListening;
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('set-listening', isListening);
    });
    // Removed OCR shortcuts - now using text input

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('set-visibility', !isHidden);
        mainWindow.webContents.send('set-listening', isListening);
    });
}

function toggleVisibility() {
    isHidden = !isHidden;
    if (isHidden) {
        if (mainWindow) mainWindow.setContentProtection(true);
        fakeWindow.show();
        fakeWindow.setAlwaysOnTop(true, 'screen-saver');
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('set-visibility', false);
    } else {
        if (mainWindow) mainWindow.setContentProtection(false);
        fakeWindow.hide();
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('set-visibility', true);
    }
}

app.whenReady().then(createWindow);

app.on('will-quit', () => { globalShortcut.unregisterAll(); });

// IPC
ipcMain.on('close-app', () => { app.quit(); });
ipcMain.on('set-listening-state', (_, state) => { isListening = state; });
ipcMain.handle('get-visibility', () => !isHidden);
ipcMain.handle('get-listening', () => isListening);
