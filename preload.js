const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electron', {
  version: process.version,
  platform: process.platform,
  
  // IPC methods for door control
  doorUnlock: () => ipcRenderer.send('door-unlock'),
  doorLock: () => ipcRenderer.send('door-lock'),
  
  // Listen for door state changes
  onDoorStateChanged: (callback) => ipcRenderer.on('door-state-changed', (event, data) => callback(data)),
  
  // Listen for global key events
  onGlobalKey: (callback) => ipcRenderer.on('global-key', (event, key) => callback(key))
});
