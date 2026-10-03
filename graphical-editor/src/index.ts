import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

const createMenu = () => {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Файл',
      submenu: [
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
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Об'єкти",
      submenu: [
        {
          label: 'Крапка',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow?.webContents.send('menu:mode', 'point');
          },
        },
        {
          label: 'Лінія',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            mainWindow?.webContents.send('menu:mode', 'line');
          },
        },
        {
          label: 'Прямокутник',
          accelerator: 'CmdOrCtrl+3',
          click: () => {
            mainWindow?.webContents.send('menu:mode', 'rect');
          },
        },
        {
          label: 'Еліпс',
          accelerator: 'CmdOrCtrl+4',
          click: () => {
            mainWindow?.webContents.send('menu:mode', 'ellipse');
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
            if (mainWindow) {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Про програму',
                message:
                  'Лабораторна робота №2\nГрафічний редактор об’єктів на TypeScript + Electron',
                detail:
                  'Варіант 25 (Присяжний С. О., група ІМ-55)\n\n' +
                  '• Статичний масив: 125 об’єктів\n' +
                  '• Гумовий слід: суцільна червона лінія\n' +
                  '• Прямокутник: від центру до кута, біле заповнення\n' +
                  '• Еліпс: по двох кутах охопл. прямокутника, без заповнення\n' +
                  '• Позначка режиму: у заголовку вікна',
              });
            }
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    title: 'Графічний редактор — [Режим: Крапка]',
    webPreferences: {
      preload: path.join(process.cwd(), 'dist/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.resolve(process.cwd(), 'index.html'));
  mainWindow.webContents.openDevTools();
  createMenu();
};

ipcMain.on('window:set-title', (_event, title: string) => {
  if (mainWindow && title) {
    mainWindow.setTitle(title);
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
