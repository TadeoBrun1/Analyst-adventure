/*
 * Analyst Adventure — Sonido sintetizado con Web Audio (sin archivos externos).
 * Canales: música, efectos y voces, cada uno con su volumen (ver settings.js).
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});

  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  // Progresión lo-fi tranquila: Cmaj7 – Am7 – Fmaj7 – G
  const SONG = [
    { bass: 36, arp: [60, 64, 67, 71] },
    { bass: 33, arp: [57, 60, 64, 67] },
    { bass: 29, arp: [53, 57, 60, 64] },
    { bass: 31, arp: [55, 59, 62, 65] },
  ];
  const ARP = [0, 1, 2, 3, 2, 1, 2, 3];
  const TEMPO = 84;

  const Audio = {
    ctx: null,
    bus: {},
    noiseBuf: null,
    wantMusic: false,
    music: null,
    duck: 1,

    // Crea el contexto de audio (los navegadores exigen un gesto del usuario).
    ensure() {
      if (!this.ctx) {
        const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return null;
        const ctx = (this.ctx = new AC());
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -14;
        comp.ratio.value = 4;
        const master = ctx.createGain();
        comp.connect(master);
        master.connect(ctx.destination);
        const music = ctx.createGain();
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 2600;
        music.connect(lp);
        lp.connect(comp);
        const sfx = ctx.createGain();
        sfx.connect(comp);
        const voice = ctx.createGain();
        voice.connect(comp);
        this.bus = { master, music, sfx, voice };
        const len = ctx.sampleRate;
        this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        this.applyVolumes();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx
          .resume()
          .then(() => {
            if (this.wantMusic && !this.music) this.startMusic();
          })
          .catch(() => {});
      } else if (this.wantMusic && !this.music) this.startMusic();
      return this.ctx;
    },
    // Habilita el audio con el primer clic o tecla.
    installUnlock() {
      const unlock = () => this.ensure();
      window.addEventListener('pointerdown', unlock, true);
      window.addEventListener('keydown', unlock, true);
    },

    applyVolumes() {
      if (!this.ctx) return;
      const v = (AA.Settings && AA.Settings.data.volume) || { master: 0.8, music: 0.45, sfx: 0.8, voice: 0.7 };
      const t = this.ctx.currentTime;
      const set = (g, val) => g.gain.setTargetAtTime(val, t, 0.05);
      set(this.bus.master, v.master);
      set(this.bus.music, v.music * 0.55 * this.duck);
      set(this.bus.sfx, v.sfx * 0.9);
      set(this.bus.voice, v.voice * 0.8);
    },
    // Baja la música (por ejemplo, mientras se trabaja en una planilla).
    setDuck(x) {
      this.duck = x;
      this.applyVolumes();
    },

    // --- Bloques básicos
    tone(o) {
      const ctx = this.ctx;
      if (!ctx) return;
      const t = o.when || ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = o.type || 'square';
      osc.frequency.setValueAtTime(o.freq, t);
      if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + o.dur);
      const vol = o.vol === undefined ? 0.15 : o.vol;
      const atk = o.attack || 0.004;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + atk);
      g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
      osc.connect(g);
      g.connect(this.bus[o.bus || 'sfx']);
      osc.start(t);
      osc.stop(t + o.dur + 0.02);
    },
    noise(o) {
      const ctx = this.ctx;
      if (!ctx) return;
      const t = o.when || ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = ctx.createBiquadFilter();
      f.type = o.filter || 'highpass';
      f.frequency.value = o.freq || 6000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(o.vol || 0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.bus[o.bus || 'sfx']);
      src.start(t, Math.random() * 0.5);
      src.stop(t + o.dur + 0.02);
    },
    seq(notes, step, opts) {
      if (!this.ensure()) return;
      const t0 = this.ctx.currentTime;
      notes.forEach((n, i) => {
        if (n !== null) this.tone(Object.assign({ freq: midi(n), dur: step * 1.6, when: t0 + i * step }, opts));
      });
    },

    // --- Voces: un "bip" por palabra, con el tono de cada personaje
    blip(pitch) {
      if (!pitch || !this.ensure()) return;
      const f = pitch * (0.94 + Math.random() * 0.18);
      this.tone({ freq: f, slide: f * 0.82, dur: 0.06, type: 'square', vol: 0.09, bus: 'voice' });
      this.tone({ freq: f * 2, dur: 0.03, type: 'triangle', vol: 0.03, bus: 'voice' });
    },

    // --- Efectos
    play(name) {
      if (!this.ensure()) return;
      switch (name) {
        case 'move':
          this.tone({ freq: 880, dur: 0.035, type: 'square', vol: 0.04 });
          break;
        case 'select':
          this.seq([76, 83], 0.05, { type: 'square', vol: 0.07 });
          break;
        case 'back':
          this.seq([71, 64], 0.05, { type: 'square', vol: 0.06 });
          break;
        case 'type':
          this.noise({ dur: 0.02, vol: 0.03, freq: 3500 });
          break;
        case 'success':
          this.seq([72, 76, 79, 84], 0.06, { type: 'triangle', vol: 0.12 });
          break;
        case 'error':
          this.tone({ freq: 220, slide: 150, dur: 0.18, type: 'square', vol: 0.08 });
          break;
        case 'page':
          this.noise({ dur: 0.12, vol: 0.06, freq: 1800, filter: 'bandpass' });
          this.noise({ dur: 0.08, vol: 0.04, freq: 4000, when: this.ctx.currentTime + 0.06 });
          break;
        case 'unlock':
          this.seq([67, 72, 76, 79, 84], 0.05, { type: 'square', vol: 0.06 });
          break;
        case 'complete':
          this.seq([72, 76, 79, 84, null, 79, 84], 0.09, { type: 'square', vol: 0.07 });
          this.seq([60, null, 64, null, 67, null, 72], 0.09, { type: 'triangle', vol: 0.1 });
          break;
        case 'levelup':
          this.seq([60, 64, 67, 72, 76, 79, 84, 88, 91, 96], 0.055, { type: 'square', vol: 0.06 });
          this.seq([48, null, null, 55, null, null, 60, null, null, 72], 0.055, { type: 'triangle', vol: 0.12 });
          break;
        case 'fanfare': {
          // Fiesta: fanfarria de trompetas chiptune + redoblante + "pops" de confeti.
          const t0 = this.ctx.currentTime;
          const lead = [[67, 0, 0.12], [67, 0.13, 0.12], [67, 0.26, 0.12], [72, 0.4, 0.5], [76, 0.95, 0.14], [74, 1.1, 0.14], [76, 1.25, 0.14], [79, 1.4, 0.75]];
          lead.forEach(([n, at, d]) => {
            this.tone({ freq: midi(n), dur: d + 0.06, when: t0 + at, type: 'square', vol: 0.075 });
            this.tone({ freq: midi(n + 12), dur: d, when: t0 + at, type: 'triangle', vol: 0.035 });
          });
          [[48, 0], [55, 0.4], [52, 0.95], [55, 1.4], [60, 1.4]].forEach(([n, at]) => this.tone({ freq: midi(n), dur: 0.45, when: t0 + at, type: 'triangle', vol: 0.14 }));
          for (let i = 0; i < 6; i++) this.noise({ dur: 0.06, vol: 0.05, freq: 2500, filter: 'bandpass', when: t0 + 0.27 + i * 0.022 });
          [0.4, 0.95, 1.4].forEach((at) => this.noise({ dur: 0.18, vol: 0.07, freq: 5000, when: t0 + at }));
          for (let i = 0; i < 10; i++) this.tone({ freq: 1400 + Math.random() * 1800, slide: 600, dur: 0.05, when: t0 + 1.5 + i * 0.07 + Math.random() * 0.03, type: 'square', vol: 0.025 });
          break;
        }
        default:
          break;
      }
    },

    // --- Música de fondo (secuenciador simple con planificación anticipada)
    startMusic() {
      this.wantMusic = true;
      if (!this.ctx || this.ctx.state !== 'running' || this.music) return;
      const sixteenth = 60 / TEMPO / 4;
      this.music = { step: 0, next: this.ctx.currentTime + 0.1 };
      const tick = () => {
        if (!this.music) return;
        while (this.music.next < this.ctx.currentTime + 0.15) {
          this.scheduleStep(this.music.step, this.music.next, sixteenth);
          this.music.next += sixteenth;
          this.music.step++;
        }
      };
      this.music.timer = setInterval(tick, 40);
      tick();
    },
    stopMusic() {
      this.wantMusic = false;
      if (this.music) clearInterval(this.music.timer);
      this.music = null;
    },
    scheduleStep(step, t, sixteenth) {
      const bar = Math.floor(step / 16) % SONG.length;
      const s = step % 16;
      const chord = SONG[bar];
      const m = { bus: 'music' };
      if (s === 0) {
        // colchón suave del acorde
        chord.arp.forEach((n) => this.tone(Object.assign({ freq: midi(n), dur: sixteenth * 15, type: 'sine', vol: 0.03, attack: 0.25, when: t }, m)));
      }
      if (s === 0 || s === 8 || s === 11) {
        this.tone(Object.assign({ freq: midi(chord.bass + 12), dur: sixteenth * 5, type: 'triangle', vol: s === 11 ? 0.08 : 0.13, when: t }, m));
      }
      if (s % 2 === 0) {
        const variation = Math.floor(step / 64) % 2 ? 12 : 0;
        const n = chord.arp[ARP[(s / 2) % ARP.length]] + 12 + (s === 14 ? variation : 0);
        this.tone(Object.assign({ freq: midi(n), dur: sixteenth * 2.4, type: 'triangle', vol: 0.045, when: t }, m));
      }
      if (s % 4 === 2) this.noise(Object.assign({ dur: 0.03, vol: 0.018, freq: 7000, when: t }, m));
    },
  };

  AA.Audio = Audio;
})();
