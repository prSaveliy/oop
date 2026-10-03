import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  onSelectMode: (callback: (mode: string) => void) => {
    ipcRenderer.on('menu:mode', (_event, mode: string) => callback(mode));
  },
  onClear: (callback: () => void) => {
    ipcRenderer.on('menu:clear', () => callback());
  },
  setWindowTitle: (title: string) => {
    ipcRenderer.send('window:set-title', title);
  },
});
