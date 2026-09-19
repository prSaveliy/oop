import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  onWork1: (callback: () => void) => {
    ipcRenderer.on('menu:work1', () => callback());
  },
  onWork2: (callback: () => void) => {
    ipcRenderer.on('menu:work2', () => callback());
  },
});
