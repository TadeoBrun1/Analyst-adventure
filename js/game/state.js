/*
 * Analyst Adventure — Estado de la partida: carrera, experiencia y guardado.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});

  const SAVE_KEY = 'analyst-adventure-save-v1';

  const RANKS = [
    { name: 'Pasante de Datos', xp: 0 },
    { name: 'Analista Junior', xp: 200 },
    { name: 'Analista Semi-Senior', xp: 1000 },
    { name: 'Analista Senior', xp: 2000 },
    { name: 'Lead de Datos', xp: 3200 },
  ];

  const CHARACTERS = {
    player: { name: 'Vos', role: '', skin: '#f1c27d', hair: '#3b2a20', shirt: '#4f8cff', pants: '#2b2f45' },
    marta: { name: 'Marta Ríos', role: 'Jefa de Analytics', skin: '#e0ac69', hair: '#4a2c1d', shirt: '#c0392b', pants: '#2c3e50', longHair: true },
    leo: { name: 'Leo Benítez', role: 'Analista Senior', skin: '#c68642', hair: '#1b1b1b', shirt: '#16a085', pants: '#34495e', glasses: true },
    sofi: { name: 'Sofía Navarro', role: 'Data Engineer', skin: '#f1c27d', hair: '#7b2d5c', shirt: '#f1c40f', pants: '#2d3436', longHair: true },
    tomas: { name: 'Tomás Quiroga', role: 'Marketing', skin: '#ffdbac', hair: '#d4a017', shirt: '#ff7aa2', pants: '#3d3d5c' },
    paula: { name: 'Paula Herrera', role: 'Recursos Humanos', skin: '#e0ac69', hair: '#2e1a12', shirt: '#9b59b6', pants: '#2c3e50', longHair: true },
    ramiro: { name: 'Ramiro Ortiz', role: 'Logística', skin: '#c68642', hair: '#555', shirt: '#e67e22', pants: '#2c3e50' },
  };

  const DEPT_COLORS = {
    Ventas: '#4f8cff',
    'RR.HH.': '#b26cf0',
    Marketing: '#ff6f9c',
    Logística: '#f5a524',
    Finanzas: '#2fbf71',
    Gerencia: '#8b95a7',
    Auditoría: '#e5484d',
  };

  function freshSave(name) {
    return {
      version: 1,
      name: name || 'Analista',
      xp: 0,
      completed: {}, // id -> { xp, hints, at }
      progress: {}, // id -> { cells, answers, hints }
      learned: [],
      flags: { intro: false, rankSeen: 0 },
      createdAt: Date.now(),
    };
  }

  const State = {
    RANKS,
    CHARACTERS,
    DEPT_COLORS,
    data: null,

    hasSave() {
      try {
        return !!localStorage.getItem(SAVE_KEY);
      } catch (e) {
        return false;
      }
    },
    load() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) {
          this.data = Object.assign(freshSave(), JSON.parse(raw));
          this.data.flags = Object.assign({ intro: false, rankSeen: 0 }, this.data.flags);
          return true;
        }
      } catch (e) {
        /* guardado corrupto o almacenamiento bloqueado */
      }
      return false;
    },
    newGame(name) {
      this.data = freshSave(name);
      this.save();
    },
    save() {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
      } catch (e) {
        /* sin almacenamiento: la partida vive solo en esta pestaña */
      }
    },
    reset() {
      try {
        localStorage.removeItem(SAVE_KEY);
      } catch (e) {
        /* nada que borrar */
      }
      this.data = null;
    },

    rankIndex(xp) {
      const x = xp === undefined ? this.data.xp : xp;
      let idx = 0;
      RANKS.forEach((r, i) => {
        if (x >= r.xp) idx = i;
      });
      return idx;
    },
    rank() {
      return RANKS[this.rankIndex()];
    },
    // Progreso dentro del rango actual (0..1) y XP del próximo.
    rankProgress() {
      const i = this.rankIndex();
      const cur = RANKS[i];
      const next = RANKS[i + 1];
      if (!next) return { pct: 1, next: null, cur };
      return { pct: (this.data.xp - cur.xp) / (next.xp - cur.xp), next, cur };
    },

    isCompleted(id) {
      return !!this.data.completed[id];
    },
    // Una misión está disponible si la anterior de la lista está completa.
    isAvailable(mission) {
      const list = AA.Missions.list;
      const i = list.indexOf(mission);
      return i <= 0 || this.isCompleted(list[i - 1].id);
    },
    nextMission() {
      return AA.Missions.list.find((m) => !this.isCompleted(m.id) && this.isAvailable(m)) || null;
    },
    completedCount() {
      return Object.keys(this.data.completed).length;
    },

    // Registra una misión entregada. Devuelve info del resultado.
    completeMission(mission, hintsUsed) {
      const before = this.rankIndex();
      const factor = Math.max(0.4, 1 - 0.15 * hintsUsed);
      const gained = Math.round(mission.xp * factor);
      const firstTime = !this.data.completed[mission.id];
      if (firstTime) {
        this.data.xp += gained;
        this.data.completed[mission.id] = { xp: gained, hints: hintsUsed, at: Date.now() };
        for (const f of mission.teaches || []) if (!this.data.learned.includes(f)) this.data.learned.push(f);
      }
      delete this.data.progress[mission.id];
      this.save();
      const after = this.rankIndex();
      return { gained: firstTime ? gained : 0, firstTime, promoted: after > before, rank: RANKS[after] };
    },
  };

  AA.State = State;
})();
