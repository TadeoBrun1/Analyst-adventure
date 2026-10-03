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

  // Tema de la oficina: alegre y con swing, al estilo de los juegos de simulación tranquilos.
  // Acordes (notas del acompañamiento + bajo) y una melodía por compás en corcheas:
  // número = nota MIDI · -1 = sostener la anterior · 0 = silencio.
  const CH = {
    C: { notes: [60, 64, 67], bass: 36 },
    Am: { notes: [57, 60, 64], bass: 45 },
    F: { notes: [57, 60, 65], bass: 41 },
    G: { notes: [55, 59, 62], bass: 43 },
    Dm: { notes: [57, 62, 65], bass: 38 },
    Em: { notes: [55, 59, 64], bass: 40 },
    G7: { notes: [59, 62, 65], bass: 43 },
  };
  const OFFICE = [
    // A
    ['C', [76, 79, -1, 76, 77, 76, 74, 72]],
    ['Am', [69, 72, 76, -1, 74, -1, 72, 0]],
    ['F', [77, -1, 77, 76, 74, 72, 74, -1]],
    ['G', [79, -1, 74, -1, 71, 74, 79, 0]],
    ['C', [76, 79, -1, 76, 77, 76, 74, 72]],
    ['Am', [69, 72, 76, 81, -1, 79, 76, 0]],
    ['Dm', [77, 76, 74, 72, 74, -1, 77, -1]],
    ['G', [74, -1, 71, 74, 72, -1, -1, 0]],
    // B
    ['F', [81, -1, 79, 77, 76, -1, 77, 79]],
    ['G', [79, -1, 77, 76, 74, -1, 71, -1]],
    ['Em', [76, 79, 83, -1, 81, 79, 76, -1]],
    ['Am', [81, -1, 79, 76, 72, -1, 76, 0]],
    ['Dm', [74, 77, 81, -1, 79, 77, 74, -1]],
    ['G', [79, -1, 77, -1, 74, 71, 74, 79]],
    ['C', [84, -1, 79, 76, 72, -1, 76, 79]],
    ['G7', [77, -1, 74, -1, 71, -1, 0, 0]],
    // Puente: solo el ritmo, para respirar
    ['C', null],
    ['Am', null],
    ['F', null],
    ['G7', null],
  ];

  // Tema del ARCADE: chiptune movido en La menor (Am – F – C – G), con una melodía de 8 compases.
  const ARC_CH = [
    { root: 45, notes: [57, 60, 64] },
    { root: 41, notes: [57, 60, 65] },
    { root: 48, notes: [55, 60, 64] },
    { root: 43, notes: [55, 59, 62] },
  ];
  // corcheas: nota MIDI, -1 sostener, 0 silencio
  const ARC_MEL = [
    [76, 0, 76, 79, 81, -1, 79, 76],
    [77, -1, 76, 74, 72, -1, 74, 76],
    [79, 0, 79, 81, 84, -1, 83, 79],
    [83, -1, 81, 79, 74, -1, 0, 0],
    [76, 79, 81, 79, 76, 74, 72, 74],
    [77, 81, 84, 81, 77, -1, 76, 77],
    [79, 84, 83, 79, 76, -1, 79, 81],
    [83, -1, 86, -1, 83, 81, 79, 0],
  ];

  // Vinilos del tocadiscos (recompensa del ARCADE): cambian la música de la oficina.
  // prog: acordes por compás { n: notas, b: bajo } · mel: corcheas (nota MIDI, -1 sostener, 0 silencio).
  const VINYLS = {
    bossa: {
      name: { es: 'Bossa de los datos', en: 'Data Bossa' },
      style: 'bossa',
      tempo: 128,
      bright: 3800,
      color: '#f4a261',
      prog: [
        { n: [62, 65, 69, 72], b: 38 },
        { n: [59, 64, 65, 69], b: 43 },
        { n: [60, 64, 67, 71], b: 36 },
        { n: [60, 64, 67, 71], b: 36 },
        { n: [62, 65, 69, 72], b: 38 },
        { n: [59, 64, 65, 69], b: 43 },
        { n: [60, 64, 67, 71], b: 36 },
        { n: [61, 64, 67, 70], b: 45 },
      ],
      mel: [
        [74, -1, 72, 69, -1, 0, 72, 74],
        [76, -1, 74, -1, 71, -1, 0, 0],
        [72, -1, 76, 79, -1, 76, 74, -1],
        [72, -1, -1, -1, 0, 0, 67, 69],
        [72, 74, 77, -1, 76, 74, 72, -1],
        [74, -1, 71, 67, -1, 0, 71, 74],
        [76, -1, 79, -1, 76, 74, 72, -1],
        [73, -1, 76, -1, 79, -1, 0, 0],
      ],
    },
    synth: {
      name: { es: 'Synthwave de oficina', en: 'Office Synthwave' },
      style: 'synth',
      tempo: 104,
      bright: 6500,
      color: '#ff4fd8',
      prog: [
        { n: [57, 60, 64], b: 45 },
        { n: [57, 60, 65], b: 41 },
        { n: [55, 60, 64], b: 48 },
        { n: [55, 59, 62], b: 43 },
        { n: [57, 60, 64], b: 45 },
        { n: [57, 60, 65], b: 41 },
        { n: [55, 60, 64], b: 48 },
        { n: [55, 59, 62], b: 43 },
      ],
      mel: [
        [76, -1, -1, 72, 74, -1, 76, -1],
        [77, -1, 76, 74, 72, -1, -1, 0],
        [79, -1, -1, 76, 79, -1, 81, -1],
        [79, -1, 74, -1, -1, 0, 0, 0],
        [81, -1, 79, 76, 74, -1, 76, -1],
        [77, -1, 81, -1, 84, -1, 81, 77],
        [79, -1, 76, -1, 72, 74, 76, 79],
        [74, -1, -1, -1, 71, -1, 0, 0],
      ],
    },
    cumbia: {
      name: { es: 'Cumbia del Excel', en: 'Spreadsheet Cumbia' },
      style: 'cumbia',
      tempo: 96,
      bright: 5600,
      color: '#7cf29a',
      prog: [
        { n: [57, 60, 64], b: 45 },
        { n: [57, 60, 64], b: 45 },
        { n: [57, 62, 65], b: 38 },
        { n: [57, 62, 65], b: 38 },
        { n: [55, 59, 62], b: 43 },
        { n: [55, 60, 64], b: 48 },
        { n: [56, 59, 62, 64], b: 40 },
        { n: [57, 60, 64], b: 45 },
      ],
      mel: [
        [69, 72, 76, -1, 74, 72, 71, 72],
        [69, -1, 0, 64, 69, 72, 71, 69],
        [74, 77, 81, -1, 79, 77, 76, 77],
        [74, -1, 0, 69, 74, 77, 76, 74],
        [71, 74, 79, -1, 77, 74, 72, 71],
        [72, -1, 76, -1, 79, 76, 74, 72],
        [71, 68, 71, 74, 76, -1, 74, 71],
        [69, -1, -1, 0, 64, 68, 71, 0],
      ],
    },
  };

  const TRACKS = {
    lofi: { tempo: 84, bright: 2600 },
    office: { tempo: 112, bright: 5200, swing: 0.3 },
    arcade: { tempo: 146, bright: 7000 },
    vinyl_bossa: { tempo: VINYLS.bossa.tempo, bright: VINYLS.bossa.bright, vinyl: VINYLS.bossa },
    vinyl_synth: { tempo: VINYLS.synth.tempo, bright: VINYLS.synth.bright, vinyl: VINYLS.synth },
    vinyl_cumbia: { tempo: VINYLS.cumbia.tempo, bright: VINYLS.cumbia.bright, vinyl: VINYLS.cumbia },
  };

  const Audio = {
    ctx: null,
    bus: {},
    noiseBuf: null,
    wantMusic: false,
    music: null,
    track: 'lofi',
    positions: {},
    tempoFactor: 1,
    duck: 1,
    VINYLS,
    TRACKS,

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
        const lp = (this.musicFilter = ctx.createBiquadFilter());
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
      const on = !AA.Settings || AA.Settings.data.musicOn !== false;
      set(this.bus.music, on ? v.music * 0.55 * this.duck : 0);
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
      g.connect(o.out || this.bus[o.bus || 'sfx']);
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
      g.connect(o.out || this.bus[o.bus || 'sfx']);
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
        case 'achievement':
          this.seq([79, 84, 88, 91, null, 96], 0.07, { type: 'square', vol: 0.06 });
          this.seq([67, null, 72, null, 76, 79], 0.07, { type: 'triangle', vol: 0.09 });
          break;
        case 'meow':
          this.tone({ freq: 700, slide: 1100, dur: 0.12, type: 'triangle', vol: 0.09 });
          this.tone({ freq: 1100, slide: 520, dur: 0.22, type: 'triangle', vol: 0.08, when: this.ctx.currentTime + 0.11 });
          break;
        case 'woof':
          this.tone({ freq: 260, slide: 170, dur: 0.1, type: 'square', vol: 0.08 });
          this.noise({ dur: 0.06, vol: 0.04, freq: 900, filter: 'bandpass' });
          this.tone({ freq: 280, slide: 180, dur: 0.1, type: 'square', vol: 0.08, when: this.ctx.currentTime + 0.18 });
          break;
        case 'chest':
          this.noise({ dur: 0.12, vol: 0.05, freq: 700, filter: 'bandpass' });
          this.seq([72, 79, 84], 0.06, { type: 'triangle', vol: 0.1 });
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

    // --- Música de fondo (secuenciador simple con planificación anticipada).
    // Cada tema tiene su propia salida, así se puede pasar de uno a otro con un fundido.
    startMusic(name) {
      if (name && TRACKS[name]) this.track = name;
      this.wantMusic = true;
      if (!this.ctx || this.ctx.state !== 'running') return;
      if (AA.Settings && AA.Settings.data.musicOn === false) return this.fadeOutMusic();
      if (this.music && this.music.name === this.track) return;
      this.fadeOutMusic();
      const ctx = this.ctx;
      const tr = TRACKS[this.track];
      const out = ctx.createGain();
      out.gain.setValueAtTime(0.0001, ctx.currentTime);
      out.gain.setTargetAtTime(1, ctx.currentTime, 0.35);
      out.connect(this.bus.music);
      this.musicFilter.frequency.setTargetAtTime(tr.bright, ctx.currentTime, 0.3);
      // Retoma el tema desde el compás donde había quedado.
      const from = Math.floor((this.positions[this.track] || 0) / 16) * 16;
      const m = (this.music = { name: this.track, step: from, next: ctx.currentTime + 0.12, out });
      const tick = () => {
        if (this.music !== m) return;
        while (m.next < ctx.currentTime + 0.15) {
          // El tempo se recalcula en cada paso: el ARCADE acelera la música en cada oleada.
          const sixteenth = 60 / (tr.tempo * (m.name === 'arcade' ? this.tempoFactor : 1)) / 4;
          if (m.name === 'office') this.officeStep(m.step, m.next, sixteenth, out, tr.swing);
          else if (m.name === 'arcade') this.arcadeStep(m.step, m.next, sixteenth, out);
          else if (tr.vinyl) this.vinylStep(m.step, m.next, sixteenth, out, tr.vinyl);
          else this.scheduleStep(m.step, m.next, sixteenth, out);
          m.next += sixteenth;
          m.step++;
          this.positions[m.name] = m.step;
        }
      };
      m.timer = setInterval(tick, 40);
      tick();
    },
    fadeOutMusic() {
      const m = this.music;
      if (!m) return;
      clearInterval(m.timer);
      this.music = null;
      if (this.ctx) {
        m.out.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.25);
        setTimeout(() => m.out.disconnect(), 2000);
      }
    },
    stopMusic() {
      this.wantMusic = false;
      this.fadeOutMusic();
    },
    // Encender o apagar la música desde las opciones.
    setMusicEnabled(on) {
      this.applyVolumes();
      if (on && this.wantMusic) this.startMusic();
      else if (!on) this.fadeOutMusic();
    },

    // Velocidad de la música del ARCADE (1 = normal).
    setTempoFactor(f) {
      this.tempoFactor = Math.max(0.5, Math.min(2, f || 1));
    },

    // Tema del ARCADE: bajo en corcheas, arpegio cuadrado, melodía y batería con platillo en semicorcheas.
    arcadeStep(step, t, s16, out) {
      const barIdx = Math.floor(step / 16) % ARC_MEL.length;
      const s = step % 16;
      const ch = ARC_CH[barIdx % ARC_CH.length];
      const mel = ARC_MEL[barIdx];
      const o = (x) => Object.assign({ out, when: t }, x);
      const intensity = Math.min(1, (this.tempoFactor - 1) * 2); // más capas cuanto más rápido
      // batería
      if (s % 4 === 0) this.tone(o({ freq: 140, slide: 40, dur: 0.12, type: 'sine', vol: 0.2 }));
      if (s === 4 || s === 12) this.noise(o({ dur: 0.09, vol: 0.06, freq: 2200, filter: 'bandpass' }));
      this.noise(o({ dur: 0.02, vol: s % 2 ? 0.008 : 0.014, freq: 9000 }));
      if (intensity > 0.3 && s === 14) this.noise(o({ dur: 0.05, vol: 0.04, freq: 2600, filter: 'bandpass' }));
      // bajo en corcheas (fundamental y octava)
      if (s % 2 === 0) this.tone(o({ freq: midi(ch.root + (s % 4 === 2 ? 12 : 0)), dur: s16 * 1.6, type: 'triangle', vol: 0.13 }));
      // arpegio
      if (s % 2 === 1 || intensity > 0.5) {
        const n = ch.notes[(s >> 1) % 3] + 12;
        this.tone(o({ freq: midi(n), dur: s16 * 0.9, type: 'square', vol: 0.016 }));
      }
      // melodía (corcheas)
      if (s % 2 === 0) {
        const e = s / 2;
        const n = mel[e];
        if (n > 0) {
          let len = 1;
          while (e + len < 8 && mel[e + len] === -1) len++;
          const dur = s16 * 2 * len * 0.9;
          this.tone(o({ freq: midi(n), dur, type: 'square', vol: 0.04 }));
          this.tone(o({ freq: midi(n + 12), dur: Math.min(dur, 0.12), type: 'triangle', vol: 0.015 }));
        }
      }
    },

    // Vinilos del tocadiscos: bossa nova, synthwave y cumbia.
    vinylStep(step, t, s16, out, v) {
      const bar = Math.floor(step / 16) % v.prog.length;
      const s = step % 16;
      const ch = v.prog[bar];
      const mel = v.mel[bar];
      const o = (x) => Object.assign({ out, when: t }, x);
      const eighth = s16 * 2;
      const lead = (fn) => {
        if (s % 2) return;
        const e = s / 2;
        const n = mel[e];
        if (!(n > 0)) return;
        let len = 1;
        while (e + len < 8 && mel[e + len] === -1) len++;
        fn(n, Math.min(eighth * len * 0.92, 1.2));
      };
      if (v.style === 'bossa') {
        // bajo: fundamental y quinta con anticipación · guitarra en el patrón de la bossa · rim y shaker
        const bassAt = { 0: 0, 6: 7, 8: 7, 14: 0 };
        if (bassAt[s] !== undefined) this.tone(o({ freq: midi(ch.b + bassAt[s]), dur: s16 * (s === 0 ? 5 : 2), type: 'triangle', vol: 0.12 }));
        if ([0, 3, 6, 10, 13].includes(s)) this.noise(o({ dur: 0.03, vol: 0.03, freq: 2600, filter: 'bandpass' }));
        if ([2, 5, 8, 12].includes(s)) ch.n.forEach((n) => this.tone(o({ freq: midi(n), dur: s16 * 1.8, type: 'triangle', vol: 0.016 })));
        if (s === 0 || s === 8) this.tone(o({ freq: 90, slide: 50, dur: 0.14, type: 'sine', vol: 0.09 }));
        this.noise(o({ dur: 0.02, vol: s % 2 ? 0.004 : 0.007, freq: 8500 }));
        lead((n, dur) => {
          this.tone(o({ freq: midi(n), dur, type: 'sine', vol: 0.07, attack: 0.03 }));
          this.tone(o({ freq: midi(n + 12), dur: Math.min(dur, 0.2), type: 'sine', vol: 0.008 }));
        });
      } else if (v.style === 'synth') {
        // bombo en negras, palmada grande en 2 y 4, bajo en corcheas, arpegio y melodía sintetizada
        if (s % 4 === 0) this.tone(o({ freq: 130, slide: 42, dur: 0.18, type: 'sine', vol: 0.2 }));
        if (s === 4 || s === 12) {
          this.noise(o({ dur: 0.24, vol: 0.08, freq: 1700, filter: 'bandpass' }));
          this.tone(o({ freq: 210, slide: 120, dur: 0.1, type: 'triangle', vol: 0.06 }));
        }
        if (s % 4 === 2) this.noise(o({ dur: 0.06, vol: 0.018, freq: 9000 }));
        if (s === 0) ch.n.forEach((n) => this.tone(o({ freq: midi(n), dur: s16 * 15, type: 'sine', vol: 0.016, attack: 0.25 })));
        if (s % 2 === 0) this.tone(o({ freq: midi(ch.b - 12 + (s % 4 === 2 ? 12 : 0)), dur: eighth * 0.85, type: 'sawtooth', vol: 0.045 }));
        this.tone(o({ freq: midi(ch.n[[0, 1, 2, 1][s % 4]] + 12), dur: s16 * 0.8, type: 'square', vol: 0.01 }));
        lead((n, dur) => {
          this.tone(o({ freq: midi(n), dur, type: 'sawtooth', vol: 0.026, attack: 0.01 }));
          this.tone(o({ freq: midi(n) * 1.005, dur, type: 'square', vol: 0.012 }));
        });
      } else {
        // cumbia: güira constante, bajo en 1 y 3, tambora, acordeón en contratiempo y melodía
        this.noise(o({ dur: s % 4 === 2 ? 0.06 : 0.03, vol: s % 4 === 2 ? 0.03 : s % 2 ? 0.008 : 0.014, freq: 6500 }));
        const bassAt = { 0: 0, 6: 12, 8: 7, 14: 7 };
        if (bassAt[s] !== undefined) this.tone(o({ freq: midi(ch.b + bassAt[s]), dur: s16 * (s % 8 === 0 ? 3 : 1.5), type: 'triangle', vol: 0.13 }));
        if (s === 4 || s === 12) this.tone(o({ freq: 150, slide: 90, dur: 0.12, type: 'sine', vol: 0.12 }));
        if (s === 7 || s === 15) this.tone(o({ freq: 330, slide: 260, dur: 0.06, type: 'sine', vol: 0.06 }));
        if (s % 4 === 2) ch.n.forEach((n) => this.tone(o({ freq: midi(n + 12), dur: s16 * 1.2, type: 'square', vol: 0.008 })));
        lead((n, dur) => {
          this.tone(o({ freq: midi(n), dur, type: 'square', vol: 0.022 }));
          this.tone(o({ freq: midi(n) * 1.007, dur, type: 'square', vol: 0.016 }));
          this.tone(o({ freq: midi(n - 12), dur, type: 'triangle', vol: 0.02 }));
        });
      }
    },

    // Ritmo de breakdance para el baile de la oficina (unos 6 segundos, por el canal de efectos).
    breakbeat(bars) {
      if (!this.ensure()) return;
      const t0 = this.ctx.currentTime + 0.05;
      const s16 = 60 / 100 / 4;
      for (let i = 0; i < (bars || 4) * 16; i++) {
        const t = t0 + i * s16;
        const s = i % 16;
        if ([0, 6, 10].includes(s)) this.tone({ freq: 120, slide: 40, dur: 0.18, type: 'sine', vol: 0.22, when: t });
        if (s === 4 || s === 12) this.noise({ dur: 0.14, vol: 0.09, freq: 1800, filter: 'bandpass', when: t });
        if (s % 2 === 0) this.noise({ dur: 0.03, vol: 0.02, freq: 8500, when: t });
        // "scratch" del DJ en el último tiempo de cada compás
        if (s === 14 && i % 32 === 30) {
          this.noise({ dur: 0.08, vol: 0.05, freq: 900, filter: 'bandpass', when: t });
          this.tone({ freq: 500, slide: 1500, dur: 0.08, type: 'sawtooth', vol: 0.03, when: t });
          this.tone({ freq: 1400, slide: 400, dur: 0.08, type: 'sawtooth', vol: 0.03, when: t + 0.09 });
        }
        if (s === 0) this.tone({ freq: midi([45, 45, 48, 43][Math.floor(i / 16) % 4]), dur: s16 * 3, type: 'square', vol: 0.05, when: t });
      }
    },

    // Tema lo-fi tranquilo (menú principal).
    scheduleStep(step, t, sixteenth, out) {
      const bar = Math.floor(step / 16) % SONG.length;
      const s = step % 16;
      const chord = SONG[bar];
      const m = { out };
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

    // Tema de la oficina: marimba, acordes en contratiempo, bajo saltarín y batería suave.
    officeStep(step, t0, sixteenth, out, swing) {
      const barIdx = Math.floor(step / 16) % OFFICE.length;
      const loop = Math.floor(step / (16 * OFFICE.length));
      const s = step % 16;
      const [name, mel] = OFFICE[barIdx];
      const chord = CH[name];
      const e = s / 2; // corchea dentro del compás
      // swing: la segunda corchea de cada negra llega un poco tarde
      const t = s % 4 === 2 ? t0 + sixteenth * swing : t0;
      const o = (x) => Object.assign({ out, when: t }, x);
      const eighth = sixteenth * 2;

      if (s === 0) {
        // colchón muy suave para dar calidez
        chord.notes.forEach((n) => this.tone(o({ freq: midi(n), dur: sixteenth * 16, type: 'sine', vol: 0.012, attack: 0.3 })));
      }
      if (s % 2) {
        // shaker en semicorcheas
        if (s % 4 === 3) this.noise(o({ dur: 0.02, vol: 0.006, freq: 9000 }));
        return;
      }
      // batería: bombo en 1 y 3, chasquido en 2 y 4, platillo cerrado en cada corchea
      if (e === 0 || e === 4 || (e === 5 && barIdx % 4 === 3)) this.tone(o({ freq: 120, slide: 45, dur: 0.16, type: 'sine', vol: 0.17 }));
      if (e === 2 || e === 6) this.noise(o({ dur: 0.07, vol: 0.045, freq: 1900, filter: 'bandpass' }));
      this.noise(o({ dur: 0.025, vol: e % 2 ? 0.016 : 0.01, freq: 8000 }));
      // bajo: fundamental, quinta, octava, quinta
      const bassLine = { 0: 0, 2: 7, 4: 12, 6: 7 };
      if (bassLine[e] !== undefined) this.tone(o({ freq: midi(chord.bass + bassLine[e]), dur: eighth * 0.9, type: 'triangle', vol: 0.12 }));
      // acordes cortos en contratiempo (como un piano eléctrico)
      if (e % 2 === 1) {
        chord.notes.forEach((n) => {
          this.tone(o({ freq: midi(n), dur: eighth * 0.7, type: 'triangle', vol: 0.018 }));
          this.tone(o({ freq: midi(n + 12), dur: eighth * 0.5, type: 'sine', vol: 0.01 }));
        });
      }
      // melodía de marimba
      if (mel && mel[e] > 0) {
        let len = 1;
        while (e + len < 8 && mel[e + len] === -1) len++;
        const n = mel[e];
        const dur = Math.min(eighth * len * 0.95 + 0.05, 0.9);
        this.tone(o({ freq: midi(n), dur, type: 'sine', vol: 0.075 }));
        this.tone(o({ freq: midi(n) * 4, dur: 0.06, type: 'sine', vol: 0.012 }));
        this.tone(o({ freq: midi(n), dur: Math.min(dur, 0.25), type: 'triangle', vol: 0.02 }));
        // en las vueltas impares, una segunda voz una octava abajo
        if (loop % 2 === 1) this.tone(o({ freq: midi(n - 12), dur, type: 'triangle', vol: 0.025 }));
      }
      // en el puente, un silbido corto que pregunta y responde
      if (!mel && (barIdx % 2 === 0 ? e === 1 || e === 2 : e === 5)) {
        const q = barIdx % 2 === 0 ? [chord.notes[2] + 12, chord.notes[1] + 12][e - 1] : chord.notes[0] + 12;
        this.tone(o({ freq: midi(q), dur: eighth * 1.2, type: 'sine', vol: 0.03, attack: 0.03 }));
      }
    },
  };

  AA.Audio = Audio;
})();
