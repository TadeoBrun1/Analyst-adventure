/*
 * Analyst Adventure — Logros del ARCADE.
 * Cada logro tiene un objetivo (en una partida o sumando partidas) y una recompensa: un objeto
 * decorativo para la oficina, que se pone o se saca desde el cofre junto a la máquina ARCADE.
 *
 * Estadísticas guardadas (data.arcadeStats): partidas, misiones totales y los mejores valores de
 * cualquier partida (misiones, oleada, racha sin errores, tiempo para 3 y 6 misiones, menor reloj
 * al entregar y mejor cantidad de misiones por rango).
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const T = (es, en) => ({ es, en });
  const ST = () => AA.State;
  const fmt = (secs) => {
    const s = Math.max(0, Math.round(secs));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const FAST3 = 8 * 60; // 3 misiones en menos de 8:00
  const FAST6 = 18 * 60; // 6 misiones en menos de 18:00
  const COLD = 15; // entregar con menos de 15 s en el reloj

  // v: { missions, wave, streak, t3, t6, minClock, runs, total, byRank }
  const LIST = [
    { id: 'first', icon: '🎮', name: T('Primer pedido', 'First request'), goal: T('Resolvé 1 misión en una partida.', 'Solve 1 mission in a run.'), reward: 'ficus', test: (v) => v.missions >= 1, prog: (v) => [v.missions, 1] },
    { id: 'warmup', icon: '🔥', name: T('Calentando motores', 'Warming up'), goal: T('Resolvé 3 misiones en una partida.', 'Solve 3 missions in a run.'), reward: 'rug', test: (v) => v.missions >= 3, prog: (v) => [v.missions, 3] },
    { id: 'six', icon: '✋', name: T('Media docena', 'Half a dozen'), goal: T('Resolvé 6 misiones en una partida.', 'Solve 6 missions in a run.'), reward: 'espresso', test: (v) => v.missions >= 6, prog: (v) => [v.missions, 6] },
    { id: 'dozen', icon: '📦', name: T('Docena', 'Dozen'), goal: T('Resolvé 12 misiones en una partida.', 'Solve 12 missions in a run.'), reward: 'pcgamer', test: (v) => v.missions >= 12, prog: (v) => [v.missions, 12] },
    { id: 'wave3', icon: '🌊', name: T('Surfeando datos', 'Data surfer'), goal: T('Llegá a la oleada 3.', 'Reach wave 3.'), reward: 'lights', test: (v) => v.wave >= 3, prog: (v) => [v.wave, 3] },
    { id: 'wave5', icon: '🌪️', name: T('Ojo de la tormenta', 'Eye of the storm'), goal: T('Llegá a la oleada 5.', 'Reach wave 5.'), reward: 'cat', test: (v) => v.wave >= 5, prog: (v) => [v.wave, 5] },
    { id: 'wave7', icon: '👑', name: T('Leyenda del ARCADE', 'ARCADE legend'), goal: T('Llegá a la oleada 7.', 'Reach wave 7.'), reward: 'portrait', test: (v) => v.wave >= 7, prog: (v) => [v.wave, 7] },
    {
      id: 'fast3',
      icon: '⏱️',
      name: T('Contrarreloj', 'Against the clock'),
      goal: T(`Resolvé 3 misiones en menos de ${fmt(FAST3)} de partida.`, `Solve 3 missions in under ${fmt(FAST3)} of play.`),
      reward: 'gamerchair',
      test: (v) => v.t3 !== null && v.t3 < FAST3,
      prog: (v) => (v.t3 === null ? null : { best: fmt(v.t3), target: fmt(FAST3) }),
    },
    {
      id: 'fast6',
      icon: '⚡',
      name: T('Velocista', 'Sprinter'),
      goal: T(`Resolvé 6 misiones en menos de ${fmt(FAST6)} de partida.`, `Solve 6 missions in under ${fmt(FAST6)} of play.`),
      reward: 'turntable',
      test: (v) => v.t6 !== null && v.t6 < FAST6,
      prog: (v) => (v.t6 === null ? null : { best: fmt(v.t6), target: fmt(FAST6) }),
    },
    { id: 'steady', icon: '🎯', name: T('Mano firme', 'Steady hand'), goal: T('Resolvé 5 misiones seguidas sin ninguna penalización.', 'Solve 5 missions in a row without any penalty.'), reward: 'aquarium', test: (v) => v.streak >= 5, prog: (v) => [v.streak, 5] },
    {
      id: 'cold',
      icon: '🧊',
      name: T('Sangre fría', 'Ice cold'),
      goal: T(`Entregá una misión con menos de ${COLD} segundos en el reloj.`, `Submit a mission with less than ${COLD} seconds on the clock.`),
      reward: 'bonsai',
      test: (v) => v.minClock !== null && v.minClock < COLD,
      prog: (v) => (v.minClock === null ? null : { best: `${Math.round(v.minClock)} s`, target: `< ${COLD} s` }),
    },
    { id: 'marathon', icon: '🏃', name: T('Maratón', 'Marathon'), goal: T('Resolvé 25 misiones sumando todas tus partidas.', 'Solve 25 missions across all your runs.'), reward: 'dog', test: (v) => v.total >= 25, prog: (v) => [v.total, 25] },
    { id: 'regular', icon: '🪙', name: T('Cliente fiel', 'Regular'), goal: T('Jugá 10 partidas.', 'Play 10 runs.'), reward: 'donuts', test: (v) => v.runs >= 10, prog: (v) => [v.runs, 10] },
    {
      id: 'allranks',
      icon: '🧭',
      name: T('Todoterreno', 'All-rounder'),
      goal: T('Resolvé al menos 3 misiones en una partida de cada rango (Junior, Semi-Senior y Senior).', 'Solve at least 3 missions in a run of each rank (Junior, Mid-level and Senior).'),
      reward: 'neon',
      test: (v) => [1, 2, 3].every((r) => (v.byRank[r] || 0) >= 3),
      prog: (v) => [[1, 2, 3].filter((r) => (v.byRank[r] || 0) >= 3).length, 3],
    },
    { id: 'senior9', icon: '🏆', name: T('Senior bajo presión', 'Senior under pressure'), goal: T('Resolvé 9 misiones en una partida de rango Senior.', 'Solve 9 missions in a Senior run.'), reward: 'trophy', test: (v) => (v.byRank[3] || 0) >= 9, prog: (v) => [v.byRank[3] || 0, 9] },
  ];

  const freshStats = () => ({ runs: 0, missions: 0, bestMissions: 0, bestWave: 1, bestStreak: 0, best3: null, best6: null, minClock: null, byRank: {} });
  const minN = (a, b) => (a === null || a === undefined ? b : b === null || b === undefined ? a : Math.min(a, b));

  const Achievements = {
    LIST,
    FAST3,
    FAST6,
    COLD,
    byId: (id) => LIST.find((a) => a.id === id),
    stats() {
      const st = ST();
      if (!st.data.arcadeStats) st.data.arcadeStats = freshStats();
      return Object.assign(freshStats(), st.data.arcadeStats);
    },
    unlocked(id) {
      const a = ST().data && ST().data.achievements;
      return !!(a && a[id]);
    },
    count() {
      return LIST.filter((a) => this.unlocked(a.id)).length;
    },
    rewardUnlocked(decorId) {
      return LIST.some((a) => a.reward === decorId && this.unlocked(a.id));
    },
    achievementFor(decorId) {
      return LIST.find((a) => a.reward === decorId);
    },

    // Vista combinada: lo mejor guardado + la partida en curso (si hay).
    view(run) {
      const s = this.stats();
      const v = {
        missions: s.bestMissions,
        wave: s.bestWave,
        streak: s.bestStreak,
        t3: s.best3,
        t6: s.best6,
        minClock: s.minClock,
        runs: s.runs,
        total: s.missions,
        byRank: Object.assign({}, s.byRank),
      };
      if (run) {
        v.missions = Math.max(v.missions, run.missions);
        v.wave = Math.max(v.wave, run.wave);
        v.streak = Math.max(v.streak, run.maxStreak || 0);
        v.t3 = minN(v.t3, run.times && run.times[2] !== undefined ? run.times[2] : null);
        v.t6 = minN(v.t6, run.times && run.times[5] !== undefined ? run.times[5] : null);
        v.minClock = minN(v.minClock, run.minClock === undefined ? null : run.minClock);
        v.total += run.missions;
        v.runs += run.over ? 1 : 0;
        v.byRank[run.rank] = Math.max(v.byRank[run.rank] || 0, run.missions);
      }
      return v;
    },

    // Revisa los logros con la partida en curso; devuelve los nuevos.
    check(run) {
      const st = ST();
      const v = this.view(run);
      const fresh = [];
      st.data.achievements = st.data.achievements || {};
      for (const a of LIST) {
        if (st.data.achievements[a.id]) continue;
        if (a.test(v)) {
          st.data.achievements[a.id] = Date.now();
          fresh.push(a);
        }
      }
      if (fresh.length) {
        st.data.flags.chestNew = true;
        st.save();
      }
      return fresh;
    },

    // Al terminar la partida: se suman las estadísticas y se revisa todo.
    finishRun(run) {
      const st = ST();
      run.over = true;
      const fresh = this.check(run);
      const s = this.stats();
      s.runs += 1;
      s.missions += run.missions;
      s.bestMissions = Math.max(s.bestMissions, run.missions);
      s.bestWave = Math.max(s.bestWave, run.wave);
      s.bestStreak = Math.max(s.bestStreak, run.maxStreak || 0);
      if (run.times && run.times[2] !== undefined) s.best3 = minN(s.best3, run.times[2]);
      if (run.times && run.times[5] !== undefined) s.best6 = minN(s.best6, run.times[5]);
      if (run.minClock !== undefined && run.minClock !== null) s.minClock = minN(s.minClock, run.minClock);
      s.byRank = Object.assign({}, s.byRank, { [run.rank]: Math.max(s.byRank[run.rank] || 0, run.missions) });
      st.data.arcadeStats = s;
      st.save();
      return fresh;
    },

    // Texto de progreso de un logro (para la libreta).
    progressText(a) {
      const v = this.view(null);
      const p = a.prog(v);
      if (this.unlocked(a.id)) return AA.T('¡Conseguido!', 'Unlocked!');
      if (p === null) return AA.T('Todavía sin intentos', 'No attempts yet');
      if (Array.isArray(p)) return `${AA.T('Mejor', 'Best')}: ${Math.min(p[0], p[1])}/${p[1]}`;
      return `${AA.T('Mejor', 'Best')}: ${p.best} · ${AA.T('objetivo', 'target')} ${p.target}`;
    },
    progressRatio(a) {
      if (this.unlocked(a.id)) return 1;
      const p = a.prog(this.view(null));
      return Array.isArray(p) ? Math.min(1, p[0] / p[1]) : 0;
    },
  };

  const esc = (x) => AA.escapeHtml(String(x));
  const L = (o) => AA.L(o);

  Object.assign(Achievements, {
    // --- Cofre junto a la máquina ARCADE: poner o guardar cada recompensa.
    openChest() {
      const st = ST();
      st.data.flags.chestNew = false;
      st.save();
      AA.Audio.play('chest');
      const D = AA.Decor;
      const total = D.ITEMS.length;
      const render = (el) => {
        const grid = el.querySelector('.chest-grid');
        const got = D.ITEMS.filter((it) => D.unlocked(it.id)).length;
        el.querySelector('[data-el="chest-count"]').textContent = `${got}/${total}`;
        grid.innerHTML = D.ITEMS.map((it) => {
          const a = this.achievementFor(it.id);
          const ok = D.unlocked(it.id);
          const on = D.on(it.id);
          return `
            <div class="chest-item ${ok ? '' : 'locked'} ${on ? 'on' : ''}">
              <canvas data-prev="${it.id}"></canvas>
              <div class="chest-name">${ok ? it.icon : '🔒'} ${esc(L(it.name))}</div>
              <div class="chest-desc">${ok ? esc(L(it.desc)) : `${AA.T('Logro', 'Achievement')} <b>${a.icon} ${esc(L(a.name))}</b>: ${esc(L(a.goal))}`}</div>
              ${ok ? `<button type="button" class="btn btn-sm ${on ? '' : 'btn-primary'}" data-toggle="${it.id}" data-nav>${on ? AA.T('📦 Guardar en el cofre', '📦 Put back in the chest') : AA.T('✨ Poner en la oficina', '✨ Place in the office')}</button>` : ''}
            </div>`;
        }).join('');
        grid.querySelectorAll('[data-toggle]').forEach((b) =>
          b.addEventListener('click', () => {
            const id = b.dataset.toggle;
            const on = !D.on(id);
            D.set(id, on);
            AA.Audio.play(on ? 'unlock' : 'back');
            const it = D.byId(id);
            AA.UI.toast(on ? AA.T(`✨ ${L(it.name)} ya está en la oficina.`, `✨ ${L(it.name)} is now in the office.`) : AA.T(`📦 ${L(it.name)} volvió al cofre.`, `📦 ${L(it.name)} went back into the chest.`), 'info');
            render(el);
            const again = el.querySelector(`[data-toggle="${id}"]`);
            if (again) again.focus({ preventScroll: true });
          })
        );
        D.animatePreviews(grid);
      };
      AA.UI.modal({
        title: '🎁 ' + AA.T('Cofre de recompensas', 'Rewards chest'),
        wide: true,
        className: 'chest-modal',
        html: `<p class="muted chest-intro">${AA.T('Cada <b>logro del ARCADE</b> desbloquea un objeto para decorar la oficina. Ponelos o guardalos cuando quieras.', 'Each <b>ARCADE achievement</b> unlocks an item to decorate the office. Place them or put them away whenever you like.')} <b data-el="chest-count"></b></p><div class="chest-grid"></div>`,
        buttons: [
          { label: `🏆 ${AA.T('Ver logros', 'See achievements')}`, action: () => setTimeout(() => AA.Screens.openNotebook('achievements'), 30) },
          { label: AA.T('Cerrar', 'Close'), primary: true },
        ],
        onOpen: render,
      });
    },

    // --- Página de la libreta: nombre, objetivo, progreso y recompensa (con vista previa).
    notebookPage() {
      const D = AA.Decor;
      const n = this.count();
      const cards = LIST.map((a) => {
        const ok = this.unlocked(a.id);
        const it = D.byId(a.reward);
        const ratio = Math.round(this.progressRatio(a) * 100);
        return `
          <div class="ach-card ${ok ? 'done' : ''}">
            <div class="ach-head"><span class="ach-icon">${ok ? a.icon : '🔒'}</span><div><b>${esc(L(a.name))}</b><div class="ach-goal">${esc(L(a.goal))}</div></div></div>
            <div class="ach-bar"><i style="width:${ratio}%"></i></div>
            <div class="ach-prog">${esc(this.progressText(a))}</div>
            <div class="ach-reward"><canvas data-prev="${a.reward}"></canvas><div><span class="muted">🎁 ${AA.T('Recompensa', 'Reward')}</span><b>${it.icon} ${esc(L(it.name))}</b><span class="ach-rdesc">${esc(L(it.desc))}</span></div></div>
          </div>`;
      }).join('');
      return `<h2>🏆 ${AA.T('Logros del ARCADE', 'ARCADE achievements')} · ${n}/${LIST.length}</h2>
        <p class="nb-say">${AA.T('Jugá en la máquina ARCADE del living para conseguirlos. Cada logro te da un objeto para decorar la oficina: se pone o se saca desde el <b>cofre</b> al lado de la máquina.', 'Play the ARCADE machine in the lounge to earn them. Each achievement gives you an item to decorate the office: place it or remove it from the <b>chest</b> next to the machine.')}</p>
        <div class="ach-grid">${cards}</div>`;
    },
  });

  AA.Achievements = Achievements;
})();
