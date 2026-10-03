/*
 * Analyst Adventure — Herramientas para explorar una planilla grande (como en Excel):
 *   🔍 Buscar (Ctrl+B / Ctrl+F): resalta todas las coincidencias, con contador y "siguiente".
 *   🔽 Filtro (Ctrl+Mayús+L): condiciones por columna; oculta las filas que no cumplen
 *      y la barra de estado dice "Se encontraron X de N registros".
 *   🖌 Pintar: celdas o filas (Ctrl+clic en el número de fila) y conteo por color.
 *   ✨ Resaltar celdas: formato condicional simple ("menor que 10" → se pintan solas).
 * Nada de esto cambia los datos ni la corrección de las tareas: solo ayuda a mirar.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const F = AA.Formula;
  const T = (es, en) => AA.T(es, en);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const COLORS = [
    { id: 'y', hex: '#ffe58a', name: { es: 'amarillo', en: 'yellow' } },
    { id: 'g', hex: '#a8e6bd', name: { es: 'verde', en: 'green' } },
    { id: 'p', hex: '#ffb8d2', name: { es: 'rosa', en: 'pink' } },
    { id: 'b', hex: '#b8d4ff', name: { es: 'celeste', en: 'blue' } },
  ];

  const OPS = [
    ['eq', { es: 'es igual a', en: 'equals' }],
    ['ne', { es: 'no es igual a', en: 'does not equal' }],
    ['gt', { es: 'mayor que', en: 'greater than' }],
    ['ge', { es: 'mayor o igual que', en: 'greater than or equal to' }],
    ['lt', { es: 'menor que', en: 'less than' }],
    ['le', { es: 'menor o igual que', en: 'less than or equal to' }],
    ['between', { es: 'entre', en: 'between' }],
    ['contains', { es: 'contiene', en: 'contains' }],
    ['notcontains', { es: 'no contiene', en: 'does not contain' }],
    ['begins', { es: 'empieza con', en: 'begins with' }],
    ['blank', { es: 'está vacía', en: 'is blank' }],
    ['nonblank', { es: 'no está vacía', en: 'is not blank' }],
    ['top', { es: 'los N mayores', en: 'top N' }],
    ['bottom', { es: 'los N menores', en: 'bottom N' }],
  ];
  const NEEDS_A = new Set(['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'between', 'contains', 'notcontains', 'begins', 'top', 'bottom']);

  // --- Lógica pura (se prueba en tests/tools.test.js)
  const isBlank = (v) => v === null || v === undefined || v === '';
  function toNum(x) {
    if (typeof x === 'number') return isFinite(x) ? x : null;
    if (typeof x === 'boolean' || isBlank(x)) return null;
    const s = String(x).trim().replace(/\s/g, '');
    let m = /^(-?)\$?(\d+(?:[.,]\d+)?)(%?)$/.exec(s);
    if (!m) m = /^(-?)\$?(\d{1,3}(?:,\d{3})+(?:\.\d+)?)(%?)$/.exec(s);
    if (!m) return null;
    let n = Number(m[2].includes(',') && !/,\d{3}(?!\d)/.test(m[2]) ? m[2].replace(',', '.') : m[2].replace(/,/g, ''));
    if (m[1]) n = -n;
    if (m[3]) n /= 100;
    return isFinite(n) ? n : null;
  }
  const norm = (x) => String(isBlank(x) ? '' : typeof x === 'boolean' ? (x ? AA.T('VERDADERO', 'TRUE') : AA.T('FALSO', 'FALSE')) : x).trim().toLowerCase();

  // ¿El valor v cumple la regla? ctx.values = valores de la columna (para "los N mayores").
  function matches(v, rule, ctx) {
    if (F && F.isErr && F.isErr(v)) return false;
    const op = rule.op;
    const n = toNum(v);
    const a = rule.a;
    const na = toNum(a);
    const nb = toNum(rule.b);
    switch (op) {
      case 'eq':
        return na !== null && n !== null ? n === na : norm(v) === norm(a);
      case 'ne':
        return !(na !== null && n !== null ? n === na : norm(v) === norm(a));
      case 'gt':
        return n !== null && na !== null && n > na;
      case 'ge':
        return n !== null && na !== null && n >= na;
      case 'lt':
        return n !== null && na !== null && n < na;
      case 'le':
        return n !== null && na !== null && n <= na;
      case 'between':
        return n !== null && na !== null && nb !== null && n >= Math.min(na, nb) && n <= Math.max(na, nb);
      case 'contains':
        return norm(v).includes(norm(a));
      case 'notcontains':
        return !norm(v).includes(norm(a));
      case 'begins':
        return norm(v).startsWith(norm(a));
      case 'blank':
        return isBlank(v);
      case 'nonblank':
        return !isBlank(v);
      case 'top':
      case 'bottom': {
        if (n === null) return false;
        const k = Math.max(1, Math.round(na || 10));
        const nums = ((ctx && ctx.values) || []).map(toNum).filter((x) => x !== null).sort((x, y) => (op === 'top' ? y - x : x - y));
        if (!nums.length) return false;
        const cut = nums[Math.min(k, nums.length) - 1];
        return op === 'top' ? n >= cut : n <= cut;
      }
      default:
        return true;
    }
  }
  function describe(rule) {
    const op = OPS.find((o) => o[0] === rule.op);
    const label = op ? AA.L(op[1]) : rule.op;
    if (rule.op === 'between') return `${label} ${rule.a} ${T('y', 'and')} ${rule.b}`;
    if (rule.op === 'top' || rule.op === 'bottom') return label.replace('N', rule.a || 10);
    return NEEDS_A.has(rule.op) ? `${label} «${rule.a}»` : label;
  }

  const P = () => AA.SpreadsheetView.prototype;

  // --- Métodos que se agregan a la planilla
  const methods = {
    buildTools(host) {
      this.cellPaint = new Map(); // "c,r" -> color
      this.rowPaint = new Map(); // r -> color
      this.rules = []; // [{ c1, r1, c2, r2, op, a, b, color }]
      this.filters = {}; // c -> { op, a, b }
      this.filterOn = false;
      this.find = { open: false, q: '', scope: 'sheet', whole: false, hits: [], i: -1 };
      this.paintColor = 'y';
      host.innerHTML = `
        <button type="button" class="ss-tool" data-tool="find" title="${T('Buscar (Ctrl+B o Ctrl+F)', 'Find (Ctrl+F or Ctrl+B)')}">🔍 ${T('Buscar', 'Find')}</button>
        <button type="button" class="ss-tool" data-tool="filter" title="${T('Activar filtros (Ctrl+Mayús+L)', 'Toggle filters (Ctrl+Shift+L)')}">🔽 ${T('Filtro', 'Filter')}</button>
        <span class="ss-tool-sep"></span>
        <span class="ss-tool-label" title="${T('Pintá las celdas seleccionadas. Ctrl+clic en el número de una fila la pinta entera.', 'Paint the selected cells. Ctrl+click a row number to paint the whole row.')}">🖌</span>
        ${COLORS.map((c) => `<button type="button" class="ss-swatch" data-paint="${c.id}" style="--c:${c.hex}" title="${T('Pintar de', 'Paint')} ${AA.L(c.name)}"></button>`).join('')}
        <button type="button" class="ss-swatch erase" data-paint="" title="${T('Quitar color de la selección', 'Remove color from the selection')}">⌫</button>
        <span class="ss-tool-sep"></span>
        <button type="button" class="ss-tool" data-tool="rule" title="${T('Resaltar automáticamente las celdas que cumplen una condición', 'Automatically highlight cells that meet a condition')}">✨ ${T('Resaltar celdas', 'Highlight cells')}</button>
        <span class="ss-tool-spacer"></span>
        <span class="ss-tool-active" data-el="active"></span>`;
      this.findBar = document.createElement('div');
      this.findBar.className = 'ss-findbar hidden';
      this.findBar.innerHTML = `
        <span>🔍</span>
        <input type="text" data-f="q" placeholder="${T('Buscar texto o número…', 'Find text or number…')}" spellcheck="false" autocomplete="off">
        <select data-f="scope">
          <option value="sheet">${T('En toda la hoja', 'Whole sheet')}</option>
          <option value="col">${T('En la columna seleccionada', 'In the selected column')}</option>
          <option value="row">${T('En la fila seleccionada', 'In the selected row')}</option>
        </select>
        <label class="ss-find-opt"><input type="checkbox" data-f="whole"> ${T('Celda completa', 'Whole cell')}</label>
        <span class="ss-find-count" data-f="count"></span>
        <button type="button" data-f="prev" title="${T('Anterior (Mayús+Enter)', 'Previous (Shift+Enter)')}">▲</button>
        <button type="button" data-f="next" title="${T('Siguiente (Enter)', 'Next (Enter)')}">▼</button>
        <button type="button" data-f="close" title="${T('Cerrar (Esc)', 'Close (Esc)')}">✕</button>`;
      host.after(this.findBar);

      host.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) e.preventDefault(); // que no se pierda la selección
      });
      host.querySelectorAll('[data-tool]').forEach((b) =>
        b.addEventListener('click', () => {
          const t = b.dataset.tool;
          if (t === 'find') this.openFind();
          else if (t === 'filter') this.toggleFilter();
          else if (t === 'rule') this.openRulePop(b);
        })
      );
      host.querySelectorAll('[data-paint]').forEach((b) => b.addEventListener('click', () => this.paintSelection(b.dataset.paint || null)));
      host.querySelector('[data-el="active"]').addEventListener('click', (e) => {
        const x = e.target.closest('[data-clear]');
        if (!x) return;
        const k = x.dataset.clear;
        if (k === 'filters') {
          this.filters = {};
          this.applyFilters();
        } else if (k === 'rules') this.rules = [];
        else if (k === 'paint') {
          this.cellPaint.clear();
          this.rowPaint.clear();
        }
        AA.Audio && AA.Audio.play('back');
        this.refresh();
      });

      // Barra de búsqueda
      const fq = this.findBar.querySelector('[data-f="q"]');
      fq.addEventListener('input', () => {
        this.find.q = fq.value;
        this.runFind(true);
      });
      fq.addEventListener('keydown', (e) => {
        e.stopPropagation();
        const k = e.key.toLowerCase();
        if ((e.ctrlKey || e.metaKey) && (k === 'f' || k === 'b')) {
          e.preventDefault();
          fq.select();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          this.stepFind(e.shiftKey ? -1 : 1);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.closeFind();
        }
      });
      this.findBar.querySelector('[data-f="scope"]').addEventListener('change', (e) => {
        this.find.scope = e.target.value;
        this.runFind(true);
      });
      this.findBar.querySelector('[data-f="whole"]').addEventListener('change', (e) => {
        this.find.whole = e.target.checked;
        this.runFind(true);
      });
      this.findBar.querySelector('[data-f="prev"]').addEventListener('click', () => this.stepFind(-1));
      this.findBar.querySelector('[data-f="next"]').addEventListener('click', () => this.stepFind(1));
      this.findBar.querySelector('[data-f="close"]').addEventListener('click', () => this.closeFind());

      // Botones de filtro en los encabezados de columna
      this.colHeads.forEach((th, c) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ss-fbtn';
        b.dataset.fc = c;
        b.textContent = '▾';
        b.title = T('Filtrar esta columna', 'Filter this column');
        b.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openFilterPop(c, b);
        });
        th.appendChild(b);
      });
      // Atajos también desde la barra de fórmulas y el resto de la planilla
      this.root.addEventListener('keydown', (e) => {
        if (this.editing) return;
        const ctrl = e.ctrlKey || e.metaKey;
        if (ctrl && !e.shiftKey && (e.key === 'b' || e.key === 'B' || e.key === 'f' || e.key === 'F')) {
          e.preventDefault();
          e.stopPropagation();
          this.openFind();
        } else if (ctrl && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
          e.preventDefault();
          e.stopPropagation();
          this.toggleFilter();
        }
      });
    },

    // --- Zona de datos: encabezado (primera fila con datos) y última fila con datos
    dataBounds() {
      let hdr = -1;
      let last = -1;
      let lastCol = -1;
      for (let r = 0; r < this.sheet.rows; r++) {
        let any = false;
        for (let c = 0; c < this.sheet.cols; c++)
          if (!this.sheet.isEmpty(c, r)) {
            any = true;
            if (c > lastCol) lastCol = c;
          }
        if (any) {
          if (hdr < 0) hdr = r;
          last = r;
        }
      }
      return { hdr, last, lastCol };
    },
    colValues(c, b) {
      b = b || this.dataBounds();
      const out = [];
      for (let r = b.hdr + 1; r <= b.last; r++) out.push(this.sheet.getValue(c, r));
      return out;
    },
    rowHidden(r) {
      return !!(this.hiddenRows && this.hiddenRows.has(r));
    },

    // --- Filtros
    toggleFilter() {
      this.filterOn = !this.filterOn;
      if (!this.filterOn) this.filters = {};
      this.root.classList.toggle('filtering', this.filterOn);
      AA.Audio && AA.Audio.play(this.filterOn ? 'select' : 'back');
      this.applyFilters();
      this.refresh();
      if (this.filterOn && this.opts.onToast) this.opts.onToast(T('🔽 Filtros activados: tocá ▾ en la letra de una columna para elegir una condición.', '🔽 Filters on: tap ▾ on a column letter to choose a condition.'));
    },
    applyFilters() {
      const b = this.dataBounds();
      const cols = Object.keys(this.filters).map(Number);
      const ctx = {};
      cols.forEach((c) => (ctx[c] = { values: this.colValues(c, b) }));
      this.hiddenRows = new Set();
      if (cols.length && b.hdr >= 0) {
        for (let r = b.hdr + 1; r <= b.last; r++) {
          const ok = cols.every((c) => matches(this.sheet.getValue(c, r), this.filters[c], ctx[c]));
          if (!ok) this.hiddenRows.add(r);
        }
      }
      for (let r = 0; r < this.sheet.rows; r++) this.tds[r][0].parentElement.classList.toggle('ss-hidden-row', this.hiddenRows.has(r));
      this.filterInfo = cols.length && b.hdr >= 0 ? { shown: b.last - b.hdr - this.hiddenRows.size, total: b.last - b.hdr } : null;
      // Si la celda activa quedó oculta, se mueve a la primera visible.
      if (this.rowHidden(this.sel.ar)) {
        let r = this.sel.ar;
        while (r < this.sheet.rows - 1 && this.rowHidden(r)) r++;
        this.sel = { ac: this.sel.ac, ar: r, fc: this.sel.ac, fr: r };
      }
    },

    // Ventanita flotante (filtro y resaltar)
    popover(anchor, html, bind) {
      this.closePop();
      const pop = document.createElement('div');
      pop.className = 'ss-pop';
      pop.innerHTML = html;
      document.body.appendChild(pop);
      const r = anchor.getBoundingClientRect();
      const w = pop.offsetWidth;
      pop.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left)) + 'px';
      const top = r.bottom + 6;
      pop.style.top = (top + pop.offsetHeight > innerHeight - 8 ? Math.max(8, r.top - pop.offsetHeight - 6) : top) + 'px';
      pop.addEventListener('mousedown', (e) => e.stopPropagation());
      pop.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Escape') {
          e.preventDefault();
          this.closePop();
          this.focusGrid();
        }
      });
      this.pop = pop;
      this.popOutside = (e) => {
        if (!pop.contains(e.target) && e.target !== anchor) this.closePop();
      };
      setTimeout(() => document.addEventListener('mousedown', this.popOutside), 0);
      bind(pop);
      const first = pop.querySelector('select, input');
      if (first) first.focus();
      return pop;
    },
    closePop() {
      if (this.pop) this.pop.remove();
      this.pop = null;
      if (this.popOutside) document.removeEventListener('mousedown', this.popOutside);
    },
    ruleForm(rule, withColor) {
      const ops = OPS.map(([v, l]) => `<option value="${v}" ${rule && rule.op === v ? 'selected' : ''}>${AA.L(l)}</option>`).join('');
      return `
        <div class="ss-pop-row"><select data-p="op">${ops}</select></div>
        <div class="ss-pop-row" data-p="vals">
          <input type="text" data-p="a" placeholder="${T('valor', 'value')}" value="${esc(rule ? rule.a || '' : '')}">
          <span data-p="and">${T('y', 'and')}</span>
          <input type="text" data-p="b" placeholder="${T('valor', 'value')}" value="${esc(rule ? rule.b || '' : '')}">
        </div>
        ${
          withColor
            ? `<div class="ss-pop-row ss-pop-colors">${T('Color', 'Color')}: ${COLORS.map((c, i) => `<label class="ss-swatch-pick"><input type="radio" name="rc" value="${c.id}" ${i === 0 ? 'checked' : ''}><span style="--c:${c.hex}"></span></label>`).join('')}</div>`
            : ''
        }`;
    },
    bindRuleForm(pop) {
      const op = pop.querySelector('[data-p="op"]');
      const sync = () => {
        const v = op.value;
        pop.querySelector('[data-p="vals"]').classList.toggle('hidden', !NEEDS_A.has(v));
        pop.querySelector('[data-p="b"]').classList.toggle('hidden', v !== 'between');
        pop.querySelector('[data-p="and"]').classList.toggle('hidden', v !== 'between');
        const a = pop.querySelector('[data-p="a"]');
        if ((v === 'top' || v === 'bottom') && !a.value) a.value = '10';
      };
      op.addEventListener('change', sync);
      sync();
      return () => ({
        op: op.value,
        a: pop.querySelector('[data-p="a"]').value.trim(),
        b: pop.querySelector('[data-p="b"]').value.trim(),
        color: (pop.querySelector('input[name="rc"]:checked') || {}).value,
      });
    },
    openFilterPop(c, anchor) {
      const b = this.dataBounds();
      if (b.hdr < 0) return;
      const head = this.sheet.getValue(c, b.hdr);
      const vals = this.colValues(c, b);
      const uniq = [...new Set(vals.filter((v) => !isBlank(v)).map((v) => (typeof v === 'number' ? v : String(v))))];
      const textual = uniq.some((v) => typeof v !== 'number');
      const chips = textual && uniq.length <= 40 ? uniq.slice(0, 40).sort((x, y) => String(x).localeCompare(String(y))).map((v) => `<button type="button" class="ss-chip-v" data-v="${esc(v)}">${esc(v)}</button>`).join('') : '';
      const cur = this.filters[c];
      this.popover(
        anchor,
        `<div class="ss-pop-title">🔽 ${T('Filtrar', 'Filter')} · ${F.indexToCol(c)}${isBlank(head) ? '' : ` · <b>${esc(head)}</b>`}</div>
         <div class="ss-pop-help">${T('Mostrar solo las filas donde la columna…', 'Show only the rows where the column…')}</div>
         ${this.ruleForm(cur || { op: textual ? 'eq' : 'lt' }, false)}
         ${chips ? `<div class="ss-pop-help">${T('O elegí un valor:', 'Or pick a value:')}</div><div class="ss-chips-v">${chips}</div>` : ''}
         <div class="ss-pop-foot">
           ${cur ? `<button type="button" class="btn btn-sm" data-p="clear">${T('Quitar filtro', 'Clear filter')}</button>` : ''}
           <button type="button" class="btn btn-sm btn-primary" data-p="ok">${T('Aplicar', 'Apply')}</button>
         </div>`,
        (pop) => {
          const read = this.bindRuleForm(pop);
          const apply = (rule) => {
            if (NEEDS_A.has(rule.op) && rule.a === '') return;
            this.filters[c] = { op: rule.op, a: rule.a, b: rule.b };
            if (!this.filterOn) {
              this.filterOn = true;
              this.root.classList.add('filtering');
            }
            this.applyFilters();
            this.closePop();
            AA.Audio && AA.Audio.play('select');
            this.refresh();
            this.focusGrid();
          };
          pop.querySelector('[data-p="ok"]').addEventListener('click', () => apply(read()));
          pop.querySelectorAll('input[type="text"]').forEach((i) => i.addEventListener('keydown', (e) => e.key === 'Enter' && apply(read())));
          pop.querySelectorAll('[data-v]').forEach((ch) => ch.addEventListener('click', () => apply({ op: 'eq', a: ch.dataset.v })));
          const clr = pop.querySelector('[data-p="clear"]');
          if (clr)
            clr.addEventListener('click', () => {
              delete this.filters[c];
              this.applyFilters();
              this.closePop();
              this.refresh();
              this.focusGrid();
            });
        }
      );
    },

    // --- Resaltar celdas (formato condicional)
    openRulePop(anchor) {
      let { c1, r1, c2, r2 } = this.rect();
      // Una sola celda: se aplica a los datos de toda su columna.
      if (c1 === c2 && r1 === r2) {
        const b = this.dataBounds();
        if (b.hdr >= 0) {
          r1 = b.hdr + 1;
          r2 = b.last;
        }
      }
      const where = c1 === c2 ? `${F.makeRef(c1, r1)}:${F.makeRef(c2, r2)}` : `${F.makeRef(c1, r1)}:${F.makeRef(c2, r2)}`;
      const list = this.rules
        .map((rl, i) => `<div class="ss-rule"><span class="ss-dot" style="--c:${(COLORS.find((x) => x.id === rl.color) || COLORS[0]).hex}"></span>${F.makeRef(rl.c1, rl.r1)}:${F.makeRef(rl.c2, rl.r2)} ${esc(describe(rl))}<button type="button" data-del="${i}" title="${T('Quitar', 'Remove')}">✕</button></div>`)
        .join('');
      this.popover(
        anchor,
        `<div class="ss-pop-title">✨ ${T('Resaltar celdas', 'Highlight cells')} · ${where}</div>
         <div class="ss-pop-help">${T('Pintar automáticamente las celdas que…', 'Automatically paint the cells that…')}</div>
         ${this.ruleForm({ op: 'lt' }, true)}
         ${list ? `<div class="ss-pop-help">${T('Reglas activas:', 'Active rules:')}</div>${list}` : ''}
         <div class="ss-pop-foot"><button type="button" class="btn btn-sm btn-primary" data-p="ok">${T('Resaltar', 'Highlight')}</button></div>`,
        (pop) => {
          const read = this.bindRuleForm(pop);
          const add = () => {
            const rule = read();
            if (NEEDS_A.has(rule.op) && rule.a === '') return;
            this.rules.push({ c1, r1, c2, r2, op: rule.op, a: rule.a, b: rule.b, color: rule.color || 'y' });
            this.closePop();
            AA.Audio && AA.Audio.play('select');
            this.refresh();
            this.focusGrid();
          };
          pop.querySelector('[data-p="ok"]').addEventListener('click', add);
          pop.querySelectorAll('input[type="text"]').forEach((i) => i.addEventListener('keydown', (e) => e.key === 'Enter' && add()));
          pop.querySelectorAll('[data-del]').forEach((d) =>
            d.addEventListener('click', () => {
              this.rules.splice(+d.dataset.del, 1);
              this.closePop();
              this.refresh();
            })
          );
        }
      );
    },

    // --- Pintar
    paintSelection(color) {
      const { c1, r1, c2, r2 } = this.rect();
      const fullRows = c1 === 0 && c2 === this.sheet.cols - 1;
      for (let r = r1; r <= r2; r++) {
        if (this.rowHidden(r)) continue;
        if (fullRows) {
          if (color) this.rowPaint.set(r, color);
          else this.rowPaint.delete(r);
        }
        for (let c = c1; c <= c2; c++) {
          const k = c + ',' + r;
          if (color && !fullRows) this.cellPaint.set(k, color);
          else this.cellPaint.delete(k);
        }
        if (!color) this.rowPaint.delete(r);
      }
      AA.Audio && AA.Audio.play(color ? 'type' : 'back');
      this.refresh();
      this.focusGrid();
    },
    // Ctrl+clic en el número de fila: sin color → amarillo → verde → rosa → celeste → sin color.
    cycleRowPaint(r) {
      const cur = this.rowPaint.get(r);
      const i = COLORS.findIndex((c) => c.id === cur);
      const next = COLORS[i + 1];
      if (next) this.rowPaint.set(r, next.id);
      else this.rowPaint.delete(r);
      AA.Audio && AA.Audio.play('type');
      this.refresh();
    },

    // --- Buscar
    openFind() {
      this.find.open = true;
      this.findBar.classList.remove('hidden');
      const q = this.findBar.querySelector('[data-f="q"]');
      q.focus();
      q.select();
      this.runFind(false);
      this.renderSelection();
    },
    closeFind() {
      this.find.open = false;
      this.find.hits = [];
      this.findBar.classList.add('hidden');
      this.refresh();
      this.focusGrid();
    },
    runFind(jump) {
      const f = this.find;
      const q = f.q.trim().toLowerCase();
      f.hits = [];
      f.i = -1;
      if (q) {
        const fmtFn = this.opts.format;
        for (let r = 0; r < this.sheet.rows; r++) {
          if (this.rowHidden(r)) continue;
          if (f.scope === 'row' && r !== this.sel.ar) continue;
          for (let c = 0; c < this.sheet.cols; c++) {
            if (f.scope === 'col' && c !== this.sel.ac) continue;
            const v = this.sheet.getValue(c, r);
            if (isBlank(v)) continue;
            const shown = AA.formatValue(v, fmtFn ? fmtFn(c, r) : null).toLowerCase();
            const raw = String(v).toLowerCase();
            const hit = f.whole ? shown === q || raw === q : shown.includes(q) || raw.includes(q);
            if (hit) f.hits.push([c, r]);
          }
        }
      }
      if (jump && f.hits.length) this.stepFind(1, true);
      else this.refresh();
    },
    stepFind(d, first) {
      const f = this.find;
      if (!f.hits.length) {
        this.refresh();
        return;
      }
      f.i = first ? 0 : (f.i + d + f.hits.length) % f.hits.length;
      const [c, r] = f.hits[f.i];
      this.sel = { ac: c, ar: r, fc: c, fr: r };
      this.refresh();
      this.tds[r][c].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    },

    // --- Dibujo: colores, resaltados y coincidencias (se llama al final de refresh)
    decorate() {
      if (!this.cellPaint) return;
      const DEC = /\s(?:pt-[ygpb]|hl-[ygpb]|ss-find|ss-find-cur)\b/g;
      const hl = new Map();
      this.ruleHits = 0;
      for (const rl of this.rules) {
        const ctx = { values: [] };
        for (let r = rl.r1; r <= rl.r2; r++) for (let c = rl.c1; c <= rl.c2; c++) ctx.values.push(this.sheet.getValue(c, r));
        for (let r = rl.r1; r <= rl.r2; r++) {
          if (this.rowHidden(r)) continue;
          for (let c = rl.c1; c <= rl.c2; c++) {
            const k = c + ',' + r;
            if (!hl.has(k) && matches(this.sheet.getValue(c, r), rl, ctx)) {
              hl.set(k, rl.color);
              this.ruleHits++;
            }
          }
        }
      }
      const hits = new Set(this.find.open ? this.find.hits.map(([c, r]) => c + ',' + r) : []);
      const cur = this.find.open && this.find.i >= 0 ? this.find.hits[this.find.i].join(',') : null;
      // Una fila pintada se colorea hasta la última columna con datos (o con celdas a completar).
      const rowEnd = this.rowPaint.size ? Math.max(this.dataBounds().lastCol, this.lastTargetCol()) : -1;
      for (let r = 0; r < this.sheet.rows; r++) {
        const rp = this.rowPaint.get(r);
        this.rowHeads[r].classList.toggle('painted', !!rp);
        this.rowHeads[r].style.setProperty('--pc', rp ? COLORS.find((x) => x.id === rp).hex : '');
        for (let c = 0; c < this.sheet.cols; c++) {
          const td = this.tds[r][c];
          const k = c + ',' + r;
          let cls = td.className.replace(DEC, '');
          const p = this.cellPaint.get(k) || (c <= rowEnd ? rp : null);
          if (p) cls += ' pt-' + p;
          const h = hl.get(k);
          if (h) cls += ' hl-' + h;
          if (hits.has(k)) cls += k === cur ? ' ss-find ss-find-cur' : ' ss-find';
          td.className = cls;
        }
      }
      // Contador de búsqueda
      if (this.findBar) {
        const f = this.find;
        this.findBar.querySelector('[data-f="count"]').textContent = f.q.trim() ? (f.hits.length ? `${f.i + 1 > 0 ? f.i + 1 : 0} ${T('de', 'of')} ${f.hits.length}` : T('Sin coincidencias', 'No matches')) : '';
      }
      // Chips de lo que está activo (con ✕ para quitar)
      const act = this.root.querySelector('.ss-tools [data-el="active"]');
      if (act) {
        const nF = Object.keys(this.filters).length;
        const nP = this.cellPaint.size + this.rowPaint.size;
        act.innerHTML =
          (nF ? `<span class="ss-act">🔽 ${nF} ${T(nF > 1 ? 'filtros' : 'filtro', nF > 1 ? 'filters' : 'filter')} <button type="button" data-clear="filters" title="${T('Quitar filtros', 'Clear filters')}">✕</button></span>` : '') +
          (this.rules.length ? `<span class="ss-act">✨ ${this.rules.length} ${T(this.rules.length > 1 ? 'reglas' : 'regla', this.rules.length > 1 ? 'rules' : 'rule')} <button type="button" data-clear="rules" title="${T('Quitar reglas', 'Clear rules')}">✕</button></span>` : '') +
          (nP ? `<span class="ss-act">🖌 ${T('pintado', 'painted')} <button type="button" data-clear="paint" title="${T('Quitar colores', 'Clear colors')}">✕</button></span>` : '');
      }
      this.colHeads.forEach((th, c) => th.classList.toggle('filtered', !!this.filters[c]));
    },

    lastTargetCol() {
      let m = -1;
      for (let r = 0; r < this.sheet.rows; r++) for (let c = 0; c < this.sheet.cols; c++) if (c > m && / target\b/.test(this.tds[r][c].className)) m = c;
      return m;
    },

    // Extras de la barra de estado: filas encontradas, resaltadas y conteo por color.
    statusExtras() {
      const parts = [];
      if (this.filterInfo) parts.push(`<span class="ss-st-item ss-st-filter">🔽 ${T('Se encontraron', 'Found')} <b>${this.filterInfo.shown}</b> ${T('de', 'of')} <b>${this.filterInfo.total}</b> ${T('registros', 'records')}</span>`);
      if (this.rules && this.rules.length) parts.push(`<span class="ss-st-item">✨ ${T('Resaltadas', 'Highlighted')}: <b>${this.ruleHits || 0}</b></span>`);
      if (this.cellPaint && (this.cellPaint.size || this.rowPaint.size)) {
        const counts = {};
        for (const [r, c] of this.rowPaint) if (!this.rowHidden(r)) counts[c] = (counts[c] || 0) + 1;
        for (const [k, c] of this.cellPaint) {
          const r = +k.split(',')[1];
          if (!this.rowHidden(r) && !this.rowPaint.has(r)) counts[c] = (counts[c] || 0) + 1;
        }
        const chips = COLORS.filter((c) => counts[c.id]).map((c) => `<span class="ss-st-color"><i style="--c:${c.hex}"></i><b>${counts[c.id]}</b></span>`).join('');
        if (chips) parts.push(`<span class="ss-st-item" title="${T('Filas o celdas pintadas de cada color', 'Rows or cells painted with each color')}">🖌 ${chips}</span>`);
      }
      return parts.join('');
    },
  };

  function install() {
    if (!AA.SpreadsheetView) return;
    Object.assign(P(), methods);
  }
  install();
  AA.GridTools = { matches, toNum, describe, OPS, COLORS, install };
})();
