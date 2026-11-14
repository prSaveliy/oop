interface TableRowPayload {
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface ElectronAPI {
  onSelectMode: (callback: (mode: string) => void) => void;
  onClear: (callback: () => void) => void;
  setWindowTitle: (title: string) => void;
  notifyModeChanged: (mode: string) => void;
  toggleTable: () => void;
  onTableStateChanged: (callback: (isOpen: boolean) => void) => void;
  notifyShapeAdded: (row: TableRowPayload) => void;
  notifyShapesReplaced: (
    rows: TableRowPayload[],
    selectedIndex: number | null,
  ) => void;
  onTableSyncRows: (
    callback: (rows: TableRowPayload[], selectedIndex: number | null) => void,
  ) => void;
  onTableAddRow: (callback: (row: TableRowPayload) => void) => void;
  selectTableRow: (index: number | null) => void;
  deleteTableRow: (index: number) => void;
  closeTableWindow: () => void;
  requestTableSync: () => void;
  onTableSelectRow: (callback: (index: number | null) => void) => void;
  onTableDeleteRow: (callback: (index: number) => void) => void;
  onLoadShapes: (callback: (rows: TableRowPayload[]) => void) => void;
  onSaveShapesRequest: (callback: () => void) => void;
  sendShapesForSave: (rows: TableRowPayload[]) => void;
}

declare interface Window {
  electronAPI: ElectronAPI;
}
