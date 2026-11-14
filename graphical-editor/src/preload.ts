import { contextBridge, ipcRenderer } from 'electron';

interface TableRowPayload {
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

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
  notifyModeChanged: (mode: string) => {
    ipcRenderer.send('mode:changed', mode);
  },
  toggleTable: () => {
    ipcRenderer.send('table:toggle');
  },
  onTableStateChanged: (callback: (isOpen: boolean) => void) => {
    ipcRenderer.on('table:state-changed', (_event, isOpen: boolean) =>
      callback(isOpen),
    );
  },
  notifyShapeAdded: (row: TableRowPayload) => {
    ipcRenderer.send('shape:added', row);
  },
  notifyShapesReplaced: (
    rows: TableRowPayload[],
    selectedIndex: number | null,
  ) => {
    ipcRenderer.send('shapes:replaced', rows, selectedIndex);
  },
  onTableSyncRows: (
    callback: (rows: TableRowPayload[], selectedIndex: number | null) => void,
  ) => {
    ipcRenderer.on(
      'table:sync-rows',
      (_event, rows: TableRowPayload[], selectedIndex: number | null) =>
        callback(rows, selectedIndex),
    );
  },
  onTableAddRow: (callback: (row: TableRowPayload) => void) => {
    ipcRenderer.on('table:add-row', (_event, row: TableRowPayload) =>
      callback(row),
    );
  },
  selectTableRow: (index: number | null) => {
    ipcRenderer.send('table:select-row', index);
  },
  deleteTableRow: (index: number) => {
    ipcRenderer.send('table:delete-row', index);
  },
  closeTableWindow: () => {
    ipcRenderer.send('table:close');
  },
  requestTableSync: () => {
    ipcRenderer.send('table:request-sync');
  },
  onTableSelectRow: (callback: (index: number | null) => void) => {
    ipcRenderer.on('table:row-selected', (_event, index: number | null) =>
      callback(index),
    );
  },
  onTableDeleteRow: (callback: (index: number) => void) => {
    ipcRenderer.on('table:row-deleted', (_event, index: number) =>
      callback(index),
    );
  },
  onLoadShapes: (callback: (rows: TableRowPayload[]) => void) => {
    ipcRenderer.on('file:load-shapes', (_event, rows: TableRowPayload[]) =>
      callback(rows),
    );
  },
  onSaveShapesRequest: (callback: () => void) => {
    ipcRenderer.on('file:save-request', () => callback());
  },
  sendShapesForSave: (rows: TableRowPayload[]) => {
    ipcRenderer.send('file:save-data', rows);
  },
});
