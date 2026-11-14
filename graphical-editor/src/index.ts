import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

interface ShapeRow {
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const SRC_DIR = import.meta.dirname;
const ROOT_DIR = path.resolve(SRC_DIR, '..');
const PRELOAD_PATH = path.join(ROOT_DIR, 'dist', 'preload.js');
const MAIN_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const TABLE_HTML_PATH = path.join(ROOT_DIR, 'table.html');
const DEFAULT_SHAPES_FILE = path.join(ROOT_DIR, 'shapes.txt');

let mainWindow: BrowserWindow | null = null;
let tableWindow: BrowserWindow | null = null;
let cachedRows: ShapeRow[] = [];
let cachedSelectedIndex: number | null = null;
let fileWriteQueue: Promise<void> = Promise.resolve();

const enqueueFileWrite = (operation: () => Promise<void>): void => {
  fileWriteQueue = fileWriteQueue.then(operation).catch(error => {
    console.error('Помилка запису файлу фігур:', error);
  });
};

const isValidRow = (value: unknown): value is ShapeRow => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0 &&
    typeof candidate.x1 === 'number' &&
    Number.isFinite(candidate.x1) &&
    typeof candidate.y1 === 'number' &&
    Number.isFinite(candidate.y1) &&
    typeof candidate.x2 === 'number' &&
    Number.isFinite(candidate.x2) &&
    typeof candidate.y2 === 'number' &&
    Number.isFinite(candidate.y2)
  );
};

const normalizeRow = (row: ShapeRow): ShapeRow => ({
  name: row.name.trim(),
  x1: Math.round(row.x1),
  y1: Math.round(row.y1),
  x2: Math.round(row.x2),
  y2: Math.round(row.y2),
});

const formatRowTsv = (row: ShapeRow): string => {
  const n = normalizeRow(row);
  return `${n.name}\t${n.x1}\t${n.y1}\t${n.x2}\t${n.y2}`;
};

const serializeRowsTsv = (rows: ShapeRow[]): string =>
  rows.length === 0 ? '' : `${rows.map(formatRowTsv).join('\n')}\n`;

const parseTsvRows = (content: string): ShapeRow[] => {
  const rows: ShapeRow[] = [];
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (trimmed.length === 0) {
      continue;
    }

    const parts = rawLine.split('\t').map(part => part.trim());
    if (parts.length !== 5) {
      continue;
    }

    const name = parts[0] ?? '';
    const x1 = Number(parts[1]);
    const y1 = Number(parts[2]);
    const x2 = Number(parts[3]);
    const y2 = Number(parts[4]);

    if (
      name.length > 0 &&
      Number.isFinite(x1) &&
      Number.isFinite(y1) &&
      Number.isFinite(x2) &&
      Number.isFinite(y2)
    ) {
      rows.push({
        name,
        x1: Math.round(x1),
        y1: Math.round(y1),
        x2: Math.round(x2),
        y2: Math.round(y2),
      });
    }
  }

  return rows;
};

const syncTableWindowRows = (): void => {
  if (tableWindow && !tableWindow.isDestroyed()) {
    tableWindow.webContents.send(
      'table:sync-rows',
      cachedRows,
      cachedSelectedIndex,
    );
  }
};

const updateTableState = (isOpen: boolean): void => {
  const menuItem = Menu.getApplicationMenu()?.getMenuItemById('window-table');
  if (menuItem) {
    menuItem.checked = isOpen;
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('table:state-changed', isOpen);
  }
};

