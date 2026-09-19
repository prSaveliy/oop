interface ElectronAPI {
  onWork1: (callback: () => void) => void;
  onWork2: (callback: () => void) => void;
}

declare interface Window {
  electronAPI: ElectronAPI;
}
