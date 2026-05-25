const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./src/db');
const ipcHandlers = require('./src/ipc-handlers');

let mainWindow = null;
let tray = null;
let isQuitting = false;
let currentStatus = 'online';

const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    frame: false,
    backgroundColor: '#1b2838',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function createTray() {
  let iconPath = path.join(__dirname, 'assets', 'icon.png');
  let img;
  try {
    img = nativeImage.createFromPath(iconPath);
    if (img.isEmpty()) img = nativeImage.createEmpty();
  } catch (e) {
    img = nativeImage.createEmpty();
  }
  tray = new Tray(img);
  tray.setToolTip('Steam Client');
  rebuildTrayMenu();
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function rebuildTrayMenu() {
  if (!tray) return;
  const menu = Menu.buildFromTemplate([
    { label: 'Открыть', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } } },
    { type: 'separator' },
    { label: 'Статус: Онлайн', type: 'radio', checked: currentStatus === 'online', click: () => setStatus('online') },
    { label: 'Статус: В игре', type: 'radio', checked: currentStatus === 'in_game', click: () => setStatus('in_game') },
    { label: 'Статус: Оффлайн', type: 'radio', checked: currentStatus === 'offline', click: () => setStatus('offline') },
    { type: 'separator' },
    { label: 'Выход', click: () => { isQuitting = true; app.quit(); } }
  ]);
  tray.setContextMenu(menu);
}

function setStatus(s) {
  currentStatus = s;
  rebuildTrayMenu();
  if (mainWindow) mainWindow.webContents.send('tray:statusChanged', s);
}

app.whenReady().then(() => {
  try {
    const userData = app.getPath('userData');
    if (!fs.existsSync(userData)) fs.mkdirSync(userData, { recursive: true });
    db.init(userData);
    ipcHandlers.register();
  } catch (err) {
    console.error('Init failed:', err);
  }

  // Window controls
  ipcMain.handle('window:minimize', () => { if (mainWindow) mainWindow.minimize(); });
  ipcMain.handle('window:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) mainWindow.unmaximize();
      else mainWindow.maximize();
    }
  });
  ipcMain.handle('window:close', () => { if (mainWindow) mainWindow.close(); });
  ipcMain.handle('app:getVersion', () => app.getVersion());
  ipcMain.handle('app:getUserDataPath', () => app.getPath('userData'));
  ipcMain.handle('app:setLoginItem', (_e, enabled) => {
    try {
      app.setLoginItemSettings({ openAtLogin: !!enabled });
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  });

  createWindow();
  createTray();
});

app.on('window-all-closed', (e) => {
  // Keep tray running
});

app.on('before-quit', () => { isQuitting = true; });

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
