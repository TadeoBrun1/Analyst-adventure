/*
 * Analyst Adventure — Dashboards (versión simple de Tableau / Power BI / Looker Studio).
 *
 * Un dashboard junta en una pantalla:
 *   - KPIs: un número grande con su nombre (Suma, Promedio, Recuento… de una medida).
 *   - Gráficos: cada uno se arma con el mismo editor de gráficos del Nivel 6.
 *   - Un filtro global que se aplica a todos los elementos a la vez.
 *
 * spec = { title, filter: { field, values } | null, tiles: [
 *   { id, kind: 'kpi', title, field, agg, format: 'num' | 'money' | 'pct' },
 *   { id, kind: 'chart', chart: <spec del editor de gráficos> } ] }
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const T = (es, en) => (AA.T ? AA.T(es, en) : es);
  const L = (o) => (AA.L ? AA.L(o) : o.es);
  const esc = (s) => (AA.escapeHtml ? AA.escapeHtml(s) : String(s));
  const Ch = () => AA.Chart;
  const norm = (s) =>
    String(s === null || s === undefined ? '' : s)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();
  const MAX_TILES = 8;

  function emptySpec() {
    return { title: '', filter: null, tiles: [] };
  }

  function filteredTable(spec, table) {
    if (!spec.filter || !spec.filter.field) return table;
    const i = table.headers.indexOf(spec.filter.field);
    if (i < 0) return table;
    const keep = new Set((spec.filter.values || []).map(String));
    return Object.assign({}, table, { rows: table.rows.filter((r) => keep.has(String(r[i]))) });
  }

  function kpiValue(tile, table) {
    if (!tile.field) return null;
    const f = Ch().fields(table).find((x) => x.name === tile.field);
    if (!f) return null;
    const agg = f.count ? 'COUNT' : tile.agg || 'SUM';
    const vals = table.rows.map((r) => (f.count ? 1 : r[f.index]));
    if (!vals.length) return null;
    return Ch().aggregate(vals, agg);
  }

  function fmtKpi(v, format) {
    if (v === null || v === undefined || !isFinite(v)) return '—';
    if (format === 'pct') return (v * 100).toLocaleString('en-US', { maximumFractionDigits: 1 }) + '%';
    const a = Math.abs(v);
    let s;
    if (a >= 1e6) s = (v / 1e6).toLocaleString('en-US', { maximumFractionDigits: 2 }) + 'M';
    else if (a >= 1e4) s = (v / 1e3).toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'K';
    else s = v.toLocaleString('en-US', { maximumFractionDigits: a < 100 ? 2 : 0 });
    return (format === 'money' ? '$' : '') + s;
  }

  // ---------------------------------------------------------------------------
  // Validadores: check(S) con S.dash = { spec, table }
  // ---------------------------------------------------------------------------
  const tilesOf = (S, kind) => (S.dash && S.dash.spec ? S.dash.spec.tiles.filter((t) => t.kind === kind) : []);

  // Un KPI de cierta medida y agregación.
  function hasKpi(opts) {
    return (S) => {
      const kpis = tilesOf(S, 'kpi').filter((t) => t.field);
      if (!kpis.length) return false;
      const same = kpis.filter((t) => t.field === opts.field);
      if (!same.length) return false;
      const ok = same.find((t) => !opts.aggs || opts.aggs.includes(Ch().fields(S.dash.table).find((f) => f.name === t.field).count ? 'COUNT' : t.agg));
      if (!ok) return T(`Hay un KPI de ${Ch().fieldLabel(opts.field)}, pero revisá cómo se resume: ${opts.aggs.map((a) => L(Ch().AGGS[a])).join(' o ')}.`, `There is a ${Ch().fieldLabel(opts.field)} KPI, but check how it is summarized: ${opts.aggs.map((a) => L(Ch().AGGS[a])).join(' or ')}.`);
      if (opts.titleIncludes && !opts.titleIncludes.some((w) => norm(ok.title).includes(norm(w)))) {
        return T(`Poné un nombre claro al KPI de ${Ch().fieldLabel(opts.field)} (por ejemplo "${opts.titleIncludes[0]}").`, `Give the ${Ch().fieldLabel(opts.field)} KPI a clear name (for example "${opts.titleIncludes[0]}").`);
      }
      return true;
    };
  }

  // Un gráfico que cumpla las reglas del validador de gráficos (Chart.expect).
  function hasChart(opts) {
    const check = Ch().expect(opts);
    return (S) => {
      const charts = tilesOf(S, 'chart');
      let note = false;
      for (const t of charts) {
        const res = check({ spec: t.chart, table: S.dash.table });
        if (res === true) return true;
        const r = Ch().resolve(t.chart, S.dash.table);
        // La nota sirve si el gráfico "apunta" al pedido (misma dimensión o mismas medidas).
        if (typeof res === 'string' && r.ok && ((opts.dim && r.dim === opts.dim) || (opts.x && r.kind === 'scatter'))) note = res;
      }
      return note;
    };
  }

  function globalFilter(field, values) {
    return (S) => {
      const f = S.dash && S.dash.spec.filter;
      if (!f || f.field !== field) return false;
      if (values) {
        const want = values.map(norm).sort().join('|');
        if ((f.values || []).map(norm).sort().join('|') !== want) return T(`El filtro global de ${field} está, pero tiene que quedar en: ${values.join(', ')}.`, `The ${field} global filter is there, but it must be set to: ${values.join(', ')}.`);
      }
      return true;
    };
  }

  // Un elemento existente (por id) tiene que cumplir un validador (para arreglar dashboards ajenos).
  function tile(id, check) {
    return (S) => {
      const t = S.dash && S.dash.spec.tiles.find((x) => x.id === id);
      if (!t) return T('Ese elemento ya no está en el dashboard: no hacía falta borrarlo, solo arreglarlo. Podés empezar de nuevo con ⟲.', 'That element is no longer on the dashboard: it only needed fixing, not deleting. You can start over with ⟲.');
      return t.kind === 'chart' ? check({ spec: t.chart, table: S.dash.table }) : check(t, S.dash.table);
    };
  }

  // Validador para un KPI puntual (se usa con tile()).
  function kpiIs(opts) {
    return (t, table) => {
      const f = Ch().fields(table).find((x) => x.name === t.field);
      if (!f || t.field !== opts.field) return T(`Este KPI tiene que mostrar ${Ch().fieldLabel(opts.field)}.`, `This KPI must show ${Ch().fieldLabel(opts.field)}.`);
      const agg = f.count ? 'COUNT' : t.agg;
      if (opts.aggs && !opts.aggs.includes(agg)) return T(`Revisá la agregación del KPI "${t.title}": tiene que ser ${opts.aggs.map((a) => L(Ch().AGGS[a])).join(' o ')}.`, `Check the aggregation of the "${t.title}" KPI: it must be ${opts.aggs.map((a) => L(Ch().AGGS[a])).join(' or ')}.`);
      if (opts.format && t.format !== opts.format) return T('Revisá el formato del KPI.', 'Check the KPI format.');
      return true;
    };
  }

  function tileCount(min, max) {
    return (S) => {
      const n = S.dash ? S.dash.spec.tiles.length : 0;
      if (n < min) return false;
      if (max && n > max) return T(`Un dashboard con ${n} elementos ya es ruido: dejá ${max} como máximo, los que respondan al pedido.`, `A dashboard with ${n} elements is noise: keep ${max} at most, the ones that answer the request.`);
      return true;
    };
  }

  // ---------------------------------------------------------------------------
  // Editor visual
  // ---------------------------------------------------------------------------
  let seq = 0;
  const newId = () => 't' + Date.now().toString(36) + (seq++).toString(36);

  class DashboardBuilder {
    constructor(root, table, spec, opts) {
      this.root = root;
      this.table = table;
      this.spec = JSON.parse(JSON.stringify(Object.assign(emptySpec(), spec || {})));
      this.opts = opts || {};
      this.fields = Ch().fields(table);
      this.renderer = new AA.ChartRenderer(table);
      this.editing = null;
      this.build();
      this.render();
      this.ro = new ResizeObserver(() => this.drawCharts());
      this.ro.observe(this.grid);
    }

    build() {
      const dims = this.fields.filter((f) => f.role === 'dimension');
      this.root.innerHTML = `
        <div class="db">
          <div class="db-bar">
            <input class="db-title" maxlength="70" placeholder="${T('Título del dashboard', 'Dashboard title')}">
            <label class="cb-opt">🔎 ${T('Filtro global', 'Global filter')}
              <select data-el="ffield"><option value="">${T('Sin filtro', 'No filter')}</option>${dims.map((f) => `<option value="${esc(f.name)}">${esc(f.name)}</option>`).join('')}</select>
            </label>
            <div class="spacer"></div>
            <button class="btn btn-sm" data-add="kpi">＋ KPI</button>
            <button class="btn btn-sm" data-add="chart">＋ ${T('Gráfico', 'Chart')}</button>
            ${this.opts.initial ? `<button class="btn btn-sm btn-ghost" data-act="reset" title="${T('Volver al dashboard original', 'Back to the original dashboard')}">⟲</button>` : ''}
          </div>
          <div class="db-fvals hidden"></div>
          <div class="db-grid"></div>
          <div class="db-editor hidden">
            <div class="db-editor-bar"><b data-el="edtitle"></b><div class="spacer"></div><button class="btn btn-primary btn-sm" data-act="done">✔ ${T('Listo, volver al dashboard', 'Done, back to the dashboard')}</button></div>
            <div class="db-editor-host"></div>
          </div>
        </div>`;
      this.grid = this.root.querySelector('.db-grid');
      this.editor = this.root.querySelector('.db-editor');
      this.titleInput = this.root.querySelector('.db-title');
      this.titleInput.addEventListener('input', () => {
        this.spec.title = this.titleInput.value;
        this.emit();
      });
      this.titleInput.addEventListener('keydown', (e) => e.stopPropagation());
      this.root.querySelector('[data-el="ffield"]').addEventListener('change', (e) => {
        const name = e.target.value;
        if (!name) this.spec.filter = null;
        else {
          const f = this.fields.find((x) => x.name === name);
          this.spec.filter = { field: name, values: [...new Set(this.table.rows.map((r) => String(r[f.index])))] };
        }
        AA.Audio.play('select');
        this.changed();
      });
      this.root.querySelectorAll('[data-add]').forEach((b) =>
        b.addEventListener('click', () => {
          if (this.spec.tiles.length >= MAX_TILES) {
            if (this.opts.onToast) this.opts.onToast(T(`Máximo ${MAX_TILES} elementos: un dashboard útil es corto.`, `Maximum ${MAX_TILES} elements: a useful dashboard is short.`));
            AA.Audio.play('error');
            return;
          }
          const meas = this.fields.find((f) => f.role === 'measure' && !f.count);
          const t = b.dataset.add === 'kpi'
            ? { id: newId(), kind: 'kpi', title: '', field: meas ? meas.name : Ch().COUNT_FIELD, agg: meas ? 'SUM' : 'COUNT', format: meas && (this.opts.money || []).includes(meas.name) ? 'money' : 'num' }
            : { id: newId(), kind: 'chart', chart: Ch().emptySpec() };
          this.spec.tiles.push(t);
          AA.Audio.play('select');
          if (t.kind === 'chart') this.openEditor(t);
          else this.editKpi = t.id;
          this.changed();
        })
      );
      const reset = this.root.querySelector('[data-act="reset"]');
      if (reset) {
        reset.addEventListener('click', () => {
          this.spec = JSON.parse(JSON.stringify(this.opts.initial));
          AA.Audio.play('back');
          this.changed();
        });
      }
      this.root.querySelector('[data-act="done"]').addEventListener('click', () => this.closeEditor());
    }

    emit() {
      if (this.opts.onChange) this.opts.onChange(this.spec);
    }
    changed() {
      this.render();
      this.emit();
    }

    render() {
      const s = this.spec;
      if (this.titleInput.value !== (s.title || '')) this.titleInput.value = s.title || '';
      this.root.querySelector('[data-el="ffield"]').value = s.filter ? s.filter.field : '';
      const fv = this.root.querySelector('.db-fvals');
      if (s.filter) {
        const f = this.fields.find((x) => x.name === s.filter.field);
        const all = [...new Set(this.table.rows.map((r) => String(r[f.index])))];
        fv.innerHTML = `<span>${T('Mostrar', 'Show')} <b>${esc(f.name)}</b>:</span>` +
          `<button class="db-chip-all" data-all>${T('Todos', 'All')}</button>` +
          all.map((v) => `<label class="db-chip ${s.filter.values.includes(v) ? 'on' : ''}"><input type="checkbox" value="${esc(v)}" ${s.filter.values.includes(v) ? 'checked' : ''}> ${esc(v)}</label>`).join('');
        fv.querySelectorAll('input').forEach((cb) =>
          cb.addEventListener('change', () => {
            s.filter.values = [...fv.querySelectorAll('input:checked')].map((x) => x.value);
            this.changed();
          })
        );
        fv.querySelector('[data-all]').addEventListener('click', () => {
          s.filter.values = all;
          this.changed();
        });
        fv.classList.remove('hidden');
      } else fv.classList.add('hidden');

      const ft = filteredTable(s, this.table);
      if (!s.tiles.length) {
        this.grid.innerHTML = `<div class="cb-empty db-empty"><span>${T('Dashboard vacío. Agregá <b>KPIs</b> (los números clave) y <b>gráficos</b> con los botones de arriba.', 'Empty dashboard. Add <b>KPIs</b> (the key numbers) and <b>charts</b> with the buttons above.')}</span></div>`;
        return;
      }
      const meas = this.fields.filter((f) => f.role === 'measure');
      this.grid.innerHTML = s.tiles
        .map((t) => {
          const tools = `<div class="db-tools"><button data-edit="${t.id}" title="${T('Editar', 'Edit')}">✏️</button><button data-del="${t.id}" title="${T('Quitar', 'Remove')}">🗑</button></div>`;
          if (t.kind === 'kpi') {
            if (this.editKpi === t.id) {
              return `<div class="db-tile kpi editing" data-tile="${t.id}">
                <input data-k="title" maxlength="40" value="${esc(t.title)}" placeholder="${T('Nombre del KPI', 'KPI name')}">
                <select data-k="agg">${Object.keys(Ch().AGGS).map((a) => `<option value="${a}" ${t.agg === a ? 'selected' : ''}>${L(Ch().AGGS[a])}</option>`).join('')}</select>
                <select data-k="field">${meas.map((f) => `<option value="${esc(f.name)}" ${t.field === f.name ? 'selected' : ''}>${esc(Ch().fieldLabel(f.name))}</option>`).join('')}</select>
                <select data-k="format"><option value="num" ${t.format === 'num' ? 'selected' : ''}>123</option><option value="money" ${t.format === 'money' ? 'selected' : ''}>$</option><option value="pct" ${t.format === 'pct' ? 'selected' : ''}>%</option></select>
                <button class="btn btn-primary btn-sm" data-kdone="${t.id}">✔</button>
              </div>`;
            }
            const f = this.fields.find((x) => x.name === t.field);
            const agg = f && f.count ? 'COUNT' : t.agg;
            const sub = f ? (f.count ? Ch().fieldLabel(f.name) : `${L(Ch().AGGS[agg])} ${T('de', 'of')} ${f.name}`) : '';
            return `<div class="db-tile kpi" data-tile="${t.id}">${tools}
              <div class="db-kpi-label">${esc(t.title || T('KPI sin nombre', 'Unnamed KPI'))}</div>
              <div class="db-kpi-value">${fmtKpi(kpiValue(t, ft), t.format)}</div>
              <div class="db-kpi-sub muted">${esc(sub)}</div>
            </div>`;
          }
          return `<div class="db-tile chart" data-tile="${t.id}">${tools}
            <div class="db-chart-title">${esc(t.chart.title || T('Gráfico sin título', 'Untitled chart'))}</div>
            <div class="db-chart" data-chart="${t.id}"></div>
          </div>`;
        })
        .join('');
      this.grid.querySelectorAll('[data-del]').forEach((b) =>
        b.addEventListener('click', () => {
          s.tiles = s.tiles.filter((t) => t.id !== b.dataset.del);
          AA.Audio.play('back');
          this.changed();
        })
      );
      this.grid.querySelectorAll('[data-edit]').forEach((b) =>
        b.addEventListener('click', () => {
          const t = s.tiles.find((x) => x.id === b.dataset.edit);
          AA.Audio.play('select');
          if (t.kind === 'chart') this.openEditor(t);
          else {
            this.editKpi = t.id;
            this.render();
          }
        })
      );
      const ed = this.grid.querySelector('.db-tile.kpi.editing');
      if (ed) {
        const t = s.tiles.find((x) => x.id === ed.dataset.tile);
        ed.querySelectorAll('[data-k]').forEach((inp) => {
          inp.addEventListener('keydown', (e) => e.stopPropagation());
          inp.addEventListener(inp.tagName === 'INPUT' ? 'input' : 'change', () => {
            t[inp.dataset.k] = inp.value;
            if (inp.dataset.k === 'field' && (this.opts.money || []).includes(inp.value)) t.format = 'money';
            this.emit();
          });
        });
        ed.querySelector('[data-kdone]').addEventListener('click', () => {
          this.editKpi = null;
          AA.Audio.play('select');
          this.render();
        });
      }
      this.drawCharts();
    }

    drawCharts() {
      const ft = filteredTable(this.spec, this.table);
      this.grid.querySelectorAll('[data-chart]').forEach((host) => {
        const t = this.spec.tiles.find((x) => x.id === host.dataset.chart);
        if (t) this.renderer.draw(host, t.chart, { table: ft, noTitle: true, emptyText: T('Gráfico vacío: tocá ✏️ para armarlo.', 'Empty chart: click ✏️ to build it.') });
      });
    }

    openEditor(t) {
      this.editing = t.id;
      this.editor.classList.remove('hidden');
      this.grid.classList.add('hidden');
      this.root.querySelector('[data-el="edtitle"]').textContent = T('Editando gráfico del dashboard', 'Editing dashboard chart');
      const host = this.root.querySelector('.db-editor-host');
      if (this.builder) this.builder.destroy();
      this.builder = new AA.ChartBuilder(host, this.table, t.chart, {
        onChange: (spec) => {
          t.chart = JSON.parse(JSON.stringify(spec));
          this.emit();
        },
        onToast: this.opts.onToast,
      });
    }

    closeEditor() {
      if (this.builder) this.builder.destroy();
      this.builder = null;
      this.editing = null;
      this.editor.classList.add('hidden');
      this.grid.classList.remove('hidden');
      AA.Audio.play('select');
      this.render();
    }

    destroy() {
      if (this.ro) this.ro.disconnect();
      if (this.builder) this.builder.destroy();
    }
  }

  AA.Dash = { emptySpec, filteredTable, kpiValue, fmtKpi, hasKpi, hasChart, globalFilter, tile, kpiIs, tileCount, newId, MAX_TILES };
  AA.DashboardBuilder = DashboardBuilder;
})();
