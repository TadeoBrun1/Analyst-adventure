/*
 * Analyst Adventure — Pantallas: bandeja de entrada, planilla de misión, manual y plan de carrera.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const F = AA.Formula;
  const esc = (s) => AA.escapeHtml(s);

  // -------------------------------------------------------------------------
  // Bandeja de entrada
  // -------------------------------------------------------------------------
  const Inbox = {
    selected: null,

    render() {
      const st = AA.State;
      const root = document.getElementById('screen-computer');
      const rank = st.rank();
      const missions = AA.Missions.list.filter((m) => st.isAvailable(m));
      if (!this.selected || !missions.find((m) => m.id === this.selected)) {
        const next = st.nextMission();
        this.selected = next ? next.id : missions.length ? missions[missions.length - 1].id : null;
      }
      const items = missions
        .slice()
        .reverse()
        .map((m) => {
          const ch = st.CHARACTERS[m.from];
          const status = st.isCompleted(m.id)
            ? '<span class="chip ok">✔ Entregado</span>'
            : st.data.progress[m.id]
              ? '<span class="chip warn">En progreso</span>'
              : '<span class="chip new">Nuevo</span>';
          return `
            <button class="mail-item ${m.id === this.selected ? 'active' : ''} ${st.isCompleted(m.id) ? 'read' : ''}" data-id="${m.id}">
              <div class="mail-from">${esc(ch.name)} ${AA.UI.deptBadge(m.dept)}</div>
              <div class="mail-subject">${esc(m.subject)}</div>
              <div class="mail-meta">${status}<span class="xp">+${m.xp} XP</span></div>
            </button>`;
        })
        .join('');
      const locked = AA.Missions.list
        .filter((m) => !st.isAvailable(m))
        .map(
          (m) => `
            <div class="mail-item locked">
              <div class="mail-from">🔒 ${esc(st.CHARACTERS[m.from].name)} ${AA.UI.deptBadge(m.dept)}</div>
              <div class="mail-subject">Completá las tareas anteriores para desbloquear</div>
            </div>`
        )
        .join('');
      const upcoming = AA.Missions.upcoming
        .map(
          (u) => `
            <div class="mail-item locked">
              <div class="mail-from">🔒 ${esc(u.from)} ${AA.UI.deptBadge(u.dept)}</div>
              <div class="mail-subject">${esc(u.subject)}</div>
              <div class="mail-meta"><span class="chip">Requiere ${esc(u.rankName)} · Próximamente</span></div>
            </div>`
        )
        .join('');

      root.innerHTML = `
        <div class="monitor">
          <div class="os-bar">
            <div class="os-title">📨 CóndorMail <span>· ${esc(st.data.name)} — ${esc(rank.name)}</span></div>
            <button class="btn btn-ghost" data-act="back">← Volver a la oficina <kbd>Esc</kbd></button>
          </div>
          <div class="mail">
            <aside class="mail-list">
              <div class="mail-folder">Bandeja de entrada</div>
              ${items}${locked}${upcoming}
            </aside>
            <article class="mail-view">${this.renderMail()}</article>
          </div>
        </div>`;

      root.querySelector('[data-act="back"]').addEventListener('click', () => AA.Game.enterOffice());
      root.querySelectorAll('.mail-item[data-id]').forEach((b) =>
        b.addEventListener('click', () => {
          this.selected = b.dataset.id;
          this.render();
        })
      );
      const open = root.querySelector('[data-act="open"]');
      if (open) open.addEventListener('click', () => AA.Game.openMission(this.selected));
    },

    renderMail() {
      const m = AA.Missions.byId(this.selected);
      if (!m) return '<div class="mail-empty">No hay mensajes.</div>';
      const st = AA.State;
      const ch = st.CHARACTERS[m.from];
      const doneInfo = st.data.completed[m.id];
      const objectives = m.objectives.map((o) => `<li>${o.text}</li>`).join('');
      return `
        <header class="mail-head">
          <h2>${esc(m.subject)}</h2>
          <div class="mail-sender">
            <div class="avatar" style="--c:${ch.shirt}">${esc(ch.name[0])}</div>
            <div><b>${esc(ch.name)}</b> · ${esc(ch.role)}<br><span class="muted">para: ${esc(st.data.name)}</span></div>
            <div class="spacer"></div>${AA.UI.deptBadge(m.dept)}
          </div>
        </header>
        <div class="mail-body">${AA.fillName(m.email)}</div>
        <div class="attachment">
          <div class="file-icon">XLS</div>
          <div class="file-info"><b>${esc(m.file)}</b><span class="muted">Planilla adjunta</span></div>
          <button class="btn btn-primary" data-act="open">${doneInfo ? 'Volver a abrir' : st.data.progress[m.id] ? 'Continuar' : 'Abrir planilla'}</button>
        </div>
        <details class="mail-objectives" ${doneInfo ? '' : 'open'}>
          <summary>Lo que hay que hacer (${m.objectives.length} objetivos) · recompensa <b>+${m.xp} XP</b></summary>
          <ol>${objectives}</ol>
        </details>
        ${doneInfo ? `<p class="done-note">✔ Entregaste este informe y ganaste <b>${doneInfo.xp} XP</b>. Podés volver a abrirlo para practicar (no suma XP).</p>` : ''}`;
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

    open(mission) {
      const st = AA.State;
      this.mission = mission;
      const def = mission.sheet;
      this.sheet = AA.Missions.buildSheet(def);
      this.base = new Map(this.sheet.serialize().map(([c, r, i]) => [c + ',' + r, i]));
      const prog = st.data.progress[mission.id];
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
      root.innerHTML = `
        <header class="ms-top">
          <button class="btn btn-ghost" data-act="office">← Oficina</button>
          <button class="btn btn-ghost" data-act="inbox">📨 Bandeja</button>
          <div class="ms-title">
            <span class="file-icon sm">XLS</span>
            <div><b>${esc(mission.file)}</b><span class="muted">${esc(mission.subject)} · ${esc(ch.name)}</span></div>
          </div>
          <div class="spacer"></div>
          <button class="btn" data-act="email">📧 Ver pedido</button>
          <button class="btn" data-act="hint">💡 Pista</button>
          <button class="btn btn-primary" data-act="submit" disabled>📤 Entregar informe</button>
        </header>
        <div class="ms-body">
          <aside class="ms-side">
            <section class="card">
              <h3>Objetivos <span class="muted" data-el="count"></span></h3>
              <ol class="objectives" data-el="objectives"></ol>
            </section>
            <section class="card tips">
              <h3>📒 Notas de Leo</h3>
              <ul>${mission.tips.map((t) => `<li>${t}</li>`).join('')}</ul>
            </section>
          </aside>
          <main class="ms-sheet">
            <div class="ss-host" data-el="grid"></div>
            <div class="ms-tabs"><span class="tab active">Hoja1</span><span class="muted">Las celdas grises son datos originales (bloqueados) · las punteadas son las que tenés que completar</span></div>
          </main>
        </div>`;

      this.objList = root.querySelector('[data-el="objectives"]');
      this.countEl = root.querySelector('[data-el="count"]');
      this.submitBtn = root.querySelector('[data-act="submit"]');
      root.querySelector('[data-act="office"]').addEventListener('click', () => this.leave(() => AA.Game.enterOffice()));
      root.querySelector('[data-act="inbox"]').addEventListener('click', () => this.leave(() => AA.Game.openComputer()));
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
        onLocked: () => AA.UI.toast('🔒 Esa celda tiene <b>datos originales</b>. No se tocan: trabajá en las columnas a completar.', 'warn'),
        onToast: (msg) => AA.UI.toast(msg, 'info'),
        onEdit: () => {
          this.evaluate();
          this.scheduleSave();
        },
      });

      this.evaluate(true);
      setTimeout(() => this.view.focusGrid(), 50);
      if (!prog && !st.isCompleted(mission.id) && mission === AA.Missions.list[0]) {
        setTimeout(() => this.showTutorial(), 250);
      }
    },

    leave(then) {
      this.saveNow();
      then();
    },

    // --- Objetivos
    evaluate(initial) {
      const S = AA.V.query(this.sheet);
      const prev = this.status;
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
      if (!initial) {
        this.status.forEach((s, i) => {
          if (s === true && prev[i] !== true) AA.UI.toast(`✅ Objetivo ${i + 1} cumplido`, 'ok');
        });
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
              ? `<div class="obj-answer done">Tu respuesta: <b>${esc(a.value)}</b></div>`
              : `<form class="obj-answer" data-answer="${i}">
                   <input type="text" placeholder="${esc(o.placeholder || 'Tu respuesta')}" value="${esc(a.value || '')}" autocomplete="off">
                   <button class="btn btn-sm" type="submit">Responder</button>
                 </form>${s === 'wrong' ? '<div class="obj-note">Mmm, no es correcto. Revisá los datos y probá de nuevo.</div>' : ''}`;
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
          if (!ok) form.classList.add('shake');
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
        AA.UI.toast(pending < 0 ? 'Ya está todo listo: ¡entregá el informe!' : 'Ya tenés las pistas de los objetivos pendientes a la vista.', 'info');
        return;
      }
      const already = AA.State.isCompleted(this.mission.id);
      AA.UI.modal({
        title: '💡 ¿Pedir una pista?',
        html: `<p>Leo te puede dar una pista para el objetivo <b>${i + 1}</b>.</p>
               <p class="muted">${already ? 'Esta misión ya está completada: las pistas son gratis.' : 'Cada pista reduce un 15% la XP de esta misión (mínimo 40%).'}</p>`,
        buttons: [
          { label: 'Mejor sigo intentando' },
          {
            label: 'Dame la pista',
            primary: true,
            action: () => {
              this.hints.push(i);
              this.renderObjectives();
              this.scheduleSave();
            },
          },
        ],
      });
    },

    showEmail() {
      const m = this.mission;
      const ch = AA.State.CHARACTERS[m.from];
      AA.UI.modal({
        title: esc(m.subject),
        html: `<div class="mail-sender"><div class="avatar" style="--c:${ch.shirt}">${esc(ch.name[0])}</div><div><b>${esc(ch.name)}</b> · ${esc(ch.role)}</div></div>
               <div class="mail-body">${AA.fillName(m.email)}</div>`,
        buttons: [{ label: 'Volver a la planilla', primary: true }],
        onClose: () => this.view.focusGrid(),
      });
    },

    showTutorial() {
      AA.UI.modal({
        title: '🧭 Cómo usar la planilla',
        wide: true,
        html: `
          <div class="tutorial">
            <div><b>1. Seleccioná</b> una celda con un clic (o con las flechas).</div>
            <div><b>2. Escribí</b> directamente. Si empieza con <code>=</code> es una fórmula: <code>=C2*D2</code>.</div>
            <div><b>3. Enter</b> confirma. <b>Esc</b> cancela. <b>Doble clic</b> o <b>F2</b> para editar.</div>
            <div><b>4. Mientras escribís una fórmula</b>, hacé clic en otra celda para insertar su referencia.</div>
            <div><b>5. Rellenar:</b> arrastrá el cuadradito azul de la esquina de la selección para copiar la fórmula.</div>
            <div><b>6. Objetivos:</b> se tildan solos a la izquierda. Las preguntas ❓ se responden escribiendo.</div>
          </div>`,
        buttons: [{ label: '¡Entendido!', primary: true }],
        onClose: () => this.view.focusGrid(),
      });
    },

    // --- Guardado del progreso
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
      st.data.progress[this.mission.id] = { cells: diff, answers: this.answers, hints: this.hints };
      st.save();
    },

    submit() {
      if (!this.status.every((s) => s === true)) return;
      const m = this.mission;
      const st = AA.State;
      const res = st.completeMission(m, this.hints.length);
      this.mission = null;
      const ch = st.CHARACTERS[m.from];
      const prog = st.rankProgress();
      const penalty = res.firstTime && this.hints.length ? ` <span class="muted">(${this.hints.length} pista${this.hints.length > 1 ? 's' : ''} usada${this.hints.length > 1 ? 's' : ''})</span>` : '';
      AA.UI.modal({
        title: '📤 ¡Informe entregado!',
        closable: false,
        className: 'complete',
        html: `
          <div class="complete-row">
            <div data-el="portrait"></div>
            <div><b>${esc(ch.name)}</b><p>“${esc(m.feedback)}”</p></div>
          </div>
          <div class="xp-gain">${res.firstTime ? `+${res.gained} XP${penalty}` : 'Práctica completada (sin XP extra)'}</div>
          <div class="rank-line"><b>${esc(prog.cur.name)}</b><span class="muted">${st.data.xp} XP${prog.next ? ` / ${prog.next.xp} para ${esc(prog.next.name)}` : ''}</span></div>
          ${AA.UI.xpBar(prog.pct)}
          ${res.promoted ? `<div class="promo">🎉 ¡Llegaste a <b>${esc(res.rank.name)}</b>! Marta quiere hablar con vos.</div>` : ''}`,
        buttons: [
          { label: 'Ir a la bandeja', action: () => AA.Game.openComputer() },
          { label: 'Volver a la oficina', primary: true, action: () => AA.Game.enterOffice() },
        ],
        onOpen: (card) => card.querySelector('[data-el="portrait"]').appendChild(AA.UI.portraitCanvas(m.from, 72)),
      });
    },
  };

  // -------------------------------------------------------------------------
  // Manual de funciones (de Leo)
  // -------------------------------------------------------------------------
  function openManual() {
    const st = AA.State;
    const learned = new Set(st.data.learned);
    const current = MissionScreen.mission ? MissionScreen.mission.teaches : [];
    current.forEach((f) => learned.add(f));
    const all = F.functionList();
    const known = all.filter((d) => learned.has(d.name));
    const cats = {};
    for (const d of known) (cats[d.cat] = cats[d.cat] || []).push(d);
    const sections = Object.entries(cats)
      .map(
        ([cat, list]) => `
          <h3>${esc(cat)}</h3>
          <div class="fn-grid">${list
            .map(
              (d) => `<div class="fn-card">
                <div class="fn-sig">${esc(d.sig)}</div>
                <div class="fn-desc">${esc(d.desc)}</div>
                <div class="fn-ex"><code>${esc(d.ex)}</code>${d.aliases.length ? ` <span class="muted">· en inglés: ${esc(d.aliases.join(', '))}</span>` : ''}</div>
              </div>`
            )
            .join('')}</div>`
      )
      .join('');
    AA.UI.modal({
      title: '📖 Manual de funciones de Leo',
      wide: true,
      html: `
        <h3>Lo básico</h3>
        <div class="fn-grid">
          <div class="fn-card"><div class="fn-sig">Fórmulas</div><div class="fn-desc">Empiezan con <b>=</b>. Operadores: <code>+ - * / ^</code>, <code>&amp;</code> une textos, <code>%</code> divide por 100.</div></div>
          <div class="fn-card"><div class="fn-sig">Referencias</div><div class="fn-desc"><code>A1</code> una celda · <code>A1:B10</code> un rango · <code>B:B</code> la columna entera.</div></div>
          <div class="fn-card"><div class="fn-sig">Referencias absolutas</div><div class="fn-desc"><code>$A$1</code> no cambia al copiar. <code>A$1</code> fija la fila, <code>$A1</code> la columna. <b>F4</b> las alterna.</div></div>
          <div class="fn-card"><div class="fn-sig">Comparaciones</div><div class="fn-desc"><code>=</code> <code>&lt;&gt;</code> <code>&gt;</code> <code>&lt;</code> <code>&gt;=</code> <code>&lt;=</code> devuelven VERDADERO o FALSO.</div></div>
        </div>
        ${sections || '<p class="muted">Todavía no aprendiste funciones. ¡Completá tareas para llenar el manual!</p>'}
        <p class="muted manual-foot">${known.length} de ${all.length} funciones descubiertas. Las demás se van desbloqueando con nuevas tareas (pero el motor ya las entiende: ¡podés experimentar!).</p>`,
      buttons: [{ label: 'Cerrar', primary: true }],
      onClose: () => MissionScreen.view && AA.Game.screen === 'mission' && MissionScreen.view.focusGrid(),
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
      (r, i) => `<li class="${i < idx ? 'past' : i === idx ? 'current' : ''}"><span>${i < idx ? '✔' : i === idx ? '★' : '○'}</span><b>${esc(r.name)}</b><span class="muted">${r.xp} XP</span></li>`
    ).join('');
    const done = AA.Missions.list
      .filter((m) => st.isCompleted(m.id))
      .map((m) => `<li>${AA.UI.deptBadge(m.dept)} ${esc(m.subject)} <span class="muted">+${st.data.completed[m.id].xp} XP</span></li>`)
      .join('');
    AA.UI.modal({
      title: '📈 Plan de carrera',
      wide: true,
      html: `
        <div class="career">
          <div>
            <div class="rank-line"><b>${esc(prog.cur.name)}</b><span class="muted">${st.data.xp} XP${prog.next ? ` / ${prog.next.xp}` : ''}</span></div>
            ${AA.UI.xpBar(prog.pct)}
            <ol class="ladder">${ladder}</ol>
          </div>
          <div>
            <h3>Tareas entregadas (${st.completedCount()}/${AA.Missions.list.length})</h3>
            <ul class="done-list">${done || '<li class="muted">Todavía ninguna. ¡A la computadora!</li>'}</ul>
            <h3>Hoja de ruta</h3>
            <ul class="roadmap">
              <li class="now"><b>Etapa 1</b> · Fórmulas, funciones básicas, SI, limpieza de texto, CONTAR.SI</li>
              <li><b>Etapa 2</b> · Tipos de datos, duplicados, ordenar/filtrar, BUSCARV/BUSCARX</li>
              <li><b>Etapa 3</b> · Tablas dinámicas y dashboards con gráficos</li>
              <li><b>Etapa 4</b> · Casos Senior: investigaciones con datos (estilo detective)</li>
            </ul>
          </div>
        </div>`,
      buttons: [{ label: 'Cerrar', primary: true }],
    });
  }

  AA.Screens = { Inbox, MissionScreen, openManual, openCareer };
})();
