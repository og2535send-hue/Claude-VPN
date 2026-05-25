const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const { initDb, getDb } = require('./src/db');
const { registerHandlers } = require('./src/ipc-handlers');

let mainWindow = null;
let tray = null;
let isQuitting = false;

const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    frame: false,
    backgroundColor: '#1b2838',
    show: false,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (e) => {
    if (!isQuitting && tray) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  try {
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    let icon;
    if (fs.existsSync(iconPath)) {
      icon = nativeImage.createFromPath(iconPath);
      if (icon.isEmpty()) icon = nativeImage.createEmpty();
    } else {
      icon = nativeImage.createEmpty();
    }
    tray = new Tray(icon);
    updateTrayMenu('online');
    tray.setToolTip('Steam Client');
    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) mainWindow.hide();
        else mainWindow.show();
      }
    });
  } catch (e) {
    console.error('Failed to create tray:', e);
  }
}

function updateTrayMenu(status) {
  if (!tray) return;
  const menu = Menu.buildFromTemplate([
    { label: 'Открыть', click: () => mainWindow && mainWindow.show() },
    { type: 'separator' },
    {
      label: 'Статус', submenu: [
        { label: 'Онлайн', type: 'radio', checked: status === 'online', click: () => sendStatus('online') },
        { label: 'В игре', type: 'radio', checked: status === 'in-game', click: () => sendStatus('in-game') },
        { label: 'Оффлайн', type: 'radio', checked: status === 'offline', click: () => sendStatus('offline') },
      ]
    },
    { type: 'separator' },
    {
      label: 'Выход', click: () => {
        isQuitting = true;
        app.quit();
      }
    },
  ]);
  tray.setContextMenu(menu);
}

function sendStatus(status) {
  if (mainWindow) mainWindow.webContents.send('tray:setStatus', status);
  updateTrayMenu(status);
}

app.whenReady().then(() => {
  initDb(app.getPath('userData'));
  registerHandlers();
  createWindow();
  createTray();

  ipcMain.handle('app:getVersion', () => app.getVersion());
  ipcMain.handle('app:getUserDataPath', () => app.getPath('userData'));
  ipcMain.handle('app:setStartup', (event, enabled) => {
    try {
      app.setLoginItemSettings({ openAtLogin: !!enabled });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Keep app alive due to tray
  }
});
