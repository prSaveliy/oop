import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type {
  AppAction,
  SaveDataPayload,
  TableData,
} from '../shared/table_types.ts';
import { TsvCodec } from '../shared/tsv_codec.ts';

const DIST_DIR = import.meta.dirname;
const ROOT_DIR = path.resolve(DIST_DIR, '..');
const PRELOAD_PATH = path.join(DIST_DIR, 'preload.js');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');

const codec = new TsvCodec();

let mainWindow: BrowserWindow | null = null;
let activeFilePath: string | null = null;
let cachedDirty = false;
let allowImmediateClose = false;
let isCloseGuardActive = false;

let nextSaveRequestId = 1;
const pendingSaveResolvers = new Map<number, (saved: boolean) => void>();

const updateWindowTitle = (): void => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }
  const dirtyPrefix = cachedDirty ? '* ' : '';
  const fileSuffix = activeFilePath ? ` - ${activeFilePath}` : '';
  mainWindow.setTitle(`${dirtyPrefix}Таблиця${fileSuffix}`);
};

const isValidTableData = (value: unknown): value is TableData => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if (!Array.isArray(candidate.headers) || !Array.isArray(candidate.rows)) {
    return false;
  }
  if (!candidate.headers.every(item => typeof item === 'string')) {
    return false;
  }
  return candidate.rows.every(
    row => Array.isArray(row) && row.every(cell => typeof cell === 'string'),
  );
};

const writeTableToFile = async (
  data: TableData,
  saveAs: boolean,
): Promise<boolean> => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return false;
  }

  let targetPath = saveAs ? null : activeFilePath;
  if (!targetPath) {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Записати таблицю у файл',
      defaultPath: activeFilePath ?? path.join(ROOT_DIR, 'table.txt'),
      filters: [
        { name: 'Текстові файли (TSV)', extensions: ['txt', 'tsv'] },
        { name: 'Усі файли', extensions: ['*'] },
      ],
    });
    if (result.canceled || !result.filePath) {
      return false;
    }
    targetPath = result.filePath;
  }

  try {
    const serialized = codec.serialize(data);
    await fs.promises.writeFile(targetPath, serialized, 'utf-8');
    activeFilePath = targetPath;
    cachedDirty = false;
    updateWindowTitle();
    mainWindow.webContents.send('file:saved', { filePath: targetPath });
    return true;
  } catch (error) {
    await dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Помилка запису файлу',
      message: 'Не вдалося записати таблицю у файл.',
      detail: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};

const requestSaveFromRenderer = (saveAs: boolean): Promise<boolean> => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return Promise.resolve(false);
  }

  const requestId = nextSaveRequestId;
  nextSaveRequestId += 1;

  return new Promise(resolve => {
    pendingSaveResolvers.set(requestId, resolve);
    mainWindow?.webContents.send('file:request-save', { requestId, saveAs });
  });
};

const confirmDiscardOrSave = async (): Promise<boolean> => {
  if (!cachedDirty || !mainWindow || mainWindow.isDestroyed()) {
    return true;
  }

  const response = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    title: 'Незбережені зміни',
    message: 'У таблиці є незбережені зміни. Зберегти перед продовженням?',
    buttons: ['Зберегти', 'Не зберігати', 'Скасувати'],
    defaultId: 0,
    cancelId: 2,
  });

  if (response.response === 2) {
    return false;
  }
  if (response.response === 1) {
    return true;
  }
  return await requestSaveFromRenderer(false);
};

const handleNewTable = async (): Promise<void> => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }
  const canProceed = await confirmDiscardOrSave();
  if (!canProceed) {
    return;
  }
  activeFilePath = null;
  cachedDirty = false;
  updateWindowTitle();
  mainWindow.webContents.send('menu:new-table');
};

