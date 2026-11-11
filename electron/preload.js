const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('MS_ELECTRON', {
  quit: () => ipcRenderer.send('quit'),
  toggleFullscreen: () => ipcRenderer.send('fullscreen'),
});
