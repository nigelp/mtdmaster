import { contextBridge, ipcRenderer } from 'electron';

// Expose generic ipcRenderer to allow flexible usage in frontend
contextBridge.exposeInMainWorld('ipcRenderer', {
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  on: (channel: string, func: (...args: any[]) => void) => {
    const subscription = (_event: any, ...args: any[]) => func(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
  send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
  removeListener: (channel: string, func: (...args: any[]) => void) =>
    ipcRenderer.removeListener(channel, func),
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
});