/*
 * Analyst Adventure — Nivel 16 (etapa Senior): definir KPIs.
 * Tasas en vez de absolutos (conversión, churn), indicadores compuestos (OTIF, NPS), metas y
 * semáforos, indicadores adelantados vs atrasados y métricas de vanidad.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const C = AA.Content;
  const V = AA.V;
  const T = (es, en) => AA.T(es, en);
  const { CARRIERS, MONTHS } = C.DATA;
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const fn = (n) => AA.fnName(n);
  const pct = (x) => (Math.round(x * 1000) / 10).toLocaleString('en-US') + '%';

  C.module({
    id: 'mod16',
    title: { es: 'Definir KPIs', en: 'Defining KPIs' },
    xp: 190,
    tier: 3,
    skills: ['kpiWhat', 'kpiRatios', 'kpiGood', 'kpiTargets', 'kpiLeading'],
    templates: ['m16_conversion', 'm16_churn', 'm16_otif', 'm16_nps', 'm16_choose'],
    seeds: [1601, 1602, 1603, 1604, 1605],
    intro: {
      es: '¡Bienvenida a la etapa Senior! Hasta ahora calculabas los números que te pedían. Un Senior decide <b>qué números hay que mirar</b>: define los KPIs con los que la empresa mide si le va bien. Elegir mal un KPI hace que todos trabajen para el objetivo equivocado.',
      en: "Welcome to the Senior stage! So far you computed the numbers you were asked for. A Senior decides <b>which numbers to watch</b>: defines the KPIs the company uses to know if it's doing well. Picking the wrong KPI makes everyone work towards the wrong goal.",
    },
    skillDefs: {
      kpiWhat: {
        title: { es: 'Qué es un KPI', en: 'What a KPI is' },
        say: {
          es: 'Un <b>KPI</b> (indicador clave) es una métrica atada a un <b>objetivo</b> del negocio. Un KPI bien definido tiene: nombre, <b>fórmula exacta</b>, fuente de datos, frecuencia, <b>meta</b> y responsable. "Ventas" no es un KPI; "Ventas mensuales vs meta, de la tabla de facturación, responsable: Comercial" sí.',
          en: 'A <b>KPI</b> (key performance indicator) is a metric tied to a business <b>goal</b>. A well-defined KPI has: name, <b>exact formula</b>, data source, frequency, <b>target</b> and owner. "Sales" is not a KPI; "Monthly sales vs target, from the billing table, owner: Sales" is.',
        },
        tip: { es: 'Si dos personas calculan el mismo KPI y les da distinto, la definición no estaba clara.', en: "If two people compute the same KPI and get different results, the definition wasn't clear." },
      },
      kpiRatios: {
        title: { es: 'Tasas, no solo totales', en: 'Rates, not just totals' },
        say: {
          es: 'Para comparar grupos de distinto tamaño usá <b>tasas</b>: conversión = compras ÷ visitas, churn = bajas ÷ clientes al inicio, ticket promedio = ventas ÷ operaciones. Un canal con más compras puede ser simplemente el que más visitas tiene.',
          en: 'To compare groups of different size use <b>rates</b>: conversion = purchases ÷ visits, churn = cancellations ÷ customers at start, average ticket = sales ÷ deals. A channel with more purchases may just be the one with more visits.',
        },
        tip: { es: 'Siempre aclarar el denominador: ¿clientes al inicio, al final o promedio del mes?', en: 'Always state the denominator: customers at start, at end, or the monthly average?' },
      },
      kpiGood: {
        title: { es: 'Buenos KPIs y métricas de vanidad', en: 'Good KPIs and vanity metrics' },
        say: {
          es: 'Un buen KPI es <b>accionable</b> (si cambia, sabemos qué hacer), <b>comparable</b> en el tiempo y <b>difícil de "inflar"</b>. Las <b>métricas de vanidad</b> (seguidores, descargas totales, visitas) suben siempre y hacen sentir bien, pero no dicen si el negocio mejora.',
          en: 'A good KPI is <b>actionable</b> (if it changes, we know what to do), <b>comparable</b> over time and <b>hard to "inflate"</b>. <b>Vanity metrics</b> (followers, total downloads, visits) always go up and feel good, but don\'t tell whether the business improves.',
        },
        tip: { es: 'Pocos KPIs: si todo es clave, nada es clave.', en: 'Few KPIs: if everything is key, nothing is.' },
      },
      kpiTargets: {
        title: { es: 'Metas y semáforos', en: 'Targets and traffic lights' },
        say: {
          es: 'Un KPI sin meta no dice si estamos bien o mal. Un semáforo lo hace visible: <code>=SI(D2>=E2; "OK"; SI(D2>=E2*0.8; "Cerca"; "Bajo"))</code>. Las metas tienen que ser <b>concretas y con plazo</b>: "pasar del 3% al 4% de conversión antes de diciembre".',
          en: 'A KPI without a target doesn\'t say whether we\'re doing well. A traffic light makes it visible: <code>=IF(D2>=E2, "OK", IF(D2>=E2*0.8, "Close", "Below"))</code>. Targets must be <b>concrete and time-bound</b>: "go from 3% to 4% conversion before December".',
        },
        fns: ['SI'],
        tip: { es: 'Compuestos como OTIF o NPS combinan varias condiciones en un solo número.', en: 'Composites like OTIF or NPS combine several conditions into a single number.' },
      },
      kpiLeading: {
        title: { es: 'Indicadores adelantados y atrasados', en: 'Leading and lagging indicators' },
        say: {
          es: 'Los <b>atrasados</b> miden el resultado cuando ya pasó (bajas del mes, ventas del trimestre). Los <b>adelantados</b> anticipan ese resultado y dan tiempo a actuar: por ejemplo, clientes que dejaron de usar el producto suelen darse de baja después.',
          en: '<b>Lagging</b> indicators measure the result after it happened (monthly cancellations, quarterly sales). <b>Leading</b> indicators anticipate that result and give time to act: for example, customers who stopped using the product tend to cancel later.',
        },
        tip: { es: 'Un buen tablero combina los dos: el resultado y su señal temprana.', en: 'A good board combines both: the result and its early signal.' },
      },
    },
  });

  // ---------------------------------------------------------------------------
  // Conversión por canal, meta y semáforo
  // ---------------------------------------------------------------------------
  C.register('m16_conversion', (ctx) => {
    const r = ctx.rng;
    const chans = [['Redes', 'Social'], ['Buscadores', 'Search'], ['Email', 'Email'], ['Directo', 'Direct'], ['Afiliados', 'Affiliates']].map(C.L2);
    const target = 0.03;
    const scale = ctx.size === 'large' ? 4 : ctx.size === 'medium' ? 2 : 1;
    let visits;
    let buys;
    let conv;
    do {
      visits = chans.map(() => r.step(4000, 40000, 100) * scale);
      conv = chans.map(() => 0.012 + r.next() * 0.035);
      buys = visits.map((v, i) => Math.round(v * conv[i]));
      conv = buys.map((b, i) => b / visits[i]);
    } while (C.uniqueExtreme(buys) < 0 || C.uniqueExtreme(conv) < 0 || C.uniqueExtreme(buys) === C.uniqueExtreme(conv) || !conv.some((c) => c < target * 0.8) || !conv.some((c) => c >= target * 0.8 && c < target));
    const OK = 'OK';
    const NEAR = T('Cerca', 'Close');
    const LOW = T('Bajo', 'Below');
    const status = conv.map((c) => (c >= target ? OK : c >= target * 0.8 ? NEAR : LOW));
    const best = C.uniqueExtreme(conv);
    return {
      from: 'tadeo',
      dept: 'marketing',
      subject: T('¿Qué canal funciona mejor?', 'Which channel works best?'),
      file: T('embudo_canales.xlsx', 'channel_funnel.xlsx'),
      email: T(
        '<p>Discutimos con el equipo qué canal "funciona mejor" y cada uno mira un número distinto. Quiero un KPI único para comparar canales: la <b>tasa de conversión</b> (compras ÷ visitas), con meta del <b>3%</b> y un semáforo.</p>',
        '<p>The team argues about which channel "works best" and everyone looks at a different number. I want a single KPI to compare channels: the <b>conversion rate</b> (purchases ÷ visits), with a <b>3%</b> target and a traffic light.</p>'
      ),
      sheet: {
        cols: 7,
        rows: 9,
        colWidths: [130, 110, 100, 120, 90, 110, 40],
        data: { at: 'A1', rows: [[T('Canal', 'Channel'), T('Visitas', 'Visits'), T('Compras', 'Purchases'), T('Conversión', 'Conversion'), T('Meta', 'Target'), T('Estado', 'Status')], ...chans.map((c, i) => [c, visits[i], buys[i], null, target])] },
        locked: ['A1:C6', 'E1:E6', 'D1', 'F1'],
        header: ['A1:F1'],
        targets: ['D2:D6', 'F2:F6'],
        formats: { D: 'percent', E: 'percent', B: 'int', C: 'int' },
        start: 'D2',
      },
      objectives: [
        { text: T('<b>Conversión</b> (D2:D6) = compras ÷ visitas.', '<b>Conversion</b> (D2:D6) = purchases ÷ visits.'), hint: '=C2/B2', check: V.column('D', 2, 6, (row) => conv[row - 2], { tol: 0.00005, refsFn: (row) => ['C' + row, 'B' + row] }) },
        {
          text: T(`<b>Estado</b> (F2:F6): "${OK}" si llega a la meta, "${NEAR}" si está a menos del 20% de la meta (≥ 80% de ella), "${LOW}" si no.`, `<b>Status</b> (F2:F6): "${OK}" if it meets the target, "${NEAR}" if within 20% of it (≥ 80% of it), "${LOW}" otherwise.`),
          hint: `=${fn('SI')}(D2>=E2; "${OK}"; ${fn('SI')}(D2>=E2*0.8; "${NEAR}"; "${LOW}"))`,
          check: V.column('F', 2, 6, (row) => status[row - 2], { uses: ['SI', 'SI.CONJUNTO'] }),
        },
        {
          text: T('❓ ¿Qué KPI usarías para comparar la <b>eficiencia</b> de los canales?', '❓ Which KPI would you use to compare channel <b>efficiency</b>?'),
          choices: [T('Las compras totales de cada canal.', 'Each channel\'s total purchases.'), T('La tasa de conversión: compras ÷ visitas.', 'The conversion rate: purchases ÷ visits.'), T('Las visitas de cada canal.', 'Each channel\'s visits.')],
          correct: 1,
          why: [T('Más compras puede ser solo más tráfico: no mide eficiencia.', 'More purchases may just mean more traffic: it doesn\'t measure efficiency.'), null, T('Las visitas son una métrica de vanidad si no se convierten en compras.', 'Visits are a vanity metric if they don\'t turn into purchases.')],
          hint: T('Eficiencia = resultado ÷ esfuerzo.', 'Efficiency = result ÷ effort.'),
        },
        { text: T('❓ ¿Qué canal es el <b>más eficiente</b>?', '❓ Which channel is the <b>most efficient</b>?'), placeholder: T('Canal', 'Channel'), hint: T('La mayor conversión, no las mayores compras.', 'The highest conversion, not the most purchases.'), answer: V.answerText([chans[best]]) },
      ],
      tips: [T('SI anidado: primero la condición más exigente.', 'Nested IF: the strictest condition first.'), T('Fijate que el canal con más compras no es el de mejor conversión.', 'Notice the channel with the most purchases is not the one with the best conversion.')],
      feedback: T('Se terminó la discusión: ahora todos miramos la misma tasa y el mismo semáforo. 🚦', 'The argument is over: now we all look at the same rate and the same traffic light. 🚦'),
      solution: { fill: [['D', 2, 6, '=C2/B2'], ['F', 2, 6, `=SI(D2>=E2;"${OK}";SI(D2>=E2*0.8;"${NEAR}";"${LOW}"))`]], answers: { 2: 1, 3: chans[best] } },
    };
  });

  // ---------------------------------------------------------------------------
  // Churn mensual
  // ---------------------------------------------------------------------------
  C.register('m16_churn', (ctx) => {
    const r = ctx.rng;
    const months = MONTHS.slice(0, ctx.size === 'large' ? 12 : ctx.size === 'medium' ? 9 : 6).map(C.L2);
    let start;
    let ins;
    let outs;
    let rate;
    do {
      start = [];
      ins = [];
      outs = [];
      let b = r.step(2000, 6000, 10);
      months.forEach(() => {
        const a = r.int(80, 600);
        const o = Math.round(b * (0.02 + r.next() * 0.05));
        start.push(b);
        ins.push(a);
        outs.push(o);
        b = b + a - o;
      });
      rate = outs.map((o, i) => o / start[i]);
    } while (C.uniqueExtreme(rate) < 0 || C.uniqueExtreme(outs) < 0 || C.uniqueExtreme(rate) === C.uniqueExtreme(outs));
    const end = start.map((b, i) => b + ins[i] - outs[i]);
    const last = months.length + 1;
    const worst = C.uniqueExtreme(rate);
    return {
      from: 'julia',
      dept: 'finanzas',
      subject: T('¿Cuántos clientes perdemos cada mes?', 'How many customers do we lose each month?'),
      file: T('clientes_mensual.xlsx', 'monthly_customers.xlsx'),
      email: T(
        '<p>Para el directorio necesito el <b>churn mensual</b>: qué porcentaje de los clientes que teníamos al inicio de cada mes se dio de baja. También el total de clientes al cierre de cada mes.</p>',
        '<p>For the board I need the <b>monthly churn</b>: what percentage of the customers we had at the start of each month cancelled. Also the total customers at the end of each month.</p>'
      ),
      sheet: {
        cols: 7,
        rows: last + 3,
        colWidths: [80, 130, 80, 80, 140, 100, 40],
        data: { at: 'A1', rows: [[T('Mes', 'Month'), T('Clientes al inicio', 'Customers at start'), T('Altas', 'New'), T('Bajas', 'Lost'), T('Clientes al cierre', 'Customers at end'), 'Churn'], ...months.map((m, i) => [m, start[i], ins[i], outs[i]])] },
        locked: ['A1:D' + last, 'E1:F1'],
        header: ['A1:F1'],
        targets: ['E2:F' + last],
        formats: { F: 'percent' },
        start: 'E2',
      },
      objectives: [
        { text: T(`<b>Clientes al cierre</b> (E2:E${last}) = inicio + altas − bajas.`, `<b>Customers at end</b> (E2:E${last}) = start + new − lost.`), hint: '=B2+C2-D2', check: V.column('E', 2, last, (row) => end[row - 2], { refsFn: (row) => ['B' + row, 'C' + row, 'D' + row] }) },
        { text: T(`<b>Churn</b> (F2:F${last}) = bajas ÷ clientes al inicio.`, `<b>Churn</b> (F2:F${last}) = lost ÷ customers at start.`), hint: '=D2/B2', check: V.column('F', 2, last, (row) => rate[row - 2], { tol: 0.00005, refsFn: (row) => ['D' + row, 'B' + row] }) },
        { text: T('❓ ¿En qué mes el churn fue <b>más alto</b>?', '❓ In which month was churn <b>highest</b>?'), placeholder: T('Mes', 'Month'), hint: T('El mayor % de la columna F.', 'The highest % in column F.'), answer: V.answerText([months[worst]]) },
        {
          text: T('❓ El mes con más bajas no es el de mayor churn. ¿Por qué conviene informar la tasa?', '❓ The month with the most cancellations is not the one with the highest churn. Why report the rate?'),
          choices: [T('Porque la cantidad de clientes cambia mes a mes: la tasa permite comparar meses entre sí.', 'Because the customer base changes month to month: the rate makes months comparable.'), T('Porque los porcentajes quedan mejor en las presentaciones.', 'Because percentages look better in presentations.'), T('Porque la cantidad de bajas no se puede calcular.', 'Because the number of cancellations cannot be computed.')],
          correct: 0,
          why: [null, T('No es estética: es que sin dividir por la base, comparás tamaños distintos.', "It's not aesthetics: without dividing by the base, you compare different sizes."), T('Sí se puede: está en la columna D.', 'It can: it is in column D.')],
          hint: T('Pensá en una empresa que duplica sus clientes.', 'Think of a company that doubles its customers.'),
        },
      ],
      tips: [T('Clientes al cierre de un mes = clientes al inicio del siguiente: es un buen control.', "Customers at the end of one month = customers at the start of the next: it's a good check."), T('Churn usa los clientes al INICIO como denominador.', 'Churn uses customers at the START as the denominator.')],
      feedback: T('El directorio ahora sigue el churn todos los meses. Y la definición quedó escrita: nadie la discute.', 'The board now tracks churn every month. And the definition is written down: nobody argues about it.'),
      solution: { fill: [['E', 2, last, '=B2+C2-D2'], ['F', 2, last, '=D2/B2']], answers: { 2: months[worst], 3: 0 } },
    };
  });

  // ---------------------------------------------------------------------------
  // OTIF por transportista vs meta
  // ---------------------------------------------------------------------------
  C.register('m16_otif', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [40, 55], [80, 110], [140, 180]);
    const cars = r.sample(CARRIERS, 3);
    const YES = T('Sí', 'Yes');
    let rows;
    let tot;
    let otif;
    do {
      const q = cars.map(() => [0.8 + r.next() * 0.18, 0.85 + r.next() * 0.14]);
      rows = Array.from({ length: n }, (_, i) => {
        const c = r.int(0, 2);
        return ['P-' + (5001 + i), cars[c], r.chance(q[c][0]) ? YES : 'No', r.chance(q[c][1]) ? YES : 'No'];
      });
      tot = cars.map((c) => rows.filter((x) => x[1] === c).length);
      otif = cars.map((c, i) => rows.filter((x) => x[1] === c && x[2] === YES && x[3] === YES).length / tot[i]);
    } while (!otif.some((o) => o >= 0.9) || !otif.some((o) => o < 0.9) || otif.some((o) => Math.abs(o - 0.9) < 0.005) || tot.some((t) => !t));
    const last = n + 1;
    const OK = T('OK', 'OK');
    const LOW = T('Bajo meta', 'Below target');
    const below = otif.filter((o) => o < 0.9).length;
    return {
      from: 'ramiro',
      dept: 'logistica',
      subject: T('Un KPI de servicio para los transportistas', 'A service KPI for the carriers'),
      file: T('pedidos_otif.xlsx', 'otif_orders.xlsx'),
      email: T(
        '<p>Vamos a firmar contratos con meta de servicio. Hasta ahora medíamos solo si llegaba "a tiempo", pero los clientes también se quejan de pedidos <b>incompletos</b>. Quiero el <b>OTIF</b> (On Time In Full): % de pedidos que llegaron a tiempo <b>y</b> completos. La meta es <b>90%</b>.</p>',
        '<p>We\'re signing contracts with a service target. Until now we only measured whether it arrived "on time", but customers also complain about <b>incomplete</b> orders. I want <b>OTIF</b> (On Time In Full): % of orders that arrived on time <b>and</b> complete. The target is <b>90%</b>.</p>'
      ),
      sheet: {
        cols: 12,
        rows: n + 4,
        colWidths: [80, 120, 90, 90, 30, 120, 80, 80, 110, 30, 100, 70],
        data: [
          { at: 'A1', rows: [[T('Pedido', 'Order'), T('Transportista', 'Carrier'), T('A tiempo', 'On time'), T('Completo', 'In full')], ...rows] },
          { at: 'F1', rows: [[T('Transportista', 'Carrier'), T('Pedidos', 'Orders'), 'OTIF', T('Estado', 'Status')], ...cars.map((c) => [c])] },
          { at: 'K1', rows: [[T('Meta OTIF', 'OTIF target'), 0.9]] },
        ],
        locked: ['A1:D' + last, 'F1:I1', 'F2:F4', 'K1:L1'],
        header: ['A1:D1', 'F1:I1'],
        labels: ['F2:F4', 'K1'],
        targets: ['G2:I4'],
        formats: { H: 'percent', L1: 'percent' },
        start: 'G2',
      },
      objectives: [
        { text: T('<b>Pedidos</b> por transportista (G2:G4).', '<b>Orders</b> per carrier (G2:G4).'), hint: `=${fn('CONTAR.SI')}($B$2:$B$${last}; F2)`, check: V.column('G', 2, 4, (row) => tot[row - 2], { uses: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'], dollarHint: true }) },
        { text: T('<b>OTIF</b> (H2:H4): pedidos a tiempo Y completos ÷ pedidos.', '<b>OTIF</b> (H2:H4): orders on time AND in full ÷ orders.'), hint: `=${fn('CONTAR.SI.CONJUNTO')}($B$2:$B$${last}; F2; $C$2:$C$${last}; "${YES}"; $D$2:$D$${last}; "${YES}")/G2`, check: V.column('H', 2, 4, (row) => otif[row - 2], { uses: ['CONTAR.SI.CONJUNTO'], tol: 0.0005, dollarHint: true }) },
        { text: T(`<b>Estado</b> (I2:I4): "${OK}" si llega a la meta (L1), "${LOW}" si no.`, `<b>Status</b> (I2:I4): "${OK}" if it meets the target (L1), "${LOW}" otherwise.`), hint: `=${fn('SI')}(H2>=$L$1; "${OK}"; "${LOW}")`, check: V.column('I', 2, 4, (row) => (otif[row - 2] >= 0.9 ? OK : LOW), { uses: ['SI'], dollarHint: true }) },
        { text: T('❓ ¿Cuántos transportistas están <b>bajo la meta</b>?', '❓ How many carriers are <b>below target</b>?'), placeholder: T('Cantidad', 'Count'), hint: T('Contá los estados.', 'Count the statuses.'), answer: V.answerNumber(below, 0) },
        {
          text: T('❓ ¿Por qué OTIF y no solo "% a tiempo"?', '❓ Why OTIF and not just "% on time"?'),
          choices: [T('Porque un pedido a tiempo pero incompleto también es un problema para el cliente: OTIF exige las dos cosas.', "Because an order on time but incomplete is also a problem for the customer: OTIF requires both."), T('Porque OTIF siempre da más alto y queda mejor.', 'Because OTIF is always higher and looks better.'), T('Porque es más fácil de calcular.', 'Because it is easier to compute.')],
          correct: 0,
          why: [null, T('Al contrario: OTIF es más exigente, siempre da igual o más bajo.', "On the contrary: OTIF is stricter, it's always equal or lower."), T('Es más difícil de calcular: necesita dos condiciones a la vez.', 'It is harder to compute: it needs two conditions at once.')],
          hint: T('Pensá en lo que le importa al cliente.', 'Think about what the customer cares about.'),
        },
      ],
      tips: [T('CONTAR.SI.CONJUNTO con tres condiciones: transportista, a tiempo y completo.', 'COUNTIFS with three conditions: carrier, on time and in full.'), T('Fijá la meta con $ ($L$1) para copiar.', 'Lock the target with $ ($L$1) to copy.')],
      feedback: T('Los contratos ya tienen la cláusula de OTIF ≥ 90%. Un KPI bien definido vale oro.', 'The contracts now include the OTIF ≥ 90% clause. A well-defined KPI is gold.'),
      solution: {
        fill: [['G', 2, 4, `=CONTAR.SI($B$2:$B$${last};F2)`], ['H', 2, 4, `=CONTAR.SI.CONJUNTO($B$2:$B$${last};F2;$C$2:$C$${last};"${YES}";$D$2:$D$${last};"${YES}")/G2`], ['I', 2, 4, `=SI(H2>=$L$1;"${OK}";"${LOW}")`]],
        answers: { 3: String(below), 4: 0 },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // NPS
  // ---------------------------------------------------------------------------
  C.register('m16_nps', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [30, 40], [60, 80], [110, 140]);
    let scores;
    let prom;
    let det;
    let nps;
    let avg;
    do {
      scores = Array.from({ length: n }, () => {
        const x = r.next();
        return x < 0.4 ? r.int(9, 10) : x < 0.7 ? r.int(7, 8) : r.int(0, 6);
      });
      prom = scores.filter((s) => s >= 9).length;
      det = scores.filter((s) => s <= 6).length;
      nps = ((prom - det) / n) * 100;
      avg = sum(scores) / n;
    } while (avg < 6.5 || nps > 25);
    const last = n + 1;
    return {
      from: 'camila',
      dept: 'data',
      subject: T('¿Nos recomiendan los clientes?', 'Do customers recommend us?'),
      file: T('encuesta_nps.xlsx', 'nps_survey.xlsx'),
      email: T(
        '<p>Mandamos la encuesta "¿Del 0 al 10, cuánto nos recomendarías?". Gerencia quiere el <b>NPS</b>: % de promotores (9 y 10) menos % de detractores (0 a 6). Y pregunta por qué no alcanza con el promedio.</p>',
        '<p>We sent the survey "From 0 to 10, how likely are you to recommend us?". Management wants the <b>NPS</b>: % promoters (9 and 10) minus % detractors (0 to 6). And asks why the average isn\'t enough.</p>'
      ),
      sheet: {
        cols: 7,
        rows: n + 4,
        colWidths: [90, 90, 30, 180, 90, 40, 40],
        data: { at: 'A1', rows: [[T('Respuesta', 'Response'), T('Puntaje', 'Score')], ...scores.map((s, i) => ['R-' + (101 + i), s])] },
        cells: { D2: T('Respuestas', 'Responses'), D3: T('Promotores (9-10)', 'Promoters (9-10)'), D4: T('Detractores (0-6)', 'Detractors (0-6)'), D5: 'NPS', D6: T('Promedio', 'Average') },
        locked: ['A1:B' + last, 'D2:D6'],
        header: ['A1:B1'],
        labels: ['D2:D6'],
        targets: ['E2:E6'],
        formats: { E5: 'dec2', E6: 'dec2' },
        start: 'E2',
      },
      objectives: [
        { text: T('E2 <b>respuestas</b>, E3 <b>promotores</b> y E4 <b>detractores</b>.', 'E2 <b>responses</b>, E3 <b>promoters</b> and E4 <b>detractors</b>.'), hint: `E3: =${fn('CONTAR.SI')}(B2:B${last}; ">=9") · E4: =${fn('CONTAR.SI')}(B2:B${last}; "<=6")`, check: V.cells([['E2', n], ['E3', prom], ['E4', det]], { usesByRef: { E2: ['CONTAR', 'CONTARA'], E3: ['CONTAR.SI'], E4: ['CONTAR.SI'] } }) },
        { text: T('E5: <b>NPS</b> = (promotores − detractores) ÷ respuestas × 100.', 'E5: <b>NPS</b> = (promoters − detractors) ÷ responses × 100.'), hint: '=(E3-E4)/E2*100', check: V.cell('E5', nps, { refs: ['E2', 'E3', 'E4'], tol: 0.01 }) },
        { text: T('E6: el <b>promedio</b> de los puntajes.', 'E6: the <b>average</b> score.'), hint: `=${fn('PROMEDIO')}(B2:B${last})`, check: V.cell('E6', avg, { uses: ['PROMEDIO'] }) },
        {
          text: T(`❓ El promedio da ${avg.toFixed(1)} y "suena bien". ¿Por qué informar el NPS?`, `❓ The average is ${avg.toFixed(1)} and "sounds good". Why report the NPS?`),
          choices: [T('Porque separa a quienes nos recomiendan de quienes hablan mal: un promedio "bueno" puede esconder muchos detractores.', 'Because it separates those who recommend us from those who speak badly: a "good" average can hide many detractors.'), T('Porque el NPS siempre es más alto que el promedio.', 'Because NPS is always higher than the average.'), T('Porque el promedio no se puede calcular con puntajes.', 'Because the average cannot be computed with scores.')],
          correct: 0,
          why: [null, T('No: son escalas distintas (el NPS va de −100 a 100).', 'No: they are different scales (NPS goes from −100 to 100).'), T('Sí se puede: lo calculaste en E6.', 'It can: you computed it in E6.')],
          hint: T('Mirá E4.', 'Look at E4.'),
        },
      ],
      tips: [T('Los 7 y 8 son "pasivos": no suman ni restan.', '7s and 8s are "passives": they neither add nor subtract.'), T('El NPS va de −100 (todos detractores) a +100 (todos promotores).', 'NPS goes from −100 (all detractors) to +100 (all promoters).')],
      feedback: T('Gerencia entendió que un 7 promedio no es "bastante bien". Ya armamos un plan para los detractores.', 'Management understood that a 7 average is not "pretty good". We already have a plan for detractors.'),
      solution: { cells: { E2: `=CONTAR(B2:B${last})`, E3: `=CONTAR.SI(B2:B${last};">=9")`, E4: `=CONTAR.SI(B2:B${last};"<=6")`, E5: '=(E3-E4)/E2*100', E6: `=PROMEDIO(B2:B${last})` }, answers: { 3: 0 } },
    };
  });

  // ---------------------------------------------------------------------------
  // Elegir KPIs para un objetivo (+ indicador adelantado con datos)
  // ---------------------------------------------------------------------------
  C.register('m16_choose', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [40, 55], [80, 110], [140, 180]);
    const ACT = T('Activo', 'Active');
    const INA = T('Inactivo', 'Inactive');
    const YES = T('Sí', 'Yes');
    let rows;
    let a;
    let ab;
    let i;
    let ib;
    do {
      rows = Array.from({ length: n }, (_, k) => {
        const active = r.chance(0.7);
        return ['C-' + (8001 + k), active ? ACT : INA, r.chance(active ? 0.04 : 0.3) ? YES : 'No'];
      });
      a = rows.filter((x) => x[1] === ACT).length;
      ab = rows.filter((x) => x[1] === ACT && x[2] === YES).length;
      i = rows.filter((x) => x[1] === INA).length;
      ib = rows.filter((x) => x[1] === INA && x[2] === YES).length;
    } while (!a || !i || !ib || ib / i < 3 * (ab / a || 0.01));
    const last = n + 1;
    const rateA = ab / a;
    const rateI = ib / i;
    return {
      from: 'graciela',
      dept: 'gerencia',
      subject: T('Objetivo del año: que no se vayan los clientes', "This year's goal: keep customers from leaving"),
      file: T('clientes_uso.xlsx', 'customer_usage.xlsx'),
      email: T(
        `<p>El objetivo de la empresa este año es <b>reducir el abandono de clientes</b>. Necesito que definas con qué KPIs lo vamos a seguir.</p><p>Te paso una muestra de clientes: si usaron el producto en los últimos 30 días y si se dieron de baja el mes siguiente. Quizás ahí haya una pista.</p>`,
        `<p>The company's goal this year is to <b>reduce customer churn</b>. I need you to define which KPIs we'll use to track it.</p><p>Here's a sample of customers: whether they used the product in the last 30 days and whether they cancelled the following month. Maybe there's a clue there.</p>`
      ),
      sheet: {
        cols: 8,
        rows: n + 4,
        colWidths: [80, 120, 110, 30, 240, 90, 40, 40],
        data: { at: 'A1', rows: [[T('Cliente', 'Customer'), T('Uso (30 días)', 'Usage (30 days)'), T('Se dio de baja', 'Cancelled')], ...rows] },
        cells: { E2: T(`Tasa de baja de los ${ACT.toLowerCase()}s`, `${ACT} customers' churn rate`), E3: T(`Tasa de baja de los ${INA.toLowerCase()}s`, `${INA} customers' churn rate`) },
        locked: ['A1:C' + last, 'E2:E3'],
        header: ['A1:C1'],
        labels: ['E2:E3'],
        targets: ['F2:F3'],
        formats: { F: 'percent' },
        start: 'F2',
      },
      objectives: [
        {
          text: T(`F2 y F3: <b>tasa de baja</b> de clientes ${ACT.toLowerCase()}s e ${INA.toLowerCase()}s.`, `F2 and F3: <b>churn rate</b> of ${ACT.toLowerCase()} and ${INA.toLowerCase()} customers.`),
          hint: `=${fn('CONTAR.SI.CONJUNTO')}(B2:B${last}; "${ACT}"; C2:C${last}; "${YES}")/${fn('CONTAR.SI')}(B2:B${last}; "${ACT}")`,
          check: V.cells([['F2', rateA], ['F3', rateI]], { uses: ['CONTAR.SI.CONJUNTO', 'CONTAR.SI'], tol: 0.0005 }),
        },
        {
          text: T('❓ ¿Cuál es el mejor <b>KPI principal</b> para el objetivo?', '❓ What is the best <b>main KPI</b> for the goal?'),
          choices: [T('Tasa de baja mensual (bajas ÷ clientes al inicio del mes).', 'Monthly churn rate (cancellations ÷ customers at the start of the month).'), T('Seguidores en redes sociales.', 'Social media followers.'), T('Facturación total del año.', 'Total yearly revenue.')],
          correct: 0,
          why: [null, T('Métrica de vanidad: no mide si los clientes se quedan.', "Vanity metric: it doesn't measure whether customers stay."), T('Depende de muchas cosas además del abandono (precios, nuevos clientes…).', 'It depends on many things besides churn (prices, new customers…).')],
          hint: T('El KPI tiene que medir directamente el objetivo.', 'The KPI must directly measure the goal.'),
        },
        {
          text: T('❓ Con los datos de la planilla, ¿qué <b>indicador adelantado</b> propondrías?', '❓ Based on the spreadsheet, which <b>leading indicator</b> would you propose?'),
          choices: [T(`% de clientes ${INA.toLowerCase()}s (sin uso en 30 días): se dan de baja ${(rateI / Math.max(rateA, 0.001)).toFixed(0)} veces más y hay tiempo de contactarlos antes.`, `% of ${INA.toLowerCase()} customers (no usage in 30 days): they cancel ${(rateI / Math.max(rateA, 0.001)).toFixed(0)} times more and there's time to reach them first.`), T('Las bajas del mes pasado.', "Last month's cancellations."), T('La cantidad de clientes nuevos.', 'The number of new customers.')],
          correct: 0,
          why: [null, T('Es un indicador atrasado: cuando lo ves, el cliente ya se fue.', "It's a lagging indicator: by the time you see it, the customer is gone."), T('Importante, pero no anticipa quién se va a ir.', "Important, but it doesn't anticipate who will leave.")],
          hint: T('Adelantado = anticipa el resultado.', 'Leading = it anticipates the result.'),
        },
        {
          text: T('❓ ¿Cómo escribirías la <b>meta</b>?', '❓ How would you write the <b>target</b>?'),
          choices: [T('"Mejorar la retención de clientes."', '"Improve customer retention."'), T(`"Bajar la tasa de baja mensual de ${pct((ab + ib) / n)} a ${pct(((ab + ib) / n) * 0.75)} antes de diciembre."`, `"Reduce the monthly churn rate from ${pct((ab + ib) / n)} to ${pct(((ab + ib) / n) * 0.75)} before December."`), T('"Que ningún cliente se dé de baja."', '"No customer should cancel."')],
          correct: 1,
          why: [T('Sin número ni plazo, no se puede saber si se cumplió.', "Without a number or deadline, you can't tell whether it was met."), null, T('Imposible: una meta tiene que ser alcanzable.', 'Impossible: a target must be achievable.')],
          hint: T('Concreta, medible y con plazo.', 'Concrete, measurable and time-bound.'),
        },
      ],
      tips: [T('Tasa de baja de un grupo = bajas de ese grupo ÷ clientes de ese grupo.', "A group's churn rate = that group's cancellations ÷ that group's customers."), T('Comparar grupos es la forma más simple de encontrar indicadores adelantados.', 'Comparing groups is the simplest way to find leading indicators.')],
      feedback: T('Ya está en el plan anual: KPI de churn, alerta de clientes inactivos y una meta clara. Pensás como Senior. 👏', 'It\'s in the annual plan: churn KPI, inactive-customer alert and a clear target. You think like a Senior. 👏'),
      solution: { cells: { F2: `=CONTAR.SI.CONJUNTO(B2:B${last};"${ACT}";C2:C${last};"${YES}")/CONTAR.SI(B2:B${last};"${ACT}")`, F3: `=CONTAR.SI.CONJUNTO(B2:B${last};"${INA}";C2:C${last};"${YES}")/CONTAR.SI(B2:B${last};"${INA}")` }, answers: { 1: 0, 2: 0, 3: 1 } },
    };
  });
})();
