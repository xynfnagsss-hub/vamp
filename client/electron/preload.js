const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vamp', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
});
