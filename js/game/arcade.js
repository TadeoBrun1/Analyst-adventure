/*
 * Analyst Adventure — Modo ARCADE: misiones una tras otra contra reloj.
 *
 * - Reloj único (supervivencia): cada pedido llega con su plazo, proporcional a lo que lleva
 *   resolverlo (un pedido de Senior trae más tiempo que uno de Junior). Lo que sobra queda de
 *   reserva (con tope). Responder mal, entregar incompleto o saltear resta segundos.
 * - Cada 3 misiones empieza una oleada nueva: los plazos se achican, el reloj corre más rápido,
 *   las penalizaciones crecen, las misiones son más difíciles y la música se acelera.
 * - Balance simulado con jugadores de distinto nivel: ver docs/ARCADE.md.
 * - Se elige el rango (Junior, Semi-Senior, Senior) según lo alcanzado en el modo historia.
 *   Cada rango usa las herramientas de su etapa (solo las que ya te enseñó Leo).
 * - Las misiones son aleatorias (plantilla, datos y orden) y no tienen guía: solo el pedido.
 * - Se guardan las 5 mejores partidas de cada rango: más misiones primero y, a igual cantidad, menos tiempo total.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const T = (es, en) => AA.T(es, en);
  const esc = (s) => AA.escapeHtml(s);
  const Cu = () => AA.Curriculum;
  const ST = () => AA.State;

  const START_TIME = 60; // reserva inicial (segundos), además del plazo del primer pedido
  const RESERVE_CAP = 120; // tope de la reserva que se arrastra al pedido siguiente
  const PER_WAVE = 3; // misiones por oleada
  const speed = (w) => 1 + 0.1 * (w - 1); // cuánto más rápido corre el reloj
  const PENALTY = { wrong: 12, incomplete: 20, skip: 45 };
  const penaltyOf = (kind, w) => Math.round(PENALTY[kind] * (1 + 0.25 * (w - 1)));
  const TIER_WORK = [1, 1.15, 1.3, 1.45];

  // Segundos que le lleva a un jugador promedio resolver el pedido (lectura + cada entregable + preguntas).
  function effort(m) {
    const W = AA.Workspace;
    const tool = W.views(m).some((v) => v.id !== 'sheets');
    let rows = 0;
    for (const sh of W.buildBook(m).sheets) rows = Math.max(rows, sh.rows);
    const mod = Cu().moduleById(m.module);
    const tier = TIER_WORK[(mod && mod.tier) || 0] || 1;
    const q = m.objectives.filter((o) => o.answer).length;
    const ch = m.objectives.filter((o) => o.choices).length;
    const work = m.objectives.length - q - ch;
    return Math.round((tool ? 40 : 30) + work * (tool ? 55 : 40) * tier * (1 + rows / 400) + q * 25 * (1 + rows / 150) + ch * 20);
  }
  // Plazo que trae un pedido: generoso al principio y cada vez más justo.
  const budgetFor = (eff, w) => Math.max(45, Math.round(eff * Math.max(0.35, 1.5 - 0.18 * (w - 1))));

  const RANK_INFO = {
    1: { es: 'Fórmulas, funciones, SI, limpieza y gráficos, más las herramientas de Junior que ya aprendiste: BUSCARV, calidad de datos, tablas dinámicas, SQL y dashboards.', en: 'Formulas, functions, IF, cleaning and charts, plus the Junior tools you already learned: VLOOKUP, data quality, pivot tables, SQL and dashboards.' },
    2: { es: 'Lo de Junior más estadística, dashboards desde cero, análisis de punta a punta y revisión de trabajo ajeno.', en: 'The Junior toolkit plus statistics, dashboards from scratch, end-to-end analyses and reviewing others\' work.' },
    3: { es: 'Lo de Semi-Senior más KPIs, pruebas A/B, datos incompletos y resúmenes ejecutivos.', en: 'The Mid-level toolkit plus KPIs, A/B tests, incomplete data and executive summaries.' },
  };

  // Ranking: más misiones resueltas; a igual cantidad, el que las hizo en menos tiempo total.
  const byRank = (a, b) => b.missions - a.missions || a.secs - b.secs || b.score - a.score;
  const paceOf = (e) => (e.secs > 0 ? (e.missions / (e.secs / 60)).toFixed(2) : '0.00');

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
      return (a[r] || []).slice().sort(byRank);
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
      mission.effort = effort(mission);
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
            <div class="arc-rank-best">${best ? `🏆 ${best.missions} ${T('misiones en', 'missions in')} ${fmtTime(best.secs)} · ${T('oleada', 'wave')} ${best.wave}` : ok ? T('Sin récord todavía', 'No record yet') : ''}</div>
          </button>`;
      };
      AA.Audio.play('unlock');
      AA.UI.modal({
        title: '🕹️ ARCADE · ' + T('Analista bajo presión', 'Analyst under pressure'),
        wide: true,
        className: 'arcade-menu',
        html: `
          <div class="arc-rules">
            <div>⏱ ${T(`Cada pedido llega con su <b>plazo</b>: más tiempo para los pedidos más largos. Lo que te sobra queda de reserva (hasta <b>${fmtTime(RESERVE_CAP)}</b>).`, `Every request comes with its own <b>deadline</b>: longer requests bring more time. What you save stays in reserve (up to <b>${fmtTime(RESERVE_CAP)}</b>).`)}</div>
            <div>🌊 ${T(`Cada <b>${PER_WAVE} misiones</b> llega una oleada nueva: los plazos se achican, el reloj corre más rápido, las penalizaciones crecen y las misiones se ponen más difíciles.`, `Every <b>${PER_WAVE} missions</b> a new wave starts: deadlines shrink, the clock runs faster, penalties grow and missions get harder.`)}</div>
            <div>🏆 ${T('Gana quien resuelve <b>más misiones</b>; a igual cantidad, quien lo hizo en <b>menos tiempo total</b>.', 'Most <b>missions solved</b> wins; on a tie, the shorter <b>total time</b> wins.')}</div>
            <div>🎁 ${T(`<b>${AA.Achievements ? AA.Achievements.LIST.length : 15} logros</b>: cada uno desbloquea un objeto para decorar la oficina (plantas, alfombra, PC gamer, mascotas…). Se ponen desde el <b>cofre</b> al lado de la máquina.`, `<b>${AA.Achievements ? AA.Achievements.LIST.length : 15} achievements</b>: each one unlocks an item to decorate the office (plants, rug, gaming PC, pets…). Place them from the <b>chest</b> next to the machine.`)}</div>
            <div>⚠️ ${T('Responder mal, entregar incompleto o saltear una misión <b>resta tiempo</b>.', 'Wrong answers, incomplete submissions or skipping a mission <b>cost time</b>.')}</div>
            <div>📧 ${T('Sin guía: solo el pedido, como en un trabajo real. Elegí vos qué funciones usar. Tip: seleccioná un rango y mirá la suma y el recuento abajo de la planilla; 📍 pasa el valor de una celda a la respuesta.', 'No guidance: just the request, like a real job. You choose which functions to use. Tip: select a range and check the sum and count below the sheet; 📍 copies a cell\'s value into the answer.')}</div>
          </div>
          <div class="arc-ranks">${[1, 2, 3].map(card).join('')}</div>`,
        buttons: [
          {
            label: `🏆 ${T('Logros', 'Achievements')} ${AA.Achievements ? `${AA.Achievements.count()}/${AA.Achievements.LIST.length}` : ''}`,
            action: () => setTimeout(() => AA.Screens.openNotebook('achievements'), 30),
          },
          { label: T('Volver', 'Back'), primary: true },
        ],
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
        // para los logros
        times: [], // segundos jugados al resolver cada misión
        streak: 0,
        maxStreak: 0,
        minClock: null,
        achieved: [],
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
      // Llega el pedido con su plazo; de lo anterior se arrastra como mucho RESERVE_CAP.
      r.budget = budgetFor(m.effort, r.wave);
      r.clock = Math.min(r.clock, RESERVE_CAP) + r.budget;
      r.clockAtLoad = r.clock;
      setTimeout(() => this.float(`⏱ +${fmtTime(r.budget)}`, 'good'), 150);
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
          <div class="arc-stat"><span>${T('Plazo del pedido', 'Request deadline')}</span><b data-h="budget"></b></div>
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
      set('budget', r.budget ? fmtTime(r.budget) : '—');
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
      r.streak = 0;
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
      // Puntos: base por oleada + bonus por el plazo que sobró.
      const left = Math.max(0, r.budget - (r.clockAtLoad - r.clock));
      const pts = 100 * r.wave + Math.round(left * 2);
      r.score += pts;
      r.missions++;
      r.times.push(r.played);
      r.streak++;
      r.maxStreak = Math.max(r.maxStreak, r.streak);
      r.minClock = r.minClock === null ? r.clock : Math.min(r.minClock, r.clock);
      AA.Audio.play('complete');
      AA.UI.confetti(50);
      this.float(`+${pts} pts`, 'good');
      if (r.missions % PER_WAVE === 0) {
        r.wave++;
        AA.Audio.setTempoFactor(1 + 0.08 * (r.wave - 1));
        AA.Audio.play('levelup');
        this.banner(`🌊 ${T('OLEADA', 'WAVE')} ${r.wave}`, T(`El reloj corre ×${speed(r.wave).toFixed(2)} · misiones más difíciles`, `Clock runs ×${speed(r.wave).toFixed(2)} · harder missions`), () => this.loadMission());
      } else setTimeout(() => this.run && this.loadMission(), 600);
      // Logros de la partida (misiones, oleada, racha, tiempos, sangre fría).
      this.announce(AA.Achievements ? AA.Achievements.check(r) : []);
      this.renderHud();
    },

    // Aviso de logro durante la partida (no frena el reloj).
    announce(list) {
      const r = this.run;
      if (!list || !list.length) return;
      if (r) r.achieved.push(...list);
      list.forEach((a, i) =>
        setTimeout(() => {
          AA.Audio.play('achievement');
          const it = AA.Decor && AA.Decor.byId(a.reward);
          AA.UI.toast(`🏆 <b>${T('¡Logro!', 'Achievement!')} ${esc(AA.L(a.name))}</b><br>🎁 ${esc(it ? AA.L(it.name) : '')}`, 'ok');
        }, 700 + i * 900)
      );
    },

    skip() {
      const r = this.run;
      if (!r || r.banner) return;
      r.skipped++;
      // Saltear devuelve lo que quedaba del plazo de este pedido (si no, saltear daría tiempo gratis).
      r.clock -= Math.max(0, r.budget - (r.clockAtLoad - r.clock));
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
      const list = (st.data.arcade[r.rank] || []).concat([entry]).sort(byRank).slice(0, 5);
      st.data.arcade[r.rank] = list;
      st.save();
      // Logros: se suman las estadísticas de la partida (misiones totales, partidas, mejores marcas).
      const lateAch = AA.Achievements ? AA.Achievements.finishRun(r) : [];
      const allAch = r.achieved.concat(lateAch);
      if (lateAch.length) AA.Audio.play('achievement');
      const achHtml = allAch.length
        ? `<div class="arc-ach">
             <div class="arc-ach-title">🏆 ${T(allAch.length > 1 ? 'Logros nuevos' : 'Logro nuevo', allAch.length > 1 ? 'New achievements' : 'New achievement')}</div>
             ${allAch
               .map((a) => {
                 const it = AA.Decor && AA.Decor.byId(a.reward);
                 return `<div class="arc-ach-row"><canvas data-prev="${a.reward}" width="44" height="44"></canvas><div><b>${a.icon} ${esc(AA.L(a.name))}</b><span>🎁 ${esc(it ? AA.L(it.name) : '')}</span></div></div>`;
               })
               .join('')}
             <div class="muted">${T('Abrí el <b>cofre</b> al lado de la máquina ARCADE para poner tus recompensas en la oficina.', 'Open the <b>chest</b> next to the ARCADE machine to place your rewards in the office.')}</div>
           </div>`
        : '';
      const record = list[0] === entry && r.missions > 0;
      const pace = paceOf(entry);
      AA.Audio.setTempoFactor(1);
      AA.Audio.play(record ? 'fanfare' : 'back');
      if (record) AA.UI.confetti(220);
      const rows = list
        .map((e, i) => `<tr class="${e === entry ? 'me' : ''}"><td>${i + 1}</td><td><b>${e.missions}</b></td><td>${fmtTime(e.secs)}</td><td>${paceOf(e)}</td><td>${e.wave}</td><td>${e.score.toLocaleString('en-US')}</td></tr>`)
        .join('');
      AA.UI.modal({
        title: reason === 'time' ? `⏰ ${T('¡Se acabó el tiempo!', "Time's up!")}` : `🏁 ${T('Partida terminada', 'Run over')}`,
        closable: false,
        className: 'arcade-over' + (record ? ' party' : ''),
        html: `
          ${record ? `<div class="arc-record">🏆 ${T('¡NUEVO RÉCORD!', 'NEW RECORD!')}</div>` : ''}
          ${achHtml}
          <div class="arc-final">
            <div><span>${T('Misiones', 'Missions')}</span><b>${r.missions}</b></div>
            <div><span>${T('Tiempo total', 'Total time')}</span><b>${fmtTime(entry.secs)}</b></div>
            <div><span>${T('Oleada', 'Wave')}</span><b>${r.wave}</b></div>
            <div><span>${T('Puntos', 'Points')}</span><b>${r.score.toLocaleString('en-US')}</b></div>
          </div>
          <p class="muted">${T(`Ritmo: <b>${pace}</b> misiones por minuto · ${r.errors} penalizaciones · ${r.skipped} salteadas.`, `Pace: <b>${pace}</b> missions per minute · ${r.errors} penalties · ${r.skipped} skipped.`)}</p>
          <h3>${T('Mejores partidas', 'Best runs')} · ${esc(AA.L(st.RANKS[r.rank].name))}</h3>
          <p class="muted arc-rank-rule">${T('Gana quien resuelve más misiones; a igual cantidad, quien lo hizo en menos tiempo total.', 'Most missions solved wins; on a tie, the shorter total time wins.')}</p>
          <table class="arc-table"><tr><th>#</th><th>${T('Misiones', 'Missions')}</th><th>${T('Tiempo total', 'Total time')}</th><th>${T('Ritmo', 'Pace')}</th><th>${T('Oleada', 'Wave')}</th><th>${T('Puntos', 'Points')}</th></tr>${rows}</table>`,
        buttons: [
          { label: T('Volver a la oficina', 'Back to the office'), action: () => this.exit() },
          { label: `🔁 ${T('Jugar de nuevo', 'Play again')}`, primary: true, action: () => this.start(r.rank) },
        ],
        onOpen: (el) => AA.Decor && AA.Decor.animatePreviews(el),
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

  Object.assign(Arcade, { effort, budgetFor, byRank, speed, penaltyOf, START_TIME, RESERVE_CAP, PER_WAVE });
  AA.Arcade = Arcade;
})();
