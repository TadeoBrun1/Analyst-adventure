/*
 * Analyst Adventure — Opciones del juego (compartidas por las 3 ranuras):
 * idioma, volúmenes y pantalla.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});

  const WINDOW_SIZES = ['1280x720', '1366x768', '1600x900', '1920x1080'];

  const defaults = () => ({
    lang: null,
    volume: { master: 0.8, music: 0.45, sfx: 0.8, voice: 0.7 },
    fullscreen: false,
    windowSize: '1366x768',
  });

  const Settings = {
    WINDOW_SIZES,
    data: defaults(),

    load() {
      const saved = AA.Storage.readSettings() || {};
      const d = defaults();
      this.data = Object.assign(d, saved, { volume: Object.assign(d.volume, saved.volume || {}) });
      if (!this.data.lang) this.data.lang = AA.detectLang();
      AA.setLang(this.data.lang);
      if (AA.Audio) AA.Audio.applyVolumes();
      const desk = AA.Storage.desktop();
      if (desk && desk.onFullscreenChange) {
        desk.onFullscreenChange((on) => {
          this.data.fullscreen = on;
          if (this.onChange) this.onChange('fullscreen');
        });
      }
    },
    save() {
      AA.Storage.writeSettings(this.data);
    },

    setLang(lang) {
      this.data.lang = lang;
      AA.setLang(lang);
      this.save();
    },
    setVolume(channel, value) {
      this.data.volume[channel] = Math.max(0, Math.min(1, value));
      if (AA.Audio) AA.Audio.applyVolumes();
      this.save();
    },

    // --- Pantalla
    canResize() {
      return !!AA.Storage.desktop();
    },
    isFullscreen() {
      const desk = AA.Storage.desktop();
      if (desk) return desk.isFullscreen();
      return !!document.fullscreenElement;
    },
    setFullscreen(on) {
      const desk = AA.Storage.desktop();
      if (desk) desk.setFullscreen(on);
      else if (on && !document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
      this.data.fullscreen = on;
      this.save();
    },
    setWindowSize(size) {
      if (!WINDOW_SIZES.includes(size)) return;
      this.data.windowSize = size;
      const desk = AA.Storage.desktop();
      if (desk) {
        const [w, h] = size.split('x').map(Number);
        desk.setWindowSize(w, h);
      }
      this.save();
    },
  };

  AA.Settings = Settings;
})();
