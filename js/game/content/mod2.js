/*
 * Analyst Adventure — Nivel 2: Funciones de resumen (rangos, SUMA, PROMEDIO, MAX, MIN, CONTAR).
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const C = AA.Content;
  const V = AA.V;
  const T = (es, en) => AA.T(es, en);
  const { REGIONS, MONTHS, CONCEPTS } = C.DATA;
  const sum = (a) => a.reduce((s, x) => s + x, 0);

  // Bloque de indicadores (etiqueta + valor) con una celda por función.
  function indicatorObjective(ref, label, expected, fns, hint) {
    return {
      text: T(`<b>${ref}</b>: ${label.es}.`, `<b>${ref}</b>: ${label.en}.`),
      hint,
      check: V.cell(ref, expected, { uses: fns }),
    };
  }

  // ---------------------------------------------------------------------------
  // Resumen trimestral por vendedor
  // ---------------------------------------------------------------------------
  C.register('m2_quarter', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [10, 12], [20, 25], [35, 40]);
    const m0 = r.int(0, 9);
    const months = [0, 1, 2].map((k) => C.L2(MONTHS[m0 + k]));
    const rows = C.people(r, n).map((who) => ({ who, reg: C.L2(r.pick(REGIONS.slice(0, 4))), v: [0, 1, 2].map(() => r.step(7000, 17000, 100)) }));
    const tot = (x) => sum(x.v);
    while (C.uniqueExtreme(rows.map(tot)) < 0) {
      const max = Math.max(...rows.map(tot));
      rows.find((x) => tot(x) === max).v[0] += 100;
    }
    const totals = rows.map(tot);
    const top = rows[C.uniqueExtreme(totals)];
    const last = n + 1;
    return {
      from: ctx.story ? 'marta' : 'bruno',
      dept: 'ventas',
      subject: T('Resumen del trimestre para gerencia', 'Quarterly summary for management'),
      file: T('ventas_trimestre.xlsx', 'quarterly_sales.xlsx'),
      email: T(
        `<p>Gerencia quiere un resumen del trimestre (${months.join(', ')}).</p>
         <p>Primero completá el <b>Total</b> de cada vendedor con <b>SUMA</b>. Después armá el cuadro de indicadores de la derecha.</p>
         <p>Y decime quién fue la estrella del trimestre.</p>`,
        `<p>Management wants a summary of the quarter (${months.join(', ')}).</p>
         <p>First fill in each seller's <b>Total</b> with <b>SUM</b>. Then build the indicator box on the right.</p>
         <p>And tell me who was the star of the quarter.</p>`
      ),
      sheet: {
        cols: 10,
        rows: n + 8,
        colWidths: [150, 80, 90, 90, 90, 100, 24, 200, 110, 60],
        data: { at: 'A1', rows: [[T('Vendedor', 'Seller'), T('Región', 'Region'), ...months], ...rows.map((x) => [x.who, x.reg, ...x.v])] },
        cells: {
          F1: 'Total', H1: T('Indicador', 'Indicator'), I1: T('Valor', 'Value'),
          H2: T('Ventas totales', 'Total sales'), H3: T('Promedio por vendedor', 'Average per seller'),
          H4: T('Mayor total', 'Highest total'), H5: T('Menor total', 'Lowest total'), H6: T('Cantidad de vendedores', 'Number of sellers'),
        },
        locked: ['A1:F1', 'A2:E' + last, 'H1:I1', 'H2:H6'],
        header: ['A1:F1', 'H1:I1'],
        labels: ['H2:H6'],
        targets: ['F2:F' + last, 'I2:I6'],
        formats: { C: 'int', D: 'int', E: 'int', F: 'int', I2: 'int', I3: 'int', I4: 'int', I5: 'int', I6: 'int' },
        start: 'F2',
      },
      objectives: [
        {
          text: T(`<b>Total</b> (F2:F${last}) con <code>=SUMA(C2:E2)</code>.`, `<b>Total</b> (F2:F${last}) with <code>=SUM(C2:E2)</code>.`),
          hint: T('En F2: =SUMA(C2:E2). Los dos puntos marcan un rango. Después rellená hacia abajo.', 'In F2: =SUM(C2:E2). The colon marks a range. Then fill down.'),
          check: V.column('F', 2, last, (row) => totals[row - 2], { uses: ['SUMA'] }),
        },
        indicatorObjective('I2', { es: 'ventas totales (SUMA de la columna F)', en: 'total sales (SUM of column F)' }, sum(totals), ['SUMA'], `=${AA.fnName('SUMA')}(F2:F${last})`),
        indicatorObjective('I3', { es: 'promedio por vendedor con PROMEDIO', en: 'average per seller with AVERAGE' }, sum(totals) / n, ['PROMEDIO'], `=${AA.fnName('PROMEDIO')}(F2:F${last})`),
        {
          text: T('<b>I4</b> y <b>I5</b>: el mayor y el menor total con <b>MAX</b> y <b>MIN</b>.', '<b>I4</b> and <b>I5</b>: the highest and lowest totals with <b>MAX</b> and <b>MIN</b>.'),
          hint: `=MAX(F2:F${last}) · =MIN(F2:F${last})`,
          check: V.cells([['I4', Math.max(...totals)], ['I5', Math.min(...totals)]], { usesByRef: { I4: ['MAX'], I5: ['MIN'] } }),
        },
        indicatorObjective('I6', { es: 'cantidad de vendedores con CONTARA o CONTAR', en: 'number of sellers with COUNTA or COUNT' }, n, ['CONTARA', 'CONTAR'], `=${AA.fnName('CONTARA')}(A2:A${last})`),
        {
          text: T('❓ ¿Quién fue la/el vendedor con <b>mayor total</b>?', '❓ Who was the seller with the <b>highest total</b>?'),
          placeholder: T('Nombre y apellido', 'Full name'),
          hint: T('Buscá en la columna F el valor igual a tu MAX de I4.', 'Look for the value in column F that matches your MAX in I4.'),
          answer: V.answerText([top.who]),
        },
      ],
      tips: [
        T('<b>SUMA(C2:E2)</b> es lo mismo que C2+D2+E2, pero escala a cualquier tamaño.', '<b>SUM(C2:E2)</b> is the same as C2+D2+E2, but it scales to any size.'),
        T('Los argumentos se separan con <b>;</b> o con <b>,</b>.', 'Arguments are separated with <b>,</b> or <b>;</b>.'),
      ],
      feedback: T('Gerencia quedó encantada con el resumen. ¡Y la estrella del trimestre también!', 'Management loved the summary. And so did the star of the quarter!'),
      solution: {
        fill: [['F', 2, last, '=SUMA(C2:E2)']],
        cells: { I2: `=SUMA(F2:F${last})`, I3: `=PROMEDIO(F2:F${last})`, I4: `=MAX(F2:F${last})`, I5: `=MIN(F2:F${last})`, I6: `=CONTARA(A2:A${last})` },
        answers: { 5: top.who },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Visitas diarias del sitio web
  // ---------------------------------------------------------------------------
  C.register('m2_visits', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [14, 14], [28, 31], [55, 60]);
    const start = new Date(Date.UTC(2026, r.int(0, 8), 1));
    const rows = [];
    for (let i = 0; i < n; i++) {
      const d = new Date(start.getTime() + i * 86400000);
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const label = AA.lang === 'en' ? `${MONTHS[d.getUTCMonth()][1]} ${dd}` : `${dd}/${mm}`;
      const weekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
      rows.push({ label, visits: r.int(weekend ? 600 : 1500, weekend ? 1800 : 4200), orders: r.int(10, 120) });
    }
    while (C.uniqueExtreme(rows.map((x) => x.visits)) < 0) {
      const max = Math.max(...rows.map((x) => x.visits));
      rows.find((x) => x.visits === max).visits += 1;
    }
    const visits = rows.map((x) => x.visits);
    const best = rows[C.uniqueExtreme(visits)];
    const last = n + 1;
    const fn = AA.fnName;
    return {
      from: 'tomas',
      dept: 'marketing',
      subject: T('¿Cómo vino el tráfico del sitio?', 'How was the website traffic?'),
      file: T('visitas_web.xlsx', 'web_visits.xlsx'),
      email: T(
        `<p>Tengo ${n} días de visitas y pedidos del sitio. Necesito los números básicos para la reunión de Marketing.</p>
         <p>Completá el cuadro de la derecha usando funciones.</p>`,
        `<p>I have ${n} days of website visits and orders. I need the basic numbers for the Marketing meeting.</p>
         <p>Fill in the box on the right using functions.</p>`
      ),
      sheet: {
        cols: 8,
        rows: Math.max(n + 6, 16),
        colWidths: [90, 100, 100, 24, 210, 110, 60, 60],
        data: { at: 'A1', rows: [[T('Día', 'Day'), T('Visitas', 'Visits'), T('Pedidos', 'Orders')], ...rows.map((x) => [x.label, x.visits, x.orders])] },
        cells: {
          E1: T('Indicador', 'Indicator'), F1: T('Valor', 'Value'),
          E2: T('Total de visitas', 'Total visits'), E3: T('Promedio diario de visitas', 'Daily average visits'),
          E4: T('Récord de visitas', 'Visits record'), E5: T('Peor día (visitas)', 'Worst day (visits)'),
          E6: T('Días medidos', 'Days measured'), E7: T('Total de pedidos', 'Total orders'),
        },
        locked: ['A1:C' + last, 'E1:F1', 'E2:E7'],
        header: ['A1:C1', 'E1:F1'],
        labels: ['E2:E7'],
        targets: ['F2:F7'],
        formats: { B: 'int', C: 'int', F2: 'int', F3: 'int', F4: 'int', F5: 'int', F6: 'int', F7: 'int' },
        start: 'F2',
      },
      objectives: [
        indicatorObjective('F2', { es: 'total de visitas', en: 'total visits' }, sum(visits), ['SUMA'], `=${fn('SUMA')}(B2:B${last})`),
        indicatorObjective('F3', { es: 'promedio diario de visitas', en: 'daily average visits' }, sum(visits) / n, ['PROMEDIO'], `=${fn('PROMEDIO')}(B2:B${last})`),
        {
          text: T('<b>F4</b> y <b>F5</b>: récord y peor día (MAX y MIN).', '<b>F4</b> and <b>F5</b>: record and worst day (MAX and MIN).'),
          hint: `=MAX(B2:B${last}) · =MIN(B2:B${last})`,
          check: V.cells([['F4', Math.max(...visits)], ['F5', Math.min(...visits)]], { usesByRef: { F4: ['MAX'], F5: ['MIN'] } }),
        },
        indicatorObjective('F6', { es: 'cantidad de días medidos (CONTAR)', en: 'number of days measured (COUNT)' }, n, ['CONTAR', 'CONTARA'], `=${fn('CONTAR')}(B2:B${last})`),
        indicatorObjective('F7', { es: 'total de pedidos', en: 'total orders' }, sum(rows.map((x) => x.orders)), ['SUMA'], `=${fn('SUMA')}(C2:C${last})`),
        {
          text: T('❓ ¿Qué <b>día</b> tuvo el récord de visitas?', '❓ Which <b>day</b> had the visits record?'),
          placeholder: AA.lang === 'en' ? 'Mar 05' : '05/03',
          hint: T('Buscá en la columna B el valor igual a tu récord.', 'Find the value in column B that matches your record.'),
          answer: V.answerText([best.label]),
        },
      ],
      tips: [T('Podés usar la columna entera: <code>=SUMA(B:B)</code> ignora el encabezado porque es texto.', 'You can use the whole column: <code>=SUM(B:B)</code> ignores the header because it is text.')],
      feedback: T('¡Joya! Ya tengo los números para la reunión. Ese día récord fue por la campaña de mails 😎', 'Awesome! I have the numbers for the meeting. That record day was thanks to the email campaign 😎'),
      solution: {
        cells: { F2: `=SUMA(B2:B${last})`, F3: `=PROMEDIO(B2:B${last})`, F4: `=MAX(B2:B${last})`, F5: `=MIN(B2:B${last})`, F6: `=CONTAR(B2:B${last})`, F7: `=SUMA(C2:C${last})` },
        answers: { 5: best.label },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Notas de capacitación: promedio por persona
  // ---------------------------------------------------------------------------
  C.register('m2_training', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [8, 10], [18, 24], [30, 40]);
    const rows = C.people(r, n).map((who) => ({ who, s: [r.int(4, 10), r.int(4, 10), r.int(3, 10)] }));
    const avg = (x) => sum(x.s) / 3;
    while (C.uniqueExtreme(rows.map(avg)) < 0) {
      const max = Math.max(...rows.map(avg));
      const x = rows.find((y) => avg(y) === max);
      const k = x.s.findIndex((v) => v < 10);
      if (k >= 0) x.s[k] += 1;
      else rows.find((y) => avg(y) === max && y !== x).s[0] -= 1;
    }
    const avgs = rows.map(avg);
    const best = rows[C.uniqueExtreme(avgs)];
    const last = n + 1;
    const fn = AA.fnName;
    return {
      from: 'paula',
      dept: 'rrhh',
      subject: T('Resultados de la capacitación', 'Training results'),
      file: T('capacitacion_notas.xlsx', 'training_scores.xlsx'),
      email: T(
        `<p>Terminó la capacitación de herramientas y tengo las notas de cada curso (1 a 10).</p>
         <p>Necesito el <b>promedio</b> de cada persona y un par de indicadores generales.</p>`,
        `<p>The tools training is over and I have the scores for each course (1 to 10).</p>
         <p>I need each person's <b>average</b> and a couple of overall indicators.</p>`
      ),
      sheet: {
        cols: 9,
        rows: n + 8,
        colWidths: [160, 80, 80, 90, 100, 24, 200, 100, 60],
        data: { at: 'A1', rows: [[T('Empleado', 'Employee'), 'Excel', 'SQL', 'Power BI'], ...rows.map((x) => [x.who, ...x.s])] },
        cells: {
          E1: T('Promedio', 'Average'), G1: T('Indicador', 'Indicator'), H1: T('Valor', 'Value'),
          G2: T('Mejor promedio', 'Best average'), G3: T('Peor promedio', 'Worst average'), G4: T('Promedio del curso de Excel', 'Excel course average'),
        },
        locked: ['A1:E1', 'A2:D' + last, 'G1:H1', 'G2:G4'],
        header: ['A1:E1', 'G1:H1'],
        labels: ['G2:G4'],
        targets: ['E2:E' + last, 'H2:H4'],
        formats: { E: 'dec2', H2: 'dec2', H3: 'dec2', H4: 'dec2' },
        start: 'E2',
      },
      objectives: [
        {
          text: T(`<b>Promedio</b> de cada persona (E2:E${last}) con PROMEDIO.`, `Each person's <b>average</b> (E2:E${last}) with AVERAGE.`),
          hint: `=${fn('PROMEDIO')}(B2:D2)`,
          check: V.column('E', 2, last, (row) => avgs[row - 2], { uses: ['PROMEDIO'] }),
        },
        {
          text: T('<b>H2</b> y <b>H3</b>: mejor y peor promedio.', '<b>H2</b> and <b>H3</b>: best and worst average.'),
          hint: `=MAX(E2:E${last}) · =MIN(E2:E${last})`,
          check: V.cells([['H2', Math.max(...avgs)], ['H3', Math.min(...avgs)]], { usesByRef: { H2: ['MAX'], H3: ['MIN'] } }),
        },
        indicatorObjective('H4', { es: 'promedio del curso de Excel (columna B)', en: 'Excel course average (column B)' }, sum(rows.map((x) => x.s[0])) / n, ['PROMEDIO'], `=${fn('PROMEDIO')}(B2:B${last})`),
        {
          text: T('❓ ¿Quién tuvo el <b>mejor promedio</b>?', '❓ Who had the <b>best average</b>?'),
          placeholder: T('Nombre y apellido', 'Full name'),
          hint: T('Buscá en la columna E el valor de H2.', 'Find the value of H2 in column E.'),
          answer: V.answerText([best.who]),
        },
      ],
      tips: [T('PROMEDIO también sirve en horizontal: <code>=PROMEDIO(B2:D2)</code>.', 'AVERAGE works horizontally too: <code>=AVERAGE(B2:D2)</code>.')],
      feedback: T('¡Gracias! Ya sé a quién proponer como tutor para la próxima camada.', 'Thanks! Now I know who to propose as a tutor for the next group.'),
      solution: {
        fill: [['E', 2, last, '=PROMEDIO(B2:D2)']],
        cells: { H2: `=MAX(E2:E${last})`, H3: `=MIN(E2:E${last})`, H4: `=PROMEDIO(B2:B${last})` },
        answers: { 3: best.who },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Gastos por mes: totales por fila y por columna
  // ---------------------------------------------------------------------------
  C.register('m2_expenses', (ctx) => {
    const r = ctx.rng;
    const k = C.rowsFor(ctx, [6, 8], [10, 14], [16, 20]);
    const concepts = r.sample(CONCEPTS, k).map(C.L2);
    const months = MONTHS.slice(0, 6).map(C.L2);
    const vals = concepts.map(() => months.map(() => r.step(500, 20000, 100)));
    const colSum = () => months.map((_, j) => sum(vals.map((v) => v[j])));
    let colTot = colSum();
    let rowT = vals.map(sum);
    // Mes y concepto con más gasto tienen que ser únicos.
    while (C.uniqueExtreme(colTot) < 0 || C.uniqueExtreme(rowT) < 0) {
      if (C.uniqueExtreme(colTot) < 0) vals[0][colTot.lastIndexOf(Math.max(...colTot))] += 100;
      else vals[rowT.lastIndexOf(Math.max(...rowT))][0] += 100;
      colTot = colSum();
      rowT = vals.map(sum);
    }
    const totRow = k + 2;
    const lastData = k + 1;
    const cols = ['B', 'C', 'D', 'E', 'F', 'G'];
    const topMonth = months[C.uniqueExtreme(colTot)];
    const topConcept = concepts[C.uniqueExtreme(rowT)];
    const fn = AA.fnName;
    return {
      from: 'julia',
      dept: 'finanzas',
      subject: T('Gastos del semestre', 'Half-year expenses'),
      file: T('gastos_semestre.xlsx', 'half_year_expenses.xlsx'),
      email: T(
        `<p>Te paso los gastos del semestre por concepto y por mes.</p>
         <p>Necesito el <b>total de cada concepto</b> (columna H) y el <b>total de cada mes</b> (fila ${totRow}).</p>`,
        `<p>Here are the half-year expenses by concept and month.</p>
         <p>I need the <b>total for each concept</b> (column H) and the <b>total for each month</b> (row ${totRow}).</p>`
      ),
      sheet: {
        cols: 10,
        rows: totRow + 6,
        colWidths: [170, 85, 85, 85, 85, 85, 85, 110, 60, 60],
        data: { at: 'A1', rows: [[T('Concepto', 'Concept'), ...months], ...concepts.map((c, i) => [c, ...vals[i]])] },
        cells: { H1: 'Total', ['A' + totRow]: 'Total' },
        locked: ['A1:H1', 'A2:G' + lastData, 'A' + totRow],
        header: ['A1:H1', 'A' + totRow],
        targets: ['H2:H' + totRow, 'B' + totRow + ':G' + totRow],
        formats: { B: 'int', C: 'int', D: 'int', E: 'int', F: 'int', G: 'int', H: 'int' },
        start: 'H2',
      },
      objectives: [
        {
          text: T(`<b>Total por concepto</b> (H2:H${lastData}): suma de la fila.`, `<b>Total per concept</b> (H2:H${lastData}): sum of the row.`),
          hint: `=${fn('SUMA')}(B2:G2)`,
          check: V.column('H', 2, lastData, (row) => rowT[row - 2], { uses: ['SUMA'] }),
        },
        {
          text: T(`<b>Total por mes</b> (B${totRow}:G${totRow}): suma de cada columna. Escribila en B${totRow} y rellená hacia la <b>derecha</b>.`, `<b>Total per month</b> (B${totRow}:G${totRow}): sum of each column. Write it in B${totRow} and fill to the <b>right</b>.`),
          hint: T(`=SUMA(B2:B${lastData}) y arrastrá el cuadradito hacia la derecha (o Ctrl+R).`, `=SUM(B2:B${lastData}) and drag the little square to the right (or Ctrl+R).`),
          check: V.cells(cols.map((c, j) => [c + totRow, colTot[j]]), { uses: ['SUMA'] }),
        },
        {
          text: T(`<b>H${totRow}</b>: el gasto total del semestre.`, `<b>H${totRow}</b>: total expenses for the half-year.`),
          hint: T(`=SUMA(H2:H${lastData}) o =SUMA(B${totRow}:G${totRow}): dan lo mismo.`, `=SUM(H2:H${lastData}) or =SUM(B${totRow}:G${totRow}): same result.`),
          check: V.cell('H' + totRow, sum(colTot), { uses: ['SUMA'] }),
        },
        {
          text: T('❓ ¿En qué <b>mes</b> se gastó más?', '❓ In which <b>month</b> was the most spent?'),
          placeholder: T('Mes', 'Month'),
          hint: T(`Compará los totales de la fila ${totRow}.`, `Compare the totals in row ${totRow}.`),
          answer: V.answerText([topMonth]),
        },
        {
          text: T('❓ ¿Qué <b>concepto</b> costó más en el semestre?', '❓ Which <b>concept</b> cost the most in the half-year?'),
          placeholder: T('Concepto', 'Concept'),
          hint: T('Compará los totales de la columna H.', 'Compare the totals in column H.'),
          answer: V.answerText([topConcept]),
        },
      ],
      tips: [T('El controlador de relleno también funciona hacia la derecha: las columnas se corren solas (B → C → D).', 'The fill handle also works to the right: columns shift by themselves (B → C → D).')],
      feedback: T('Perfecto, con esto cierro el informe semestral.', 'Perfect, this closes the half-year report.'),
      solution: {
        fill: [['H', 2, lastData, '=SUMA(B2:G2)']],
        fillRight: [[totRow, 'B', 'G', `=SUMA(B2:B${lastData})`]],
        cells: { ['H' + totRow]: `=SUMA(H2:H${lastData})` },
        answers: { 3: topMonth, 4: topConcept },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Call center: indicadores de llamadas
  // ---------------------------------------------------------------------------
  C.register('m2_callcenter', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [8, 10], [18, 24], [30, 40]);
    const rows = C.people(r, n).map((who) => {
      const calls = r.int(40, 160);
      return { who, calls, mins: calls * r.int(3, 9) + r.int(0, 30) };
    });
    const calls = rows.map((x) => x.calls);
    const avg = sum(calls) / n;
    const above = calls.filter((c) => c > avg).length;
    const totalMins = sum(rows.map((x) => x.mins));
    const last = n + 1;
    const fn = AA.fnName;
    return {
      from: 'ramiro',
      dept: 'logistica',
      subject: T('Rendimiento del centro de atención', 'Call center performance'),
      file: T('llamadas_semana.xlsx', 'weekly_calls.xlsx'),
      email: T(
        '<p>Necesito los indicadores de la semana del centro de atención: totales, promedio, mejor y peor agente.</p>',
        "<p>I need this week's call center indicators: totals, average, best and worst agent.</p>"
      ),
      sheet: {
        cols: 8,
        rows: Math.max(n + 6, 14),
        colWidths: [170, 100, 110, 24, 220, 110, 60, 60],
        data: { at: 'A1', rows: [[T('Agente', 'Agent'), T('Llamadas', 'Calls'), T('Minutos', 'Minutes')], ...rows.map((x) => [x.who, x.calls, x.mins])] },
        cells: {
          E1: T('Indicador', 'Indicator'), F1: T('Valor', 'Value'),
          E2: T('Total de llamadas', 'Total calls'), E3: T('Promedio por agente', 'Average per agent'),
          E4: T('Más llamadas', 'Most calls'), E5: T('Menos llamadas', 'Fewest calls'), E6: T('Cantidad de agentes', 'Number of agents'),
        },
        locked: ['A1:C' + last, 'E1:F1', 'E2:E6'],
        header: ['A1:C1', 'E1:F1'],
        labels: ['E2:E6'],
        targets: ['F2:F6'],
        formats: { B: 'int', C: 'int', F2: 'int', F3: 'dec2', F4: 'int', F5: 'int', F6: 'int' },
        start: 'F2',
      },
      objectives: [
        indicatorObjective('F2', { es: 'total de llamadas', en: 'total calls' }, sum(calls), ['SUMA'], `=${fn('SUMA')}(B2:B${last})`),
        indicatorObjective('F3', { es: 'promedio de llamadas por agente', en: 'average calls per agent' }, avg, ['PROMEDIO'], `=${fn('PROMEDIO')}(B2:B${last})`),
        {
          text: T('<b>F4</b> y <b>F5</b>: más y menos llamadas.', '<b>F4</b> and <b>F5</b>: most and fewest calls.'),
          hint: `=MAX(B2:B${last}) · =MIN(B2:B${last})`,
          check: V.cells([['F4', Math.max(...calls)], ['F5', Math.min(...calls)]], { usesByRef: { F4: ['MAX'], F5: ['MIN'] } }),
        },
        indicatorObjective('F6', { es: 'cantidad de agentes (CONTARA sobre los nombres)', en: 'number of agents (COUNTA over the names)' }, n, ['CONTARA', 'CONTAR'], `=${fn('CONTARA')}(A2:A${last})`),
        {
          text: T('❓ ¿Cuántos agentes atendieron <b>más llamadas que el promedio</b>?', '❓ How many agents took <b>more calls than average</b>?'),
          placeholder: T('Un número', 'A number'),
          hint: T('Compará cada valor de la columna B con tu promedio de F3.', 'Compare each value in column B with your average in F3.'),
          answer: V.answerNumber(above),
        },
        {
          text: T('❓ ¿Cuántos <b>minutos</b> se hablaron en total?', '❓ How many <b>minutes</b> were spent on calls in total?'),
          placeholder: T('Un número', 'A number'),
          hint: T('Usá una celda libre con SUMA sobre la columna C.', 'Use a free cell with SUM over column C.'),
          answer: V.answerNumber(totalMins),
        },
      ],
      tips: [T('Para responder preguntas extra, usá cualquier celda libre como "borrador".', 'To answer extra questions, use any free cell as scratch space.')],
      feedback: T('Gracias. Ahora sé cómo repartir los turnos de la semana que viene.', "Thanks. Now I know how to split next week's shifts."),
      solution: {
        cells: { F2: `=SUMA(B2:B${last})`, F3: `=PROMEDIO(B2:B${last})`, F4: `=MAX(B2:B${last})`, F5: `=MIN(B2:B${last})`, F6: `=CONTARA(A2:A${last})` },
        answers: { 4: String(above), 5: String(totalMins) },
      },
    };
  });
})();
