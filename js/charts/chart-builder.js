/*
 * Analyst Adventure — Editor visual de gráficos (estilo Tableau).
 * Panel de campos (dimensiones / medidas), estantes Columnas, Filas, Color y Filtros,
 * "Mostrarme" para elegir el tipo de marca, orden, etiquetas y título. Dibuja en SVG.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const Ch = AA.Chart;
  const T = (es, en) => AA.T(es, en);
  const esc = (s) => AA.escapeHtml(s);
  const SVGNS = 'http://www.w3.org/2000/svg';

  // Paleta categórica validada (orden fijo, apta para daltonismo; ver docs de visualización).
  const PALETTE = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];
  const INK = '#1d2130';
  const INK2 = '#5b6378';
  const GRID = '#e6e8ee';

  function fmt(n) {
    if (typeof n !== 'number' || !isFinite(n)) return '';
    const a = Math.abs(n);
    if (a >= 1e6) return (n / 1e6).toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'M';
    if (a >= 1e4) return (n / 1e3).toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'K';
    return n.toLocaleString('en-US', { maximumFractionDigits: a < 10 ? 2 : 1 });
  }
  function niceMax(max) {
    if (max <= 0) return 1;
    const pow = Math.pow(10, Math.floor(Math.log10(max)));
    const m = max / pow;
    const step = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
    return step * pow;
  }
  function ticks(min, max, n) {
    const out = [];
    for (let i = 0; i <= n; i++) out.push(min + ((max - min) * i) / n);
    return out;
  }
  function el(tag, attrs, parent) {
    const e = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  }
  function tip(node, text) {
    const t = document.createElementNS(SVGNS, 'title');
    t.textContent = text;
    node.appendChild(t);
  }
  // Barra con esquinas redondeadas solo en el extremo de datos.
  function barPath(x, y, w, h, horizontal) {
    const r = Math.min(4, (horizontal ? h : w) / 2, horizontal ? w : h);
    if (w <= 0 || h <= 0) return '';
    if (horizontal) return `M${x},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x} Z`;
    return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
  }

  // Dibujo de gráficos en SVG (lo usan el editor, los dashboards y las tablas dinámicas).
  // El color sigue a la entidad: el índice sale de TODOS los valores de la tabla completa,
  // así un filtro no repinta las categorías que quedan.
  class ChartRenderer {
    constructor(table) {
      this.table = table;
      this.fields = Ch.fields(table);
      this.colorIndex = {};
      this.spec = Ch.emptySpec();
    }

    colorFor(key, field) {
      if (!field) return PALETTE[0];
      if (!this.colorIndex[field]) {
        const f = this.fields.find((x) => x.name === field);
        const all = [...new Set(this.table.rows.map((row) => String(row[f.index])))];
        this.colorIndex[field] = Object.fromEntries(all.map((v, i) => [v, PALETTE[i % PALETTE.length]]));
      }
      return this.colorIndex[field][String(key)] || PALETTE[0];
    }

    // --- Dibujo
    // Dibuja `spec` dentro del contenedor c. opts.table: datos ya filtrados (por ej. el filtro
    // global de un dashboard); opts.noTitle: el título lo muestra quien contiene el gráfico.
    draw(c, spec, opts) {
      opts = opts || {};
      this.spec = spec;
      const res = Ch.resolve(spec, opts.table || this.table);
      c.innerHTML = '';
      if (res.empty || !res.ok) {
        c.innerHTML = `<div class="cb-empty">${res.empty ? opts.emptyText || T('Arrastrá una <b>dimensión</b> y una <b>medida</b> a Columnas y Filas para empezar.', 'Drag a <b>dimension</b> and a <b>measure</b> onto Columns and Rows to start.') : '⚠️ ' + esc(res.error)}</div>`;
        return;
      }
      const W = Math.max(320, c.clientWidth);
      const H = Math.max(240, c.clientHeight);
      const svg = el('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: 'cb-svg', role: 'img' });
      c.appendChild(svg);
      const title = opts.noTitle ? '' : String(spec.title || '').trim();
      let top = 14;
      if (title) {
        const t = el('text', { x: 16, y: 26, fill: INK, 'font-size': 16, 'font-weight': 700 }, svg);
        t.textContent = title;
        top = 44;
      }
      const legendKeys = res.kind === 'scatter' ? res.colorKeys : res.color ? res.series.map((x) => x.key) : res.mark === 'pie' ? res.categories : [];
      const legendField = res.kind === 'scatter' ? res.color : res.color || (res.mark === 'pie' ? res.dim : null);
      let right = 16;
      if (legendKeys.length) {
        right = Math.min(190, 40 + Math.max(...legendKeys.map((k) => String(k).length)) * 7);
        const lx = W - right + 8;
        el('text', { x: lx, y: top + 4, fill: INK2, 'font-size': 11, 'font-weight': 700 }, svg).textContent = legendField;
        legendKeys.forEach((k, i) => {
          el('rect', { x: lx, y: top + 14 + i * 20, width: 12, height: 12, rx: 3, fill: this.colorFor(k, legendField) }, svg);
          el('text', { x: lx + 18, y: top + 24 + i * 20, fill: INK, 'font-size': 12 }, svg).textContent = String(k);
        });
      }
      const box = { x: 0, y: top, w: W - right, h: H - top - 8 };
      if (res.kind === 'scatter') this.drawScatter(svg, res, box);
      else if (res.mark === 'pie') this.drawPie(svg, res, box);
      else if (res.mark === 'line') this.drawLine(svg, res, box);
      else this.drawBars(svg, res, box);
    }

    axisTitle(svg, text, x, y, rotate) {
      el('text', { x, y, fill: INK2, 'font-size': 11, 'text-anchor': 'middle', transform: rotate ? `rotate(-90 ${x} ${y})` : '' }, svg).textContent = text;
    }

    measureLabel(res) {
      return res.agg === 'COUNT' ? Ch.fieldLabel(Ch.COUNT_FIELD) : `${AA.L(Ch.AGGS[res.agg])} ${T('de', 'of')} ${res.measure}`;
    }

    drawBars(svg, res, box) {
      const stackTotals = res.categories.map((_, i) => res.series.reduce((a, s) => a + Math.max(0, s.values[i]), 0));
      const vmax = niceMax(Math.max(...stackTotals, 0));
      const n = res.categories.length;
      const labelsOn = this.spec.labels;
      if (res.orientation === 'v') {
        const longest = Math.max(...res.categories.map((c) => String(c).length));
        const rotate = n * Math.max(longest, 4) * 7 > box.w - 70;
        const m = { l: 64, r: 10, t: 12, b: rotate ? 70 : 40 };
        const pw = box.w - m.l - m.r;
        const ph = box.h - m.t - m.b;
        const ox = box.x + m.l;
        const oy = box.y + m.t;
        ticks(0, vmax, 4).forEach((v) => {
          const y = oy + ph - (v / vmax) * ph;
          el('line', { x1: ox, x2: ox + pw, y1: y, y2: y, stroke: GRID, 'stroke-width': 1 }, svg);
          el('text', { x: ox - 8, y: y + 4, fill: INK2, 'font-size': 11, 'text-anchor': 'end' }, svg).textContent = fmt(v);
        });
        const band = pw / n;
        const bw = Math.min(56, band * 0.66);
        res.categories.forEach((cat, i) => {
          let acc = 0;
          const cx = ox + band * i + band / 2;
          res.series.forEach((s, si) => {
            const v = Math.max(0, s.values[i]);
            if (!v) return;
            const h = (v / vmax) * ph;
            const y = oy + ph - ((acc + v) / vmax) * ph;
            const isTop = si === res.series.length - 1 || res.series.slice(si + 1).every((x) => !x.values[i]);
            const gap = acc > 0 ? 2 : 0;
            const node = el(isTop ? 'path' : 'rect', isTop ? { d: barPath(cx - bw / 2, y, bw, h - gap, false) } : { x: cx - bw / 2, y, width: bw, height: Math.max(0, h - gap) }, svg);
            node.setAttribute('fill', this.colorFor(s.key, res.color));
            node.setAttribute('class', 'cb-mark-shape');
            tip(node, `${cat}${res.color ? ' · ' + s.key : ''}: ${fmt(s.values[i])}`);
            acc += v;
          });
          if (labelsOn) el('text', { x: cx, y: oy + ph - (stackTotals[i] / vmax) * ph - 6, fill: INK, 'font-size': 11, 'text-anchor': 'middle', 'font-weight': 600 }, svg).textContent = fmt(res.totals[i]);
          const lab = el('text', { x: cx, y: oy + ph + 16, fill: INK, 'font-size': 11, 'text-anchor': rotate ? 'end' : 'middle', transform: rotate ? `rotate(-35 ${cx} ${oy + ph + 16})` : '' }, svg);
          lab.textContent = String(cat).length > 18 ? String(cat).slice(0, 17) + '…' : String(cat);
        });
        el('line', { x1: ox, x2: ox + pw, y1: oy + ph, y2: oy + ph, stroke: '#c9ced9', 'stroke-width': 1 }, svg);
        this.axisTitle(svg, this.measureLabel(res), box.x + 14, oy + ph / 2, true);
      } else {
        const longest = Math.max(...res.categories.map((c) => Math.min(20, String(c).length)));
        const m = { l: Math.min(170, 18 + longest * 7), r: 40, t: 8, b: 32 };
        const pw = box.w - m.l - m.r;
        const ph = box.h - m.t - m.b;
        const ox = box.x + m.l;
        const oy = box.y + m.t;
        ticks(0, vmax, 4).forEach((v) => {
          const x = ox + (v / vmax) * pw;
          el('line', { x1: x, x2: x, y1: oy, y2: oy + ph, stroke: GRID, 'stroke-width': 1 }, svg);
          el('text', { x, y: oy + ph + 16, fill: INK2, 'font-size': 11, 'text-anchor': 'middle' }, svg).textContent = fmt(v);
        });
        const band = ph / n;
        const bh = Math.min(30, band * 0.66);
        res.categories.forEach((cat, i) => {
          let acc = 0;
          const cy = oy + band * i + band / 2;
          res.series.forEach((s, si) => {
            const v = Math.max(0, s.values[i]);
            if (!v) return;
            const w = (v / vmax) * pw;
            const x = ox + (acc / vmax) * pw + (acc > 0 ? 2 : 0);
            const isEnd = si === res.series.length - 1 || res.series.slice(si + 1).every((q) => !q.values[i]);
            const node = el(isEnd ? 'path' : 'rect', isEnd ? { d: barPath(x, cy - bh / 2, w - (acc > 0 ? 2 : 0), bh, true) } : { x, y: cy - bh / 2, width: Math.max(0, w - (acc > 0 ? 2 : 0)), height: bh }, svg);
            node.setAttribute('fill', this.colorFor(s.key, res.color));
            node.setAttribute('class', 'cb-mark-shape');
            tip(node, `${cat}${res.color ? ' · ' + s.key : ''}: ${fmt(s.values[i])}`);
            acc += v;
          });
          if (labelsOn) el('text', { x: ox + (stackTotals[i] / vmax) * pw + 6, y: cy + 4, fill: INK, 'font-size': 11, 'font-weight': 600 }, svg).textContent = fmt(res.totals[i]);
          el('text', { x: ox - 8, y: cy + 4, fill: INK, 'font-size': 11, 'text-anchor': 'end' }, svg).textContent = String(cat).length > 20 ? String(cat).slice(0, 19) + '…' : String(cat);
        });
        el('line', { x1: ox, x2: ox, y1: oy, y2: oy + ph, stroke: '#c9ced9', 'stroke-width': 1 }, svg);
        this.axisTitle(svg, this.measureLabel(res), ox + pw / 2, box.y + box.h - 2, false);
      }
    }

    drawLine(svg, res, box) {
      const vmax = niceMax(Math.max(...res.series.flatMap((s) => s.values), 0));
      const n = res.categories.length;
      const m = { l: 64, r: 16, t: 12, b: 40 };
      const pw = box.w - m.l - m.r;
      const ph = box.h - m.t - m.b;
      const ox = box.x + m.l;
      const oy = box.y + m.t;
      ticks(0, vmax, 4).forEach((v) => {
        const y = oy + ph - (v / vmax) * ph;
        el('line', { x1: ox, x2: ox + pw, y1: y, y2: y, stroke: GRID, 'stroke-width': 1 }, svg);
        el('text', { x: ox - 8, y: y + 4, fill: INK2, 'font-size': 11, 'text-anchor': 'end' }, svg).textContent = fmt(v);
      });
      const xAt = (i) => ox + (n === 1 ? pw / 2 : (pw * i) / (n - 1));
      const yAt = (v) => oy + ph - (v / vmax) * ph;
      const every = Math.ceil(n / Math.max(1, Math.floor(pw / 48)));
      res.categories.forEach((cat, i) => {
        if (i % every === 0) el('text', { x: xAt(i), y: oy + ph + 16, fill: INK, 'font-size': 11, 'text-anchor': 'middle' }, svg).textContent = String(cat);
      });
      res.series.forEach((s) => {
        const color = this.colorFor(s.key, res.color);
        el('polyline', { points: s.values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' '), fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linejoin': 'round' }, svg);
        s.values.forEach((v, i) => {
          const dot = el('circle', { cx: xAt(i), cy: yAt(v), r: 4, fill: color, stroke: '#fff', 'stroke-width': 2, class: 'cb-mark-shape' }, svg);
          tip(dot, `${res.categories[i]}${res.color ? ' · ' + s.key : ''}: ${fmt(v)}`);
        });
        if (this.spec.labels) {
          const i = s.values.indexOf(Math.max(...s.values));
          el('text', { x: xAt(i), y: yAt(s.values[i]) - 10, fill: INK, 'font-size': 11, 'font-weight': 600, 'text-anchor': 'middle' }, svg).textContent = fmt(s.values[i]);
        }
      });
      el('line', { x1: ox, x2: ox + pw, y1: oy + ph, y2: oy + ph, stroke: '#c9ced9', 'stroke-width': 1 }, svg);
      this.axisTitle(svg, this.measureLabel(res), box.x + 14, oy + ph / 2, true);
    }

    drawPie(svg, res, box) {
      const total = res.totals.reduce((a, b) => a + Math.max(0, b), 0) || 1;
      const cx = box.x + box.w / 2;
      const cy = box.y + box.h / 2;
      const r = Math.max(40, Math.min(box.w, box.h) / 2 - 30);
      let a = -Math.PI / 2;
      res.categories.forEach((cat, i) => {
        const v = Math.max(0, res.totals[i]);
        const ang = (v / total) * Math.PI * 2;
        const x1 = cx + r * Math.cos(a);
        const y1 = cy + r * Math.sin(a);
        const x2 = cx + r * Math.cos(a + ang);
        const y2 = cy + r * Math.sin(a + ang);
        const path = ang >= Math.PI * 2 - 1e-6 ? `M${cx - r},${cy} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0` : `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${ang > Math.PI ? 1 : 0},1 ${x2},${y2} Z`;
        const node = el('path', { d: path, fill: this.colorFor(cat, res.dim), stroke: '#fff', 'stroke-width': 2, class: 'cb-mark-shape' }, svg);
        const pct = Math.round((v / total) * 1000) / 10;
        tip(node, `${cat}: ${fmt(v)} (${pct}%)`);
        if (pct >= 5) {
          const mid = a + ang / 2;
          el('text', { x: cx + (r + 16) * Math.cos(mid), y: cy + (r + 16) * Math.sin(mid) + 4, fill: INK, 'font-size': 12, 'font-weight': 600, 'text-anchor': Math.cos(mid) >= 0 ? 'start' : 'end' }, svg).textContent = `${pct}%`;
        }
        a += ang;
      });
      if (res.categories.length > 6) {
        el('text', { x: box.x + 16, y: box.y + box.h - 6, fill: '#a45d00', 'font-size': 12 }, svg).textContent = T('⚠ Más de 6 porciones: una torta así no se lee bien. Probá barras.', '⚠ More than 6 slices: a pie like this is hard to read. Try bars.');
      }
    }

    drawScatter(svg, res, box) {
      const xs = res.points.map((p) => p.x);
      const ys = res.points.map((p) => p.y);
      const xmax = niceMax(Math.max(...xs));
      const ymax = niceMax(Math.max(...ys));
      const m = { l: 64, r: 16, t: 12, b: 40 };
      const pw = box.w - m.l - m.r;
      const ph = box.h - m.t - m.b;
      const ox = box.x + m.l;
      const oy = box.y + m.t;
      ticks(0, ymax, 4).forEach((v) => {
        const y = oy + ph - (v / ymax) * ph;
        el('line', { x1: ox, x2: ox + pw, y1: y, y2: y, stroke: GRID }, svg);
        el('text', { x: ox - 8, y: y + 4, fill: INK2, 'font-size': 11, 'text-anchor': 'end' }, svg).textContent = fmt(v);
      });
      ticks(0, xmax, 4).forEach((v) => {
        const x = ox + (v / xmax) * pw;
        el('text', { x, y: oy + ph + 16, fill: INK2, 'font-size': 11, 'text-anchor': 'middle' }, svg).textContent = fmt(v);
      });
      res.points.forEach((p) => {
        const dot = el('circle', { cx: ox + (p.x / xmax) * pw, cy: oy + ph - (p.y / ymax) * ph, r: 5, fill: this.colorFor(p.color, res.color), stroke: '#fff', 'stroke-width': 2, class: 'cb-mark-shape' }, svg);
        tip(dot, `${p.label ? p.label + ' · ' : ''}${res.x}: ${fmt(p.x)} · ${res.y}: ${fmt(p.y)}`);
      });
      el('line', { x1: ox, x2: ox + pw, y1: oy + ph, y2: oy + ph, stroke: '#c9ced9' }, svg);
      el('line', { x1: ox, x2: ox, y1: oy, y2: oy + ph, stroke: '#c9ced9' }, svg);
      this.axisTitle(svg, res.x, ox + pw / 2, box.y + box.h - 2, false);
      this.axisTitle(svg, res.y, box.x + 14, oy + ph / 2, true);
    }

  }

  class ChartBuilder {
    constructor(root, table, spec, opts) {
      this.root = root;
      this.table = table;
      this.spec = Object.assign(Ch.emptySpec(), spec || {});
      this.opts = opts || {};
      this.fields = Ch.fields(table);
      this.renderer = new ChartRenderer(table);
      this.build();
      this.render();
      this.ro = new ResizeObserver(() => this.draw());
      this.ro.observe(this.canvas);
    }

    build() {
      const dims = this.fields.filter((f) => f.role === 'dimension');
      const meas = this.fields.filter((f) => f.role === 'measure');
      const pill = (f) =>
        `<button class="cb-pill ${f.role}" draggable="true" data-field="${esc(f.name)}" title="${T('Arrastrá a un estante o hacé clic', 'Drag to a shelf or click')}">${f.role === 'dimension' ? (f.time ? '📅' : 'Abc') : '#'} ${esc(Ch.fieldLabel(f.name))}</button>`;
      const shelf = (key, label, hint) => `
        <div class="cb-shelf" data-shelf="${key}">
          <span class="cb-shelf-label">${label}</span>
          <div class="cb-drop" data-drop="${key}" data-hint="${hint}"><span class="cb-drop-hint">${hint}</span></div>
        </div>`;
      const markBtn = (m) => `<button class="cb-mark" data-mark="${m}"><span class="cb-mark-ico">${{ auto: '✦', bar: '▮▮', line: '⟋', pie: '◔', scatter: '⁘' }[m]}</span>${AA.L(Ch.MARKS[m])}</button>`;
      this.root.innerHTML = `
        <div class="cb">
          <aside class="cb-fields">
            <h4>${T('Dimensiones', 'Dimensions')}</h4>
            <div class="cb-list">${dims.map(pill).join('')}</div>
            <h4>${T('Medidas', 'Measures')}</h4>
            <div class="cb-list">${meas.map(pill).join('')}</div>
            <p class="cb-help">${T('Las <b>dimensiones</b> son categorías (agrupan). Las <b>medidas</b> son números (se suman, promedian…). Arrastralas a los estantes.', '<b>Dimensions</b> are categories (they group). <b>Measures</b> are numbers (summed, averaged…). Drag them onto the shelves.')}</p>
          </aside>
          <section class="cb-main">
            <div class="cb-shelves">
              ${shelf('columns', T('Columnas', 'Columns'), T('eje horizontal', 'horizontal axis'))}
              ${shelf('rows', T('Filas', 'Rows'), T('eje vertical', 'vertical axis'))}
              <button class="cb-swap" title="${T('Intercambiar filas y columnas', 'Swap rows and columns')}">⇅</button>
              ${shelf('color', T('Color', 'Color'), T('una dimensión (opcional)', 'a dimension (optional)'))}
              ${shelf('filter', T('Filtros', 'Filters'), T('una dimensión (opcional)', 'a dimension (optional)'))}
            </div>
            <div class="cb-filter-values"></div>
            <div class="cb-toolbar">
              <span class="cb-tool-label">${T('Mostrarme', 'Show Me')}</span>
              <div class="cb-marks">${['auto', 'bar', 'line', 'pie', 'scatter'].map(markBtn).join('')}</div>
              <label class="cb-opt">${T('Ordenar', 'Sort')}
                <select data-opt="sort">
                  <option value="none">${T('Orden original', 'Original order')}</option>
                  <option value="desc">${T('Mayor a menor', 'Largest first')}</option>
                  <option value="asc">${T('Menor a mayor', 'Smallest first')}</option>
                </select>
              </label>
              <label class="cb-opt"><input type="checkbox" data-opt="labels"> ${T('Etiquetas', 'Labels')}</label>
              <button class="cb-clear" title="${T('Empezar de nuevo', 'Start over')}">⟲</button>
            </div>
            <input class="cb-title" maxlength="90" placeholder="${T('Título: contá la conclusión (ej: "El Sur lidera las ventas")', 'Title: state the conclusion (e.g. "The South leads sales")')}">
            <div class="cb-canvas"></div>
          </section>
        </div>
        <div class="cb-menu hidden"></div>`;
      this.canvas = this.root.querySelector('.cb-canvas');
      this.menu = this.root.querySelector('.cb-menu');
      this.titleInput = this.root.querySelector('.cb-title');
      this.bind();
    }

    bind() {
      const r = this.root;
      r.querySelectorAll('.cb-fields .cb-pill').forEach((p) => {
        p.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', p.dataset.field);
          e.dataTransfer.effectAllowed = 'copy';
        });
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
      r.querySelector('.cb-swap').addEventListener('click', () => {
        [this.spec.columns, this.spec.rows] = [this.spec.rows, this.spec.columns];
        this.changed();
      });
      r.querySelector('.cb-clear').addEventListener('click', () => {
        const title = this.spec.title;
        this.spec = Object.assign(Ch.emptySpec(), { title });
        this.changed();
      });
      r.querySelectorAll('[data-mark]').forEach((b) =>
        b.addEventListener('click', () => {
          if (b.disabled) return;
          this.spec.mark = b.dataset.mark;
          this.changed();
        })
      );
      r.querySelector('[data-opt="sort"]').addEventListener('change', (e) => {
        this.spec.sort = e.target.value;
        this.changed();
      });
      r.querySelector('[data-opt="labels"]').addEventListener('change', (e) => {
        this.spec.labels = e.target.checked;
        this.changed();
      });
      this.titleInput.addEventListener('input', () => {
        this.spec.title = this.titleInput.value;
        this.changed(true);
      });
      this.onDocDown = (e) => {
        if (!this.menu.contains(e.target) && !e.target.closest('.cb-fields .cb-pill')) this.menu.classList.add('hidden');
      };
      document.addEventListener('mousedown', this.onDocDown);
    }

    // Menú al hacer clic en un campo: a qué estante mandarlo.
    openMenu(name, anchor) {
      const f = this.fields.find((x) => x.name === name);
      const opts = [['columns', T('Columnas', 'Columns')], ['rows', T('Filas', 'Rows')]];
      if (f.role === 'dimension') opts.push(['color', T('Color', 'Color')], ['filter', T('Filtros', 'Filters')]);
      this.menu.innerHTML = `<div class="cb-menu-title">${esc(Ch.fieldLabel(name))} →</div>` + opts.map(([k, l]) => `<button data-to="${k}">${l}</button>`).join('');
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

    assign(shelf, name) {
      const f = this.fields.find((x) => x.name === name);
      if (!f) return;
      if ((shelf === 'color' || shelf === 'filter') && f.role !== 'dimension') {
        if (this.opts.onToast) this.opts.onToast(T('Color y Filtros aceptan dimensiones (categorías), no medidas.', 'Color and Filters take dimensions (categories), not measures.'));
        AA.Audio.play('error');
        return;
      }
      if (shelf === 'columns' || shelf === 'rows') this.spec[shelf] = f.role === 'measure' ? { field: name, agg: f.count ? 'COUNT' : 'SUM' } : { field: name };
      else if (shelf === 'color') this.spec.color = name;
      else if (shelf === 'filter') {
        const values = [...new Set(this.table.rows.map((row) => String(row[f.index])))];
        this.spec.filter = { field: name, values };
      }
      AA.Audio.play('select');
      this.changed();
    }

    changed(onlyTitle) {
      if (!onlyTitle) this.render();
      else this.draw();
      if (this.opts.onChange) this.opts.onChange(this.spec);
    }

    // --- Estantes, filtros y botones
    render() {
      const s = this.spec;
      const shelfPill = (key) => {
        const it = key === 'color' ? (s.color ? { field: s.color } : null) : key === 'filter' ? (s.filter ? { field: s.filter.field } : null) : s[key];
        const zone = this.root.querySelector(`[data-drop="${key}"]`);
        if (!it) {
          zone.classList.remove('filled');
          zone.innerHTML = `<span class="cb-drop-hint">${zone.dataset.hint}</span>`;
          return;
        }
        const f = this.fields.find((x) => x.name === it.field);
        zone.classList.add('filled');
        const agg =
          f.role === 'measure' && !f.count
            ? `<select class="cb-agg" data-agg="${key}">${Object.keys(Ch.AGGS)
                .filter((a) => a !== 'COUNT')
                .map((a) => `<option value="${a}" ${it.agg === a ? 'selected' : ''}>${AA.L(Ch.AGGS[a])}</option>`)
                .join('')}</select>`
            : '';
        zone.innerHTML = `<span class="cb-pill on ${f.role}">${agg}${esc(Ch.fieldLabel(f.name))}<button class="cb-x" data-remove="${key}" title="${T('Quitar', 'Remove')}">×</button></span>`;
      };
      ['columns', 'rows', 'color', 'filter'].forEach(shelfPill);
      this.root.querySelectorAll('[data-remove]').forEach((b) =>
        b.addEventListener('click', () => {
          const k = b.dataset.remove;
          if (k === 'color') s.color = null;
          else if (k === 'filter') s.filter = null;
          else s[k] = null;
          this.changed();
        })
      );
      this.root.querySelectorAll('[data-agg]').forEach((sel) =>
        sel.addEventListener('change', () => {
          s[sel.dataset.agg].agg = sel.value;
          this.changed();
        })
      );
      // Valores del filtro.
      const fv = this.root.querySelector('.cb-filter-values');
      if (s.filter) {
        const f = this.fields.find((x) => x.name === s.filter.field);
        const all = [...new Set(this.table.rows.map((row) => String(row[f.index])))];
        fv.innerHTML = `<span>${T('Mostrar', 'Show')} <b>${esc(f.name)}</b>:</span>` + all.map((v) => `<label><input type="checkbox" value="${esc(v)}" ${s.filter.values.includes(v) ? 'checked' : ''}> ${esc(v)}</label>`).join('');
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
      // Mostrarme: recomendado / posible / no aplica.
      const rec = Ch.recommend(s, this.table);
      this.root.querySelectorAll('[data-mark]').forEach((b) => {
        const m = b.dataset.mark;
        const st = m === 'auto' ? 'ok' : rec[m];
        b.classList.toggle('on', s.mark === m);
        b.classList.toggle('best', st === 'best');
        b.disabled = st === 'no' && s.mark !== m;
        b.title = st === 'best' ? T('Recomendado para estos campos', 'Recommended for these fields') : st === 'no' ? T('No aplica a estos campos', "Doesn't fit these fields") : '';
      });
      this.root.querySelector('[data-opt="sort"]').value = s.sort;
      this.root.querySelector('[data-opt="labels"]').checked = !!s.labels;
      if (this.titleInput.value !== s.title) this.titleInput.value = s.title;
      this.draw();
    }

    draw() {
      this.renderer.draw(this.canvas, this.spec);
    }

    destroy() {
      if (this.ro) this.ro.disconnect();
      document.removeEventListener('mousedown', this.onDocDown);
    }
  }

  AA.ChartBuilder = ChartBuilder;
  AA.ChartRenderer = ChartRenderer;
  AA.ChartFmt = fmt;
  AA.CHART_PALETTE = PALETTE;
})();