const handleOpenFile = async (): Promise<void> => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  const canProceed = await confirmDiscardOrSave();
  if (!canProceed) {
    return;
  }

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Відкрити файл таблиці',
    defaultPath: activeFilePath ? path.dirname(activeFilePath) : ROOT_DIR,
    filters: [
      { name: 'Текстові файли (TSV)', extensions: ['txt', 'tsv'] },
      { name: 'Усі файли', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return;
  }

  const filePath = result.filePaths[0];
  if (!filePath) {
    return;
  }

  try {
    const bytes = await fs.promises.readFile(filePath);
    const decoded = codec.decodeBuffer(bytes);
    const data = codec.parse(decoded.text);

    activeFilePath = filePath;
    cachedDirty = false;
    updateWindowTitle();
    mainWindow.webContents.send('file:opened', {
      filePath,
      data,
      encoding: decoded.encoding,
    });
  } catch (error) {
    await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Помилка відкриття файлу',
      message: 'Не вдалося прочитати або розпізнати таблицю у вибраному файлі.',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
};

const createMenu = (): void => {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Файл',
      submenu: [
        {
          label: 'Нова таблиця',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            void handleNewTable();
          },
        },
        {
          label: 'Відкрити...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            void handleOpenFile();
          },
        },
        {
          label: 'Записати',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            void requestSaveFromRenderer(false);
          },
        },
        {
          label: 'Записати як...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            void requestSaveFromRenderer(true);
          },
        },
        { type: 'separator' },
        {
          label: 'Вихід',
          accelerator: 'CmdOrCtrl+Q',
          role: 'quit',
        },
      ],
    },
    {
      label: 'Таблиця',
      submenu: [
        {
          label: 'Додати рядок',
          accelerator: 'CmdOrCtrl+Enter',
          click: () => {
            mainWindow?.webContents.send('menu:add-row');
          },
        },
        {
          label: 'Видалити вибраний рядок',
          accelerator: 'CmdOrCtrl+Backspace',
          click: () => {
            mainWindow?.webContents.send('menu:delete-row');
          },
        },
        {
          label: 'Додати стовпчик',
          click: () => {
            mainWindow?.webContents.send('menu:add-column');
          },
        },
      ],
    },
    {
      label: 'Довідка',
      submenu: [
        {
          label: 'Про програму',
          click: () => {
            if (!mainWindow || mainWindow.isDestroyed()) {
              return;
            }
            void dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Про програму',
              message: 'Програма показу та редагування таблиць',
              detail:
                'Розрахунково-графічна робота з дисципліни «Об’єктно-орієнтоване програмування»\n' +
                'Завдання 3: Перегляд, сортування та редагування таблиць (Delimited ASCII / TSV)\n' +
                'Студент: Присяжний С. О., група ІМ-55\n' +
                'Викладач: Порєв В. М.\n\n' +
                'Керування:\n' +
                '• Правий клік (ПКМ) по заголовку стовпчика — 3-становище сортування (▲ → ▼ → без сортування)\n' +
                '• ПКМ по крайньому лівому заголовку — числове сортування за номерами рядків\n' +
                '• Подвійний клік по комірці або заголовку — редагування значення',
            });
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 700,
    minWidth: 520,
    minHeight: 340,
    title: 'Таблиця',
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('close', event => {
    if (allowImmediateClose || !cachedDirty) {
      return;
    }

    event.preventDefault();
    if (isCloseGuardActive) {
      return;
    }

    isCloseGuardActive = true;
    void confirmDiscardOrSave()
      .then(canClose => {
        if (canClose && mainWindow && !mainWindow.isDestroyed()) {
          allowImmediateClose = true;
          mainWindow.close();
        }
      })
      .finally(() => {
        isCloseGuardActive = false;
      });
  });

  mainWindow.on('closed', () => {
    for (const resolve of pendingSaveResolvers.values()) {
      resolve(false);
    }
    pendingSaveResolvers.clear();
    if (process.platform === 'darwin') {
      allowImmediateClose = false;
      isCloseGuardActive = false;
      activeFilePath = null;
      cachedDirty = false;
    }
    mainWindow = null;
  });

  void mainWindow.loadFile(INDEX_HTML_PATH);
  createMenu();
  updateWindowTitle();
};

ipcMain.on('file:save-data', (_event, payload: unknown) => {
  if (typeof payload !== 'object' || payload === null) {
    return;
  }
  const candidate = payload as Partial<SaveDataPayload>;
  if (
    typeof candidate.requestId !== 'number' ||
    !isValidTableData(candidate.data)
  ) {
    return;
  }

  const requestId = candidate.requestId;
  const saveAs = Boolean(candidate.saveAs);
  void writeTableToFile(candidate.data, saveAs).then(saved => {
    const resolve = pendingSaveResolvers.get(requestId);
    if (resolve) {
      pendingSaveResolvers.delete(requestId);
      resolve(saved);
    }
  });
});

ipcMain.on('file:save-canceled', (_event, requestId: unknown) => {
  if (typeof requestId !== 'number') {
    return;
  }
  const resolve = pendingSaveResolvers.get(requestId);
  if (resolve) {
    pendingSaveResolvers.delete(requestId);
    resolve(false);
  }
});

ipcMain.on('table:dirty-changed', (_event, isDirty: unknown) => {
  if (typeof isDirty !== 'boolean') {
    return;
  }
  cachedDirty = isDirty;
  updateWindowTitle();
});

ipcMain.on('app:action', (_event, action: unknown) => {
  const validAction = action as AppAction;
  switch (validAction) {
    case 'new':
      void handleNewTable();
      break;
    case 'open':
      void handleOpenFile();
      break;
    case 'save':
      void requestSaveFromRenderer(false);
      break;
    case 'save-as':
      void requestSaveFromRenderer(true);
      break;
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
