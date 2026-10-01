/*
 * Analyst Adventure — Puente seguro entre la página y el proceso principal.
 * La página no tiene acceso a Node: solo a estas funciones.
 */
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('AADesktop', {
  platform: process.platform,
  loadSave: () => ipcRenderer.sendSync('save:load'),
  writeSave: (text) => ipcRenderer.sendSync('save:write', text),
  deleteSave: () => ipcRenderer.sendSync('save:delete'),
  toggleFullscreen: () => ipcRenderer.send('window:fullscreen'),
  isFullscreen: () => ipcRenderer.sendSync('window:isFullscreen'),
  quit: () => ipcRenderer.send('app:quit'),
});
