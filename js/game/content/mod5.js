/*
 * Analyst Adventure — Nivel 5: Conteos condicionales (CONTAR.SI, SUMAR.SI, *.CONJUNTO)
 * y referencias absolutas / mixtas ($).
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const C = AA.Content;
  const V = AA.V;
  const T = (es, en) => AA.T(es, en);
  const { REGIONS, CARRIERS } = C.DATA;
  const sum = (a) => a.reduce((s, x) => s + x, 0);

  // Estados de envío con distinta probabilidad según transportista.
  const STATUS = [['Entregado', 'Delivered'], ['Demorado', 'Delayed'], ['Cancelado', 'Cancelled']];

  function shipments(r, n, regs, carriers, badCarrier) {
    const rows = [];
    for (let i = 0; i < n; i++) {
      const carrier = r.pick(carriers);
      const pDelay = carrier === badCarrier ? 0.55 : 0.12;
      const roll = r.next();
      const st = roll < pDelay ? 1 : roll < pDelay + 0.08 ? 2 : 0;
      rows.push({ id: 'E-' + (201 + i), reg: r.pick(regs), carrier, st, cost: r.step(800, 2000, 10) });
    }
    return rows;
  }
  // Garantiza que copiar la fórmula SIN $ dé un resultado distinto (para que la lección se note):
  // la primera fila de datos tiene que ser de la segunda categoría del resumen.
  function dollarTrap(rows, key, secondValue) {
    rows[0][key] = secondValue;
  }

  // ---------------------------------------------------------------------------
  // Envíos por región (CONTAR.SI, SUMAR.SI, CONTAR.SI.CONJUNTO)
  // ---------------------------------------------------------------------------
  C.register('m5_shipments', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [22, 26], [32, 40], [50, 60]);
    const regs = REGIONS.slice(0, 4).map(C.L2);
    const carriers = r.sample(CARRIERS, 3);
    const bad = carriers[r.int(0, 2)];
    let rows;
    let delays;
    let byCarrier;
    do {
      rows = shipments(r, n, regs, carriers, bad);
      dollarTrap(rows, 'reg', regs[1]);
      delays = regs.map((g) => rows.filter((x) => x.reg === g && x.st === 1).length);
      byCarrier = carriers.map((c) => rows.filter((x) => x.carrier === c && x.st === 1).length);
    } while (C.uniqueExtreme(delays) < 0 || C.uniqueExtreme(byCarrier) < 0);
    const count = regs.map((g) => rows.filter((x) => x.reg === g).length);
    const cost = regs.map((g) => sum(rows.filter((x) => x.reg === g).map((x) => x.cost)));
    const last = n + 1;
    const delayed = C.L2(STATUS[1]);
    const fn = AA.fnName;
    return {
      from: 'ramiro',
      dept: 'logistica',
      subject: T('¿Dónde se traban nuestros envíos?', 'Where are our shipments getting stuck?'),
      file: T('envios_mes.xlsx', 'monthly_shipments.xlsx'),
      email: T(
        `<p>Los clientes se quejan de demoras y quiero saber <b>dónde está el problema</b> antes de la reunión con los transportistas.</p>
         <p>Para cada región necesito: cuántos <b>envíos</b> hubo, el <b>costo total</b> y cuántos quedaron <b>demorados</b>.</p>`,
        `<p>Customers are complaining about delays and I want to know <b>where the problem is</b> before the meeting with the carriers.</p>
         <p>For each region I need: how many <b>shipments</b> there were, the <b>total cost</b> and how many were <b>delayed</b>.</p>`
      ),
      sheet: {
        cols: 12,
        rows: n + 6,
        colWidths: [70, 80, 110, 100, 90, 24, 24, 90, 80, 110, 100, 60],
        data: {
          at: 'A1',
          rows: [[T('Envío', 'Shipment'), T('Región', 'Region'), T('Transportista', 'Carrier'), T('Estado', 'Status'), T('Costo', 'Cost')], ...rows.map((x) => [x.id, x.reg, x.carrier, C.L2(STATUS[x.st]), x.cost])],
        },
        cells: { H1: T('Región', 'Region'), I1: T('Envíos', 'Shipments'), J1: T('Costo total', 'Total cost'), K1: T('Demorados', 'Delayed'), H2: regs[0], H3: regs[1], H4: regs[2], H5: regs[3] },
        locked: ['A1:E' + last, 'H1:K1', 'H2:H5'],
        header: ['A1:E1', 'H1:K1'],
        labels: ['H2:H5'],
        targets: ['I2:K5'],
        formats: { E: 'currency', J: 'currency' },
        start: 'I2',
      },
      objectives: [
        {
          text: T('<b>Envíos</b> por región (I2:I5) con CONTAR.SI.', '<b>Shipments</b> per region (I2:I5) with COUNTIF.'),
          hint: T(`En I2: =CONTAR.SI($B$2:$B$${last}; H2). Los $ fijan el rango para que no se corra al copiar (F4 los agrega).`, `In I2: =COUNTIF($B$2:$B$${last}, H2). The $ lock the range so it doesn't shift when copied (F4 adds them).`),
          check: V.column('I', 2, 5, (row) => count[row - 2], { uses: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'], dollarHint: true }),
        },
        {
          text: T('<b>Costo total</b> por región (J2:J5) con SUMAR.SI.', '<b>Total cost</b> per region (J2:J5) with SUMIF.'),
          hint: `=${fn('SUMAR.SI')}($B$2:$B$${last}; H2; $E$2:$E$${last})`,
          check: V.column('J', 2, 5, (row) => cost[row - 2], { uses: ['SUMAR.SI', 'SUMAR.SI.CONJUNTO'], dollarHint: true }),
        },
        {
          text: T('<b>Demorados</b> por región (K2:K5) con CONTAR.SI.CONJUNTO.', '<b>Delayed</b> per region (K2:K5) with COUNTIFS.'),
          hint: `=${fn('CONTAR.SI.CONJUNTO')}($B$2:$B$${last}; H2; $D$2:$D$${last}; "${delayed}")`,
          check: V.column('K', 2, 5, (row) => delays[row - 2], { uses: ['CONTAR.SI.CONJUNTO'], dollarHint: true }),
        },
        {
          text: T('❓ ¿Qué región tiene <b>más envíos demorados</b>?', '❓ Which region has the <b>most delayed shipments</b>?'),
          placeholder: T('Región', 'Region'),
          hint: T('Mirá la columna K.', 'Look at column K.'),
          answer: V.answerText([regs[C.uniqueExtreme(delays)]]),
        },
        {
          text: T('❓ ¿Qué <b>transportista</b> acumula más demoras?', '❓ Which <b>carrier</b> has the most delays?'),
          placeholder: T('Transportista', 'Carrier'),
          hint: T(`En una celda libre: =CONTAR.SI.CONJUNTO(C2:C${last}; "${carriers[0]}"; D2:D${last}; "${delayed}") y probá con cada uno.`, `In a free cell: =COUNTIFS(C2:C${last}, "${carriers[0]}", D2:D${last}, "${delayed}") and try each one.`),
          answer: V.answerText([carriers[C.uniqueExtreme(byCarrier)]]),
        },
      ],
      tips: [
        T('<b>$B$2:$B$30</b> no cambia al copiar la fórmula. <b>F4</b> agrega los $ mientras editás.', '<b>$B$2:$B$30</b> does not change when you copy the formula. <b>F4</b> adds the $ while editing.'),
        T('Otra opción: columnas enteras como <b>B:B</b>.', 'Another option: whole columns like <b>B:B</b>.'),
      ],
      feedback: T('Fui a la reunión con tu tabla y el transportista ya prometió un plan de mejora. ¡Eso es impacto!', 'I went to the meeting with your table and the carrier already promised an improvement plan. That is impact!'),
      solution: {
        fill: [['I', 2, 5, `=CONTAR.SI($B$2:$B$${last};H2)`], ['J', 2, 5, `=SUMAR.SI($B$2:$B$${last};H2;$E$2:$E$${last})`], ['K', 2, 5, `=CONTAR.SI.CONJUNTO($B$2:$B$${last};H2;$D$2:$D$${last};"${delayed}")`]],
        answers: { 3: regs[C.uniqueExtreme(delays)], 4: carriers[C.uniqueExtreme(byCarrier)] },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Ventas por región con SUMAR.SI
  // ---------------------------------------------------------------------------
  C.register('m5_sales', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [20, 24], [32, 40], [50, 60]);
    const regs = REGIONS.map(C.L2);
    const sellers = C.people(r, 8);
    let rows;
    let totals;
    do {
      rows = [];
      for (let i = 0; i < n; i++) rows.push({ who: r.pick(sellers), reg: r.pick(regs), amount: r.step(1000, 25000, 50) });
      dollarTrap(rows, 'reg', regs[1]);
      totals = regs.map((g) => sum(rows.filter((x) => x.reg === g).map((x) => x.amount)));
    } while (C.uniqueExtreme(totals) < 0 || regs.some((g) => !rows.some((x) => x.reg === g)));
    const ops = regs.map((g) => rows.filter((x) => x.reg === g).length);
    const askIdx = r.int(0, 4);
    const avgTicket = totals[askIdx] / ops[askIdx];
    const last = n + 1;
    const fn = AA.fnName;
    return {
      from: 'bruno',
      dept: 'ventas',
      subject: T('Ventas por región', 'Sales by region'),
      file: T('ventas_regiones.xlsx', 'regional_sales.xlsx'),
      email: T(
        '<p>Para el plan del año que viene necesito, por región, el <b>total vendido</b> y la <b>cantidad de operaciones</b>.</p>',
        "<p>For next year's plan I need, per region, the <b>total sold</b> and the <b>number of deals</b>.</p>"
      ),
      sheet: {
        cols: 10,
        rows: n + 6,
        colWidths: [160, 80, 110, 24, 90, 120, 110, 60, 60, 60],
        data: { at: 'A1', rows: [[T('Vendedor', 'Seller'), T('Región', 'Region'), T('Monto', 'Amount')], ...rows.map((x) => [x.who, x.reg, x.amount])] },
        cells: { E1: T('Región', 'Region'), F1: T('Total vendido', 'Total sold'), G1: T('Operaciones', 'Deals'), E2: regs[0], E3: regs[1], E4: regs[2], E5: regs[3], E6: regs[4] },
        locked: ['A1:C' + last, 'E1:G1', 'E2:E6'],
        header: ['A1:C1', 'E1:G1'],
        labels: ['E2:E6'],
        targets: ['F2:G6'],
        formats: { C: 'currency', F: 'currency', G: 'int' },
        start: 'F2',
      },
      objectives: [
        {
          text: T('<b>Total vendido</b> por región (F2:F6) con SUMAR.SI.', '<b>Total sold</b> per region (F2:F6) with SUMIF.'),
          hint: `=${fn('SUMAR.SI')}($B$2:$B$${last}; E2; $C$2:$C$${last})`,
          check: V.column('F', 2, 6, (row) => totals[row - 2], { uses: ['SUMAR.SI', 'SUMAR.SI.CONJUNTO'], dollarHint: true }),
        },
        {
          text: T('<b>Operaciones</b> por región (G2:G6) con CONTAR.SI.', '<b>Deals</b> per region (G2:G6) with COUNTIF.'),
          hint: `=${fn('CONTAR.SI')}($B$2:$B$${last}; E2)`,
          check: V.column('G', 2, 6, (row) => ops[row - 2], { uses: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'], dollarHint: true }),
        },
        {
          text: T('❓ ¿Qué región <b>vendió más</b>?', '❓ Which region <b>sold the most</b>?'),
          placeholder: T('Región', 'Region'),
          hint: T('Mirá la columna F.', 'Look at column F.'),
          answer: V.answerText([regs[C.uniqueExtreme(totals)]]),
        },
        {
          text: T(`❓ ¿Cuál es el <b>ticket promedio</b> (total ÷ operaciones) de la región <b>${regs[askIdx]}</b>?`, `❓ What is the <b>average deal size</b> (total ÷ deals) in the <b>${regs[askIdx]}</b> region?`),
          placeholder: T('Un monto', 'An amount'),
          hint: T('Dividí el total vendido por la cantidad de operaciones de esa región.', 'Divide total sold by the number of deals in that region.'),
          answer: V.answerNumber(avgTicket, 0.01),
        },
      ],
      tips: [T('SUMAR.SI: primero dónde buscar, después qué buscar y al final qué sumar.', 'SUMIF: first where to look, then what to look for and finally what to add.')],
      feedback: T('Con esto ya puedo repartir los objetivos por región. ¡Gracias!', 'With this I can split the targets by region. Thanks!'),
      solution: {
        fill: [['F', 2, 6, `=SUMAR.SI($B$2:$B$${last};E2;$C$2:$C$${last})`], ['G', 2, 6, `=CONTAR.SI($B$2:$B$${last};E2)`]],
        answers: { 2: regs[C.uniqueExtreme(totals)], 3: String(avgTicket) },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Tickets de soporte: porcentaje del total con una celda fija ($F$5)
  // ---------------------------------------------------------------------------
  C.register('m5_tickets', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [20, 24], [32, 40], [50, 60]);
    const states = [['Abierto', 'Open'], ['En curso', 'In progress'], ['Cerrado', 'Closed']].map(C.L2);
    const prios = [['Alta', 'High'], ['Media', 'Medium'], ['Baja', 'Low']].map(C.L2);
    const rows = [];
    for (let i = 0; i < n; i++) rows.push({ id: '#' + (3101 + i), prio: r.pick(prios), st: states[r.next() < 0.3 ? 0 : r.next() < 0.4 ? 1 : 2] });
    rows[0].st = states[0];
    rows[0].prio = prios[0];
    const counts = states.map((s) => rows.filter((x) => x.st === s).length);
    const closedPct = counts[2] / n;
    const openHigh = rows.filter((x) => x.st === states[0] && x.prio === prios[0]).length;
    const last = n + 1;
    const fn = AA.fnName;
    // La respuesta se acepta como 45 o como 0.45.
    const pctAnswer = (a) => V.answerNumber(closedPct * 100, 0.1)(a) || V.answerNumber(closedPct, 0.001)(a);
    return {
      from: 'camila',
      dept: 'data',
      subject: T('Estado de los tickets de soporte', 'Support ticket status'),
      file: T('tickets_soporte.xlsx', 'support_tickets.xlsx'),
      email: T(
        `<p>Necesito un mini resumen de los tickets: <b>cuántos</b> hay en cada estado y qué <b>porcentaje del total</b> representa cada uno.</p>
         <p>Ojo con el porcentaje: todas las filas se dividen por el <b>mismo</b> total.</p>`,
        `<p>I need a mini summary of the tickets: <b>how many</b> are in each status and what <b>percentage of the total</b> each one represents.</p>
         <p>Careful with the percentage: every row is divided by the <b>same</b> total.</p>`
      ),
      sheet: {
        cols: 9,
        rows: n + 6,
        colWidths: [80, 100, 120, 24, 120, 100, 120, 60, 60],
        data: { at: 'A1', rows: [['Ticket', T('Prioridad', 'Priority'), T('Estado', 'Status')], ...rows.map((x) => [x.id, x.prio, x.st])] },
        cells: { E1: T('Estado', 'Status'), F1: T('Cantidad', 'Count'), G1: T('% del total', '% of total'), E2: states[0], E3: states[1], E4: states[2], E5: 'Total' },
        locked: ['A1:C' + last, 'E1:G1', 'E2:E5'],
        header: ['A1:C1', 'E1:G1'],
        labels: ['E2:E5'],
        targets: ['F2:F5', 'G2:G4'],
        formats: { F: 'int', G: 'percent' },
        start: 'F2',
      },
      objectives: [
        {
          text: T('<b>Cantidad</b> por estado (F2:F4) con CONTAR.SI.', '<b>Count</b> per status (F2:F4) with COUNTIF.'),
          hint: `=${fn('CONTAR.SI')}($C$2:$C$${last}; E2)`,
          check: V.column('F', 2, 4, (row) => counts[row - 2], { uses: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'], dollarHint: true }),
        },
        {
          text: T('<b>F5</b>: total de tickets.', '<b>F5</b>: total tickets.'),
          hint: `=${fn('SUMA')}(F2:F4)`,
          check: V.cell('F5', n, {}),
        },
        {
          text: T('<b>% del total</b> (G2:G4): cantidad ÷ total. Fijá el total con <b>$F$5</b> antes de copiar.', '<b>% of total</b> (G2:G4): count ÷ total. Lock the total with <b>$F$5</b> before copying.'),
          hint: T('En G2: =F2/$F$5 y rellená hacia abajo. Sin el $, la fórmula de abajo dividiría por F6 (vacía).', 'In G2: =F2/$F$5 and fill down. Without the $, the formula below would divide by F6 (empty).'),
          check: V.column('G', 2, 4, (row) => counts[row - 2] / n, { absRows: ['F5'], tol: 0.0005 }),
        },
        {
          text: T('❓ ¿Qué <b>porcentaje</b> de tickets está cerrado?', '❓ What <b>percentage</b> of tickets is closed?'),
          placeholder: T('Ej: 45', 'E.g. 45'),
          hint: T('Mirá la columna G.', 'Look at column G.'),
          answer: pctAnswer,
        },
        {
          text: T(`❓ ¿Cuántos tickets <b>${states[0]}</b> tienen prioridad <b>${prios[0]}</b>?`, `❓ How many <b>${states[0]}</b> tickets have <b>${prios[0]}</b> priority?`),
          placeholder: T('Un número', 'A number'),
          hint: `=${fn('CONTAR.SI.CONJUNTO')}(C2:C${last}; "${states[0]}"; B2:B${last}; "${prios[0]}")`,
          answer: V.answerNumber(openHigh),
        },
      ],
      tips: [T('<b>$F$5</b> es una referencia absoluta: al copiar la fórmula siempre apunta a F5.', '<b>$F$5</b> is an absolute reference: when copied, it always points to F5.')],
      feedback: T('¡Gracias! Ya tengo el resumen para el comité de soporte.', 'Thanks! I have the summary for the support committee.'),
      solution: {
        fill: [['F', 2, 4, `=CONTAR.SI($C$2:$C$${last};E2)`], ['G', 2, 4, '=F2/$F$5']],
        cells: { F5: '=SUMA(F2:F4)' },
        answers: { 3: String(Math.round(closedPct * 10000) / 100), 4: String(openHigh) },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Comisiones con una celda de parámetro ($F$2) y "¿qué pasaría si…?"
  // ---------------------------------------------------------------------------
  C.register('m5_commission', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [10, 12], [20, 25], [35, 40]);
    const rows = C.people(r, n).map((who) => ({ who, sales: r.step(20000, 150000, 500) }));
    const total = sum(rows.map((x) => x.sales));
    const last = n + 1;
    const fn = AA.fnName;
    const rate = (S) => (typeof S.v('F2') === 'number' ? S.v('F2') : 0.05);
    return {
      from: 'julia',
      dept: 'finanzas',
      subject: T('Comisiones y una pregunta de "qué pasaría si"', 'Commissions and a "what if" question'),
      file: T('comisiones.xlsx', 'commissions.xlsx'),
      email: T(
        `<p>La comisión de los vendedores es del <b>5%</b> de sus ventas. Puse ese porcentaje en la celda <b>F2</b> para poder cambiarlo.</p>
         <p>Calculá la comisión de cada uno <b>usando la celda F2</b> (no escribas 5% en la fórmula) y el total a pagar en F4.</p>
         <p>Después decime: si subimos la comisión al <b>7%</b>, ¿cuánto pagaríamos en total?</p>`,
        `<p>Sellers' commission is <b>5%</b> of their sales. I put that percentage in cell <b>F2</b> so we can change it.</p>
         <p>Calculate each person's commission <b>using cell F2</b> (don't type 5% in the formula) and the total to pay in F4.</p>
         <p>Then tell me: if we raise the commission to <b>7%</b>, how much would we pay in total?</p>`
      ),
      sheet: {
        cols: 8,
        rows: n + 6,
        colWidths: [170, 120, 120, 24, 180, 110, 60, 60],
        data: { at: 'A1', rows: [[T('Vendedor', 'Seller'), T('Ventas', 'Sales')], ...rows.map((x) => [x.who, x.sales])] },
        cells: { C1: T('Comisión', 'Commission'), E1: T('Parámetro', 'Parameter'), F1: T('Valor', 'Value'), E2: T('% de comisión', 'Commission %'), F2: 0.05, E4: T('Total comisiones', 'Total commissions') },
        locked: ['A1:C1', 'A2:B' + last, 'E1:F1', 'E2', 'E4'],
        header: ['A1:C1', 'E1:F1'],
        labels: ['E2', 'E4'],
        targets: ['C2:C' + last, 'F4'],
        formats: { B: 'currency', C: 'currency', F2: 'percent', F4: 'currency' },
        start: 'C2',
      },
      objectives: [
        {
          text: T(`<b>Comisión</b> (C2:C${last}): ventas × la celda F2, fijada con $.`, `<b>Commission</b> (C2:C${last}): sales × cell F2, locked with $.`),
          hint: T('En C2: =B2*$F$2 y rellená hacia abajo.', 'In C2: =B2*$F$2 and fill down.'),
          check: V.column('C', 2, last, (row, S) => rows[row - 2].sales * rate(S), { refsFn: () => ['F2'], absRows: ['F2'], dollarHint: true }),
        },
        {
          text: T('<b>F4</b>: total de comisiones.', '<b>F4</b>: total commissions.'),
          hint: `=${fn('SUMA')}(C2:C${last})`,
          check: (S) => V.checkCell(S, 'F4', total * rate(S), { uses: ['SUMA'] }),
        },
        {
          text: T('❓ Si la comisión fuera del <b>7%</b>, ¿cuánto se pagaría en total?', '❓ If the commission were <b>7%</b>, how much would be paid in total?'),
          placeholder: T('Un monto', 'An amount'),
          hint: T('Cambiá F2 a 7% y mirá F4: toda la planilla se recalcula sola.', 'Change F2 to 7% and look at F4: the whole sheet recalculates by itself.'),
          answer: V.answerNumber(total * 0.07, 0.5),
        },
      ],
      tips: [T('Poner los supuestos en celdas propias (parámetros) te permite simular escenarios en segundos.', 'Putting assumptions in their own cells (parameters) lets you simulate scenarios in seconds.')],
      feedback: T('Gracias. Con este simulador gerencia decidió… quedarse en 5%, pero ahora con datos. 😅', 'Thanks. With this simulator management decided… to stay at 5%, but now with data. 😅'),
      solution: { fill: [['C', 2, last, '=B2*$F$2']], cells: { F4: `=SUMA(C2:C${last})` }, answers: { 2: String(total * 0.07) } },
    };
  });

  // ---------------------------------------------------------------------------
  // Tabla de doble entrada con referencias mixtas ($G2 y H$1)
  // ---------------------------------------------------------------------------
  C.register('m5_matrix', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [24, 28], [36, 44], [55, 65]);
    const regs = REGIONS.slice(0, 4).map(C.L2);
    const sts = STATUS.map(C.L2);
    const carriers = r.sample(CARRIERS, 3);
    let rows;
    let mat;
    do {
      rows = shipments(r, n, regs, carriers, carriers[0]);
      mat = regs.map((g) => [0, 1, 2].map((s) => rows.filter((x) => x.reg === g && x.st === s).length));
    } while (C.uniqueExtreme(mat.map((m) => m[1])) < 0);
    const cancelled = sum(mat.map((m) => m[2]));
    const last = n + 1;
    const fn = AA.fnName;
    const cells = [];
    ['H', 'I', 'J'].forEach((c, j) => regs.forEach((_, i) => cells.push([c + (i + 2), mat[i][j]])));
    return {
      from: 'marta',
      dept: 'analytics',
      subject: T('Una tabla de doble entrada para el directorio', 'A cross-tab for the board'),
      file: T('envios_matriz.xlsx', 'shipments_matrix.xlsx'),
      email: T(
        `<p>El directorio quiere ver los envíos cruzados: <b>regiones en filas</b> y <b>estados en columnas</b>.</p>
         <p>El desafío: escribí <b>una sola fórmula</b> en H2 que se pueda copiar a toda la tabla. Para eso vas a necesitar referencias <b>mixtas</b>.</p>`,
        `<p>The board wants a cross-tab of shipments: <b>regions in rows</b> and <b>statuses in columns</b>.</p>
         <p>The challenge: write <b>a single formula</b> in H2 that can be copied to the whole table. You'll need <b>mixed</b> references for that.</p>`
      ),
      sheet: {
        cols: 11,
        rows: n + 6,
        colWidths: [70, 80, 110, 100, 90, 24, 140, 100, 100, 100, 60],
        data: { at: 'A1', rows: [[T('Envío', 'Shipment'), T('Región', 'Region'), T('Estado', 'Status'), T('Costo', 'Cost')], ...rows.map((x) => [x.id, x.reg, sts[x.st], x.cost])] },
        cells: { G1: T('Región \\ Estado', 'Region \\ Status'), H1: sts[0], I1: sts[1], J1: sts[2], G2: regs[0], G3: regs[1], G4: regs[2], G5: regs[3] },
        locked: ['A1:D' + last, 'G1:J1', 'G2:G5'],
        header: ['A1:D1', 'G1:J1'],
        labels: ['G2:G5'],
        targets: ['H2:J5'],
        formats: { D: 'currency' },
        start: 'H2',
      },
      objectives: [
        {
          text: T('Completá la tabla <b>H2:J5</b> con CONTAR.SI.CONJUNTO (región de la fila y estado de la columna).', 'Fill in the table <b>H2:J5</b> with COUNTIFS (the row\'s region and the column\'s status).'),
          hint: T(
            `En H2: =CONTAR.SI.CONJUNTO($B$2:$B$${last}; $G2; $C$2:$C$${last}; H$1). $G2 fija la columna de las regiones y H$1 la fila de los estados. Copiala a todo H2:J5.`,
            `In H2: =COUNTIFS($B$2:$B$${last}, $G2, $C$2:$C$${last}, H$1). $G2 locks the regions column and H$1 the statuses row. Copy it to all of H2:J5.`
          ),
          check: V.cells(cells, { uses: ['CONTAR.SI.CONJUNTO', 'CONTAR.SI'] }),
        },
        {
          text: T(`❓ ¿Qué región tiene más envíos <b>${sts[1]}</b>?`, `❓ Which region has the most <b>${sts[1]}</b> shipments?`),
          placeholder: T('Región', 'Region'),
          hint: T('Mirá la columna I de tu tabla.', 'Look at column I of your table.'),
          answer: V.answerText([regs[C.uniqueExtreme(mat.map((m) => m[1]))]]),
        },
        {
          text: T(`❓ ¿Cuántos envíos <b>${sts[2]}</b> hay en total?`, `❓ How many <b>${sts[2]}</b> shipments are there in total?`),
          placeholder: T('Un número', 'A number'),
          hint: T('Sumá la columna J de tu tabla.', 'Add up column J of your table.'),
          answer: V.answerNumber(cancelled),
        },
      ],
      tips: [
        T('<b>$G2</b>: la columna queda fija y la fila se mueve. <b>H$1</b>: la fila queda fija y la columna se mueve.', '<b>$G2</b>: the column stays fixed and the row moves. <b>H$1</b>: the row stays fixed and the column moves.'),
        T('Apretá <b>F4</b> varias veces sobre una referencia para ir pasando por $A$1 → A$1 → $A1 → A1.', 'Press <b>F4</b> several times on a reference to cycle $A$1 → A$1 → $A1 → A1.'),
      ],
      feedback: T('Una sola fórmula para toda la tabla… eso es pensar como Senior. 👏', 'A single formula for the whole table… that is thinking like a Senior. 👏'),
      solution: {
        fillBlock: [['H', 'J', 2, 5, `=CONTAR.SI.CONJUNTO($B$2:$B$${last};$G2;$C$2:$C$${last};H$1)`]],
        answers: { 1: regs[C.uniqueExtreme(mat.map((m) => m[1]))], 2: String(cancelled) },
      },
    };
  });
})();
