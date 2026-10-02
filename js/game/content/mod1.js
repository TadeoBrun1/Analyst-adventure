/*
 * Analyst Adventure — Nivel 1: Fórmulas básicas (=, referencias, + - * /, rellenar).
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const C = AA.Content;
  const V = AA.V;
  const T = (es, en) => AA.T(es, en);
  const { PRODUCTS } = C.DATA;

  // ---------------------------------------------------------------------------
  // Total = Cantidad × Precio
  // ---------------------------------------------------------------------------
  C.register('m1_orders', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [8, 10], [18, 24], [35, 45]);
    const rows = [];
    for (let i = 0; i < n; i++) {
      const p = r.pick(PRODUCTS);
      rows.push({ id: 1001 + i, prod: C.L2(p), qty: r.int(1, p[2] > 300 ? 4 : 20), price: p[2] });
    }
    const total = (x) => x.qty * x.price;
    // El pedido más caro tiene que ser único para que la pregunta tenga una sola respuesta.
    while (C.uniqueExtreme(rows.map(total)) < 0) {
      const max = Math.max(...rows.map(total));
      rows.find((x) => total(x) === max).qty += 1;
    }
    const top = rows[C.uniqueExtreme(rows.map(total))];
    const last = n + 1;
    const intro = ctx.first
      ? T(
          '<p>¡Te damos la bienvenida al equipo! Leo ya te explicó lo básico, así que acá va tu primera tarea real.</p>',
          '<p>Welcome to the team! Leo already walked you through the basics, so here is your first real task.</p>'
        )
      : '';
    return {
      from: ctx.first ? 'marta' : 'bruno',
      dept: 'ventas',
      subject: T('Los pedidos de la semana', "This week's orders"),
      file: T('pedidos_semana.xlsx', 'weekly_orders.xlsx'),
      email:
        intro +
        T(
          `<p>Ventas nos mandó ${n} pedidos, pero les falta lo más importante: <b>cuánto facturó cada uno</b>.</p>
           <p>Agregá la columna <b>Total</b> (Cantidad × Precio unitario) con <b>fórmulas</b>, así si cambia un dato el total se actualiza solo.</p>
           <p>Las columnas A a D son los datos originales: no se tocan.</p>`,
          `<p>Sales sent us ${n} orders, but the most important part is missing: <b>how much each one billed</b>.</p>
           <p>Add the <b>Total</b> column (Quantity × Unit price) using <b>formulas</b>, so totals update by themselves if the data changes.</p>
           <p>Columns A to D are the original data: don't touch them.</p>`
        ),
      sheet: {
        cols: 8,
        rows: n + 8,
        colWidths: [80, 170, 90, 120, 120, 90, 90, 90],
        data: {
          at: 'A1',
          rows: [[T('Pedido', 'Order'), T('Producto', 'Product'), T('Cantidad', 'Quantity'), T('Precio unitario', 'Unit price')], ...rows.map((x) => [x.id, x.prod, x.qty, x.price])],
        },
        locked: ['A1:D' + last],
        header: ['A1:E1'],
        targets: ['E1:E' + last],
        formats: { C: 'int', D: 'currency', E: 'currency' },
        start: 'E1',
      },
      objectives: [
        {
          text: T('Escribí el encabezado <b>Total</b> en la celda <b>E1</b>.', 'Type the header <b>Total</b> in cell <b>E1</b>.'),
          hint: T('Hacé clic en E1, escribí Total y presioná Enter.', 'Click E1, type Total and press Enter.'),
          check: V.text('E1', 'Total'),
        },
        {
          text: T(`En <b>E2</b>, calculá el total del pedido ${rows[0].id} con una fórmula: <code>=C2*D2</code>.`, `In <b>E2</b>, calculate the total of order ${rows[0].id} with a formula: <code>=C2*D2</code>.`),
          hint: T('Escribí =C2*D2 en E2. También podés escribir "=", hacer clic en C2, escribir "*" y hacer clic en D2.', 'Type =C2*D2 in E2. You can also type "=", click C2, type "*" and click D2.'),
          check: V.cell('E2', total(rows[0]), { refs: ['C2', 'D2'] }),
        },
        {
          text: T(`Copiá la fórmula hacia abajo hasta <b>E${last}</b>.`, `Copy the formula down to <b>E${last}</b>.`),
          hint: T(`Seleccioná E2 y arrastrá el cuadradito azul de la esquina hasta E${last}. O seleccioná E2:E${last} y apretá Ctrl+D.`, `Select E2 and drag the little blue square in the corner down to E${last}. Or select E2:E${last} and press Ctrl+D.`),
          check: V.column('E', 3, last, (row) => total(rows[row - 2]), { refsFn: (row) => ['C' + row, 'D' + row] }),
        },
        {
          text: T('❓ ¿Qué producto generó el pedido de <b>mayor total</b>?', '❓ Which product generated the order with the <b>highest total</b>?'),
          placeholder: T('Nombre del producto', 'Product name'),
          hint: T('Mirá la columna E completa y buscá el número más grande.', 'Look at the completed column E and find the largest number.'),
          answer: V.answerText([top.prod]),
        },
      ],
      tips: [
        T('Toda fórmula empieza con <b>=</b>.', 'Every formula starts with <b>=</b>.'),
        T('Al copiar una fórmula hacia abajo, C2 pasa a ser C3, C4… solita.', 'When you copy a formula down, C2 becomes C3, C4… by itself.'),
      ],
      feedback: T('¡Excelente! Las fórmulas que se actualizan solas son la base de todo lo que viene.', 'Excellent! Formulas that update themselves are the foundation of everything that comes next.'),
      solution: { cells: { E1: 'Total' }, fill: [['E', 2, last, '=C2*D2']], answers: { 3: top.prod } },
    };
  });

  // ---------------------------------------------------------------------------
  // Diferencia = Real − Presupuesto
  // ---------------------------------------------------------------------------
  C.register('m1_budget', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [8, 10], [18, 24], [35, 45]);
    const names = C.people(r, n);
    const rows = names.map((who, i) => {
      const budget = r.step(5000, 60000, 500);
      const real = Math.round((budget * (0.75 + r.next() * 0.55)) / 10) * 10;
      return { id: 'PRJ-' + (101 + i), who, budget, real };
    });
    // Al menos dos proyectos pasados y dos por debajo.
    rows[0].real = rows[0].budget + r.step(500, 5000, 100);
    rows[1].real = rows[1].budget - r.step(500, 5000, 100);
    const diff = (x) => x.real - x.budget;
    while (C.uniqueExtreme(rows.map(diff)) < 0) {
      const max = Math.max(...rows.map(diff));
      rows.find((x) => diff(x) === max).real += 10;
    }
    const over = rows.filter((x) => diff(x) > 0).length;
    const worst = rows[C.uniqueExtreme(rows.map(diff))];
    const last = n + 1;
    return {
      from: 'julia',
      dept: 'finanzas',
      subject: T('¿Qué proyectos se pasaron del presupuesto?', 'Which projects went over budget?'),
      file: T('presupuesto_proyectos.xlsx', 'project_budget.xlsx'),
      email: T(
        `<p>Cerramos el trimestre y necesito saber cómo le fue a cada proyecto contra su presupuesto.</p>
         <p>Completá la columna <b>Diferencia</b> como <b>Gasto real − Presupuesto</b>. Si da positivo, el proyecto gastó de más.</p>`,
        `<p>We closed the quarter and I need to know how each project did against its budget.</p>
         <p>Fill in the <b>Difference</b> column as <b>Actual spend − Budget</b>. A positive number means the project overspent.</p>`
      ),
      sheet: {
        cols: 8,
        rows: n + 8,
        colWidths: [90, 160, 120, 120, 130, 90, 90, 90],
        data: {
          at: 'A1',
          rows: [[T('Proyecto', 'Project'), T('Responsable', 'Owner'), T('Presupuesto', 'Budget'), T('Gasto real', 'Actual spend')], ...rows.map((x) => [x.id, x.who, x.budget, x.real])],
        },
        cells: { E1: T('Diferencia', 'Difference') },
        locked: ['A1:E1', 'A2:D' + last],
        header: ['A1:E1'],
        targets: ['E2:E' + last],
        formats: { C: 'currency', D: 'currency', E: 'currency' },
        start: 'E2',
      },
      objectives: [
        {
          text: T('En <b>E2</b>, restá: <code>=D2-C2</code> (real menos presupuesto).', 'In <b>E2</b>, subtract: <code>=D2-C2</code> (actual minus budget).'),
          hint: T('El orden importa: D2-C2 no es lo mismo que C2-D2.', 'Order matters: D2-C2 is not the same as C2-D2.'),
          check: V.cell('E2', diff(rows[0]), { refs: ['C2', 'D2'], wrongNote: T('Revisá el orden de la resta: real (D) menos presupuesto (C).', 'Check the order: actual (D) minus budget (C).') }),
        },
        {
          text: T(`Copiá la fórmula hasta <b>E${last}</b>.`, `Copy the formula down to <b>E${last}</b>.`),
          hint: T('Arrastrá el controlador de relleno o usá Ctrl+D.', 'Drag the fill handle or use Ctrl+D.'),
          check: V.column('E', 3, last, (row) => diff(rows[row - 2]), { refsFn: (row) => ['C' + row, 'D' + row] }),
        },
        {
          text: T('❓ ¿Cuántos proyectos <b>gastaron más</b> de lo presupuestado?', '❓ How many projects <b>spent more</b> than budgeted?'),
          placeholder: T('Un número', 'A number'),
          hint: T('Contá las diferencias positivas.', 'Count the positive differences.'),
          answer: V.answerNumber(over),
        },
        {
          text: T('❓ ¿Qué proyecto tuvo el <b>mayor desvío</b> por encima del presupuesto?', '❓ Which project had the <b>largest overrun</b>?'),
          placeholder: 'PRJ-…',
          hint: T('Buscá la diferencia positiva más grande.', 'Find the largest positive difference.'),
          answer: V.answerText([worst.id]),
        },
      ],
      tips: [
        T('La resta se escribe con <b>-</b>: <code>=D2-C2</code>.', 'Subtraction uses <b>-</b>: <code>=D2-C2</code>.'),
        T('Un número negativo en la diferencia significa que sobró plata.', 'A negative difference means money was left over.'),
      ],
      feedback: T('Perfecto. Con esto ya sé a qué responsables tengo que llamar. 📞', 'Perfect. Now I know which owners I need to call. 📞'),
      solution: { fill: [['E', 2, last, '=D2-C2']], answers: { 2: String(over), 3: worst.id } },
    };
  });

  // ---------------------------------------------------------------------------
  // Stock final = Inicial + Entradas − Salidas
  // ---------------------------------------------------------------------------
  C.register('m1_stock', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [8, 10], [18, 24], [35, 45]);
    const rows = [];
    for (let i = 0; i < n; i++) {
      const start = r.int(5, 80);
      const inn = r.int(0, 60);
      const out = r.int(0, start + inn);
      rows.push({ sku: 'SKU-' + (1001 + i * 7), prod: C.L2(r.pick(PRODUCTS)), start, inn, out });
    }
    // Al menos un producto casi agotado.
    const k = r.int(0, n - 1);
    rows[k].out = rows[k].start + rows[k].inn - r.int(0, 5);
    const fin = (x) => x.start + x.inn - x.out;
    while (C.uniqueExtreme(rows.map(fin)) < 0) {
      const max = Math.max(...rows.map(fin));
      rows.find((x) => fin(x) === max).inn += 1;
    }
    const low = rows.filter((x) => fin(x) < 10).length;
    const best = rows[C.uniqueExtreme(rows.map(fin))];
    const last = n + 1;
    return {
      from: 'ramiro',
      dept: 'logistica',
      subject: T('Inventario de fin de mes', 'End-of-month inventory'),
      file: T('inventario_mes.xlsx', 'monthly_inventory.xlsx'),
      email: T(
        `<p>Necesito el <b>stock final</b> de cada producto: lo que había al principio, más lo que entró, menos lo que salió.</p>
         <p>Con eso armamos la compra del mes que viene.</p>`,
        `<p>I need the <b>ending stock</b> of each product: what we had at the start, plus what came in, minus what went out.</p>
         <p>We'll plan next month's purchase with it.</p>`
      ),
      sheet: {
        cols: 9,
        rows: n + 8,
        colWidths: [90, 170, 100, 90, 90, 110, 90, 90, 90],
        data: {
          at: 'A1',
          rows: [['SKU', T('Producto', 'Product'), T('Stock inicial', 'Opening stock'), T('Entradas', 'Received'), T('Salidas', 'Shipped')], ...rows.map((x) => [x.sku, x.prod, x.start, x.inn, x.out])],
        },
        cells: { F1: T('Stock final', 'Ending stock') },
        locked: ['A1:F1', 'A2:E' + last],
        header: ['A1:F1'],
        targets: ['F2:F' + last],
        formats: { C: 'int', D: 'int', E: 'int', F: 'int' },
        start: 'F2',
      },
      objectives: [
        {
          text: T('En <b>F2</b>: <code>=C2+D2-E2</code>.', 'In <b>F2</b>: <code>=C2+D2-E2</code>.'),
          hint: T('Sumá el stock inicial y las entradas, y restá las salidas.', 'Add opening stock and received, then subtract shipped.'),
          check: V.cell('F2', fin(rows[0]), { refs: ['C2', 'D2', 'E2'] }),
        },
        {
          text: T(`Copiá la fórmula hasta <b>F${last}</b>.`, `Copy the formula down to <b>F${last}</b>.`),
          hint: T('Controlador de relleno o Ctrl+D.', 'Fill handle or Ctrl+D.'),
          check: V.column('F', 3, last, (row) => fin(rows[row - 2]), { refsFn: (row) => ['C' + row, 'D' + row, 'E' + row] }),
        },
        {
          text: T('❓ ¿Cuántos productos terminaron con <b>menos de 10</b> unidades?', '❓ How many products ended with <b>fewer than 10</b> units?'),
          placeholder: T('Un número', 'A number'),
          hint: T('Revisá la columna F y contá los menores a 10.', 'Check column F and count the ones below 10.'),
          answer: V.answerNumber(low),
        },
        {
          text: T('❓ ¿Qué <b>SKU</b> terminó con más stock?', '❓ Which <b>SKU</b> ended with the most stock?'),
          placeholder: 'SKU-…',
          hint: T('Buscá el número más grande de la columna F.', 'Find the largest number in column F.'),
          answer: V.answerText([best.sku]),
        },
      ],
      tips: [
        T('Podés combinar operaciones en una sola fórmula: <code>=C2+D2-E2</code>.', 'You can combine operations in a single formula: <code>=C2+D2-E2</code>.'),
      ],
      feedback: T('Genial, con este stock ya puedo pedir mercadería sin adivinar.', "Great, with this stock I can order goods without guessing."),
      solution: { fill: [['F', 2, last, '=C2+D2-E2']], answers: { 2: String(low), 3: best.sku } },
    };
  });

  // ---------------------------------------------------------------------------
  // IVA y total de facturas
  // ---------------------------------------------------------------------------
  C.register('m1_vat', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [8, 10], [18, 24], [35, 45]);
    const clients = C.companies(r, n);
    const rows = clients.map((cl, i) => ({ id: 'F-' + String(i + 1).padStart(4, '0'), cl, net: r.step(1000, 90000, 50) }));
    const vat = (x) => x.net * 0.21;
    const tot = (x) => x.net + vat(x);
    const pickRow = rows[r.int(1, n - 1)];
    const last = n + 1;
    return {
      from: 'julia',
      dept: 'finanzas',
      subject: T('Facturas con IVA', 'Invoices with VAT'),
      file: T('facturas_mes.xlsx', 'monthly_invoices.xlsx'),
      email: T(
        `<p>Tengo las facturas del mes solo con el monto <b>neto</b>. Necesito dos columnas más:</p>
         <ul><li><b>IVA</b>: el 21% del neto.</li><li><b>Total</b>: neto + IVA.</li></ul>`,
        `<p>I have this month's invoices with only the <b>net</b> amount. I need two more columns:</p>
         <ul><li><b>VAT</b>: 21% of the net amount.</li><li><b>Total</b>: net + VAT.</li></ul>`
      ),
      sheet: {
        cols: 8,
        rows: n + 8,
        colWidths: [80, 210, 120, 110, 120, 90, 90, 90],
        data: { at: 'A1', rows: [[T('Factura', 'Invoice'), T('Cliente', 'Client'), T('Neto', 'Net')], ...rows.map((x) => [x.id, x.cl, x.net])] },
        cells: { D1: T('IVA', 'VAT'), E1: 'Total' },
        locked: ['A1:E1', 'A2:C' + last],
        header: ['A1:E1'],
        targets: ['D2:E' + last],
        formats: { C: 'currency', D: 'currency', E: 'currency' },
        start: 'D2',
      },
      objectives: [
        {
          text: T(`<b>IVA</b> (D2:D${last}): <code>=C2*21%</code>.`, `<b>VAT</b> (D2:D${last}): <code>=C2*21%</code>.`),
          hint: T('21% es lo mismo que 0.21: =C2*21% o =C2*0.21. Después rellená hacia abajo.', '21% is the same as 0.21: =C2*21% or =C2*0.21. Then fill down.'),
          check: V.column('D', 2, last, (row) => vat(rows[row - 2]), { refsFn: (row) => ['C' + row] }),
        },
        {
          text: T(`<b>Total</b> (E2:E${last}): neto + IVA.`, `<b>Total</b> (E2:E${last}): net + VAT.`),
          hint: '=C2+D2',
          check: V.column('E', 2, last, (row) => tot(rows[row - 2]), {}),
        },
        {
          text: T(`❓ ¿Cuál es el <b>total</b> de la factura <b>${pickRow.id}</b>?`, `❓ What is the <b>total</b> of invoice <b>${pickRow.id}</b>?`),
          placeholder: T('Un monto', 'An amount'),
          hint: T('Buscá la fila de esa factura en la columna E.', "Find that invoice's row in column E."),
          answer: V.answerNumber(tot(pickRow)),
        },
      ],
      tips: [
        T('El símbolo <b>%</b> divide por 100: <code>21%</code> = 0.21.', 'The <b>%</b> sign divides by 100: <code>21%</code> = 0.21.'),
        T('Podés usar una columna que calculaste antes: el Total usa el IVA de la columna D.', 'You can reuse a column you already calculated: Total uses the VAT in column D.'),
      ],
      feedback: T('Impecable. Ya puedo mandar las facturas al cliente.', 'Spotless. I can send the invoices to the clients now.'),
      solution: { fill: [['D', 2, last, '=C2*21%'], ['E', 2, last, '=C2+D2']], answers: { 2: String(tot(pickRow)) } },
    };
  });

  // ---------------------------------------------------------------------------
  // Precio promedio = Facturación / Unidades
  // ---------------------------------------------------------------------------
  C.register('m1_unit', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [8, 10], [18, 24], [35, 45]);
    const names = C.people(r, n);
    const rows = names.map((who) => {
      const units = r.int(5, 120);
      const price = r.int(15, 90) + r.pick([0, 0.5]);
      return { who, units, revenue: Math.round(units * price * (0.9 + r.next() * 0.2)) };
    });
    const avg = (x) => x.revenue / x.units;
    while (C.uniqueExtreme(rows.map(avg)) < 0) {
      const max = Math.max(...rows.map(avg));
      rows.find((x) => avg(x) === max).revenue += 7;
    }
    const best = rows[C.uniqueExtreme(rows.map(avg))];
    const over50 = rows.filter((x) => avg(x) > 50).length;
    const last = n + 1;
    return {
      from: 'bruno',
      dept: 'ventas',
      subject: T('¿A qué precio vendió cada vendedor?', 'What price did each seller get?'),
      file: T('precios_promedio.xlsx', 'average_prices.xlsx'),
      email: T(
        `<p>Sospecho que algunos vendedores están haciendo demasiados descuentos.</p>
         <p>Calculá el <b>precio promedio</b> de cada uno: <b>Facturación ÷ Unidades</b>.</p>`,
        `<p>I suspect some sellers are giving too many discounts.</p>
         <p>Calculate each one's <b>average price</b>: <b>Revenue ÷ Units</b>.</p>`
      ),
      sheet: {
        cols: 8,
        rows: n + 8,
        colWidths: [170, 110, 130, 140, 90, 90, 90, 90],
        data: { at: 'A1', rows: [[T('Vendedor', 'Seller'), T('Unidades', 'Units'), T('Facturación', 'Revenue')], ...rows.map((x) => [x.who, x.units, x.revenue])] },
        cells: { D1: T('Precio promedio', 'Average price') },
        locked: ['A1:D1', 'A2:C' + last],
        header: ['A1:D1'],
        targets: ['D2:D' + last],
        formats: { B: 'int', C: 'currency', D: 'currency' },
        start: 'D2',
      },
      objectives: [
        {
          text: T(`<b>Precio promedio</b> (D2:D${last}): <code>=C2/B2</code>.`, `<b>Average price</b> (D2:D${last}): <code>=C2/B2</code>.`),
          hint: T('La división se escribe con /. Después rellená hacia abajo.', 'Division uses /. Then fill down.'),
          check: V.column('D', 2, last, (row) => avg(rows[row - 2]), { refsFn: (row) => ['B' + row, 'C' + row] }),
        },
        {
          text: T('❓ ¿Quién vendió al <b>precio promedio más alto</b>?', '❓ Who sold at the <b>highest average price</b>?'),
          placeholder: T('Nombre y apellido', 'Full name'),
          hint: T('Buscá el valor más grande de la columna D.', 'Find the largest value in column D.'),
          answer: V.answerText([best.who]),
        },
        {
          text: T('❓ ¿Cuántos vendedores tienen un precio promedio <b>mayor a $50</b>?', '❓ How many sellers have an average price <b>above $50</b>?'),
          placeholder: T('Un número', 'A number'),
          hint: T('Contá en la columna D los valores mayores a 50.', 'Count the values above 50 in column D.'),
          answer: V.answerNumber(over50),
        },
      ],
      tips: [T('Dividir por una celda vacía o en cero da <b>#DIV/0!</b>.', 'Dividing by an empty or zero cell gives <b>#DIV/0!</b>.')],
      feedback: T('Lo sabía: hay un par que regala la mercadería. Gracias por los números.', 'I knew it: a couple of them are practically giving products away. Thanks for the numbers.'),
      solution: { fill: [['D', 2, last, '=C2/B2']], answers: { 1: best.who, 2: String(over50) } },
    };
  });
})();
