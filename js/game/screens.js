/*
 * Analyst Adventure — Pantallas: bandeja de entrada (niveles y práctica), planilla de misión,
 * libreta de habilidades y plan de carrera.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const F = AA.Formula;
  const esc = (s) => AA.escapeHtml(s);
  const T = (es, en) => AA.T(es, en);
  const Cu = () => AA.Curriculum;
  const levelNum = (mod) => Cu().MODULES.indexOf(mod) + 1;

  // Misiones armadas (se cachean por id + idioma).
  const cache = new Map();
  function getMission(id, lang) {
    const key = id + '|' + lang;
    if (!cache.has(key)) cache.set(key, Cu().build(id, lang));
    return cache.get(key);
  }

  // -------------------------------------------------------------------------
  // Bandeja de entrada
  // -------------------------------------------------------------------------
  const Inbox = {
    selected: null,

    defaultSelection() {
      const pending = Cu().pendingLesson();
      if (pending) return 'lesson:' + pending.id;
      const next = Cu().nextMission();
      if (next) return next;
      const practiceMod = [...Cu().MODULES].reverse().find((m) => Cu().isModuleComplete(m));
      return practiceMod ? 'practice:' + practiceMod.id : null;
    },

    render() {
      const st = AA.State;
      const root = document.getElementById('screen-computer');
      if (!this.selected || !this.isSelectable(this.selected)) this.selected = this.defaultSelection();
      // Una sección plegable por etapa (rango); lo que el jugador abre o cierra queda guardado.
      const tiers = [...new Set(Cu().MODULES.map((m) => m.tier))];
      const groups = tiers.map((tier) => this.renderStage(tier)).join('');
      root.innerHTML = `
        <div class="monitor">
          <div class="os-bar">
            <div class="os-title">📨 CóndorMail <span>· ${esc(st.data.name)} — ${esc(AA.L(st.rank().name))}</span></div>
            <button class="btn btn-ghost" data-act="back">← ${T('Volver a la oficina', 'Back to the office')} <kbd>Esc</kbd></button>
          </div>
          <div class="mail">
            <aside class="mail-list">${this.renderFavor()}${groups}
              <div class="stage-head future"><span class="chev">🔒</span>${T('Etapa Lead · próximamente', 'Lead stage · coming soon')}</div>
              <div class="mail-group future">
                <div class="mail-item locked"><div class="mail-subject">${T('Estrategia de datos, priorizar pedidos, acordar métricas con las áreas y gobierno de datos', 'Data strategy, prioritizing requests, agreeing on metrics with other teams and data governance')}</div></div>
              </div>
            </aside>
            <article class="mail-view">${this.renderView()}</article>
          </div>
        </div>`;
      root.querySelector('[data-act="back"]').addEventListener('click', () => AA.Game.enterOffice());
      root.querySelectorAll('[data-stage]').forEach((b) =>
        b.addEventListener('click', () => {
          const sec = b.closest('.stage');
          const open = !sec.classList.contains('open');
          sec.classList.toggle('open', open);
          b.setAttribute('aria-expanded', open);
          const flags = st.data.flags;
          flags.stages = Object.assign({}, flags.stages, { [b.dataset.stage]: open });
          st.save();
          AA.Audio.play(open ? 'page' : 'move');
        })
      );
      root.querySelectorAll('[data-sel]').forEach((b) =>
        b.addEventListener('click', () => {
          AA.Audio.play('move');
          this.selected = b.dataset.sel;
          this.render();
        })
      );
      root.querySelectorAll('[data-open]').forEach((b) =>
        b.addEventListener('click', () => {
          AA.Audio.play('select');
          AA.Game.openMission(b.dataset.open);
        })
      );
      root.querySelectorAll('[data-practice]').forEach((b) =>
        b.addEventListener('click', () => {
          AA.Audio.play('select');
          const [modId, size] = b.dataset.practice.split(':');
          AA.Game.startPractice(Cu().moduleById(modId), size);
        })
      );
      const discard = root.querySelector('[data-discard]');
      if (discard) {
        discard.addEventListener('click', () => {
          const modId = discard.dataset.discard;
          const id = st.data.activePractice[modId];
          delete st.data.activePractice[modId];
          delete st.data.progress[id];
          st.save();
          AA.Audio.play('back');
          this.render();
        });
      }
      const goLeo = root.querySelector('[data-act="leo"]');
      if (goLeo) goLeo.addEventListener('click', () => AA.Game.enterOffice());
      const active = root.querySelector('.mail-item.active');
      if (active) active.scrollIntoView({ block: 'nearest' });
    },

    isSelectable(sel) {
      if (sel.startsWith('f:')) return AA.State.data.favor === sel;
      if (sel.startsWith('lesson:') || sel.startsWith('practice:') || sel.startsWith('locked:')) return true;
      return Cu().missionAvailable(sel);
    },

    // Pedido de Nico en curso (desde Semi-Senior): siempre arriba de todo, en verde agua.
    renderFavor() {
      const st = AA.State;
      const id = st.data.favor;
      if (!id) return '';
      const m = getMission(id, (st.data.progress[id] && st.data.progress[id].lang) || AA.lang);
      const status = st.data.progress[id] ? `<span class="chip prog">✎ ${T('En progreso', 'In progress')}</span>` : `<span class="chip favor">🤝 ${T('Favor', 'Favor')}</span>`;
      // Con guía si pide algo que todavía no hiciste; si ya lo sabés, solo el pedido (como en un trabajo real).
      const guide = Cu().favorKnown(id)
        ? `<span class="chip" title="${T('Ya hiciste este tipo de tarea: solo el pedido, sin paso a paso.', 'You already did this kind of task: just the request, no step-by-step.')}">📧 ${T('Sin guía', 'No guide')}</span>`
        : `<span class="chip" title="${T('Es algo que todavía no hiciste: viene con los pasos explicados.', 'Something you have not done yet: it comes with the steps explained.')}">📘 ${T('Con guía', 'Guided')}</span>`;
      return `
        <div class="mail-group favor-group">
          <div class="mail-group-head">🤝 ${T('Favores de Nico', 'Favors for Nico')}<span>+${m.xp} XP</span></div>
          <button class="mail-item favor ${this.selected === id ? 'active' : ''}" data-sel="${id}">
            <div class="mail-from">Nico Ferreyra ${AA.UI.deptBadge('data')}</div>
            <div class="mail-subject">${esc(m.subject)}</div>
            <div class="mail-meta">${status}${guide}<span class="xp">+${m.xp} XP</span></div>
          </button>
        </div>`;
    },

    // ¿La etapa está desplegada? Lo que eligió el jugador manda; si no eligió, se abre la etapa actual.
    stageOpen(tier) {
      const saved = AA.State.data.flags.stages;
      if (saved && saved[tier] !== undefined) return !!saved[tier];
      const cur = Cu().currentModule();
      const curTier = cur ? cur.tier : AA.State.rankIndex();
      return tier === curTier;
    },
    isNew(id) {
      const st = AA.State;
      return Cu().missionAvailable(id) && !st.isCompleted(id) && !st.data.progress[id];
    },
    renderStage(tier) {
      const rank = AA.State.RANKS[tier];
      const mods = Cu().MODULES.filter((m) => m.tier === tier);
      const done = mods.reduce((a, m) => a + Cu().doneCount(m), 0);
      const total = mods.length * Cu().REQUIRED;
      const locked = mods.every((m) => Cu().lockReason(m));
      const fresh = mods.reduce((a, m) => a + (Cu().lessonDone(m) && !Cu().lockReason(m) ? Cu().requiredIds(m).filter((id) => this.isNew(id)).length : 0), 0);
      const open = this.stageOpen(tier);
      return `
        <section class="stage ${open ? 'open' : ''} ${locked ? 'locked' : ''}">
          <button class="stage-head" data-stage="${tier}" aria-expanded="${open}">
            <span class="chev">▸</span>${locked ? '🔒' : '🎓'} ${T('Etapa', 'Stage')} ${esc(AA.L(rank.name))}
            <span class="stage-meta">${fresh ? `<span class="stage-new">${fresh} ${T(fresh > 1 ? 'nuevas' : 'nueva', 'new')}</span>` : ''}<span class="${done >= total ? 'ok' : ''}">${done}/${total}</span></span>
          </button>
          <div class="stage-body">${mods.map((m) => this.renderGroup(m)).join('')}</div>
        </section>`;
    },

    renderGroup(mod) {
      const st = AA.State;
      const n = levelNum(mod);
      const done = Cu().doneCount(mod);
      const reason = Cu().lockReason(mod);
      const head = `<div class="mail-group-head">${reason ? '🔒 ' : ''}${T('Nivel', 'Level')} ${n} · ${esc(AA.L(mod.title))}<span class="${done >= Cu().REQUIRED ? 'ok' : ''}">${done}/${Cu().REQUIRED}</span></div>`;
      const item = (sel, inner, cls) => `<button class="mail-item ${cls || ''} ${this.selected === sel ? 'active' : ''}" data-sel="${sel}">${inner}</button>`;
      if (reason) {
        return `<div class="mail-group locked">${head}${item('locked:' + mod.id, `<div class="mail-subject">${esc(reason)}</div>`, 'locked')}</div>`;
      }
      if (!Cu().lessonDone(mod)) {
        return `<div class="mail-group">${head}${item('lesson:' + mod.id, `<div class="mail-from">☕ Leo</div><div class="mail-subject">${T('Primero hablá con Leo', 'Talk to Leo first')}</div><div class="mail-meta"><span class="chip new">${T('Lección pendiente', 'Lesson pending')}</span></div>`, 'new')}</div>`;
      }
      const items = Cu()
        .requiredIds(mod)
        .map((id) => {
          if (!Cu().missionAvailable(id)) {
            return `<div class="mail-item locked"><div class="mail-subject">🔒 ${T('Completá la tarea anterior', 'Complete the previous task')}</div></div>`;
          }
          const m = getMission(id, (st.data.progress[id] && st.data.progress[id].lang) || AA.lang);
          const state = st.isCompleted(id) ? 'read' : st.data.progress[id] ? 'progress' : 'new';
          const status = {
            read: `<span class="chip ok">✔ ${T('Entregado', 'Delivered')}</span>`,
            progress: `<span class="chip prog">✎ ${T('En progreso', 'In progress')}</span>`,
            new: `<span class="chip new">★ ${T('Nuevo', 'New')}</span>`,
          }[state];
          const ch = st.CHARACTERS[m.from];
          return item(id, `<div class="mail-from">${esc(AA.L(ch.name))} ${AA.UI.deptBadge(m.dept)}</div><div class="mail-subject">${esc(m.subject)}</div><div class="mail-meta">${status}<span class="xp">+${m.xp} XP</span></div>`, state);
        })
        .join('');
      const reward = Cu().practiceReward(mod, 'medium');
      const practice = Cu().isModuleComplete(mod)
        ? item(
            'practice:' + mod.id,
            `<div class="mail-subject">🎲 ${T('Práctica libre', 'Free practice')}</div><div class="mail-meta"><span class="chip extra">${T('Extra · casos aleatorios', 'Extra · random cases')}</span><span class="xp">${
              reward.xp ? `+${mod.xp}–${Cu().practiceXp(mod, 'large')} XP · ${reward.left}/${Cu().PRACTICE_XP_LIMIT}` : T('sin XP', 'no XP')
            }</span></div>`,
            'practice'
          )
        : '';
      return `<div class="mail-group">${head}${items}${practice}</div>`;
    },

    renderView() {
      const sel = this.selected;
      if (!sel) return `<div class="mail-empty">${T('No hay mensajes.', 'No messages.')}</div>`;
      if (sel.startsWith('lesson:')) return this.renderLessonView(Cu().moduleById(sel.slice(7)));
      if (sel.startsWith('locked:')) {
        const mod = Cu().moduleById(sel.slice(7));
        return `<div class="mail-empty"><div class="big">🔒</div><h2>${T('Nivel', 'Level')} ${levelNum(mod)} · ${esc(AA.L(mod.title))}</h2><p>${esc(Cu().lockReason(mod))}</p></div>`;
      }
      if (sel.startsWith('practice:')) return this.renderPracticeView(Cu().moduleById(sel.slice(9)));
      return this.renderMail(sel);
    },

    renderLessonView(mod) {
      return `
        <div class="mail-empty">
          <div class="big">☕</div>
          <h2>${T('Nivel', 'Level')} ${levelNum(mod)} · ${esc(AA.L(mod.title))}</h2>
          <p>${T('Antes de las tareas de este nivel, <b>Leo</b> te tiene que explicar las herramientas nuevas. Lo encontrás junto a la máquina de café.', 'Before this level\'s tasks, <b>Leo</b> needs to explain the new tools. You\'ll find him by the coffee machine.')}</p>
          <button class="btn btn-primary" data-act="leo">← ${T('Ir a la oficina', 'Go to the office')}</button>
        </div>`;
    },

    renderPracticeView(mod) {
      const st = AA.State;
      const active = st.data.activePractice[mod.id];
      const count = st.data.practice[mod.id] || 0;
      const reward = Cu().practiceReward(mod, 'medium');
      const rewardNote = reward.reason === 'rank'
        ? T(`Ya sos <b>${esc(AA.L(st.rank().name))}</b>: estos casos te sirven para repasar, pero ya no suman XP (son de una etapa anterior).`, `You are already a <b>${esc(AA.L(st.rank().name))}</b>: these cases are good for review, but no longer earn XP (they belong to an earlier stage).`)
        : reward.reason === 'limit'
          ? T(`Ya hiciste los ${Cu().PRACTICE_XP_LIMIT} casos con XP de este nivel. Podés seguir practicando todo lo que quieras, sin XP.`, `You already did the ${Cu().PRACTICE_XP_LIMIT} XP-earning cases of this level. You can keep practicing as much as you like, without XP.`)
          : T(`Te quedan <b>${reward.left} de ${Cu().PRACTICE_XP_LIMIT}</b> casos que suman XP en este nivel. Después podés seguir practicando sin XP.`, `You have <b>${reward.left} of ${Cu().PRACTICE_XP_LIMIT}</b> XP-earning cases left in this level. After that you can keep practicing without XP.`);
      const sizeCard = (size, title, desc) => `
        <div class="practice-card">
          <h3>${title}</h3>
          <p class="muted">${desc}</p>
          <div class="xp">${reward.xp ? `+${Cu().practiceXp(mod, size)} XP` : T('Sin XP', 'No XP')}</div>
          <button class="btn btn-primary" data-practice="${mod.id}:${size}">${T('Generar caso', 'Generate case')}</button>
        </div>`;
      return `
        <header class="mail-head">
          <h2>🎲 ${T('Práctica libre', 'Free practice')} · ${T('Nivel', 'Level')} ${levelNum(mod)}</h2>
          <p class="muted">${esc(AA.L(mod.title))}</p>
        </header>
        <div class="mail-body">
          <p>${T('Casos generados al azar con las herramientas de este nivel, en tablas más grandes. Cada caso es distinto: ideal para afianzar lo aprendido. Los primeros ${AA.Curriculum.PRACTICE_XP_LIMIT} suman XP para llegar al próximo rango; después podés seguir practicando todo lo que quieras.', 'Randomly generated cases using this level\'s tools, with bigger tables. Every case is different: ideal to lock in what you learned. The first ${AA.Curriculum.PRACTICE_XP_LIMIT} earn XP towards the next rank; after that you can keep practicing as much as you like.')}</p>
          <p class="muted">${T('Casos completados en este nivel', 'Cases completed in this level')}: <b>${count}</b></p>
          <p class="practice-note">${rewardNote}</p>
        </div>
        ${
          active
            ? `<div class="attachment">
                 <div class="file-icon">XLS</div>
                 <div class="file-info"><b>${esc(getMission(active, (st.data.progress[active] && st.data.progress[active].lang) || AA.lang).subject)}</b><span class="muted">${T('Caso en curso', 'Case in progress')}</span></div>
                 <button class="btn btn-primary" data-open="${active}">${T('Continuar', 'Continue')}</button>
                 <button class="btn btn-ghost" data-discard="${mod.id}">${T('Descartar', 'Discard')}</button>
               </div>`
            : ''
        }
        <div class="practice-grid">
          ${sizeCard('medium', T('Tabla mediana', 'Medium table'), T('20 a 40 filas aprox.', 'About 20 to 40 rows.'))}
          ${sizeCard('large', T('Tabla grande', 'Large table'), T('35 a 65 filas aprox. Más desafío.', 'About 35 to 65 rows. More challenging.'))}
        </div>`;
    },

    renderMail(id) {
      const st = AA.State;
      const prog = st.data.progress[id];
      const m = getMission(id, (prog && prog.lang) || AA.lang);
      const ch = st.CHARACTERS[m.from];
      const doneInfo = st.data.completed[id];
      const objectives = m.objectives.map((o) => `<li>${o.text}</li>`).join('');
      return `
        <header class="mail-head">
          <h2>${esc(m.subject)}</h2>
          <div class="mail-sender">
            <div class="avatar" style="--c:${ch.shirt}">${esc(AA.L(ch.name)[0])}</div>
            <div><b>${esc(AA.L(ch.name))}</b> · ${esc(AA.L(ch.role))}<br><span class="muted">${T('para', 'to')}: ${esc(st.data.name)}</span></div>
            <div class="spacer"></div>${AA.UI.deptBadge(m.dept)}
          </div>
        </header>
        <div class="mail-body">${AA.fillName(m.email)}</div>
        <div class="attachment">
          <div class="file-icon">XLS</div>
          <div class="file-info"><b>${esc(m.file)}</b><span class="muted">${T('Planilla adjunta', 'Attached spreadsheet')}</span></div>
          <button class="btn btn-primary" data-open="${id}">${doneInfo ? T('Volver a abrir', 'Open again') : prog ? T('Continuar', 'Continue') : T('Abrir planilla', 'Open spreadsheet')}</button>
        </div>
        <details class="mail-objectives" ${doneInfo ? '' : 'open'}>
          <summary>${T('Lo que hay que hacer', 'What needs to be done')} (${m.objectives.length}) · ${T('recompensa', 'reward')} <b>+${m.xp} XP</b></summary>
          <ol>${objectives}</ol>
        </details>
        ${doneInfo ? `<p class="done-note">✔ ${T(`Entregaste este informe y ganaste <b>${doneInfo.xp} XP</b>. Podés volver a abrirlo para practicar (no suma XP).`, `You delivered this report and earned <b>${doneInfo.xp} XP</b>. You can open it again to practice (no XP).`)}</p>` : ''}`;
    },
  };

  // -------------------------------------------------------------------------
  // Pantalla de misión: planillas (una o varias hojas) y herramientas
  // (tabla dinámica, gráfico, dashboard, SQL, informe).
  // -------------------------------------------------------------------------
  function rectsOf(list) {
    return (list || []).map((r) => F.parseRange(r)).filter(Boolean);
  }
  function inRects(rects, c, r) {
    return rects.some((k) => c >= k.c1 && c <= k.c2 && r >= k.r1 && r <= k.r2);
  }
  const W = () => AA.Workspace;

  const MissionScreen = {
    mission: null,
    book: null,
    views: {},
    grids: [],
    base: [],
    answers: {},
    hints: [],
    status: [],
    parts: null,
    sqlRuns: [],
    saveTimer: null,
    activeView: null,
    activeSheet: 0,

    // opts: { mission, arcade } — el ARCADE pasa la misión ya armada y no guarda progreso.
    open(id, opts) {
      opts = opts || {};
      const st = AA.State;
      const prog = opts.arcade ? null : st.data.progress[id];
      const lang = (prog && prog.lang) || AA.lang;
      const mission = opts.mission || getMission(id, lang);
      this.mission = mission;
      this.lang = lang;
      this.arcade = !!opts.arcade;
      // Las tareas obligatorias explican paso a paso; el resto muestra solo el pedido (como en un trabajo real).
      // Los favores de Nico son guiados solo si piden algo que todavía no hiciste en el modo historia.
      this.guided = !this.arcade && (mission.kind === 'story' || (mission.kind === 'favor' && !Cu().favorKnown(mission.id)));
      this.defs = W().sheetDefs(mission);
      this.book = W().buildBook(mission);
      this.base = this.book.sheets.map((sh) => new Map(sh.serialize().map(([c, r, i]) => [c + ',' + r, i])));
      this.answers = {};
      this.hints = [];
      this.parts = W().emptyParts(mission);
      this.sqlText = mission.sql ? mission.sql.starter || '' : '';
      if (prog) {
        const restore = (i, list) => {
          const sh = this.book.sheets[i];
          if (sh) for (const [c, r, input] of list || []) sh.setInput(c, r, input, true);
        };
        restore(0, prog.cells);
        for (const [i, list] of Object.entries(prog.sheetCells || {})) restore(+i, list);
        this.answers = Object.assign({}, prog.answers);
        this.hints = (prog.hints || []).slice();
        if (prog.chart && mission.chart) this.parts.chart = Object.assign(AA.Chart.emptySpec(), prog.chart);
        if (prog.pivot && mission.pivot) this.parts.pivot = Object.assign(AA.Pivot.emptySpec(), prog.pivot);
        if (prog.dash && mission.dashboard) this.parts.dash = prog.dash;
        if (prog.sql) this.parts.sql = prog.sql.slice();
        if (prog.sqlText !== undefined) this.sqlText = prog.sqlText;
        if (prog.report) this.parts.report = Object.assign({}, prog.report);
        if (prog.flags) this.parts.flags = prog.flags.slice();
      }
      this.sqlRuns = W().runSql(mission, this.parts.sql);
      this.status = [];
      document.querySelectorAll('.ss-pop').forEach((p) => p.remove());
      this.grids = [];
      this.views = {};
      this.tabs = W().views(mission);

      const root = document.getElementById('screen-mission');
      this.root = root;
      const ch = st.CHARACTERS[mission.from];
      const mod = Cu().moduleById(mission.module);
      const icon = mission.sql ? 'SQL' : mission.dashboard ? 'BI' : mission.report && !mission.sheets && !mission.sheet ? 'PPT' : 'XLS';
      const sheetTabs = this.defs.length > 1 || !this.defs.every((d) => d.def.readonly);
      const topButtons = this.arcade
        ? `<div class="arc-hud" data-el="arc-hud"></div>
           <div class="spacer"></div>
           <button class="btn" data-act="skip" title="${T('Perdés lo que queda del plazo de este pedido y una penalización', 'You lose what is left of this request\'s deadline plus a penalty')}">⏭ ${T('Saltear', 'Skip')} <span class="muted" data-el="skipcost"></span></button>
           <button class="btn btn-ghost" data-act="quit">✖ ${T('Abandonar', 'Quit')}</button>
           <button class="btn btn-primary" data-act="submit">📤 ${T('Entregar', 'Submit')}</button>`
        : `<button class="btn btn-ghost" data-act="office">← ${T('Oficina', 'Office')}</button>
           <button class="btn btn-ghost" data-act="inbox">📨 ${T('Bandeja', 'Inbox')} <kbd>Esc</kbd></button>
           <div class="ms-title">
             <span class="file-icon sm">${icon}</span>
             <div><b>${esc(mission.file)}</b><span class="muted">${mod ? `${T('Nivel', 'Level')} ${levelNum(mod)} · ` : ''}${esc(mission.subject)} · ${esc(AA.L(ch.name))}</span></div>
           </div>
           <div class="spacer"></div>
           <button class="btn" data-act="help" title="${T('Cómo usar la planilla', 'How to use the spreadsheet')}">❓ ${T('Ayuda', 'Help')}</button>
           <button class="btn" data-act="notebook">📒 ${T('Libreta', 'Notebook')}</button>
           <button class="btn" data-act="email">📧 ${T('Ver pedido', 'View request')}</button>
           <button class="btn" data-act="hint">💡 ${T('Pista', 'Hint')}</button>
           <button class="btn btn-primary" data-act="submit" disabled>📤 ${T('Entregar informe', 'Submit report')}</button>`;
      // Panel izquierdo: guiado (objetivos paso a paso) o solo el pedido.
      const side = this.guided
        ? `<section class="card">
             <h3>${T('Objetivos', 'Objectives')} <span class="muted" data-el="count"></span></h3>
             <ol class="objectives" data-el="objectives"></ol>
           </section>
           <section class="card tips">
             <h3>📒 ${T('Notas de Leo', "Leo's notes")}</h3>
             <ul>${mission.tips.map((t) => `<li>${t}</li>`).join('')}</ul>
           </section>`
        : `<section class="card brief">
             <h3>📧 ${T('Pedido', 'Request')} <span class="muted" data-el="count"></span></h3>
             <div class="brief-from"><div class="avatar" style="--c:${ch.shirt}">${esc(AA.L(ch.name)[0])}</div><div><b>${esc(AA.L(ch.name))}</b><span class="muted">${esc(AA.L(ch.role) || '')}</span></div></div>
             <div class="brief-subject">${esc(mission.subject)}</div>
             <div class="brief-body">${AA.fillName(AA.Brief.howFree(mission.email))}</div>
             ${(() => {
               const list = AA.Brief.deliverables(mission, this.book);
               return list.length ? `<div class="brief-needs"><b>${T('Lo que necesito', 'What I need')}:</b><ul>${list.map((x) => `<li>${x}</li>`).join('')}</ul></div>` : '';
             })()}
           </section>
           <section class="card questions" data-el="qcard">
             <h3>❓ ${T('Preguntas', 'Questions')}</h3>
             <ol class="objectives" data-el="objectives"></ol>
           </section>
           <section class="card hints-card hidden" data-el="hintcard">
             <h3>💡 ${T('Pistas', 'Hints')}</h3>
             <ul data-el="hintlist"></ul>
           </section>`;
      root.innerHTML = `
        <header class="ms-top ${this.arcade ? 'arcade-top' : ''}">${topButtons}</header>
        <div class="ms-body ${this.guided ? '' : 'unguided'}">
          <aside class="ms-side">${side}</aside>
          <main class="ms-sheet ms-multi">
            ${this.tabs.length > 1 ? `<div class="ms-viewtabs">${this.tabs.map((v) => `<button data-view="${v.id}">${v.label}</button>`).join('')}</div>` : ''}
            ${this.tabs
              .filter((v) => v.id !== 'sheets')
              .map((v) => `<div class="ms-view ${v.id === 'chart' ? 'chart-host' : ''}" data-pane="${v.id}"></div>`)
              .join('')}
            ${
              this.defs.length
                ? `<div class="ms-view ms-sheets" data-pane="sheets">
                     ${this.defs.map((d, i) => `<div class="ss-host" data-sheet="${i}"></div>`).join('')}
                     <div class="ms-tabs">
                       ${sheetTabs ? this.defs.map((d, i) => `<button class="tab" data-sheettab="${i}">${esc(d.name)}</button>`).join('') : ''}
                       ${mission.review ? `<button class="btn btn-sm flag-btn" data-act="flag">🚩 ${T('Marcar / desmarcar error', 'Flag / unflag error')}</button><span class="muted" data-el="flags"></span>` : ''}
                       <span class="muted ms-legend">${
                         this.defs.every((d) => d.def.readonly)
                           ? T('Datos de solo lectura', 'Read-only data')
                           : T('Gris: datos originales (bloqueados) · amarillo: lo que tenés que completar', 'Gray: original data (locked) · yellow: what you must fill in')
                       }</span>
                     </div>
                   </div>`
                : ''
            }
          </main>
        </div>`;

      this.objList = root.querySelector('[data-el="objectives"]');
      this.countEl = root.querySelector('[data-el="count"]');
      this.submitBtn = root.querySelector('[data-act="submit"]');
      const on = (act, fn) => {
        const b = root.querySelector(`[data-act="${act}"]`);
        if (b) b.addEventListener('click', fn);
      };
      on('office', () => this.leave(() => AA.Game.enterOffice()));
      on('inbox', () => this.leave(() => AA.Game.openComputer()));
      on('notebook', () => openNotebook(mission.module));
      on('email', () => this.showEmail());
      on('help', () => AA.Guides.mission(this, true));
      on('hint', () => this.useHint());
      on('skip', () => AA.Arcade.skip());
      on('quit', () => AA.Arcade.confirmQuit());
      this.submitBtn.addEventListener('click', () => this.submit());
      root.querySelectorAll('[data-view]').forEach((b) =>
        b.addEventListener('click', () => {
          AA.Audio.play('move');
          this.showView(b.dataset.view);
        })
      );
      root.querySelectorAll('[data-sheettab]').forEach((b) =>
        b.addEventListener('click', () => {
          AA.Audio.play('move');
          this.showSheet(+b.dataset.sheettab);
        })
      );
      const flagBtn = root.querySelector('[data-act="flag"]');
      if (flagBtn) flagBtn.addEventListener('click', () => this.toggleFlag());

      this.openTools(root, mission);
      const startView = (prog && prog.view && this.tabs.some((v) => v.id === prog.view) && prog.view) || (this.tabs[0] && this.tabs[0].id);
      if (this.defs.length) this.showSheet(0, true);
      this.showView(startView, true);
      this.evaluate(true);
      if (this.arcade) return;
      // Guía de la planilla (o de la herramienta) la primera vez.
      setTimeout(() => this.mission && AA.Guides.mission(this), 300);
      this.scheduleHeadersTip();
    },

    // --- Herramientas
    openTools(root, m) {
      const onToast = (msg) => AA.UI.toast(msg, 'warn');
      const changed = () => {
        this.evaluate();
        this.scheduleSave();
      };
      const pane = (id) => root.querySelector(`[data-pane="${id}"]`);
      if (m.chart) {
        this.views.chart = new AA.ChartBuilder(pane('chart'), m.chart.table, this.parts.chart, {
          onChange: (spec) => {
            this.parts.chart = spec;
            changed();
          },
          onToast,
        });
      }
      if (m.pivot) {
        this.views.pivot = new AA.PivotBuilder(pane('pivot'), m.pivot.table, this.parts.pivot, {
          money: m.pivot.money,
          onChange: (spec) => {
            this.parts.pivot = spec;
            changed();
          },
          onToast,
        });
      }
      if (m.dashboard) {
        this.views.dashboard = new AA.DashboardBuilder(pane('dashboard'), m.dashboard.table, this.parts.dash, {
          money: m.dashboard.money,
          initial: m.dashboard.initial,
          onChange: (spec) => {
            this.parts.dash = spec;
            changed();
          },
          onToast,
        });
      }
      if (m.sql) {
        const last = this.parts.sql[this.parts.sql.length - 1];
        this.views.sql = new AA.SqlConsole(pane('sql'), m.sql.tables, {
          initial: this.sqlText,
          history: this.parts.sql,
          lastQuery: last,
          onChange: (text) => {
            this.sqlText = text;
            this.scheduleSave();
          },
          onRun: (q, res) => {
            // Se guardan las consultas que funcionaron (sin repetir, las últimas 40).
            if (res) {
              this.parts.sql = this.parts.sql.filter((x) => x !== q).concat([q]).slice(-40);
              this.sqlRuns = this.sqlRuns.filter((r) => r.q !== q).concat([{ q, res }]).slice(-40);
            }
            changed();
          },
        });
      }
      if (m.report) {
        this.views.report = new AA.ReportBuilder(pane('report'), m.report, this.parts.report, {
          onChange: (choices) => {
            this.parts.report = choices;
            changed();
          },
        });
      }
    },

    showView(id, initial) {
      if (!id) return;
      this.activeView = id;
      this.root.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('on', b.dataset.view === id));
      this.root.querySelectorAll('[data-pane]').forEach((p) => p.classList.toggle('hidden', p.dataset.pane !== id));
      const v = this.views[id];
      if (id === 'sheets') this.showSheet(this.activeSheet, initial);
      else if (id === 'chart' && v) v.draw();
      else if (id === 'dashboard' && v) v.drawCharts();
      else if (id === 'report' && v) v.build();
      else if (id === 'sql' && v) setTimeout(() => v.focus(), 30);
      if (!initial) {
        this.scheduleSave();
        setTimeout(() => this.mission && this.activeView === id && AA.Guides.mission(this), 250);
      }
    },

    // Hoja visible (las grillas se crean al mostrarlas por primera vez).
    showSheet(i, initial) {
      this.activeSheet = i;
      this.root.querySelectorAll('[data-sheettab]').forEach((b) => b.classList.toggle('active', +b.dataset.sheettab === i));
      this.root.querySelectorAll('[data-sheet]').forEach((h) => h.classList.toggle('hidden', +h.dataset.sheet !== i));
      if (!this.grids[i]) this.grids[i] = this.makeGrid(i);
      else this.grids[i].refresh();
      if (this.activeView === 'sheets' || initial) setTimeout(() => this.focusActive(), 50);
    },

    makeGrid(i) {
      const d = this.defs[i].def;
      const sheet = this.book.sheets[i];
      const locked = rectsOf(d.locked);
      const header = rectsOf(d.header);
      const labels = rectsOf(d.labels);
      const targets = rectsOf(d.targets);
      const spaces = rectsOf(d.showSpaces);
      const formats = d.formats || {};
      const reviewSheet = this.mission.review && i === 0;
      return new AA.SpreadsheetView(this.root.querySelector(`[data-sheet="${i}"]`), sheet, {
        colWidths: d.colWidths,
        startCell: d.start,
        sheetNames: () => this.book.names().filter((n) => n !== sheet.name),
        locked: (c, r) => inRects(locked, c, r),
        format: (c, r) => {
          const ref = F.makeRef(c, r);
          if (formats[ref]) return formats[ref];
          if (inRects(header, c, r)) return null;
          return formats[F.indexToCol(c)] || null;
        },
        cellClass: (c, r) => {
          const cls = [];
          if (inRects(header, c, r)) cls.push('hdr');
          if (inRects(labels, c, r)) cls.push('label');
          if (inRects(targets, c, r) && sheet.isEmpty(c, r)) cls.push('target');
          if (inRects(spaces, c, r)) cls.push('spaces');
          if (reviewSheet && this.parts.flags.includes(F.makeRef(c, r))) cls.push('flagged');
          return cls.join(' ');
        },
        displayHtml: spaces.length
          ? (c, r, text) => (inRects(spaces, c, r) ? esc(text).replace(/^ +| +$| {2,}/g, (m) => '<i class="sp">' + '·'.repeat(m.length) + '</i>') : null)
          : null,
        onLocked: () => {
          AA.Audio.play('error');
          AA.UI.toast(
            d.readonly
              ? T('📋 Estos son los datos: se consultan, no se editan.', '📋 This is the data: you can read it, not edit it.')
              : T('🔒 Esa celda tiene <b>datos originales</b>. No se tocan: trabajá en las celdas a completar.', "🔒 That cell holds <b>original data</b>. Don't touch it: work in the cells you need to fill in."),
            'warn'
          );
        },
        onToast: (msg) => AA.UI.toast(msg, 'info'),
        onEdit: (changes) => {
          AA.Audio.play('type');
          this.maybeFillTip(i, changes);
          // Otras hojas pueden depender de esta: se redibujan las que ya existen.
          this.grids.forEach((g, k) => g && k !== i && g.refresh());
          this.evaluate();
          this.scheduleSave();
        },
      });
    },

    // --- Ayudas que aparecen una sola vez por partida, en el momento justo.
    // Después de la primera fórmula: cómo copiarla a las filas de abajo arrastrando.
    maybeFillTip(i, changes) {
      const st = AA.State;
      const g = this.grids[i];
      if (!g) return;
      if (changes && changes.length > 1) g.hideCoach(); // ya rellenó: la burbuja cumplió su función
      if (st.data.flags.tipFill || !changes || changes.length !== 1 || !/^=/.test(String(changes[0].after || ''))) return;
      const { c, r } = changes[0];
      st.data.flags.tipFill = true;
      st.save();
      setTimeout(
        () =>
          g.coach(
            T(
              '💡 <b>¿La misma cuenta en las filas de abajo?</b> No la escribas de nuevo: seleccioná esta celda y <b>arrastrá hacia abajo el cuadradito azul</b> de su esquina. La fórmula de arriba se copia en cada fila y las referencias se ajustan solas (B2 → B3 → B4…). <span class="muted">Atajo: seleccioná el rango y apretá Ctrl+D.</span>',
              '💡 <b>Same calculation in the rows below?</b> Don\'t type it again: select this cell and <b>drag the little blue square</b> in its corner down. The formula above is copied into each row and the references adjust by themselves (B2 → B3 → B4…). <span class="muted">Shortcut: select the range and press Ctrl+D.</span>'
            ),
            { c, r, dx: 10 }
          ),
        120
      );
    },
    // Al abrir la primera tarea con planilla: marcar una columna o fila entera con su encabezado.
    scheduleHeadersTip() {
      const st = AA.State;
      if (st.data.flags.tipHeaders || !this.defs.length) return;
      const mission = this.mission;
      const tryShow = () => {
        if (this.mission !== mission) return;
        if (st.data.flags.tipHeaders) return; // ya lo explicó la guía
        if (AA.UI.isModalOpen() || AA.Dialog.isOpen() || AA.Tour.isOpen() || this.activeView !== 'sheets') return setTimeout(tryShow, 600);
        const g = this.grids[this.activeSheet];
        if (!g) return;
        st.data.flags.tipHeaders = true;
        st.save();
        g.coach(
          T(
            '💡 <b>Hacé clic en la letra de una columna</b> (A, B, C…) para marcarla entera, o en el <b>número de una fila</b> para marcar toda la fila. Así encontrás fácil los datos de esa columna o fila.',
            '💡 <b>Click a column letter</b> (A, B, C…) to select the whole column, or a <b>row number</b> to select the whole row. It makes it easy to follow that column\'s or row\'s data.'
          ),
          { col: 1, dx: -8, ms: 14000 }
        );
      };
      setTimeout(tryShow, 900);
    },

    focusActive() {
      if (!this.mission) return;
      if (this.activeView === 'sheets' && this.grids[this.activeSheet]) this.grids[this.activeSheet].focusGrid();
      else if (this.activeView === 'sql' && this.views.sql) this.views.sql.focus();
    },

    // Revisión: marcar la celda activa como error (o desmarcarla).
    toggleFlag() {
      if (this.activeSheet !== 0 || !this.grids[0]) {
        AA.UI.toast(T('Las marcas van en la primera hoja (la que estás revisando).', 'Flags go on the first sheet (the one you are reviewing).'), 'warn');
        return;
      }
      const g = this.grids[0];
      const ref = F.makeRef(g.sel.ac, g.sel.ar);
      const k = this.parts.flags.indexOf(ref);
      if (k >= 0) this.parts.flags.splice(k, 1);
      else this.parts.flags.push(ref);
      AA.Audio.play(k >= 0 ? 'back' : 'select');
      g.refresh();
      this.evaluate();
      this.scheduleSave();
      g.focusGrid();
    },

    leave(then) {
      this.saveNow();
      (this.grids || []).forEach((g) => g && g.closePop && g.closePop());
      Object.values(this.views).forEach((v) => v && v.destroy && v.destroy());
      this.views = {};
      this.mission = null;
      then();
    },

    // --- Objetivos
    evaluate(initial) {
      const m = this.mission;
      const prevLang = AA.lang;
      AA.setLang(this.lang);
      const S = W().state(m, this.book, this.parts, this.sqlRuns);
      const prev = this.status;
      let seqPending = false;
      this.status = m.objectives.map((o) => {
        if (o.answer || o.choices) {
          const a = this.answers[m.objectives.indexOf(o)];
          return a && a.ok ? true : a && a.value !== undefined && a.value !== '' ? 'wrong' : false;
        }
        let res;
        try {
          res = o.check(S);
        } catch (e) {
          console.error(e);
          res = false;
        }
        // En SQL, solo el primer objetivo pendiente muestra la nota de la última consulta.
        if (o.check.sequential && res !== true) {
          if (seqPending && typeof res === 'string') res = false;
          seqPending = true;
        }
        return res;
      });
      AA.setLang(prevLang);
      if (!initial) {
        let newlyDone = false;
        this.status.forEach((s, i) => {
          if (s === true && prev[i] !== true) {
            newlyDone = true;
            // En el ARCADE no se avisa: hay que revisar el propio trabajo antes de entregar.
            if (this.guided) AA.UI.toast(T(`✅ Objetivo ${i + 1} cumplido`, `✅ Objective ${i + 1} done`), 'ok');
            else if (!this.arcade) AA.UI.toast(T('✅ Un requisito más cumplido', '✅ One more requirement met'), 'ok');
          }
        });
        if (newlyDone && !this.arcade) AA.Audio.play('success');
      }
      const fl = this.root.querySelector('[data-el="flags"]');
      if (fl) fl.textContent = this.parts.flags.length ? T(`${this.parts.flags.length} marcada(s): ${this.parts.flags.join(', ')}`, `${this.parts.flags.length} flagged: ${this.parts.flags.join(', ')}`) : '';
      this.renderObjectives();
    },

    renderObjectives() {
      const objs = this.mission.objectives;
      const done = this.status.filter((s) => s === true).length;
      // Sin guía: solo un contador general (en el ARCADE, ni eso).
      this.countEl.textContent = this.arcade ? '' : this.guided ? `${done}/${objs.length}` : T(`${done}/${objs.length} requisitos cumplidos`, `${done}/${objs.length} requirements met`);
      const pickBtn = this.defs.length ? `<button type="button" class="btn btn-sm obj-pick" data-pick title="${T('Usar el valor de la celda seleccionada', 'Use the value of the selected cell')}">📍</button>` : '';
      if (!this.guided) {
        const qcard = this.root.querySelector('[data-el="qcard"]');
        if (qcard) qcard.classList.toggle('hidden', !objs.some((o) => o.answer || o.choices));
        const hc = this.root.querySelector('[data-el="hintcard"]');
        if (hc) {
          hc.classList.toggle('hidden', !this.hints.length);
          hc.querySelector('[data-el="hintlist"]').innerHTML = this.hints.map((k) => `<li>${esc(objs[k].hint || '')}</li>`).join('');
        }
      }
      this.objList.innerHTML = objs
        .map((o, i) => {
          if (!this.guided && !o.answer && !o.choices) return '';
          const s = this.status[i];
          const ok = s === true;
          const note = typeof s === 'string' && s !== 'wrong' ? `<div class="obj-note">${esc(s)}</div>` : '';
          const hint = this.guided && this.hints.includes(i) ? `<div class="obj-hint">💡 ${esc(o.hint)}</div>` : '';
          const a = this.answers[i] || {};
          let answer = '';
          if (o.choices) {
            const why = s === 'wrong' && o.why && o.why[a.value] ? o.why[a.value] : T('No es la mejor opción. Pensalo de nuevo con los datos.', 'Not the best option. Think it over with the data.');
            answer = ok
              ? `<div class="obj-answer done">✔ ${o.choices[a.value]}</div>`
              : `<div class="obj-choices" data-choice="${i}">${o.choices.map((c, k) => `<button class="obj-choice ${a.value === k ? 'picked' : ''}" data-k="${k}">${c}</button>`).join('')}</div>${s === 'wrong' ? `<div class="obj-note">${why}</div>` : ''}`;
          } else if (o.answer) {
            answer = ok
              ? `<div class="obj-answer done">${T('Tu respuesta', 'Your answer')}: <b>${esc(a.value)}</b></div>`
              : `<form class="obj-answer" data-answer="${i}">
                   <input type="text" placeholder="${esc(o.placeholder || T('Tu respuesta', 'Your answer'))}" value="${esc(a.value || '')}" autocomplete="off">${pickBtn}
                   <button class="btn btn-sm" type="submit">${T('Responder', 'Answer')}</button>
                 </form>${s === 'wrong' ? `<div class="obj-note">${T('Mmm, no es correcto. Revisá los datos y probá de nuevo.', "Hmm, that's not right. Check the data and try again.")}</div>` : ''}`;
          }
          const check = this.arcade ? '' : `<span class="obj-check">${ok ? '✔' : ''}</span>`;
          return `<li class="${ok ? 'ok' : ''}">${check}<div class="obj-text">${this.guided ? o.text : AA.Brief.howFree(o.text)}${note}${answer}${hint}</div></li>`;
        })
        .join('');
      this.objList.querySelectorAll('form[data-answer]').forEach((form) => {
        const input = form.querySelector('input');
        input.addEventListener('keydown', (e) => {
          e.stopPropagation();
          if (e.key === 'Escape') input.blur();
        });
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const i = +form.dataset.answer;
          const value = input.value.trim();
          if (!value) return;
          const ok = !!this.mission.objectives[i].answer(value);
          this.answers[i] = { value, ok };
          if (!ok) {
            AA.Audio.play('error');
            form.classList.add('shake');
            if (this.arcade) AA.Arcade.penalty('wrong');
          }
          this.evaluate();
          this.scheduleSave();
        });
      });
      this.objList.querySelectorAll('[data-choice]').forEach((box) => {
        box.querySelectorAll('[data-k]').forEach((b) =>
          b.addEventListener('click', () => {
            const i = +box.dataset.choice;
            const k = +b.dataset.k;
            const ok = k === this.mission.objectives[i].correct;
            this.answers[i] = { value: k, ok };
            if (!ok) {
              AA.Audio.play('error');
              if (this.arcade) AA.Arcade.penalty('wrong');
            }
            this.evaluate();
            this.scheduleSave();
          })
        );
      });
      // 📍: copia a la respuesta el valor de la celda seleccionada (por ejemplo, un CONTAR.SI que armaste).
      this.objList.querySelectorAll('[data-pick]').forEach((b) =>
        b.addEventListener('mousedown', (e) => {
          e.preventDefault();
          const g = this.grids[this.activeSheet];
          const input = b.closest('form').querySelector('input');
          if (!g || !input) return;
          const v = g.activeValue();
          const text = typeof v === 'number' ? String(Math.round(v * 10000) / 10000) : v === null || v === undefined || (typeof v === 'object' && v.code) ? '' : String(v);
          if (!text) {
            AA.UI.toast(T('Seleccioná primero la celda que tiene la respuesta.', 'First select the cell that holds the answer.'), 'info');
            return;
          }
          input.value = text;
          input.focus();
          AA.Audio.play('select');
        })
      );
      const all = this.status.every((s) => s === true);
      // En el ARCADE se puede entregar siempre (si falta algo, penaliza).
      this.submitBtn.disabled = this.arcade ? false : !all;
      this.submitBtn.classList.toggle('pulse', all);
    },

    useHint() {
      const i = this.status.findIndex((s, k) => s !== true && !this.hints.includes(k));
      if (i < 0) {
        const pending = this.status.findIndex((s) => s !== true);
        AA.UI.toast(pending < 0 ? T('Ya está todo listo: ¡entregá el informe!', "Everything's ready: submit the report!") : T('Ya tenés las pistas de los objetivos pendientes a la vista.', 'The hints for the pending objectives are already showing.'), 'info');
        return;
      }
      const free = this.mission.kind === 'story' && AA.State.isCompleted(this.mission.id);
      AA.UI.modal({
        title: T('💡 ¿Pedir una pista?', '💡 Ask for a hint?'),
        html: `<p>${this.guided ? T(`Leo te puede dar una pista para el objetivo <b>${i + 1}</b>.`, `Leo can give you a hint for objective <b>${i + 1}</b>.`) : T('Leo te puede dar una pista para lo que todavía falta.', 'Leo can give you a hint for what is still missing.')}</p>
               <p class="muted">${free ? T('Esta tarea ya está completada: las pistas son gratis.', 'This task is already completed: hints are free.') : T('Cada pista reduce un 15% la XP de esta tarea (mínimo 40%).', "Each hint reduces this task's XP by 15% (minimum 40%).")}</p>`,
        buttons: [
          { label: T('Mejor sigo intentando', "I'll keep trying") },
          {
            label: T('Dame la pista', 'Give me the hint'),
            primary: true,
            action: () => {
              this.hints.push(i);
              this.renderObjectives();
              this.scheduleSave();
              if (!this.guided) AA.UI.toast(`💡 ${esc(this.mission.objectives[i].hint || '')}`, 'info');
            },
          },
        ],
        onClose: () => this.focusActive(),
      });
    },

    showEmail() {
      const m = this.mission;
      const ch = AA.State.CHARACTERS[m.from];
      AA.UI.modal({
        title: esc(m.subject),
        html: `<div class="mail-sender"><div class="avatar" style="--c:${ch.shirt}">${esc(AA.L(ch.name)[0])}</div><div><b>${esc(AA.L(ch.name))}</b> · ${esc(AA.L(ch.role))}</div></div>
               <div class="mail-body">${AA.fillName(m.email)}</div>`,
        buttons: [{ label: T('Volver al trabajo', 'Back to work'), primary: true }],
        onClose: () => this.focusActive(),
      });
    },

    showTutorial() {
      // Mini planillas ilustradas (animadas con CSS) para lo que más cuesta descubrir solo.
      const mini = (cells, extra) => `<table class="tut-sheet ${extra || ''}"><tr><th></th><th>A</th><th>B</th><th>C</th></tr>${cells}</table>`;
      const fillDemo = mini(
        `<tr><th>1</th><td>${T('Cant.', 'Qty')}</td><td>${T('Precio', 'Price')}</td><td>Total</td></tr>
         <tr><th>2</th><td>2</td><td>500</td><td class="sel">=A2*B2<i class="tut-handle"></i></td></tr>
         <tr><th>3</th><td>4</td><td>250</td><td class="ghost">=A3*B3</td></tr>
         <tr><th>4</th><td>1</td><td>900</td><td class="ghost">=A4*B4</td></tr>`,
        'tut-fill'
      );
      const headDemo = mini(
        `<tr><th>1</th><td>${T('Mes', 'Month')}</td><td class="col">${T('Ventas', 'Sales')}</td><td>${T('Meta', 'Goal')}</td></tr>
         <tr><th>2</th><td>${T('Ene', 'Jan')}</td><td class="col">120</td><td>100</td></tr>
         <tr><th>3</th><td>${T('Feb', 'Feb')}</td><td class="col">95</td><td>100</td></tr>
         <tr><th>4</th><td>${T('Mar', 'Mar')}</td><td class="col">130</td><td>110</td></tr>`,
        'tut-head'
      );
      AA.UI.modal({
        title: T('🧭 Cómo usar la planilla', '🧭 How to use the spreadsheet'),
        wide: true,
        html: `
          <div class="tut-demos">
            <figure>${fillDemo}<figcaption>${T('<b>Copiar una fórmula hacia abajo:</b> seleccioná la celda y arrastrá el <b>cuadradito azul</b> de la esquina. Cada fila recibe la fórmula de arriba, ajustada a su fila.', '<b>Copy a formula down:</b> select the cell and drag the <b>little blue square</b> in its corner. Each row gets the formula from above, adjusted to its row.')}</figcaption></figure>
            <figure>${headDemo}<figcaption>${T('<b>Marcar una columna o fila entera:</b> clic en su <b>letra</b> (arriba) o en su <b>número</b> (a la izquierda). Ideal para seguir los datos de una columna.', '<b>Select a whole column or row:</b> click its <b>letter</b> (top) or its <b>number</b> (left). Great for following a column\'s data.')}</figcaption></figure>
          </div>
          <div class="tutorial">
            <div>${T('<b>1. Seleccioná</b> una celda con un clic (o con las flechas).', '<b>1. Select</b> a cell with a click (or the arrow keys).')}</div>
            <div>${T('<b>2. Escribí</b> directamente. Si empieza con <code>=</code> es una fórmula: <code>=C2*D2</code>.', '<b>2. Type</b> directly. If it starts with <code>=</code> it is a formula: <code>=C2*D2</code>.')}</div>
            <div>${T('<b>3. Enter</b> confirma. <b>Esc</b> cancela. <b>Doble clic</b> o <b>F2</b> para editar.', '<b>3. Enter</b> confirms. <b>Esc</b> cancels. <b>Double-click</b> or <b>F2</b> to edit.')}</div>
            <div>${T('<b>4. Mientras escribís una fórmula</b>, hacé clic en otra celda para insertar su referencia.', '<b>4. While typing a formula</b>, click another cell to insert its reference.')}</div>
            <div>${T('<b>5. Objetivos:</b> están en el panel de la izquierda y se tildan solos. Las preguntas ❓ se responden escribiendo.', '<b>5. Objectives:</b> they are in the left panel and tick themselves. Questions ❓ are answered by typing.')}</div>
            <div>${T('<b>6. ¿Te olvidaste algo?</b> Esta guía está siempre en el botón <b>❓ Ayuda</b>.', '<b>6. Forgot something?</b> This guide is always under the <b>❓ Help</b> button.')}</div>
          </div>`,
        buttons: [{ label: T('¡Entendido!', 'Got it!'), primary: true }],
        onClose: () => this.focusActive(),
      });
    },

    // Solo para pruebas automáticas: aplica la solución de referencia a través de las vistas.
    debugSolve() {
      const m = this.mission;
      const sol = m.solution || {};
      const groups = new Map();
      for (const [name, ref, f] of W().solutionWrites(sol)) {
        const i = name ? this.defs.findIndex((d) => d.name === name) : 0;
        const p = F.parseRef(ref);
        if (!groups.has(i)) groups.set(i, []);
        groups.get(i).push({ c: p.col, r: p.row, input: f });
      }
      for (const [i, changes] of groups) {
        if (!this.grids[i]) this.grids[i] = this.makeGrid(i);
        this.grids[i].applyChanges(changes);
      }
      const clone = (x) => JSON.parse(JSON.stringify(x));
      const v = this.views;
      if (sol.chart && v.chart) {
        v.chart.spec = Object.assign(AA.Chart.emptySpec(), clone(sol.chart));
        v.chart.changed();
      }
      if (sol.pivot && v.pivot) {
        v.pivot.spec = Object.assign(AA.Pivot.emptySpec(), clone(sol.pivot));
        v.pivot.changed();
      }
      if (sol.dashboard && v.dashboard) {
        v.dashboard.spec = clone(sol.dashboard);
        v.dashboard.changed();
      }
      if (sol.report && v.report) {
        v.report.choices = clone(sol.report);
        v.report.build();
        v.report.opts.onChange(v.report.choices);
      }
      if (sol.sql && v.sql) {
        for (const q of sol.sql) {
          v.sql.setText(q);
          v.sql.run(q);
        }
      }
      if (sol.flags) {
        this.parts.flags = sol.flags.slice();
        if (this.grids[0]) this.grids[0].refresh();
      }
      this.evaluate();
      return sol.answers || {};
    },

    // --- Guardado del progreso (solo las celdas que cambiaron respecto de los datos originales)
    scheduleSave() {
      clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => this.saveNow(), 400);
    },
    saveNow() {
      clearTimeout(this.saveTimer);
      if (!this.mission || this.arcade) return;
      const st = AA.State;
      const m = this.mission;
      const diffOf = (i) => {
        const base = this.base[i];
        const diff = [];
        const current = new Map(this.book.sheets[i].serialize().map(([c, r, inp]) => [c + ',' + r, inp]));
        for (const [k, input] of current) if (base.get(k) !== input) diff.push([...k.split(',').map(Number), input]);
        for (const k of base.keys()) if (!current.has(k)) diff.push([...k.split(',').map(Number), '']);
        return diff;
      };
      const sheetCells = {};
      for (let i = 1; i < this.book.sheets.length; i++) {
        const d = diffOf(i);
        if (d.length) sheetCells[i] = d;
      }
      st.data.progress[m.id] = {
        cells: this.book.sheets.length ? diffOf(0) : [],
        sheetCells,
        answers: this.answers,
        hints: this.hints,
        lang: this.lang,
        view: this.activeView,
        chart: m.chart ? this.parts.chart : undefined,
        pivot: m.pivot ? this.parts.pivot : undefined,
        dash: m.dashboard ? this.parts.dash : undefined,
        sql: m.sql ? this.parts.sql : undefined,
        sqlText: m.sql ? this.sqlText : undefined,
        report: m.report ? this.parts.report : undefined,
        flags: m.review ? this.parts.flags : undefined,
      };
      st.save();
    },

    submit() {
      if (this.arcade) return AA.Arcade.submit(this.status.every((s) => s === true), this.status.filter((s) => s !== true).length);
      if (!this.status.every((s) => s === true)) return;
      const m = this.mission;
      const st = AA.State;
      const free = m.kind === 'story' && st.isCompleted(m.id);
      const before = st.rankProgress();
      const res = st.completeMission(m, free ? 0 : this.hints.length);
      Object.values(this.views).forEach((v) => v && v.destroy && v.destroy());
      this.views = {};
      this.mission = null;
      const hintsUsed = this.hints.length;
      // Evento especial: a veces, al entregar, te toca presentar los resultados frente al equipo.
      const ev = this.maybeEvent(m, res);
      if (ev) {
        AA.Game.presentResults(ev, (out) => this.showResult(m, res, before, hintsUsed, out));
        return;
      }
      this.showResult(m, res, before, hintsUsed, null);
    },

    // ¿Sale un evento de presentación? Solo en tareas donde armaste resultados en una tabla,
    // desde el Nivel 2. El primero llega pronto (para que lo conozcas); después, al azar.
    maybeEvent(m, res) {
      const st = AA.State;
      const f = st.data.flags;
      if (m.kind === 'favor' || Cu().MODULES.indexOf(Cu().moduleById(m.module)) < 1) return null;
      const qs = AA.Present.questions(m, this.book, this.defs);
      if (qs.length < 2) return null;
      const go = f.events ? Math.random() < 0.3 || f.eventMiss >= 5 : f.eventMiss >= 1;
      if (!go) {
        f.eventMiss = (f.eventMiss || 0) + 1;
        st.save();
        return null;
      }
      f.events = (f.events || 0) + 1;
      f.eventMiss = 0;
      st.save();
      return { mission: m, questions: qs, xpEach: res.gained ? Math.max(5, Math.round(m.xp * 0.05)) : 0 };
    },

    showResult(m, res, before, hintsUsed, ev) {
      const st = AA.State;
      let bonus = 0;
      if (ev && ev.bonus) {
        bonus = ev.bonus;
        if (st.addXp(bonus)) {
          res.promoted = true;
          res.rank = st.rank();
        }
      }
      const ch = st.CHARACTERS[m.from];
      const prog = st.rankProgress();
      const mod = Cu().moduleById(m.module);
      const nextMod = Cu().MODULES[Cu().MODULES.indexOf(mod) + 1];
      const party = res.moduleCompleted || res.promoted;
      AA.Audio.play(party ? 'fanfare' : 'complete');
      const penalty = res.gained && hintsUsed ? ` <span class="muted">(${hintsUsed} ${T(hintsUsed > 1 ? 'pistas' : 'pista', hintsUsed > 1 ? 'hints' : 'hint')})</span>` : '';
      let extra = '';
      if (ev) {
        extra += `<div class="promo event-promo">📣 ${T(`Presentación: <b>${ev.correct} de ${ev.total}</b> respuestas correctas`, `Presentation: <b>${ev.correct} of ${ev.total}</b> correct answers`)}${bonus ? ` · <b>+${bonus} XP</b> ${T('extra', 'bonus')}` : ''}</div>`;
      }
      if (res.moduleCompleted) {
        extra += `<div class="promo">🎉 ${T(`¡<b>Nivel ${levelNum(mod)}</b> completado! Se desbloqueó la <b>práctica libre</b> de este nivel.`, `<b>Level ${levelNum(mod)}</b> complete! <b>Free practice</b> for this level is unlocked.`)}`;
        if (nextMod) {
          const reason = Cu().lockReason(nextMod);
          extra += reason
            ? `<br>${T('Siguiente nivel', 'Next level')}: ${esc(reason)}.`
            : `<br>${T(`Leo tiene algo nuevo para enseñarte: <b>${esc(AA.L(nextMod.title))}</b>.`, `Leo has something new to teach you: <b>${esc(AA.L(nextMod.title))}</b>.`)}`;
        }
        extra += '</div>';
      }
      if (res.noXpReason === 'limit') extra += `<div class="promo muted-promo">ℹ️ ${T(`Este caso no sumó XP: ya hiciste los ${Cu().PRACTICE_XP_LIMIT} casos con experiencia de este nivel. La práctica igual te sirve.`, `This case earned no XP: you already did the ${Cu().PRACTICE_XP_LIMIT} XP cases of this level. Practice still helps.`)}</div>`;
      if (res.noXpReason === 'rank') extra += `<div class="promo muted-promo">ℹ️ ${T('Este caso no sumó XP: es de una etapa que ya superaste.', 'This case earned no XP: it belongs to a stage you have already passed.')}</div>`;
      const ps = Cu().promotionStatus();
      if (!res.promoted && ps && ps.contentReady && !ps.modulesMissing.length && ps.xpMissing > 0) {
        extra += `<div class="promo">🎯 ${T(`Para ascender a <b>${esc(AA.L(ps.next.name))}</b> te faltan <b>${ps.xpMissing} XP</b>.`, `You need <b>${ps.xpMissing} more XP</b> to be promoted to <b>${esc(AA.L(ps.next.name))}</b>.`)}</div>`;
      }
      if (res.promoted) extra += `<div class="promo">🏅 ${T(`¡Llegaste a <b>${esc(AA.L(res.rank.name))}</b>! Marta quiere hablar con vos.`, `You reached <b>${esc(AA.L(res.rank.name))}</b>! Marta wants to talk to you.`)}</div>`;
      const buttons = [{ label: T('Ir a la bandeja', 'Go to inbox'), action: () => AA.Game.openComputer() }];
      if (m.kind === 'practice') {
        const p = Cu().parseId(m.id);
        buttons.push({ label: T('🎲 Otro caso', '🎲 Another case'), action: () => AA.Game.startPractice(mod, p.size) });
      }
      buttons.push({ label: T('Volver a la oficina', 'Back to the office'), primary: true, action: () => AA.Game.enterOffice() });
      // La barra arranca donde estaba antes de entregar y se llena con animación.
      const fromPct = res.promoted ? 0 : before.pct;
      const reveal = (i) => `class="reveal" style="--d:${(party ? 900 : 250) + i * 140}ms"`;
      const burst = party
        ? `<div class="lvl-burst">
             <div class="lvl-rays"></div>
             <div class="lvl-badge">${res.promoted ? `<span>${T('RANGO', 'RANK')}</span><b>🏅</b>` : `<span>${T('NIVEL', 'LEVEL')}</span><b>${levelNum(mod)}</b>`}</div>
             <div class="lvl-title">${res.promoted ? T('¡ASCENSO!', 'PROMOTED!') : T('¡COMPLETADO!', 'COMPLETE!')}</div>
           </div>`
        : '';
      AA.UI.modal({
        title: party ? T('🎉 ¡Nivel completado!', '🎉 Level complete!') : T('📤 ¡Informe entregado!', '📤 Report submitted!'),
        closable: false,
        className: 'complete' + (party ? ' party' : ''),
        html: `
          ${burst}
          <div class="complete-row" ${reveal(0)}>
            <div data-el="portrait"></div>
            <div><b>${esc(AA.L(ch.name))}</b><p>“${esc(m.feedback)}”</p></div>
          </div>
          <div class="xp-gain" ${reveal(1)}>${res.gained + bonus ? `<span data-el="xp">+0</span> XP${penalty}` : T('Práctica completada (sin XP extra)', 'Practice completed (no extra XP)')}</div>
          <div ${reveal(2)}>
            <div class="rank-line"><b>${esc(AA.L(prog.cur.name))}</b><span class="muted">${st.data.xp} XP${prog.next ? ` / ${prog.next.xp} → ${esc(AA.L(prog.next.name))}` : ''}</span></div>
            ${AA.UI.xpBar(fromPct)}
          </div>
          <div ${reveal(3)}>${extra}</div>`,
        buttons,
        onOpen: (card) => {
          card.querySelector('[data-el="portrait"]').appendChild(AA.UI.portraitCanvas(m.from, 72));
          const start = (party ? 900 : 250) + 140;
          // Contador de XP que sube y barra que se llena.
          const xpEl = card.querySelector('[data-el="xp"]');
          if (xpEl) {
            setTimeout(() => {
              const t0 = performance.now();
              const total = res.gained + bonus;
              const dur = Math.min(1200, 400 + total * 4);
              let ticks = 0;
              const step = (now) => {
                if (!xpEl.isConnected) return;
                const k = Math.min(1, (now - t0) / dur);
                const eased = 1 - Math.pow(1 - k, 3);
                xpEl.textContent = '+' + Math.round(total * eased);
                if (k * 8 > ticks && ticks < 8) {
                  ticks++;
                  AA.Audio.seq([72 + ticks * 2], 0.03, { type: 'square', vol: 0.035 });
                }
                if (k < 1) requestAnimationFrame(step);
                else xpEl.parentElement.classList.add('pop');
              };
              requestAnimationFrame(step);
            }, start);
          }
          const fill = card.querySelector('.xpbar-fill');
          if (fill) setTimeout(() => (fill.style.width = Math.round(Math.max(0, Math.min(1, prog.pct)) * 100) + '%'), start + 380);
        },
      });
      // Siempre hay festejo: chico al entregar, grande al completar un nivel o ascender.
      if (party) {
        AA.UI.confetti(res.promoted ? 260 : 170);
        setTimeout(() => AA.UI.confetti(res.promoted ? 160 : 110), 750);
      } else AA.UI.confetti(80);
    },
  };

  // -------------------------------------------------------------------------
  // Libreta de habilidades
  // -------------------------------------------------------------------------
  // Ficha del jugador (rango, XP y nivel actual) que se ve arriba en la libreta.
  function profileHtml() {
    const st = AA.State;
    if (!st.data) return '';
    const prog = st.rankProgress();
    const cur = Cu().currentModule();
    const level = cur
      ? `${T('Nivel', 'Level')} ${levelNum(cur)} · <b>${esc(AA.L(cur.title))}</b><br>${T('Tareas', 'Tasks')}: ${Cu().doneCount(cur)}/${Cu().REQUIRED}`
      : T('Todos los niveles disponibles completos · ¡Practicá!', 'All available levels complete · Keep practicing!');
    return `
      <div class="nb-profile">
        <span data-portrait></span>
        <div class="nb-pname">${esc(st.data.name)}</div>
        <div class="nb-prank">${esc(AA.L(prog.cur.name))}</div>
        ${AA.UI.xpBar(prog.pct)}
        <div class="nb-pxp">${st.data.xp} XP${prog.next ? ` · ${T('próximo', 'next')}: ${esc(AA.L(prog.next.name))} (${prog.next.xp})` : ''}</div>
        <div class="nb-plevel">${level}</div>
        ${AA.Game.screen === 'office' ? `<button class="nb-pcareer" data-act="career">📈 ${T('Ver plan de carrera', 'See career plan')}</button>` : ''}
      </div>`;
  }

  function openNotebook(focusModule) {
    const learned = Cu().MODULES.filter((m) => Cu().lessonDone(m));
    let current = focusModule && learned.find((m) => m.id === focusModule) ? focusModule : learned.length ? learned[learned.length - 1].id : 'keys';
    const render = (card) => {
      const tabs = Cu()
        .MODULES.map((m, i) => {
          const ok = Cu().lessonDone(m);
          return `<button class="nb-tab ${current === m.id ? 'on' : ''}" data-tab="${m.id}" ${ok ? '' : 'disabled'}>${ok ? `${i + 1}. ${esc(AA.L(m.title))}` : `${i + 1}. ???`}</button>`;
        })
        .join('');
      let page;
      if (current === 'keys') {
        page = `<h2>⌨️ ${T('Atajos de teclado', 'Keyboard shortcuts')}</h2><p class="nb-say">${AA.L(AA.Story.SHORTCUTS)}</p>`;
      } else if (current === 'explore') {
        page =
          `<h2>🔍 ${T('Explorar tablas grandes', 'Exploring big tables')}</h2>` +
          AA.Story.EXPLORE.map((x) => `<section class="nb-skill"><h3>${AA.L(x.title)}</h3><p class="nb-say">${AA.L(x.text)}</p></section>`).join('');
      } else {
        const mod = Cu().moduleById(current);
        page =
          `<h2>${T('Nivel', 'Level')} ${levelNum(mod)} · ${esc(AA.L(mod.title))}</h2>` +
          mod.skills
            .map((id) => {
              const sk = Cu().SKILLS[id];
              const fns = (sk.fns || [])
                .map((f) => {
                  const d = AA.fnDoc(f);
                  return `<div class="nb-fn"><code>${esc(d.sig)}</code><span>${esc(d.ex)}</span></div>`;
                })
                .join('');
              const code = sk.code ? `<pre class="nb-code">${esc(AA.L(sk.code))}</pre>` : '';
              return `<section class="nb-skill"><h3>${esc(AA.L(sk.title))}</h3><p class="nb-say">${AA.L(sk.say)}</p>${fns}${code}<p class="nb-tip">✏️ ${AA.L(sk.tip)}</p></section>`;
            })
            .join('');
      }
      card.querySelector('.nb').innerHTML = `
        <div class="nb-side">
          ${profileHtml()}
          <nav class="nb-tabs">${tabs}<button class="nb-tab ${current === 'keys' ? 'on' : ''}" data-tab="keys">⌨️ ${T('Atajos', 'Shortcuts')}</button><button class="nb-tab ${current === 'explore' ? 'on' : ''}" data-tab="explore">🔍 ${T('Explorar tablas', 'Exploring tables')}</button></nav>
        </div>
        <div class="nb-page">${learned.length || current === 'keys' || current === 'explore' ? page : `<p class="nb-say">${T('Todavía no aprendiste nada. Hablá con Leo junto a la máquina de café.', "You haven't learned anything yet. Talk to Leo by the coffee machine.")}</p>`}</div>`;
      card.querySelectorAll('[data-tab]').forEach((b) =>
        b.addEventListener('click', () => {
          current = b.dataset.tab;
          AA.Audio.play('page');
          render(card);
          const on = card.querySelector('.nb-tab.on');
          if (on) on.focus({ preventScroll: true });
        })
      );
      const slot = card.querySelector('[data-portrait]');
      if (slot) slot.replaceWith(AA.UI.portraitCanvas('player', 48));
      const career = card.querySelector('[data-act="career"]');
      if (career)
        career.addEventListener('click', () => {
          AA.UI.closeModal();
          setTimeout(() => openCareer(), 30);
        });
    };
    AA.Audio.play('page');
    AA.UI.modal({
      title: `📒 ${T('Mi libreta', 'My notebook')}`,
      wide: true,
      className: 'notebook',
      html: '<div class="nb"></div>',
      buttons: [{ label: T('Cerrar', 'Close'), primary: true }],
      onOpen: (card) => render(card),
      onClose: () => MissionScreen.mission && AA.Game.screen === 'mission' && MissionScreen.focusActive(),
    });
  }

  // -------------------------------------------------------------------------
  // Plan de carrera (pizarra)
  // -------------------------------------------------------------------------
  function openCareer() {
    const st = AA.State;
    const idx = st.rankIndex();
    const prog = st.rankProgress();
    const ps = Cu().promotionStatus();
    const ladder = st.RANKS.map(
      (r, i) => `<li class="${i < idx ? 'past' : i === idx ? 'current' : ''}">
        <div class="ladder-row"><span>${i < idx ? '✔' : i === idx ? '★' : '○'}</span><b>${esc(AA.L(r.name))}</b><span class="muted">${r.xp} XP</span></div>
        ${i === idx || i === idx + 1 ? `<ul class="real">${AA.L(Cu().CAREER[i]).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      </li>`
    ).join('');
    let promo = '';
    if (ps) {
      const modsOk = !ps.modulesMissing.length;
      const missing = ps.modulesMissing.map((m) => Cu().MODULES.indexOf(m) + 1).join(', ');
      promo = `
        <h3>${T('Para ascender a', 'To be promoted to')} ${esc(AA.L(ps.next.name))}</h3>
        <ul class="reqs">
          <li class="${modsOk ? 'ok' : ''}">${modsOk ? '✔' : '○'} ${T(`Completar los niveles de tu etapa${missing ? ` (faltan: ${missing})` : ''}`, `Complete your stage's levels${missing ? ` (missing: ${missing})` : ''}`)}</li>
          ${ps.nextStageReady ? '' : `<li>🔒 ${T(`La etapa ${esc(AA.L(ps.next.name))} llega en una próxima actualización`, `The ${esc(AA.L(ps.next.name))} stage arrives in a future update`)}</li>`}
          <li class="${ps.xpMissing ? '' : 'ok'}">${ps.xpMissing ? '○' : '✔'} ${T(`Llegar a ${ps.next.xp} XP`, `Reach ${ps.next.xp} XP`)}${ps.xpMissing ? ` (${T('faltan', 'missing')} ${ps.xpMissing})` : ''}</li>
        </ul>
        <p class="muted small">${T(`Los primeros ${Cu().PRACTICE_XP_LIMIT} casos de práctica de cada nivel suman XP; los de una etapa que ya superaste, no.`, `The first ${Cu().PRACTICE_XP_LIMIT} practice cases of each level earn XP; those from a stage you already passed don't.`)}</p>`;
    }
    const levels = Cu()
      .MODULES.map((m, i) => {
        const done = Cu().doneCount(m);
        const reason = Cu().lockReason(m);
        const prac = st.data.practice[m.id] || 0;
        return `<li class="${reason ? 'locked' : done >= Cu().REQUIRED ? 'done' : ''}">
          <div><b>${T('Nivel', 'Level')} ${i + 1} · ${esc(AA.L(m.title))}</b>${reason ? `<span class="muted small">🔒 ${esc(reason)}</span>` : ''}</div>
          <div class="lvl-bar"><div style="width:${(done / Cu().REQUIRED) * 100}%"></div></div>
          <span class="muted small">${done}/${Cu().REQUIRED} ${T('tareas', 'tasks')} · ${prac} ${T('prácticas', 'practices')} (${Math.min(prac, Cu().PRACTICE_XP_LIMIT)}/${Cu().PRACTICE_XP_LIMIT} ${T('con XP', 'with XP')})</span>
        </li>`;
      })
      .join('');
    AA.UI.modal({
      title: `📈 ${T('Plan de carrera', 'Career plan')}`,
      wide: true,
      html: `
        <div class="career">
          <div>
            <div class="rank-line"><b>${esc(AA.L(prog.cur.name))}</b><span class="muted">${st.data.xp} XP${prog.next ? ` / ${prog.next.xp}` : ''}</span></div>
            ${AA.UI.xpBar(prog.pct)}
            <p class="muted small career-note">${T('Qué hace cada rango en la vida real (según ofertas y escaleras de carrera de la industria):', 'What each rank does in real life (based on industry job posts and career ladders):')}</p>
            <ol class="ladder">${ladder}</ol>
          </div>
          <div>
            ${promo}
            <h3>${T('Niveles', 'Levels')}</h3>
            <ul class="levels">${levels}</ul>
            <h3>${T('Hoja de ruta', 'Roadmap')}</h3>
            <ul class="roadmap">${[
              [T('Pasante', 'Intern'), T('Niveles 1–6: fórmulas, funciones, SI, limpieza, CONTAR.SI y $, gráficos', 'Levels 1–6: formulas, functions, IF, cleaning, COUNTIF and $, charts')],
              ['Junior', T('Niveles 7–11: BUSCARV/BUSCARX, calidad de datos, tablas dinámicas, SQL, reportes y dashboards existentes', 'Levels 7–11: VLOOKUP/XLOOKUP, data quality, pivot tables, SQL, reports and existing dashboards')],
              ['Semi-Senior', T('Niveles 12–15: estadística, dashboards desde cero, análisis de punta a punta y storytelling, revisar a un junior', 'Levels 12–15: statistics, dashboards from scratch, end-to-end analysis and storytelling, reviewing a junior')],
              ['Senior', T('Niveles 16–19: KPIs, pruebas A/B, datos incompletos, resúmenes ejecutivos', 'Levels 16–19: KPIs, A/B tests, incomplete data, executive summaries')],
              ['Lead', T('Próximamente: estrategia, priorización, stakeholders, gobierno de datos', 'Coming soon: strategy, prioritization, stakeholders, data governance')],
            ]
              .map(([name, txt], i) => `<li class="${i === idx ? 'now' : ''}"><b>${name}</b> · ${txt}</li>`)
              .join('')}</ul>
          </div>
        </div>`,
      buttons: [{ label: T('Cerrar', 'Close'), primary: true }],
    });
  }

  AA.Screens = { Inbox, MissionScreen, openNotebook, openCareer, clearCache: () => cache.clear() };
})();
