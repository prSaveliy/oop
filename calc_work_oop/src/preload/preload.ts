import { contextBridge, ipcRenderer } from 'electron';
import type {
  AppAction,
  ElectronAPI,
  OpenedFilePayload,
  SaveDataPayload,
  SavedFilePayload,
  SaveRequestPayload,
} from '../shared/table_types.ts';

const api: ElectronAPI = {
  onFileOpened: callback => {
    ipcRenderer.on('file:opened', (_event, payload: OpenedFilePayload) =>
      callback(payload),
    );
  },
  onNewTable: callback => {
    ipcRenderer.on('menu:new-table', () => callback());
  },
  onAddRow: callback => {
    ipcRenderer.on('menu:add-row', () => callback());
  },
  onDeleteRow: callback => {
    ipcRenderer.on('menu:delete-row', () => callback());
  },
  onAddColumn: callback => {
    ipcRenderer.on('menu:add-column', () => callback());
  },
  onRequestSave: callback => {
    ipcRenderer.on('file:request-save', (_event, payload: SaveRequestPayload) =>
      callback(payload),
    );
  },
  sendSaveData: (payload: SaveDataPayload) => {
    ipcRenderer.send('file:save-data', payload);
  },
  cancelSaveRequest: (requestId: number) => {
    ipcRenderer.send('file:save-canceled', requestId);
  },
  onFileSaved: callback => {
    ipcRenderer.on('file:saved', (_event, payload: SavedFilePayload) =>
      callback(payload),
    );
  },
  notifyDirtyChanged: (isDirty: boolean) => {
    ipcRenderer.send('table:dirty-changed', isDirty);
  },
  triggerAction: (action: AppAction) => {
    ipcRenderer.send('app:action', action);
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);
