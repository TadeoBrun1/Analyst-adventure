/*
 * Analyst Adventure — Nivel 3: Lógica (comparaciones, SI, Y / O).
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const C = AA.Content;
  const V = AA.V;
  const T = (es, en) => AA.T(es, en);
  const { AREAS, PRODUCTS } = C.DATA;
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  // El valor de la celda tiene que ser exactamente este texto (sin importar mayúsculas ni tildes).
  const is = (word) => (v) => V.norm(v) === V.norm(word);

  // ---------------------------------------------------------------------------
  // Bonos por objetivos
  // ---------------------------------------------------------------------------
  C.register('m3_bonus', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [10, 12], [20, 24], [35, 40]);
    const goals = [50000, 35000, 30000];
    const rows = C.people(r, n).map((who) => {
      const a = r.int(0, 2);
      const goal = goals[a];
      return { who, area: C.L2(AREAS[a]), goal, sales: Math.round((goal * (0.8 + r.next() * 0.45)) / 100) * 100 };
    });
    // Caso borde: alguien vende exactamente su meta.
    const edge = rows[r.int(2, n - 1)];
    edge.sales = edge.goal;
    rows[0].sales = rows[0].goal + 2000;
    rows[1].sales = rows[1].goal - 1500;
    const met = rows.map((x) => x.sales >= x.goal);
    const bonus = rows.map((x, i) => (met[i] ? x.sales * 0.1 : 0));
    const yes = T('Sí', 'Yes');
    const last = n + 1;
    const fn = AA.fnName;
    return {
      from: 'paula',
      dept: 'rrhh',
      subject: T('Liquidación de bonos del trimestre', 'Quarterly bonus payout'),
      file: T('bonos_trimestre.xlsx', 'quarterly_bonuses.xlsx'),
      email: T(
        `<p>Tenemos que liquidar los bonos y la regla es simple:</p>
         <ul><li>Si las <b>Ventas</b> son <b>mayores o iguales</b> a la <b>Meta</b>, la persona cumplió → <b>"Sí"</b>. Si no → <b>"No"</b>.</li>
         <li>Quien cumplió cobra un bono del <b>10% de sus ventas</b>. Quien no, 0.</li></ul>
         <p>También necesito el <b>total a pagar</b> para Finanzas.</p>`,
        `<p>We have to pay out bonuses and the rule is simple:</p>
         <ul><li>If <b>Sales</b> are <b>greater than or equal to</b> the <b>Goal</b>, the person met it → <b>"Yes"</b>. Otherwise → <b>"No"</b>.</li>
         <li>Whoever met the goal gets a bonus of <b>10% of their sales</b>. Otherwise, 0.</li></ul>
         <p>I also need the <b>total to pay</b> for Finance.</p>`
      ),
      sheet: {
        cols: 10,
        rows: n + 8,
        colWidths: [160, 110, 100, 100, 100, 100, 24, 200, 120, 60],
        data: { at: 'A1', rows: [[T('Empleado', 'Employee'), T('Área', 'Area'), T('Ventas', 'Sales'), T('Meta', 'Goal')], ...rows.map((x) => [x.who, x.area, x.sales, x.goal])] },
        cells: { E1: T('¿Cumplió?', 'Met goal?'), F1: T('Bono', 'Bonus'), H1: T('Resumen', 'Summary'), I1: T('Valor', 'Value'), H2: T('Total a pagar en bonos', 'Total bonuses to pay') },
        locked: ['A1:F1', 'A2:D' + last, 'H1:I1', 'H2'],
        header: ['A1:F1', 'H1:I1'],
        labels: ['H2'],
        targets: ['E2:F' + last, 'I2'],
        formats: { C: 'currency', D: 'currency', F: 'currency', I2: 'currency' },
        start: 'E2',
      },
      objectives: [
        {
          text: T(`<b>¿Cumplió?</b> (E2:E${last}) con SI: "Sí" o "No".`, `<b>Met goal?</b> (E2:E${last}) with IF: "Yes" or "No".`),
          hint: `=${fn('SI')}(C2>=D2; "${yes}"; "No")`,
          check: V.column('E', 2, last, (row) => (v) => V.norm(v) === V.norm(met[row - 2] ? yes : 'No') || (met[row - 2] && V.norm(v) === 'si'), {
            uses: ['SI'],
            wrongNote: T('Revisá la condición: "mayor o igual" se escribe >=.', 'Check the condition: "greater than or equal to" is >=.'),
          }),
        },
        {
          text: T(`<b>Bono</b> (F2:F${last}): 10% de las ventas si cumplió; si no, 0.`, `<b>Bonus</b> (F2:F${last}): 10% of sales if the goal was met; otherwise 0.`),
          hint: `=${fn('SI')}(C2>=D2; C2*10%; 0)`,
          check: V.column('F', 2, last, (row) => bonus[row - 2], { uses: ['SI'] }),
        },
        {
          text: T('<b>I2</b>: total a pagar en bonos.', '<b>I2</b>: total bonuses to pay.'),
          hint: `=${fn('SUMA')}(F2:F${last})`,
          check: V.cell('I2', sum(bonus), { uses: ['SUMA'] }),
        },
        {
          text: T('❓ ¿Cuántas personas cumplieron su meta?', '❓ How many people met their goal?'),
          placeholder: T('Un número', 'A number'),
          hint: T(`Contá los "${yes}" de la columna E.`, `Count the "${yes}" in column E.`),
          answer: V.answerNumber(met.filter(Boolean).length),
        },
        {
          text: T(`❓ ${edge.who} vendió <b>exactamente</b> su meta. ¿Cobra bono? (Sí / No)`, `❓ ${edge.who} sold <b>exactly</b> their goal. Do they get a bonus? (Yes / No)`),
          placeholder: T('Sí o No', 'Yes or No'),
          hint: T('La regla dice "mayor o IGUAL".', 'The rule says "greater than or EQUAL to".'),
          answer: V.answerText(['si', 'sí', 'yes']),
        },
      ],
      tips: [
        T('<b>SI(prueba; si_verdadero; si_falso)</b>.', '<b>IF(test, if_true, if_false)</b>.'),
        T('Los textos dentro de una fórmula van entre comillas: "Sí".', 'Text inside a formula goes in quotes: "Yes".'),
      ],
      feedback: T('Nadie se quedó sin bono por un error de fórmula. ¡Gracias! 👏', 'Nobody lost their bonus because of a formula error. Thanks! 👏'),
      solution: {
        fill: [['E', 2, last, `=SI(C2>=D2;"${yes}";"No")`], ['F', 2, last, '=SI(C2>=D2;C2*10%;0)']],
        cells: { I2: `=SUMA(F2:F${last})` },
        answers: { 3: String(met.filter(Boolean).length), 4: yes },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Aprobados y desaprobados
  // ---------------------------------------------------------------------------
  C.register('m3_grades', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [10, 12], [20, 25], [35, 40]);
    const rows = C.people(r, n).map((who) => ({ who, grade: r.int(2, 10) }));
    const edge = rows[r.int(1, n - 1)];
    edge.grade = 6;
    rows[0].grade = r.int(2, 5);
    const pass = T('Aprobado', 'Pass');
    const fail = T('Desaprobado', 'Fail');
    const failed = rows.filter((x) => x.grade < 6).length;
    const avg = sum(rows.map((x) => x.grade)) / n;
    const last = n + 1;
    const fn = AA.fnName;
    return {
      from: 'paula',
      dept: 'rrhh',
      subject: T('Examen final del curso de inducción', 'Onboarding course final exam'),
      file: T('examen_induccion.xlsx', 'onboarding_exam.xlsx'),
      email: T(
        `<p>Tengo las notas del examen de inducción (1 a 10). Se aprueba con <b>6 o más</b>.</p>
         <p>Necesito la columna <b>Condición</b> con "${pass}" o "${fail}".</p>`,
        `<p>I have the onboarding exam scores (1 to 10). The pass mark is <b>6 or more</b>.</p>
         <p>I need the <b>Result</b> column with "${pass}" or "${fail}".</p>`
      ),
      sheet: {
        cols: 8,
        rows: n + 8,
        colWidths: [170, 80, 130, 90, 90, 90, 60, 60],
        data: { at: 'A1', rows: [[T('Participante', 'Participant'), T('Nota', 'Score')], ...rows.map((x) => [x.who, x.grade])] },
        cells: { C1: T('Condición', 'Result') },
        locked: ['A1:C1', 'A2:B' + last],
        header: ['A1:C1'],
        targets: ['C2:C' + last],
        formats: { B: 'int' },
        start: 'C2',
      },
      objectives: [
        {
          text: T(`<b>Condición</b> (C2:C${last}): "${pass}" si la nota es 6 o más; si no, "${fail}".`, `<b>Result</b> (C2:C${last}): "${pass}" if the score is 6 or more; otherwise "${fail}".`),
          hint: `=${fn('SI')}(B2>=6; "${pass}"; "${fail}")`,
          check: V.column('C', 2, last, (row) => is(rows[row - 2].grade >= 6 ? pass : fail), {
            uses: ['SI'],
            wrongNote: T('Ojo con el 6: ¿aprueba o no?', 'Watch out for the 6: does it pass or not?'),
          }),
        },
        {
          text: T('❓ ¿Cuántas personas <b>desaprobaron</b>?', '❓ How many people <b>failed</b>?'),
          placeholder: T('Un número', 'A number'),
          hint: T(`Contá los "${fail}".`, `Count the "${fail}".`),
          answer: V.answerNumber(failed),
        },
        {
          text: T('❓ ¿Cuál fue el <b>promedio</b> de notas del curso? (con decimales)', '❓ What was the course <b>average</b> score? (with decimals)'),
          placeholder: T('Ej: 6.5', 'E.g. 6.5'),
          hint: T('Usá una celda libre con PROMEDIO sobre la columna B.', 'Use a free cell with AVERAGE over column B.'),
          answer: V.answerNumber(avg, 0.01),
        },
      ],
      tips: [T('Podés combinar lo que ya sabés: PROMEDIO sigue funcionando en cualquier celda libre.', 'Combine what you already know: AVERAGE works in any free cell.')],
      feedback: T('Gracias. Ya les mando los resultados a todos.', "Thanks. I'll send everyone their results."),
      solution: { fill: [['C', 2, last, `=SI(B2>=6;"${pass}";"${fail}")`]], answers: { 1: String(failed), 2: String(avg) } },
    };
  });

  // ---------------------------------------------------------------------------
  // Alertas de reposición
  // ---------------------------------------------------------------------------
  C.register('m3_restock', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [10, 12], [20, 25], [35, 40]);
    const rows = [];
    for (let i = 0; i < n; i++) {
      const min = r.step(10, 60, 5);
      rows.push({ sku: 'SKU-' + (2001 + i * 3), prod: C.L2(r.pick(PRODUCTS)), stock: r.int(0, 120), min });
    }
    rows[0].stock = rows[0].min - r.int(1, 8);
    rows[1].stock = rows[1].min;
    const low = (x) => x.stock < x.min;
    const order = (x) => (low(x) ? x.min * 2 - x.stock : 0);
    const restock = T('Reponer', 'Restock');
    const count = rows.filter(low).length;
    const units = sum(rows.map(order));
    const last = n + 1;
    const fn = AA.fnName;
    return {
      from: 'ramiro',
      dept: 'logistica',
      subject: T('¿Qué tenemos que reponer?', 'What do we need to restock?'),
      file: T('alertas_stock.xlsx', 'stock_alerts.xlsx'),
      email: T(
        `<p>Cada producto tiene un <b>stock mínimo</b>. Necesito dos columnas:</p>
         <ul><li><b>Estado</b>: "${restock}" si el stock actual es <b>menor</b> al mínimo; si no, "OK".</li>
         <li><b>A pedir</b>: si hay que reponer, pedimos hasta el doble del mínimo (<b>mínimo × 2 − stock</b>); si no, 0.</li></ul>`,
        `<p>Each product has a <b>minimum stock</b>. I need two columns:</p>
         <ul><li><b>Status</b>: "${restock}" if current stock is <b>below</b> the minimum; otherwise "OK".</li>
         <li><b>To order</b>: if we need to restock, we order up to twice the minimum (<b>minimum × 2 − stock</b>); otherwise 0.</li></ul>`
      ),
      sheet: {
        cols: 8,
        rows: n + 8,
        colWidths: [90, 170, 100, 110, 100, 100, 60, 60],
        data: { at: 'A1', rows: [['SKU', T('Producto', 'Product'), T('Stock actual', 'Current stock'), T('Stock mínimo', 'Minimum stock')], ...rows.map((x) => [x.sku, x.prod, x.stock, x.min])] },
        cells: { E1: T('Estado', 'Status'), F1: T('A pedir', 'To order') },
        locked: ['A1:F1', 'A2:D' + last],
        header: ['A1:F1'],
        targets: ['E2:F' + last],
        formats: { C: 'int', D: 'int', F: 'int' },
        start: 'E2',
      },
      objectives: [
        {
          text: T(`<b>Estado</b> (E2:E${last}): "${restock}" o "OK".`, `<b>Status</b> (E2:E${last}): "${restock}" or "OK".`),
          hint: `=${fn('SI')}(C2<D2; "${restock}"; "OK")`,
          check: V.column('E', 2, last, (row) => is(low(rows[row - 2]) ? restock : 'OK'), {
            uses: ['SI'],
            wrongNote: T('"Menor" es < (si el stock es igual al mínimo, está OK).', '"Below" is < (if stock equals the minimum, it is OK).'),
          }),
        },
        {
          text: T(`<b>A pedir</b> (F2:F${last}): mínimo × 2 − stock si hay que reponer; si no, 0.`, `<b>To order</b> (F2:F${last}): minimum × 2 − stock if restocking; otherwise 0.`),
          hint: `=${fn('SI')}(C2<D2; D2*2-C2; 0)`,
          check: V.column('F', 2, last, (row) => order(rows[row - 2]), { uses: ['SI'] }),
        },
        {
          text: T('❓ ¿Cuántos productos hay que <b>reponer</b>?', '❓ How many products need <b>restocking</b>?'),
          placeholder: T('Un número', 'A number'),
          hint: T(`Contá los "${restock}".`, `Count the "${restock}".`),
          answer: V.answerNumber(count),
        },
        {
          text: T('❓ ¿Cuántas <b>unidades</b> hay que pedir en total?', '❓ How many <b>units</b> do we need to order in total?'),
          placeholder: T('Un número', 'A number'),
          hint: T('Sumá la columna F en una celda libre.', 'Sum column F in a free cell.'),
          answer: V.answerNumber(units),
        },
      ],
      tips: [T('El resultado de un SI puede ser una cuenta: <code>D2*2-C2</code>.', 'The result of an IF can be a calculation: <code>D2*2-C2</code>.')],
      feedback: T('Listo, ya mando la orden de compra. ¡Nada de quedarnos sin stock!', "Done, I'm sending the purchase order. No more running out of stock!"),
      solution: {
        fill: [['E', 2, last, `=SI(C2<D2;"${restock}";"OK")`], ['F', 2, last, '=SI(C2<D2;D2*2-C2;0)']],
        answers: { 2: String(count), 3: String(units) },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Envío gratis desde cierto monto
  // ---------------------------------------------------------------------------
  C.register('m3_shipping', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [10, 12], [20, 25], [35, 40]);
    const LIMIT = 50000;
    const COST = 3500;
    const rows = C.people(r, n).map((who, i) => ({ id: 'W-' + (5001 + i), who, amount: r.step(8000, 95000, 500) }));
    rows[r.int(1, n - 1)].amount = LIMIT;
    rows[0].amount = LIMIT - r.step(500, 5000, 500);
    const ship = (x) => (x.amount >= LIMIT ? 0 : COST);
    const free = rows.filter((x) => ship(x) === 0).length;
    const total = sum(rows.map((x) => x.amount + ship(x)));
    const last = n + 1;
    const fn = AA.fnName;
    return {
      from: 'tadeo',
      dept: 'marketing',
      subject: T('Promo de envío gratis', 'Free shipping promo'),
      file: T('pedidos_web.xlsx', 'web_orders.xlsx'),
      email: T(
        `<p>Lanzamos una promo: <b>envío gratis</b> en compras de <b>${C.money(LIMIT)} o más</b>. Las demás pagan ${C.money(COST)} de envío.</p>
         <p>Completá el <b>Envío</b> y el <b>Total a cobrar</b> de cada pedido.</p>`,
        `<p>We launched a promo: <b>free shipping</b> on orders of <b>${C.money(LIMIT)} or more</b>. The rest pay ${C.money(COST)} for shipping.</p>
         <p>Fill in the <b>Shipping</b> and <b>Amount to charge</b> for each order.</p>`
      ),
      sheet: {
        cols: 8,
        rows: n + 8,
        colWidths: [80, 170, 110, 100, 130, 90, 60, 60],
        data: { at: 'A1', rows: [[T('Pedido', 'Order'), T('Cliente', 'Customer'), T('Monto', 'Amount')], ...rows.map((x) => [x.id, x.who, x.amount])] },
        cells: { D1: T('Envío', 'Shipping'), E1: T('Total a cobrar', 'Amount to charge') },
        locked: ['A1:E1', 'A2:C' + last],
        header: ['A1:E1'],
        targets: ['D2:E' + last],
        formats: { C: 'currency', D: 'currency', E: 'currency' },
        start: 'D2',
      },
      objectives: [
        {
          text: T(`<b>Envío</b> (D2:D${last}): 0 si el monto es ${C.money(LIMIT)} o más; si no, ${COST}.`, `<b>Shipping</b> (D2:D${last}): 0 if the amount is ${C.money(LIMIT)} or more; otherwise ${COST}.`),
          hint: `=${fn('SI')}(C2>=${LIMIT}; 0; ${COST})`,
          check: V.column('D', 2, last, (row) => ship(rows[row - 2]), { uses: ['SI'], wrongNote: T(`¿Qué pasa con un pedido de exactamente ${C.money(LIMIT)}?`, `What happens with an order of exactly ${C.money(LIMIT)}?`) }),
        },
        {
          text: T(`<b>Total a cobrar</b> (E2:E${last}): monto + envío.`, `<b>Amount to charge</b> (E2:E${last}): amount + shipping.`),
          hint: '=C2+D2',
          check: V.column('E', 2, last, (row) => rows[row - 2].amount + ship(rows[row - 2]), {}),
        },
        {
          text: T('❓ ¿Cuántos pedidos tienen <b>envío gratis</b>?', '❓ How many orders get <b>free shipping</b>?'),
          placeholder: T('Un número', 'A number'),
          hint: T('Contá los ceros de la columna D.', 'Count the zeros in column D.'),
          answer: V.answerNumber(free),
        },
        {
          text: T('❓ ¿Cuánto vamos a <b>cobrar en total</b>?', '❓ How much will we <b>charge in total</b>?'),
          placeholder: T('Un monto', 'An amount'),
          hint: T('SUMA de la columna E.', 'SUM of column E.'),
          answer: V.answerNumber(total),
        },
      ],
      tips: [T('Los números van sin comillas dentro de SI: <code>=SI(C2>=50000; 0; 3500)</code>.', 'Numbers go without quotes inside IF: <code>=IF(C2>=50000, 0, 3500)</code>.')],
      feedback: T('¡Buenísimo! La promo funciona y ya sabemos cuánto nos cuesta.', 'Great! The promo works and now we know what it costs us.'),
      solution: {
        fill: [['D', 2, last, `=SI(C2>=${LIMIT};0;${COST})`], ['E', 2, last, '=C2+D2']],
        answers: { 2: String(free), 3: String(total) },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Clientes VIP: dos condiciones con Y
  // ---------------------------------------------------------------------------
  C.register('m3_vip', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [10, 12], [20, 25], [35, 40]);
    const rows = C.companies(r, n).map((who) => ({ who, buys: r.int(1, 12), amount: r.step(10000, 300000, 1000) }));
    // Casos que cumplen una sola condición (para que haga falta Y).
    rows[0].buys = r.int(6, 12);
    rows[0].amount = r.step(20000, 90000, 1000);
    rows[1].buys = r.int(1, 4);
    rows[1].amount = r.step(150000, 300000, 1000);
    rows[2].buys = r.int(5, 12);
    rows[2].amount = r.step(100000, 250000, 1000);
    const vip = (x) => x.buys >= 5 && x.amount >= 100000;
    const VIP = 'VIP';
    const STD = T('Estándar', 'Standard');
    const vips = rows.filter(vip).length;
    const last = n + 1;
    const fn = AA.fnName;
    return {
      from: 'tadeo',
      dept: 'marketing',
      subject: T('¿Quiénes son nuestros clientes VIP?', 'Who are our VIP customers?'),
      file: T('clientes_segmentos.xlsx', 'customer_segments.xlsx'),
      email: T(
        `<p>Vamos a mandar un regalo a los clientes <b>VIP</b>. Un cliente es VIP si cumple <b>las dos</b> condiciones:</p>
         <ul><li>hizo <b>5 compras o más</b>, y</li><li>gastó <b>$100,000 o más</b> en total.</li></ul>
         <p>Si no, es "${STD}".</p>`,
        `<p>We'll send a gift to our <b>VIP</b> customers. A customer is VIP if they meet <b>both</b> conditions:</p>
         <ul><li>made <b>5 or more purchases</b>, and</li><li>spent <b>$100,000 or more</b> in total.</li></ul>
         <p>Otherwise they're "${STD}".</p>`
      ),
      sheet: {
        cols: 8,
        rows: n + 8,
        colWidths: [210, 90, 120, 120, 90, 90, 60, 60],
        data: { at: 'A1', rows: [[T('Cliente', 'Customer'), T('Compras', 'Purchases'), T('Monto total', 'Total amount')], ...rows.map((x) => [x.who, x.buys, x.amount])] },
        cells: { D1: T('Segmento', 'Segment') },
        locked: ['A1:D1', 'A2:C' + last],
        header: ['A1:D1'],
        targets: ['D2:D' + last],
        formats: { B: 'int', C: 'currency' },
        start: 'D2',
      },
      objectives: [
        {
          text: T(`<b>Segmento</b> (D2:D${last}): "VIP" si cumple las dos condiciones; si no, "${STD}". Usá <b>Y</b> dentro de SI.`, `<b>Segment</b> (D2:D${last}): "VIP" if both conditions are met; otherwise "${STD}". Use <b>AND</b> inside IF.`),
          hint: `=${fn('SI')}(${fn('Y')}(B2>=5; C2>=100000); "VIP"; "${STD}")`,
          check: V.column('D', 2, last, (row) => is(vip(rows[row - 2]) ? VIP : STD), {
            uses: ['Y'],
            wrongNote: T('Tienen que cumplirse las DOS condiciones a la vez.', 'BOTH conditions must be met at the same time.'),
          }),
        },
        {
          text: T('❓ ¿Cuántos clientes son <b>VIP</b>?', '❓ How many customers are <b>VIP</b>?'),
          placeholder: T('Un número', 'A number'),
          hint: T('Contá los VIP de la columna D.', 'Count the VIPs in column D.'),
          answer: V.answerNumber(vips),
        },
        {
          text: T(`❓ <b>${rows[0].who}</b> hizo muchas compras. ¿Es VIP? (Sí / No)`, `❓ <b>${rows[0].who}</b> made lots of purchases. Are they VIP? (Yes / No)`),
          placeholder: T('Sí o No', 'Yes or No'),
          hint: T('Revisá el monto total: ¿llega a $100,000?', 'Check the total amount: does it reach $100,000?'),
          answer: V.answerText(['no']),
        },
      ],
      tips: [T('<b>Y</b> devuelve VERDADERO solo si se cumplen todas; <b>O</b>, si se cumple alguna.', '<b>AND</b> returns TRUE only if all are met; <b>OR</b>, if any is met.')],
      feedback: T('¡Perfecto! Los regalos van a llegar a quien corresponde. 🎁', 'Perfect! The gifts will reach the right people. 🎁'),
      solution: { fill: [['D', 2, last, `=SI(Y(B2>=5;C2>=100000);"VIP";"${STD}")`]], answers: { 1: String(vips), 2: 'No' } },
    };
  });
})();
