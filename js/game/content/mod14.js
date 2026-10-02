/*
 * Analyst Adventure — Nivel 14 (etapa Semi-Senior): análisis de punta a punta y storytelling.
 * Cada caso va de la pregunta a la recomendación: cruzar hojas, calcular tasas, encontrar dónde
 * se concentra el problema y armar un informe (titular, evidencia, gráfico, recomendación).
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const C = AA.Content;
  const V = AA.V;
  const F = AA.Formula;
  const Ch = AA.Chart;
  const T = (es, en) => AA.T(es, en);
  const { REGIONS, CARRIERS, AREAS } = C.DATA;
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const P = (name) => F.sheetPrefix(name);
  const fn = (n) => AA.fnName(n);
  const pct = (x) => (Math.round(x * 1000) / 10).toLocaleString('en-US') + '%';
  const spec = (o) => Object.assign(Ch.emptySpec(), o);
  const weighted = (r, w) => {
    let p = r.next() * sum(w);
    let i = 0;
    while (i < w.length - 1 && p > w[i]) p -= w[i++];
    return i;
  };

  C.module({
    id: 'mod14',
    title: { es: 'Análisis de punta a punta', en: 'End-to-end analysis' },
    xp: 170,
    tier: 2,
    skills: ['e2e', 'storyArc', 'headline', 'evidence', 'audience'],
    templates: ['m14_churn', 'm14_returns', 'm14_campaign', 'm14_absences', 'm14_delivery'],
    seeds: [1401, 1402, 1403, 1404, 1405],
    intro: {
      es: 'Acá se junta todo. Un Semi-Senior recibe una pregunta abierta ("¿por qué se van los clientes?") y la lleva <b>de punta a punta</b>: datos, análisis, conclusión y una <b>historia</b> que convenza a otra área de hacer algo.',
      en: 'This is where it all comes together. A Mid-level analyst gets an open question ("why are customers leaving?") and takes it <b>end to end</b>: data, analysis, conclusion and a <b>story</b> that convinces another team to act.',
    },
    skillDefs: {
      e2e: {
        title: { es: 'El análisis de punta a punta', en: 'End-to-end analysis' },
        say: {
          es: 'Los pasos: <b>1)</b> entender la pregunta, <b>2)</b> juntar y revisar los datos, <b>3)</b> calcular las métricas justas (tasas, no solo totales), <b>4)</b> buscar dónde se concentra el problema, <b>5)</b> sacar una conclusión y <b>6)</b> recomendar qué hacer.',
          en: 'The steps: <b>1)</b> understand the question, <b>2)</b> gather and check the data, <b>3)</b> compute the right metrics (rates, not just totals), <b>4)</b> find where the problem concentrates, <b>5)</b> draw a conclusion and <b>6)</b> recommend what to do.',
        },
        tip: { es: 'Las tasas comparan grupos de distinto tamaño: 30 bajas de 300 no es lo mismo que 30 de 3000.', en: 'Rates compare groups of different sizes: 30 cancellations out of 300 is not the same as 30 out of 3000.' },
      },
      storyArc: {
        title: { es: 'La estructura de una historia con datos', en: 'The structure of a data story' },
        say: {
          es: '<b>Titular</b> (la conclusión) → <b>evidencia</b> (2 o 3 datos que la prueban) → <b>un gráfico</b> que la muestre → <b>recomendación</b> (qué hacer). Primero la conclusión, después el detalle: quien lee quiere saber "¿y entonces?".',
          en: '<b>Headline</b> (the conclusion) → <b>evidence</b> (2 or 3 facts that prove it) → <b>one chart</b> that shows it → <b>recommendation</b> (what to do). Conclusion first, details after: the reader wants to know "so what?".',
        },
        tip: { es: 'Si tu informe se puede resumir en una frase, esa frase es el titular.', en: 'If your report can be summed up in one sentence, that sentence is the headline.' },
      },
      headline: {
        title: { es: 'Titulares que concluyen', en: 'Headlines that conclude' },
        say: {
          es: 'Un buen titular dice <b>qué pasa, dónde y cuánto</b>: "El plan Básico pierde el 9% de sus clientes, el triple que Premium". Malos titulares: los descriptivos ("Hubo 143 bajas") y los vagos ("Los clientes están insatisfechos").',
          en: 'A good headline says <b>what, where and how much</b>: "The Basic plan loses 9% of its customers, three times Premium". Bad headlines: descriptive ones ("There were 143 cancellations") and vague ones ("Customers are unhappy").',
        },
        tip: { es: 'Un número y una comparación hacen creíble a un titular.', en: 'A number and a comparison make a headline credible.' },
      },
      evidence: {
        title: { es: 'Evidencia y gráfico', en: 'Evidence and chart' },
        say: {
          es: 'La evidencia tiene que <b>sostener el titular</b>: datos ciertos, relevantes y verificables en tu análisis. Un dato cierto pero irrelevante distrae; uno inventado destruye tu credibilidad. Y un solo gráfico, el que muestre la comparación clave.',
          en: 'Evidence must <b>support the headline</b>: true, relevant facts you can verify in your analysis. A true but irrelevant fact distracts; a made-up one destroys your credibility. And a single chart, the one showing the key comparison.',
        },
        tip: { es: 'Antes de presentar, revisá cada número del informe contra tu planilla.', en: 'Before presenting, check every number in the report against your spreadsheet.' },
      },
      audience: {
        title: { es: 'Recomendaciones accionables', en: 'Actionable recommendations' },
        say: {
          es: 'Una recomendación dice <b>qué hacer, dónde y cómo vamos a saber si funcionó</b>. "Seguir monitoreando" no es una acción. "Bajar todos los precios" es una acción, pero no está respaldada por los datos. Lo ideal: una acción enfocada donde está el problema, y medirla.',
          en: 'A recommendation says <b>what to do, where, and how we will know it worked</b>. "Keep monitoring" is not an action. "Lower all prices" is an action, but the data doesn\'t support it. Ideal: a focused action where the problem is, and measure it.',
        },
        tip: { es: 'Hablá el idioma de quien lee: sin fórmulas ni jerga técnica.', en: 'Speak the reader\'s language: no formulas or technical jargon.' },
      },
    },
  });

  // Arma el informe (titular, evidencia, gráfico, recomendación) y sus objetivos.
  function story(heading, parts) {
    const ok = (list) => list.filter((o) => o.ok).map((o) => o.id);
    const sections = [
      { id: 'title', slot: 'title', label: T('Titular', 'Headline'), prompt: T('La conclusión, con un número y una comparación.', 'The conclusion, with a number and a comparison.'), options: parts.titles, correct: ok(parts.titles)[0] },
      { id: 'evidence', slot: 'bullets', multi: 2, label: T('Evidencia', 'Evidence'), short: T('Por qué lo decimos', 'Why we say it'), prompt: T('Dos datos ciertos que sostengan el titular (verificalos en tu análisis).', 'Two true facts that support the headline (verify them in your analysis).'), options: parts.evidence, correct: ok(parts.evidence) },
      { id: 'chart', slot: 'chart', label: T('Gráfico', 'Chart'), prompt: T('El que muestre la comparación clave.', 'The one showing the key comparison.'), options: parts.charts, correct: ok(parts.charts)[0] },
      { id: 'action', slot: 'text', tone: 'action', label: T('Recomendación', 'Recommendation'), short: T('Qué proponemos', 'What we propose'), prompt: T('Concreta, enfocada donde está el problema y medible.', 'Concrete, focused where the problem is, and measurable.'), options: parts.actions, correct: ok(parts.actions)[0] },
    ];
    sections.forEach((s) => s.options.forEach((o) => delete o.ok));
    const report = { kind: 'story', heading, sections };
    const objectives = [
      { text: T('Informe: elegí el <b>titular</b>.', 'Report: choose the <b>headline</b>.'), hint: T('Que diga la conclusión con un número, no que describa.', 'It should state the conclusion with a number, not describe.'), check: AA.Report.section(report, 'title') },
      { text: T('Informe: elegí <b>2 datos de evidencia</b>.', 'Report: choose <b>2 pieces of evidence</b>.'), hint: T('Verificá cada número en tu planilla.', 'Verify every number in your spreadsheet.'), check: AA.Report.section(report, 'evidence') },
      { text: T('Informe: elegí el <b>gráfico</b>.', 'Report: choose the <b>chart</b>.'), hint: T('El que compare lo que dice el titular.', 'The one comparing what the headline says.'), check: AA.Report.section(report, 'chart') },
      { text: T('Informe: elegí la <b>recomendación</b>.', 'Report: choose the <b>recommendation</b>.'), hint: T('Acción concreta, donde está el problema.', 'A concrete action, where the problem is.'), check: AA.Report.section(report, 'action') },
    ];
    const solution = { title: sections[0].correct, evidence: sections[1].correct, chart: sections[2].correct, action: sections[3].correct };
    return { report, objectives, solution };
  }
  const why = {
    descriptive: () => T('Describe un dato, pero no dice dónde está el problema ni qué tan grave es.', "It describes a fact, but doesn't say where the problem is or how serious it is."),
    vague: () => T('Demasiado general y no lo muestran los datos.', "Too general, and the data doesn't show it."),
    irrelevant: () => T('Es cierto, pero no sostiene el titular.', "It's true, but it doesn't support the headline."),
    fake: () => T('Ese número no sale de tu análisis: revisalo en la planilla.', "That number doesn't come from your analysis: check it in the spreadsheet."),
    monitor: () => T('"Seguir monitoreando" no es una acción: ¿qué hacemos distinto?', '"Keep monitoring" is not an action: what do we do differently?'),
    broad: () => T('Afecta también a quienes no tienen el problema: cuesta sin necesidad.', "It also affects those without the problem: it costs for no reason."),
  };

  // ---------------------------------------------------------------------------
  // ¿Por qué se van los clientes? (tasa de baja por plan + motivos)
  // ---------------------------------------------------------------------------
  C.register('m14_churn', (ctx) => {
    const r = ctx.rng;
    const k = ctx.size === 'large' ? 3 : ctx.size === 'medium' ? 2 : 1;
    const plans = [['Básico', 'Basic'], ['Estándar', 'Standard'], ['Premium', 'Premium']].map(C.L2);
    const motives = [['Precio', 'Price'], ['Servicio', 'Service'], ['Competencia', 'Competition'], ['Mudanza', 'Moving']].map(C.L2);
    const worst = r.int(0, 2);
    const main = r.int(0, 2);
    let clients;
    let rows;
    let counts;
    let rates;
    let byMotive;
    do {
      clients = [r.int(300, 400) * k, r.int(200, 260) * k, r.int(100, 150) * k];
      rates = plans.map((_, i) => (i === worst ? 0.075 + r.next() * 0.04 : 0.02 + r.next() * 0.03));
      counts = clients.map((c, i) => Math.max(2, Math.round(c * rates[i])));
      rows = [];
      plans.forEach((p, i) => {
        for (let j = 0; j < counts[i]; j++) {
          const w = i === worst ? motives.map((_, m) => (m === main ? 5 : 1)) : [1, 1, 1, 1];
          rows.push([p, motives[weighted(r, w)]]);
        }
      });
      rows = r.shuffle(rows);
      byMotive = motives.map((m) => rows.filter((x) => x[0] === plans[worst] && x[1] === m).length);
    } while (C.uniqueExtreme(byMotive) !== main);
    rates = counts.map((c, i) => c / clients[i]);
    const others = [0, 1, 2].filter((i) => i !== worst);
    const ratio = rates[worst] / ((rates[others[0]] + rates[others[1]]) / 2);
    const mainShare = byMotive[main] / counts[worst];
    const sh = { an: T('Análisis', 'Analysis'), bj: T('Bajas', 'Cancellations') };
    const last = rows.length + 1;
    const motiveOther = motives[[0, 1, 2, 3].find((m) => m !== main)];
    const allShareOther = rows.filter((x) => x[1] === motiveOther).length / rows.length;
    const rateTable = C.table([T('Plan', 'Plan'), T('Tasa de baja (%)', 'Churn rate (%)'), T('Clientes', 'Customers')], plans.map((p, i) => [p, Math.round(rates[i] * 1000) / 10, clients[i]]));
    const motiveTable = C.table([T('Motivo', 'Reason'), T('Plan', 'Plan')], rows.map((x) => [x[1], x[0]]));
    const actions = {
      0: T(`Revisar el precio del plan ${plans[worst]} y probar una oferta de retención con un grupo de clientes antes de aplicarla a todos.`, `Review the ${plans[worst]} plan price and test a retention offer with a group of customers before rolling it out.`),
      1: T(`Revisar la atención que reciben los clientes del plan ${plans[worst]} (tiempos de respuesta, reclamos) y medir el cambio en las bajas en 2 meses.`, `Review the service ${plans[worst]} customers get (response times, complaints) and measure the change in churn within 2 months.`),
      2: T(`Comparar el plan ${plans[worst]} con las ofertas de la competencia y probar un ajuste de beneficios con un grupo de clientes.`, `Compare the ${plans[worst]} plan with competitors' offers and test an adjustment of benefits with a group of customers.`),
    };
    const st = story(T('Informe para Marta · Bajas del trimestre', 'Report for Marta · Quarterly churn'), {
      titles: [
        { id: 't1', ok: true, text: T(`El plan ${plans[worst]} pierde el ${pct(rates[worst])} de sus clientes: ${ratio.toFixed(1)} veces más que el resto`, `The ${plans[worst]} plan loses ${pct(rates[worst])} of its customers: ${ratio.toFixed(1)} times the rest`) },
        { id: 't2', text: T(`Este trimestre hubo ${rows.length} bajas`, `There were ${rows.length} cancellations this quarter`), why: why.descriptive() },
        { id: 't3', text: T('Los clientes están insatisfechos con la empresa', 'Customers are unhappy with the company'), why: why.vague() },
      ],
      evidence: [
        { id: 'e1', ok: true, text: T(`Tasa de baja: ${plans[worst]} ${pct(rates[worst])}, ${plans[others[0]]} ${pct(rates[others[0]])} y ${plans[others[1]]} ${pct(rates[others[1]])}.`, `Churn rate: ${plans[worst]} ${pct(rates[worst])}, ${plans[others[0]]} ${pct(rates[others[0]])} and ${plans[others[1]]} ${pct(rates[others[1]])}.`) },
        { id: 'e2', ok: true, text: T(`En ${plans[worst]}, el motivo principal es "${motives[main]}" (${pct(mainShare)} de sus bajas).`, `In ${plans[worst]}, the main reason is "${motives[main]}" (${pct(mainShare)} of its cancellations).`) },
        { id: 'e3', text: T(`${plans[0]} es el plan con más clientes.`, `${plans[0]} is the plan with the most customers.`), why: why.irrelevant() },
        { id: 'e4', text: T(`El ${pct(Math.min(0.95, allShareOther + 0.3))} de todas las bajas son por "${motiveOther}".`, `${pct(Math.min(0.95, allShareOther + 0.3))} of all cancellations are due to "${motiveOther}".`), why: why.fake() },
      ],
      charts: [
        { id: 'c1', ok: true, chart: { table: rateTable, spec: spec({ mark: 'bar', columns: { field: rateTable.headers[0] }, rows: { field: rateTable.headers[1], agg: 'SUM' }, sort: 'desc', title: T('Tasa de baja por plan', 'Churn rate by plan') }) } },
        { id: 'c2', chart: { table: rateTable, spec: spec({ mark: 'bar', columns: { field: rateTable.headers[0] }, rows: { field: rateTable.headers[2], agg: 'SUM' }, sort: 'desc', title: T('Clientes por plan', 'Customers by plan') }) }, why: T('Muestra el tamaño de cada plan, no las bajas.', 'It shows the size of each plan, not churn.') },
        { id: 'c3', chart: { table: motiveTable, spec: spec({ mark: 'pie', columns: { field: motiveTable.headers[0] }, rows: { field: Ch.COUNT_FIELD, agg: 'COUNT' }, title: T('Bajas por motivo', 'Cancellations by reason') }) }, why: T('Mezcla todos los planes: no muestra la diferencia entre planes, que es el hallazgo.', "It mixes all plans: it doesn't show the difference between plans, which is the finding.") },
      ],
      actions: [
        { id: 'a1', ok: true, text: actions[main] },
        { id: 'a2', text: T('Bajar el precio de todos los planes.', 'Lower the price of every plan.'), why: why.broad() },
        { id: 'a3', text: T('Seguir monitoreando las bajas el próximo trimestre.', 'Keep monitoring cancellations next quarter.'), why: why.monitor() },
      ],
    });
    return {
      from: 'marta',
      dept: 'analytics',
      subject: T('¿Por qué se nos van los clientes?', 'Why are customers leaving us?'),
      file: T('bajas_trimestre.xlsx', 'quarterly_churn.xlsx'),
      email: T(
        `<p>Dirección quiere entender <b>por qué se van los clientes</b>. En la hoja <b>${sh.bj}</b> está cada baja del trimestre con su plan y motivo; en <b>${sh.an}</b>, cuántos clientes tiene cada plan.</p><p>Hacé el análisis y armame el <b>informe</b> para presentar: titular, evidencia, un gráfico y qué recomendás.</p>`,
        `<p>Management wants to understand <b>why customers leave</b>. The <b>${sh.bj}</b> sheet has every cancellation this quarter with its plan and reason; <b>${sh.an}</b> has how many customers each plan has.</p><p>Do the analysis and build me the <b>report</b> to present: headline, evidence, one chart and what you recommend.</p>`
      ),
      sheets: [
        {
          name: sh.an,
          cols: 8,
          rows: 9,
          colWidths: [110, 100, 90, 110, 30, 130, 150, 40],
          data: [
            { at: 'A1', rows: [[T('Plan', 'Plan'), T('Clientes', 'Customers'), T('Bajas', 'Cancellations'), T('Tasa de baja', 'Churn rate')], ...plans.map((p, i) => [p, clients[i]])] },
            { at: 'F1', rows: [[T('Motivo', 'Reason'), T(`Bajas en ${plans[worst]}`, `${plans[worst]} cancellations`)], ...motives.map((m) => [m])] },
          ],
          locked: ['A1:B4', 'C1:D1', 'F1:G1', 'F2:F5'],
          header: ['A1:D1', 'F1:G1'],
          labels: ['F2:F5'],
          targets: ['C2:D4', 'G2:G5'],
          formats: { D: 'percent' },
          start: 'C2',
        },
        {
          name: sh.bj,
          cols: 4,
          rows: last + 2,
          colWidths: [90, 110, 130, 40],
          data: { at: 'A1', rows: [[T('Cliente', 'Customer'), T('Plan', 'Plan'), T('Motivo', 'Reason')], ...rows.map((x, i) => ['C-' + (10001 + i * 7), x[0], x[1]])] },
          locked: [`A1:D${last + 2}`],
          header: ['A1:C1'],
        },
      ],
      objectives: [
        { text: T(`<b>Bajas</b> por plan (C2:C4), contando en la hoja ${sh.bj}.`, `<b>Cancellations</b> per plan (C2:C4), counting in the ${sh.bj} sheet.`), hint: `=${fn('CONTAR.SI')}(${P(sh.bj)}B:B; A2)`, check: V.column('C', 2, 4, (row) => counts[row - 2], { uses: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'] }) },
        { text: T('<b>Tasa de baja</b> (D2:D4) = bajas ÷ clientes.', '<b>Churn rate</b> (D2:D4) = cancellations ÷ customers.'), hint: '=C2/B2', check: V.column('D', 2, 4, (row) => rates[row - 2], { tol: 0.0005, refsFn: (row) => ['C' + row, 'B' + row] }) },
        { text: T(`<b>Motivos</b> de baja del plan ${plans[worst]} (G2:G5).`, `Cancellation <b>reasons</b> for the ${plans[worst]} plan (G2:G5).`), hint: `=${fn('CONTAR.SI.CONJUNTO')}(${P(sh.bj)}$B:$B; "${plans[worst]}"; ${P(sh.bj)}$C:$C; F2)`, check: V.column('G', 2, 5, (row) => byMotive[row - 2], { uses: ['CONTAR.SI.CONJUNTO'] }) },
        ...st.objectives,
      ],
      report: st.report,
      tips: [T('Primero la planilla, después el informe: cada opción del informe se verifica con tus números.', 'Spreadsheet first, report second: every report option is verified with your numbers.'), T('El plan con más bajas no es necesariamente el que tiene la tasa más alta.', 'The plan with the most cancellations is not necessarily the one with the highest rate.')],
      feedback: T('Presenté tu informe y Dirección aprobó la prueba piloto. Clarísimo de principio a fin. 👏', 'I presented your report and Management approved the pilot. Crystal clear from start to finish. 👏'),
      solution: {
        fill: [['C', 2, 4, `=CONTAR.SI(${P(sh.bj)}B:B;A2)`], ['D', 2, 4, '=C2/B2'], ['G', 2, 5, `=CONTAR.SI.CONJUNTO(${P(sh.bj)}$B:$B;"${plans[worst]}";${P(sh.bj)}$C:$C;F2)`]],
        report: st.solution,
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Devoluciones por categoría
  // ---------------------------------------------------------------------------
  C.register('m14_returns', (ctx) => {
    const r = ctx.rng;
    const k = ctx.size === 'large' ? 3 : ctx.size === 'medium' ? 2 : 1;
    const cats = [['Muebles', 'Furniture'], ['Electrónica', 'Electronics'], ['Oficina', 'Office'], ['Cocina', 'Kitchen']].map(C.L2);
    const reasons = [['Llegó roto', 'Arrived broken'], ['No era lo esperado', 'Not as described'], ['Talle o medida', 'Wrong size'], ['Arrepentimiento', 'Changed mind']].map(C.L2);
    const worst = r.int(0, 3);
    const main = r.int(0, 2);
    let sold;
    let counts;
    let rows;
    let byReason;
    do {
      sold = cats.map(() => r.int(150, 320) * k);
      const rates = cats.map((_, i) => (i === worst ? 0.09 + r.next() * 0.05 : 0.02 + r.next() * 0.03));
      counts = sold.map((s, i) => Math.max(2, Math.round(s * rates[i])));
      rows = [];
      cats.forEach((c, i) => {
        for (let j = 0; j < counts[i]; j++) rows.push([c, reasons[weighted(r, i === worst ? reasons.map((_, m) => (m === main ? 5 : 1)) : [1, 1, 1, 1])]]);
      });
      rows = r.shuffle(rows);
      byReason = reasons.map((m) => rows.filter((x) => x[0] === cats[worst] && x[1] === m).length);
    } while (C.uniqueExtreme(byReason) !== main || C.uniqueExtreme(sold) < 0);
    const rates = counts.map((c, i) => c / sold[i]);
    const avgOthers = sum(cats.map((_, i) => (i === worst ? 0 : rates[i]))) / 3;
    const mainShare = byReason[main] / counts[worst];
    const sh = { an: T('Análisis', 'Analysis'), dv: T('Devoluciones', 'Returns') };
    const last = rows.length + 1;
    const biggest = C.uniqueExtreme(sold) >= 0 ? cats[C.uniqueExtreme(sold)] : cats[0];
    const rateTable = C.table([T('Categoría', 'Category'), T('Tasa de devolución (%)', 'Return rate (%)'), T('Unidades vendidas', 'Units sold'), T('Devoluciones', 'Returns')], cats.map((c, i) => [c, Math.round(rates[i] * 1000) / 10, sold[i], counts[i]]));
    const actions = {
      0: T(`Mejorar el embalaje y el transporte de ${cats[worst]} con el proveedor logístico, y medir la tasa de devolución en 60 días.`, `Improve packaging and transport for ${cats[worst]} with the logistics provider, and measure the return rate within 60 days.`),
      1: T(`Revisar fotos y descripciones de los productos de ${cats[worst]} en la tienda online, empezando por los más devueltos, y medir el cambio.`, `Review photos and descriptions of ${cats[worst]} products in the online store, starting with the most returned, and measure the change.`),
      2: T(`Agregar una guía de medidas clara en las fichas de ${cats[worst]} y medir si bajan las devoluciones por talle.`, `Add a clear size guide to ${cats[worst]} product pages and measure whether size returns go down.`),
    };
    const st = story(T('Informe para Bruno · Devoluciones', 'Report for Bruno · Returns'), {
      titles: [
        { id: 't1', ok: true, text: T(`${cats[worst]} tiene una tasa de devolución del ${pct(rates[worst])}, ${(rates[worst] / avgOthers).toFixed(1)} veces la del resto`, `${cats[worst]} has a ${pct(rates[worst])} return rate, ${(rates[worst] / avgOthers).toFixed(1)} times the rest`) },
        { id: 't2', text: T(`Recibimos ${rows.length} devoluciones en el trimestre`, `We received ${rows.length} returns this quarter`), why: why.descriptive() },
        { id: 't3', text: T('Hay que mejorar la calidad de los productos', 'Product quality must improve'), why: why.vague() },
      ],
      evidence: [
        { id: 'e1', ok: true, text: T(`${cats[worst]}: ${counts[worst]} devoluciones sobre ${sold[worst]} unidades (${pct(rates[worst])}); el resto promedia ${pct(avgOthers)}.`, `${cats[worst]}: ${counts[worst]} returns out of ${sold[worst]} units (${pct(rates[worst])}); the rest average ${pct(avgOthers)}.`) },
        { id: 'e2', ok: true, text: T(`En ${cats[worst]}, el motivo principal es "${reasons[main]}" (${pct(mainShare)}).`, `In ${cats[worst]}, the main reason is "${reasons[main]}" (${pct(mainShare)}).`) },
        { id: 'e3', text: T(`${biggest} es la categoría que más unidades vendió.`, `${biggest} is the category that sold the most units.`), why: why.irrelevant() },
        { id: 'e4', text: T(`La tasa de devolución general es del ${pct(sum(counts) / sum(sold) + 0.08)}.`, `The overall return rate is ${pct(sum(counts) / sum(sold) + 0.08)}.`), why: why.fake() },
      ],
      charts: [
        { id: 'c1', ok: true, chart: { table: rateTable, spec: spec({ mark: 'bar', columns: { field: rateTable.headers[0] }, rows: { field: rateTable.headers[1], agg: 'SUM' }, sort: 'desc', title: T('Tasa de devolución por categoría', 'Return rate by category') }) } },
        { id: 'c2', chart: { table: rateTable, spec: spec({ mark: 'pie', columns: { field: rateTable.headers[0] }, rows: { field: rateTable.headers[3], agg: 'SUM' }, title: T('Devoluciones por categoría', 'Returns by category') }) }, why: T('Muestra cantidades, no tasas: una categoría grande puede tener muchas devoluciones y estar bien.', 'It shows counts, not rates: a large category can have many returns and still be fine.') },
        { id: 'c3', chart: { table: rateTable, spec: spec({ mark: 'bar', columns: { field: rateTable.headers[0] }, rows: { field: rateTable.headers[2], agg: 'SUM' }, title: T('Unidades vendidas', 'Units sold') }) }, why: T('Habla de ventas, no de devoluciones.', 'It is about sales, not returns.') },
      ],
      actions: [
        { id: 'a1', ok: true, text: actions[main] },
        { id: 'a2', text: T('Dejar de vender la categoría con más devoluciones.', 'Stop selling the category with the most returns.'), why: T('Demasiado drástico: el problema tiene un motivo concreto que se puede atacar.', 'Too drastic: the problem has a concrete cause that can be addressed.') },
        { id: 'a3', text: T('Seguir monitoreando las devoluciones.', 'Keep monitoring returns.'), why: why.monitor() },
      ],
    });
    return {
      from: 'bruno',
      dept: 'ventas',
      subject: T('Demasiadas devoluciones', 'Too many returns'),
      file: T('devoluciones.xlsx', 'returns.xlsx'),
      email: T(
        `<p>Las devoluciones nos están comiendo el margen. En <b>${sh.dv}</b> está cada devolución con su categoría y motivo; en <b>${sh.an}</b>, las unidades vendidas por categoría.</p><p>¿Dónde está el problema y qué hacemos? Necesito un informe para la reunión de comité.</p>`,
        `<p>Returns are eating our margin. <b>${sh.dv}</b> has every return with its category and reason; <b>${sh.an}</b> has units sold by category.</p><p>Where is the problem and what do we do? I need a report for the committee meeting.</p>`
      ),
      sheets: [
        {
          name: sh.an,
          cols: 8,
          rows: 9,
          colWidths: [120, 120, 110, 130, 30, 160, 140, 40],
          data: [
            { at: 'A1', rows: [[T('Categoría', 'Category'), T('Unidades vendidas', 'Units sold'), T('Devoluciones', 'Returns'), T('Tasa de devolución', 'Return rate')], ...cats.map((c, i) => [c, sold[i]])] },
            { at: 'F1', rows: [[T('Motivo', 'Reason'), T(`Devoluciones en ${cats[worst]}`, `${cats[worst]} returns`)], ...reasons.map((m) => [m])] },
          ],
          locked: ['A1:B5', 'C1:D1', 'F1:G1', 'F2:F5'],
          header: ['A1:D1', 'F1:G1'],
          labels: ['F2:F5'],
          targets: ['C2:D5', 'G2:G5'],
          formats: { D: 'percent' },
          start: 'C2',
        },
        {
          name: sh.dv,
          cols: 4,
          rows: last + 2,
          colWidths: [90, 130, 170, 40],
          data: { at: 'A1', rows: [[T('Devolución', 'Return'), T('Categoría', 'Category'), T('Motivo', 'Reason')], ...rows.map((x, i) => ['D-' + (2001 + i), x[0], x[1]])] },
          locked: [`A1:D${last + 2}`],
          header: ['A1:C1'],
        },
      ],
      objectives: [
        { text: T(`<b>Devoluciones</b> por categoría (C2:C5), desde la hoja ${sh.dv}.`, `<b>Returns</b> per category (C2:C5), from the ${sh.dv} sheet.`), hint: `=${fn('CONTAR.SI')}(${P(sh.dv)}B:B; A2)`, check: V.column('C', 2, 5, (row) => counts[row - 2], { uses: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'] }) },
        { text: T('<b>Tasa de devolución</b> (D2:D5) = devoluciones ÷ unidades vendidas.', '<b>Return rate</b> (D2:D5) = returns ÷ units sold.'), hint: '=C2/B2', check: V.column('D', 2, 5, (row) => rates[row - 2], { tol: 0.0005, refsFn: (row) => ['C' + row, 'B' + row] }) },
        { text: T(`<b>Motivos</b> de devolución de ${cats[worst]} (G2:G5).`, `Return <b>reasons</b> for ${cats[worst]} (G2:G5).`), hint: `=${fn('CONTAR.SI.CONJUNTO')}(${P(sh.dv)}$B:$B; "${cats[worst]}"; ${P(sh.dv)}$C:$C; F2)`, check: V.column('G', 2, 5, (row) => byReason[row - 2], { uses: ['CONTAR.SI.CONJUNTO'] }) },
        ...st.objectives,
      ],
      report: st.report,
      tips: [T('Comparar categorías por tasa, no por cantidad: venden distinto.', 'Compare categories by rate, not by count: they sell different amounts.'), T('El motivo principal te dice qué acción proponer.', 'The main reason tells you which action to propose.')],
      feedback: T('El comité aprobó tu propuesta. ¡Y nadie tuvo que adivinar nada: estaba todo en el informe!', 'The committee approved your proposal. And nobody had to guess anything: it was all in the report!'),
      solution: {
        fill: [['C', 2, 5, `=CONTAR.SI(${P(sh.dv)}B:B;A2)`], ['D', 2, 5, '=C2/B2'], ['G', 2, 5, `=CONTAR.SI.CONJUNTO(${P(sh.dv)}$B:$B;"${cats[worst]}";${P(sh.dv)}$C:$C;F2)`]],
        report: st.solution,
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Costo por conversión de cada canal
  // ---------------------------------------------------------------------------
  C.register('m14_campaign', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [16, 20], [28, 36], [44, 56]);
    const chans = [['Redes', 'Social'], ['Buscadores', 'Search'], ['Email', 'Email'], ['Afiliados', 'Affiliates']].map(C.L2);
    let rows;
    let spend;
    let conv;
    let cpa;
    do {
      const eff = chans.map(() => 0.005 + r.next() * 0.03);
      rows = Array.from({ length: n }, (_, i) => {
        const c = i < 4 ? i : r.int(0, 3);
        const s = r.step(2000, 15000, 100);
        return [`${T('Campaña', 'Campaign')} ${i + 1}`, chans[c], s, Math.max(1, Math.round(s * eff[c] * (0.8 + r.next() * 0.4)))];
      });
      spend = chans.map((c) => sum(rows.filter((x) => x[1] === c).map((x) => x[2])));
      conv = chans.map((c) => sum(rows.filter((x) => x[1] === c).map((x) => x[3])));
      cpa = spend.map((s, i) => s / conv[i]);
    } while (C.uniqueExtreme(cpa, true) < 0 || C.uniqueExtreme(cpa) < 0 || C.uniqueExtreme(spend) === C.uniqueExtreme(cpa, true));
    const best = C.uniqueExtreme(cpa, true);
    const worst = C.uniqueExtreme(cpa);
    const most = C.uniqueExtreme(spend) >= 0 ? C.uniqueExtreme(spend) : worst;
    const sh = { an: T('Análisis', 'Analysis'), cp: T('Campañas', 'Campaigns') };
    const last = n + 1;
    const money = (x) => C.money(Math.round(x * 100) / 100);
    const cpaTable = C.table([T('Canal', 'Channel'), T('Costo por conversión', 'Cost per conversion'), T('Inversión', 'Spend'), T('Conversiones', 'Conversions')], chans.map((c, i) => [c, Math.round(cpa[i] * 100) / 100, spend[i], conv[i]]));
    const st = story(T('Informe para Tomás · Rendimiento por canal', 'Report for Tomás · Channel performance'), {
      titles: [
        { id: 't1', ok: true, text: T(`${chans[best]} consigue clientes a ${money(cpa[best])} cada uno: ${(cpa[worst] / cpa[best]).toFixed(1)} veces más barato que ${chans[worst]}`, `${chans[best]} gets customers at ${money(cpa[best])} each: ${(cpa[worst] / cpa[best]).toFixed(1)} times cheaper than ${chans[worst]}`) },
        { id: 't2', text: T(`Invertimos ${money(sum(spend))} en ${n} campañas`, `We spent ${money(sum(spend))} on ${n} campaigns`), why: why.descriptive() },
        { id: 't3', text: T('El marketing digital funciona', 'Digital marketing works'), why: why.vague() },
      ],
      evidence: [
        { id: 'e1', ok: true, text: T(`Costo por conversión: ${chans[best]} ${money(cpa[best])} vs ${chans[worst]} ${money(cpa[worst])}.`, `Cost per conversion: ${chans[best]} ${money(cpa[best])} vs ${chans[worst]} ${money(cpa[worst])}.`) },
        { id: 'e2', ok: true, text: T(`${chans[most]} se lleva el ${pct(spend[most] / sum(spend))} de la inversión.`, `${chans[most]} takes ${pct(spend[most] / sum(spend))} of the spend.`) },
        { id: 'e3', text: T(`Hicimos ${n} campañas este trimestre.`, `We ran ${n} campaigns this quarter.`), why: why.irrelevant() },
        { id: 'e4', text: T(`${chans[best]} generó el ${pct(Math.min(0.95, conv[best] / sum(conv) + 0.35))} de todas las conversiones.`, `${chans[best]} generated ${pct(Math.min(0.95, conv[best] / sum(conv) + 0.35))} of all conversions.`), why: why.fake() },
      ],
      charts: [
        { id: 'c1', ok: true, chart: { table: cpaTable, spec: spec({ mark: 'bar', columns: { field: cpaTable.headers[0] }, rows: { field: cpaTable.headers[1], agg: 'SUM' }, sort: 'asc', title: T('Costo por conversión (menor es mejor)', 'Cost per conversion (lower is better)') }) } },
        { id: 'c2', chart: { table: cpaTable, spec: spec({ mark: 'pie', columns: { field: cpaTable.headers[0] }, rows: { field: cpaTable.headers[2], agg: 'SUM' }, title: T('Inversión por canal', 'Spend by channel') }) }, why: T('Muestra dónde va la plata, no cuánto rinde.', 'It shows where the money goes, not how well it performs.') },
        { id: 'c3', chart: { table: cpaTable, spec: spec({ mark: 'bar', columns: { field: cpaTable.headers[0] }, rows: { field: cpaTable.headers[3], agg: 'SUM' }, title: T('Conversiones por canal', 'Conversions by channel') }) }, why: T('Más conversiones puede ser solo más inversión: hay que mirar el costo de cada una.', 'More conversions may just mean more spend: you need to look at the cost of each.') },
      ],
      actions: [
        { id: 'a1', ok: true, text: T(`Pasar parte del presupuesto de ${chans[worst]} a ${chans[best]} durante un mes y medir si el costo por conversión se mantiene.`, `Move part of the ${chans[worst]} budget to ${chans[best]} for a month and measure whether cost per conversion holds.`) },
        { id: 'a2', text: T(`Cortar por completo ${chans[worst]} desde mañana.`, `Cut ${chans[worst]} completely starting tomorrow.`), why: T('Demasiado drástico: mejor mover parte y medir (al escalar, un canal puede encarecerse).', 'Too drastic: better to move part and measure (a channel can get pricier as it scales).') },
        { id: 'a3', text: T('Aumentar el presupuesto de todos los canales.', 'Increase the budget of every channel.'), why: why.broad() },
      ],
    });
    return {
      from: 'tomas',
      dept: 'marketing',
      subject: T('¿En qué canal conviene invertir?', 'Which channel should we invest in?'),
      file: T('campanas_trimestre.xlsx', 'quarter_campaigns.xlsx'),
      email: T(
        `<p>Tengo que defender el presupuesto del próximo trimestre. En <b>${sh.cp}</b> están todas las campañas con su canal, inversión y conversiones.</p><p>Calculá cuánto nos cuesta <b>cada conversión</b> en cada canal y armá el informe con tu recomendación.</p>`,
        `<p>I have to defend next quarter's budget. <b>${sh.cp}</b> has every campaign with its channel, spend and conversions.</p><p>Compute how much <b>each conversion</b> costs us in each channel and build the report with your recommendation.</p>`
      ),
      sheets: [
        {
          name: sh.an,
          cols: 6,
          rows: 8,
          colWidths: [130, 120, 120, 170, 40, 40],
          data: { at: 'A1', rows: [[T('Canal', 'Channel'), T('Inversión', 'Spend'), T('Conversiones', 'Conversions'), T('Costo por conversión', 'Cost per conversion')], ...chans.map((c) => [c])] },
          locked: ['A1:D1', 'A2:A5'],
          header: ['A1:D1'],
          labels: ['A2:A5'],
          targets: ['B2:D5'],
          formats: { B: 'currency', D: 'currency' },
          start: 'B2',
        },
        {
          name: sh.cp,
          cols: 5,
          rows: last + 2,
          colWidths: [130, 120, 110, 110, 40],
          data: { at: 'A1', rows: [[T('Campaña', 'Campaign'), T('Canal', 'Channel'), T('Inversión', 'Spend'), T('Conversiones', 'Conversions')], ...rows] },
          locked: [`A1:E${last + 2}`],
          header: ['A1:D1'],
          formats: { C: 'currency' },
        },
      ],
      objectives: [
        { text: T(`<b>Inversión</b> y <b>conversiones</b> por canal (B2:C5), sumando la hoja ${sh.cp}.`, `<b>Spend</b> and <b>conversions</b> per channel (B2:C5), summing the ${sh.cp} sheet.`), hint: `=${fn('SUMAR.SI')}(${P(sh.cp)}$B:$B; $A2; ${P(sh.cp)}C:C)`, check: (S) => {
          const a = V.column('B', 2, 5, (row) => spend[row - 2], { uses: ['SUMAR.SI', 'SUMAR.SI.CONJUNTO'] })(S);
          return a === true ? V.column('C', 2, 5, (row) => conv[row - 2], { uses: ['SUMAR.SI', 'SUMAR.SI.CONJUNTO'] })(S) : a;
        } },
        { text: T('<b>Costo por conversión</b> (D2:D5) = inversión ÷ conversiones.', '<b>Cost per conversion</b> (D2:D5) = spend ÷ conversions.'), hint: '=B2/C2', check: V.column('D', 2, 5, (row) => cpa[row - 2], { refsFn: (row) => ['B' + row, 'C' + row] }) },
        ...st.objectives,
      ],
      report: st.report,
      tips: [T('Con $ solo en la columna ($A2) la fórmula se copia a la derecha y hacia abajo.', 'With $ only on the column ($A2) the formula copies right and down.'), T('Costo por conversión: menos es mejor.', 'Cost per conversion: lower is better.')],
      feedback: T('Con tu informe conseguí el presupuesto y un mes de prueba. ¡Datos que convencen!', 'With your report I got the budget and a one-month test. Data that convinces!'),
      solution: {
        fillBlock: [['B', 'C', 2, 5, `=SUMAR.SI(${P(sh.cp)}$B:$B;$A2;${P(sh.cp)}C:C)`]],
        fill: [['D', 2, 5, '=B2/C2']],
        report: st.solution,
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Ausentismo por área y día
  // ---------------------------------------------------------------------------
  C.register('m14_absences', (ctx) => {
    const r = ctx.rng;
    const k = ctx.size === 'large' ? 3 : ctx.size === 'medium' ? 2 : 1;
    const areas = AREAS.slice(0, 4).map(C.L2);
    const days = [['Lunes', 'Monday'], ['Martes', 'Tuesday'], ['Miércoles', 'Wednesday'], ['Jueves', 'Thursday'], ['Viernes', 'Friday']].map(C.L2);
    const worst = r.int(0, 3);
    let staff;
    let rows;
    let perArea;
    let perDay;
    do {
      staff = areas.map(() => r.int(18, 40) * k);
      rows = [];
      areas.forEach((a, i) => {
        const nAbs = Math.round(staff[i] * (i === worst ? 1.6 + r.next() * 0.6 : 0.5 + r.next() * 0.4));
        for (let j = 0; j < nAbs; j++) rows.push([a, days[weighted(r, i === worst ? [5, 1, 1, 1, 1.5] : [1.2, 1, 1, 1, 1.1])]]);
      });
      rows = r.shuffle(rows);
      perArea = areas.map((a) => rows.filter((x) => x[0] === a).length);
      perDay = days.map((d) => rows.filter((x) => x[0] === areas[worst] && x[1] === d).length);
    } while (C.uniqueExtreme(perDay) !== 0 || C.uniqueExtreme(perArea.map((p, i) => p / staff[i])) !== worst || C.uniqueExtreme(staff) < 0);
    const ratePer = perArea.map((p, i) => p / staff[i]);
    const others = sum(ratePer.filter((_, i) => i !== worst)) / 3;
    const monShare = perDay[0] / perArea[worst];
    const friShare = rows.filter((x) => x[1] === days[4]).length / rows.length;
    const sh = { an: T('Análisis', 'Analysis'), au: T('Ausencias', 'Absences') };
    const last = rows.length + 1;
    const rateTable = C.table([T('Área', 'Area'), T('Ausencias por persona', 'Absences per person'), T('Ausencias', 'Absences')], areas.map((a, i) => [a, Math.round(ratePer[i] * 100) / 100, perArea[i]]));
    const dayTable = C.table([T('Día', 'Day'), T('Ausencias', 'Absences')], days.map((d, i) => [d, perDay[i]]));
    const st = story(T('Informe para Paula · Ausentismo', 'Report for Paula · Absenteeism'), {
      titles: [
        { id: 't1', ok: true, text: T(`${areas[worst]} tiene ${(ratePer[worst] / others).toFixed(1)} veces más ausencias por persona que el resto, concentradas los ${days[0].toLowerCase()}`, `${areas[worst]} has ${(ratePer[worst] / others).toFixed(1)} times more absences per person than the rest, concentrated on ${days[0]}s`) },
        { id: 't2', text: T(`Hubo ${rows.length} ausencias en el trimestre`, `There were ${rows.length} absences this quarter`), why: why.descriptive() },
        { id: 't3', text: T('El ausentismo es un problema de toda la empresa', 'Absenteeism is a company-wide problem'), why: T('Los datos muestran lo contrario: está concentrado en un área.', 'The data shows the opposite: it is concentrated in one area.') },
      ],
      evidence: [
        { id: 'e1', ok: true, text: T(`${areas[worst]}: ${ratePer[worst].toFixed(2)} ausencias por persona; las otras áreas promedian ${others.toFixed(2)}.`, `${areas[worst]}: ${ratePer[worst].toFixed(2)} absences per person; the other areas average ${others.toFixed(2)}.`) },
        { id: 'e2', ok: true, text: T(`El ${pct(monShare)} de las ausencias de ${areas[worst]} son un ${days[0].toLowerCase()}.`, `${pct(monShare)} of ${areas[worst]} absences fall on a ${days[0]}.`) },
        { id: 'e3', text: T(`${areas[C.uniqueExtreme(staff) >= 0 ? C.uniqueExtreme(staff) : 0]} es el área con más personas.`, `${areas[C.uniqueExtreme(staff) >= 0 ? C.uniqueExtreme(staff) : 0]} is the area with the most people.`), why: why.irrelevant() },
        { id: 'e4', text: T(`Los ${days[4].toLowerCase()} concentran el ${pct(friShare + 0.2)} de todas las ausencias.`, `${days[4]}s account for ${pct(friShare + 0.2)} of all absences.`), why: why.fake() },
      ],
      charts: [
        { id: 'c1', ok: true, chart: { table: rateTable, spec: spec({ mark: 'bar', columns: { field: rateTable.headers[0] }, rows: { field: rateTable.headers[1], agg: 'SUM' }, sort: 'desc', title: T('Ausencias por persona y área', 'Absences per person by area') }) } },
        { id: 'c2', chart: { table: rateTable, spec: spec({ mark: 'pie', columns: { field: rateTable.headers[0] }, rows: { field: rateTable.headers[2], agg: 'SUM' }, title: T('Ausencias por área', 'Absences by area') }) }, why: T('Cantidades totales: un área grande parece peor aunque no lo sea.', 'Total counts: a big area looks worse even if it isn\'t.') },
        { id: 'c3', chart: { table: dayTable, spec: spec({ mark: 'line', columns: { field: dayTable.headers[0] }, rows: { field: dayTable.headers[1], agg: 'SUM' }, title: T('Ausencias por día', 'Absences by day') }) }, why: T('Muestra solo un área por día, sin compararla con las otras: le falta el hallazgo principal.', "It shows only one area by day, without comparing it to the others: it misses the main finding.") },
      ],
      actions: [
        { id: 'a1', ok: true, text: T(`Conversar con el equipo y la jefatura de ${areas[worst]} para entender qué pasa los ${days[0].toLowerCase()} (turnos, carga del fin de semana) y acordar una medida a revisar en dos meses.`, `Talk with the ${areas[worst]} team and its manager to understand what happens on ${days[0]}s (shifts, weekend workload) and agree on a measure to review in two months.`) },
        { id: 'a2', text: T(`Sancionar a quienes faltan los ${days[0].toLowerCase()}.`, `Penalize those who are absent on ${days[0]}s.`), why: T('Ataca el síntoma sin entender la causa (y sin datos individuales).', 'It attacks the symptom without understanding the cause (and without individual data).') },
        { id: 'a3', text: T('Pedir certificado médico a toda la empresa.', 'Require a medical certificate from the whole company.'), why: why.broad() },
      ],
    });
    return {
      from: 'paula',
      dept: 'rrhh',
      subject: T('¿Tenemos un problema de ausentismo?', 'Do we have an absenteeism problem?'),
      file: T('ausencias_trimestre.xlsx', 'quarter_absences.xlsx'),
      email: T(
        `<p>Las jefaturas se quejan del ausentismo. En <b>${sh.au}</b> está cada ausencia con su área y día; en <b>${sh.an}</b>, cuántas personas tiene cada área.</p><p>Quiero saber si es un problema general o puntual, y qué hacemos. Armame el informe.</p>`,
        `<p>Managers complain about absenteeism. <b>${sh.au}</b> has every absence with its area and day; <b>${sh.an}</b> has how many people each area has.</p><p>I want to know whether it's a general or a specific problem, and what we do. Build me the report.</p>`
      ),
      sheets: [
        {
          name: sh.an,
          cols: 8,
          rows: 9,
          colWidths: [150, 90, 100, 160, 30, 110, 150, 40],
          data: [
            { at: 'A1', rows: [[T('Área', 'Area'), T('Personas', 'People'), T('Ausencias', 'Absences'), T('Ausencias por persona', 'Absences per person')], ...areas.map((a, i) => [a, staff[i]])] },
            { at: 'F1', rows: [[T('Día', 'Day'), T(`Ausencias en ${areas[worst]}`, `${areas[worst]} absences`)], ...days.map((d) => [d])] },
          ],
          locked: ['A1:B5', 'C1:D1', 'F1:G1', 'F2:F6'],
          header: ['A1:D1', 'F1:G1'],
          labels: ['F2:F6'],
          targets: ['C2:D5', 'G2:G6'],
          formats: { D: 'dec2' },
          start: 'C2',
        },
        {
          name: sh.au,
          cols: 4,
          rows: last + 2,
          colWidths: [80, 150, 110, 40],
          data: { at: 'A1', rows: [[T('Legajo', 'ID'), T('Área', 'Area'), T('Día', 'Day')], ...rows.map((x, i) => [3000 + ((i * 37) % 700), x[0], x[1]])] },
          locked: [`A1:D${last + 2}`],
          header: ['A1:C1'],
        },
      ],
      objectives: [
        { text: T(`<b>Ausencias</b> por área (C2:C5), desde la hoja ${sh.au}.`, `<b>Absences</b> per area (C2:C5), from the ${sh.au} sheet.`), hint: `=${fn('CONTAR.SI')}(${P(sh.au)}B:B; A2)`, check: V.column('C', 2, 5, (row) => perArea[row - 2], { uses: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'] }) },
        { text: T('<b>Ausencias por persona</b> (D2:D5) = ausencias ÷ personas.', '<b>Absences per person</b> (D2:D5) = absences ÷ people.'), hint: '=C2/B2', check: V.column('D', 2, 5, (row) => ratePer[row - 2], { tol: 0.0005, refsFn: (row) => ['C' + row, 'B' + row] }) },
        { text: T(`Ausencias de <b>${areas[worst]}</b> por día (G2:G6).`, `<b>${areas[worst]}</b> absences by day (G2:G6).`), hint: `=${fn('CONTAR.SI.CONJUNTO')}(${P(sh.au)}$B:$B; "${areas[worst]}"; ${P(sh.au)}$C:$C; F2)`, check: V.column('G', 2, 6, (row) => perDay[row - 2], { uses: ['CONTAR.SI.CONJUNTO'] }) },
        ...st.objectives,
      ],
      report: st.report,
      tips: [T('Por persona: así se pueden comparar áreas de distinto tamaño.', 'Per person: that way areas of different size can be compared.'), T('Un patrón por día suele tener una causa organizativa.', 'A pattern by day usually has an organizational cause.')],
      feedback: T('Hablamos con el equipo: había un problema de turnos de fin de semana. Ya lo estamos resolviendo. ¡Gracias!', 'We talked to the team: there was a weekend shift problem. We\'re already fixing it. Thanks!'),
      solution: {
        fill: [['C', 2, 5, `=CONTAR.SI(${P(sh.au)}B:B;A2)`], ['D', 2, 5, '=C2/B2'], ['G', 2, 6, `=CONTAR.SI.CONJUNTO(${P(sh.au)}$B:$B;"${areas[worst]}";${P(sh.au)}$C:$C;F2)`]],
        report: st.solution,
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Envíos demorados por transportista y región
  // ---------------------------------------------------------------------------
  C.register('m14_delivery', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [80, 100], [150, 200], [240, 300]);
    const cars = r.sample(CARRIERS, 4);
    const regs = REGIONS.slice(0, 4).map(C.L2);
    const DL = T('Demorado', 'Delayed');
    const OK = T('Entregado', 'Delivered');
    const worst = r.int(0, 3);
    const badReg = r.int(0, 3);
    let rows;
    let tot;
    let late;
    let lateReg;
    do {
      rows = Array.from({ length: n }, () => {
        const c = r.int(0, 3);
        const g = r.int(0, 3);
        const p = c === worst ? (g === badReg ? 0.75 : 0.12) : 0.1;
        return [cars[c], regs[g], r.chance(p) ? DL : OK];
      });
      tot = cars.map((c) => rows.filter((x) => x[0] === c).length);
      late = cars.map((c) => rows.filter((x) => x[0] === c && x[2] === DL).length);
      lateReg = regs.map((g) => rows.filter((x) => x[0] === cars[worst] && x[1] === g && x[2] === DL).length);
    } while (C.uniqueExtreme(late.map((l, i) => l / tot[i])) !== worst || C.uniqueExtreme(lateReg) !== badReg || tot.some((t) => !t) || C.uniqueExtreme(tot) < 0);
    const rate = late.map((l, i) => l / tot[i]);
    const others = sum(rate.filter((_, i) => i !== worst)) / 3;
    const regShare = lateReg[badReg] / late[worst];
    const sh = { an: T('Análisis', 'Analysis'), en: T('Envíos', 'Shipments') };
    const last = n + 1;
    const rateTable = C.table([T('Transportista', 'Carrier'), T('% demorados', '% delayed'), T('Envíos', 'Shipments')], cars.map((c, i) => [c, Math.round(rate[i] * 1000) / 10, tot[i]]));
    const regTable = C.table([T('Región', 'Region'), T('Demorados', 'Delayed')], regs.map((g, i) => [g, lateReg[i]]));
    const st = story(T('Informe para Ramiro · Demoras', 'Report for Ramiro · Delays'), {
      titles: [
        { id: 't1', ok: true, text: T(`${cars[worst]} demora el ${pct(rate[worst])} de sus envíos, y el ${pct(regShare)} de esas demoras es en ${regs[badReg]}`, `${cars[worst]} delays ${pct(rate[worst])} of its shipments, and ${pct(regShare)} of those delays are in ${regs[badReg]}`) },
        { id: 't2', text: T(`Hubo ${sum(late)} envíos demorados`, `There were ${sum(late)} delayed shipments`), why: why.descriptive() },
        { id: 't3', text: T('Los transportistas son lentos', 'Carriers are slow'), why: why.vague() },
      ],
      evidence: [
        { id: 'e1', ok: true, text: T(`% de demorados: ${cars[worst]} ${pct(rate[worst])}; el resto promedia ${pct(others)}.`, `% delayed: ${cars[worst]} ${pct(rate[worst])}; the rest average ${pct(others)}.`) },
        { id: 'e2', ok: true, text: T(`${lateReg[badReg]} de los ${late[worst]} demorados de ${cars[worst]} son en ${regs[badReg]}.`, `${lateReg[badReg]} of ${cars[worst]}'s ${late[worst]} delays are in ${regs[badReg]}.`) },
        { id: 'e3', text: T(`${cars[C.uniqueExtreme(tot) >= 0 ? C.uniqueExtreme(tot) : 0]} es el transportista con más envíos.`, `${cars[C.uniqueExtreme(tot) >= 0 ? C.uniqueExtreme(tot) : 0]} is the carrier with the most shipments.`), why: why.irrelevant() },
        { id: 'e4', text: T(`Todos los transportistas demoran más del ${pct(Math.max(...rate) - 0.02)}.`, `Every carrier delays more than ${pct(Math.max(...rate) - 0.02)}.`), why: why.fake() },
      ],
      charts: [
        { id: 'c1', ok: true, chart: { table: rateTable, spec: spec({ mark: 'bar', columns: { field: rateTable.headers[0] }, rows: { field: rateTable.headers[1], agg: 'SUM' }, sort: 'desc', title: T('% de envíos demorados', '% delayed shipments') }) } },
        { id: 'c2', chart: { table: rateTable, spec: spec({ mark: 'pie', columns: { field: rateTable.headers[0] }, rows: { field: rateTable.headers[2], agg: 'SUM' }, title: T('Envíos por transportista', 'Shipments by carrier') }) }, why: T('Muestra volumen, no demoras.', 'It shows volume, not delays.') },
        { id: 'c3', chart: { table: regTable, spec: spec({ mark: 'line', columns: { field: regTable.headers[0] }, rows: { field: regTable.headers[1], agg: 'SUM' }, title: T('Demorados por región', 'Delayed by region') }) }, why: T('Las regiones no son una secuencia en el tiempo: no van con líneas.', 'Regions are not a time sequence: they don\'t belong on a line chart.') },
      ],
      actions: [
        { id: 'a1', ok: true, text: T(`Pedirle a ${cars[worst]} un plan de mejora para ${regs[badReg]} y, si en 30 días no baja el % de demoras, derivar esa región a otro transportista.`, `Ask ${cars[worst]} for an improvement plan for ${regs[badReg]} and, if delays don't drop within 30 days, move that region to another carrier.`) },
        { id: 'a2', text: T(`Cambiar a ${cars[worst]} en todo el país.`, `Replace ${cars[worst]} nationwide.`), why: T('En las otras regiones funciona bien: el problema es puntual.', 'It works fine in the other regions: the problem is specific.') },
        { id: 'a3', text: T('Avisar a los clientes que puede haber demoras.', 'Tell customers there may be delays.'), why: T('No resuelve el problema.', "It doesn't solve the problem.") },
      ],
    });
    return {
      from: 'ramiro',
      dept: 'logistica',
      subject: T('Las demoras nos están matando', 'Delays are killing us'),
      file: T('envios_trimestre.xlsx', 'quarter_shipments.xlsx'),
      email: T(
        `<p>Atención al cliente está explotada de reclamos por demoras. En <b>${sh.en}</b> está cada envío con su transportista, región y estado.</p><p>Necesito saber <b>quién</b> demora y <b>dónde</b>, y una propuesta concreta. Armame el informe.</p>`,
        `<p>Customer care is flooded with delay complaints. <b>${sh.en}</b> has every shipment with its carrier, region and status.</p><p>I need to know <b>who</b> is late and <b>where</b>, and a concrete proposal. Build me the report.</p>`
      ),
      sheets: [
        {
          name: sh.an,
          cols: 8,
          rows: 9,
          colWidths: [130, 90, 100, 110, 30, 110, 160, 40],
          data: [
            { at: 'A1', rows: [[T('Transportista', 'Carrier'), T('Envíos', 'Shipments'), T('Demorados', 'Delayed'), T('% demorados', '% delayed')], ...cars.map((c) => [c])] },
            { at: 'F1', rows: [[T('Región', 'Region'), T(`Demorados de ${cars[worst]}`, `${cars[worst]} delayed`)], ...regs.map((g) => [g])] },
          ],
          locked: ['A1:D1', 'A2:A5', 'F1:G1', 'F2:F5'],
          header: ['A1:D1', 'F1:G1'],
          labels: ['A2:A5', 'F2:F5'],
          targets: ['B2:D5', 'G2:G5'],
          formats: { D: 'percent' },
          start: 'B2',
        },
        {
          name: sh.en,
          cols: 4,
          rows: last + 2,
          colWidths: [130, 110, 110, 40],
          data: { at: 'A1', rows: [[T('Transportista', 'Carrier'), T('Región', 'Region'), T('Estado', 'Status')], ...rows] },
          locked: [`A1:D${last + 2}`],
          header: ['A1:C1'],
        },
      ],
      objectives: [
        { text: T('<b>Envíos</b> (B2:B5) y <b>demorados</b> (C2:C5) por transportista.', '<b>Shipments</b> (B2:B5) and <b>delayed</b> (C2:C5) per carrier.'), hint: `B: =${fn('CONTAR.SI')}(${P(sh.en)}A:A; A2) · C: =${fn('CONTAR.SI.CONJUNTO')}(${P(sh.en)}A:A; A2; ${P(sh.en)}C:C; "${DL}")`, check: (S) => {
          const a = V.column('B', 2, 5, (row) => tot[row - 2], { uses: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'] })(S);
          return a === true ? V.column('C', 2, 5, (row) => late[row - 2], { uses: ['CONTAR.SI.CONJUNTO'] })(S) : a;
        } },
        { text: T('<b>% demorados</b> (D2:D5) = demorados ÷ envíos.', '<b>% delayed</b> (D2:D5) = delayed ÷ shipments.'), hint: '=C2/B2', check: V.column('D', 2, 5, (row) => rate[row - 2], { tol: 0.0005, refsFn: (row) => ['C' + row, 'B' + row] }) },
        { text: T(`Demorados de <b>${cars[worst]}</b> por región (G2:G5).`, `<b>${cars[worst]}</b> delays by region (G2:G5).`), hint: `=${fn('CONTAR.SI.CONJUNTO')}(${P(sh.en)}$A:$A; "${cars[worst]}"; ${P(sh.en)}$B:$B; F2; ${P(sh.en)}$C:$C; "${DL}")`, check: V.column('G', 2, 5, (row) => lateReg[row - 2], { uses: ['CONTAR.SI.CONJUNTO'] }) },
        ...st.objectives,
      ],
      report: st.report,
      tips: [T('Primero quién (transportista), después dónde (región): así se llega a la causa.', 'First who (carrier), then where (region): that\'s how you reach the cause.'), T('CONTAR.SI.CONJUNTO admite varias condiciones a la vez.', 'COUNTIFS accepts several conditions at once.')],
      feedback: T('El transportista ya presentó un plan para esa región. Los reclamos empiezan a bajar. 🚚', 'The carrier already submitted a plan for that region. Complaints are starting to drop. 🚚'),
      solution: {
        fill: [['B', 2, 5, `=CONTAR.SI(${P(sh.en)}A:A;A2)`], ['C', 2, 5, `=CONTAR.SI.CONJUNTO(${P(sh.en)}A:A;A2;${P(sh.en)}C:C;"${DL}")`], ['D', 2, 5, '=C2/B2'], ['G', 2, 5, `=CONTAR.SI.CONJUNTO(${P(sh.en)}$A:$A;"${cars[worst]}";${P(sh.en)}$B:$B;F2;${P(sh.en)}$C:$C;"${DL}")`]],
        report: st.solution,
      },
    };
  });
})();
