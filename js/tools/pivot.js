/*
 * Analyst Adventure — Tabla dinámica (versión simple de las de Excel / Google Sheets).
 *
 * Las mismas cuatro áreas que en Excel:
 *   FILAS     → una dimensión: una fila por cada valor (por ejemplo, una por vendedor).
 *   COLUMNAS  → una dimensión opcional: una columna por cada valor (por ejemplo, una por mes).
 *   VALORES   → un campo y cómo se resume: Suma, Recuento, Promedio, Máximo o Mínimo.
 *   FILTROS   → una dimensión opcional: qué valores se incluyen.
 * Además: "Mostrar valores como" (% del total general) y ordenar por el total.
 *
 * spec = { rows, columns, value: { field, agg } | null, filter: { field, values } | null, show: 'value' | 'pct', sort: 'none' | 'desc' | 'asc' | 'label' }
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const T = (es, en) => (AA.T ? AA.T(es, en) : es);
  const L = (o) => (AA.L ? AA.L(o) : o.es);
  const esc = (s) => (AA.escapeHtml ? AA.escapeHtml(s) : String(s));
  const norm = (s) =>
    String(s === null || s === undefined ? '' : s)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();

  const AGGS = {
    SUM: { es: 'Suma', en: 'Sum' },
    COUNT: { es: 'Recuento', en: 'Count' },
    AVG: { es: 'Promedio', en: 'Average' },
    MAX: { es: 'Máximo', en: 'Max' },
    MIN: { es: 'Mínimo', en: 'Min' },
  };

  function emptySpec() {
    return { rows: null, columns: null, value: null, filter: null, show: 'value', sort: 'none' };
  }

  function fields(table) {
    return table.headers.map((name, i) => {
      const vals = table.rows.map((r) => r[i]).filter((v) => v !== null && v !== undefined && v !== '');
      return { name, index: i, numeric: vals.length > 0 && vals.every((v) => typeof v === 'number') };
    });
  }

  function aggregate(values, agg) {
    const nums = values.filter((v) => typeof v === 'number');
    switch (agg) {
      case 'COUNT':
        return values.filter((v) => v !== null && v !== undefined && v !== '').length;
      case 'AVG':
        return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
      case 'MIN':
        return nums.length ? Math.min(...nums) : null;
      case 'MAX':
        return nums.length ? Math.max(...nums) : null;
      default:
        return nums.reduce((a, b) => a + b, 0);
    }
  }

  function unique(arr) {
    const seen = new Set();
    const out = [];
    for (const v of arr) {
      const k = String(v);
      if (!seen.has(k)) {
        seen.add(k);
        out.push(v);
      }
    }
    return out;
  }

  // Calcula la tabla dinámica.
  function resolve(spec, table) {
    const fs = fields(table);
    const byName = (n) => fs.find((f) => f.name === n) || null;
    const rowF = spec.rows ? byName(spec.rows) : null;
    const colF = spec.columns ? byName(spec.columns) : null;
    const valF = spec.value ? byName(spec.value.field) : null;
    if (!rowF && !colF && !valF) return { ok: false, empty: true };
    if (!valF) return { ok: false, error: T('Falta el área Valores: ¿qué número querés resumir?', 'The Values area is empty: which number do you want to summarize?') };
    const agg = valF.numeric ? spec.value.agg || 'SUM' : 'COUNT';
    if (spec.show === 'pct' && !(agg === 'SUM' || agg === 'COUNT')) {
      return { ok: false, error: T('"% del total" solo tiene sentido con Suma o Recuento.', '"% of total" only makes sense with Sum or Count.') };
    }
    let rows = table.rows;
    if (spec.filter && spec.filter.field) {
      const ff = byName(spec.filter.field);
      if (ff) {
        const keep = new Set((spec.filter.values || []).map(String));
        rows = rows.filter((r) => keep.has(String(r[ff.index])));
      }
    }
    const val = (r) => r[valF.index];
    let rowKeys = rowF ? unique(rows.map((r) => r[rowF.index])) : [null];
    const colKeys = colF ? unique(rows.map((r) => r[colF.index])) : [null];
    const pick = (rk, ck) => rows.filter((r) => (rk === null || r[rowF.index] === rk) && (ck === null || r[colF.index] === ck));
    let cells = rowKeys.map((rk) => colKeys.map((ck) => {
      const sub = pick(rk, ck);
      return sub.length ? aggregate(sub.map(val), agg) : null;
    }));
    let rowTotals = rowKeys.map((rk) => aggregate(pick(rk, null).map(val), agg));
    const colTotals = colKeys.map((ck) => aggregate(pick(null, ck).map(val), agg));
    const grand = aggregate(rows.map(val), agg);
    if (spec.sort && spec.sort !== 'none' && rowF) {
      const order = rowKeys.map((_, i) => i);
      if (spec.sort === 'label') order.sort((a, b) => String(rowKeys[a]).localeCompare(String(rowKeys[b])));
      else order.sort((a, b) => (spec.sort === 'desc' ? (rowTotals[b] || 0) - (rowTotals[a] || 0) : (rowTotals[a] || 0) - (rowTotals[b] || 0)));
      rowKeys = order.map((i) => rowKeys[i]);
      cells = order.map((i) => cells[i]);
      rowTotals = order.map((i) => rowTotals[i]);
    }
    const pct = spec.show === 'pct' && grand ? (v) => (v === null ? null : v / grand) : (v) => v;
    return {
      ok: true,
      agg,
      value: valF.name,
      rowField: rowF ? rowF.name : null,
      colField: colF ? colF.name : null,
      rowKeys,
      colKeys,
      cells: cells.map((r) => r.map(pct)),
      rowTotals: rowTotals.map(pct),
      colTotals: colTotals.map(pct),
      grand: pct(grand),
      pct: spec.show === 'pct',
      count: rows.length,
    };
  }

  // Valor de una celda de la tabla resuelta (para preguntas y validaciones).
  function lookup(res, rowKey, colKey) {
    const i = res.rowKeys.findIndex((k) => norm(k) === norm(rowKey));
    if (i < 0) return undefined;
    if (colKey === undefined || colKey === null) return res.rowTotals[i];
    const j = res.colKeys.findIndex((k) => norm(k) === norm(colKey));
    return j < 0 ? undefined : res.cells[i][j];
  }

  // ---------------------------------------------------------------------------
  // Validador: check(S) con S.pivot = { spec, table }.
  //   opts: rows, columns (null = sin columnas), value, aggs, filter { field, values }, show, sort
  // ---------------------------------------------------------------------------
  function expect(opts) {
    return (S) => {
      const P = S.pivot;
      if (!P) return false;
      const res = resolve(P.spec, P.table);
      if (res.empty) return false;
      if (!res.ok) return res.error;
      const sp = P.spec;
      if (opts.rows !== undefined && sp.rows !== opts.rows) {
        return opts.rows ? T(`En Filas tiene que ir ${opts.rows}: una fila por cada uno.`, `${opts.rows} must go in Rows: one row for each.`) : T('Este pedido no necesita nada en Filas.', 'This request does not need anything in Rows.');
      }
      if (opts.columns !== undefined && (sp.columns || null) !== opts.columns) {
        return opts.columns ? T(`Llevá ${opts.columns} a Columnas para cruzarlo con las filas.`, `Move ${opts.columns} to Columns to cross it with the rows.`) : T('Sacá el campo de Columnas: este pedido es una lista simple.', 'Remove the Columns field: this request is a simple list.');
      }
      if (opts.value && res.value !== opts.value) return T(`En Valores tiene que ir ${opts.value}.`, `${opts.value} must go in Values.`);
      if (opts.aggs && !opts.aggs.includes(res.agg)) {
        return T(`Revisá cómo se resume ${res.value}: tiene que ser ${opts.aggs.map((a) => L(AGGS[a])).join(' o ')}.`, `Check how ${res.value} is summarized: it must be ${opts.aggs.map((a) => L(AGGS[a])).join(' or ')}.`);
      }
      if (opts.filter) {
        const f = sp.filter;
        const want = opts.filter.values.map(norm).sort().join('|');
        const got = f && f.field === opts.filter.field ? (f.values || []).map(norm).sort().join('|') : null;
        if (got !== want) return T(`Usá el área Filtros: dejá solo ${opts.filter.field} = ${opts.filter.values.join(', ')}.`, `Use the Filters area: keep only ${opts.filter.field} = ${opts.filter.values.join(', ')}.`);
      } else if (opts.noFilter && sp.filter && sp.filter.values && sp.filter.values.length !== new Set(P.table.rows.map((r) => String(r[P.table.headers.indexOf(sp.filter.field)]))).size) {
        return T('Este pedido es sobre todos los datos: sacá el filtro.', 'This request is about all the data: remove the filter.');
      }
      if (opts.show && (sp.show || 'value') !== opts.show) {
        return opts.show === 'pct' ? T('Mostrá los valores como "% del total general".', 'Show values as "% of grand total".') : T('Mostrá los valores normales, no como porcentaje.', 'Show plain values, not percentages.');
      }
      if (opts.sort === 'desc' && sp.sort !== 'desc') return T('Ordená las filas de mayor a menor total.', 'Sort the rows from largest to smallest total.');
      return true;
    };
  }

  // ---------------------------------------------------------------------------
  // Editor visual
  // ---------------------------------------------------------------------------
  function fmtVal(v, pct, money) {
    if (v === null || v === undefined) return '';
    if (pct) return (v * 100).toLocaleString('en-US', { maximumFractionDigits: 1 }) + '%';
    const d = Math.abs(v) < 100 && v % 1 ? 2 : 0;
    return (money ? '$' : '') + v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: 2 });
  }

  class PivotBuilder {
    constructor(root, table, spec, opts) {
      this.root = root;
      this.table = table;
      this.spec = Object.assign(emptySpec(), spec || {});
      this.opts = opts || {};
      this.fields = fields(table);
      this.build();
      this.render();
    }

    build() {
      const pill = (f) => `<button class="cb-pill ${f.numeric ? 'measure' : 'dimension'}" draggable="true" data-field="${esc(f.name)}">${f.numeric ? '#' : 'Abc'} ${esc(f.name)}</button>`;
      const area = (key, label, hint) => `
        <div class="pv-area" data-area="${key}">
          <span class="cb-shelf-label">${label}</span>
          <div class="cb-drop" data-drop="${key}" data-hint="${esc(hint)}"><span class="cb-drop-hint">${esc(hint)}</span></div>
        </div>`;
      this.root.innerHTML = `
        <div class="cb pv">
          <aside class="cb-fields">
            <h4>${T('Campos', 'Fields')}</h4>
            <div class="cb-list">${this.fields.map(pill).join('')}</div>
            <p class="cb-help">${T('Arrastrá cada campo a un área (o hacé clic). Como en Excel: <b>Filas</b>, <b>Columnas</b>, <b>Valores</b> y <b>Filtros</b>.', 'Drag each field to an area (or click it). Just like Excel: <b>Rows</b>, <b>Columns</b>, <b>Values</b> and <b>Filters</b>.')}</p>
          </aside>
          <section class="cb-main">
            <div class="pv-areas">
              ${area('filter', T('Filtros', 'Filters'), T('qué datos incluir', 'which data to include'))}
              ${area('columns', T('Columnas', 'Columns'), T('opcional: cruza con las filas', 'optional: crosses with rows'))}
              ${area('rows', T('Filas', 'Rows'), T('una fila por cada valor', 'one row per value'))}
              ${area('value', T('Valores', 'Values'), T('el número a resumir', 'the number to summarize'))}
            </div>
            <div class="cb-filter-values"></div>
            <div class="cb-toolbar">
              <label class="cb-opt">${T('Mostrar valores como', 'Show values as')}
                <select data-opt="show">
                  <option value="value">${T('Valor', 'Value')}</option>
                  <option value="pct">${T('% del total general', '% of grand total')}</option>
                </select>
              </label>
              <label class="cb-opt">${T('Ordenar filas', 'Sort rows')}
                <select data-opt="sort">
                  <option value="none">${T('Como aparecen', 'As they appear')}</option>
                  <option value="desc">${T('Total: mayor a menor', 'Total: largest first')}</option>
                  <option value="asc">${T('Total: menor a mayor', 'Total: smallest first')}</option>
                  <option value="label">${T('Alfabético', 'Alphabetical')}</option>
                </select>
              </label>
              <button class="cb-clear" title="${T('Empezar de nuevo', 'Start over')}">⟲</button>
            </div>
            <div class="pv-out"></div>
          </section>
        </div>
        <div class="cb-menu hidden"></div>`;
      this.out = this.root.querySelector('.pv-out');
      this.menu = this.root.querySelector('.cb-menu');
      this.bind();
    }

    bind() {
      const r = this.root;
      r.querySelectorAll('.cb-fields .cb-pill').forEach((p) => {
        p.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', p.dataset.field));
        p.addEventListener('click', (e) => this.openMenu(p.dataset.field, e.currentTarget));
      });
      r.querySelectorAll('[data-drop]').forEach((zone) => {
        zone.addEventListener('dragover', (e) => {
          e.preventDefault();
          zone.classList.add('over');
        });
        zone.addEventListener('dragleave', () => zone.classList.remove('over'));
        zone.addEventListener('drop', (e) => {
          e.preventDefault();
          zone.classList.remove('over');
          const name = e.dataTransfer.getData('text/plain');
          if (name) this.assign(zone.dataset.drop, name);
        });
      });
      r.querySelector('[data-opt="show"]').addEventListener('change', (e) => {
        this.spec.show = e.target.value;
        this.changed();
      });
      r.querySelector('[data-opt="sort"]').addEventListener('change', (e) => {
        this.spec.sort = e.target.value;
        this.changed();
      });
      r.querySelector('.cb-clear').addEventListener('click', () => {
        this.spec = emptySpec();
        this.changed();
      });
      this.onDocDown = (e) => {
        if (!this.menu.contains(e.target) && !e.target.closest('.cb-fields .cb-pill')) this.menu.classList.add('hidden');
      };
      document.addEventListener('mousedown', this.onDocDown);
    }

    openMenu(name, anchor) {
      const opts = [['rows', T('Filas', 'Rows')], ['columns', T('Columnas', 'Columns')], ['value', T('Valores', 'Values')], ['filter', T('Filtros', 'Filters')]];
      this.menu.innerHTML = `<div class="cb-menu-title">${esc(name)} →</div>` + opts.map(([k, l]) => `<button data-to="${k}">${l}</button>`).join('');
      const box = anchor.getBoundingClientRect();
      const host = this.root.getBoundingClientRect();
      this.menu.style.left = box.right - host.left + 6 + 'px';
      this.menu.style.top = box.top - host.top + 'px';
      this.menu.classList.remove('hidden');
      this.menu.querySelectorAll('[data-to]').forEach((b) =>
        b.addEventListener('click', () => {
          this.menu.classList.add('hidden');
          this.assign(b.dataset.to, name);
        })
      );
    }

    assign(area, name) {
      const f = this.fields.find((x) => x.name === name);
      if (!f) return;
      const s = this.spec;
      if (area === 'value') s.value = { field: name, agg: f.numeric ? 'SUM' : 'COUNT' };
      else if (area === 'filter') s.filter = { field: name, values: unique(this.table.rows.map((r) => String(r[f.index]))) };
      else {
        if ((area === 'rows' && s.columns === name) || (area === 'columns' && s.rows === name)) {
          if (this.opts.onToast) this.opts.onToast(T('Un mismo campo no puede estar en Filas y en Columnas a la vez.', 'The same field cannot be in Rows and Columns at once.'));
          AA.Audio && AA.Audio.play('error');
          return;
        }
        s[area] = name;
      }
      AA.Audio && AA.Audio.play('select');
      this.changed();
    }

    changed() {
      this.render();
      if (this.opts.onChange) this.opts.onChange(this.spec);
    }

    render() {
      const s = this.spec;
      const zone = (key) => this.root.querySelector(`[data-drop="${key}"]`);
      const put = (key, name, extra) => {
        const z = zone(key);
        if (!name) {
          z.classList.remove('filled');
          z.innerHTML = `<span class="cb-drop-hint">${esc(z.dataset.hint)}</span>`;
          return;
        }
        const f = this.fields.find((x) => x.name === name);
        z.classList.add('filled');
        z.innerHTML = `<span class="cb-pill on ${f && f.numeric ? 'measure' : 'dimension'}">${extra || ''}${esc(name)}<button class="cb-x" data-remove="${key}" title="${T('Quitar', 'Remove')}">×</button></span>`;
      };
      put('rows', s.rows);
      put('columns', s.columns);
      put('filter', s.filter && s.filter.field);
      if (s.value) {
        const f = this.fields.find((x) => x.name === s.value.field);
        const aggSel = f && f.numeric
          ? `<select class="cb-agg" data-agg>${Object.keys(AGGS).map((a) => `<option value="${a}" ${s.value.agg === a ? 'selected' : ''}>${L(AGGS[a])}</option>`).join('')}</select>`
          : `<span class="pv-agg-fixed">${L(AGGS.COUNT)} ${T('de', 'of')}</span>`;
        put('value', s.value.field, aggSel);
      } else put('value', null);
      this.root.querySelectorAll('[data-remove]').forEach((b) =>
        b.addEventListener('click', () => {
          s[b.dataset.remove] = null;
          this.changed();
        })
      );
      const agg = this.root.querySelector('[data-agg]');
      if (agg) {
        agg.addEventListener('change', () => {
          s.value.agg = agg.value;
          this.changed();
        });
      }
      const fv = this.root.querySelector('.cb-filter-values');
      if (s.filter) {
        const f = this.fields.find((x) => x.name === s.filter.field);
        const all = unique(this.table.rows.map((r) => String(r[f.index])));
        fv.innerHTML = `<span>${T('Incluir', 'Include')} <b>${esc(f.name)}</b>:</span>` + all.map((v) => `<label><input type="checkbox" value="${esc(v)}" ${s.filter.values.includes(v) ? 'checked' : ''}> ${esc(v)}</label>`).join('');
        fv.querySelectorAll('input').forEach((cb) =>
          cb.addEventListener('change', () => {
            s.filter.values = [...fv.querySelectorAll('input:checked')].map((x) => x.value);
            this.changed();
          })
        );
        fv.classList.remove('hidden');
      } else {
        fv.innerHTML = '';
        fv.classList.add('hidden');
      }
      this.root.querySelector('[data-opt="show"]').value = s.show || 'value';
      this.root.querySelector('[data-opt="sort"]').value = s.sort || 'none';
      this.draw();
    }

    draw() {
      const res = resolve(this.spec, this.table);
      if (res.empty || !res.ok) {
        this.out.innerHTML = `<div class="cb-empty">${res.empty ? T('Arrastrá un campo a <b>Filas</b> y un número a <b>Valores</b> para armar la tabla.', 'Drag a field to <b>Rows</b> and a number to <b>Values</b> to build the table.') : '⚠️ ' + esc(res.error)}</div>`;
        return;
      }
      const money = !!(this.opts.money || []).includes(res.value);
      const f = (v) => fmtVal(v, res.pct, money && !res.pct && res.agg !== 'COUNT');
      const head = `${L(AGGS[res.agg])} ${T('de', 'of')} ${esc(res.value)}${res.pct ? ` <span class="muted">(% ${T('del total', 'of total')})</span>` : ''}`;
      const colHead = res.colField
        ? `<tr><th class="pv-corner">${head}</th>${res.colKeys.map((k) => `<th>${esc(k)}</th>`).join('')}<th class="pv-tot">${T('Total general', 'Grand total')}</th></tr>`
        : `<tr><th class="pv-corner">${esc(res.rowField || '')}</th><th>${head}</th></tr>`;
      const body = res.rowKeys
        .map((rk, i) => {
          const label = rk === null ? T('Total', 'Total') : esc(rk);
          if (!res.colField) return `<tr><th>${label}</th><td>${f(res.rowTotals[i])}</td></tr>`;
          return `<tr><th>${label}</th>${res.cells[i].map((v) => `<td>${f(v)}</td>`).join('')}<td class="pv-tot">${f(res.rowTotals[i])}</td></tr>`;
        })
        .join('');
      const foot = res.rowField
        ? res.colField
          ? `<tr class="pv-total"><th>${T('Total general', 'Grand total')}</th>${res.colTotals.map((v) => `<td>${f(v)}</td>`).join('')}<td class="pv-tot">${f(res.grand)}</td></tr>`
          : `<tr class="pv-total"><th>${T('Total general', 'Grand total')}</th><td>${f(res.grand)}</td></tr>`
        : '';
      this.out.innerHTML = `<div class="pv-scroll"><table class="pv-table">${colHead}${body}${foot}</table></div>
        <p class="pv-foot muted">${res.count} ${T('registros incluidos', 'records included')}</p>`;
    }

    destroy() {
      document.removeEventListener('mousedown', this.onDocDown);
    }
  }

  AA.Pivot = { AGGS, emptySpec, fields, resolve, lookup, expect, aggregate };
  AA.PivotBuilder = PivotBuilder;
})();
