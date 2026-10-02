/*
 * Analyst Adventure — Modelo del editor de gráficos (estilo Tableau, simplificado).
 *
 * Conceptos que se llevan tal cual a Tableau / Power BI:
 *   - Campos: DIMENSIONES (categorías: región, mes…) y MEDIDAS (números que se agregan: ventas…).
 *   - Estantes: COLUMNAS y FILAS (qué va en cada eje), COLOR y FILTROS.
 *   - Marca: barras, líneas, torta o dispersión ("Automático" elige como Tableau).
 *   - Agregación de cada medida: Suma, Promedio, Recuento, Mínimo, Máximo.
 *
 * spec = { mark, columns, rows, color, filter, sort, title, labels }
 *   columns / rows: null | { field, agg? }      (una sola píldora por estante)
 *   color: null | nombreDeDimensión
 *   filter: null | { field, values: [...] }      (valores incluidos)
 *   sort: 'none' | 'desc' | 'asc'
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const T = (es, en) => (AA.T ? AA.T(es, en) : es);

  const COUNT_FIELD = '__count';
  const AGGS = {
    SUM: { es: 'Suma', en: 'Sum' },
    AVG: { es: 'Promedio', en: 'Average' },
    COUNT: { es: 'Recuento', en: 'Count' },
    MIN: { es: 'Mínimo', en: 'Minimum' },
    MAX: { es: 'Máximo', en: 'Maximum' },
  };
  const MARKS = {
    auto: { es: 'Automático', en: 'Automatic' },
    bar: { es: 'Barras', en: 'Bars' },
    line: { es: 'Líneas', en: 'Lines' },
    pie: { es: 'Torta', en: 'Pie' },
    scatter: { es: 'Dispersión', en: 'Scatter' },
  };
  const L = (o) => (AA.L ? AA.L(o) : o.es);
  const norm = (s) =>
    String(s === null || s === undefined ? '' : s)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();

  function emptySpec() {
    return { mark: 'auto', columns: null, rows: null, color: null, filter: null, sort: 'none', title: '', labels: false };
  }

  // Campos de una tabla { headers, rows, time: [nombres de dimensiones temporales] }.
  function fields(table) {
    const out = table.headers.map((name, i) => {
      const vals = table.rows.map((r) => r[i]).filter((v) => v !== null && v !== undefined && v !== '');
      const numeric = vals.length > 0 && vals.every((v) => typeof v === 'number');
      return { name, index: i, role: numeric ? 'measure' : 'dimension', time: (table.time || []).includes(name) };
    });
    out.push({ name: COUNT_FIELD, index: -1, role: 'measure', count: true });
    return out;
  }
  const fieldLabel = (name) => (name === COUNT_FIELD ? T('Cantidad de registros', 'Number of records') : name);
  const fieldByName = (table, name) => fields(table).find((f) => f.name === name) || null;

  function aggregate(values, agg) {
    const nums = values.filter((v) => typeof v === 'number');
    switch (agg) {
      case 'COUNT':
        return values.length;
      case 'AVG':
        return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      case 'MIN':
        return nums.length ? Math.min(...nums) : 0;
      case 'MAX':
        return nums.length ? Math.max(...nums) : 0;
      default:
        return nums.reduce((a, b) => a + b, 0);
    }
  }

  // Interpreta la especificación y calcula los datos a dibujar.
  function resolve(spec, table) {
    const fs = fields(table);
    const get = (item) => (item ? fs.find((f) => f.name === item.field) : null);
    const c = get(spec.columns);
    const r = get(spec.rows);
    const base = { ok: false, spec };
    if (!c && !r) return Object.assign(base, { empty: true });
    if (!c || !r) {
      return Object.assign(base, { error: T('Falta un campo: poné una dimensión en un estante y una medida en el otro.', 'A field is missing: put a dimension on one shelf and a measure on the other.') });
    }
    // Filas filtradas.
    let rows = table.rows;
    if (spec.filter && spec.filter.field) {
      const ff = fs.find((f) => f.name === spec.filter.field);
      if (ff && ff.role === 'dimension') {
        const keep = new Set((spec.filter.values || []).map(String));
        rows = rows.filter((row) => keep.has(String(row[ff.index])));
      }
    }
    const valueOf = (f, row) => (f.count ? 1 : row[f.index]);

    // Dos medidas → dispersión (un punto por registro).
    if (c.role === 'measure' && r.role === 'measure') {
      if (c.count || r.count) return Object.assign(base, { error: T('La dispersión necesita dos medidas reales (no el recuento).', 'A scatter plot needs two real measures (not the record count).') });
      const mark = spec.mark === 'auto' ? 'scatter' : spec.mark;
      if (mark !== 'scatter') return Object.assign(base, { error: T('Con dos medidas solo se puede hacer una dispersión.', 'With two measures you can only make a scatter plot.') });
      const labelField = fs.find((f) => f.role === 'dimension');
      const colorField = spec.color ? fs.find((f) => f.name === spec.color && f.role === 'dimension') : null;
      const points = rows.map((row) => ({ x: row[c.index], y: row[r.index], label: labelField ? row[labelField.index] : '', color: colorField ? row[colorField.index] : null }));
      return { ok: true, spec, kind: 'scatter', mark, x: c.name, y: r.name, color: colorField ? colorField.name : null, points, colorKeys: colorField ? unique(points.map((p) => p.color)) : [] };
    }
    if (c.role === 'dimension' && r.role === 'dimension') {
      return Object.assign(base, { error: T('Hay dos dimensiones y ninguna medida: ¿qué número querés mostrar?', 'There are two dimensions and no measure: which number do you want to show?') });
    }
    const dimF = c.role === 'dimension' ? c : r;
    const measF = c.role === 'measure' ? c : r;
    const measItem = c.role === 'measure' ? spec.columns : spec.rows;
    const agg = measF.count ? 'COUNT' : measItem.agg || 'SUM';
    const orientation = c.role === 'dimension' ? 'v' : 'h';
    let mark = spec.mark;
    if (mark === 'auto') mark = dimF.time ? 'line' : 'bar';
    if (mark === 'scatter') return Object.assign(base, { error: T('La dispersión necesita dos medidas, una en cada estante.', 'A scatter plot needs two measures, one on each shelf.') });
    const colorF = spec.color && mark !== 'pie' ? fs.find((f) => f.name === spec.color && f.role === 'dimension') : null;

    // Categorías en orden de aparición (respeta el orden temporal de los datos).
    let cats = unique(rows.map((row) => row[dimF.index]));
    const colorKeys = colorF ? unique(rows.map((row) => row[colorF.index])) : ['__all'];
    const series = colorKeys.map((key) => ({
      key,
      values: cats.map((cat) =>
        aggregate(
          rows.filter((row) => row[dimF.index] === cat && (key === '__all' || row[colorF.index] === key)).map((row) => valueOf(measF, row)),
          agg
        )
      ),
    }));
    // Total por categoría (para ordenar y para torta).
    let totals = cats.map((cat) => aggregate(rows.filter((row) => row[dimF.index] === cat).map((row) => valueOf(measF, row)), agg));
    if (spec.sort === 'desc' || spec.sort === 'asc') {
      const order = cats.map((_, i) => i).sort((a, b) => (spec.sort === 'desc' ? totals[b] - totals[a] : totals[a] - totals[b]));
      cats = order.map((i) => cats[i]);
      totals = order.map((i) => totals[i]);
      series.forEach((s) => (s.values = order.map((i) => s.values[i])));
    }
    return {
      ok: true,
      spec,
      kind: 'category',
      mark,
      dim: dimF.name,
      measure: measF.name,
      agg,
      orientation,
      color: colorF ? colorF.name : null,
      categories: cats,
      totals,
      series,
      time: !!dimF.time,
    };
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

  // "Mostrarme": qué tipos de gráfico tienen sentido con los campos elegidos.
  function recommend(spec, table) {
    const fs = fields(table);
    const items = [spec.columns, spec.rows].filter(Boolean).map((it) => fs.find((f) => f.name === it.field)).filter(Boolean);
    const dims = items.filter((f) => f.role === 'dimension');
    const meas = items.filter((f) => f.role === 'measure');
    const res = { bar: 'no', line: 'no', pie: 'no', scatter: 'no' };
    if (dims.length === 1 && meas.length === 1) {
      const n = unique(table.rows.map((row) => row[dims[0].index])).length;
      const measItem = [spec.columns, spec.rows].find((it) => it && it.field === meas[0].name);
      const agg = meas[0].count ? 'COUNT' : (measItem && measItem.agg) || 'SUM';
      res.bar = dims[0].time ? 'ok' : 'best';
      res.line = dims[0].time ? 'best' : 'ok';
      res.pie = n <= 6 && (agg === 'SUM' || agg === 'COUNT') && !spec.color ? 'ok' : 'no';
    } else if (meas.length === 2 && !meas.some((f) => f.count)) {
      res.scatter = 'best';
    }
    return res;
  }

  // ---------------------------------------------------------------------------
  // Validador de objetivos de gráfico: devuelve check(Q) con Q = { spec, table }.
  // ---------------------------------------------------------------------------
  function expect(opts) {
    return (Q) => {
      const res = resolve(Q.spec, Q.table);
      if (res.empty) return false;
      if (!res.ok) return res.error;
      const markName = (m) => L(MARKS[m]).toLowerCase();
      if (opts.marks && !opts.marks.includes(res.mark)) {
        return opts.markNote || T(`Para este pedido conviene un gráfico de ${opts.marks.map(markName).join(' o ')}.`, `This request calls for a ${opts.marks.map(markName).join(' or ')} chart.`);
      }
      if (res.kind === 'scatter') {
        if (opts.x && (res.x !== opts.x || res.y !== opts.y)) {
          return T(`Poné ${opts.x} en Columnas (eje horizontal) y ${opts.y} en Filas (eje vertical).`, `Put ${opts.x} on Columns (horizontal axis) and ${opts.y} on Rows (vertical axis).`);
        }
      } else {
        if (opts.dim && res.dim !== opts.dim) return T(`Revisá la dimensión: el pedido es por ${opts.dim}.`, `Check the dimension: the request is by ${opts.dim}.`);
        if (opts.measure && res.measure !== opts.measure) {
          return T(`Revisá la medida: tiene que mostrar ${fieldLabel(opts.measure)}.`, `Check the measure: it must show ${fieldLabel(opts.measure)}.`);
        }
        if (opts.aggs && !opts.aggs.includes(res.agg)) {
          return T(`Revisá la agregación de ${fieldLabel(res.measure)}: tiene que ser ${opts.aggs.map((a) => L(AGGS[a])).join(' o ')}.`, `Check the aggregation of ${fieldLabel(res.measure)}: it must be ${opts.aggs.map((a) => L(AGGS[a])).join(' or ')}.`);
        }
      }
      if (opts.color !== undefined) {
        if (opts.color && res.color !== opts.color) return T(`Llevá ${opts.color} al estante Color para separar cada barra.`, `Drag ${opts.color} onto the Color shelf to split each bar.`);
        if (!opts.color && res.color) return T('Sacá el campo de Color: con una sola serie, un solo color se lee mejor.', 'Remove the Color field: a single series reads better in a single color.');
      }
      if (opts.filter) {
        const f = Q.spec.filter;
        const want = opts.filter.values.map(norm).sort().join('|');
        const got = f && f.field === opts.filter.field ? (f.values || []).map(norm).sort().join('|') : null;
        if (got !== want) return T(`Falta el filtro: mostrá solo ${opts.filter.field} = ${opts.filter.values.join(', ')}.`, `Missing filter: show only ${opts.filter.field} = ${opts.filter.values.join(', ')}.`);
      }
      if (opts.sort === 'desc' && Q.spec.sort !== 'desc') return T('Ordená de mayor a menor: así lo más importante se ve primero.', 'Sort from largest to smallest: the most important item shows first.');
      if (opts.sort === 'none' && Q.spec.sort !== 'none') return T('En una evolución en el tiempo no se ordena por valor: dejá el orden original de los meses.', "In a trend over time you don't sort by value: keep the original order of the months.");
      if (opts.titleIncludes) {
        const t = norm(Q.spec.title);
        if (!t) return T('Falta el título. Un buen título cuenta la conclusión, no solo qué hay en el gráfico.', 'The title is missing. A good title states the conclusion, not just what the chart contains.');
        if (!opts.titleIncludes.some((w) => t.includes(norm(w)))) {
          return T(`Mejorá el título: que cuente la conclusión (por ejemplo, mencionando ${opts.titleIncludes[0]}).`, `Improve the title: make it state the conclusion (for example, mentioning ${opts.titleIncludes[0]}).`);
        }
      }
      return true;
    };
  }

  AA.Chart = { COUNT_FIELD, AGGS, MARKS, emptySpec, fields, fieldLabel, fieldByName, resolve, recommend, expect, aggregate };
})();