const openTableWindow = (): void => {
  if (tableWindow && !tableWindow.isDestroyed()) {
    tableWindow.focus();
    updateTableState(true);
    return;
  }

  let windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 560,
    height: 440,
    minWidth: 420,
    minHeight: 280,
    title: "Таблиця об'єктів",
    modal: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
    },
  };

  if (mainWindow && !mainWindow.isDestroyed()) {
    const mainBounds = mainWindow.getBounds();
    windowOptions = {
      ...windowOptions,
      parent: mainWindow,
      x: mainBounds.x + Math.max(40, mainBounds.width - 580),
      y: mainBounds.y + 60,
    };
  }

  tableWindow = new BrowserWindow(windowOptions);
  tableWindow.setMenuBarVisibility(false);

  tableWindow.webContents.on('did-finish-load', () => {
    syncTableWindowRows();
  });

  tableWindow.on('closed', () => {
    tableWindow = null;
    updateTableState(false);
  });

  tableWindow.loadFile(TABLE_HTML_PATH);
  updateTableState(true);
};

const closeTableWindow = (): void => {
  if (tableWindow && !tableWindow.isDestroyed()) {
    tableWindow.close();
  }
};

const toggleTableWindow = (): void => {
  if (tableWindow && !tableWindow.isDestroyed()) {
    closeTableWindow();
  } else {
    openTableWindow();
  }
};

const handleOpenFile = async (): Promise<void> => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Відкрити файл фігур',
    defaultPath: fs.existsSync(DEFAULT_SHAPES_FILE)
      ? DEFAULT_SHAPES_FILE
      : ROOT_DIR,
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
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const rows = parseTsvRows(content);
    if (rows.length === 0) {
      await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Відкриття файлу',
        message: 'Не вдалося знайти коректних записів фігур у файлі.',
        detail:
          'Очікується формат TSV: Назва<TAB>x1<TAB>y1<TAB>x2<TAB>y2 у кожному рядку.',
      });
      return;
    }
    mainWindow.webContents.send('file:load-shapes', rows);
  } catch (error) {
    await dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Помилка відкриття файлу',
      message: 'Не вдалося прочитати вибраний файл.',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
};

