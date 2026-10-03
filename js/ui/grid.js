/*
 * Analyst Adventure — Componente visual de planilla.
 * Selección con mouse/teclado, edición en celda y en barra de fórmulas, autocompletado
 * de funciones, señalar celdas con el mouse mientras se escribe una fórmula, controlador
 * de relleno, copiar/pegar con referencias relativas, F4 para referencias absolutas y deshacer.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const F = AA.Formula;

  const REF_COLORS = ['#3b82f6', '#e5484d', '#9b5de5', '#12a150', '#f08c00', '#0ea5b7'];

  function formatValue(v, fmt) {
    if (v === null || v === undefined) return '';
    if (F.isErr(v)) return v.code;
    if (typeof v === 'boolean') return v ? AA.T('VERDADERO', 'TRUE') : AA.T('FALSO', 'FALSE');
    if (typeof v === 'number') {
      switch (fmt) {
        case 'currency':
          return (v < 0 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        case 'percent':
          return (v * 100).toLocaleString('en-US', { maximumFractionDigits: 1 }) + '%';
        case 'int':
          return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
        case 'dec2':
          return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        case 'dec5':
          return v.toLocaleString('en-US', { minimumFractionDigits: 5, maximumFractionDigits: 5 });
        case 'plain':
          return F.fmtNumber(v);
        default: {
          if (Number.isInteger(v)) return String(v);
          return String(Math.round(v * 10000) / 10000);
        }
      }
    }
    return String(v);
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  class SpreadsheetView {
    constructor(container, sheet, opts) {
      this.root = container;
      this.sheet = sheet;
      this.opts = opts || {};
      this.sel = { ac: 0, ar: 0, fc: 0, fr: 0 };
      this.editing = null;
      this.pointing = null;
      this.drag = null;
      this.history = [];
      this.future = [];
      this.clipboard = null;
      this.suggestions = [];
      this.build();
      this.sheet.onChange(() => this.refresh());
      this.refresh();
      const start = this.opts.startCell ? F.parseRef(this.opts.startCell) : null;
      if (start) this.select(start.col, start.row);
      else this.renderSelection();
    }

    // -----------------------------------------------------------------------
    // Construcción del DOM
    // -----------------------------------------------------------------------
    build() {
      const root = this.root;
      root.innerHTML = '';
      root.classList.add('ss');

      const bar = el('div', 'ss-bar');
      this.nameBox = el('div', 'ss-namebox', 'A1');
      const fx = el('div', 'ss-fx', 'fx');
      this.bar = el('input', 'ss-formula');
      this.bar.spellcheck = false;
      this.bar.setAttribute('aria-label', AA.T('Barra de fórmulas', 'Formula bar'));
      bar.append(this.nameBox, fx, this.bar);

      this.hint = el('div', 'ss-hint');

      this.scroll = el('div', 'ss-scroll');
      this.scroll.tabIndex = 0;
      this.wrap = el('div', 'ss-wrap');
      this.table = el('table', 'ss-grid');
      const colgroup = el('colgroup');
      const widths = this.opts.colWidths || [];
      colgroup.appendChild(el('col')).style.width = '44px';
      for (let c = 0; c < this.sheet.cols; c++) {
        const col = el('col');
        col.style.width = (widths[c] || 100) + 'px';
        colgroup.appendChild(col);
      }
      this.table.appendChild(colgroup);

      const thead = el('thead');
      const hr = el('tr');
      hr.appendChild(el('th', 'ss-corner'));
      this.colHeads = [];
      for (let c = 0; c < this.sheet.cols; c++) {
        const th = el('th', 'ss-colhead', F.indexToCol(c));
        th.dataset.c = c;
        hr.appendChild(th);
        this.colHeads.push(th);
      }
      thead.appendChild(hr);
      this.table.appendChild(thead);

      const tbody = el('tbody');
      this.tds = [];
      this.rowHeads = [];
      for (let r = 0; r < this.sheet.rows; r++) {
        const tr = el('tr');
        const th = el('th', 'ss-rowhead', String(r + 1));
        th.dataset.r = r;
        tr.appendChild(th);
        this.rowHeads.push(th);
        const row = [];
        for (let c = 0; c < this.sheet.cols; c++) {
          const td = el('td', 'ss-cell');
          td.dataset.c = c;
          td.dataset.r = r;
          tr.appendChild(td);
          row.push(td);
        }
        tbody.appendChild(tr);
        this.tds.push(row);
      }
      this.table.appendChild(tbody);

      this.selBox = el('div', 'ss-selbox');
      this.activeBox = el('div', 'ss-activebox');
      this.fillHandle = el('div', 'ss-fill');
      this.fillPreview = el('div', 'ss-fillpreview');
      this.copyBox = el('div', 'ss-copybox');
      this.refLayer = el('div', 'ss-reflayer');
      this.editor = el('input', 'ss-editor');
      this.editor.spellcheck = false;
      this.wrap.append(this.table, this.refLayer, this.selBox, this.activeBox, this.copyBox, this.fillPreview, this.fillHandle, this.editor);
      this.scroll.appendChild(this.wrap);
      // Barra de estado (como en Excel): recuento, suma y promedio de lo seleccionado.
      this.status = el('div', 'ss-status');
      root.append(bar, this.hint, this.scroll, this.status);

      this.bindEvents();
      this.setHint(null);
    }

    bindEvents() {
      this.onMove = (e) => this.handleDragMove(e);
      this.onUp = (e) => this.handleDragEnd(e);

      this.wrap.addEventListener('mousedown', (e) => this.handleMouseDown(e));
      this.wrap.addEventListener('dblclick', (e) => {
        const td = e.target.closest('td.ss-cell');
        if (!td) return;
        this.startEdit(null, 'cell', 'edit');
      });
      this.table.querySelector('thead').addEventListener('mousedown', (e) => {
        const th = e.target.closest('th.ss-colhead');
        if (!th || this.editing) return;
        e.preventDefault();
        const c = +th.dataset.c;
        this.sel = { ac: c, ar: 0, fc: c, fr: this.sheet.rows - 1 };
        this.renderSelection(true);
        this.scroll.focus({ preventScroll: true });
      });
      this.table.querySelector('tbody').addEventListener('mousedown', (e) => {
        const th = e.target.closest('th.ss-rowhead');
        if (!th || this.editing) return;
        e.preventDefault();
        const r = +th.dataset.r;
        this.sel = { ac: 0, ar: r, fc: this.sheet.cols - 1, fr: r };
        this.renderSelection(true);
        this.scroll.focus({ preventScroll: true });
      });

      this.scroll.addEventListener('keydown', (e) => this.handleGridKey(e));
      this.editor.addEventListener('keydown', (e) => this.handleEditKey(e, this.editor));
      this.bar.addEventListener('keydown', (e) => this.handleEditKey(e, this.bar));
      this.editor.addEventListener('input', () => this.handleInput(this.editor));
      this.bar.addEventListener('input', () => this.handleInput(this.bar));
      this.bar.addEventListener('focus', () => {
        if (!this.editing) this.startEdit(null, 'bar', 'edit');
      });
      this.editor.addEventListener('keyup', () => this.updateHint());
      this.editor.addEventListener('click', () => this.updateHint());
      this.bar.addEventListener('keyup', () => this.updateHint());
      this.bar.addEventListener('click', () => this.updateHint());
      this.hint.addEventListener('mousedown', (e) => {
        const chip = e.target.closest('[data-fn]');
        if (!chip) return;
        e.preventDefault();
        this.applySuggestion(chip.dataset.fn);
      });
      // Si el foco se va a otro campo de la página (p. ej. una respuesta), se confirma la edición.
      this.root.addEventListener('focusout', (e) => {
        if (this.editing && e.relatedTarget && !this.root.contains(e.relatedTarget)) this.commitEdit(null, true);
      });
      window.addEventListener('resize', () => this.renderSelection());
    }

    // -----------------------------------------------------------------------
    // Utilidades
    // -----------------------------------------------------------------------
    rect() {
      const s = this.sel;
      return {
        c1: Math.min(s.ac, s.fc),
        r1: Math.min(s.ar, s.fr),
        c2: Math.max(s.ac, s.fc),
        r2: Math.max(s.ar, s.fr),
      };
    }
    active() {
      return { c: this.sel.ac, r: this.sel.ar };
    }
    isLocked(c, r) {
      return this.opts.locked ? !!this.opts.locked(c, r) : false;
    }
    cellFromEvent(e) {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const td = target && target.closest ? target.closest('td.ss-cell') : null;
      if (!td || !this.wrap.contains(td)) return null;
      return { c: +td.dataset.c, r: +td.dataset.r };
    }
    boxFor(c1, r1, c2, r2) {
      const wr = this.wrap.getBoundingClientRect();
      const a = this.tds[r1][c1].getBoundingClientRect();
      const b = this.tds[r2][c2].getBoundingClientRect();
      return { left: a.left - wr.left, top: a.top - wr.top, width: b.right - a.left, height: b.bottom - a.top };
    }
    // Burbuja de ayuda ("coach") anclada a una celda {c, r} o a un encabezado de columna {col}.
    coach(html, at) {
      this.hideCoach();
      const wr = this.wrap.getBoundingClientRect();
      const anchor = at.col !== undefined ? this.table.querySelector(`th.ss-colhead[data-c="${at.col}"]`) : this.tds[at.r] && this.tds[at.r][at.c];
      if (!anchor) return;
      const a = anchor.getBoundingClientRect();
      const el = document.createElement('div');
      el.className = 'ss-coach';
      el.innerHTML = `<button type="button" class="ss-coach-x" aria-label="${AA.T('Cerrar', 'Close')}">✕</button>${html}`;
      el.style.left = Math.max(4, a.left - wr.left + (at.dx || 0)) + 'px';
      el.style.top = a.bottom - wr.top + 10 + 'px';
      el.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        if (e.target.closest('.ss-coach-x')) {
          e.preventDefault();
          this.hideCoach();
        }
      });
      this.wrap.appendChild(el);
      this.coachEl = el;
      this.coachTimer = setTimeout(() => this.hideCoach(), at.ms || 16000);
    }
    hideCoach() {
      clearTimeout(this.coachTimer);
      if (this.coachEl) this.coachEl.remove();
      this.coachEl = null;
    }
    activeValue() {
      return this.sheet.getValue(this.sel.ac, this.sel.ar);
    }
    placeBox(node, box, inset) {
      const i = inset || 0;
      node.style.left = box.left - i + 'px';
      node.style.top = box.top - i + 'px';
      node.style.width = box.width + i * 2 + 'px';
      node.style.height = box.height + i * 2 + 'px';
    }
    inputEl() {
      return this.editing && this.editing.via === 'bar' ? this.bar : this.editor;
    }
    focusGrid() {
      this.scroll.focus({ preventScroll: true });
    }

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    refresh() {
      const fmtFn = this.opts.format;
      const clsFn = this.opts.cellClass;
      for (let r = 0; r < this.sheet.rows; r++) {
        for (let c = 0; c < this.sheet.cols; c++) {
          const td = this.tds[r][c];
          const v = this.sheet.getValue(c, r);
          const fmt = fmtFn ? fmtFn(c, r) : null;
          const text = formatValue(v, fmt);
          const html = this.opts.displayHtml ? this.opts.displayHtml(c, r, text) : null;
          if (html !== null && html !== undefined) td.innerHTML = html;
          else td.textContent = text;
          let cls = 'ss-cell';
          if (typeof v === 'number') cls += ' num';
          else if (typeof v === 'boolean') cls += ' bool';
          else if (F.isErr(v)) cls += ' err';
          if (this.sheet.isFormula(c, r)) cls += ' formula';
          if (this.isLocked(c, r)) cls += ' locked';
          if (clsFn) {
            const extra = clsFn(c, r);
            if (extra) cls += ' ' + extra;
          }
          td.className = cls;
          td.title = F.isErr(v) ? `${v.code} — ${v.detail}` : '';
        }
      }
      if (!this.editing) this.bar.value = this.sheet.getInput(this.sel.ac, this.sel.ar);
      this.renderSelection();
    }

    // Recuento / Suma / Promedio / Mín / Máx de la selección (sirve para responder sin contar a mano).
    renderStatus(c1, r1, c2, r2) {
      if (!this.status) return;
      if (c1 === c2 && r1 === r2) {
        this.status.innerHTML = `<span class="ss-st-muted">${AA.T('Seleccioná varias celdas para ver su recuento, suma y promedio.', 'Select several cells to see their count, sum and average.')}</span>`;
        return;
      }
      let count = 0;
      let nums = 0;
      let sum = 0;
      let min = Infinity;
      let max = -Infinity;
      let seen = 0;
      for (let r = r1; r <= r2 && seen < 20000; r++) {
        for (let c = c1; c <= c2; c++, seen++) {
          const v = this.sheet.getValue(c, r);
          if (v === null || v === undefined || v === '' || F.isErr(v)) continue;
          count++;
          if (typeof v === 'number') {
            nums++;
            sum += v;
            if (v < min) min = v;
            if (v > max) max = v;
          }
        }
      }
      const f = (x) => (Number.isInteger(x) ? x.toLocaleString('en-US') : (Math.round(x * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 }));
      const item = (label, val) => `<span class="ss-st-item">${label}: <b>${val}</b></span>`;
      this.status.innerHTML =
        item(AA.T('Recuento', 'Count'), count) +
        (nums
          ? item(AA.T('Suma', 'Sum'), f(sum)) + item(AA.T('Promedio', 'Average'), f(sum / nums)) + item(AA.T('Mín', 'Min'), f(min)) + item(AA.T('Máx', 'Max'), f(max))
          : '');
    }

    renderSelection(scrollIntoView) {
      const { c1, r1, c2, r2 } = this.rect();
      this.placeBox(this.selBox, this.boxFor(c1, r1, c2, r2));
      this.selBox.classList.toggle('multi', c1 !== c2 || r1 !== r2);
      const act = this.boxFor(this.sel.ac, this.sel.ar, this.sel.ac, this.sel.ar);
      this.placeBox(this.activeBox, act);
      const b = this.boxFor(c2, r2, c2, r2);
      this.fillHandle.style.left = b.left + b.width - 4 + 'px';
      this.fillHandle.style.top = b.top + b.height - 4 + 'px';
      this.fillHandle.style.display = this.editing ? 'none' : 'block';

      this.colHeads.forEach((th, c) => th.classList.toggle('sel', c >= c1 && c <= c2));
      this.rowHeads.forEach((th, r) => th.classList.toggle('sel', r >= r1 && r <= r2));
      this.renderStatus(c1, r1, c2, r2);
      const ref = F.makeRef(this.sel.ac, this.sel.ar);
      this.nameBox.textContent =
        c1 !== c2 || r1 !== r2 ? `${ref}  (${r2 - r1 + 1}${AA.T('F', 'R')} × ${c2 - c1 + 1}C)` : ref;
      if (!this.editing) this.bar.value = this.sheet.getInput(this.sel.ac, this.sel.ar);
      if (this.clipboard) {
        const k = this.clipboard;
        this.copyBox.style.display = 'block';
        this.placeBox(this.copyBox, this.boxFor(k.c1, k.r1, k.c1 + k.w - 1, k.r1 + k.h - 1));
      } else this.copyBox.style.display = 'none';
      if (scrollIntoView) this.scrollToCell(this.sel.fc, this.sel.fr);
      if (this.opts.onSelect) this.opts.onSelect(this.sel);
    }

    scrollToCell(c, r) {
      const td = this.tds[r][c];
      const sc = this.scroll;
      const headH = 26;
      const headW = 44;
      const top = td.offsetTop;
      const left = td.offsetLeft;
      if (top - headH < sc.scrollTop) sc.scrollTop = top - headH;
      else if (top + td.offsetHeight > sc.scrollTop + sc.clientHeight) sc.scrollTop = top + td.offsetHeight - sc.clientHeight;
      if (left - headW < sc.scrollLeft) sc.scrollLeft = left - headW;
      else if (left + td.offsetWidth > sc.scrollLeft + sc.clientWidth) sc.scrollLeft = left + td.offsetWidth - sc.clientWidth;
    }

    renderRefHighlights() {
      this.refLayer.innerHTML = '';
      if (!this.editing) return;
      const text = this.inputEl().value;
      const refs = F.formulaRefs(text);
      refs.forEach((rg, i) => {
        const r2 = rg.r2 === null ? this.sheet.rows - 1 : rg.r2;
        if (rg.c1 >= this.sheet.cols || rg.r1 >= this.sheet.rows || rg.c1 < 0 || rg.r1 < 0) return;
        const box = this.boxFor(rg.c1, rg.r1, Math.min(rg.c2, this.sheet.cols - 1), Math.min(r2, this.sheet.rows - 1));
        const d = el('div', 'ss-refbox');
        d.style.borderColor = REF_COLORS[i % REF_COLORS.length];
        d.style.background = REF_COLORS[i % REF_COLORS.length] + '14';
        this.placeBox(d, box);
        this.refLayer.appendChild(d);
      });
    }

    // -----------------------------------------------------------------------
    // Selección
    // -----------------------------------------------------------------------
    select(c, r, extend) {
      c = Math.max(0, Math.min(this.sheet.cols - 1, c));
      r = Math.max(0, Math.min(this.sheet.rows - 1, r));
      if (extend) {
        this.sel.fc = c;
        this.sel.fr = r;
      } else this.sel = { ac: c, ar: r, fc: c, fr: r };
      this.renderSelection(true);
    }
    moveActive(dc, dr) {
      this.select(this.sel.ac + dc, this.sel.ar + dr);
    }
    // Ctrl+flecha: salta al borde del bloque de datos.
    jump(dc, dr, extend) {
      let c = extend ? this.sel.fc : this.sel.ac;
      let r = extend ? this.sel.fr : this.sel.ar;
      const filled = (x, y) => !this.sheet.isEmpty(x, y);
      const inside = (x, y) => this.sheet.inBounds(x, y);
      if (!inside(c + dc, r + dr)) return;
      if (filled(c, r) && filled(c + dc, r + dr)) {
        while (inside(c + dc, r + dr) && filled(c + dc, r + dr)) {
          c += dc;
          r += dr;
        }
      } else {
        c += dc;
        r += dr;
        while (inside(c + dc, r + dr) && !filled(c, r)) {
          c += dc;
          r += dr;
        }
      }
      this.select(c, r, extend);
    }

    // -----------------------------------------------------------------------
    // Mouse
    // -----------------------------------------------------------------------
    handleMouseDown(e) {
      if (e.button !== 0) return;
      if (e.target === this.editor) return;
      if (e.target === this.fillHandle) {
        e.preventDefault();
        this.drag = { type: 'fill', src: this.rect(), target: null };
        this.startDrag();
        return;
      }
      const td = e.target.closest('td.ss-cell');
      if (!td) return;
      const c = +td.dataset.c;
      const r = +td.dataset.r;
      if (this.editing) {
        if (this.canPoint()) {
          e.preventDefault();
          this.drag = { type: 'point', anchor: { c, r } };
          this.pointAt(c, r, c, r);
          this.startDrag();
          return;
        }
        this.commitEdit();
      }
      e.preventDefault();
      this.select(c, r, e.shiftKey);
      this.focusGrid();
      this.drag = { type: 'select' };
      this.startDrag();
    }
    startDrag() {
      document.addEventListener('mousemove', this.onMove);
      document.addEventListener('mouseup', this.onUp);
    }
    handleDragMove(e) {
      if (!this.drag) return;
      const cell = this.cellFromEvent(e);
      if (!cell) return;
      if (this.drag.type === 'select') {
        if (cell.c !== this.sel.fc || cell.r !== this.sel.fr) this.select(cell.c, cell.r, true);
      } else if (this.drag.type === 'point') {
        const a = this.drag.anchor;
        this.pointAt(Math.min(a.c, cell.c), Math.min(a.r, cell.r), Math.max(a.c, cell.c), Math.max(a.r, cell.r));
      } else if (this.drag.type === 'fill') {
        const s = this.drag.src;
        let t = null;
        if (cell.r > s.r2) t = { c1: s.c1, r1: s.r1, c2: s.c2, r2: cell.r, dir: 'down' };
        else if (cell.r < s.r1) t = { c1: s.c1, r1: cell.r, c2: s.c2, r2: s.r2, dir: 'up' };
        else if (cell.c > s.c2) t = { c1: s.c1, r1: s.r1, c2: cell.c, r2: s.r2, dir: 'right' };
        else if (cell.c < s.c1) t = { c1: cell.c, r1: s.r1, c2: s.c2, r2: s.r2, dir: 'left' };
        this.drag.target = t;
        if (t) {
          this.fillPreview.style.display = 'block';
          this.placeBox(this.fillPreview, this.boxFor(t.c1, t.r1, t.c2, t.r2));
        } else this.fillPreview.style.display = 'none';
      }
    }
    handleDragEnd() {
      document.removeEventListener('mousemove', this.onMove);
      document.removeEventListener('mouseup', this.onUp);
      const d = this.drag;
      this.drag = null;
      if (!d) return;
      if (d.type === 'fill') {
        this.fillPreview.style.display = 'none';
        if (d.target) this.fill(d.src, d.target);
      } else if (d.type === 'point') {
        const inp = this.inputEl();
        inp.focus();
      }
    }

    // -----------------------------------------------------------------------
    // Señalar celdas mientras se escribe una fórmula
    // -----------------------------------------------------------------------
    canPoint() {
      if (!this.editing) return false;
      const inp = this.inputEl();
      const v = inp.value;
      if (v[0] !== '=') return false;
      if (this.pointing) return true;
      const before = v.slice(0, inp.selectionStart).replace(/\s+$/, '');
      return /[=(,;+\-*/^&<>:]$/.test(before);
    }
    pointAt(c1, r1, c2, r2) {
      const inp = this.inputEl();
      const text = c1 === c2 && r1 === r2 ? F.makeRef(c1, r1) : F.makeRef(c1, r1) + ':' + F.makeRef(c2, r2);
      if (!this.pointing) this.pointing = { start: inp.selectionStart, len: 0 };
      const p = this.pointing;
      const v = inp.value;
      const nv = v.slice(0, p.start) + text + v.slice(p.start + p.len);
      p.len = text.length;
      this.editor.value = nv;
      this.bar.value = nv;
      inp.focus();
      inp.setSelectionRange(p.start + p.len, p.start + p.len);
      this.renderRefHighlights();
      this.updateHint();
    }

    // -----------------------------------------------------------------------
    // Edición
    // -----------------------------------------------------------------------
    startEdit(initial, via, mode) {
      const { c, r } = this.active();
      if (this.isLocked(c, r)) {
        if (this.opts.onLocked) this.opts.onLocked(c, r);
        if (via === 'bar') this.focusGrid();
        return;
      }
      const original = this.sheet.getInput(c, r);
      this.editing = { c, r, original, via, mode: mode || 'edit' };
      this.pointing = null;
      const text = initial === null || initial === undefined ? original : initial;
      const box = this.boxFor(c, r, c, r);
      this.editor.style.display = 'block';
      this.editor.style.left = box.left + 'px';
      this.editor.style.top = box.top + 'px';
      this.editor.style.minWidth = box.width + 'px';
      this.editor.style.height = box.height + 'px';
      this.editor.style.width = Math.max(box.width, Math.min(520, (text.length + 2) * 8.5)) + 'px';
      this.editor.value = text;
      this.bar.value = text;
      this.fillHandle.style.display = 'none';
      const inp = this.inputEl();
      if (document.activeElement !== inp) inp.focus();
      const end = inp.value.length;
      inp.setSelectionRange(end, end);
      this.renderRefHighlights();
      this.updateHint();
    }
    endEditUI() {
      this.editing = null;
      this.pointing = null;
      this.editor.style.display = 'none';
      this.refLayer.innerHTML = '';
      this.setHint(null);
    }
    commitEdit(move, keepFocus) {
      if (!this.editing) return;
      const { c, r, original } = this.editing;
      const text = this.inputEl().value;
      this.endEditUI();
      if (text !== original) this.applyChanges([{ c, r, input: text }]);
      if (move) this.moveActive(move[0], move[1]);
      else this.renderSelection();
      if (!keepFocus) this.focusGrid();
    }
    cancelEdit() {
      this.endEditUI();
      this.renderSelection();
      this.focusGrid();
    }

    handleInput(src) {
      const other = src === this.editor ? this.bar : this.editor;
      if (!this.editing) {
        // Escribir en la barra sin haber empezado a editar.
        this.startEdit(src.value, src === this.bar ? 'bar' : 'cell', 'edit');
        return;
      }
      other.value = src.value;
      this.pointing = null;
      const w = Math.max(parseFloat(this.editor.style.minWidth) || 0, Math.min(520, (src.value.length + 2) * 8.5));
      this.editor.style.width = w + 'px';
      this.renderRefHighlights();
      this.updateHint();
    }

    handleEditKey(e, src) {
      // El editor vive dentro del área de la grilla: que sus teclas no lleguen al modo navegación.
      e.stopPropagation();
      if (!this.editing) return;
      const key = e.key;
      if (key !== 'Shift' && key !== 'Control' && key !== 'Meta' && key !== 'Alt') {
        if (!(this.drag && this.drag.type === 'point')) this.pointing = null;
      }
      if (key === 'Enter') {
        e.preventDefault();
        this.commitEdit(e.shiftKey ? [0, -1] : [0, 1]);
      } else if (key === 'Tab') {
        e.preventDefault();
        if (this.suggestions.length && !e.shiftKey) this.applySuggestion(this.suggestions[0].name);
        else this.commitEdit(e.shiftKey ? [-1, 0] : [1, 0]);
      } else if (key === 'Escape') {
        e.preventDefault();
        this.cancelEdit();
      } else if (key === 'F4') {
        e.preventDefault();
        const res = F.toggleAbsolute(src.value, src.selectionStart);
        if (res) {
          this.editor.value = res.text;
          this.bar.value = res.text;
          src.setSelectionRange(res.caret, res.caret);
          this.renderRefHighlights();
        }
      } else if (
        this.editing.mode === 'enter' &&
        src === this.editor &&
        src.value[0] !== '=' &&
        (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight')
      ) {
        e.preventDefault();
        const mv = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[key];
        this.commitEdit(mv);
      }
    }

    // -----------------------------------------------------------------------
    // Ayuda de funciones (sugerencias y sintaxis)
    // -----------------------------------------------------------------------
    updateHint() {
      if (!this.editing) return this.setHint(null);
      const inp = this.inputEl();
      const text = inp.value.slice(0, inp.selectionStart);
      if (text[0] !== '=') return this.setHint(null);
      this.suggestions = [];
      const m = /([A-Za-zÀ-ſ][A-Za-z0-9.À-ſ]*)$/.exec(text);
      if (m && !/^\$?[A-Za-z]{1,3}\$?\d+$/.test(m[1])) {
        const pref = F.normName(m[1]);
        const seen = new Set();
        for (const d of F.functionList()) {
          const names = [d.name, ...d.aliases];
          const hit = names.find((nm) => F.normName(nm).startsWith(pref));
          if (hit && !seen.has(d.name)) {
            seen.add(d.name);
            // Se muestra el nombre del idioma del juego si coincide; si no, el que escribió.
            const local = AA.fnName(d.name);
            this.suggestions.push({ name: F.normName(local).startsWith(pref) ? local : hit, def: d });
          }
        }
        this.suggestions.sort((a, b) => a.name.length - b.name.length);
        // Otras hojas del libro (para referencias como Productos!A:C).
        const sheets = this.opts.sheetNames ? this.opts.sheetNames() : [];
        const sheetHits = sheets.filter((nm) => F.normName(nm).startsWith(pref)).map((nm) => ({ name: nm, sheet: true }));
        this.suggestions = sheetHits.concat(this.suggestions).slice(0, 6);
        if (this.suggestions.length) return this.setHint({ suggestions: this.suggestions });
      }
      // ¿Dentro de qué función está el cursor?
      const stack = [];
      let inStr = false;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '"') inStr = !inStr;
        if (inStr) continue;
        if (ch === '(') {
          const fm = /([A-Za-zÀ-ſ][A-Za-z0-9.À-ſ]*)\s*$/.exec(text.slice(0, i));
          stack.push({ name: fm ? fm[1] : null, arg: 0 });
        } else if (ch === ')') stack.pop();
        else if ((ch === ',' || ch === ';') && stack.length) stack[stack.length - 1].arg++;
      }
      const top = stack[stack.length - 1];
      const d = top && top.name ? F.getFunction(top.name) : null;
      if (d) return this.setHint({ fn: d, arg: top.arg });
      this.setHint({ idle: true });
    }

    setHint(h) {
      this.suggestions = h && h.suggestions ? h.suggestions : [];
      if (!h) {
        this.hint.innerHTML = `<span class="ss-hint-muted">${AA.T('Seleccioná una celda y escribí. Las fórmulas empiezan con <b>=</b> · Doble clic o F2 para editar.', 'Select a cell and type. Formulas start with <b>=</b> · Double-click or F2 to edit.')}</span>`;
        return;
      }
      if (h.suggestions) {
        this.hint.innerHTML =
          `<span class="ss-hint-muted">${h.suggestions[0].sheet ? AA.T('Hojas y funciones:', 'Sheets and functions:') : AA.T('Funciones:', 'Functions:')}</span> ` +
          h.suggestions
            .map((s, i) =>
              s.sheet
                ? `<button class="ss-chip sheet${i === 0 ? ' first' : ''}" data-fn="${escapeHtml(s.name)}" data-sheet="1" title="${AA.T('Hoja del libro', 'Workbook sheet')}">📄 ${escapeHtml(s.name)}!</button>`
                : `<button class="ss-chip${i === 0 ? ' first' : ''}" data-fn="${s.name}" title="${escapeHtml(AA.fnDoc(s.def.name).desc)}">${s.name}</button>`
            )
            .join('') +
          `<span class="ss-hint-muted"> · <kbd>Tab</kbd> ${AA.T('completa la primera', 'completes the first one')}</span>`;
        return;
      }
      if (h.fn) {
        const doc = AA.fnDoc(h.fn.name);
        const sig = doc.sig;
        const sep = AA.lang === 'en' ? ', ' : '; ';
        const open = sig.indexOf('(');
        const inner = sig.slice(open + 1, sig.lastIndexOf(')'));
        const params = inner.split(/[;,]/).map((p) => p.trim());
        const idx = Math.min(h.arg, params.length - 1);
        const shown = params
          .map((p, i) => (i === idx || (p === '...' && h.arg >= params.length - 1 && i === params.length - 1) ? `<b class="cur">${escapeHtml(p)}</b>` : escapeHtml(p)))
          .join(sep);
        this.hint.innerHTML = `<span class="ss-sig">${escapeHtml(sig.slice(0, open))}(${shown})</span> <span class="ss-hint-muted">— ${escapeHtml(doc.desc)}</span>`;
        return;
      }
      this.hint.innerHTML = `<span class="ss-hint-muted">${AA.T(
        'Hacé clic en una celda (o arrastrá un rango) para agregar su referencia. <kbd>F4</kbd> la fija con $. <kbd>Enter</kbd> confirma, <kbd>Esc</kbd> cancela.',
        'Click a cell (or drag a range) to add its reference. <kbd>F4</kbd> locks it with $. <kbd>Enter</kbd> confirms, <kbd>Esc</kbd> cancels.'
      )}</span>`;
    }

    applySuggestion(name) {
      if (!this.editing) return;
      const inp = this.inputEl();
      const pos = inp.selectionStart;
      const before = inp.value.slice(0, pos);
      const after = inp.value.slice(pos);
      const m = /([A-Za-zÀ-ſ][A-Za-z0-9.À-ſ]*)$/.exec(before);
      const start = m ? pos - m[1].length : pos;
      const isSheet = this.suggestions.some((sg) => sg.sheet && sg.name === name);
      const insert = isSheet ? F.sheetPrefix(name) : name + '(';
      const nv = inp.value.slice(0, start) + insert + (isSheet ? after : after.replace(/^\(/, ''));
      this.editor.value = nv;
      this.bar.value = nv;
      inp.focus();
      inp.setSelectionRange(start + insert.length, start + insert.length);
      this.renderRefHighlights();
      this.updateHint();
    }

    // -----------------------------------------------------------------------
    // Teclado en modo navegación
    // -----------------------------------------------------------------------
    handleGridKey(e) {
      if (this.editing) return;
      const ctrl = e.ctrlKey || e.metaKey;
      const key = e.key;
      const arrows = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
      if (arrows[key]) {
        e.preventDefault();
        const [dc, dr] = arrows[key];
        if (ctrl) this.jump(dc, dr, e.shiftKey);
        else if (e.shiftKey) this.select(this.sel.fc + dc, this.sel.fr + dr, true);
        else this.moveActive(dc, dr);
        return;
      }
      if (ctrl) {
        const k = key.toLowerCase();
        if (k === 'c') { e.preventDefault(); this.copy(); }
        else if (k === 'v') { e.preventDefault(); this.paste(); }
        else if (k === 'z' && !e.shiftKey) { e.preventDefault(); this.undo(); }
        else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); this.redo(); }
        else if (k === 'd') { e.preventDefault(); this.fillDown(); }
        else if (k === 'r') { e.preventDefault(); this.fillRight(); }
        else if (k === 'a') {
          e.preventDefault();
          this.sel = { ac: 0, ar: 0, fc: this.sheet.cols - 1, fr: this.sheet.rows - 1 };
          this.renderSelection();
        }
        return;
      }
      switch (key) {
        case 'Enter':
          e.preventDefault();
          this.moveActive(0, e.shiftKey ? -1 : 1);
          return;
        case 'Tab':
          e.preventDefault();
          this.moveActive(e.shiftKey ? -1 : 1, 0);
          return;
        case 'F2':
          e.preventDefault();
          this.startEdit(null, 'cell', 'edit');
          return;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          this.clearSelection();
          return;
        case 'Escape':
          if (this.clipboard) {
            e.preventDefault(); // solo cancela el copiado: no salir de la tarea
            this.clipboard = null;
            this.renderSelection();
          }
          return;
        case 'Home':
          e.preventDefault();
          this.select(0, this.sel.ar);
          return;
        default:
          break;
      }
      if (key.length === 1 && !e.altKey) {
        e.preventDefault();
        this.startEdit(key, 'cell', 'enter');
      }
    }

    // -----------------------------------------------------------------------
    // Operaciones sobre celdas
    // -----------------------------------------------------------------------
    applyChanges(changes, record) {
      const allowed = [];
      let blocked = false;
      for (const ch of changes) {
        if (!this.sheet.inBounds(ch.c, ch.r)) continue;
        if (this.isLocked(ch.c, ch.r)) {
          blocked = true;
          continue;
        }
        const before = this.sheet.getInput(ch.c, ch.r);
        if (before === ch.input) continue;
        allowed.push({ c: ch.c, r: ch.r, before, after: ch.input });
      }
      if (blocked && this.opts.onLocked) this.opts.onLocked();
      if (!allowed.length) return;
      this.sheet.batch(allowed.map((a) => ({ c: a.c, r: a.r, input: a.after })));
      if (record !== false) {
        this.history.push(allowed);
        if (this.history.length > 200) this.history.shift();
        this.future = [];
      }
      if (this.opts.onEdit) this.opts.onEdit(allowed);
    }
    undo() {
      const op = this.history.pop();
      if (!op) return;
      this.sheet.batch(op.map((a) => ({ c: a.c, r: a.r, input: a.before })));
      this.future.push(op);
      if (this.opts.onEdit) this.opts.onEdit(op);
    }
    redo() {
      const op = this.future.pop();
      if (!op) return;
      this.sheet.batch(op.map((a) => ({ c: a.c, r: a.r, input: a.after })));
      this.history.push(op);
      if (this.opts.onEdit) this.opts.onEdit(op);
    }
    clearSelection() {
      const { c1, r1, c2, r2 } = this.rect();
      const ch = [];
      for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) if (!this.sheet.isEmpty(c, r)) ch.push({ c, r, input: '' });
      this.applyChanges(ch);
    }
    copy() {
      const { c1, r1, c2, r2 } = this.rect();
      const inputs = [];
      const lines = [];
      for (let r = r1; r <= r2; r++) {
        const row = [];
        const line = [];
        for (let c = c1; c <= c2; c++) {
          row.push(this.sheet.getInput(c, r));
          line.push(formatValue(this.sheet.getValue(c, r)));
        }
        inputs.push(row);
        lines.push(line.join('\t'));
      }
      this.clipboard = { c1, r1, w: c2 - c1 + 1, h: r2 - r1 + 1, inputs };
      try {
        if (navigator.clipboard) navigator.clipboard.writeText(lines.join('\n')).catch(() => {});
      } catch (e) {
        /* sin acceso al portapapeles del sistema */
      }
      this.renderSelection();
      if (this.opts.onToast) this.opts.onToast(AA.T('Copiado. Elegí el destino y pegá con Ctrl+V.', 'Copied. Pick the destination and paste with Ctrl+V.'));
    }
    paste() {
      const k = this.clipboard;
      if (!k) return;
      const t = this.rect();
      const selW = t.c2 - t.c1 + 1;
      const selH = t.r2 - t.r1 + 1;
      const tileW = selW % k.w === 0 ? selW : k.w;
      const tileH = selH % k.h === 0 ? selH : k.h;
      const ch = [];
      for (let i = 0; i < tileH; i++) {
        for (let j = 0; j < tileW; j++) {
          const sr = k.r1 + (i % k.h);
          const sc = k.c1 + (j % k.w);
          const dr = t.r1 + i;
          const dc = t.c1 + j;
          ch.push({ c: dc, r: dr, input: F.shiftFormula(k.inputs[i % k.h][j % k.w], dc - sc, dr - sr) });
        }
      }
      this.applyChanges(ch);
      this.sel = { ac: t.c1, ar: t.r1, fc: Math.min(t.c1 + tileW - 1, this.sheet.cols - 1), fr: Math.min(t.r1 + tileH - 1, this.sheet.rows - 1) };
      this.renderSelection();
    }
    fill(src, t) {
      const ch = [];
      const h = src.r2 - src.r1 + 1;
      const w = src.c2 - src.c1 + 1;
      for (let r = t.r1; r <= t.r2; r++) {
        for (let c = t.c1; c <= t.c2; c++) {
          if (r >= src.r1 && r <= src.r2 && c >= src.c1 && c <= src.c2) continue;
          let sr = r;
          let sc = c;
          if (t.dir === 'down') sr = src.r1 + ((r - src.r1) % h);
          else if (t.dir === 'up') sr = src.r2 - ((src.r2 - r) % h);
          else if (t.dir === 'right') sc = src.c1 + ((c - src.c1) % w);
          else sc = src.c2 - ((src.c2 - c) % w);
          ch.push({ c, r, input: F.shiftFormula(this.sheet.getInput(sc, sr), c - sc, r - sr) });
        }
      }
      this.applyChanges(ch);
      this.sel = { ac: t.c1, ar: t.r1, fc: t.c2, fr: t.r2 };
      this.renderSelection();
    }
    fillDown() {
      const s = this.rect();
      if (s.r2 === s.r1) return;
      this.fill({ c1: s.c1, r1: s.r1, c2: s.c2, r2: s.r1 }, Object.assign({}, s, { dir: 'down' }));
    }
    fillRight() {
      const s = this.rect();
      if (s.c2 === s.c1) return;
      this.fill({ c1: s.c1, r1: s.r1, c2: s.c1, r2: s.r2 }, Object.assign({}, s, { dir: 'right' }));
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  }

  AA.SpreadsheetView = SpreadsheetView;
  AA.formatValue = formatValue;
  AA.escapeHtml = escapeHtml;
})();
