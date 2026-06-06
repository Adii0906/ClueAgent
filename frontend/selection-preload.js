// selection-preload.js - Preload for OCR selection overlay
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  captureSelection: (selectionArea) => ipcRenderer.send('capture-selection', selectionArea),
  cancelSelection: () => ipcRenderer.send('cancel-selection')
});
