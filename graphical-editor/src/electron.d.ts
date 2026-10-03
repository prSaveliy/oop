interface ElectronAPI {
  onSelectMode: (callback: (mode: string) => void) => void;
  onClear: (callback: () => void) => void;
  setWindowTitle: (title: string) => void;
}

declare interface Window {
  electronAPI: ElectronAPI;
}
