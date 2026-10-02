/*
 * Analyst Adventure — Puente seguro entre la página y el proceso principal.
 * La página no tiene acceso a Node: solo a estas funciones.
 */
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('AADesktop', {
  platform: process.platform,
  // Partidas (ranuras 1 a 3)
  loadSlot: (i) => ipcRenderer.sendSync('slot:load', i),
  writeSlot: (i, text) => ipcRenderer.sendSync('slot:write', i, text),
  deleteSlot: (i) => ipcRenderer.sendSync('slot:delete', i),
  // Configuración
  loadSettings: () => ipcRenderer.sendSync('settings:load'),
  writeSettings: (text) => ipcRenderer.sendSync('settings:write', text),
  // Ventana
  setFullscreen: (on) => ipcRenderer.send('window:setFullscreen', !!on),
  isFullscreen: () => ipcRenderer.sendSync('window:isFullscreen'),
  setWindowSize: (w, h) => ipcRenderer.send('window:setSize', w, h),
  onFullscreenChange: (cb) => ipcRenderer.on('window:fullscreenChanged', (event, on) => cb(!!on)),
  quit: () => ipcRenderer.send('app:quit'),
});
