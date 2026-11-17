/** Sort direction for table columns. */
export type SortDirection = 'none' | 'asc' | 'desc';

/** Tracks the active sort column (0 = row numbers, 1..N = data columns, -1 = unsorted). */
export interface SortState {
  columnIndex: number;
  direction: SortDirection;
}

/** Plain serializable representation of a table (column headers and data rows). */
export interface TableData {
  headers: string[];
  rows: string[][];
}

/** In-memory row record preserving its original 1-based row number across sorts. */
export interface TableRowRecord {
  rowNumber: number;
  cells: string[];
}

/** Summary statistics emitted by TableViewClass for status bar and host updates. */
export interface TableStats {
  rowCount: number;
  columnCount: number;
  sortState: SortState;
  selectedRowNumber: number | null;
  isDirty: boolean;
}

/** Supported character encodings when reading TSV files. */
export type FileEncoding = 'utf-8' | 'windows-1251';

/** Result of decoding raw file bytes into text. */
export interface DecodeResult {
  text: string;
  encoding: FileEncoding;
}

/** Payload sent from Main to Renderer when a TSV file is opened. */
export interface OpenedFilePayload {
  filePath: string;
  data: TableData;
  encoding: FileEncoding;
}

/** Payload sent from Main to Renderer requesting current table data for saving. */
export interface SaveRequestPayload {
  requestId: number;
  saveAs: boolean;
}

/** Payload sent from Renderer to Main containing table data to persist on disk. */
export interface SaveDataPayload {
  requestId: number;
  data: TableData;
  saveAs: boolean;
}

/** Payload sent from Main to Renderer after a successful save. */
export interface SavedFilePayload {
  filePath: string;
}

/** High-level file actions triggered from the Renderer toolbar. */
export type AppAction = 'new' | 'open' | 'save' | 'save-as';

/** Typed bridge exposed to the Renderer via Electron's contextBridge. */
export interface ElectronAPI {
  onFileOpened: (callback: (payload: OpenedFilePayload) => void) => void;
  onNewTable: (callback: () => void) => void;
  onAddRow: (callback: () => void) => void;
  onDeleteRow: (callback: () => void) => void;
  onAddColumn: (callback: () => void) => void;
  onRequestSave: (callback: (payload: SaveRequestPayload) => void) => void;
  sendSaveData: (payload: SaveDataPayload) => void;
  cancelSaveRequest: (requestId: number) => void;
  onFileSaved: (callback: (payload: SavedFilePayload) => void) => void;
  notifyDirtyChanged: (isDirty: boolean) => void;
  triggerAction: (action: AppAction) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