const handleSaveRowsToFile = async (rows: ShapeRow[]): Promise<void> => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Зберегти фігури у файл',
    defaultPath: DEFAULT_SHAPES_FILE,
    filters: [
      { name: 'Текстові файли (TSV)', extensions: ['txt', 'tsv'] },
      { name: 'Усі файли', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return;
  }

  try {
    await fs.promises.writeFile(
      result.filePath,
      serializeRowsTsv(rows),
      'utf-8',
    );
  } catch (error) {
    await dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Помилка збереження файлу',
      message: 'Не вдалося записати файл.',
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
          label: 'Відкрити файл...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            void handleOpenFile();
          },
        },
        {
          label: 'Зберегти як...',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('file:save-request');
          },
        },
        { type: 'separator' },
        {
          label: 'Очистити полотно',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu:clear');
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
      label: "Об'єкти",
      submenu: [
        {
          id: 'mode-point',
          type: 'radio',
          checked: true,
          label: 'Крапка',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow?.webContents.send('menu:mode', 'point');
          },
        },
        {
          id: 'mode-line',
          type: 'radio',
          checked: false,
          label: 'Лінія',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            mainWindow?.webContents.send('menu:mode', 'line');
          },
        },
        {
          id: 'mode-rect',
          type: 'radio',
          checked: false,
          label: 'Прямокутник',
          accelerator: 'CmdOrCtrl+3',
          click: () => {
            mainWindow?.webContents.send('menu:mode', 'rect');
          },
        },
        {
          id: 'mode-ellipse',
          type: 'radio',
          checked: false,
          label: 'Еліпс',
          accelerator: 'CmdOrCtrl+4',
          click: () => {
            mainWindow?.webContents.send('menu:mode', 'ellipse');
          },
        },
        {
          id: 'mode-lineOO',
          type: 'radio',
          checked: false,
          label: 'Лінія з кружечками',
          accelerator: 'CmdOrCtrl+5',
          click: () => {
            mainWindow?.webContents.send('menu:mode', 'lineOO');
          },
        },
        {
          id: 'mode-cube',
          type: 'radio',
          checked: false,
          label: 'Каркас куба',
          accelerator: 'CmdOrCtrl+6',
          click: () => {
            mainWindow?.webContents.send('menu:mode', 'cube');
          },
        },
      ],
    },
    {
      label: 'Вікно',
      submenu: [
        {
          id: 'window-table',
          label: "Таблиця об'єктів",
          type: 'checkbox',
          checked: tableWindow !== null && !tableWindow.isDestroyed(),
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            toggleTableWindow();
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
              message: "Графічний редактор об'єктів",
              detail:
                'Лабораторна робота №5 (Варіант Ж = 25)\n' +
                'Студент: Присяжний С. О., група ІМ-55\n' +
                'Викладач: Рекечинський Д. О.\n\n' +
                'Реалізовано:\n' +
                '• Синглтон Меєрса (MyEditor)\n' +
                "• Немодальне вікно таблиці об'єктів (MyTable)\n" +
                '• Запис і завантаження TSV-файлу (shapes.txt)\n' +
                '• Підсвічування, видалення та поліморфне відновлення фігур',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    title: 'Графічний редактор — Лабораторна робота №5',
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('closed', () => {
    closeTableWindow();
    tableWindow = null;
    mainWindow = null;
  });

  mainWindow.loadFile(MAIN_HTML_PATH);
  createMenu();
};

ipcMain.on('window:set-title', (_event, title: string) => {
  if (mainWindow && !mainWindow.isDestroyed() && title) {
    mainWindow.setTitle(title);
  }
});

ipcMain.on('mode:changed', (_event, mode: string) => {
  const item = Menu.getApplicationMenu()?.getMenuItemById(`mode-${mode}`);
  if (item) {
    item.checked = true;
  }
});

ipcMain.on('table:toggle', () => {
  toggleTableWindow();
});

ipcMain.on('table:close', () => {
  closeTableWindow();
});

ipcMain.on('table:request-sync', () => {
  syncTableWindowRows();
});

ipcMain.on('shape:added', (_event, rawRow: unknown) => {
  if (!isValidRow(rawRow)) {
    return;
  }
  const row = normalizeRow(rawRow);
  cachedRows.push(row);

  if (cachedRows.length === 1) {
    const content = serializeRowsTsv(cachedRows);
    enqueueFileWrite(() =>
      fs.promises.writeFile(DEFAULT_SHAPES_FILE, content, 'utf-8'),
    );
  } else {
    const line = `${formatRowTsv(row)}\n`;
    enqueueFileWrite(() =>
      fs.promises.appendFile(DEFAULT_SHAPES_FILE, line, 'utf-8'),
    );
  }

  if (tableWindow && !tableWindow.isDestroyed()) {
    tableWindow.webContents.send('table:add-row', row);
  }
});

ipcMain.on(
  'shapes:replaced',
  (_event, rawRows: unknown, selectedIndex: number | null) => {
    const validRows = Array.isArray(rawRows)
      ? rawRows.filter(isValidRow).map(normalizeRow)
      : [];
    cachedRows = validRows;
    cachedSelectedIndex =
      typeof selectedIndex === 'number' &&
      Number.isInteger(selectedIndex) &&
      selectedIndex >= 0 &&
      selectedIndex < validRows.length
        ? selectedIndex
        : null;

    const content = serializeRowsTsv(cachedRows);
    enqueueFileWrite(() =>
      fs.promises.writeFile(DEFAULT_SHAPES_FILE, content, 'utf-8'),
    );

    syncTableWindowRows();
  },
);

ipcMain.on('table:select-row', (_event, index: number | null) => {
  cachedSelectedIndex =
    typeof index === 'number' &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < cachedRows.length
      ? index
      : null;

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('table:row-selected', cachedSelectedIndex);
  }
});

ipcMain.on('table:delete-row', (_event, index: number) => {
  if (
    typeof index !== 'number' ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= cachedRows.length
  ) {
    return;
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('table:row-deleted', index);
  }
});

ipcMain.on('file:save-data', (_event, rawRows: unknown) => {
  const validRows = Array.isArray(rawRows)
    ? rawRows.filter(isValidRow).map(normalizeRow)
    : [];
  void handleSaveRowsToFile(validRows);
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
