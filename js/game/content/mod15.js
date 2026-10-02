/*
 * Analyst Adventure — Nivel 15 (etapa Semi-Senior): revisar el trabajo de un junior.
 * Encontrar errores en planillas (rangos incompletos, $ que faltan, números a mano, referencias
 * corridas), en una consulta SQL y en un dashboard; arreglarlos y dar feedback útil.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const C = AA.Content;
  const V = AA.V;
  const F = AA.Formula;
  const Ch = AA.Chart;
  const D = AA.Dash;
  const T = (es, en) => AA.T(es, en);
  const { REGIONS, PRODUCTS, MONTHS } = C.DATA;
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const P = (name) => F.sheetPrefix(name);
  const spec = (o) => Object.assign(Ch.emptySpec(), o);
  const flagTip = () => T('Seleccioná la celda y tocá <b>🚩 Marcar / desmarcar error</b> (abajo). Marcá solo las que están mal.', 'Select the cell and click <b>🚩 Flag / unflag error</b> (bottom). Flag only the wrong ones.');

  C.module({
    id: 'mod15',
    title: { es: 'Revisar el trabajo de un junior', en: "Reviewing a junior's work" },
    xp: 180,
    tier: 2,
    skills: ['reviewWhy', 'reviewChecklist', 'crossCheck', 'reviewFeedback'],
    templates: ['m15_ranges', 'm15_lookup', 'm15_pct', 'm15_sql', 'm15_dash'],
    seeds: [1501, 1502, 1503, 1504, 1505],
    intro: {
      es: 'Ahora te toca estar del otro lado: <b>revisar el trabajo de Nico</b>, nuestro Junior. Revisar bien es una habilidad en sí misma: encontrar los errores antes de que lleguen a Dirección, y explicarlos de forma que el otro aprenda.',
      en: "Now you're on the other side: <b>reviewing Nico's work</b>, our Junior. Reviewing well is a skill in itself: catching mistakes before they reach Management, and explaining them so the other person learns.",
    },
    skillDefs: {
      reviewWhy: {
        title: { es: 'Por qué se revisa', en: 'Why we review' },
        say: {
          es: 'Un error en una planilla puede terminar en una mala decisión de miles de pesos. Por eso los equipos de datos revisan el trabajo de los demás antes de entregarlo, como los programadores revisan código. No es desconfianza: es <b>calidad</b>.',
          en: "A spreadsheet error can end up in a bad decision worth thousands. That's why data teams review each other's work before delivering it, like programmers review code. It's not distrust: it's <b>quality</b>.",
        },
        tip: { es: 'En este nivel marcás las celdas con error con 🚩 y después las arreglás.', en: 'In this level you flag wrong cells with 🚩 and then fix them.' },
      },
      reviewChecklist: {
        title: { es: 'Checklist de revisión', en: 'Review checklist' },
        say: {
          es: 'Mirá cada fórmula con estas preguntas: ¿el <b>rango</b> está completo? ¿faltan <b>$</b> y se corrió al copiar? ¿hay <b>números escritos a mano</b> donde debería haber fórmulas? ¿la <b>referencia</b> apunta a la fila correcta? ¿la fórmula sigue el <b>patrón</b> de sus vecinas?',
          en: 'Look at each formula with these questions: is the <b>range</b> complete? are <b>$</b> missing so it shifted when copied? are there <b>hand-typed numbers</b> where formulas should be? does the <b>reference</b> point to the right row? does the formula follow its neighbors\' <b>pattern</b>?',
        },
        tip: { es: 'Hacé clic en cada celda y mirá la barra de fórmulas: los errores se esconden ahí.', en: 'Click each cell and look at the formula bar: errors hide there.' },
      },
      crossCheck: {
        title: { es: 'Controles cruzados', en: 'Cross-checks' },
        say: {
          es: 'Calculá lo mismo por dos caminos: la suma de las partes tiene que dar el total; los porcentajes tienen que sumar 100%; el total tiene que coincidir con el del sistema. Si no cierra, hay un error, aunque no sepas dónde todavía.',
          en: "Compute the same thing two ways: the parts must add up to the total; percentages must add up to 100%; the total must match the system's. If it doesn't match, there's an error, even if you don't know where yet.",
        },
        tip: { es: 'Un total "redondo" o que no cambia al cambiar los datos es sospechoso: puede estar escrito a mano.', en: "A suspiciously round total, or one that doesn't change when data changes, may be hand-typed." },
      },
      reviewFeedback: {
        title: { es: 'Feedback que ayuda', en: 'Feedback that helps' },
        say: {
          es: 'Un buen feedback es <b>específico</b> (qué celda y qué pasó), <b>explica el porqué</b> (para que no se repita) y es <b>amable</b>. "Está mal, rehacelo" no enseña nada; arreglarlo en silencio tampoco.',
          en: 'Good feedback is <b>specific</b> (which cell and what happened), <b>explains why</b> (so it doesn\'t happen again) and is <b>kind</b>. "It\'s wrong, redo it" teaches nothing; silently fixing it doesn\'t either.',
        },
        tip: { es: 'Ofrecé revisarlo juntos: diez minutos de explicación valen más que diez correcciones.', en: 'Offer to review it together: ten minutes of explanation are worth more than ten corrections.' },
      },
    },
  });

  const feedbackChoice = (good, extra) => ({
    choices: [
      good,
      T('"Nico, tu planilla está mal. Rehacela."', '"Nico, your spreadsheet is wrong. Redo it."'),
      T('Lo arreglo yo y no le digo nada, así no se siente mal.', "I fix it myself and say nothing, so he doesn't feel bad."),
      ...(extra ? [extra] : []),
    ],
    correct: 0,
    why: [null, T('No dice qué está mal ni cómo arreglarlo: Nico no aprende nada.', "It doesn't say what's wrong or how to fix it: Nico learns nothing."), T('Nico va a repetir los mismos errores la próxima vez.', 'Nico will repeat the same mistakes next time.'), extra ? T('No es eso.', "That's not it.") : null],
  });

  // ---------------------------------------------------------------------------
  // Resumen por región con rango corrido, número a mano y total incompleto
  // ---------------------------------------------------------------------------
  C.register('m15_ranges', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [16, 20], [28, 36], [44, 56]);
    const regs = REGIONS.slice(0, 4).map(C.L2);
    const sellers = C.people(r, 8);
    let rows;
    let tot;
    let ops;
    let shifted;
    const last = n + 1;
    do {
      rows = Array.from({ length: n }, () => [r.pick(sellers), r.pick(regs), r.step(1000, 20000, 50)]);
      rows[0][1] = regs[2];
      rows[1][1] = regs[2];
      tot = regs.map((g) => sum(rows.filter((x) => x[1] === g).map((x) => x[2])));
      ops = regs.map((g) => rows.filter((x) => x[1] === g).length);
      shifted = sum(rows.slice(2).filter((x) => x[1] === regs[2]).map((x) => x[2]));
    } while (tot.some((t) => !t));
    const grand = sum(rows.map((x) => x[2]));
    const fixedRange = `$B$2:$B$${last}`;
    const inputs = {
      E1: T('Región', 'Region'),
      F1: 'Total',
      G1: T('Operaciones', 'Deals'),
      E7: T('Total general', 'Grand total'),
      F2: `=SUMAR.SI(${fixedRange};E2;$C$2:$C$${last})`,
      F3: `=SUMAR.SI(${fixedRange};E3;$C$2:$C$${last})`,
      F4: `=SUMAR.SI(B4:B${last + 2};E4;C4:C${last + 2})`,
      F5: `=SUMAR.SI(${fixedRange};E5;$C$2:$C$${last})`,
      G2: `=CONTAR.SI(${fixedRange};E2)`,
      G3: String(ops[1] + 2),
      G4: `=CONTAR.SI(${fixedRange};E4)`,
      G5: `=CONTAR.SI(${fixedRange};E5)`,
      F7: `=SUMA(C2:C${last - 3})`,
    };
    regs.forEach((g, i) => (inputs['E' + (i + 2)] = g));
    const fb = feedbackChoice(T('"Nico: encontré 3 detalles. F4 perdió los $ al copiarse y no cuenta las primeras filas; G3 tiene un número escrito a mano; y F7 no suma las últimas filas. Ya los corregí: ¿lo vemos juntos 10 minutos?"', '"Nico: I found 3 things. F4 lost its $ when copied and skips the first rows; G3 has a hand-typed number; and F7 doesn\'t add the last rows. I fixed them: shall we go over it together for 10 minutes?"'));
    return {
      from: 'marta',
      dept: 'analytics',
      subject: T('Revisá el resumen de Nico antes de que salga', "Review Nico's summary before it goes out"),
      file: T('resumen_nico.xlsx', 'nico_summary.xlsx'),
      email: T(
        `<p>Nico armó el resumen de ventas por región para Dirección. Antes de mandarlo, <b>revisalo</b>: marcá con 🚩 las celdas que tengan errores, arreglalas y después decime cómo se lo explicarías.</p><p>Pista: el total general no coincide con la suma de las regiones…</p>`,
        `<p>Nico built the sales-by-region summary for Management. Before sending it, <b>review it</b>: flag the cells with errors using 🚩, fix them and then tell me how you'd explain it to him.</p><p>Hint: the grand total doesn't match the sum of the regions…</p>`
      ),
      review: true,
      sheet: {
        cols: 8,
        rows: n + 4,
        colWidths: [160, 100, 110, 30, 120, 120, 100, 40],
        data: { at: 'A1', rows: [[T('Vendedor', 'Seller'), T('Región', 'Region'), T('Monto', 'Amount')], ...rows] },
        inputs,
        locked: ['A1:C' + last, 'E1:G1', 'E2:E5', 'E7'],
        header: ['A1:C1', 'E1:G1'],
        labels: ['E2:E5', 'E7'],
        formats: { C: 'currency', F: 'currency' },
        start: 'F2',
      },
      objectives: [
        { text: T('Marcá con 🚩 las <b>3 celdas con errores</b> del resumen.', 'Flag the <b>3 cells with errors</b> in the summary with 🚩.'), hint: T('Revisá F4 contra F2, mirá si G3 es fórmula y fijate qué rango suma F7.', 'Compare F4 with F2, check whether G3 is a formula and see which range F7 adds.'), check: V.flags(['F4', 'G3', 'F7']) },
        { text: T('Arreglá el <b>total de la región</b> que estaba mal.', 'Fix the <b>region total</b> that was wrong.'), hint: `=${AA.fnName('SUMAR.SI')}(${fixedRange}; E4; $C$2:$C$${last})`, check: V.cell('F4', tot[2], { uses: ['SUMAR.SI', 'SUMAR.SI.CONJUNTO'] }) },
        { text: T('Arreglá la <b>cantidad de operaciones</b> escrita a mano.', 'Fix the hand-typed <b>number of deals</b>.'), hint: `=${AA.fnName('CONTAR.SI')}(${fixedRange}; E3)`, check: V.cell('G3', ops[1], { uses: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'] }) },
        { text: T('Arreglá el <b>total general</b> (F7).', 'Fix the <b>grand total</b> (F7).'), hint: T(`=SUMA(C2:C${last}) — y comprobá que coincide con la suma de F2:F5.`, `=SUM(C2:C${last}) — and check it matches the sum of F2:F5.`), check: V.cell('F7', grand, { uses: ['SUMA', 'SUMAR.SI'] }) },
        Object.assign({ text: T('❓ ¿Cómo se lo explicás a Nico?', '❓ How do you explain it to Nico?'), hint: T('Específico, con el porqué y ofreciendo ayuda.', 'Specific, with the why, offering help.') }, fb),
      ],
      tips: [flagTip(), T('Control cruzado: F2+F3+F4+F5 tiene que dar lo mismo que F7.', 'Cross-check: F2+F3+F4+F5 must equal F7.')],
      feedback: T('Nico me dijo que tu explicación de los $ le hizo "clic". Así se forma un equipo. 👏', 'Nico told me your explanation of the $ finally made it "click". That\'s how you build a team. 👏'),
      solution: { flags: ['F4', 'G3', 'F7'], cells: { F4: `=SUMAR.SI(${fixedRange};E4;$C$2:$C$${last})`, G3: `=CONTAR.SI(${fixedRange};E3)`, F7: `=SUMA(C2:C${last})` }, answers: { 4: 0 } },
    };
  });

  // ---------------------------------------------------------------------------
  // BUSCARV con errores: columna equivocada, tabla sin fijar y fila corrida
  // ---------------------------------------------------------------------------
  C.register('m15_lookup', (ctx) => {
    const r = ctx.rng;
    const k = 10;
    const n = C.rowsFor(ctx, [14, 18], [24, 30], [36, 44]);
    const prods = r.sample(PRODUCTS, k).map((p, i) => ({ code: 'P-' + (201 + i), name: C.L2(p), price: p[2] }));
    const ps = T('Productos', 'Products');
    const range = `${P(ps)}$A$2:$C$${k + 1}`;
    let orders;
    let bugA;
    let bugB;
    let bugC;
    do {
      orders = Array.from({ length: n }, (_, i) => ({ id: 'V-' + (3001 + i), p: r.pick(prods), qty: r.int(1, 9) }));
      bugA = r.int(3, n - 1);
      bugB = r.int(5, n + 1);
      bugC = r.int(4, n + 1);
    } while (new Set([bugA, bugB, bugC]).size < 3 || prods.indexOf(orders[bugB - 2].p) >= bugB - 2 || orders[bugC - 2].p.price === orders[bugC - 3].p.price);
    const last = n + 1;
    const inputs = {};
    for (let row = 2; row <= last; row++) {
      inputs['D' + row] = `=BUSCARV(B${row};${range};3;FALSO)`;
      inputs['E' + row] = `=C${row}*D${row}`;
    }
    inputs['D' + bugA] = `=BUSCARV(B${bugA};${range};2;FALSO)`;
    inputs['D' + bugB] = `=BUSCARV(B${bugB};${P(ps)}A${bugB}:C${bugB + k - 1};3;FALSO)`;
    inputs['E' + bugC] = `=C${bugC}*D${bugC - 1}`;
    const flags = ['D' + bugA, 'D' + bugB, 'E' + bugC];
    const fb = feedbackChoice(T(`"Nico: tres cosas. En D${bugA} la columna es la 2 (trae el nombre, no el precio); en D${bugB} la tabla no tiene $ y se corrió al copiar; y E${bugC} multiplica por el precio de la fila de arriba. Te muestro cómo detectarlo mirando el patrón de la columna."`, `"Nico: three things. In D${bugA} the column is 2 (it returns the name, not the price); in D${bugB} the table has no $ and shifted when copied; and E${bugC} multiplies by the price of the row above. Let me show you how to spot it by looking at the column's pattern."`));
    return {
      from: 'bruno',
      dept: 'ventas',
      subject: T('¿Podés revisar la facturación que armó Nico?', 'Can you review the billing Nico put together?'),
      file: T('facturacion_nico.xlsx', 'nico_billing.xlsx'),
      email: T(
        '<p>Nico completó los precios y totales de los pedidos con BUSCARV, pero algunos clientes dicen que la factura les vino mal. ¿Lo revisás? Marcá las celdas con error, arreglá y contame qué le dirías.</p>',
        '<p>Nico filled in order prices and totals with VLOOKUP, but some customers say their invoice was wrong. Can you review it? Flag the wrong cells, fix them and tell me what you\'d say to him.</p>'
      ),
      review: true,
      sheets: [
        {
          name: T('Pedidos', 'Orders'),
          cols: 7,
          rows: n + 4,
          colWidths: [80, 80, 80, 120, 110, 40, 40],
          data: { at: 'A1', rows: [[T('Pedido', 'Order'), T('Código', 'Code'), T('Cantidad', 'Quantity'), T('Precio unitario', 'Unit price'), 'Total'], ...orders.map((o) => [o.id, o.p.code, o.qty])] },
          inputs,
          locked: ['A1:C' + last, 'D1:E1'],
          header: ['A1:E1'],
          formats: { D: 'currency', E: 'currency' },
          start: 'D2',
        },
        {
          name: ps,
          cols: 4,
          rows: k + 3,
          colWidths: [80, 160, 100, 40],
          data: { at: 'A1', rows: [[T('Código', 'Code'), T('Producto', 'Product'), T('Precio', 'Price')], ...prods.map((p) => [p.code, p.name, p.price])] },
          locked: ['A1:D' + (k + 3)],
          header: ['A1:C1'],
          formats: { C: 'currency' },
        },
      ],
      objectives: [
        { text: T('Marcá con 🚩 las <b>3 celdas con errores</b>.', 'Flag the <b>3 cells with errors</b> with 🚩.'), hint: T('Recorré las columnas D y E buscando fórmulas que no siguen el patrón (o que dan error).', "Go through columns D and E looking for formulas that break the pattern (or show errors)."), check: V.flags(flags) },
        { text: T(`Columna <b>D</b> (precio) correcta en todas las filas.`, `Column <b>D</b> (price) right in every row.`), hint: `=${AA.fnName('BUSCARV')}(B2; ${range}; 3; ${T('FALSO', 'FALSE')})`, check: V.column('D', 2, last, (row) => orders[row - 2].p.price, { uses: ['BUSCARV', 'BUSCARX', 'INDICE'] }) },
        { text: T(`Columna <b>E</b> (total) correcta en todas las filas.`, `Column <b>E</b> (total) right in every row.`), hint: '=C2*D2', check: V.column('E', 2, last, (row) => orders[row - 2].qty * orders[row - 2].p.price, { refsFn: (row) => ['C' + row, 'D' + row] }) },
        Object.assign({ text: T('❓ ¿Qué le decís a Nico?', '❓ What do you tell Nico?'), hint: T('Específico y con el porqué.', 'Specific and with the why.') }, fb),
      ],
      tips: [flagTip(), T('Las fórmulas de una columna deberían ser "la misma" corrida de fila: buscá la que es distinta.', 'Formulas in a column should be "the same" shifted by row: look for the one that is different.')],
      feedback: T('Reenvié las facturas corregidas. Y Nico ahora fija las tablas con $ sin que se lo pidan. 😄', 'I resent the corrected invoices. And Nico now locks tables with $ without being asked. 😄'),
      solution: { flags, fill: [['D', 2, last, `=BUSCARV(B2;${range};3;FALSO)`], ['E', 2, last, '=C2*D2']], answers: { 3: 0 } },
    };
  });

  // ---------------------------------------------------------------------------
  // Participación de mercado: total incompleto, promedio con el total y % mal referenciado
  // ---------------------------------------------------------------------------
  C.register('m15_pct', (ctx) => {
    const r = ctx.rng;
    const nP = 8;
    const prods = r.sample(PRODUCTS, nP).map(C.L2);
    const sales = prods.map(() => r.step(20000, 150000, 1000));
    const total = sum(sales);
    const avg = total / nP;
    const bugRow = r.int(3, 8);
    const inputs = { A10: 'Total', A11: T('Promedio por producto', 'Average per product'), B10: '=SUMA(B2:B8)', B11: '=PROMEDIO(B2:B10)', C1: T('% del total', '% of total') };
    for (let row = 2; row <= 9; row++) inputs['C' + row] = `=B${row}/$B$10`;
    inputs['C' + bugRow] = `=B${bugRow}/B9`;
    inputs.C10 = '=SUMA(C2:C9)';
    const flags = ['B10', 'B11', 'C' + bugRow];
    const fb = feedbackChoice(T(`"Nico: el total de B10 no incluye el último producto (y eso arrastra todos los %); el promedio de B11 incluye la fila del total; y C${bugRow} divide por B9 en vez del total. Un truco: los % siempre tienen que sumar 100%."`, `"Nico: the B10 total misses the last product (and that drags every %); the B11 average includes the total row; and C${bugRow} divides by B9 instead of the total. A trick: the %s must always add up to 100%."`));
    return {
      from: 'julia',
      dept: 'finanzas',
      subject: T('La participación de Nico suma más de 100%', "Nico's share adds up to more than 100%"),
      file: T('participacion_nico.xlsx', 'nico_share.xlsx'),
      email: T(
        '<p>Nico calculó la participación de cada producto en las ventas, pero la columna de % suma más de 100%… Algo está mal. ¿Lo revisás, lo arreglás y me decís cómo se lo explicarías?</p>',
        "<p>Nico computed each product's share of sales, but the % column adds up to more than 100%… Something is wrong. Can you review it, fix it and tell me how you'd explain it to him?</p>"
      ),
      review: true,
      sheet: {
        cols: 5,
        rows: 13,
        colWidths: [190, 120, 110, 40, 40],
        data: { at: 'A1', rows: [[T('Producto', 'Product'), T('Ventas', 'Sales')], ...prods.map((p, i) => [p, sales[i]])] },
        inputs,
        locked: ['A1:B9', 'A10:A11', 'C1'],
        header: ['A1:C1', 'A10:C10'],
        labels: ['A10:A11'],
        formats: { B: 'currency', C: 'percent' },
        start: 'B10',
      },
      objectives: [
        { text: T('Marcá con 🚩 las <b>3 celdas con errores</b>.', 'Flag the <b>3 cells with errors</b> with 🚩.'), hint: T('Revisá los rangos del total y del promedio, y las referencias de la columna C.', 'Check the ranges of the total and the average, and the references in column C.'), check: V.flags(flags) },
        { text: T('Arreglá el <b>total</b> (B10) y el <b>promedio por producto</b> (B11).', 'Fix the <b>total</b> (B10) and the <b>average per product</b> (B11).'), hint: T('B10: =SUMA(B2:B9) · B11: =PROMEDIO(B2:B9)', 'B10: =SUM(B2:B9) · B11: =AVERAGE(B2:B9)'), check: V.cells([['B10', total], ['B11', avg]], { usesByRef: { B10: ['SUMA'], B11: ['PROMEDIO'] } }) },
        { text: T('La columna <b>% del total</b> (C2:C9) correcta, y que sume 100% en C10.', 'The <b>% of total</b> column (C2:C9) right, adding up to 100% in C10.'), hint: '=B2/$B$10', check: (S) => {
          const c = V.column('C', 2, 9, (row) => sales[row - 2] / total, { tol: 0.0005, refsFn: (row) => ['B' + row, 'B10'] })(S);
          return c === true ? V.cell('C10', 1, { tol: 0.0005 })(S) : c;
        } },
        Object.assign({ text: T('❓ ¿Qué le decís a Nico?', '❓ What do you tell Nico?'), hint: T('Específico, con el porqué y un control para la próxima.', 'Specific, with the why and a check for next time.') }, fb),
      ],
      tips: [flagTip(), T('Un solo error en un total se propaga a todo lo que depende de él: buscá la causa raíz.', 'A single error in a total spreads to everything that depends on it: look for the root cause.')],
      feedback: T('¡Ahora suma 100%! Y Nico agregó el control de "suma de %" a todas sus planillas.', 'Now it adds up to 100%! And Nico added the "sum of %" check to all his spreadsheets.'),
      solution: { flags, cells: { B10: '=SUMA(B2:B9)', B11: '=PROMEDIO(B2:B9)', ['C' + bugRow]: `=B${bugRow}/$B$10` }, answers: { 3: 0 } },
    };
  });

  // ---------------------------------------------------------------------------
  // Consulta SQL de Nico con dos errores
  // ---------------------------------------------------------------------------
  C.register('m15_sql', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [30, 40], [60, 80], [110, 150]);
    const regs = REGIONS.slice(0, 4).map(C.L2);
    const rows = Array.from({ length: n }, (_, i) => {
      const d = new Date(Date.UTC(2024, 0, 1 + r.int(0, 150)));
      return [i + 1, d.toISOString().slice(0, 10), r.pick(regs), r.step(500, 9000, 10)];
    });
    if (!rows.some((x) => x[1] >= '2024-03-01' && x[1] < '2024-04-01')) rows[0][1] = '2024-03-15';
    const q1 = rows.filter((x) => x[1] >= '2024-01-01' && x[1] < '2024-04-01');
    const byReg = regs.map((g) => [g, sum(q1.filter((x) => x[2] === g).map((x) => x[3]))]).filter((x) => x[1] > 0);
    const tb = T('ventas', 'sales');
    const c = { id: 'id', date: T('fecha', 'date'), reg: 'region', amt: T('monto', 'amount') };
    const nico = `-- ${T('Consulta de Nico: ventas totales por región del primer trimestre', "Nico's query: total sales by region in the first quarter")}\nSELECT region, COUNT(${c.amt}) AS total\nFROM ${tb}\nWHERE ${c.date} >= '2024-01-01' AND ${c.date} < '2024-03-01'\nGROUP BY region;`;
    const ask = r.pick(byReg);
    return {
      from: 'marta',
      dept: 'analytics',
      subject: T('La consulta de Nico da números raros', "Nico's query returns odd numbers"),
      file: 'ventas.db',
      email: T(
        `<p>Nico tenía que sacar las <b>ventas totales ($) por región del primer trimestre</b> (enero a marzo) y los números no se parecen en nada a los del sistema. Su consulta ya está en la consola.</p><p>Arreglala y contame qué estaba mal.</p>`,
        `<p>Nico had to get <b>total sales ($) by region for the first quarter</b> (January to March) and the numbers look nothing like the system's. His query is already in the console.</p><p>Fix it and tell me what was wrong.</p>`
      ),
      sql: { tables: { [tb]: { headers: [c.id, c.date, c.reg, c.amt], rows } }, starter: nico },
      objectives: [
        { text: T('Una consulta con <b>region</b> y el <b>total vendido ($)</b> de enero a marzo.', 'A query with <b>region</b> and <b>total sales ($)</b> from January to March.'), hint: `SELECT region, SUM(${c.amt}) FROM ${tb} WHERE ${c.date} >= '2024-01-01' AND ${c.date} < '2024-04-01' GROUP BY region`, check: V.sql({ rows: byReg }, { requires: ['GROUP BY', 'SUM'] }) },
        { text: T(`❓ ¿Cuánto vendió <b>${ask[0]}</b> en el trimestre?`, `❓ How much did <b>${ask[0]}</b> sell in the quarter?`), placeholder: T('Un monto', 'An amount'), hint: T('Leelo de tu consulta corregida.', 'Read it from your corrected query.'), answer: V.answerNumber(ask[1], 0.5) },
        {
          text: T('❓ ¿Qué estaba mal en la consulta de Nico?', "❓ What was wrong with Nico's query?"),
          choices: [
            T("Dos cosas: COUNT cuenta ventas en vez de sumar montos (va SUM), y el filtro de fecha deja afuera marzo (tiene que ser < '2024-04-01').", "Two things: COUNT counts sales instead of adding amounts (it should be SUM), and the date filter leaves out March (it must be < '2024-04-01')."),
            T('Solo el filtro de fecha.', 'Only the date filter.'),
            T('Solo que tenía que usar SUM en vez de COUNT.', 'Only that it should use SUM instead of COUNT.'),
            T('Nada: la consulta está bien, los datos están mal.', 'Nothing: the query is fine, the data is wrong.'),
          ],
          correct: 0,
          why: [null, T('Hay otro error más: mirá la función del SELECT.', 'There is one more error: look at the SELECT function.'), T('Hay otro error más: mirá qué meses incluye el WHERE.', 'There is one more error: look at which months the WHERE includes.'), T('Antes de culpar a los datos, revisá la consulta línea por línea.', 'Before blaming the data, review the query line by line.')],
          hint: T('Revisá la función y las fechas.', 'Check the function and the dates.'),
        },
      ],
      tips: [T("Para un trimestre: >= '2024-01-01' AND < '2024-04-01' (el día después del final).", "For a quarter: >= '2024-01-01' AND < '2024-04-01' (the day after the end)."), T('COUNT cuenta filas; SUM suma valores.', 'COUNT counts rows; SUM adds values.')],
      feedback: T('Ahora sí coincide con el sistema. Gracias por explicarle a Nico lo de las fechas: es un clásico.', "Now it matches the system. Thanks for explaining the dates to Nico: it's a classic."),
      solution: { sql: [`SELECT region, SUM(${c.amt}) FROM ${tb} WHERE ${c.date} >= '2024-01-01' AND ${c.date} < '2024-04-01' GROUP BY region`], answers: { 1: String(ask[1]), 2: 0 } },
    };
  });

  // ---------------------------------------------------------------------------
  // Dashboard de Nico con problemas de diseño
  // ---------------------------------------------------------------------------
  C.register('m15_dash', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [90, 120], [160, 220], [260, 340]);
    const months = MONTHS.slice(0, 6).map(C.L2);
    const cats = [['Facturación', 'Billing'], ['Envíos', 'Shipping'], ['Producto roto', 'Broken product'], ['Devoluciones', 'Returns'], ['Cuenta', 'Account'], ['Garantía', 'Warranty'], ['Pagos', 'Payments'], ['Stock', 'Stock'], ['Otros', 'Other']].map(C.L2);
    const rows = Array.from({ length: n }, () => [months[r.int(0, 5)], r.pick(cats), r.int(1, 48)]).sort((a, b) => months.indexOf(a[0]) - months.indexOf(b[0]));
    const H = { m: T('Mes', 'Month'), cat: T('Categoría', 'Category'), h: T('Horas', 'Hours') };
    const table = C.table([H.m, H.cat, H.h], rows, { time: [H.m] });
    const initial = {
      title: T('Soporte (por Nico)', 'Support (by Nico)'),
      filter: null,
      tiles: [
        { id: 'k1', kind: 'kpi', title: T('Tickets', 'Tickets'), field: H.h, agg: 'SUM', format: 'num' },
        { id: 'c1', kind: 'chart', chart: spec({ mark: 'line', columns: { field: H.m }, rows: { field: Ch.COUNT_FIELD, agg: 'COUNT' }, sort: 'desc', title: T('Tickets por mes', 'Tickets per month') }) },
        { id: 'c2', kind: 'chart', chart: spec({ mark: 'pie', columns: { field: H.cat }, rows: { field: Ch.COUNT_FIELD, agg: 'COUNT' }, title: T('Tickets por categoría', 'Tickets by category') }) },
      ],
    };
    const fixed = JSON.parse(JSON.stringify(initial));
    Object.assign(fixed.tiles[0], { field: Ch.COUNT_FIELD, agg: 'COUNT' });
    fixed.tiles[1].chart.sort = 'none';
    Object.assign(fixed.tiles[2].chart, { mark: 'bar', sort: 'desc' });
    const fb = feedbackChoice(T('"Nico: tres ajustes. El KPI Tickets sumaba horas (va Recuento); la línea de meses estaba ordenada por valor (los meses van en orden); y la torta tenía 9 porciones (mejor barras ordenadas). Te paso una guía de qué gráfico usar para cada pregunta."', '"Nico: three tweaks. The Tickets KPI was summing hours (it should be Count); the months line was sorted by value (months go in order); and the pie had 9 slices (sorted bars work better). I\'ll send you a guide on which chart fits each question."'));
    return {
      from: 'camila',
      dept: 'data',
      subject: T('Nico hizo su primer dashboard', 'Nico made his first dashboard'),
      file: T('dashboard_nico.bi', 'nico_dashboard.bi'),
      email: T(
        '<p>Nico armó su primer dashboard de soporte y está muy entusiasmado. Antes de publicarlo, ¿lo revisás? Algo raro tiene el KPI de tickets, y los gráficos… bueno, mirá vos.</p>',
        '<p>Nico built his first support dashboard and he\'s very excited. Before publishing it, can you review it? Something is off with the tickets KPI, and the charts… well, see for yourself.</p>'
      ),
      dashboard: { table, initial },
      objectives: [
        { text: T('Arreglá el KPI <b>"Tickets"</b>: tiene que contar tickets.', 'Fix the <b>"Tickets"</b> KPI: it must count tickets.'), hint: T('✏️ → Cantidad de registros con Recuento.', '✏️ → Number of records with Count.'), check: D.tile('k1', D.kpiIs({ field: Ch.COUNT_FIELD, aggs: ['COUNT'] })) },
        { text: T('Arreglá <b>"Tickets por mes"</b>: los meses tienen que ir en orden.', 'Fix <b>"Tickets per month"</b>: months must be in order.'), hint: T('✏️ → Ordenar: orden original.', '✏️ → Sort: original order.'), check: D.tile('c1', Ch.expect({ marks: ['line'], dim: H.m, aggs: ['COUNT'], sort: 'none' })) },
        { text: T('Arreglá <b>"Tickets por categoría"</b>: 9 porciones no se leen.', 'Fix <b>"Tickets by category"</b>: 9 slices are unreadable.'), hint: T('✏️ → Barras, mayor a menor.', '✏️ → Bars, largest first.'), check: D.tile('c2', Ch.expect({ marks: ['bar'], dim: H.cat, aggs: ['COUNT'], sort: 'desc' })) },
        Object.assign({ text: T('❓ ¿Qué feedback le das a Nico?', '❓ What feedback do you give Nico?'), hint: T('Específico, con el porqué.', 'Specific, with the why.') }, fb),
      ],
      tips: [T('Revisá cada elemento con ✏️: el error puede estar en la agregación, el orden o el tipo de gráfico.', 'Check each element with ✏️: the error may be in the aggregation, the sort or the chart type.'), T('Al revisar dashboards: ¿cada número significa lo que dice su título?', 'When reviewing dashboards: does each number mean what its title says?')],
      feedback: T('Nico publicó la versión corregida y ya te pidió que le revises el próximo. ¡Buen mentor!', 'Nico published the fixed version and already asked you to review the next one. Great mentor!'),
      solution: { dashboard: fixed, answers: { 3: 0 } },
    };
  });
})();
