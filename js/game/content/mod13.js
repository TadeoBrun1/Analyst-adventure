/*
 * Analyst Adventure — Nivel 13 (etapa Semi-Senior): dashboards desde cero.
 * Partir de las preguntas del usuario, KPIs arriba, 2 gráficos que respondan preguntas
 * concretas, un filtro global y nada de relleno.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const C = AA.Content;
  const V = AA.V;
  const Ch = AA.Chart;
  const D = AA.Dash;
  const T = (es, en) => AA.T(es, en);
  const { REGIONS, MONTHS, CARRIERS, CITIES } = C.DATA;
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const spec = (o) => Object.assign(Ch.emptySpec(), o);
  const all = (...checks) => (S) => {
    for (const c of checks) {
      const r = c(S);
      if (r !== true) return r;
    }
    return true;
  };
  const titled = (S) => {
    const t = String((S.dash && S.dash.spec.title) || '').trim();
    return t.length >= 5 ? true : t ? T('Un título más claro: que diga de qué es el dashboard.', 'A clearer title: say what the dashboard is about.') : false;
  };
  const sizeOk = D.tileCount(4, 6);
  const kpi = (id, title, field, agg, format) => ({ id, kind: 'kpi', title, field, agg, format });
  const chartTile = (id, o) => ({ id, kind: 'chart', chart: spec(o) });
  const weighted = (r, w) => {
    let p = r.next() * sum(w);
    let i = 0;
    while (i < w.length - 1 && p > w[i]) p -= w[i++];
    return i;
  };

  C.module({
    id: 'mod13',
    title: { es: 'Dashboards desde cero', en: 'Dashboards from scratch' },
    xp: 160,
    tier: 2,
    skills: ['dashStart', 'dashLayout', 'dashChoose', 'dashLess'],
    templates: ['m13_sales', 'm13_support', 'm13_hr', 'm13_marketing', 'm13_logistics'],
    seeds: [1301, 1302, 1303, 1304, 1305],
    intro: {
      es: 'Hasta ahora arreglabas dashboards de otros. Un Semi-Senior los <b>diseña desde cero</b>: decide qué mostrar, cómo y para quién. Un buen dashboard responde preguntas; uno malo solo junta gráficos.',
      en: 'So far you fixed other people\'s dashboards. A Mid-level analyst <b>designs them from scratch</b>: decides what to show, how and for whom. A good dashboard answers questions; a bad one just piles up charts.',
    },
    skillDefs: {
      dashStart: {
        title: { es: 'Empezar por las preguntas', en: 'Start with the questions' },
        say: {
          es: 'Antes de arrastrar nada, escribí las <b>3 a 5 preguntas</b> que el usuario se hace todas las semanas ("¿cuánto vendimos?", "¿cómo viene el mes?", "¿qué región anda mal?"). Cada elemento del dashboard tiene que responder una.',
          en: 'Before dragging anything, write down the <b>3 to 5 questions</b> the user asks every week ("how much did we sell?", "how is the month going?", "which region is doing badly?"). Each dashboard element must answer one.',
        },
        tip: { es: 'Si un gráfico no responde ninguna pregunta, sobra.', en: "If a chart doesn't answer any question, it doesn't belong." },
      },
      dashLayout: {
        title: { es: 'Diseño: de lo general a lo particular', en: 'Layout: from general to specific' },
        say: {
          es: 'Arriba, los <b>KPIs</b> (los números clave, en grande). Abajo, los <b>gráficos</b> que explican esos números: primero la evolución en el tiempo, después el detalle por categoría. Se lee como un diario: de arriba hacia abajo, de izquierda a derecha.',
          en: 'At the top, the <b>KPIs</b> (the key numbers, big). Below, the <b>charts</b> explaining those numbers: first the trend over time, then the breakdown by category. It reads like a newspaper: top to bottom, left to right.',
        },
        tip: { es: 'En este editor, los elementos se acomodan en el orden en que los agregás: empezá por los KPIs.', en: 'In this editor, elements are placed in the order you add them: start with the KPIs.' },
      },
      dashChoose: {
        title: { es: 'Un gráfico por pregunta', en: 'One chart per question' },
        say: {
          es: '"¿Cómo evoluciona?" → <b>líneas</b> por mes o semana. "¿Quién/qué es más grande?" → <b>barras ordenadas</b>. "¿Cómo se reparte?" → barras apiladas o una torta de pocas porciones. "¿Hay relación entre dos números?" → <b>dispersión</b>.',
          en: '"How is it trending?" → <b>lines</b> by month or week. "Who/what is biggest?" → <b>sorted bars</b>. "How is it split?" → stacked bars or a pie with few slices. "Is there a relationship between two numbers?" → <b>scatter</b>.',
        },
        tip: { es: 'Ponele a cada gráfico un título claro: es lo primero que se lee.', en: 'Give each chart a clear title: it is the first thing people read.' },
      },
      dashLess: {
        title: { es: 'Menos es más', en: 'Less is more' },
        say: {
          es: 'Un dashboard útil tiene entre <b>4 y 6 elementos</b>. Lo demás va en un filtro: el <b>filtro global</b> deja que cada persona explore su región o su canal sin que vos armes un dashboard para cada uno.',
          en: 'A useful dashboard has <b>4 to 6 elements</b>. The rest goes into a filter: the <b>global filter</b> lets each person explore their region or channel without you building a dashboard for each.',
        },
        tip: { es: 'Probá tu dashboard con el filtro puesto: ¿se sigue entendiendo?', en: 'Try your dashboard with the filter on: is it still clear?' },
      },
    },
  });

  // ---------------------------------------------------------------------------
  // Dashboard comercial
  // ---------------------------------------------------------------------------
  C.register('m13_sales', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [90, 120], [160, 220], [260, 340]);
    const months = MONTHS.slice(0, 6).map(C.L2);
    const regs = REGIONS.slice(0, 4).map(C.L2);
    const chans = [['Tienda', 'Store'], ['Online', 'Online'], ['Mayorista', 'Wholesale']].map(C.L2);
    const focus = r.pick(chans);
    let rows;
    let regFocus;
    do {
      const w = regs.map(() => 0.5 + r.next());
      const wf = regs.map(() => 0.5 + r.next());
      rows = Array.from({ length: n }, () => {
        const ch = r.pick(chans);
        const g = weighted(r, ch === focus ? wf : w);
        return [months[r.int(0, 5)], regs[g], ch, r.step(500, 9000, 50)];
      }).sort((a, b) => months.indexOf(a[0]) - months.indexOf(b[0]));
      regFocus = regs.map((g) => sum(rows.filter((x) => x[2] === focus && x[1] === g).map((x) => x[3])));
    } while (C.uniqueExtreme(regFocus) < 0);
    const H = { m: T('Mes', 'Month'), reg: T('Región', 'Region'), ch: T('Canal', 'Channel'), amt: T('Monto', 'Amount') };
    const table = C.table([H.m, H.reg, H.ch, H.amt], rows, { time: [H.m] });
    const sol = {
      title: T('Ventas · Primer semestre', 'Sales · First half'),
      filter: { field: H.ch, values: [focus] },
      tiles: [
        kpi('a', T('Ventas totales', 'Total sales'), H.amt, 'SUM', 'money'),
        kpi('b', T('Operaciones', 'Deals'), Ch.COUNT_FIELD, 'COUNT', 'num'),
        chartTile('c', { mark: 'line', columns: { field: H.m }, rows: { field: H.amt, agg: 'SUM' }, title: T('Evolución mensual', 'Monthly trend') }),
        chartTile('d', { mark: 'bar', columns: { field: H.reg }, rows: { field: H.amt, agg: 'SUM' }, sort: 'desc', title: T('Ventas por región', 'Sales by region') }),
      ],
    };
    return {
      from: 'bruno',
      dept: 'ventas',
      subject: T('Quiero un dashboard comercial', 'I want a sales dashboard'),
      file: T('dashboard_comercial.bi', 'sales_dashboard.bi'),
      email: T(
        `<p>Todos los lunes respondo las mismas preguntas: <b>¿cuánto vendimos?</b>, <b>¿en cuántas operaciones?</b>, <b>¿cómo viene mes a mes?</b> y <b>¿qué región vende más?</b>. Y cada gerente quiere ver solo su <b>canal</b>.</p><p>Armame un dashboard desde cero que responda eso.</p>`,
        `<p>Every Monday I answer the same questions: <b>how much did we sell?</b>, <b>in how many deals?</b>, <b>how is it going month by month?</b> and <b>which region sells the most?</b>. And each manager wants to see only their <b>channel</b>.</p><p>Build me a dashboard from scratch that answers that.</p>`
      ),
      dashboard: { table, money: [H.amt] },
      objectives: [
        { text: T('Un <b>título</b> para el dashboard.', 'A <b>title</b> for the dashboard.'), hint: T('Arriba a la izquierda, por ejemplo "Ventas · Primer semestre".', 'Top left, for example "Sales · First half".'), check: titled },
        {
          text: T(`KPIs: <b>ventas totales</b> (Suma de ${H.amt}) y <b>cantidad de operaciones</b> (Recuento).`, `KPIs: <b>total sales</b> (Sum of ${H.amt}) and <b>number of deals</b> (Count).`),
          hint: T('＋ KPI dos veces. Para operaciones elegí "Cantidad de registros".', '＋ KPI twice. For deals choose "Number of records".'),
          check: all(D.hasKpi({ field: H.amt, aggs: ['SUM'] }), D.hasKpi({ field: Ch.COUNT_FIELD, aggs: ['COUNT'] })),
        },
        { text: T(`Un gráfico de <b>líneas</b> con la evolución de las ventas por <b>${H.m}</b>.`, `A <b>line</b> chart with sales trend by <b>${H.m}</b>.`), hint: T(`${H.m} en Columnas, ${H.amt} en Filas, Líneas.`, `${H.m} on Columns, ${H.amt} on Rows, Lines.`), check: D.hasChart({ marks: ['line'], dim: H.m, measure: H.amt, aggs: ['SUM'], sort: 'none' }) },
        { text: T(`Un gráfico de <b>barras ordenadas</b> de ventas por <b>${H.reg}</b>.`, `A <b>sorted bar</b> chart of sales by <b>${H.reg}</b>.`), hint: T('Barras + Ordenar: mayor a menor.', 'Bars + Sort: largest first.'), check: D.hasChart({ marks: ['bar'], dim: H.reg, measure: H.amt, aggs: ['SUM'], sort: 'desc' }) },
        { text: T(`Un <b>filtro global</b> por <b>${H.ch}</b>, y entre 4 y 6 elementos en total.`, `A <b>global filter</b> by <b>${H.ch}</b>, and 4 to 6 elements in total.`), hint: T('"Filtro global" arriba.', '"Global filter" at the top.'), check: all(D.globalFilter(H.ch), sizeOk) },
        { text: T(`❓ Probalo: en el canal <b>${focus}</b>, ¿qué región vende más?`, `❓ Try it: in the <b>${focus}</b> channel, which region sells the most?`), placeholder: T('Región', 'Region'), hint: T(`Dejá el filtro solo en ${focus} y mirá las barras.`, `Leave the filter only on ${focus} and look at the bars.`), answer: V.answerText([regs[C.uniqueExtreme(regFocus)]]) },
      ],
      tips: [T('Orden sugerido: KPIs, evolución, detalle.', 'Suggested order: KPIs, trend, breakdown.'), T('Usá el editor de gráficos igual que en el Nivel 6.', 'Use the chart editor just like in Level 6.')],
      feedback: T('¡Ahora los gerentes se lo responden solos! Me liberaste los lunes. 🙌', 'Now the managers answer it themselves! You freed up my Mondays. 🙌'),
      solution: { dashboard: sol, answers: { 5: regs[C.uniqueExtreme(regFocus)] } },
    };
  });

  // ---------------------------------------------------------------------------
  // Dashboard de soporte
  // ---------------------------------------------------------------------------
  C.register('m13_support', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [90, 120], [160, 220], [260, 340]);
    const weeks = Array.from({ length: 10 }, (_, i) => T('Sem ', 'Wk ') + String(i + 1).padStart(2, '0'));
    const cats = [['Facturación', 'Billing'], ['Envíos', 'Shipping'], ['Producto roto', 'Broken product'], ['Devoluciones', 'Returns'], ['Cuenta', 'Account']].map(C.L2);
    const prios = [['Alta', 'High'], ['Media', 'Medium'], ['Baja', 'Low']].map(C.L2);
    let rows;
    let hiAvg;
    do {
      const w = cats.map(() => r.next() + 0.2);
      rows = Array.from({ length: n }, (_, i) => {
        const p = r.int(0, 2);
        return ['T-' + (1001 + i), weeks[Math.min(9, Math.floor((i / n) * 10))], cats[weighted(r, w)], prios[p], r.int(2, 30) + (2 - p) * r.int(0, 12)];
      });
      const hi = rows.filter((x) => x[3] === prios[0]).map((x) => x[4]);
      hiAvg = sum(hi) / hi.length;
    } while (!isFinite(hiAvg));
    const H = { id: 'Ticket', w: T('Semana', 'Week'), cat: T('Categoría', 'Category'), pr: T('Prioridad', 'Priority'), h: T('Horas', 'Hours') };
    const table = C.table([H.id, H.w, H.cat, H.pr, H.h], rows, { time: [H.w] });
    const sol = {
      title: T('Soporte · Últimas 10 semanas', 'Support · Last 10 weeks'),
      filter: { field: H.pr, values: [prios[0]] },
      tiles: [
        kpi('a', T('Tickets', 'Tickets'), Ch.COUNT_FIELD, 'COUNT', 'num'),
        kpi('b', T('Horas promedio de resolución', 'Average hours to resolve'), H.h, 'AVG', 'num'),
        chartTile('c', { mark: 'line', columns: { field: H.w }, rows: { field: Ch.COUNT_FIELD, agg: 'COUNT' }, title: T('Tickets por semana', 'Tickets per week') }),
        chartTile('d', { mark: 'bar', columns: { field: H.cat }, rows: { field: Ch.COUNT_FIELD, agg: 'COUNT' }, sort: 'desc', title: T('Tickets por categoría', 'Tickets by category') }),
      ],
    };
    return {
      from: 'camila',
      dept: 'data',
      subject: T('Dashboard para el equipo de soporte', 'Dashboard for the support team'),
      file: T('dashboard_soporte.bi', 'support_dashboard.bi'),
      email: T(
        '<p>El equipo de soporte necesita ver: <b>cuántos tickets</b> entran, <b>cuánto tardan</b> en resolverlos (en promedio), <b>cómo viene semana a semana</b> y <b>de qué categoría</b> son. Y poder mirar solo los de cierta <b>prioridad</b>.</p>',
        '<p>The support team needs to see: <b>how many tickets</b> come in, <b>how long</b> they take to resolve (on average), <b>how it trends week by week</b> and <b>which category</b> they are. And to look at a given <b>priority</b> only.</p>'
      ),
      dashboard: { table },
      objectives: [
        { text: T('Un <b>título</b> para el dashboard.', 'A <b>title</b> for the dashboard.'), hint: T('Por ejemplo "Soporte · Últimas 10 semanas".', 'For example "Support · Last 10 weeks".'), check: titled },
        { text: T(`KPIs: <b>cantidad de tickets</b> y <b>promedio de ${H.h}</b>.`, `KPIs: <b>number of tickets</b> and <b>average ${H.h}</b>.`), hint: T(`Para el tiempo, ${H.h} con Promedio (sumar horas no dice nada).`, `For time, ${H.h} with Average (summing hours means nothing).`), check: all(D.hasKpi({ field: Ch.COUNT_FIELD, aggs: ['COUNT'] }), D.hasKpi({ field: H.h, aggs: ['AVG'] })) },
        { text: T(`<b>Líneas</b>: tickets por <b>${H.w}</b>.`, `<b>Lines</b>: tickets per <b>${H.w}</b>.`), hint: T(`${H.w} en Columnas y Cantidad de registros en Filas.`, `${H.w} on Columns and Number of records on Rows.`), check: D.hasChart({ marks: ['line'], dim: H.w, aggs: ['COUNT'], sort: 'none' }) },
        { text: T(`<b>Barras ordenadas</b>: tickets por <b>${H.cat}</b>.`, `<b>Sorted bars</b>: tickets by <b>${H.cat}</b>.`), hint: T('Barras, mayor a menor.', 'Bars, largest first.'), check: D.hasChart({ marks: ['bar'], dim: H.cat, aggs: ['COUNT'], sort: 'desc' }) },
        { text: T(`<b>Filtro global</b> por <b>${H.pr}</b>, y entre 4 y 6 elementos.`, `<b>Global filter</b> by <b>${H.pr}</b>, and 4 to 6 elements.`), hint: T('"Filtro global" arriba.', '"Global filter" at the top.'), check: all(D.globalFilter(H.pr), sizeOk) },
        {
          text: T(`❓ Con el filtro en prioridad <b>${prios[0]}</b>, ¿cuántas horas tardan en promedio? (un decimal)`, `❓ With the filter on <b>${prios[0]}</b> priority, how many hours do they take on average? (one decimal)`),
          placeholder: T('Horas', 'Hours'),
          hint: T('Leelo del KPI de horas.', 'Read it from the hours KPI.'),
          answer: V.answerNumber(hiAvg, 0.06),
        },
      ],
      tips: [T('Tickets = "Cantidad de registros" (Recuento).', 'Tickets = "Number of records" (Count).'), T('Semanas en orden: no las ordenes por valor.', 'Weeks in order: don\'t sort them by value.')],
      feedback: T('¡El equipo lo tiene en la tele de la oficina! Gracias.', 'The team has it on the office TV! Thanks.'),
      solution: { dashboard: sol, answers: { 5: String(Math.round(hiAvg * 10) / 10) } },
    };
  });

  // ---------------------------------------------------------------------------
  // Dashboard de personas (RR.HH.)
  // ---------------------------------------------------------------------------
  C.register('m13_hr', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [60, 80], [120, 160], [200, 260]);
    const areas = C.DATA.AREAS.map(C.L2);
    const sites = r.sample(CITIES, 3);
    const modes = [['Presencial', 'On-site'], ['Híbrido', 'Hybrid'], ['Remoto', 'Remote']].map(C.L2);
    const site = sites[r.int(0, 2)];
    const rows = Array.from({ length: n }, () => [r.pick(areas), r.pick(sites), modes[weighted(r, [3, 4, 2])], r.int(0, 15), r.step(500000, 1600000, 5000)]);
    if (!rows.some((x) => x[1] === site)) rows[0][1] = site;
    const H = { area: T('Área', 'Area'), site: T('Sede', 'Site'), mode: T('Modalidad', 'Work mode'), yrs: T('Antigüedad', 'Tenure'), sal: T('Sueldo', 'Salary') };
    const table = C.table([H.area, H.site, H.mode, H.yrs, H.sal], rows);
    const nSite = rows.filter((x) => x[1] === site).length;
    const sol = {
      title: T('Personas · Dotación', 'People · Headcount'),
      filter: { field: H.site, values: [site] },
      tiles: [
        kpi('a', T('Empleados', 'Employees'), Ch.COUNT_FIELD, 'COUNT', 'num'),
        kpi('b', T('Sueldo promedio', 'Average salary'), H.sal, 'AVG', 'money'),
        chartTile('c', { mark: 'bar', columns: { field: H.area }, rows: { field: Ch.COUNT_FIELD, agg: 'COUNT' }, sort: 'desc', title: T('Empleados por área', 'Employees by area') }),
        chartTile('d', { mark: 'pie', columns: { field: H.mode }, rows: { field: Ch.COUNT_FIELD, agg: 'COUNT' }, title: T('Modalidad de trabajo', 'Work mode') }),
      ],
    };
    return {
      from: 'paula',
      dept: 'rrhh',
      subject: T('Dashboard de dotación', 'Headcount dashboard'),
      file: T('dashboard_personas.bi', 'people_dashboard.bi'),
      email: T(
        `<p>Dirección pregunta seguido: <b>cuántos somos</b>, <b>cuánto cobramos en promedio</b>, <b>cómo se reparte la gente por área</b> y <b>qué parte trabaja remoto, híbrido o presencial</b>. Cada sede quiere ver lo suyo.</p>`,
        `<p>Management often asks: <b>how many we are</b>, <b>what the average salary is</b>, <b>how people are split by area</b> and <b>what share works remote, hybrid or on-site</b>. Each site wants to see its own.</p>`
      ),
      dashboard: { table, money: [H.sal] },
      objectives: [
        { text: T('Un <b>título</b> para el dashboard.', 'A <b>title</b> for the dashboard.'), hint: T('Por ejemplo "Personas · Dotación".', 'For example "People · Headcount".'), check: titled },
        { text: T(`KPIs: <b>empleados</b> (Recuento) y <b>${H.sal} promedio</b>.`, `KPIs: <b>employees</b> (Count) and <b>average ${H.sal}</b>.`), hint: T('Sueldo con Promedio, no con Suma.', 'Salary with Average, not Sum.'), check: all(D.hasKpi({ field: Ch.COUNT_FIELD, aggs: ['COUNT'] }), D.hasKpi({ field: H.sal, aggs: ['AVG'] })) },
        { text: T(`<b>Barras ordenadas</b>: empleados por <b>${H.area}</b>.`, `<b>Sorted bars</b>: employees by <b>${H.area}</b>.`), hint: T('Barras, mayor a menor.', 'Bars, largest first.'), check: D.hasChart({ marks: ['bar'], dim: H.area, aggs: ['COUNT'], sort: 'desc' }) },
        { text: T(`Cómo se reparte la gente por <b>${H.mode}</b> (son solo 3: una torta funciona).`, `How people split by <b>${H.mode}</b> (only 3: a pie works).`), hint: T(`${H.mode} + Cantidad de registros, Torta o barras.`, `${H.mode} + Number of records, Pie or bars.`), check: D.hasChart({ marks: ['pie', 'bar'], dim: H.mode, aggs: ['COUNT'] }) },
        { text: T(`<b>Filtro global</b> por <b>${H.site}</b>, y entre 4 y 6 elementos.`, `<b>Global filter</b> by <b>${H.site}</b>, and 4 to 6 elements.`), hint: T('"Filtro global" arriba.', '"Global filter" at the top.'), check: all(D.globalFilter(H.site), sizeOk) },
        { text: T(`❓ ¿Cuántas personas trabajan en la sede <b>${site}</b>?`, `❓ How many people work at the <b>${site}</b> site?`), placeholder: T('Cantidad', 'Count'), hint: T(`Filtro en ${site} y mirá el KPI.`, `Filter on ${site} and look at the KPI.`), answer: V.answerNumber(nSite, 0) },
      ],
      tips: [T('Torta solo con pocas porciones (hasta 5-6) y para "partes de un todo".', 'Pie only with few slices (up to 5-6) and for "parts of a whole".'), T('Un promedio de sueldos con filtro por sede es mucho más útil que uno general.', 'An average salary filtered by site is much more useful than a general one.')],
      feedback: T('Dirección ya lo pidió para la reunión mensual. ¡Excelente diseño!', 'Management already asked for it for the monthly meeting. Excellent design!'),
      solution: { dashboard: sol, answers: { 5: String(nSite) } },
    };
  });

  // ---------------------------------------------------------------------------
  // Dashboard de campañas (incluye dispersión)
  // ---------------------------------------------------------------------------
  C.register('m13_marketing', (ctx) => {
    const r = ctx.rng;
    const nCamp = ctx.size === 'large' ? 30 : ctx.size === 'medium' ? 22 : 14;
    const chans = [['Redes', 'Social'], ['Buscadores', 'Search'], ['Email', 'Email'], ['Afiliados', 'Affiliates']].map(C.L2);
    let rows;
    let best;
    do {
      const eff = chans.map(() => 0.01 + r.next() * 0.03);
      rows = Array.from({ length: nCamp }, (_, i) => {
        const c = r.int(0, 3);
        const spend = r.step(1000, 20000, 100);
        const clicks = Math.round(spend * (0.3 + r.next() * 0.4));
        return [`${T('Campaña', 'Campaign')} ${String(i + 1).padStart(2, '0')}`, chans[c], spend, clicks, Math.round(spend * eff[c] * (0.6 + r.next() * 0.8))];
      });
      best = C.uniqueExtreme(rows.map((x) => x[4]));
    } while (best < 0);
    const H = { camp: T('Campaña', 'Campaign'), ch: T('Canal', 'Channel'), spend: T('Inversión', 'Spend'), clicks: T('Clics', 'Clicks'), conv: T('Conversiones', 'Conversions') };
    const table = C.table([H.camp, H.ch, H.spend, H.clicks, H.conv], rows);
    const sol = {
      title: T('Marketing · Campañas del trimestre', 'Marketing · Quarter campaigns'),
      filter: { field: H.ch, values: chans },
      tiles: [
        kpi('a', T('Inversión total', 'Total spend'), H.spend, 'SUM', 'money'),
        kpi('b', T('Conversiones', 'Conversions'), H.conv, 'SUM', 'num'),
        chartTile('c', { mark: 'scatter', columns: { field: H.spend, agg: 'SUM' }, rows: { field: H.conv, agg: 'SUM' }, title: T('¿Más inversión, más conversiones?', 'More spend, more conversions?') }),
        chartTile('d', { mark: 'bar', columns: { field: H.ch }, rows: { field: H.conv, agg: 'SUM' }, sort: 'desc', title: T('Conversiones por canal', 'Conversions by channel') }),
      ],
    };
    return {
      from: 'tadeo',
      dept: 'marketing',
      subject: T('Dashboard de campañas', 'Campaign dashboard'),
      file: T('dashboard_campanas.bi', 'campaign_dashboard.bi'),
      email: T(
        '<p>Quiero ver de un vistazo: <b>cuánto invertimos</b>, <b>cuántas conversiones</b> logramos, si <b>las campañas con más inversión convierten más</b> y <b>qué canal</b> rinde mejor. Con filtro por canal.</p>',
        '<p>I want to see at a glance: <b>how much we spent</b>, <b>how many conversions</b> we got, whether <b>campaigns with more spend convert more</b> and <b>which channel</b> performs best. With a channel filter.</p>'
      ),
      dashboard: { table, money: [H.spend] },
      objectives: [
        { text: T('Un <b>título</b> para el dashboard.', 'A <b>title</b> for the dashboard.'), hint: T('Por ejemplo "Marketing · Campañas".', 'For example "Marketing · Campaigns".'), check: titled },
        { text: T(`KPIs: <b>${H.spend} total</b> y <b>${H.conv} totales</b>.`, `KPIs: <b>total ${H.spend}</b> and <b>total ${H.conv}</b>.`), hint: T('Las dos con Suma.', 'Both with Sum.'), check: all(D.hasKpi({ field: H.spend, aggs: ['SUM'] }), D.hasKpi({ field: H.conv, aggs: ['SUM'] })) },
        { text: T(`Una <b>dispersión</b>: ${H.spend} (horizontal) vs ${H.conv} (vertical), un punto por campaña.`, `A <b>scatter</b>: ${H.spend} (horizontal) vs ${H.conv} (vertical), one dot per campaign.`), hint: T(`${H.spend} en Columnas y ${H.conv} en Filas.`, `${H.spend} on Columns and ${H.conv} on Rows.`), check: D.hasChart({ marks: ['scatter'], x: H.spend, y: H.conv }) },
        { text: T(`<b>Barras ordenadas</b>: ${H.conv} por <b>${H.ch}</b>.`, `<b>Sorted bars</b>: ${H.conv} by <b>${H.ch}</b>.`), hint: T('Barras, mayor a menor.', 'Bars, largest first.'), check: D.hasChart({ marks: ['bar'], dim: H.ch, measure: H.conv, aggs: ['SUM'], sort: 'desc' }) },
        { text: T(`<b>Filtro global</b> por <b>${H.ch}</b>, y entre 4 y 6 elementos.`, `<b>Global filter</b> by <b>${H.ch}</b>, and 4 to 6 elements.`), hint: T('"Filtro global" arriba.', '"Global filter" at the top.'), check: all(D.globalFilter(H.ch), sizeOk) },
        { text: T('❓ ¿Qué campaña tuvo <b>más conversiones</b>? (el punto más alto de la dispersión)', '❓ Which campaign had the <b>most conversions</b>? (the highest dot in the scatter)'), placeholder: T('Campaña', 'Campaign'), hint: T('Pasá el mouse por el punto más alto.', 'Hover over the highest dot.'), answer: V.answerText([rows[best][0]]) },
      ],
      tips: [T('Dos medidas → dispersión: cada punto es una campaña.', 'Two measures → scatter: each dot is a campaign.'), T('Pasá el mouse sobre un punto para ver de qué campaña es.', 'Hover over a dot to see which campaign it is.')],
      feedback: T('Ya vi qué campañas son puntos "arriba a la izquierda": baratas y que convierten. ¡A esas les damos más!', 'I can see which campaigns are "top left" dots: cheap and converting. We\'ll give those more!'),
      solution: { dashboard: sol, answers: { 5: rows[best][0] } },
    };
  });

  // ---------------------------------------------------------------------------
  // Dashboard de logística (barras apiladas con color)
  // ---------------------------------------------------------------------------
  C.register('m13_logistics', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [90, 120], [160, 220], [260, 340]);
    const weeks = Array.from({ length: 8 }, (_, i) => T('Sem ', 'Wk ') + String(i + 1).padStart(2, '0'));
    const cars = r.sample(CARRIERS, 4);
    const regs = REGIONS.slice(0, 4).map(C.L2);
    const states = [['Entregado', 'Delivered'], ['Demorado', 'Delayed']].map(C.L2);
    const focus = r.pick(regs);
    let rows;
    let late;
    do {
      const bad = cars.map(() => 0.08 + r.next() * 0.35);
      rows = Array.from({ length: n }, (_, i) => {
        const c = r.int(0, 3);
        return [weeks[Math.min(7, Math.floor((i / n) * 8))], cars[c], r.pick(regs), r.chance(bad[c]) ? states[1] : states[0], r.step(800, 3000, 10)];
      });
      late = cars.map((c) => rows.filter((x) => x[1] === c && x[2] === focus && x[3] === states[1]).length);
    } while (C.uniqueExtreme(late) < 0);
    const H = { w: T('Semana', 'Week'), car: T('Transportista', 'Carrier'), reg: T('Región', 'Region'), st: T('Estado', 'Status'), cost: T('Costo', 'Cost') };
    const table = C.table([H.w, H.car, H.reg, H.st, H.cost], rows, { time: [H.w] });
    const sol = {
      title: T('Logística · Envíos', 'Logistics · Shipments'),
      filter: { field: H.reg, values: [focus] },
      tiles: [
        kpi('a', T('Envíos', 'Shipments'), Ch.COUNT_FIELD, 'COUNT', 'num'),
        kpi('b', T('Costo promedio', 'Average cost'), H.cost, 'AVG', 'money'),
        chartTile('c', { mark: 'line', columns: { field: H.w }, rows: { field: Ch.COUNT_FIELD, agg: 'COUNT' }, title: T('Envíos por semana', 'Shipments per week') }),
        chartTile('d', { mark: 'bar', columns: { field: H.car }, rows: { field: Ch.COUNT_FIELD, agg: 'COUNT' }, color: H.st, title: T('Estado por transportista', 'Status by carrier') }),
      ],
    };
    return {
      from: 'ramiro',
      dept: 'logistica',
      subject: T('Dashboard de envíos', 'Shipments dashboard'),
      file: T('dashboard_envios.bi', 'shipments_dashboard.bi'),
      email: T(
        `<p>Necesito un tablero para seguir: <b>cuántos envíos</b> hacemos, el <b>costo promedio</b>, la <b>evolución semanal</b> y <b>cuántos entregados y demorados tiene cada transportista</b> (en el mismo gráfico). Con filtro por región.</p>`,
        `<p>I need a board to track: <b>how many shipments</b> we make, the <b>average cost</b>, the <b>weekly trend</b> and <b>how many delivered and delayed each carrier has</b> (in the same chart). With a region filter.</p>`
      ),
      dashboard: { table, money: [H.cost] },
      objectives: [
        { text: T('Un <b>título</b> para el dashboard.', 'A <b>title</b> for the dashboard.'), hint: T('Por ejemplo "Logística · Envíos".', 'For example "Logistics · Shipments".'), check: titled },
        { text: T(`KPIs: <b>envíos</b> (Recuento) y <b>${H.cost} promedio</b>.`, `KPIs: <b>shipments</b> (Count) and <b>average ${H.cost}</b>.`), hint: T('Costo con Promedio.', 'Cost with Average.'), check: all(D.hasKpi({ field: Ch.COUNT_FIELD, aggs: ['COUNT'] }), D.hasKpi({ field: H.cost, aggs: ['AVG'] })) },
        { text: T(`<b>Líneas</b>: envíos por <b>${H.w}</b>.`, `<b>Lines</b>: shipments per <b>${H.w}</b>.`), hint: T(`${H.w} + Cantidad de registros.`, `${H.w} + Number of records.`), check: D.hasChart({ marks: ['line'], dim: H.w, aggs: ['COUNT'], sort: 'none' }) },
        { text: T(`<b>Barras apiladas</b>: envíos por <b>${H.car}</b>, con <b>${H.st}</b> en Color.`, `<b>Stacked bars</b>: shipments by <b>${H.car}</b>, with <b>${H.st}</b> on Color.`), hint: T(`${H.st} al estante Color.`, `${H.st} onto the Color shelf.`), check: D.hasChart({ marks: ['bar'], dim: H.car, aggs: ['COUNT'], color: H.st }) },
        { text: T(`<b>Filtro global</b> por <b>${H.reg}</b>, y entre 4 y 6 elementos.`, `<b>Global filter</b> by <b>${H.reg}</b>, and 4 to 6 elements.`), hint: T('"Filtro global" arriba.', '"Global filter" at the top.'), check: all(D.globalFilter(H.reg), sizeOk) },
        { text: T(`❓ En la región <b>${focus}</b>, ¿qué transportista tiene <b>más envíos demorados</b>?`, `❓ In the <b>${focus}</b> region, which carrier has the <b>most delayed shipments</b>?`), placeholder: T('Transportista', 'Carrier'), hint: T(`Filtro en ${focus} y mirá la parte "${states[1]}" de cada barra.`, `Filter on ${focus} and look at the "${states[1]}" part of each bar.`), answer: V.answerText([cars[C.uniqueExtreme(late)]]) },
      ],
      tips: [T('Color con una dimensión = barras apiladas: total y composición en un solo gráfico.', 'Color with a dimension = stacked bars: total and composition in one chart.'), T('Pasá el mouse por cada tramo para ver el número.', 'Hover over each segment to see the number.')],
      feedback: T('Con este tablero ya detecté qué transportista falla en qué región. ¡Gracias!', 'With this board I already spotted which carrier fails in which region. Thanks!'),
      solution: { dashboard: sol, answers: { 5: cars[C.uniqueExtreme(late)] } },
    };
  });
})();
