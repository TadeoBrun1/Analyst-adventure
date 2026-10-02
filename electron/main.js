/*
 * Analyst Adventure — Proceso principal de la versión de escritorio (Electron).
 * Abre la ventana del juego, guarda las 3 ranuras de partida y la configuración en archivos
 * (compatibles con Steam Cloud) y maneja pantalla completa y tamaño de ventana.
 */
'use strict';
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const SLOTS = [1, 2, 3];
const WINDOW_SIZES = ['1280x720', '1366x768', '1600x900', '1920x1080'];

// Carpeta de datos: %APPDATA%/Analyst Adventure (Windows), ~/.config/Analyst Adventure (Linux),
// ~/Library/Application Support/Analyst Adventure (macOS).
const saveDir = () => path.join(app.getPath('userData'), 'saves');
const slotFile = (i) => path.join(saveDir(), `slot${i}.json`);
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (e) {
    return null;
  }
}
function readSettings() {
  try {
    return JSON.parse(readText(settingsFile()) || '{}');
  } catch (e) {
    return {};
  }
}
// Escritura atómica: si el juego se cierra a mitad de camino, el archivo anterior queda intacto.
function writeAtomic(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, text, 'utf8');
  fs.renameSync(tmp, file);
}
function patchSettings(patch) {
  try {
    writeAtomic(settingsFile(), JSON.stringify(Object.assign(readSettings(), patch)));
  } catch (e) {
    /* no es crítico */
  }
}
// La versión 0.1 tenía una sola partida (save.json): pasa a la ranura 1.
function migrateLegacySave() {
  const legacy = path.join(saveDir(), 'save.json');
  try {
    if (fs.existsSync(legacy) && !fs.existsSync(slotFile(1))) fs.renameSync(legacy, slotFile(1));
  } catch (e) {
    /* se ignora: la partida vieja queda donde estaba */
  }
}
const validSlot = (i) => SLOTS.includes(Number(i));

let win = null;

function createWindow() {
  const settings = readSettings();
  const size = WINDOW_SIZES.includes(settings.windowSize) ? settings.windowSize : '1366x768';
  const [width, height] = size.split('x').map(Number);
  win = new BrowserWindow({
    width,
    height,
    minWidth: 1024,
    minHeight: 640,
    title: 'Analyst Adventure',
    backgroundColor: '#0d0f18',
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
      autoplayPolicy: 'no-user-gesture-required',
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
  win.on('enter-full-screen', () => notifyFullscreen(true));
  win.on('leave-full-screen', () => notifyFullscreen(false));

  // El juego nunca navega fuera de su propio index.html; los enlaces externos van al navegador.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) event.preventDefault();
  });
}

function setFullscreen(on) {
  if (!win) return;
  win.setFullScreen(!!on);
  patchSettings({ fullscreen: !!on });
}
function notifyFullscreen(on) {
  patchSettings({ fullscreen: on });
  if (win && !win.isDestroyed()) win.webContents.send('window:fullscreenChanged', on);
}

// --- Puente con la página (ver preload.js)
ipcMain.on('slot:load', (event, i) => {
  event.returnValue = validSlot(i) ? readText(slotFile(i)) : null;
});
ipcMain.on('slot:write', (event, i, text) => {
  try {
    if (!validSlot(i)) throw new Error('ranura inválida');
    writeAtomic(slotFile(i), String(text));
    event.returnValue = true;
  } catch (e) {
    event.returnValue = false;
  }
});
ipcMain.on('slot:delete', (event, i) => {
  try {
    if (validSlot(i)) fs.rmSync(slotFile(i), { force: true });
    event.returnValue = true;
  } catch (e) {
    event.returnValue = false;
  }
});
ipcMain.on('settings:load', (event) => {
  event.returnValue = readText(settingsFile());
});
ipcMain.on('settings:write', (event, text) => {
  try {
    // Se conservan las claves que maneja este proceso (pantalla completa, tamaño).
    const incoming = JSON.parse(String(text));
    writeAtomic(settingsFile(), JSON.stringify(Object.assign(readSettings(), incoming)));
    event.returnValue = true;
  } catch (e) {
    event.returnValue = false;
  }
});
ipcMain.on('window:setFullscreen', (event, on) => setFullscreen(on));
ipcMain.on('window:isFullscreen', (event) => {
  event.returnValue = !!(win && win.isFullScreen());
});
ipcMain.on('window:setSize', (event, w, h) => {
  const size = `${w}x${h}`;
  if (!win || !WINDOW_SIZES.includes(size)) return;
  if (win.isFullScreen()) win.setFullScreen(false);
  if (win.isMaximized()) win.unmaximize();
  win.setSize(Number(w), Number(h));
  win.center();
  patchSettings({ windowSize: size });
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
    migrateLegacySave();
    createWindow();
  });
  app.on('window-all-closed', () => app.quit());
}
