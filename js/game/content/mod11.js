/*
 * Analyst Adventure — Nivel 11 (etapa Junior): reportes, pedidos puntuales y mantener
 * dashboards que armaron otros (arreglar agregaciones, filtros viejos, gráficos mal elegidos,
 * responder preguntas con el filtro global y agregar lo que pide un área).
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const C = AA.Content;
  const V = AA.V;
  const Ch = AA.Chart;
  const D = AA.Dash;
  const Pv = AA.Pivot;
  const T = (es, en) => AA.T(es, en);
  const { REGIONS, MONTHS, PRODUCTS } = C.DATA;
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const spec = (o) => Object.assign(Ch.emptySpec(), o);
  const pct = (x) => (Math.round(x * 1000) / 10).toLocaleString('en-US') + '%';
  const after = (prev, check) => (S) => (prev(S) === true ? check(S) : false);

  C.module({
    id: 'mod11',
    title: { es: 'Reportes y dashboards existentes', en: 'Reports and existing dashboards' },
    xp: 140,
    tier: 1,
    skills: ['adhoc', 'maintain', 'kpiTiles', 'globalFilters'],
    templates: ['m11_fixagg', 'm11_fixfilter', 'm11_filter', 'm11_add', 'm11_adhoc'],
    seeds: [1101, 1102, 1103, 1104, 1105],
    intro: {
      es: 'Último tema de la etapa Junior. En el día a día vas a <b>mantener dashboards que armaron otros</b> y a responder <b>pedidos puntuales</b> ("¿cuánto vendimos ayer en el Norte?"). Parece fácil, pero acá se ve quién es prolijo.',
      en: 'Last topic of the Junior stage. Day to day you\'ll <b>maintain dashboards built by others</b> and answer <b>ad-hoc requests</b> ("how much did we sell yesterday in the North?"). It looks easy, but this is where you can tell who is careful.',
    },
    skillDefs: {
      adhoc: {
        title: { es: 'Pedidos puntuales (ad-hoc)', en: 'Ad-hoc requests' },
        say: {
          es: 'Antes de abrir los datos, aclará la pregunta: <b>qué</b> número, de <b>qué período</b>, para <b>cuándo</b>. Y respondé corto: <b>el número + una comparación + la causa si la sabés</b>. "En marzo el Norte vendió $1,2M, 8% más que en febrero" vale más que mandar la tabla entera.',
          en: 'Before opening the data, clarify the question: <b>which</b> number, for <b>which period</b>, by <b>when</b>. And answer briefly: <b>the number + a comparison + the cause if you know it</b>. "In March the North sold $1.2M, 8% more than February" beats sending the whole table.',
        },
        tip: { es: 'Variación % = (nuevo − anterior) ÷ anterior.', en: '% change = (new − previous) ÷ previous.' },
      },
      maintain: {
        title: { es: 'Mantener dashboards ajenos', en: "Maintaining other people's dashboards" },
        say: {
          es: 'Cuando heredás un dashboard, revisalo como un auditor: ¿cada KPI usa la <b>agregación</b> correcta? ¿algún gráfico tiene un <b>filtro viejo</b> escondido? ¿el tipo de gráfico tiene sentido? Arreglá lo roto sin romper lo que funciona.',
          en: 'When you inherit a dashboard, review it like an auditor: does each KPI use the right <b>aggregation</b>? does any chart have an old <b>hidden filter</b>? does the chart type make sense? Fix what is broken without breaking what works.',
        },
        tip: { es: 'Compará un KPI con un cálculo rápido a mano: si no coinciden, algo está mal.', en: "Compare a KPI with a quick manual calculation: if they don't match, something is wrong." },
      },
      kpiTiles: {
        title: { es: 'KPIs en un dashboard', en: 'KPIs on a dashboard' },
        say: {
          es: 'Un <b>KPI</b> es un número grande con un nombre claro: "Ventas totales", "Tickets abiertos". Va arriba del dashboard porque es lo primero que se mira. Cuidá la agregación (un total es Suma, no Promedio) y el formato ($, %).',
          en: 'A <b>KPI</b> is a big number with a clear name: "Total sales", "Open tickets". It goes at the top of the dashboard because it is the first thing people look at. Watch the aggregation (a total is Sum, not Average) and the format ($, %).',
        },
        tip: { es: '✏️ en cada elemento lo edita; 🗑 lo quita. ⟲ vuelve al dashboard original.', en: '✏️ on each element edits it; 🗑 removes it. ⟲ goes back to the original dashboard.' },
      },
      globalFilters: {
        title: { es: 'Filtros globales', en: 'Global filters' },
        say: {
          es: 'El <b>filtro global</b> de un dashboard se aplica a todos los KPIs y gráficos a la vez. Es la forma más rápida de responder preguntas como "¿y solo en Online?" sin armar nada nuevo.',
          en: 'A dashboard\'s <b>global filter</b> applies to every KPI and chart at once. It\'s the fastest way to answer questions like "and only Online?" without building anything new.',
        },
        tip: { es: 'Antes de leer un número, mirá qué filtro está puesto. Es el error más común al presentar.', en: 'Before reading a number, check which filter is on. It is the most common mistake when presenting.' },
      },
    },
  });

  // Datos de ventas mensuales reutilizables.
  function salesData(r, ctx, nMonths) {
    const n = C.rowsFor(ctx, [60, 80], [120, 160], [200, 260]);
    const months = MONTHS.slice(0, nMonths).map(C.L2);
    const regs = REGIONS.slice(0, 4).map(C.L2);
    const chans = [['Tienda', 'Store'], ['Online', 'Online'], ['Mayorista', 'Wholesale']].map(C.L2);
    const cats = [['Oficina', 'Office'], ['Electrónica', 'Electronics'], ['Muebles', 'Furniture'], ['Accesorios', 'Accessories']].map(C.L2);
    const wReg = regs.map(() => 0.6 + r.next());
    const rows = Array.from({ length: n }, () => {
      const g = r.int(0, regs.length - 1);
      return [months[r.int(0, months.length - 1)], regs[g], r.pick(chans), r.pick(cats), Math.round(r.step(500, 9000, 50) * wReg[g])];
    });
    // Los datos llegan en orden cronológico (así los gráficos de evolución quedan bien ordenados).
    rows.sort((a, b) => months.indexOf(a[0]) - months.indexOf(b[0]));
    return { months, regs, chans, cats, rows };
  }

  // ---------------------------------------------------------------------------
  // Agregaciones mal elegidas en un dashboard heredado
  // ---------------------------------------------------------------------------
  C.register('m11_fixagg', (ctx) => {
    const r = ctx.rng;
    let d;
    let byReg;
    do {
      d = salesData(r, ctx, 6);
      byReg = d.regs.map((g) => sum(d.rows.filter((x) => x[1] === g).map((x) => x[4])));
    } while (C.uniqueExtreme(byReg) < 0);
    const H = { m: T('Mes', 'Month'), reg: T('Región', 'Region'), ch: T('Canal', 'Channel'), cat: T('Categoría', 'Category'), amt: T('Monto', 'Amount') };
    const table = C.table([H.m, H.reg, H.ch, H.cat, H.amt], d.rows, { time: [H.m] });
    const total = sum(d.rows.map((x) => x[4]));
    const initial = {
      title: T('Ventas · Primer semestre', 'Sales · First half'),
      filter: null,
      tiles: [
        { id: 'k1', kind: 'kpi', title: T('Ventas totales', 'Total sales'), field: H.amt, agg: 'AVG', format: 'money' },
        { id: 'k2', kind: 'kpi', title: T('Operaciones', 'Deals'), field: Ch.COUNT_FIELD, agg: 'COUNT', format: 'num' },
        { id: 'c1', kind: 'chart', chart: spec({ mark: 'bar', columns: { field: H.reg }, rows: { field: H.amt, agg: 'COUNT' }, sort: 'desc', title: T('Ventas por región', 'Sales by region') }) },
        { id: 'c2', kind: 'chart', chart: spec({ mark: 'line', columns: { field: H.m }, rows: { field: H.amt, agg: 'SUM' }, title: T('Evolución mensual', 'Monthly trend') }) },
      ],
    };
    const fixed = JSON.parse(JSON.stringify(initial));
    fixed.tiles[0].agg = 'SUM';
    fixed.tiles[2].chart.rows.agg = 'SUM';
    const kpiCheck = D.tile('k1', D.kpiIs({ field: H.amt, aggs: ['SUM'] }));
    const regCheck = D.tile('c1', Ch.expect({ marks: ['bar'], dim: H.reg, measure: H.amt, aggs: ['SUM'] }));
    return {
      from: 'marta',
      dept: 'analytics',
      subject: T('El dashboard de ventas muestra cualquier cosa', 'The sales dashboard shows nonsense'),
      file: T('dashboard_ventas.bi', 'sales_dashboard.bi'),
      email: T(
        `<p>Nico armó este dashboard antes de irse de vacaciones y Bruno dice que <b>los números no le cierran</b>: "Ventas totales" da muy bajo y el gráfico por región parece contar en vez de sumar.</p><p>Revisalo y arreglá lo que esté mal. Lo que funciona, dejalo como está.</p>`,
        `<p>Nico built this dashboard before going on vacation and Bruno says <b>the numbers don't add up</b>: "Total sales" is way too low and the region chart seems to count instead of sum.</p><p>Review it and fix what's wrong. Leave what works as it is.</p>`
      ),
      dashboard: { table, initial, money: [H.amt] },
      objectives: [
        {
          text: T('Arreglá el KPI <b>"Ventas totales"</b>: tiene que ser el total, no el promedio.', 'Fix the <b>"Total sales"</b> KPI: it must be the total, not the average.'),
          hint: T('✏️ en el KPI → cambiá Promedio por Suma.', '✏️ on the KPI → change Average to Sum.'),
          check: kpiCheck,
        },
        {
          text: T('Arreglá el gráfico <b>"Ventas por región"</b>: tiene que sumar el monto.', 'Fix the <b>"Sales by region"</b> chart: it must sum the amount.'),
          hint: T('✏️ en el gráfico → en la píldora del Monto elegí Suma.', '✏️ on the chart → choose Sum in the Amount pill.'),
          check: regCheck,
        },
        {
          text: T('❓ Ya corregido: ¿cuánto suman las <b>ventas totales</b> del semestre?', '❓ Now fixed: what are the semester\'s <b>total sales</b>?'),
          placeholder: T('Un monto', 'An amount'),
          hint: T('Leelo del KPI (pasá el mouse para ver el número completo en el gráfico si hace falta).', 'Read it from the KPI.'),
          answer: (a) => {
            const raw = String(a || '').replace(/[$\s]/g, '').toUpperCase();
            const k = /K$/.test(raw) ? 1e3 : /M$/.test(raw) ? 1e6 : 1;
            const num = V.answerNumber(total / k, k === 1 ? 0.5 : k === 1e3 ? 0.06 : 0.006);
            return num(raw.replace(/[KM]$/, ''));
          },
        },
        {
          text: T('❓ ¿Qué región <b>vendió más</b>?', '❓ Which region <b>sold the most</b>?'),
          placeholder: T('Región', 'Region'),
          hint: T('El gráfico corregido está ordenado de mayor a menor.', 'The fixed chart is sorted largest first.'),
          answer: V.answerText([d.regs[C.uniqueExtreme(byReg)]]),
        },
      ],
      tips: [T('"Ventas totales" con Promedio muestra el ticket promedio, no el total: el nombre y el cálculo no coinciden.', '"Total sales" with Average shows the average ticket, not the total: name and calculation don\'t match.'), T('Si rompés algo, ⟲ vuelve al original.', 'If you break something, ⟲ goes back to the original.')],
      feedback: T('Ahora sí cierran los números. Le dejo una nota a Nico para que vea qué estaba mal.', 'Now the numbers add up. I\'ll leave Nico a note so he sees what was wrong.'),
      solution: { dashboard: fixed, answers: { 2: String(total), 3: d.regs[C.uniqueExtreme(byReg)] } },
    };
  });

  // ---------------------------------------------------------------------------
  // Filtro viejo escondido y torta con demasiadas porciones
  // ---------------------------------------------------------------------------
  C.register('m11_fixfilter', (ctx) => {
    const r = ctx.rng;
    const nM = 9;
    const months = MONTHS.slice(0, nM).map(C.L2);
    const cats = [['Facturación', 'Billing'], ['Envíos', 'Shipping'], ['Producto roto', 'Broken product'], ['Devoluciones', 'Returns'], ['Cuenta', 'Account'], ['Garantía', 'Warranty'], ['Pagos', 'Payments'], ['Stock', 'Stock'], ['Otros', 'Other']].map(C.L2);
    const chans = [['Teléfono', 'Phone'], ['Chat', 'Chat'], ['Email', 'Email']].map(C.L2);
    const n = C.rowsFor(ctx, [90, 120], [160, 220], [260, 340]);
    let rows;
    let perMonth;
    let perCat;
    do {
      const w = cats.map(() => r.next() + 0.2);
      rows = Array.from({ length: n }, (_, i) => {
        let pick = r.next() * sum(w);
        let c = 0;
        while (c < cats.length - 1 && pick > w[c]) pick -= w[c++];
        return ['T-' + (9001 + i), months[Math.min(nM - 1, Math.floor(Math.pow(r.next(), 0.8) * nM))], cats[c], r.pick(chans)];
      });
      rows.sort((a, b) => months.indexOf(a[1]) - months.indexOf(b[1]));
      rows.forEach((x, i) => (x[0] = 'T-' + (9001 + i)));
      perMonth = months.map((m) => rows.filter((x) => x[1] === m).length);
      perCat = cats.map((c) => rows.filter((x) => x[2] === c).length);
    } while (perMonth.some((v) => !v) || C.uniqueExtreme(perCat) < 0);
    const H = { id: 'Ticket', m: T('Mes', 'Month'), cat: T('Categoría', 'Category'), ch: T('Canal', 'Channel') };
    const table = C.table([H.id, H.m, H.cat, H.ch], rows, { time: [H.m] });
    const initial = {
      title: T('Soporte · Tickets', 'Support · Tickets'),
      filter: null,
      tiles: [
        { id: 'k1', kind: 'kpi', title: T('Tickets', 'Tickets'), field: Ch.COUNT_FIELD, agg: 'COUNT', format: 'num' },
        { id: 'c1', kind: 'chart', chart: spec({ mark: 'line', columns: { field: H.m }, rows: { field: Ch.COUNT_FIELD, agg: 'COUNT' }, filter: { field: H.m, values: months.slice(0, 6) }, title: T('Tickets por mes', 'Tickets per month') }) },
        { id: 'c2', kind: 'chart', chart: spec({ mark: 'pie', columns: { field: H.cat }, rows: { field: Ch.COUNT_FIELD, agg: 'COUNT' }, title: T('Tickets por categoría', 'Tickets by category') }) },
      ],
    };
    const fixed = JSON.parse(JSON.stringify(initial));
    fixed.tiles[1].chart.filter = null;
    Object.assign(fixed.tiles[2].chart, { mark: 'bar', sort: 'desc' });
    const lineOk = (Q) => {
      const res = Ch.expect({ marks: ['line'], dim: H.m, aggs: ['COUNT'] })(Q);
      if (res !== true) return res;
      return Ch.resolve(Q.spec, Q.table).categories.length === nM ? true : T(`El gráfico todavía no muestra los ${nM} meses: tiene un filtro viejo.`, `The chart still doesn't show all ${nM} months: it has an old filter.`);
    };
    return {
      from: 'camila',
      dept: 'data',
      subject: T('El dashboard de soporte quedó congelado en junio', 'The support dashboard is stuck in June'),
      file: T('dashboard_soporte.bi', 'support_dashboard.bi'),
      email: T(
        `<p>Los datos de tickets ya llegan hasta <b>${months[nM - 1]}</b>, pero el gráfico mensual del dashboard se corta en <b>${months[5]}</b>. Además, la torta de categorías tiene ${cats.length} porciones y nadie entiende nada.</p><p>¿Lo podés poner al día?</p>`,
        `<p>Ticket data now goes up to <b>${months[nM - 1]}</b>, but the dashboard's monthly chart stops at <b>${months[5]}</b>. Also, the category pie has ${cats.length} slices and nobody can read it.</p><p>Can you bring it up to date?</p>`
      ),
      dashboard: { table, initial },
      objectives: [
        {
          text: T('Que <b>"Tickets por mes"</b> muestre <b>todos los meses</b>.', 'Make <b>"Tickets per month"</b> show <b>every month</b>.'),
          hint: T('✏️ en el gráfico: tiene un filtro de Mes escondido. Sacalo (×) o tildá todos.', '✏️ on the chart: it has a hidden Month filter. Remove it (×) or check them all.'),
          check: D.tile('c1', lineOk),
        },
        {
          text: T('Cambiá la torta de categorías por <b>barras ordenadas</b> de mayor a menor.', 'Replace the category pie with <b>bars sorted</b> largest first.'),
          hint: T('✏️ → Mostrarme: Barras, y Ordenar: Mayor a menor.', '✏️ → Show Me: Bars, and Sort: Largest first.'),
          check: D.tile('c2', Ch.expect({ marks: ['bar'], dim: H.cat, aggs: ['COUNT'], sort: 'desc' })),
        },
        {
          text: T(`❓ ¿Cuántos tickets hubo en <b>${months[nM - 1]}</b>?`, `❓ How many tickets were there in <b>${months[nM - 1]}</b>?`),
          placeholder: T('Cantidad', 'Count'),
          hint: T('Pasá el mouse por el último punto de la línea.', 'Hover over the last point of the line.'),
          answer: V.answerNumber(perMonth[nM - 1], 0),
        },
        {
          text: T('❓ ¿Cuál es la categoría con <b>más tickets</b>?', '❓ Which category has the <b>most tickets</b>?'),
          placeholder: T('Categoría', 'Category'),
          hint: T('La primera barra.', 'The first bar.'),
          answer: V.answerText([cats[C.uniqueExtreme(perCat)]]),
        },
      ],
      tips: [T('Los filtros dentro de un gráfico no se ven a simple vista: revisá cada gráfico al heredar un dashboard.', "Filters inside a chart aren't visible at a glance: check every chart when you inherit a dashboard."), T('Una torta con más de 6 porciones casi nunca funciona: barras ordenadas sí.', 'A pie with more than 6 slices almost never works: sorted bars do.')],
      feedback: T('¡Gracias! Ahora el equipo de soporte ve el año completo.', 'Thanks! Now the support team sees the whole year.'),
      solution: { dashboard: fixed, answers: { 2: String(perMonth[nM - 1]), 3: cats[C.uniqueExtreme(perCat)] } },
    };
  });

  // ---------------------------------------------------------------------------
  // Pedido puntual: responder con el filtro global
  // ---------------------------------------------------------------------------
  C.register('m11_filter', (ctx) => {
    const r = ctx.rng;
    let d;
    let focus;
    let sub;
    let catRev;
    do {
      d = salesData(r, ctx, 6);
      focus = r.pick(d.chans);
      sub = d.rows.filter((x) => x[2] === focus);
      catRev = d.cats.map((c) => sum(sub.filter((x) => x[3] === c).map((x) => x[4])));
    } while (C.uniqueExtreme(catRev) < 0 || sub.length < 5);
    const H = { m: T('Mes', 'Month'), reg: T('Región', 'Region'), ch: T('Canal', 'Channel'), cat: T('Categoría', 'Category'), amt: T('Monto', 'Amount') };
    const table = C.table([H.m, H.reg, H.ch, H.cat, H.amt], d.rows, { time: [H.m] });
    const rev = sum(sub.map((x) => x[4]));
    const avgTicket = rev / sub.length;
    const initial = {
      title: T('Comercial · Semestre', 'Commercial · Semester'),
      filter: null,
      tiles: [
        { id: 'k1', kind: 'kpi', title: T('Pedidos', 'Orders'), field: Ch.COUNT_FIELD, agg: 'COUNT', format: 'num' },
        { id: 'k2', kind: 'kpi', title: T('Facturación', 'Revenue'), field: H.amt, agg: 'SUM', format: 'money' },
        { id: 'k3', kind: 'kpi', title: T('Ticket promedio', 'Average ticket'), field: H.amt, agg: 'AVG', format: 'money' },
        { id: 'c1', kind: 'chart', chart: spec({ mark: 'bar', columns: { field: H.cat }, rows: { field: H.amt, agg: 'SUM' }, sort: 'desc', title: T('Facturación por categoría', 'Revenue by category') }) },
      ],
    };
    const fixed = JSON.parse(JSON.stringify(initial));
    fixed.filter = { field: H.ch, values: [focus] };
    const flt = D.globalFilter(H.ch, [focus]);
    const numAns = (x, tol) => (a) => {
      const raw = String(a || '').replace(/[$\s]/g, '').toUpperCase();
      const k = /K$/.test(raw) ? 1e3 : /M$/.test(raw) ? 1e6 : 1;
      return V.answerNumber(x / k, k === 1 ? tol : tol / k + 0.06)(raw.replace(/[KM]$/, ''));
    };
    return {
      from: 'bruno',
      dept: 'ventas',
      subject: T(`Pregunta rápida sobre ${focus}`, `Quick question about ${focus}`),
      file: T('dashboard_comercial.bi', 'commercial_dashboard.bi'),
      email: T(
        `<p>Estoy por entrar a una reunión: ¿cuánto <b>facturamos</b> por <b>${focus}</b> en el semestre, cuál es el <b>ticket promedio</b> ahí y qué <b>categoría</b> vende más en ese canal?</p><p>Usá el dashboard comercial, no hace falta armar nada nuevo.</p>`,
        `<p>I'm about to walk into a meeting: how much <b>revenue</b> did <b>${focus}</b> bring in this semester, what's the <b>average ticket</b> there and which <b>category</b> sells most in that channel?</p><p>Use the commercial dashboard, no need to build anything new.</p>`
      ),
      dashboard: { table, initial, money: [H.amt] },
      objectives: [
        {
          text: T(`Poné el <b>filtro global</b> en ${H.ch} = <b>${focus}</b>.`, `Set the <b>global filter</b> to ${H.ch} = <b>${focus}</b>.`),
          hint: T(`Arriba: "Filtro global" → ${H.ch}, y dejá encendido solo ${focus}.`, `At the top: "Global filter" → ${H.ch}, and leave only ${focus} on.`),
          check: flt,
        },
        {
          text: T(`❓ ¿Cuánto <b>facturó</b> ${focus}?`, `❓ How much <b>revenue</b> did ${focus} bring in?`),
          placeholder: T('Un monto', 'An amount'),
          hint: T('El KPI de Facturación con el filtro puesto.', 'The Revenue KPI with the filter on.'),
          answer: numAns(rev, 0.5),
        },
        {
          text: T(`❓ ¿Cuál es el <b>ticket promedio</b> en ${focus}?`, `❓ What is the <b>average ticket</b> in ${focus}?`),
          placeholder: T('Un monto', 'An amount'),
          hint: T('El KPI de Ticket promedio.', 'The Average ticket KPI.'),
          answer: numAns(avgTicket, 0.6),
        },
        {
          text: T(`❓ ¿Qué <b>categoría</b> factura más en ${focus}?`, `❓ Which <b>category</b> brings in the most revenue in ${focus}?`),
          placeholder: T('Categoría', 'Category'),
          hint: T('La primera barra con el filtro puesto.', 'The first bar with the filter on.'),
          answer: V.answerText([d.cats[C.uniqueExtreme(catRev)]]),
        },
      ],
      tips: [T('El filtro global cambia todos los KPIs y gráficos a la vez.', 'The global filter changes every KPI and chart at once.'), T('Los KPIs muestran números redondeados (K = miles): podés responder con el número completo o como lo muestra el KPI.', 'KPIs show rounded numbers (K = thousands): you can answer with the full number or as the KPI shows it.')],
      feedback: T('¡Llegué a la reunión con los números! Respuesta rápida y clara, así da gusto.', 'I made it to the meeting with the numbers! Quick and clear, that\'s how it should be.'),
      solution: { dashboard: fixed, answers: { 1: String(rev), 2: String(avgTicket), 3: d.cats[C.uniqueExtreme(catRev)] } },
    };
  });

  // ---------------------------------------------------------------------------
  // Agregar lo que pide un área (sin romper lo que ya estaba)
  // ---------------------------------------------------------------------------
  C.register('m11_add', (ctx) => {
    const r = ctx.rng;
    const weeks = Array.from({ length: ctx.size === 'large' ? 16 : 12 }, (_, i) => T('Sem ', 'Wk ') + String(i + 1).padStart(2, '0'));
    const chans = [['Redes', 'Social'], ['Buscadores', 'Search'], ['Email', 'Email'], ['Afiliados', 'Affiliates']].map(C.L2);
    let rows;
    let conv;
    do {
      const eff = chans.map(() => 0.01 + r.next() * 0.04);
      rows = [];
      for (const w of weeks) for (let c = 0; c < chans.length; c++) {
        const spend = r.step(2000, 12000, 100);
        rows.push([w, chans[c], spend, Math.round(spend * eff[c] * (0.7 + r.next() * 0.6))]);
      }
      conv = chans.map((c) => sum(rows.filter((x) => x[1] === c).map((x) => x[3])));
    } while (C.uniqueExtreme(conv) < 0 || new Set(conv).size < chans.length);
    const H = { w: T('Semana', 'Week'), ch: T('Canal', 'Channel'), spend: T('Inversión', 'Spend'), conv: T('Conversiones', 'Conversions') };
    const table = C.table([H.w, H.ch, H.spend, H.conv], rows, { time: [H.w] });
    const initial = {
      title: T('Marketing · Campañas', 'Marketing · Campaigns'),
      filter: null,
      tiles: [
        { id: 'k1', kind: 'kpi', title: T('Inversión total', 'Total spend'), field: H.spend, agg: 'SUM', format: 'money' },
        { id: 'c1', kind: 'chart', chart: spec({ mark: 'line', columns: { field: H.w }, rows: { field: H.spend, agg: 'SUM' }, title: T('Inversión por semana', 'Spend per week') }) },
      ],
    };
    const keep = (check) => (S) => {
      const ids = S.dash.spec.tiles.map((t) => t.id);
      if (!ids.includes('k1') || !ids.includes('c1')) return T('No borres lo que ya estaba: Tadeo pidió agregar, no reemplazar. Usá ⟲ para recuperarlo.', 'Don\'t delete what was there: Tadeo asked to add, not replace. Use ⟲ to get it back.');
      return check(S);
    };
    const fixed = JSON.parse(JSON.stringify(initial));
    fixed.tiles.push({ id: 'n1', kind: 'kpi', title: T('Conversiones', 'Conversions'), field: H.conv, agg: 'SUM', format: 'num' });
    fixed.tiles.push({ id: 'n2', kind: 'chart', chart: spec({ mark: 'bar', columns: { field: H.ch }, rows: { field: H.conv, agg: 'SUM' }, sort: 'desc', title: T('Conversiones por canal', 'Conversions by channel') }) });
    return {
      from: 'tadeo',
      dept: 'marketing',
      subject: T('¿Podés sumar las conversiones al dashboard?', 'Can you add conversions to the dashboard?'),
      file: T('dashboard_marketing.bi', 'marketing_dashboard.bi'),
      email: T(
        '<p>El dashboard de campañas solo muestra cuánto <b>invertimos</b>. Dirección ahora pregunta qué <b>conseguimos</b> con esa plata.</p><p>Agregale un KPI con el <b>total de conversiones</b> y un gráfico de <b>conversiones por canal</b>, de mayor a menor. Lo que ya está, dejalo.</p>',
        '<p>The campaign dashboard only shows how much we <b>spend</b>. Management now asks what we <b>get</b> for that money.</p><p>Add a KPI with <b>total conversions</b> and a chart of <b>conversions by channel</b>, largest first. Keep what is already there.</p>'
      ),
      dashboard: { table, initial, money: [H.spend] },
      objectives: [
        {
          text: T(`Un KPI nuevo con el <b>total de ${H.conv}</b> (Suma).`, `A new KPI with <b>total ${H.conv}</b> (Sum).`),
          hint: T(`＋ KPI → elegí ${H.conv} y Suma, y ponele nombre.`, `＋ KPI → choose ${H.conv} and Sum, and name it.`),
          check: keep(D.hasKpi({ field: H.conv, aggs: ['SUM'] })),
        },
        {
          text: T(`Un gráfico de barras de <b>${H.conv} por ${H.ch}</b>, de mayor a menor.`, `A bar chart of <b>${H.conv} by ${H.ch}</b>, largest first.`),
          hint: T(`＋ Gráfico → ${H.ch} en Columnas, ${H.conv} en Filas, Barras, ordenar Mayor a menor.`, `＋ Chart → ${H.ch} on Columns, ${H.conv} on Rows, Bars, sort Largest first.`),
          check: keep(D.hasChart({ marks: ['bar'], dim: H.ch, measure: H.conv, aggs: ['SUM'], sort: 'desc' })),
        },
        {
          text: T('❓ ¿Qué canal trae <b>más conversiones</b>?', '❓ Which channel brings the <b>most conversions</b>?'),
          placeholder: T('Canal', 'Channel'),
          hint: T('La primera barra del gráfico nuevo.', 'The first bar of the new chart.'),
          answer: V.answerText([chans[C.uniqueExtreme(conv)]]),
        },
      ],
      tips: [T('Agregá debajo de lo existente: los usuarios ya saben dónde mirar cada cosa.', 'Add below what exists: users already know where to look for each thing.'), T('Ponele nombre a cada KPI: "Conversiones" se entiende; "Suma de Conversiones" no tanto.', 'Name each KPI: "Conversions" is clear; "Sum of Conversions" less so.')],
      feedback: T('¡Perfecto! Ahora se ve la inversión Y el resultado. Dirección feliz.', 'Perfect! Now you can see spend AND results. Management is happy.'),
      solution: { dashboard: fixed, answers: { 2: chans[C.uniqueExtreme(conv)] } },
    };
  });

  // ---------------------------------------------------------------------------
  // Pedido puntual con tabla dinámica + cómo responderlo
  // ---------------------------------------------------------------------------
  C.register('m11_adhoc', (ctx) => {
    const r = ctx.rng;
    let d;
    let reg;
    let feb;
    let mar;
    do {
      d = salesData(r, ctx, 3);
      reg = r.pick(d.regs);
      feb = sum(d.rows.filter((x) => x[0] === d.months[1] && x[1] === reg).map((x) => x[4]));
      mar = sum(d.rows.filter((x) => x[0] === d.months[2] && x[1] === reg).map((x) => x[4]));
    } while (!feb || !mar || Math.abs(mar - feb) / feb < 0.03);
    const change = (mar - feb) / feb;
    const up = change > 0;
    const H = { m: T('Mes', 'Month'), reg: T('Región', 'Region'), ch: T('Canal', 'Channel'), cat: T('Categoría', 'Category'), amt: T('Monto', 'Amount') };
    const base = Pv.expect({ rows: H.reg, columns: H.m, value: H.amt, aggs: ['SUM'] });
    const fmt = (x) => C.money(Math.round(x));
    return {
      from: 'bruno',
      dept: 'ventas',
      subject: T(`¿Cómo nos fue en ${reg} en ${d.months[2]}?`, `How did ${reg} do in ${d.months[2]}?`),
      file: T('ventas_trimestre.xlsx', 'quarter_sales.xlsx'),
      email: T(
        `<p>Me pregunta el director: <b>¿cuánto vendimos en ${reg} en ${d.months[2]}</b> y cómo viene <b>contra ${d.months[1]}</b>? Necesito la respuesta en dos líneas para reenviársela.</p>`,
        `<p>The director is asking: <b>how much did we sell in ${reg} in ${d.months[2]}</b> and how is it doing <b>vs ${d.months[1]}</b>? I need the answer in two lines to forward it.</p>`
      ),
      pivot: { table: C.table([H.m, H.reg, H.ch, H.cat, H.amt], d.rows), money: [H.amt] },
      objectives: [
        {
          text: T(`Tabla dinámica: <b>${H.reg}</b> en Filas, <b>${H.m}</b> en Columnas y <b>Suma de ${H.amt}</b>.`, `Pivot table: <b>${H.reg}</b> in Rows, <b>${H.m}</b> in Columns and <b>Sum of ${H.amt}</b>.`),
          hint: T('Igual que en el Nivel 9: regiones × meses.', 'Same as Level 9: regions × months.'),
          check: base,
        },
        {
          text: T(`❓ ¿Cuánto vendió <b>${reg}</b> en <b>${d.months[2]}</b>?`, `❓ How much did <b>${reg}</b> sell in <b>${d.months[2]}</b>?`),
          placeholder: T('Un monto', 'An amount'),
          hint: T('Cruce de fila y columna.', 'Where the row meets the column.'),
          answer: V.answerNumber(mar, 0.5),
        },
        {
          text: T(`❓ ¿Cuál fue la <b>variación %</b> contra ${d.months[1]}? (con un decimal; negativo si bajó)`, `❓ What was the <b>% change</b> vs ${d.months[1]}? (one decimal; negative if it dropped)`),
          placeholder: '%',
          hint: T(`(${d.months[2]} − ${d.months[1]}) ÷ ${d.months[1]} × 100`, `(${d.months[2]} − ${d.months[1]}) ÷ ${d.months[1]} × 100`),
          answer: (a) => V.answerNumber(change * 100, 0.06)(String(a).replace('%', '')),
        },
        {
          text: T('❓ ¿Qué le contestás a Bruno?', '❓ What do you reply to Bruno?'),
          choices: [
            T('Te mando la tabla dinámica completa así la mirás.', "I'm sending you the full pivot table so you can look at it."),
            T(`En ${d.months[2]} ${reg} vendió ${fmt(mar)}, ${pct(Math.abs(change))} ${up ? 'más' : 'menos'} que en ${d.months[1]} (${fmt(feb)}).`, `In ${d.months[2]} ${reg} sold ${fmt(mar)}, ${pct(Math.abs(change))} ${up ? 'more' : 'less'} than in ${d.months[1]} (${fmt(feb)}).`),
            T(`Las ventas de ${reg} ${up ? 'subieron' : 'bajaron'} bastante.`, `${reg} sales went ${up ? 'up' : 'down'} quite a bit.`),
          ],
          correct: 1,
          why: [
            T('Bruno pidió dos líneas: la tabla entera le traslada el trabajo de leerla.', 'Bruno asked for two lines: the whole table shifts the reading work to him.'),
            null,
            T('Sin números ni comparación, "bastante" no le sirve al director.', 'Without numbers or a comparison, "quite a bit" is useless to the director.'),
          ],
          hint: T('Número + comparación, en una frase.', 'Number + comparison, in one sentence.'),
        },
      ],
      tips: [T('Un pedido puntual se responde con una frase, no con un archivo.', 'An ad-hoc request is answered with a sentence, not a file.'), T('Variación % = (nuevo − anterior) ÷ anterior.', '% change = (new − previous) ÷ previous.')],
      feedback: T('¡Eso es exactamente lo que necesitaba! Copiado y reenviado. 🙌', "That's exactly what I needed! Copied and forwarded. 🙌"),
      solution: { pivot: { rows: H.reg, columns: H.m, value: { field: H.amt, agg: 'SUM' }, filter: null, show: 'value', sort: 'none' }, answers: { 1: String(mar), 2: String(Math.round(change * 1000) / 10), 3: 1 } },
    };
  });
})();
