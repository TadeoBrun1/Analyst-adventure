/*
 * Analyst Adventure — Modo ARCADE: misiones una tras otra contra reloj.
 *
 * - Reloj único (supervivencia): resolver una misión suma segundos y puntos; responder mal,
 *   entregar incompleto o saltear una misión resta segundos.
 * - Cada 3 misiones empieza una oleada nueva: el reloj corre más rápido, las penalizaciones
 *   crecen, las misiones son más difíciles (y con tablas más grandes) y la música se acelera.
 * - Se elige el rango (Junior, Semi-Senior, Senior) según lo alcanzado en el modo historia.
 *   Cada rango usa las herramientas de su etapa (solo las que ya te enseñó Leo).
 * - Las misiones son aleatorias (plantilla, datos y orden) y no tienen guía: solo el pedido.
 * - Se guardan las mejores puntuaciones de cada rango en la partida.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const T = (es, en) => AA.T(es, en);
  const esc = (s) => AA.escapeHtml(s);
  const Cu = () => AA.Curriculum;
  const ST = () => AA.State;

  const START_TIME = 240; // segundos
  const PER_WAVE = 3; // misiones por oleada
  const gain = (w) => Math.max(40, 85 - (w - 1) * 9); // segundos que suma resolver una misión
  const speed = (w) => 1 + 0.15 * (w - 1); // cuánto más rápido corre el reloj
  const PENALTY = { wrong: 12, incomplete: 20, skip: 45 };
  const penaltyOf = (kind, w) => Math.round(PENALTY[kind] * (1 + 0.25 * (w - 1)));

  const RANK_INFO = {
    1: { es: 'Fórmulas, funciones, SI, limpieza y gráficos, más las herramientas de Junior que ya aprendiste: BUSCARV, calidad de datos, tablas dinámicas, SQL y dashboards.', en: 'Formulas, functions, IF, cleaning and charts, plus the Junior tools you already learned: VLOOKUP, data quality, pivot tables, SQL and dashboards.' },
    2: { es: 'Lo de Junior más estadística, dashboards desde cero, análisis de punta a punta y revisión de trabajo ajeno.', en: 'The Junior toolkit plus statistics, dashboards from scratch, end-to-end analyses and reviewing others\' work.' },
    3: { es: 'Lo de Semi-Senior más KPIs, pruebas A/B, datos incompletos y resúmenes ejecutivos.', en: 'The Mid-level toolkit plus KPIs, A/B tests, incomplete data and executive summaries.' },
  };

  const fmtTime = (secs) => {
    const s = Math.max(0, Math.ceil(secs));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const Arcade = {
    run: null,

    // Rangos que se pueden jugar: hasta el alcanzado en el modo historia (Pasante no tiene ARCADE).
    unlocked(r) {
      return ST().rankIndex() >= r;
    },
    scores(r) {
      const a = (ST().data && ST().data.arcade) || {};
      return a[r] || [];
    },

    // Niveles que entran en un rango: la etapa anterior y la propia (solo lo que ya te enseñaron).
    pool(rank) {
      const mods = Cu().MODULES.filter((m) => (m.tier === rank - 1 || m.tier === rank) && (m.tier < rank || Cu().lessonDone(m)));
      return mods.length >= 3 ? mods : Cu().MODULES.filter((m) => m.tier <= rank && Cu().lessonDone(m));
    },
    // Ventana del pool según la oleada: arranca con lo más básico y va subiendo.
    windowFor(rank, wave) {
      const L = this.pool(rank);
      const n = L.length;
      let end = Math.min(n, Math.max(3, Math.ceil(n * (0.4 + 0.2 * (wave - 1)))));
      let start = Math.min(Math.max(0, Math.floor(n * 0.15 * (wave - 1))), Math.max(0, end - 3));
      return L.slice(start, end);
    },

    newMission() {
      const r = this.run;
      const mods = this.windowFor(r.rank, r.wave);
      const options = [];
      for (const m of mods) for (const t of m.templates) if (!r.recent.includes(t)) options.push({ m, t });
      const list = options.length ? options : mods.flatMap((m) => m.templates.map((t) => ({ m, t })));
      const pick = list[Math.floor(Math.random() * list.length)];
      r.recent.push(pick.t);
      if (r.recent.length > 8) r.recent.shift();
      const seed = Math.floor(Math.random() * 1e9);
      const size = r.wave >= 4 ? 'large' : 'medium';
      const mission = AA.Content.build(pick.t, { seed, size, lang: AA.lang });
      mission.id = `a:${pick.m.id}:${pick.t}:${seed}`;
      mission.kind = 'arcade';
      mission.module = pick.m.id;
      mission.xp = 0;
      return mission;
    },

    // --- Menú de la máquina
    openMenu() {
      const st = ST();
      st.data.flags.arcadeSeen = true;
      st.save();
      const card = (r) => {
        const rank = st.RANKS[r];
        const best = this.scores(r)[0];
        const ok = this.unlocked(r);
        return `
          <button class="arc-rank ${ok ? '' : 'locked'}" data-rank="${r}" data-nav ${ok ? '' : 'disabled'}>
            <div class="arc-rank-name">${ok ? '🕹️' : '🔒'} ${esc(AA.L(rank.name))}</div>
            <div class="arc-rank-desc">${ok ? AA.L(RANK_INFO[r]) : T(`Llegá a <b>${esc(rank.name.es)}</b> en el modo historia para desbloquearlo.`, `Reach <b>${esc(rank.name.en)}</b> in story mode to unlock it.`)}</div>
            <div class="arc-rank-best">${best ? `🏆 ${best.score.toLocaleString('en-US')} pts · ${best.missions} ${T('misiones', 'missions')} · ${fmtTime(best.secs)}` : ok ? T('Sin récord todavía', 'No record yet') : ''}</div>
          </button>`;
      };
      AA.Audio.play('unlock');
      AA.UI.modal({
        title: '🕹️ ARCADE · ' + T('Analista bajo presión', 'Analyst under pressure'),
        wide: true,
        className: 'arcade-menu',
        html: `
          <div class="arc-rules">
            <div>⏱ ${T(`Arrancás con <b>${fmtTime(START_TIME)}</b>. Cada misión resuelta suma tiempo y puntos.`, `You start with <b>${fmtTime(START_TIME)}</b>. Every solved mission adds time and points.`)}</div>
            <div>🌊 ${T(`Cada <b>${PER_WAVE} misiones</b> llega una oleada nueva: el reloj corre más rápido, las penalizaciones crecen y las misiones se ponen más difíciles.`, `Every <b>${PER_WAVE} missions</b> a new wave starts: the clock runs faster, penalties grow and missions get harder.`)}</div>
            <div>⚠️ ${T('Responder mal, entregar incompleto o saltear una misión <b>resta tiempo</b>.', 'Wrong answers, incomplete submissions or skipping a mission <b>cost time</b>.')}</div>
            <div>📧 ${T('Sin guía: solo el pedido, como en un trabajo real. Elegí vos qué funciones usar. Tip: seleccioná un rango y mirá la suma y el recuento abajo de la planilla; 📍 pasa el valor de una celda a la respuesta.', 'No guidance: just the request, like a real job. You choose which functions to use. Tip: select a range and check the sum and count below the sheet; 📍 copies a cell\'s value into the answer.')}</div>
          </div>
          <div class="arc-ranks">${[1, 2, 3].map(card).join('')}</div>`,
        buttons: [{ label: T('Volver', 'Back'), primary: true }],
        onOpen: (el) =>
          el.querySelectorAll('[data-rank]').forEach((b) =>
            b.addEventListener('click', () => {
              if (b.disabled) return;
              AA.UI.closeModal(true);
              this.start(+b.dataset.rank);
            })
          ),
      });
    },

    // --- Partida
    start(rank) {
      this.run = {
        rank,
        wave: 1,
        clock: START_TIME,
        played: 0,
        score: 0,
        missions: 0,
        skipped: 0,
        errors: 0,
        recent: [],
        missionStart: 0,
        paused: false,
      };
      AA.Audio.setTempoFactor(1);
      if (AA.Screens.MissionScreen.mission) AA.Screens.MissionScreen.leave(() => {});
      AA.Game.show('arcade');
      this.banner(T('¡A JUGAR!', "LET'S GO!"), T(`Rango ${AA.L(ST().RANKS[rank].name)} · Oleada 1`, `${AA.L(ST().RANKS[rank].name)} rank · Wave 1`), () => this.loadMission());
      this.last = performance.now();
      clearInterval(this.timer);
      this.timer = setInterval(() => this.tick(), 100);
    },

    loadMission() {
      const r = this.run;
      if (!r) return;
      const m = this.newMission();
      r.mission = m;
      r.missionStart = r.played;
      if (AA.Screens.MissionScreen.mission) AA.Screens.MissionScreen.leave(() => {});
      AA.Screens.MissionScreen.open(m.id, { mission: m, arcade: true });
      this.renderHud();
    },

    tick() {
      const r = this.run;
      if (!r) return;
      const now = performance.now();
      const dt = Math.min(0.5, (now - this.last) / 1000);
      this.last = now;
      // El reloj se frena con la pausa, los carteles y cualquier cuadro abierto.
      if (r.paused || r.banner || AA.UI.isModalOpen() || document.hidden) return;
      r.played += dt;
      r.clock -= dt * speed(r.wave);
      if (r.clock <= 0) {
        r.clock = 0;
        this.renderHud();
        this.gameOver('time');
        return;
      }
      this.renderHud();
    },

    renderHud() {
      const r = this.run;
      const hud = document.querySelector('[data-el="arc-hud"]');
      if (!r || !hud) return;
      const low = r.clock < 30;
      if (!hud.dataset.built) {
        hud.dataset.built = '1';
        hud.innerHTML = `
          <div class="arc-clock" data-h="clock"></div>
          <div class="arc-stat"><span>${T('Oleada', 'Wave')}</span><b data-h="wave"></b></div>
          <div class="arc-stat"><span>${T('Puntos', 'Points')}</span><b data-h="score"></b></div>
          <div class="arc-stat"><span>${T('Misiones', 'Missions')}</span><b data-h="missions"></b></div>
          <div class="arc-stat arc-speed"><span>${T('Velocidad', 'Speed')}</span><b data-h="speed"></b></div>
          <div class="arc-mission" data-h="title"></div>`;
      }
      const set = (k, v) => {
        const e = hud.querySelector(`[data-h="${k}"]`);
        if (e && e.textContent !== String(v)) e.textContent = v;
      };
      set('clock', '⏱ ' + fmtTime(r.clock));
      hud.querySelector('[data-h="clock"]').classList.toggle('low', low);
      set('wave', r.wave);
      set('score', r.score.toLocaleString('en-US'));
      set('missions', r.missions);
      set('speed', '×' + speed(r.wave).toFixed(2));
      set('title', r.mission ? r.mission.subject : '');
      const cost = document.querySelector('[data-el="skipcost"]');
      if (cost) cost.textContent = `−${penaltyOf('skip', r.wave)}s`;
    },

    // Texto flotante sobre el reloj (+puntos, −segundos).
    float(text, kind) {
      const hud = document.querySelector('[data-el="arc-hud"]');
      if (!hud) return;
      const el = document.createElement('div');
      el.className = 'arc-float ' + kind;
      el.textContent = text;
      hud.appendChild(el);
      setTimeout(() => el.remove(), 1400);
      if (kind === 'bad') {
        const c = hud.querySelector('.arc-clock');
        c.classList.remove('hit');
        void c.offsetWidth;
        c.classList.add('hit');
      }
    },

    penalty(kind) {
      const r = this.run;
      if (!r) return;
      const p = penaltyOf(kind, r.wave);
      r.clock -= p;
      r.errors++;
      AA.Audio.play('error');
      this.float(`−${p}s`, 'bad');
      if (r.clock <= 0) {
        r.clock = 0;
        this.gameOver('time');
      } else this.renderHud();
    },

    submit(allOk, missing) {
      const r = this.run;
      if (!r || r.banner) return;
      if (!allOk) {
        AA.UI.toast(T(`📤 Todavía falta algo del pedido (${missing} ${missing === 1 ? 'requisito' : 'requisitos'}). Revisalo.`, `📤 Something from the request is still missing (${missing} ${missing === 1 ? 'requirement' : 'requirements'}). Check it.`), 'warn');
        this.penalty('incomplete');
        return;
      }
      const spent = r.played - r.missionStart;
      const pts = 100 * r.wave + Math.max(0, Math.round((150 - spent) * 2));
      const g = gain(r.wave);
      r.score += pts;
      r.clock += g;
      r.missions++;
      AA.Audio.play('complete');
      AA.UI.confetti(50);
      this.float(`+${pts} pts · +${g}s`, 'good');
      if (r.missions % PER_WAVE === 0) {
        r.wave++;
        AA.Audio.setTempoFactor(1 + 0.08 * (r.wave - 1));
        AA.Audio.play('levelup');
        this.banner(`🌊 ${T('OLEADA', 'WAVE')} ${r.wave}`, T(`El reloj corre ×${speed(r.wave).toFixed(2)} · misiones más difíciles`, `Clock runs ×${speed(r.wave).toFixed(2)} · harder missions`), () => this.loadMission());
      } else setTimeout(() => this.run && this.loadMission(), 600);
      this.renderHud();
    },

    skip() {
      const r = this.run;
      if (!r || r.banner) return;
      r.skipped++;
      this.penalty('skip');
      if (this.run) this.loadMission();
    },

    // Cartel grande (inicio y cada oleada). Mientras se ve, el reloj no corre.
    banner(title, sub, then) {
      const r = this.run;
      if (!r) return;
      r.banner = true;
      const el = document.createElement('div');
      el.className = 'arc-banner';
      el.innerHTML = `<div class="arc-banner-title">${title}</div><div class="arc-banner-sub">${sub}</div>`;
      document.body.appendChild(el);
      setTimeout(() => {
        el.classList.add('out');
        setTimeout(() => el.remove(), 350);
        if (this.run) this.run.banner = false;
        this.last = performance.now();
        if (then) then();
      }, 1700);
    },

    pause() {
      const r = this.run;
      if (!r || r.banner) return;
      AA.UI.modal({
        title: '⏸ ' + T('Pausa', 'Paused'),
        html: `<p>${T('El reloj está detenido.', 'The clock is stopped.')}</p>`,
        buttons: [
          { label: T('Abandonar', 'Quit'), action: () => this.gameOver('quit') },
          { label: T('Seguir', 'Resume'), primary: true },
        ],
        onClose: () => (this.last = performance.now()),
      });
    },
    confirmQuit() {
      if (!this.run) return;
      AA.UI.modal({
        title: T('¿Abandonar la partida?', 'Quit this run?'),
        html: `<p>${T('Se guarda la puntuación que llevás hasta ahora.', 'Your score so far will be saved.')}</p>`,
        buttons: [
          { label: T('Seguir jugando', 'Keep playing') },
          { label: T('Abandonar', 'Quit'), primary: true, action: () => this.gameOver('quit') },
        ],
        onClose: () => (this.last = performance.now()),
      });
    },

    gameOver(reason) {
      const r = this.run;
      if (!r) return;
      clearInterval(this.timer);
      this.run = null;
      const st = ST();
      const entry = { score: r.score, missions: r.missions, wave: r.wave, secs: Math.round(r.played), at: Date.now() };
      st.data.arcade = st.data.arcade || {};
      const list = (st.data.arcade[r.rank] || []).concat([entry]).sort((a, b) => b.score - a.score || b.missions - a.missions).slice(0, 5);
      st.data.arcade[r.rank] = list;
      st.save();
      const record = list[0] === entry && r.score > 0;
      const pace = r.played > 0 ? (r.missions / (r.played / 60)).toFixed(2) : '0';
      AA.Audio.setTempoFactor(1);
      AA.Audio.play(record ? 'fanfare' : 'back');
      if (record) AA.UI.confetti(220);
      const rows = list
        .map((e, i) => `<tr class="${e === entry ? 'me' : ''}"><td>${i + 1}</td><td><b>${e.score.toLocaleString('en-US')}</b></td><td>${e.missions}</td><td>${e.wave}</td><td>${fmtTime(e.secs)}</td></tr>`)
        .join('');
      AA.UI.modal({
        title: reason === 'time' ? `⏰ ${T('¡Se acabó el tiempo!', "Time's up!")}` : `🏁 ${T('Partida terminada', 'Run over')}`,
        closable: false,
        className: 'arcade-over' + (record ? ' party' : ''),
        html: `
          ${record ? `<div class="arc-record">🏆 ${T('¡NUEVO RÉCORD!', 'NEW RECORD!')}</div>` : ''}
          <div class="arc-final">
            <div><span>${T('Puntos', 'Points')}</span><b>${r.score.toLocaleString('en-US')}</b></div>
            <div><span>${T('Misiones', 'Missions')}</span><b>${r.missions}</b></div>
            <div><span>${T('Oleada', 'Wave')}</span><b>${r.wave}</b></div>
            <div><span>${T('Tiempo jugado', 'Time played')}</span><b>${fmtTime(entry.secs)}</b></div>
          </div>
          <p class="muted">${T(`Ritmo: <b>${pace}</b> misiones por minuto · ${r.errors} penalizaciones · ${r.skipped} salteadas.`, `Pace: <b>${pace}</b> missions per minute · ${r.errors} penalties · ${r.skipped} skipped.`)}</p>
          <h3>${T('Mejores partidas', 'Best runs')} · ${esc(AA.L(st.RANKS[r.rank].name))}</h3>
          <table class="arc-table"><tr><th>#</th><th>${T('Puntos', 'Points')}</th><th>${T('Misiones', 'Missions')}</th><th>${T('Oleada', 'Wave')}</th><th>${T('Tiempo', 'Time')}</th></tr>${rows}</table>`,
        buttons: [
          { label: T('Volver a la oficina', 'Back to the office'), action: () => this.exit() },
          { label: `🔁 ${T('Jugar de nuevo', 'Play again')}`, primary: true, action: () => this.start(r.rank) },
        ],
      });
    },

    exit() {
      clearInterval(this.timer);
      this.run = null;
      AA.Audio.setTempoFactor(1);
      if (AA.Screens.MissionScreen.mission) AA.Screens.MissionScreen.leave(() => {});
      AA.Game.enterOffice();
    },
  };

  AA.Arcade = Arcade;
})();
