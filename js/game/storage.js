/*
 * Analyst Adventure — Almacenamiento: 3 ranuras de partida + configuración.
 * En el ejecutable (Electron) se guardan archivos en la carpeta de datos del juego;
 * en el navegador, en localStorage.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});

  const LEGACY_KEY = 'analyst-adventure-save-v1';
  const slotKey = (i) => 'analyst-adventure-slot-' + i;
  const SETTINGS_KEY = 'analyst-adventure-settings';

  const desktop = () => (typeof window !== 'undefined' && window.AADesktop) || null;

  function lsGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  function lsSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* almacenamiento bloqueado: la partida vive solo en esta sesión */
    }
  }
  function lsDel(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      /* nada que borrar */
    }
  }

  const Storage = {
    SLOTS: 3,
    desktop,

    readSlot(i) {
      const d = desktop();
      if (d) return d.loadSlot(i);
      let raw = lsGet(slotKey(i));
      // La versión anterior tenía una sola partida: pasa a la ranura 1.
      if (!raw && i === 1) {
        const legacy = lsGet(LEGACY_KEY);
        if (legacy) {
          lsSet(slotKey(1), legacy);
          lsDel(LEGACY_KEY);
          raw = legacy;
        }
      }
      return raw;
    },
    writeSlot(i, text) {
      const d = desktop();
      if (d) d.writeSlot(i, text);
      else lsSet(slotKey(i), text);
    },
    deleteSlot(i) {
      const d = desktop();
      if (d) d.deleteSlot(i);
      else lsDel(slotKey(i));
    },

    readSettings() {
      const d = desktop();
      const raw = d ? d.loadSettings() : lsGet(SETTINGS_KEY);
      try {
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },
    writeSettings(obj) {
      const text = JSON.stringify(obj);
      const d = desktop();
      if (d) d.writeSettings(text);
      else lsSet(SETTINGS_KEY, text);
    },
  };

  AA.Storage = Storage;
})();
