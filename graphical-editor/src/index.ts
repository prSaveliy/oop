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
                  'Лабораторна робота №3\nГрафічний редактор об’єктів на TypeScript + Electron',
                detail:
                  'Варіант 26 (Присяжний С. О., група ІМ-55)\n\n' +
                  '• Статичний масив: 126 об’єктів\n' +
                  '• Гумовий слід: суцільна синя лінія\n' +
                  '• Прямокутник: по двох протилежних кутах, блакитне заповнення\n' +
                  '• Еліпс: від центру до кута охопл. прямокутника, біле заповнення\n' +
                  '• Панель інструментів (Toolbar): кнопки з іконками, фіксація стану та підказки\n' +
                  '• Позначка режиму: у меню (радіо-позначка) та на панелі інструментів',
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
    title: 'Графічний редактор - Лабораторна робота №3',
    webPreferences: {
      preload: path.join(process.cwd(), 'dist/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.resolve(process.cwd(), 'index.html'));
  createMenu();
};

ipcMain.on('window:set-title', (_event, title: string) => {
  if (mainWindow && title) {
    mainWindow.setTitle(title);
  }
});

ipcMain.on('mode:changed', (_event, mode: string) => {
  const item = Menu.getApplicationMenu()?.getMenuItemById(`mode-${mode}`);
  if (item) {
    item.checked = true;
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
