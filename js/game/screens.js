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
      const groups = Cu()
        .MODULES.map((mod) => this.renderGroup(mod))
        .join('');
      root.innerHTML = `
        <div class="monitor">
          <div class="os-bar">
            <div class="os-title">📨 CóndorMail <span>· ${esc(st.data.name)} — ${esc(AA.L(st.rank().name))}</span></div>
            <button class="btn btn-ghost" data-act="back">← ${T('Volver a la oficina', 'Back to the office')} <kbd>Esc</kbd></button>
          </div>
          <div class="mail">
            <aside class="mail-list">${groups}
              <div class="mail-group future"><div class="mail-group-head">🔒 ${T('Etapa 2 · Próximamente', 'Stage 2 · Coming soon')}</div>
              <div class="mail-item locked"><div class="mail-subject">${T('BUSCARV, tablas dinámicas y dashboards', 'VLOOKUP, pivot tables and dashboards')}</div></div></div>
            </aside>
            <article class="mail-view">${this.renderView()}</article>
          </div>
        </div>`;
      root.querySelector('[data-act="back"]').addEventListener('click', () => AA.Game.enterOffice());
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
      if (sel.startsWith('lesson:') || sel.startsWith('practice:') || sel.startsWith('locked:')) return true;
      return Cu().missionAvailable(sel);
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
        return `<div class="mail-group">${head}${item('lesson:' + mod.id, `<div class="mail-from">☕ Leo</div><div class="mail-subject">${T('Primero hablá con Leo', 'Talk to Leo first')}</div><div class="mail-meta"><span class="chip new">${T('Lección pendiente', 'Lesson pending')}</span></div>`)}</div>`;
      }
      const items = Cu()
        .requiredIds(mod)
        .map((id) => {
          if (!Cu().missionAvailable(id)) {
            return `<div class="mail-item locked"><div class="mail-subject">🔒 ${T('Completá la tarea anterior', 'Complete the previous task')}</div></div>`;
          }
          const m = getMission(id, (st.data.progress[id] && st.data.progress[id].lang) || AA.lang);
          const status = st.isCompleted(id)
            ? `<span class="chip ok">✔ ${T('Entregado', 'Delivered')}</span>`
            : st.data.progress[id]
              ? `<span class="chip warn">${T('En progreso', 'In progress')}</span>`
              : `<span class="chip new">${T('Nuevo', 'New')}</span>`;
          const ch = st.CHARACTERS[m.from];
          return item(id, `<div class="mail-from">${esc(AA.L(ch.name))} ${AA.UI.deptBadge(m.dept)}</div><div class="mail-subject">${esc(m.subject)}</div><div class="mail-meta">${status}<span class="xp">+${m.xp} XP</span></div>`, st.isCompleted(id) ? 'read' : '');
        })
        .join('');
      const practice = Cu().isModuleComplete(mod)
        ? item('practice:' + mod.id, `<div class="mail-subject">🎲 ${T('Práctica libre', 'Free practice')}</div><div class="mail-meta"><span class="chip">${T('Casos aleatorios', 'Random cases')}</span><span class="xp">+${mod.xp}–${Cu().practiceXp(mod, 'large')} XP</span></div>`, 'practice')
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
      const sizeCard = (size, title, desc) => `
        <div class="practice-card">
          <h3>${title}</h3>
          <p class="muted">${desc}</p>
          <div class="xp">+${Cu().practiceXp(mod, size)} XP</div>
          <button class="btn btn-primary" data-practice="${mod.id}:${size}">${T('Generar caso', 'Generate case')}</button>
        </div>`;
      return `
        <header class="mail-head">
          <h2>🎲 ${T('Práctica libre', 'Free practice')} · ${T('Nivel', 'Level')} ${levelNum(mod)}</h2>
          <p class="muted">${esc(AA.L(mod.title))}</p>
        </header>
        <div class="mail-body">
          <p>${T('Casos generados al azar con las herramientas de este nivel, en tablas más grandes. Cada caso es distinto y suma experiencia: ideal para afianzar lo aprendido y llegar al próximo rango.', 'Randomly generated cases using this level\'s tools, with bigger tables. Every case is different and earns experience: ideal to lock in what you learned and reach the next rank.')}</p>
          <p class="muted">${T('Casos completados en este nivel', 'Cases completed in this level')}: <b>${count}</b></p>
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
          ${sizeCard('large', T('Tabla grande', 'Large table'), T('35 a 65 filas aprox. ¡Más XP!', 'About 35 to 65 rows. More XP!'))}
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
  // Planilla de la misión
  // -------------------------------------------------------------------------
  function rectsOf(list) {
    return (list || []).map((r) => F.parseRange(r)).filter(Boolean);
  }
  function inRects(rects, c, r) {
    return rects.some((k) => c >= k.c1 && c <= k.c2 && r >= k.r1 && r <= k.r2);
  }

  const MissionScreen = {
    mission: null,
    sheet: null,
    view: null,
    base: null,
    answers: {},
    hints: [],
    status: [],
    saveTimer: null,

    open(id) {
      const st = AA.State;
      const prog = st.data.progress[id];
      const lang = (prog && prog.lang) || AA.lang;
      const mission = getMission(id, lang);
      this.mission = mission;
      this.lang = lang;
      const def = mission.sheet;
      this.sheet = AA.Content.buildSheet(def);
      this.base = new Map(this.sheet.serialize().map(([c, r, i]) => [c + ',' + r, i]));
      this.answers = {};
      this.hints = [];
      if (prog) {
        for (const [c, r, input] of prog.cells || []) this.sheet.setInput(c, r, input, true);
        this.answers = Object.assign({}, prog.answers);
        this.hints = (prog.hints || []).slice();
      }

      const locked = rectsOf(def.locked);
      const header = rectsOf(def.header);
      const labels = rectsOf(def.labels);
      const targets = rectsOf(def.targets);
      const spaces = rectsOf(def.showSpaces);
      const formats = def.formats || {};

      const root = document.getElementById('screen-mission');
      const ch = st.CHARACTERS[mission.from];
      const mod = Cu().moduleById(mission.module);
      root.innerHTML = `
        <header class="ms-top">
          <button class="btn btn-ghost" data-act="office">← ${T('Oficina', 'Office')}</button>
          <button class="btn btn-ghost" data-act="inbox">📨 ${T('Bandeja', 'Inbox')}</button>
          <div class="ms-title">
            <span class="file-icon sm">XLS</span>
            <div><b>${esc(mission.file)}</b><span class="muted">${T('Nivel', 'Level')} ${levelNum(mod)} · ${esc(mission.subject)} · ${esc(AA.L(ch.name))}</span></div>
          </div>
          <div class="spacer"></div>
          <button class="btn" data-act="notebook">📒 ${T('Libreta', 'Notebook')}</button>
          <button class="btn" data-act="email">📧 ${T('Ver pedido', 'View request')}</button>
          <button class="btn" data-act="hint">💡 ${T('Pista', 'Hint')}</button>
          <button class="btn btn-primary" data-act="submit" disabled>📤 ${T('Entregar informe', 'Submit report')}</button>
        </header>
        <div class="ms-body">
          <aside class="ms-side">
            <section class="card">
              <h3>${T('Objetivos', 'Objectives')} <span class="muted" data-el="count"></span></h3>
              <ol class="objectives" data-el="objectives"></ol>
            </section>
            <section class="card tips">
              <h3>📒 ${T('Notas de Leo', "Leo's notes")}</h3>
              <ul>${mission.tips.map((t) => `<li>${t}</li>`).join('')}</ul>
            </section>
          </aside>
          <main class="ms-sheet">
            <div class="ss-host" data-el="grid"></div>
            <div class="ms-tabs"><span class="tab active">${T('Hoja1', 'Sheet1')}</span><span class="muted">${T('Las celdas grises son datos originales (bloqueados) · las amarillas son las que tenés que completar', 'Gray cells are original data (locked) · yellow cells are the ones you must fill in')}</span></div>
          </main>
        </div>`;

      this.objList = root.querySelector('[data-el="objectives"]');
      this.countEl = root.querySelector('[data-el="count"]');
      this.submitBtn = root.querySelector('[data-act="submit"]');
      root.querySelector('[data-act="office"]').addEventListener('click', () => this.leave(() => AA.Game.enterOffice()));
      root.querySelector('[data-act="inbox"]').addEventListener('click', () => this.leave(() => AA.Game.openComputer()));
      root.querySelector('[data-act="notebook"]').addEventListener('click', () => openNotebook(mission.module));
      root.querySelector('[data-act="email"]').addEventListener('click', () => this.showEmail());
      root.querySelector('[data-act="hint"]').addEventListener('click', () => this.useHint());
      this.submitBtn.addEventListener('click', () => this.submit());

      this.view = new AA.SpreadsheetView(root.querySelector('[data-el="grid"]'), this.sheet, {
        colWidths: def.colWidths,
        startCell: def.start,
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
          if (inRects(targets, c, r) && this.sheet.isEmpty(c, r)) cls.push('target');
          if (inRects(spaces, c, r)) cls.push('spaces');
          return cls.join(' ');
        },
        displayHtml: spaces.length
          ? (c, r, text) => (inRects(spaces, c, r) ? esc(text).replace(/^ +| +$| {2,}/g, (m) => '<i class="sp">' + '·'.repeat(m.length) + '</i>') : null)
          : null,
        onLocked: () => {
          AA.Audio.play('error');
          AA.UI.toast(T('🔒 Esa celda tiene <b>datos originales</b>. No se tocan: trabajá en las columnas a completar.', '🔒 That cell holds <b>original data</b>. Don\'t touch it: work in the columns you need to fill in.'), 'warn');
        },
        onToast: (msg) => AA.UI.toast(msg, 'info'),
        onEdit: () => {
          AA.Audio.play('type');
          this.evaluate();
          this.scheduleSave();
        },
      });

      this.evaluate(true);
      setTimeout(() => this.view.focusGrid(), 50);
      if (!prog && !st.isCompleted(id) && id === 'mod1-1') setTimeout(() => this.showTutorial(), 250);
    },

    leave(then) {
      this.saveNow();
      this.mission = null;
      then();
    },

    // --- Objetivos
    evaluate(initial) {
      const S = AA.V.query(this.sheet);
      const prev = this.status;
      const prevLang = AA.lang;
      AA.setLang(this.lang);
      this.status = this.mission.objectives.map((o, i) => {
        if (o.answer) {
          const a = this.answers[i];
          return a && a.ok ? true : a && a.value ? 'wrong' : false;
        }
        try {
          return o.check(S);
        } catch (e) {
          console.error(e);
          return false;
        }
      });
      AA.setLang(prevLang);
      if (!initial) {
        let newlyDone = false;
        this.status.forEach((s, i) => {
          if (s === true && prev[i] !== true) {
            newlyDone = true;
            AA.UI.toast(T(`✅ Objetivo ${i + 1} cumplido`, `✅ Objective ${i + 1} done`), 'ok');
          }
        });
        if (newlyDone) AA.Audio.play('success');
      }
      this.renderObjectives();
    },

    renderObjectives() {
      const objs = this.mission.objectives;
      const done = this.status.filter((s) => s === true).length;
      this.countEl.textContent = `${done}/${objs.length}`;
      this.objList.innerHTML = objs
        .map((o, i) => {
          const s = this.status[i];
          const ok = s === true;
          const note = typeof s === 'string' && s !== 'wrong' ? `<div class="obj-note">${esc(s)}</div>` : '';
          const hint = this.hints.includes(i) ? `<div class="obj-hint">💡 ${esc(o.hint)}</div>` : '';
          let answer = '';
          if (o.answer) {
            const a = this.answers[i] || {};
            answer = ok
              ? `<div class="obj-answer done">${T('Tu respuesta', 'Your answer')}: <b>${esc(a.value)}</b></div>`
              : `<form class="obj-answer" data-answer="${i}">
                   <input type="text" placeholder="${esc(o.placeholder || T('Tu respuesta', 'Your answer'))}" value="${esc(a.value || '')}" autocomplete="off">
                   <button class="btn btn-sm" type="submit">${T('Responder', 'Answer')}</button>
                 </form>${s === 'wrong' ? `<div class="obj-note">${T('Mmm, no es correcto. Revisá los datos y probá de nuevo.', "Hmm, that's not right. Check the data and try again.")}</div>` : ''}`;
          }
          return `<li class="${ok ? 'ok' : ''}"><span class="obj-check">${ok ? '✔' : ''}</span><div class="obj-text">${o.text}${note}${answer}${hint}</div></li>`;
        })
        .join('');
      this.objList.querySelectorAll('form[data-answer]').forEach((form) => {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const i = +form.dataset.answer;
          const value = form.querySelector('input').value.trim();
          if (!value) return;
          const ok = !!this.mission.objectives[i].answer(value);
          this.answers[i] = { value, ok };
          if (!ok) {
            AA.Audio.play('error');
            form.classList.add('shake');
          }
          this.evaluate();
          this.scheduleSave();
        });
      });
      const all = this.status.every((s) => s === true);
      this.submitBtn.disabled = !all;
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
        html: `<p>${T(`Leo te puede dar una pista para el objetivo <b>${i + 1}</b>.`, `Leo can give you a hint for objective <b>${i + 1}</b>.`)}</p>
               <p class="muted">${free ? T('Esta tarea ya está completada: las pistas son gratis.', 'This task is already completed: hints are free.') : T('Cada pista reduce un 15% la XP de esta tarea (mínimo 40%).', 'Each hint reduces this task\'s XP by 15% (minimum 40%).')}</p>`,
        buttons: [
          { label: T('Mejor sigo intentando', "I'll keep trying") },
          {
            label: T('Dame la pista', 'Give me the hint'),
            primary: true,
            action: () => {
              this.hints.push(i);
              this.renderObjectives();
              this.scheduleSave();
            },
          },
        ],
        onClose: () => this.view.focusGrid(),
      });
    },

    showEmail() {
      const m = this.mission;
      const ch = AA.State.CHARACTERS[m.from];
      AA.UI.modal({
        title: esc(m.subject),
        html: `<div class="mail-sender"><div class="avatar" style="--c:${ch.shirt}">${esc(AA.L(ch.name)[0])}</div><div><b>${esc(AA.L(ch.name))}</b> · ${esc(AA.L(ch.role))}</div></div>
               <div class="mail-body">${AA.fillName(m.email)}</div>`,
        buttons: [{ label: T('Volver a la planilla', 'Back to the spreadsheet'), primary: true }],
        onClose: () => this.view.focusGrid(),
      });
    },

    showTutorial() {
      AA.UI.modal({
        title: T('🧭 Cómo usar la planilla', '🧭 How to use the spreadsheet'),
        wide: true,
        html: `
          <div class="tutorial">
            <div>${T('<b>1. Seleccioná</b> una celda con un clic (o con las flechas).', '<b>1. Select</b> a cell with a click (or the arrow keys).')}</div>
            <div>${T('<b>2. Escribí</b> directamente. Si empieza con <code>=</code> es una fórmula: <code>=C2*D2</code>.', '<b>2. Type</b> directly. If it starts with <code>=</code> it is a formula: <code>=C2*D2</code>.')}</div>
            <div>${T('<b>3. Enter</b> confirma. <b>Esc</b> cancela. <b>Doble clic</b> o <b>F2</b> para editar.', '<b>3. Enter</b> confirms. <b>Esc</b> cancels. <b>Double-click</b> or <b>F2</b> to edit.')}</div>
            <div>${T('<b>4. Mientras escribís una fórmula</b>, hacé clic en otra celda para insertar su referencia.', '<b>4. While typing a formula</b>, click another cell to insert its reference.')}</div>
            <div>${T('<b>5. Rellenar:</b> arrastrá el cuadradito azul de la esquina de la selección para copiar la fórmula.', '<b>5. Fill:</b> drag the little blue square at the corner of the selection to copy the formula.')}</div>
            <div>${T('<b>6. Objetivos:</b> se tildan solos a la izquierda. Las preguntas ❓ se responden escribiendo.', '<b>6. Objectives:</b> they tick themselves on the left. Questions ❓ are answered by typing.')}</div>
          </div>`,
        buttons: [{ label: T('¡Entendido!', 'Got it!'), primary: true }],
        onClose: () => this.view.focusGrid(),
      });
    },

    // --- Guardado del progreso (solo las celdas que cambiaron respecto de los datos originales)
    scheduleSave() {
      clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => this.saveNow(), 400);
    },
    saveNow() {
      clearTimeout(this.saveTimer);
      if (!this.mission) return;
      const st = AA.State;
      const diff = [];
      const current = new Map(this.sheet.serialize().map(([c, r, i]) => [c + ',' + r, i]));
      for (const [k, input] of current) if (this.base.get(k) !== input) diff.push([...k.split(',').map(Number), input]);
      for (const k of this.base.keys()) if (!current.has(k)) diff.push([...k.split(',').map(Number), '']);
      st.data.progress[this.mission.id] = { cells: diff, answers: this.answers, hints: this.hints, lang: this.lang };
      st.save();
    },

    submit() {
      if (!this.status.every((s) => s === true)) return;
      const m = this.mission;
      const st = AA.State;
      const free = m.kind === 'story' && st.isCompleted(m.id);
      const res = st.completeMission(m, free ? 0 : this.hints.length);
      this.mission = null;
      const ch = st.CHARACTERS[m.from];
      const prog = st.rankProgress();
      const mod = Cu().moduleById(m.module);
      const nextMod = Cu().MODULES[Cu().MODULES.indexOf(mod) + 1];
      AA.Audio.play(res.promoted ? 'levelup' : 'complete');
      const penalty = res.gained && this.hints.length ? ` <span class="muted">(${this.hints.length} ${T(this.hints.length > 1 ? 'pistas' : 'pista', this.hints.length > 1 ? 'hints' : 'hint')})</span>` : '';
      let extra = '';
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
      if (res.promoted) extra += `<div class="promo">🏅 ${T(`¡Llegaste a <b>${esc(AA.L(res.rank.name))}</b>! Marta quiere hablar con vos.`, `You reached <b>${esc(AA.L(res.rank.name))}</b>! Marta wants to talk to you.`)}</div>`;
      const buttons = [{ label: T('Ir a la bandeja', 'Go to inbox'), action: () => AA.Game.openComputer() }];
      if (m.kind === 'practice') {
        const p = Cu().parseId(m.id);
        buttons.push({ label: T('🎲 Otro caso', '🎲 Another case'), action: () => AA.Game.startPractice(mod, p.size) });
      }
      buttons.push({ label: T('Volver a la oficina', 'Back to the office'), primary: true, action: () => AA.Game.enterOffice() });
      AA.UI.modal({
        title: T('📤 ¡Informe entregado!', '📤 Report submitted!'),
        closable: false,
        className: 'complete',
        html: `
          <div class="complete-row">
            <div data-el="portrait"></div>
            <div><b>${esc(AA.L(ch.name))}</b><p>“${esc(m.feedback)}”</p></div>
          </div>
          <div class="xp-gain">${res.gained ? `+${res.gained} XP${penalty}` : T('Práctica completada (sin XP extra)', 'Practice completed (no extra XP)')}</div>
          <div class="rank-line"><b>${esc(AA.L(prog.cur.name))}</b><span class="muted">${st.data.xp} XP${prog.next ? ` / ${prog.next.xp} → ${esc(AA.L(prog.next.name))}` : ''}</span></div>
          ${AA.UI.xpBar(prog.pct)}
          ${extra}`,
        buttons,
        onOpen: (card) => card.querySelector('[data-el="portrait"]').appendChild(AA.UI.portraitCanvas(m.from, 72)),
      });
    },
  };

  // -------------------------------------------------------------------------
  // Libreta de habilidades
  // -------------------------------------------------------------------------
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
              return `<section class="nb-skill"><h3>${esc(AA.L(sk.title))}</h3><p class="nb-say">${AA.L(sk.say)}</p>${fns}<p class="nb-tip">✏️ ${AA.L(sk.tip)}</p></section>`;
            })
            .join('');
      }
      card.querySelector('.nb').innerHTML = `
        <nav class="nb-tabs">${tabs}<button class="nb-tab ${current === 'keys' ? 'on' : ''}" data-tab="keys">⌨️ ${T('Atajos', 'Shortcuts')}</button></nav>
        <div class="nb-page">${learned.length || current === 'keys' ? page : `<p class="nb-say">${T('Todavía no aprendiste nada. Hablá con Leo junto a la máquina de café.', "You haven't learned anything yet. Talk to Leo by the coffee machine.")}</p>`}</div>`;
      card.querySelectorAll('[data-tab]').forEach((b) =>
        b.addEventListener('click', () => {
          current = b.dataset.tab;
          AA.Audio.play('page');
          render(card);
        })
      );
    };
    AA.Audio.play('page');
    AA.UI.modal({
      title: `📒 ${T('Mi libreta', 'My notebook')}`,
      wide: true,
      className: 'notebook',
      html: '<div class="nb"></div>',
      buttons: [{ label: T('Cerrar', 'Close'), primary: true }],
      onOpen: (card) => render(card),
      onClose: () => MissionScreen.mission && AA.Game.screen === 'mission' && MissionScreen.view.focusGrid(),
    });
  }

  // -------------------------------------------------------------------------
  // Plan de carrera (pizarra)
  // -------------------------------------------------------------------------
  function openCareer() {
    const st = AA.State;
    const idx = st.rankIndex();
    const prog = st.rankProgress();
    const ladder = st.RANKS.map(
      (r, i) => `<li class="${i < idx ? 'past' : i === idx ? 'current' : ''}"><span>${i < idx ? '✔' : i === idx ? '★' : '○'}</span><b>${esc(AA.L(r.name))}</b><span class="muted">${r.xp} XP</span></li>`
    ).join('');
    const levels = Cu()
      .MODULES.map((m, i) => {
        const done = Cu().doneCount(m);
        const reason = Cu().lockReason(m);
        const prac = st.data.practice[m.id] || 0;
        return `<li class="${reason ? 'locked' : done >= Cu().REQUIRED ? 'done' : ''}">
          <div><b>${T('Nivel', 'Level')} ${i + 1} · ${esc(AA.L(m.title))}</b>${reason ? `<span class="muted small">🔒 ${esc(reason)}</span>` : ''}</div>
          <div class="lvl-bar"><div style="width:${(done / Cu().REQUIRED) * 100}%"></div></div>
          <span class="muted small">${done}/${Cu().REQUIRED} ${T('tareas', 'tasks')} · ${prac} ${T('prácticas', 'practices')}</span>
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
            <ol class="ladder">${ladder}</ol>
          </div>
          <div>
            <h3>${T('Niveles', 'Levels')}</h3>
            <ul class="levels">${levels}</ul>
            <h3>${T('Hoja de ruta', 'Roadmap')}</h3>
            <ul class="roadmap">
              <li class="now"><b>${T('Etapa 1', 'Stage 1')}</b> · ${T('Fórmulas, funciones, SI, limpieza de texto, CONTAR.SI y $', 'Formulas, functions, IF, text cleaning, COUNTIF and $')}</li>
              <li><b>${T('Etapa 2', 'Stage 2')}</b> · ${T('Tipos de datos, duplicados, ordenar/filtrar, BUSCARV/BUSCARX', 'Data types, duplicates, sort/filter, VLOOKUP/XLOOKUP')}</li>
              <li><b>${T('Etapa 3', 'Stage 3')}</b> · ${T('Tablas dinámicas y dashboards con gráficos', 'Pivot tables and dashboards with charts')}</li>
              <li><b>${T('Etapa 4', 'Stage 4')}</b> · ${T('Casos Senior: investigaciones con datos', 'Senior cases: data investigations')}</li>
            </ul>
          </div>
        </div>`,
      buttons: [{ label: T('Cerrar', 'Close'), primary: true }],
    });
  }

  AA.Screens = { Inbox, MissionScreen, openNotebook, openCareer, clearCache: () => cache.clear() };
})();
