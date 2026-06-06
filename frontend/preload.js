// preload.js
const { contextBridge, ipcRenderer, clipboard } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  closeApp: () => ipcRenderer.send('close-app'),
  setVisibility: (callback) => ipcRenderer.on('set-visibility', (_e, v) => callback(v)),
  getVisibility: () => ipcRenderer.invoke('get-visibility'),
  onListeningChange: (callback) => ipcRenderer.on('set-listening', (_e, v) => callback(v)),
  getListening: () => ipcRenderer.invoke('get-listening'),
  setListeningState: (state) => ipcRenderer.send('set-listening-state', state),
  // ✅ Handle keyboard shortcuts
  onStartListening: (callback) => ipcRenderer.on('start-listening', callback),
  onPauseAndProcess: (callback) => ipcRenderer.on('pause-and-process', callback),
  // ✅ FIXED: Better clipboard access with error handling
  getClipboardText: () => {
    try {
      const text = clipboard.readText();
      console.log('Clipboard text read successfully:', text ? text.length + ' chars' : 'empty');
      return text;
    } catch (error) {
      console.error('Clipboard read error in preload:', error);
      throw new Error('Cannot read clipboard: ' + error.message);
    }
  },
  setClipboardText: (text) => {
    try {
      clipboard.writeText(text);
      console.log('Clipboard text written successfully');
    } catch (error) {
      console.error('Clipboard write error in preload:', error);
      throw new Error('Cannot write clipboard: ' + error.message);
    }
  }
});
