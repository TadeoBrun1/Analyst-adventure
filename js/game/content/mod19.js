/*
 * Analyst Adventure — Nivel 19 (etapa Senior): resumen ejecutivo.
 * Calcular los números clave y armar una página para Dirección: qué pasó, por qué, qué hacer
 * y un gráfico de respaldo. Sin jerga, sin metodología primero, sin causas inventadas.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const C = AA.Content;
  const V = AA.V;
  const Ch = AA.Chart;
  const T = (es, en) => AA.T(es, en);
  const { REGIONS, AREAS } = C.DATA;
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const pct = (x) => (Math.round(x * 1000) / 10).toLocaleString('en-US') + '%';
  const money = (x) => C.money(Math.round(x));
  const spec = (o) => Object.assign(Ch.emptySpec(), o);

  C.module({
    id: 'mod19',
    title: { es: 'Resumen ejecutivo', en: 'Executive summary' },
    xp: 220,
    tier: 3,
    skills: ['execWhat', 'execNumbers', 'execAction', 'execAvoid'],
    templates: ['m19_quarter', 'm19_costs', 'm19_ab', 'm19_churn', 'm19_turnover'],
    seeds: [1901, 1902, 1903, 1904, 1905],
    intro: {
      es: 'Último nivel de la etapa Senior. La Gerente General tiene <b>cinco minutos</b> entre reunión y reunión. Tu análisis puede ser brillante, pero si no entra en una página que se lea en ese tiempo, no existe. Hoy aprendés a escribir <b>resúmenes ejecutivos</b>.',
      en: "Last level of the Senior stage. The General Manager has <b>five minutes</b> between meetings. Your analysis may be brilliant, but if it doesn't fit on one page that can be read in that time, it doesn't exist. Today you learn to write <b>executive summaries</b>.",
    },
    skillDefs: {
      execWhat: {
        title: { es: 'Qué pasó, por qué, qué hacer', en: 'What happened, why, what to do' },
        say: {
          es: 'Un resumen ejecutivo empieza por la <b>conclusión</b> (no por cómo hiciste el análisis): <b>qué pasó</b> (con el número clave), <b>por qué</b> (la causa que muestran los datos) y <b>qué recomendás</b>. Si alguien lee solo la primera línea, ya tiene que saber lo importante.',
          en: 'An executive summary starts with the <b>conclusion</b> (not with how you did the analysis): <b>what happened</b> (with the key number), <b>why</b> (the cause the data shows) and <b>what you recommend</b>. If someone reads only the first line, they must already know what matters.',
        },
        tip: { es: 'Es la "pirámide invertida" de los periodistas: lo más importante, arriba.', en: "It's the journalists' \"inverted pyramid\": the most important thing goes on top." },
      },
      execNumbers: {
        title: { es: 'Pocos números, bien elegidos', en: 'Few numbers, well chosen' },
        say: {
          es: 'Dos o tres números, <b>redondeados</b> ("94%", "$1,2M") y siempre <b>comparados</b> (contra la meta, contra el año pasado). "$1.183.442,17" no ayuda; "6% debajo de la meta" sí.',
          en: 'Two or three numbers, <b>rounded</b> ("94%", "$1.2M") and always <b>compared</b> (against target, against last year). "$1,183,442.17" doesn\'t help; "6% below target" does.',
        },
        tip: { es: 'Un número sin comparación no dice si es bueno o malo.', en: "A number without a comparison doesn't say whether it's good or bad." },
      },
      execAction: {
        title: { es: 'Recomendación concreta', en: 'Concrete recommendation' },
        say: {
          es: 'La recomendación dice <b>qué</b>, <b>quién</b>, <b>cuándo</b> y <b>cómo vamos a medir</b> si funcionó. Tiene que estar enfocada donde los datos muestran el problema.',
          en: 'The recommendation says <b>what</b>, <b>who</b>, <b>when</b> and <b>how we\'ll measure</b> whether it worked. It must focus where the data shows the problem.',
        },
        tip: { es: '"Seguir monitoreando" no es una recomendación.', en: '"Keep monitoring" is not a recommendation.' },
      },
      execAvoid: {
        title: { es: 'Qué evitar', en: 'What to avoid' },
        say: {
          es: 'Evitá la <b>jerga técnica</b> ("z = 2,48", "p-valor"), la <b>metodología al principio</b> ("primero limpiamos los datos…"), las <b>causas que no muestran los datos</b> ("fue la economía") y los gráficos complejos. Lo técnico va en un anexo para quien lo pida.',
          en: 'Avoid <b>technical jargon</b> ("z = 2.48", "p-value"), <b>methodology first</b> ("first we cleaned the data…"), <b>causes the data doesn\'t show</b> ("it was the economy") and complex charts. Technical details go in an appendix for whoever asks.',
        },
        tip: { es: 'Probá leérselo en voz alta a alguien de otra área: si pregunta "¿y qué significa?", reescribilo.', en: 'Try reading it aloud to someone from another team: if they ask "so what does that mean?", rewrite it.' },
      },
    },
  });

  // Arma el resumen ejecutivo y sus objetivos.
  function exec(heading, parts) {
    const ok = (list) => list.filter((o) => o.ok).map((o) => o.id)[0];
    const sections = [
      { id: 'what', slot: 'title', label: T('Qué pasó', 'What happened'), prompt: T('El mensaje principal, con el número clave comparado.', 'The main message, with the key number compared.'), options: parts.what, correct: ok(parts.what) },
      { id: 'why', slot: 'text', tone: 'why', label: T('Por qué', 'Why'), short: T('Por qué', 'Why'), prompt: T('La causa que muestran tus datos, en lenguaje simple.', 'The cause your data shows, in plain language.'), options: parts.why, correct: ok(parts.why) },
      { id: 'action', slot: 'text', tone: 'action', label: T('Qué recomendamos', 'What we recommend'), short: T('Qué recomendamos', 'What we recommend'), prompt: T('Qué, quién, cuándo y cómo se mide.', 'What, who, when and how it is measured.'), options: parts.action, correct: ok(parts.action) },
      { id: 'chart', slot: 'chart', label: T('Gráfico de respaldo', 'Supporting chart'), prompt: T('Uno solo, que se entienda en segundos.', 'Just one, understood in seconds.'), options: parts.charts, correct: ok(parts.charts) },
    ];
    sections.forEach((s) => s.options.forEach((o) => delete o.ok));
    const report = { kind: 'exec', heading, sections };
    const objectives = sections.map((s) => ({ text: T(`Resumen: elegí <b>${s.label.toLowerCase()}</b>.`, `Summary: choose <b>${s.label.toLowerCase()}</b>.`), hint: s.prompt, check: AA.Report.section(report, s.id) }));
    return { report, objectives, solution: Object.fromEntries(sections.map((s) => [s.id, s.correct])) };
  }
  const W = {
    descriptive: () => T('Describe, pero no dice si es bueno o malo ni dónde está el problema.', "It describes, but doesn't say whether it's good or bad or where the problem is."),
    method: () => T('Empieza por la metodología: a Dirección le importa la conclusión.', 'It starts with methodology: Management cares about the conclusion.'),
    jargon: () => T('Jerga técnica: va en un anexo, no en el resumen.', 'Technical jargon: it goes in an appendix, not in the summary.'),
    unsupported: () => T('Tus datos no muestran eso: es una opinión.', "Your data doesn't show that: it's an opinion."),
    monitor: () => T('No es una acción concreta.', 'It is not a concrete action.'),
    broad: () => T('No está enfocada donde está el problema.', "It isn't focused where the problem is."),
  };

  // ---------------------------------------------------------------------------
  // Cierre de trimestre vs meta
  // ---------------------------------------------------------------------------
  C.register('m19_quarter', (ctx) => {
    const r = ctx.rng;
    const regs = REGIONS.map(C.L2);
    const bad = r.int(0, 4);
    let goal;
    let real;
    let gap;
    do {
      goal = regs.map(() => r.step(800000, 2000000, 10000));
      real = goal.map((g, i) => Math.round((g * (i === bad ? 0.68 + r.next() * 0.1 : 0.97 + r.next() * 0.08)) / 1000) * 1000);
      gap = real.map((x, i) => x - goal[i]);
    } while (sum(gap) >= 0 || C.uniqueExtreme(gap, true) !== bad);
    const att = real.map((x, i) => x / goal[i]);
    const totAtt = sum(real) / sum(goal);
    // Parte de lo que NO se cumplió (solo regiones bajo meta) que explica la región problema.
    const share = gap[bad] / sum(gap.filter((g) => g < 0));
    const others = att.filter((_, i) => i !== bad);
    const table = C.table([T('Región', 'Region'), T('Cumplimiento (%)', 'Attainment (%)'), T('Ventas', 'Sales')], regs.map((g, i) => [g, Math.round(att[i] * 1000) / 10, real[i]]));
    const ex = exec(T('Resumen para Gerencia General · Cierre del trimestre', 'Summary for the General Manager · Quarter close'), {
      what: [
        { id: 'w1', ok: true, text: T(`Cerramos el trimestre al ${pct(totAtt)} de la meta (faltaron ${money(-sum(gap))}), y ${regs[bad]} explica el ${pct(share)} de lo que no se cumplió.`, `We closed the quarter at ${pct(totAtt)} of target (${money(-sum(gap))} short), and ${regs[bad]} accounts for ${pct(share)} of the shortfall.`) },
        { id: 'w2', text: T(`Las ventas del trimestre fueron ${money(sum(real))}.`, `Quarter sales were ${money(sum(real))}.`), why: W.descriptive() },
        { id: 'w3', text: T('Para este informe calculamos el cumplimiento dividiendo las ventas reales por la meta de cada región.', 'For this report we computed attainment by dividing actual sales by each region\'s target.'), why: W.method() },
      ],
      why: [
        { id: 'y1', ok: true, text: T(`${regs[bad]} llegó al ${pct(att[bad])} de su meta; el resto de las regiones cumplió entre ${pct(Math.min(...others))} y ${pct(Math.max(...others))}.`, `${regs[bad]} reached ${pct(att[bad])} of its target; the other regions achieved between ${pct(Math.min(...others))} and ${pct(Math.max(...others))}.`) },
        { id: 'y2', text: T('Por la situación económica del país.', "Because of the country's economic situation."), why: W.unsupported() },
        { id: 'y3', text: T('Porque las metas eran demasiado altas para todos.', 'Because targets were too high for everyone.'), why: T('Los datos dicen lo contrario: casi todas las regiones cumplieron.', 'The data says otherwise: almost every region met its target.') },
      ],
      action: [
        { id: 'a1', ok: true, text: T(`Que la gerencia de ${regs[bad]} presente en dos semanas las causas (equipo, clientes clave) y un plan de recuperación, con seguimiento mensual del cumplimiento.`, `Have ${regs[bad]} management present the causes (team, key accounts) and a recovery plan within two weeks, with monthly attainment tracking.`) },
        { id: 'a2', text: T('Bajar las metas del próximo trimestre para todas las regiones.', 'Lower next quarter\'s targets for every region.'), why: W.broad() },
        { id: 'a3', text: T('Seguir monitoreando las ventas.', 'Keep monitoring sales.'), why: W.monitor() },
      ],
      charts: [
        { id: 'c1', ok: true, chart: { table, spec: spec({ mark: 'bar', columns: { field: table.headers[0] }, rows: { field: table.headers[1], agg: 'SUM' }, sort: 'asc', title: T('Cumplimiento de meta por región (%)', 'Target attainment by region (%)') }) } },
        { id: 'c2', chart: { table, spec: spec({ mark: 'pie', columns: { field: table.headers[0] }, rows: { field: table.headers[2], agg: 'SUM' }, title: T('Ventas por región', 'Sales by region') }) }, why: T('Muestra cuánto vende cada región, no si cumplió su meta.', 'It shows how much each region sells, not whether it met its target.') },
        { id: 'c3', chart: { table, spec: spec({ mark: 'line', columns: { field: table.headers[0] }, rows: { field: table.headers[2], agg: 'SUM' }, title: T('Ventas', 'Sales') }) }, why: T('Líneas para regiones no tiene sentido (no son una secuencia), y no muestra la meta.', "Lines for regions make no sense (they aren't a sequence), and it doesn't show the target.") },
      ],
    });
    return {
      from: 'graciela',
      dept: 'gerencia',
      subject: T('¿Cómo cerramos el trimestre?', 'How did we close the quarter?'),
      file: T('cierre_trimestre.xlsx', 'quarter_close.xlsx'),
      email: T(
        '<p>Mañana tengo directorio. Necesito <b>una página</b>: cómo cerramos el trimestre contra la meta, por qué y qué proponés. Tengo cinco minutos para leerlo.</p>',
        '<p>I have a board meeting tomorrow. I need <b>one page</b>: how we closed the quarter against target, why, and what you propose. I have five minutes to read it.</p>'
      ),
      sheet: {
        cols: 6,
        rows: 9,
        colWidths: [120, 130, 130, 130, 130, 40],
        data: { at: 'A1', rows: [[T('Región', 'Region'), T('Meta', 'Target'), T('Real', 'Actual'), T('Cumplimiento', 'Attainment'), T('Diferencia', 'Gap')], ...regs.map((g, i) => [g, goal[i], real[i]]), ['Total']] },
        locked: ['A1:C6', 'D1:E1', 'A7'],
        header: ['A1:E1', 'A7:E7'],
        targets: ['D2:E6', 'B7:E7'],
        formats: { B: 'currency', C: 'currency', D: 'percent', E: 'currency' },
        start: 'D2',
      },
      objectives: [
        { text: T('<b>Cumplimiento</b> (D2:D6) = real ÷ meta, y <b>diferencia</b> (E2:E6) = real − meta.', '<b>Attainment</b> (D2:D6) = actual ÷ target, and <b>gap</b> (E2:E6) = actual − target.'), hint: 'D2: =C2/B2 · E2: =C2-B2', check: (S) => {
          const a = V.column('D', 2, 6, (row) => att[row - 2], { tol: 0.0005, refsFn: (row) => ['C' + row, 'B' + row] })(S);
          return a === true ? V.column('E', 2, 6, (row) => gap[row - 2], { refsFn: (row) => ['C' + row, 'B' + row] })(S) : a;
        } },
        { text: T('Fila 7: <b>totales</b> de meta y real, cumplimiento y diferencia totales.', 'Row 7: total <b>target</b> and <b>actual</b>, overall attainment and gap.'), hint: T('B7: =SUMA(B2:B6) · D7: =C7/B7', 'B7: =SUM(B2:B6) · D7: =C7/B7'), check: V.cells([['B7', sum(goal)], ['C7', sum(real)], ['D7', totAtt], ['E7', sum(gap)]], { tol: 0.0005 }) },
        ...ex.objectives,
      ],
      report: ex.report,
      tips: [T('Primero los números, después la página. Cada opción del resumen se verifica con tu planilla.', 'Numbers first, then the page. Every summary option is checked against your spreadsheet.'), T('El mensaje principal tiene que entenderse aunque no se lea nada más.', 'The main message must make sense even if nothing else is read.')],
      feedback: T('El directorio entendió el problema en un minuto y aprobó el plan para la región. Así se escribe para la gerencia.', 'The board understood the problem in one minute and approved the plan for the region. That\'s how you write for management.'),
      solution: { fill: [['D', 2, 6, '=C2/B2'], ['E', 2, 6, '=C2-B2']], cells: { B7: '=SUMA(B2:B6)', C7: '=SUMA(C2:C6)', D7: '=C7/B7', E7: '=C7-B7' }, report: ex.solution },
    };
  });

  // ---------------------------------------------------------------------------
  // Costos logísticos sobre presupuesto
  // ---------------------------------------------------------------------------
  C.register('m19_costs', (ctx) => {
    const r = ctx.rng;
    const items = [['Fletes urgentes', 'Express freight'], ['Combustible', 'Fuel'], ['Personal de depósito', 'Warehouse staff'], ['Alquiler de depósito', 'Warehouse rent'], ['Seguros', 'Insurance']].map(C.L2);
    const bad = r.int(0, 4);
    let budget;
    let actual;
    let diff;
    do {
      budget = items.map(() => r.step(300000, 1500000, 10000));
      actual = budget.map((b, i) => Math.round((b * (i === bad ? 1.45 + r.next() * 0.35 : 0.97 + r.next() * 0.07)) / 1000) * 1000);
      diff = actual.map((a, i) => a - budget[i]);
    } while (C.uniqueExtreme(diff) !== bad || sum(diff) <= 0 || diff[bad] / sum(diff.filter((d) => d > 0)) < 0.6);
    const over = sum(actual) / sum(budget) - 1;
    // Parte del exceso (solo conceptos que se pasaron) que explica el concepto problema.
    const share = diff[bad] / sum(diff.filter((d) => d > 0));
    const table = C.table([T('Concepto', 'Item'), T('Desvío ($)', 'Overrun ($)'), T('Gasto real', 'Actual spend')], items.map((it, i) => [it, diff[i], actual[i]]));
    const ex = exec(T('Resumen para Gerencia General · Costos logísticos', 'Summary for the General Manager · Logistics costs'), {
      what: [
        { id: 'w1', ok: true, text: T(`Los costos logísticos superaron el presupuesto en ${pct(over)} (${money(sum(diff))}); el ${pct(share)} del exceso es "${items[bad]}".`, `Logistics costs exceeded budget by ${pct(over)} (${money(sum(diff))}); ${pct(share)} of the overrun is "${items[bad]}".`) },
        { id: 'w2', text: T(`Gastamos ${money(sum(actual))} en logística.`, `We spent ${money(sum(actual))} on logistics.`), why: W.descriptive() },
        { id: 'w3', text: T('Analizamos 5 conceptos de costo con SUMA y desvíos porcentuales.', 'We analyzed 5 cost items with SUM and percentage variances.'), why: W.method() },
      ],
      why: [
        { id: 'y1', ok: true, text: T(`"${items[bad]}" gastó un ${pct(actual[bad] / budget[bad] - 1)} más de lo presupuestado; los demás conceptos están dentro de lo previsto (±5%).`, `"${items[bad]}" spent ${pct(actual[bad] / budget[bad] - 1)} more than budgeted; the other items are on plan (±5%).`) },
        { id: 'y2', text: T('Por la inflación.', 'Because of inflation.'), why: T('Si fuera inflación, subirían todos los conceptos, y no pasa.', "If it were inflation, every item would rise, and they don't.") },
        { id: 'y3', text: T('Porque el área de logística gasta de más.', 'Because the logistics team overspends.'), why: T('Demasiado general y suena a culpa: el problema está en un concepto puntual.', 'Too general and it sounds like blame: the problem is in one specific item.') },
      ],
      action: [
        { id: 'a1', ok: true, text: T(`Que Logística revise este mes por qué crecieron los "${items[bad]}" (¿pedidos urgentes evitables?) y proponga un tope mensual, con seguimiento semanal del gasto.`, `Have Logistics review this month why "${items[bad]}" grew (avoidable rush orders?) and propose a monthly cap, with weekly spend tracking.`) },
        { id: 'a2', text: T('Recortar un 10% todos los conceptos de logística.', 'Cut every logistics item by 10%.'), why: W.broad() },
        { id: 'a3', text: T('Aumentar el presupuesto del año que viene.', "Increase next year's budget."), why: T('No ataca la causa: solo la esconde.', "It doesn't address the cause: it just hides it.") },
      ],
      charts: [
        { id: 'c1', ok: true, chart: { table, spec: spec({ mark: 'bar', columns: { field: table.headers[0] }, rows: { field: table.headers[1], agg: 'SUM' }, sort: 'desc', title: T('Desvío contra presupuesto por concepto', 'Overrun vs budget by item') }) } },
        { id: 'c2', chart: { table, spec: spec({ mark: 'pie', columns: { field: table.headers[0] }, rows: { field: table.headers[2], agg: 'SUM' }, title: T('Gasto real por concepto', 'Actual spend by item') }) }, why: T('Muestra en qué se gasta, no dónde está el desvío.', 'It shows where money goes, not where the overrun is.') },
        { id: 'c3', chart: { table, spec: spec({ mark: 'bar', columns: { field: table.headers[0] }, rows: { field: table.headers[2], agg: 'SUM' }, title: T('Gasto real', 'Actual spend') }) }, why: T('Sin comparar con el presupuesto no se ve el problema.', "Without comparing to the budget, the problem doesn't show.") },
      ],
    });
    return {
      from: 'graciela',
      dept: 'gerencia',
      subject: T('Nos pasamos del presupuesto de logística', 'We went over the logistics budget'),
      file: T('costos_logistica.xlsx', 'logistics_costs.xlsx'),
      email: T('<p>Finanzas me avisó que logística se pasó del presupuesto. Antes de llamar a nadie quiero entender <b>cuánto, dónde y qué hacemos</b>. Una página, por favor.</p>', '<p>Finance told me logistics went over budget. Before calling anyone I want to understand <b>how much, where and what we do</b>. One page, please.</p>'),
      sheet: {
        cols: 6,
        rows: 9,
        colWidths: [190, 130, 130, 130, 110, 40],
        data: { at: 'A1', rows: [[T('Concepto', 'Item'), T('Presupuesto', 'Budget'), T('Real', 'Actual'), T('Desvío $', 'Overrun $'), T('Desvío %', 'Overrun %')], ...items.map((it, i) => [it, budget[i], actual[i]]), ['Total']] },
        locked: ['A1:C6', 'D1:E1', 'A7'],
        header: ['A1:E1', 'A7:E7'],
        targets: ['D2:E6', 'B7:E7'],
        formats: { B: 'currency', C: 'currency', D: 'currency', E: 'percent' },
        start: 'D2',
      },
      objectives: [
        { text: T('<b>Desvío $</b> (D2:D6) = real − presupuesto, y <b>desvío %</b> (E2:E6) = desvío ÷ presupuesto.', '<b>Overrun $</b> (D2:D6) = actual − budget, and <b>overrun %</b> (E2:E6) = overrun ÷ budget.'), hint: 'D2: =C2-B2 · E2: =D2/B2', check: (S) => {
          const a = V.column('D', 2, 6, (row) => diff[row - 2], { refsFn: (row) => ['C' + row, 'B' + row] })(S);
          return a === true ? V.column('E', 2, 6, (row) => diff[row - 2] / budget[row - 2], { tol: 0.0005, refsFn: (row) => ['D' + row, 'B' + row] })(S) : a;
        } },
        { text: T('Fila 7: <b>totales</b> y desvío total.', 'Row 7: <b>totals</b> and overall overrun.'), hint: T('B7: =SUMA(B2:B6) · E7: =D7/B7', 'B7: =SUM(B2:B6) · E7: =D7/B7'), check: V.cells([['B7', sum(budget)], ['C7', sum(actual)], ['D7', sum(diff)], ['E7', over]], { tol: 0.0005 }) },
        ...ex.objectives,
      ],
      report: ex.report,
      tips: [T('Un desvío se explica casi siempre por uno o dos conceptos: encontralos.', 'An overrun is almost always explained by one or two items: find them.'), T('Recortes parejos castigan a quien no tiene el problema.', "Across-the-board cuts punish those who don't have the problem.")],
      feedback: T('Con tu página llamé directamente a la persona correcta. Ya tenemos un tope para los fletes. ¡Excelente!', 'With your page I called the right person directly. We already have a cap in place. Excellent!'),
      solution: { fill: [['D', 2, 6, '=C2-B2'], ['E', 2, 6, '=D2/B2']], cells: { B7: '=SUMA(B2:B6)', C7: '=SUMA(C2:C6)', D7: '=C7-B7', E7: '=D7/B7' }, report: ex.solution },
    };
  });

  // ---------------------------------------------------------------------------
  // Resultado de una prueba A/B, contado para Dirección
  // ---------------------------------------------------------------------------
  C.register('m19_ab', (ctx) => {
    const r = ctx.rng;
    let vA;
    let vB;
    let cA;
    let cB;
    let z;
    do {
      vA = r.step(15000, 30000, 100);
      vB = vA + r.int(-300, 300);
      const pA = 0.035 + r.next() * 0.015;
      cA = Math.round(vA * pA);
      cB = Math.round(vB * pA * (1.1 + r.next() * 0.1));
      const p = (cA + cB) / (vA + vB);
      z = (cB / vB - cA / vA) / Math.sqrt(p * (1 - p) * (1 / vA + 1 / vB));
    } while (z < 2.2);
    const rA = cA / vA;
    const rB = cB / vB;
    const lift = rB / rA - 1;
    const yearVisits = r.step(800000, 2000000, 10000);
    const ticket = r.step(40, 120, 5);
    const extra = (rB - rA) * yearVisits * ticket;
    const table = C.table([T('Versión', 'Version'), T('Compras cada 100 visitas', 'Purchases per 100 visits')], [[T('Checkout actual', 'Current checkout'), Math.round(rA * 1000) / 10], [T('Checkout nuevo', 'New checkout'), Math.round(rB * 1000) / 10]]);
    const ex = exec(T('Resumen para Gerencia General · Checkout nuevo', 'Summary for the General Manager · New checkout'), {
      what: [
        { id: 'w1', ok: true, text: T(`El checkout nuevo aumenta las compras un ${pct(lift)}: si lo usamos para todos, son unos ${money(extra)} más por año.`, `The new checkout increases purchases by ${pct(lift)}: rolled out to everyone, that's about ${money(extra)} more per year.`) },
        { id: 'w2', text: T(`La prueba A/B dio z = ${z.toFixed(2)}, significativo al 95% (p < 0,05).`, `The A/B test gave z = ${z.toFixed(2)}, significant at 95% (p < 0.05).`), why: W.jargon() },
        { id: 'w3', text: T('Hicimos una prueba A/B durante un mes.', 'We ran an A/B test for a month.'), why: W.descriptive() },
      ],
      why: [
        { id: 'y1', ok: true, text: T(`En una prueba con ${(vA + vB).toLocaleString('en-US')} visitantes repartidos al azar, el checkout nuevo convirtió ${pct(rB)} contra ${pct(rA)} del actual. La diferencia es confiable: no es casualidad.`, `In a test with ${(vA + vB).toLocaleString('en-US')} visitors split at random, the new checkout converted ${pct(rB)} vs ${pct(rA)} for the current one. The difference is reliable: it isn't chance.`) },
        { id: 'y2', text: T('Rechazamos la hipótesis nula con un error estándar agrupado.', 'We rejected the null hypothesis using a pooled standard error.'), why: W.jargon() },
        { id: 'y3', text: T('Porque a los clientes les gusta más el color nuevo.', 'Because customers like the new color better.'), why: W.unsupported() },
      ],
      action: [
        { id: 'a1', ok: true, text: T('Implementar el checkout nuevo para todos esta semana (Producto) y comparar las ventas del próximo mes contra la proyección.', 'Roll out the new checkout to everyone this week (Product) and compare next month\'s sales against the projection.') },
        { id: 'a2', text: T('Hacer más pruebas antes de decidir.', 'Run more tests before deciding.'), why: T('La prueba ya es concluyente: esperar cuesta ventas.', 'The test is already conclusive: waiting costs sales.') },
        { id: 'a3', text: T('Rediseñar todo el sitio con el mismo estilo.', 'Redesign the whole site in the same style.'), why: T('La prueba mide el checkout, no el resto del sitio.', 'The test measures the checkout, not the rest of the site.') },
      ],
      charts: [
        { id: 'c1', ok: true, chart: { table, spec: spec({ mark: 'bar', columns: { field: table.headers[0] }, rows: { field: table.headers[1], agg: 'SUM' }, labels: true, title: T('Compras cada 100 visitas', 'Purchases per 100 visits') }) } },
        { id: 'c2', chart: { table, spec: spec({ mark: 'pie', columns: { field: table.headers[0] }, rows: { field: table.headers[1], agg: 'SUM' }, title: T('Conversión (torta)', 'Conversion (pie)') }) }, why: T('Dos tasas no son "partes de un todo": una torta confunde.', 'Two rates are not "parts of a whole": a pie confuses.') },
      ],
    });
    return {
      from: 'graciela',
      dept: 'gerencia',
      subject: T('¿Implementamos el checkout nuevo?', 'Do we roll out the new checkout?'),
      file: T('checkout_resultado.xlsx', 'checkout_result.xlsx'),
      email: T(
        `<p>Producto dice que el checkout nuevo "funciona mejor" y me mandó una planilla llena de números que no entiendo. Necesito una página: <b>¿funciona?, ¿cuánto vale?, ¿qué hacemos?</b></p><p>Tenemos <b>${yearVisits.toLocaleString('en-US')}</b> visitas por año y un ticket promedio de <b>$${ticket}</b>.</p>`,
        `<p>Product says the new checkout "works better" and sent me a spreadsheet full of numbers I don't understand. I need one page: <b>does it work?, how much is it worth?, what do we do?</b></p><p>We have <b>${yearVisits.toLocaleString('en-US')}</b> visits per year and an average ticket of <b>$${ticket}</b>.</p>`
      ),
      sheet: {
        cols: 5,
        rows: 11,
        colWidths: [260, 120, 120, 40, 40],
        data: { at: 'A1', rows: [['', T('Actual (A)', 'Current (A)'), T('Nuevo (B)', 'New (B)')], [T('Visitantes', 'Visitors'), vA, vB], [T('Compras', 'Purchases'), cA, cB], [T('Conversión', 'Conversion')], [], [T('Mejora (lift)', 'Improvement (lift)')], [T('Visitas por año', 'Visits per year'), yearVisits], [T('Ticket promedio', 'Average ticket'), ticket], [T('Ingreso extra anual estimado', 'Estimated extra annual revenue')]] },
        locked: ['A1:C3', 'A4', 'A6', 'A7:B8', 'A9'],
        header: ['A1:C1'],
        labels: ['A2:A9'],
        targets: ['B4:C4', 'B6', 'B9'],
        formats: { B4: 'percent', C4: 'percent', B6: 'percent', B8: 'currency', B9: 'currency', B7: 'int' },
        start: 'B4',
      },
      objectives: [
        { text: T('<b>Conversión</b> (B4:C4) y <b>lift</b> (B6).', '<b>Conversion</b> (B4:C4) and <b>lift</b> (B6).'), hint: 'B4: =B3/B2 · B6: =(C4-B4)/B4', check: V.cells([['B4', rA], ['C4', rB], ['B6', lift]], { tol: 0.00005 }) },
        { text: T('B9: <b>ingreso extra anual</b> = (conversión B − conversión A) × visitas por año × ticket.', 'B9: <b>extra annual revenue</b> = (conversion B − conversion A) × yearly visits × ticket.'), hint: '=(C4-B4)*B7*B8', check: V.cell('B9', extra, { refs: ['B4', 'C4', 'B7', 'B8'], tol: 1 }) },
        ...ex.objectives,
      ],
      report: ex.report,
      tips: [T('Traducí "significativo" a "confiable, no es casualidad".', 'Translate "significant" into "reliable, not chance".'), T('El impacto en plata es lo que la gerencia necesita para decidir.', 'The money impact is what management needs to decide.')],
      feedback: T('¡Por fin entendí la prueba! Aprobado. Y le pedí a Producto que me mande todo así de ahora en más. 😅', 'I finally understood the test! Approved. And I asked Product to send everything like this from now on. 😅'),
      solution: { cells: { B4: '=B3/B2', C4: '=C3/C2', B6: '=(C4-B4)/B4', B9: '=(C4-B4)*B7*B8' }, report: ex.solution },
    };
  });

  // ---------------------------------------------------------------------------
  // Clientes nuevos que se van en los primeros meses
  // ---------------------------------------------------------------------------
  C.register('m19_churn', (ctx) => {
    const r = ctx.rng;
    const segs = [T('0 a 3 meses', '0 to 3 months'), T('4 a 12 meses', '4 to 12 months'), T('Más de 1 año', 'Over 1 year')];
    let clients;
    let lost;
    let rate;
    do {
      clients = [r.step(800, 2000, 10), r.step(1500, 4000, 10), r.step(3000, 8000, 10)];
      const p = [0.09 + r.next() * 0.05, 0.025 + r.next() * 0.015, 0.01 + r.next() * 0.01];
      lost = clients.map((c, i) => Math.round(c * p[i]));
      rate = lost.map((l, i) => l / clients[i]);
    } while (lost[0] / sum(lost) < 0.4);
    const total = sum(lost) / sum(clients);
    const shareNew = lost[0] / sum(lost);
    const table = C.table([T('Antigüedad', 'Tenure'), T('Tasa de baja mensual (%)', 'Monthly churn (%)'), T('Clientes', 'Customers')], segs.map((s, i) => [s, Math.round(rate[i] * 1000) / 10, clients[i]]));
    const ex = exec(T('Resumen para Gerencia General · Bajas de clientes', 'Summary for the General Manager · Customer churn'), {
      what: [
        { id: 'w1', ok: true, text: T(`Perdemos el ${pct(total)} de los clientes por mes, y casi la mitad de las bajas (${pct(shareNew)}) son de clientes con menos de 3 meses.`, `We lose ${pct(total)} of customers per month, and almost half of cancellations (${pct(shareNew)}) are customers under 3 months old.`) },
        { id: 'w2', text: T(`Este mes se dieron de baja ${sum(lost)} clientes.`, `${sum(lost)} customers cancelled this month.`), why: W.descriptive() },
        { id: 'w3', text: T('Segmentamos la base por antigüedad con CONTAR.SI.CONJUNTO.', 'We segmented the base by tenure with COUNTIFS.'), why: W.method() },
      ],
      why: [
        { id: 'y1', ok: true, text: T(`Los clientes nuevos se van a una tasa de ${pct(rate[0])} por mes, ${(rate[0] / rate[2]).toFixed(0)} veces más que los de más de un año: el problema está en los primeros meses de la relación.`, `New customers leave at ${pct(rate[0])} per month, ${(rate[0] / rate[2]).toFixed(0)} times more than those over a year: the problem is in the first months of the relationship.`) },
        { id: 'y2', text: T('Porque la competencia es más barata.', 'Because the competition is cheaper.'), why: W.unsupported() },
        { id: 'y3', text: T('Porque los clientes viejos están cansados del servicio.', 'Because long-time customers are tired of the service.'), why: T('Los datos muestran lo contrario: los antiguos casi no se van.', 'The data shows the opposite: long-time customers barely leave.') },
      ],
      action: [
        { id: 'a1', ok: true, text: T('Lanzar un programa de bienvenida para los primeros 90 días (llamada, guía de uso, seguimiento) a cargo de Atención al Cliente, y medir la tasa de baja de ese grupo en 3 meses.', 'Launch a 90-day welcome program (call, usage guide, follow-up) run by Customer Care, and measure that group\'s churn within 3 months.') },
        { id: 'a2', text: T('Hacer un descuento a todos los clientes.', 'Give every customer a discount.'), why: W.broad() },
        { id: 'a3', text: T('Seguir monitoreando las bajas.', 'Keep monitoring churn.'), why: W.monitor() },
      ],
      charts: [
        { id: 'c1', ok: true, chart: { table, spec: spec({ mark: 'bar', columns: { field: table.headers[0] }, rows: { field: table.headers[1], agg: 'SUM' }, labels: true, title: T('Tasa de baja mensual según antigüedad', 'Monthly churn by tenure') }) } },
        { id: 'c2', chart: { table, spec: spec({ mark: 'pie', columns: { field: table.headers[0] }, rows: { field: table.headers[2], agg: 'SUM' }, title: T('Clientes por antigüedad', 'Customers by tenure') }) }, why: T('Muestra la composición de la base, no las bajas.', 'It shows the composition of the base, not churn.') },
      ],
    });
    return {
      from: 'graciela',
      dept: 'gerencia',
      subject: T('¿Por qué perdemos clientes?', 'Why are we losing customers?'),
      file: T('bajas_antiguedad.xlsx', 'churn_by_tenure.xlsx'),
      email: T('<p>El directorio está preocupado por las bajas. Te paso clientes y bajas del mes según la antigüedad del cliente. Una página: <b>qué pasa, por qué y qué hacemos</b>.</p>', "<p>The board is worried about churn. Here are this month's customers and cancellations by customer tenure. One page: <b>what's happening, why and what we do</b>.</p>"),
      sheet: {
        cols: 6,
        rows: 8,
        colWidths: [150, 110, 110, 140, 130, 40],
        data: { at: 'A1', rows: [[T('Antigüedad', 'Tenure'), T('Clientes', 'Customers'), T('Bajas del mes', 'Monthly cancellations'), T('Tasa de baja', 'Churn rate'), T('% de las bajas', '% of cancellations')], ...segs.map((s, i) => [s, clients[i], lost[i]]), ['Total']] },
        locked: ['A1:C4', 'D1:E1', 'A5'],
        header: ['A1:E1', 'A5:E5'],
        targets: ['D2:E4', 'B5:D5'],
        formats: { D: 'percent', E: 'percent' },
        start: 'D2',
      },
      objectives: [
        { text: T('<b>Tasa de baja</b> (D2:D4) y <b>% de las bajas</b> (E2:E4 = bajas del grupo ÷ bajas totales).', '<b>Churn rate</b> (D2:D4) and <b>% of cancellations</b> (E2:E4 = group cancellations ÷ total cancellations).'), hint: 'D2: =C2/B2 · E2: =C2/$C$5', check: (S) => {
          const a = V.column('D', 2, 4, (row) => rate[row - 2], { tol: 0.0005, refsFn: (row) => ['C' + row, 'B' + row] })(S);
          return a === true ? V.column('E', 2, 4, (row) => lost[row - 2] / sum(lost), { tol: 0.0005, dollarHint: true })(S) : a;
        } },
        { text: T('Fila 5: <b>totales</b> de clientes y bajas, y tasa total.', 'Row 5: total <b>customers</b> and <b>cancellations</b>, and overall rate.'), hint: T('B5: =SUMA(B2:B4) · D5: =C5/B5', 'B5: =SUM(B2:B4) · D5: =C5/B5'), check: V.cells([['B5', sum(clients)], ['C5', sum(lost)], ['D5', total]], { tol: 0.0005 }) },
        ...ex.objectives,
      ],
      report: ex.report,
      tips: [T('La tasa compara grupos; el % de bajas dice dónde está el volumen del problema.', 'The rate compares groups; the % of cancellations says where the bulk of the problem is.'), T('Una buena recomendación tiene responsable y forma de medirla.', 'A good recommendation has an owner and a way to measure it.')],
      feedback: T('El programa de bienvenida ya arrancó. Y tu página quedó como modelo para el resto de los informes. 🏆', 'The welcome program has already started. And your page became the template for every other report. 🏆'),
      solution: { fill: [['D', 2, 4, '=C2/B2'], ['E', 2, 4, '=C2/$C$5']], cells: { B5: '=SUMA(B2:B4)', C5: '=SUMA(C2:C4)', D5: '=C5/B5' }, report: ex.solution },
    };
  });

  // ---------------------------------------------------------------------------
  // Rotación de personal y su costo
  // ---------------------------------------------------------------------------
  C.register('m19_turnover', (ctx) => {
    const r = ctx.rng;
    const areas = AREAS.map(C.L2);
    const bad = r.int(0, areas.length - 1);
    let staff;
    let exits;
    let rate;
    do {
      staff = areas.map(() => r.int(25, 120));
      exits = staff.map((s, i) => Math.round(s * (i === bad ? 0.3 + r.next() * 0.15 : 0.06 + r.next() * 0.08)));
      rate = exits.map((e, i) => e / staff[i]);
    } while (C.uniqueExtreme(rate) !== bad || exits.some((e) => !e));
    const replace = r.step(600000, 1500000, 50000);
    const cost = exits.map((e) => e * replace);
    const totalRate = sum(exits) / sum(staff);
    const others = rate.filter((_, i) => i !== bad);
    const table = C.table([T('Área', 'Area'), T('Rotación anual (%)', 'Annual turnover (%)'), T('Costo', 'Cost')], areas.map((a, i) => [a, Math.round(rate[i] * 1000) / 10, cost[i]]));
    const ex = exec(T('Resumen para Gerencia General · Rotación de personal', 'Summary for the General Manager · Staff turnover'), {
      what: [
        { id: 'w1', ok: true, text: T(`La rotación nos costó ${money(sum(cost))} este año, y ${areas[bad]} explica el ${pct(cost[bad] / sum(cost))} con una rotación del ${pct(rate[bad])}.`, `Turnover cost us ${money(sum(cost))} this year, and ${areas[bad]} accounts for ${pct(cost[bad] / sum(cost))} with ${pct(rate[bad])} turnover.`) },
        { id: 'w2', text: T(`Se fueron ${sum(exits)} personas en el año.`, `${sum(exits)} people left this year.`), why: W.descriptive() },
        { id: 'w3', text: T('La rotación se calcula como bajas ÷ dotación, según la definición de RR.HH.', 'Turnover is computed as exits ÷ headcount, per the HR definition.'), why: W.method() },
      ],
      why: [
        { id: 'y1', ok: true, text: T(`En ${areas[bad]} se va 1 de cada ${Math.round(1 / rate[bad])} personas por año; en el resto de las áreas, entre ${pct(Math.min(...others))} y ${pct(Math.max(...others))}. El problema está concentrado.`, `In ${areas[bad]} 1 in ${Math.round(1 / rate[bad])} people leave each year; in the other areas, between ${pct(Math.min(...others))} and ${pct(Math.max(...others))}. The problem is concentrated.`) },
        { id: 'y2', text: T('Porque los sueldos de toda la empresa están bajos.', 'Because salaries across the company are low.'), why: T('Si fuera eso, la rotación sería alta en todas las áreas.', 'If that were it, turnover would be high in every area.') },
        { id: 'y3', text: T('Porque las nuevas generaciones cambian mucho de trabajo.', 'Because younger generations change jobs a lot.'), why: W.unsupported() },
      ],
      action: [
        { id: 'a1', ok: true, text: T(`Que RR.HH. haga entrevistas de salida en ${areas[bad]} durante el próximo mes, presente las causas principales y un plan, y que midamos la rotación de esa área cada trimestre.`, `Have HR run exit interviews in ${areas[bad]} over the next month, present the main causes and a plan, and track that area's turnover every quarter.`) },
        { id: 'a2', text: T('Subir los sueldos de toda la empresa un 10%.', 'Raise salaries across the company by 10%.'), why: W.broad() },
        { id: 'a3', text: T('Seguir monitoreando la rotación.', 'Keep monitoring turnover.'), why: W.monitor() },
      ],
      charts: [
        { id: 'c1', ok: true, chart: { table, spec: spec({ mark: 'bar', columns: { field: table.headers[0] }, rows: { field: table.headers[1], agg: 'SUM' }, sort: 'desc', title: T('Rotación anual por área (%)', 'Annual turnover by area (%)') }) } },
        { id: 'c2', chart: { table, spec: spec({ mark: 'line', columns: { field: table.headers[0] }, rows: { field: table.headers[1], agg: 'SUM' }, title: T('Rotación', 'Turnover') }) }, why: T('Las áreas no son una secuencia en el tiempo: no van con líneas.', "Areas aren't a time sequence: they don't belong on a line chart.") },
        { id: 'c3', chart: { table, spec: spec({ mark: 'pie', columns: { field: table.headers[0] }, rows: { field: table.headers[2], agg: 'SUM' }, title: T('Costo por área', 'Cost by area') }) }, why: T('Muestra el reparto del costo, pero no la comparación de tasas que explica el problema.', "It shows how the cost splits, but not the rate comparison that explains the problem.") },
      ],
    });
    return {
      from: 'graciela',
      dept: 'gerencia',
      subject: T('¿Cuánto nos cuesta que la gente se vaya?', 'How much does it cost us when people leave?'),
      file: T('rotacion_anual.xlsx', 'annual_turnover.xlsx'),
      email: T(
        `<p>Paula me dice que la rotación "está alta". Quiero ponerle números: <b>cuánto nos cuesta</b>, <b>dónde</b> está el problema y <b>qué hacemos</b>. Reemplazar a una persona (búsqueda, capacitación, curva de aprendizaje) cuesta unos <b>${money(replace)}</b>. Una página.</p>`,
        `<p>Paula says turnover "is high". I want numbers: <b>how much it costs us</b>, <b>where</b> the problem is and <b>what we do</b>. Replacing a person (search, training, learning curve) costs about <b>${money(replace)}</b>. One page.</p>`
      ),
      sheet: {
        cols: 7,
        rows: 10,
        colWidths: [170, 100, 110, 110, 140, 30, 40],
        data: [
          { at: 'A1', rows: [[T('Área', 'Area'), T('Dotación', 'Headcount'), T('Bajas del año', 'Exits this year'), T('Rotación', 'Turnover'), T('Costo de rotación', 'Turnover cost')], ...areas.map((a, i) => [a, staff[i], exits[i]]), ['Total']] },
          { at: 'A9', rows: [[T('Costo de reemplazar a una persona', 'Cost to replace one person'), replace]] },
        ],
        locked: ['A1:C6', 'D1:E1', 'A7', 'A9:B9'],
        header: ['A1:E1', 'A7:E7'],
        labels: ['A9'],
        targets: ['D2:E6', 'B7:E7'],
        formats: { D: 'percent', E: 'currency', B9: 'currency' },
        start: 'D2',
      },
      objectives: [
        { text: T('<b>Rotación</b> (D2:D6) = bajas ÷ dotación, y <b>costo</b> (E2:E6) = bajas × costo de reemplazo (B9).', '<b>Turnover</b> (D2:D6) = exits ÷ headcount, and <b>cost</b> (E2:E6) = exits × replacement cost (B9).'), hint: 'D2: =C2/B2 · E2: =C2*$B$9', check: (S) => {
          const a = V.column('D', 2, 6, (row) => rate[row - 2], { tol: 0.0005, refsFn: (row) => ['C' + row, 'B' + row] })(S);
          return a === true ? V.column('E', 2, 6, (row) => cost[row - 2], { refsFn: (row) => ['C' + row, 'B9'], dollarHint: true })(S) : a;
        } },
        { text: T('Fila 7: <b>totales</b> de dotación, bajas, rotación y costo.', 'Row 7: total <b>headcount</b>, <b>exits</b>, <b>turnover</b> and <b>cost</b>.'), hint: T('B7: =SUMA(B2:B6) · D7: =C7/B7', 'B7: =SUM(B2:B6) · D7: =C7/B7'), check: V.cells([['B7', sum(staff)], ['C7', sum(exits)], ['D7', totalRate], ['E7', sum(cost)]], { tol: 0.0005 }) },
        ...ex.objectives,
      ],
      report: ex.report,
      tips: [T('Poner el problema en plata hace que la gerencia lo priorice.', 'Putting the problem in money terms makes management prioritize it.'), T('Fijá el costo de reemplazo con $ ($B$9).', 'Lock the replacement cost with $ ($B$9).')],
      feedback: T('Con tu página el directorio aprobó el plan para esa área en la misma reunión. Este es trabajo de Senior. 🎓', 'With your page the board approved the plan for that area in the same meeting. This is Senior work. 🎓'),
      solution: { fill: [['D', 2, 6, '=C2/B2'], ['E', 2, 6, '=C2*$B$9']], cells: { B7: '=SUMA(B2:B6)', C7: '=SUMA(C2:C6)', D7: '=C7/B7', E7: '=SUMA(E2:E6)' }, report: ex.solution },
    };
  });
})();
