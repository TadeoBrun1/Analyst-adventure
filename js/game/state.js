/*
 * Analyst Adventure — Estado de la partida: carrera, experiencia y ranuras de guardado.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});

  const VERSION = 2;

  // Rangos. Para ascender hacen falta DOS cosas: la XP del rango y haber completado los niveles
  // de la etapa actual (ver curriculum.js, campo `tier`). Así no se puede llegar a Senior
  // repitiendo casos de Pasante. Cada umbral ≈ XP de las tareas obligatorias de la etapa
  // + unos 3 casos de práctica (ver docs/CARRERA.md). El de Lead es provisorio hasta que
  // exista esa etapa.
  const RANKS = [
    { name: { es: 'Pasante de Datos', en: 'Data Intern' }, xp: 0 },
    { name: { es: 'Analista Junior', en: 'Junior Analyst' }, xp: 2200 },
    { name: { es: 'Analista Semi-Senior', en: 'Mid-level Analyst' }, xp: 5600 },
    { name: { es: 'Analista Senior', en: 'Senior Analyst' }, xp: 9450 },
    { name: { es: 'Lead de Datos', en: 'Data Lead' }, xp: 14200 },
  ];

  // voice: tono del "bip" de cada personaje al hablar.
  const CHARACTERS = {
    player: { name: { es: 'Vos', en: 'You' }, role: '', skin: '#f1c27d', hair: '#3b2a20', shirt: '#4f8cff', pants: '#2b2f45', voice: 300 },
    marta: { name: 'Marta Ríos', role: { es: 'Jefa de Analytics', en: 'Head of Analytics' }, body: 'f', skin: '#e0ac69', hair: '#4a2c1d', hairStyle: 'long', shirt: '#c0392b', top: 'blazer', pants: '#2c3e50', voice: 330 },
    leo: { name: 'Leonel Bargas', short: 'Leo', role: { es: 'Analista Senior', en: 'Senior Analyst' }, skin: '#ffdbac', hair: '#1b1b1b', shirt: '#16a085', pants: '#34495e', beard: 'stubble', voice: 200 },
    camila: { name: 'Camila Navarro', role: { es: 'Data Engineer', en: 'Data Engineer' }, body: 'f', skin: '#f1c27d', hair: '#e8cf7a', hairStyle: 'ponytail', shirt: '#f1c40f', top: 'hoodie', pants: '#2d3436', voice: 460 },
    tadeo: { name: 'Tadeo Bargas', role: { es: 'Marketing', en: 'Marketing' }, skin: '#ffdbac', hair: '#6b4423', hairStyle: 'spiky', shirt: '#ff7aa2', top: 'shirt', pants: '#3d3d5c', voice: 380 },
    jean: { name: 'Jean Joestar', role: { es: 'Arquitecto (viene por el café)', en: 'Architect (here for the coffee)' }, skin: '#7a4a2a', hair: '#141414', hairStyle: 'curly', beard: 'goatee', beardColor: '#141414', shirt: '#2d3436', top: 'blazer', pants: '#1f2129', glasses: true, voice: 230 },
    juanroberto: { name: 'Juan Roberto Tercero De Iscariote', short: 'Juan Roberto', role: { es: 'Poeta de la cafetería', en: 'Coffee-shop poet' }, skin: '#f1c27d', hair: '#bdbdbd', hairStyle: 'bob', beard: 'full', beardColor: '#bdbdbd', shirt: '#7b2d3b', top: 'shirt', pants: '#3b3226', voice: 190 },
    paula: { name: 'Paula Herrera', role: { es: 'Recursos Humanos', en: 'Human Resources' }, body: 'f', skin: '#e0ac69', hair: '#2e1a12', hairStyle: 'long', shirt: '#9b59b6', pants: '#2c3e50', voice: 400 },
    ramiro: { name: 'Ramiro Ortiz', role: { es: 'Logística', en: 'Logistics' }, skin: '#c68642', hair: '#555555', shirt: '#e67e22', pants: '#2c3e50', beard: 'mustache', voice: 240 },
    bruno: { name: 'Bruno Salas', role: { es: 'Ventas', en: 'Sales' }, skin: '#f1c27d', hair: '#6b4423', shirt: '#2e86de', top: 'shirt', pants: '#2c3e50', voice: 270 },
    nico: { name: 'Nico Ferreyra', role: { es: 'Analista Junior', en: 'Junior Analyst' }, skin: '#f1c27d', hair: '#8a4b20', shirt: '#0ea5b7', top: 'hoodie', pants: '#2c3e50', glasses: true, voice: 350 },
    graciela: { name: 'Graciela Campos', role: { es: 'Gerente General', en: 'General Manager' }, body: 'f', skin: '#e0ac69', hair: '#9e9e9e', hairStyle: 'bun', shirt: '#34495e', top: 'blazer', pants: '#1f2a36', voice: 300 },
    julia: { name: 'Julia Paz', role: { es: 'Finanzas', en: 'Finance' }, body: 'f', skin: '#ffdbac', hair: '#222222', hairStyle: 'bob', shirt: '#2fbf71', pants: '#2c3e50', bottom: 'skirt', voice: 420 },
    narrator: { name: '', role: '', voice: 0 },
  };

  const DEPTS = {
    ventas: { name: { es: 'Ventas', en: 'Sales' }, color: '#4f8cff' },
    rrhh: { name: { es: 'RR.HH.', en: 'HR' }, color: '#b26cf0' },
    marketing: { name: { es: 'Marketing', en: 'Marketing' }, color: '#ff6f9c' },
    logistica: { name: { es: 'Logística', en: 'Logistics' }, color: '#f5a524' },
    finanzas: { name: { es: 'Finanzas', en: 'Finance' }, color: '#2fbf71' },
    data: { name: { es: 'Datos', en: 'Data' }, color: '#0ea5b7' },
    analytics: { name: { es: 'Analytics', en: 'Analytics' }, color: '#e5484d' },
    gerencia: { name: { es: 'Gerencia', en: 'Management' }, color: '#8b95a7' },
  };

  function freshSave(name) {
    return {
      version: VERSION,
      name: name || 'Analista',
      xp: 0,
      lessons: {}, // mod -> true (Leo ya explicó)
      completed: {}, // id -> { xp, hints, at }
      practice: {}, // mod -> cantidad de prácticas completadas
      activePractice: {}, // mod -> id de la práctica en curso
      progress: {}, // id -> { cells, answers, hints, lang }
      flags: { intro: false, rankSeen: 0, metLeo: false, metCamila: false, metNico: false, tipFill: false, tipHeaders: false, favorsDone: 0, favorAt: 0, lastFavorKind: null, events: 0, eventMiss: 0, tours: {} },
      favor: null, // pedido de Nico en curso: id de la misión
      look: null, // aspecto elegido en el creador de personaje
      rankReached: 0,
      createdAt: Date.now(),
      lastPlayed: Date.now(),
    };
  }

  // Partidas de la versión 0.1 (otra progresión): se conserva el nombre y se empieza de nuevo.
  function migrate(data) {
    if (data && data.version === VERSION) {
      const d = Object.assign(freshSave(data.name), data);
      d.flags = Object.assign(freshSave().flags, data.flags);
      return d;
    }
    const d = freshSave(data && data.name);
    d.migratedFrom = (data && data.version) || 1;
    return d;
  }

  const State = {
    RANKS,
    CHARACTERS,
    DEPTS,
    slot: null,
    data: null,

    // --- Ranuras
    readSlot(i) {
      const raw = AA.Storage.readSlot(i);
      if (!raw) return null;
      try {
        return migrate(JSON.parse(raw));
      } catch (e) {
        return null;
      }
    },
    slotSummary(i) {
      const d = this.readSlot(i);
      if (!d) return null;
      const rank = RANKS[this.rankIndex(d)];
      const mods = AA.Curriculum.MODULES;
      const done = Object.keys(d.completed).filter((id) => /^mod\d+-\d+$/.test(id)).length;
      return {
        name: d.name,
        xp: d.xp,
        rank: AA.L(rank.name),
        done,
        total: mods.length * AA.Curriculum.REQUIRED,
        lastPlayed: d.lastPlayed,
        migrated: !!d.migratedFrom,
      };
    },
    loadSlot(i) {
      const d = this.readSlot(i);
      if (!d) return false;
      this.slot = i;
      this.data = d;
      this.applyLook();
      this.save();
      return true;
    },
    newGame(i, name, look) {
      this.slot = i;
      this.data = freshSave(name);
      this.data.look = look || null;
      this.applyLook();
      this.save();
    },
    // El personaje del jugador toma el aspecto guardado en la partida.
    DEFAULT_LOOK: { body: 'm', skin: '#f1c27d', hairStyle: 'short', hair: '#3b2a20', beard: 'none', beardColor: '#3b2a20', glasses: false, top: 'tee', shirt: '#4f8cff', bottom: 'pants', pants: '#2b2f45' },
    applyLook() {
      const l = Object.assign({}, this.DEFAULT_LOOK, (this.data && this.data.look) || {});
      Object.assign(CHARACTERS.player, l, { voice: l.body === 'f' ? 390 : 300 });
    },
    setLook(look) {
      if (!this.data) return;
      this.data.look = Object.assign({}, look);
      this.applyLook();
      this.save();
    },
    deleteSlot(i) {
      AA.Storage.deleteSlot(i);
      if (this.slot === i) {
        this.slot = null;
        this.data = null;
      }
    },
    save() {
      if (!this.data || !this.slot) return;
      this.data.lastPlayed = Date.now();
      AA.Storage.writeSlot(this.slot, JSON.stringify(this.data));
    },

    // --- Carrera
    // Rango de una partida: el mayor que alcanza su XP sin saltear etapas incompletas.
    // Nunca baja (rankReached guarda el máximo alcanzado).
    rankIndex(data) {
      const d = data || this.data;
      let byXp = 0;
      RANKS.forEach((r, i) => {
        if (d.xp >= r.xp) byXp = i;
      });
      // Para ascender al rango siguiente hay que completar la etapa actual, y esa etapa nueva
      // tiene que existir en el juego (Lead llega en una próxima actualización).
      let idx = 0;
      while (idx < byXp && AA.Curriculum.tierComplete(idx, d) && AA.Curriculum.tierModules(idx + 1).length > 0) idx++;
      return Math.max(idx, d.rankReached || 0);
    },
    rank() {
      return RANKS[this.rankIndex()];
    },
    rankProgress() {
      const i = this.rankIndex();
      const cur = RANKS[i];
      const next = RANKS[i + 1];
      if (!next) return { pct: 1, next: null, cur };
      return { pct: (this.data.xp - cur.xp) / (next.xp - cur.xp), next, cur };
    },

    // XP extra (por ejemplo, de una presentación). Devuelve true si te hizo ascender.
    addXp(n) {
      const before = this.rankIndex();
      this.data.xp += Math.max(0, Math.round(n));
      const after = this.rankIndex();
      this.data.rankReached = Math.max(this.data.rankReached || 0, after);
      this.save();
      return after > before;
    },

    // --- Favores de Nico: ¿puede pedir uno ahora? (desde Semi-Senior, cada 2 tareas entregadas)
    favorReady() {
      if (!this.data || this.rankIndex() < 2 || this.data.favor) return false;
      const f = this.data.flags;
      return !f.favorsDone || this.workCount() - (f.favorAt || 0) >= 2;
    },
    // Tareas entregadas en total (obligatorias + prácticas).
    workCount() {
      return this.completedCount() + Object.values(this.data.practice || {}).reduce((a, n) => a + n, 0);
    },

    // --- Progreso
    isCompleted(id) {
      return !!this.data.completed[id];
    },
    completedCount() {
      return Object.keys(this.data.completed).length;
    },
    setLessonDone(modId) {
      this.data.lessons[modId] = true;
      this.save();
    },

    // Registra una misión entregada. Las prácticas suman XP solo en los primeros casos de cada
    // nivel y solo mientras ese nivel corresponda a tu rango.
    completeMission(mission, hintsUsed) {
      const before = this.rankIndex();
      const mod = AA.Curriculum.moduleById(mission.module);
      const wasComplete = mod ? AA.Curriculum.isModuleComplete(mod) : false;
      const factor = Math.max(0.4, 1 - 0.15 * hintsUsed);
      let gained = 0;
      let firstTime = true;
      let noXpReason = null;
      if (mission.kind === 'favor') {
        if (this.data.favor === mission.id) {
          gained = Math.round(mission.xp * factor);
          this.data.xp += gained;
          this.data.favor = null;
          this.data.flags.favorsDone = (this.data.flags.favorsDone || 0) + 1;
          this.data.flags.favorAt = this.workCount();
          this.data.flags.lastFavorKind = mission.favorKind || null;
        }
      } else if (mission.kind === 'practice') {
        const p = AA.Curriculum.parseId(mission.id);
        const reward = AA.Curriculum.practiceReward(mod, p.size);
        noXpReason = reward.reason;
        gained = Math.round(reward.xp * factor);
        this.data.xp += gained;
        this.data.practice[mission.module] = (this.data.practice[mission.module] || 0) + 1;
        if (this.data.activePractice[mission.module] === mission.id) delete this.data.activePractice[mission.module];
      } else {
        firstTime = !this.data.completed[mission.id];
        if (firstTime) {
          gained = Math.round(mission.xp * factor);
          this.data.xp += gained;
          this.data.completed[mission.id] = { xp: gained, hints: hintsUsed, at: Date.now() };
        }
      }
      delete this.data.progress[mission.id];
      const after = this.rankIndex();
      this.data.rankReached = after;
      this.save();
      return {
        gained,
        firstTime,
        noXpReason,
        promoted: after > before,
        rank: RANKS[after],
        moduleCompleted: !!mod && !wasComplete && AA.Curriculum.isModuleComplete(mod),
      };
    },
  };

  AA.State = State;
  AA.deptName = (key) => AA.L((DEPTS[key] || { name: key }).name);
  AA.deptColor = (key) => (DEPTS[key] || { color: '#8b95a7' }).color;
})();
