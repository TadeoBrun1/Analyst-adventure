/*
 * Analyst Adventure — Proceso principal de la versión de escritorio (Electron).
 * Abre la ventana del juego, guarda la partida en un archivo (compatible con Steam Cloud)
 * y maneja pantalla completa (F11 / Alt+Enter).
 */
'use strict';
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');

// Carpeta de datos: %APPDATA%/Analyst Adventure (Windows), ~/.config/Analyst Adventure (Linux),
// ~/Library/Application Support/Analyst Adventure (macOS).
const saveDir = () => path.join(app.getPath('userData'), 'saves');
const saveFile = () => path.join(saveDir(), 'save.json');
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return fallback;
  }
}
// Escritura atómica: si el juego se cierra a mitad de camino, el guardado anterior queda intacto.
function writeAtomic(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, text, 'utf8');
  fs.renameSync(tmp, file);
}

let win = null;
let settings = { fullscreen: false };

function setFullscreen(on) {
  if (!win) return;
  win.setFullScreen(on);
  settings.fullscreen = on;
  try {
    writeAtomic(settingsFile(), JSON.stringify(settings));
  } catch (e) {
    /* no es crítico */
  }
}

function createWindow() {
  settings = Object.assign(settings, readJson(settingsFile(), {}));
  win = new BrowserWindow({
    width: 1366,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    title: 'Analyst Adventure',
    backgroundColor: '#12131c',
    icon: path.join(ROOT, 'assets', 'icon.png'),
    show: false,
    autoHideMenuBar: true,
    fullscreen: !!settings.fullscreen,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(ROOT, 'index.html'));

  // Atajos de juego, independientes del foco dentro de la página.
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11' || (input.alt && input.key === 'Enter')) {
      event.preventDefault();
      setFullscreen(!win.isFullScreen());
    }
    if (!app.isPackaged && input.key === 'F12') win.webContents.toggleDevTools();
  });
  win.on('leave-full-screen', () => (settings.fullscreen = false));

  // El juego nunca navega fuera de su propio index.html; los enlaces externos van al navegador.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) event.preventDefault();
  });
}

// --- Puente con la página (ver preload.js)
ipcMain.on('save:load', (event) => {
  try {
    event.returnValue = fs.existsSync(saveFile()) ? fs.readFileSync(saveFile(), 'utf8') : null;
  } catch (e) {
    event.returnValue = null;
  }
});
ipcMain.on('save:write', (event, text) => {
  try {
    writeAtomic(saveFile(), String(text));
    event.returnValue = true;
  } catch (e) {
    event.returnValue = false;
  }
});
ipcMain.on('save:delete', (event) => {
  try {
    fs.rmSync(saveFile(), { force: true });
    event.returnValue = true;
  } catch (e) {
    event.returnValue = false;
  }
});
ipcMain.on('window:fullscreen', () => win && setFullscreen(!win.isFullScreen()));
ipcMain.on('window:isFullscreen', (event) => {
  event.returnValue = !!(win && win.isFullScreen());
});
ipcMain.on('app:quit', () => app.quit());

// Una sola instancia del juego a la vez.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createWindow();
  });
  app.on('window-all-closed', () => app.quit());
}
