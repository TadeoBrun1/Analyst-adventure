/*
 * Analyst Adventure — Nivel 7 (etapa Junior): cruzar tablas con BUSCARV y BUSCARX.
 * Libros con varias hojas, referencias a otras hojas (Productos!A:D), #N/A y SI.ERROR,
 * y coincidencia aproximada para tramos.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const C = AA.Content;
  const V = AA.V;
  const F = AA.Formula;
  const T = (es, en) => AA.T(es, en);
  const { PRODUCTS, REGIONS, CITIES, AREAS } = C.DATA;
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const P = (name) => F.sheetPrefix(name);
  const fn = (n) => AA.fnName(n);

  C.module({
    id: 'mod7',
    title: { es: 'Cruzar tablas: BUSCARV y BUSCARX', en: 'Joining tables: VLOOKUP and XLOOKUP' },
    xp: 100,
    tier: 1,
    skills: ['sheets', 'vlookup', 'xlookup', 'notfound', 'approx'],
    templates: ['m7_prices', 'm7_regions', 'm7_missing', 'm7_left', 'm7_tiers'],
    seeds: [701, 702, 703, 704, 705],
    intro: {
      es: '¡Bienvenida a la etapa Junior! Primer superpoder de un Junior: <b>cruzar tablas</b>. Los datos casi nunca vienen en una sola hoja: las ventas en una, los precios en otra, los clientes en otra. Hoy aprendés a juntarlas.',
      en: 'Welcome to the Junior stage! A Junior\'s first superpower: <b>joining tables</b>. Data almost never comes in a single sheet: sales in one, prices in another, customers in another. Today you learn to bring them together.',
    },
    skillDefs: {
      sheets: {
        title: { es: 'Libros con varias hojas', en: 'Workbooks with several sheets' },
        say: {
          es: 'Un archivo de Excel (un <b>libro</b>) puede tener varias <b>hojas</b>: las pestañas de abajo. Para usar una celda de otra hoja, escribí su nombre y un signo de exclamación: <code>=Productos!D2</code>. Si el nombre tiene espacios, va entre comillas simples: <code>=\'Lista de precios\'!B5</code>.',
          en: "An Excel file (a <b>workbook</b>) can have several <b>sheets</b>: the tabs at the bottom. To use a cell from another sheet, write its name and an exclamation mark: <code>=Products!D2</code>. If the name has spaces, use single quotes: <code>='Price list'!B5</code>.",
        },
        tip: { es: 'Mientras escribís una fórmula, empezá a tipear el nombre de la hoja y te lo sugiere.', en: 'While typing a formula, start typing the sheet name and it will be suggested.' },
      },
      vlookup: {
        title: { es: 'BUSCARV: traer un dato de otra tabla', en: 'VLOOKUP: bring data from another table' },
        say: {
          es: '<code>=BUSCARV(B2; Productos!$A$2:$D$20; 4; FALSO)</code> busca el valor de B2 en la <b>primera columna</b> de la tabla y devuelve lo que hay en la columna <b>4</b> de esa fila. El <b>FALSO</b> pide coincidencia <b>exacta</b>: casi siempre es lo que querés.',
          en: '<code>=VLOOKUP(B2, Products!$A$2:$D$20, 4, FALSE)</code> looks for B2 in the <b>first column</b> of the table and returns what is in column <b>4</b> of that row. <b>FALSE</b> asks for an <b>exact</b> match: almost always what you want.',
        },
        fns: ['BUSCARV'],
        tip: { es: 'Fijá la tabla con $ (o usá columnas enteras como Productos!A:D) para poder copiar la fórmula.', 'en': 'Lock the table with $ (or use whole columns like Products!A:D) so you can copy the formula.' },
      },
      xlookup: {
        title: { es: 'BUSCARX: la versión moderna', en: 'XLOOKUP: the modern version' },
        say: {
          es: '<code>=BUSCARX(A2; Nómina!C:C; Nómina!A:A)</code>: dónde buscar y qué devolver son dos rangos separados. Por eso puede devolver una columna que está a la <b>izquierda</b> de la clave (BUSCARV no puede) y no se rompe si alguien inserta columnas.',
          en: '<code>=XLOOKUP(A2, Payroll!C:C, Payroll!A:A)</code>: where to look and what to return are two separate ranges. So it can return a column to the <b>left</b> of the key (VLOOKUP can\'t) and it doesn\'t break when someone inserts columns.',
        },
        fns: ['BUSCARX'],
        tip: { es: 'En Google Sheets y Excel 365 existe BUSCARX. En versiones viejas se hace con INDICE + COINCIDIR.', en: 'XLOOKUP exists in Google Sheets and Excel 365. In older versions you use INDEX + MATCH.' },
      },
      notfound: {
        title: { es: '#N/A: "no lo encontré"', en: '#N/A: "not found"' },
        say: {
          es: '<b>#N/A</b> significa que la clave no está en la tabla. No lo escondas sin mirar: suele ser un código mal escrito, un espacio de más o un cliente nuevo. Cuando ya sabés por qué, mostralo prolijo: <code>=BUSCARX(B2; Clientes!A:A; Clientes!C:C; "Sin datos")</code> o <code>=SI.ERROR(BUSCARV(…); "Sin datos")</code>.',
          en: '<b>#N/A</b> means the key is not in the table. Don\'t hide it without looking: it\'s usually a typo, an extra space or a new customer. Once you know why, show it neatly: <code>=XLOOKUP(B2, Customers!A:A, Customers!C:C, "No data")</code> or <code>=IFERROR(VLOOKUP(…), "No data")</code>.',
        },
        fns: ['SI.ERROR'],
        tip: { es: 'Contá cuántos "Sin datos" quedaron: si son muchos, el cruce no sirve y hay que avisar.', en: 'Count how many "No data" are left: if there are many, the join is not reliable and you must say so.' },
      },
      approx: {
        title: { es: 'Tramos: coincidencia aproximada', en: 'Brackets: approximate match' },
        say: {
          es: 'Para tablas de tramos (comisiones, descuentos, impuestos) se usa <code>=BUSCARV(B2; Tramos!$A$2:$B$5; 2; VERDADERO)</code>: busca el <b>mayor "Desde" que no supere</b> el valor. La primera columna tiene que estar ordenada de menor a mayor.',
          en: 'For bracket tables (commissions, discounts, taxes) use <code>=VLOOKUP(B2, Brackets!$A$2:$B$5, 2, TRUE)</code>: it finds the <b>largest "From" that does not exceed</b> the value. The first column must be sorted from smallest to largest.',
        },
        tip: { es: 'Con códigos o nombres usá siempre FALSO. VERDADERO es solo para tramos numéricos ordenados.', en: 'With codes or names always use FALSE. TRUE is only for sorted numeric brackets.' },
      },
    },
  });

  const CATS = [['Oficina', 'Office'], ['Electrónica', 'Electronics'], ['Muebles', 'Furniture'], ['Accesorios', 'Accessories']];

  // ---------------------------------------------------------------------------
  // Precios desde la hoja de productos (BUSCARV exacto)
  // ---------------------------------------------------------------------------
  C.register('m7_prices', (ctx) => {
    const r = ctx.rng;
    const k = ctx.size === 'large' ? 16 : ctx.size === 'medium' ? 12 : 8;
    const n = C.rowsFor(ctx, [12, 16], [26, 34], [45, 60]);
    const prods = r.shuffle(r.sample(PRODUCTS, k).map((p, i) => ({ code: 'P-' + (101 + i), name: C.L2(p), price: p[2], cat: C.L2(r.pick(CATS)) })));
    let orders;
    let totals;
    do {
      orders = [];
      for (let i = 0; i < n; i++) {
        const p = r.pick(prods);
        orders.push({ id: 'V-' + (1001 + i), p, qty: r.int(1, 12) });
      }
      totals = orders.map((o) => o.qty * o.p.price);
    } while (C.uniqueExtreme(totals) < 0);
    const last = n + 1;
    const ps = T('Productos', 'Products');
    const big = orders[C.uniqueExtreme(totals)];
    const range = `${P(ps)}$A$2:$D$${k + 1}`;
    return {
      from: 'bruno',
      dept: 'ventas',
      subject: T('Le faltan los precios a los pedidos', 'The orders are missing prices'),
      file: T('pedidos_semana.xlsx', 'weekly_orders.xlsx'),
      email: T(
        `<p>El sistema exportó los pedidos de la semana <b>sin precios</b>: solo trae el código de cada producto. La lista de precios está en la otra hoja del archivo (<b>${ps}</b>).</p>
         <p>Necesito el <b>precio unitario</b> y el <b>total</b> de cada pedido, y cuánto facturamos en total.</p>`,
        `<p>The system exported this week's orders <b>without prices</b>: it only has each product code. The price list is in the other sheet of the file (<b>${ps}</b>).</p>
         <p>I need the <b>unit price</b> and the <b>total</b> for each order, and how much we billed in total.</p>`
      ),
      sheets: [
        {
          name: T('Pedidos', 'Orders'),
          cols: 8,
          rows: n + 4,
          colWidths: [80, 80, 80, 120, 110, 30, 90, 90],
          data: { at: 'A1', rows: [[T('Pedido', 'Order'), T('Código', 'Code'), T('Cantidad', 'Quantity'), T('Precio unitario', 'Unit price'), 'Total'], ...orders.map((o) => [o.id, o.p.code, o.qty])] },
          locked: ['A1:C' + last, 'D1:E1'],
          header: ['A1:E1'],
          targets: ['D2:E' + last],
          formats: { D: 'currency', E: 'currency' },
          start: 'D2',
        },
        {
          name: ps,
          cols: 5,
          rows: k + 3,
          colWidths: [80, 160, 120, 100, 60],
          data: { at: 'A1', rows: [[T('Código', 'Code'), T('Producto', 'Product'), T('Categoría', 'Category'), T('Precio', 'Price')], ...prods.map((p) => [p.code, p.name, p.cat, p.price])] },
          locked: ['A1:E' + (k + 3)],
          header: ['A1:D1'],
          formats: { D: 'currency' },
        },
      ],
      objectives: [
        {
          text: T(`<b>Precio unitario</b> (D2:D${last}) traído de la hoja ${ps} con BUSCARV.`, `<b>Unit price</b> (D2:D${last}) brought from the ${ps} sheet with VLOOKUP.`),
          hint: `=${fn('BUSCARV')}(B2; ${range}; 4; ${T('FALSO', 'FALSE')})`,
          check: V.column('D', 2, last, (row) => orders[row - 2].p.price, { uses: ['BUSCARV', 'BUSCARX', 'INDICE'] }),
        },
        {
          text: T(`<b>Total</b> de cada pedido (E2:E${last}) = cantidad × precio.`, `<b>Total</b> for each order (E2:E${last}) = quantity × price.`),
          hint: '=C2*D2',
          check: V.column('E', 2, last, (row) => totals[row - 2], { refsFn: (row) => ['C' + row, 'D' + row] }),
        },
        {
          text: T('❓ ¿Cuánto <b>facturamos en total</b> esta semana?', '❓ How much did we <b>bill in total</b> this week?'),
          placeholder: T('Un monto', 'An amount'),
          hint: T(`En una celda libre: =SUMA(E2:E${last})`, `In a free cell: =SUM(E2:E${last})`),
          answer: V.answerNumber(sum(totals), 0.01),
        },
        {
          text: T('❓ ¿Qué <b>producto</b> (nombre) tiene el pedido de mayor total?', '❓ Which <b>product</b> (name) is in the order with the largest total?'),
          placeholder: T('Nombre del producto', 'Product name'),
          hint: T(`Buscá el máximo de la columna E y después el nombre de su código en la hoja ${ps}.`, `Find the maximum of column E and then the name of its code in the ${ps} sheet.`),
          answer: V.answerText([big.p.name]),
        },
      ],
      tips: [
        T(`La tabla está en otra hoja: <b>${P(ps)}A:D</b>. Fijala con $ o usá columnas enteras.`, `The table is in another sheet: <b>${P(ps)}A:D</b>. Lock it with $ or use whole columns.`),
        T('Columna 4 = la cuarta columna <b>de la tabla</b>, contando desde la primera que elegiste.', 'Column 4 = the fourth column <b>of the table</b>, counting from the first one you chose.'),
        T('El último argumento en <b>FALSO</b>: coincidencia exacta.', 'Last argument <b>FALSE</b>: exact match.'),
      ],
      feedback: T('¡Excelente! Ya mandé las facturas. Antes esto me llevaba una tarde copiando precios a mano.', 'Excellent! I already sent the invoices. This used to take me a whole afternoon copying prices by hand.'),
      solution: {
        fill: [['D', 2, last, `=BUSCARV(B2;${range};4;FALSO)`], ['E', 2, last, '=C2*D2']],
        answers: { 2: String(sum(totals)), 3: big.p.name },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Región de cada vendedor (BUSCARX) y total por región (SUMAR.SI)
  // ---------------------------------------------------------------------------
  C.register('m7_regions', (ctx) => {
    const r = ctx.rng;
    const regs = REGIONS.slice(0, 4).map(C.L2);
    const nSel = ctx.size === 'large' ? 10 : ctx.size === 'medium' ? 8 : 6;
    const sellers = C.people(r, nSel).map((name, i) => ({ name, reg: regs[i % 4], boss: '' }));
    const bosses = C.people(r, 4);
    sellers.forEach((s) => (s.boss = bosses[regs.indexOf(s.reg)]));
    const n = C.rowsFor(ctx, [14, 18], [28, 36], [48, 60]);
    let rows;
    let totals;
    do {
      rows = [];
      for (let i = 0; i < n; i++) rows.push({ s: r.pick(sellers), amount: r.step(800, 18000, 50) });
      totals = regs.map((g) => sum(rows.filter((x) => x.s.reg === g).map((x) => x.amount)));
    } while (C.uniqueExtreme(totals) < 0 || totals.some((t) => !t));
    const last = n + 1;
    const team = T('Equipo', 'Team');
    const ask = r.int(0, 3);
    const best = regs[C.uniqueExtreme(totals)];
    return {
      from: 'marta',
      dept: 'analytics',
      subject: T('Ventas por región (la región no viene en el archivo)', 'Sales by region (the region is not in the file)'),
      file: T('ventas_equipo.xlsx', 'team_sales.xlsx'),
      email: T(
        `<p>Dirección quiere el <b>total vendido por región</b>, pero el archivo de ventas solo tiene el vendedor. En la hoja <b>${team}</b> está la región de cada uno.</p>
         <p>Primero traé la región a cada venta y después armá el resumen.</p>`,
        `<p>Management wants <b>total sales by region</b>, but the sales file only has the seller. The <b>${team}</b> sheet has each seller's region.</p>
         <p>First bring the region to each sale and then build the summary.</p>`
      ),
      sheets: [
        {
          name: T('Ventas', 'Sales'),
          cols: 8,
          rows: n + 4,
          colWidths: [160, 100, 100, 30, 100, 120, 60, 60],
          data: { at: 'A1', rows: [[T('Vendedor', 'Seller'), T('Monto', 'Amount'), T('Región', 'Region')], ...rows.map((x) => [x.s.name, x.amount])] },
          cells: { E1: T('Región', 'Region'), F1: T('Total vendido', 'Total sold'), E2: regs[0], E3: regs[1], E4: regs[2], E5: regs[3] },
          locked: ['A1:B' + last, 'C1', 'E1:F1', 'E2:E5'],
          header: ['A1:C1', 'E1:F1'],
          labels: ['E2:E5'],
          targets: ['C2:C' + last, 'F2:F5'],
          formats: { B: 'currency', F: 'currency' },
          start: 'C2',
        },
        {
          name: team,
          cols: 4,
          rows: nSel + 3,
          colWidths: [160, 100, 160, 60],
          data: { at: 'A1', rows: [[T('Vendedor', 'Seller'), T('Región', 'Region'), T('Jefe/a', 'Manager')], ...r.shuffle(sellers).map((s) => [s.name, s.reg, s.boss])] },
          locked: ['A1:D' + (nSel + 3)],
          header: ['A1:C1'],
        },
      ],
      objectives: [
        {
          text: T(`<b>Región</b> de cada venta (C2:C${last}) traída de la hoja ${team}.`, `<b>Region</b> of each sale (C2:C${last}) brought from the ${team} sheet.`),
          hint: `=${fn('BUSCARX')}(A2; ${P(team)}A:A; ${P(team)}B:B)`,
          check: V.column('C', 2, last, (row) => rows[row - 2].s.reg, { uses: ['BUSCARX', 'BUSCARV', 'INDICE'] }),
        },
        {
          text: T('<b>Total vendido</b> por región (F2:F5) con SUMAR.SI sobre la columna que completaste.', '<b>Total sold</b> per region (F2:F5) with SUMIF over the column you filled.'),
          hint: `=${fn('SUMAR.SI')}($C$2:$C$${last}; E2; $B$2:$B$${last})`,
          check: V.column('F', 2, 5, (row) => totals[row - 2], { uses: ['SUMAR.SI', 'SUMAR.SI.CONJUNTO'], dollarHint: true }),
        },
        {
          text: T('❓ ¿Qué región <b>vendió más</b>?', '❓ Which region <b>sold the most</b>?'),
          placeholder: T('Región', 'Region'),
          hint: T('Mirá la columna F.', 'Look at column F.'),
          answer: V.answerText([best]),
        },
        {
          text: T(`❓ ¿Quién es el/la <b>jefe/a</b> de la región <b>${regs[ask]}</b>? (está en la hoja ${team})`, `❓ Who is the <b>manager</b> of the <b>${regs[ask]}</b> region? (it is in the ${team} sheet)`),
          placeholder: T('Nombre', 'Name'),
          hint: T(`Abrí la pestaña ${team} y buscá un vendedor de esa región.`, `Open the ${team} tab and find a seller from that region.`),
          answer: V.answerText([bosses[ask]]),
        },
      ],
      tips: [
        T('Primero el cruce (traer la región), después el resumen (SUMAR.SI). Así trabajan los analistas: paso a paso.', 'First the join (bring the region), then the summary (SUMIF). That\'s how analysts work: step by step.'),
        T('BUSCARX: valor buscado, dónde buscarlo y qué devolver.', 'XLOOKUP: lookup value, where to look and what to return.'),
      ],
      feedback: T('Perfecto, esto va directo a la presentación de dirección. Y quedó armado para el mes que viene.', 'Perfect, this goes straight into the management presentation. And it\'s ready for next month too.'),
      solution: {
        fill: [['C', 2, last, `=BUSCARX(A2;${P(team)}A:A;${P(team)}B:B)`], ['F', 2, 5, `=SUMAR.SI($C$2:$C$${last};E2;$B$2:$B$${last})`]],
        answers: { 2: best, 3: bosses[ask] },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Claves que no existen: #N/A, "Sin datos" e investigar el error
  // ---------------------------------------------------------------------------
  C.register('m7_missing', (ctx) => {
    const r = ctx.rng;
    const k = ctx.size === 'large' ? 18 : ctx.size === 'medium' ? 14 : 10;
    const n = C.rowsFor(ctx, [14, 18], [28, 36], [48, 60]);
    const names = C.companies(r, k);
    const clients = names.map((name, i) => ({ code: 'C-' + (101 + i * 3), name, city: r.pick(CITIES) }));
    // Un código con la letra O en vez de un cero y un cliente nuevo que todavía no está cargado.
    const typoOf = r.pick(clients.filter((c) => c.code.includes('0')));
    const typo = typoOf.code.replace('0', 'O');
    const newCode = 'C-' + (101 + k * 3 + 6);
    const rows = [];
    for (let i = 0; i < n; i++) rows.push({ id: 'E-' + (5001 + i), code: r.pick(clients).code });
    const missIdx = r.sample([...Array(n).keys()], 3);
    rows[missIdx[0]].code = typo;
    rows[missIdx[1]].code = newCode;
    rows[missIdx[2]].code = newCode;
    const none = T('Sin datos', 'No data');
    const cityOf = (code) => {
      const c = clients.find((x) => x.code === code);
      return c ? c.city : none;
    };
    const missing = rows.filter((x) => cityOf(x.code) === none).length;
    const last = n + 1;
    const cs = T('Clientes', 'Customers');
    return {
      from: 'ramiro',
      dept: 'logistica',
      subject: T('¿A qué ciudad va cada envío?', 'Which city is each shipment going to?'),
      file: T('envios_clientes.xlsx', 'customer_shipments.xlsx'),
      email: T(
        `<p>Para armar las rutas necesito la <b>ciudad</b> de cada envío. Está en la hoja <b>${cs}</b>.</p>
         <p>Ojo: me parece que hay códigos que no existen. Si no encontrás el cliente, poné <b>"${none}"</b> y decime cuántos son.</p>`,
        `<p>To plan the routes I need the <b>city</b> of each shipment. It's in the <b>${cs}</b> sheet.</p>
         <p>Careful: I think some codes don't exist. If you can't find the customer, write <b>"${none}"</b> and tell me how many there are.</p>`
      ),
      sheets: [
        {
          name: T('Envíos', 'Shipments'),
          cols: 8,
          rows: n + 4,
          colWidths: [80, 90, 130, 30, 170, 80, 60, 60],
          data: { at: 'A1', rows: [[T('Envío', 'Shipment'), T('Cliente', 'Customer'), T('Ciudad', 'City')], ...rows.map((x) => [x.id, x.code])] },
          cells: { E2: T('Envíos sin cliente', 'Shipments without customer') },
          locked: ['A1:B' + last, 'C1', 'E2'],
          header: ['A1:C1'],
          labels: ['E2'],
          targets: ['C2:C' + last, 'F2'],
          start: 'C2',
        },
        {
          name: cs,
          cols: 4,
          rows: k + 3,
          colWidths: [80, 200, 130, 60],
          data: { at: 'A1', rows: [[T('Código', 'Code'), T('Razón social', 'Company'), T('Ciudad', 'City')], ...clients.map((c) => [c.code, c.name, c.city])] },
          locked: ['A1:D' + (k + 3)],
          header: ['A1:C1'],
        },
      ],
      objectives: [
        {
          text: T(`<b>Ciudad</b> de cada envío (C2:C${last}); si el cliente no existe, "${none}".`, `<b>City</b> of each shipment (C2:C${last}); if the customer doesn't exist, "${none}".`),
          hint: `=${fn('BUSCARX')}(B2; ${P(cs)}A:A; ${P(cs)}C:C; "${none}")`,
          check: V.column('C', 2, last, (row) => cityOf(rows[row - 2].code), { uses: ['BUSCARX', 'SI.ERROR'] }),
        },
        {
          text: T(`En F2, cuántos <b>envíos sin cliente</b> hay (CONTAR.SI).`, `In F2, how many <b>shipments without customer</b> there are (COUNTIF).`),
          hint: `=${fn('CONTAR.SI')}(C2:C${last}; "${none}")`,
          check: V.cell('F2', missing, { uses: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'] }),
        },
        {
          text: T('❓ Uno de los códigos no encontrados está <b>mal escrito</b> (tiene una letra O en lugar de un cero). ¿Cuál es?', '❓ One of the codes not found is <b>mistyped</b> (it has a letter O instead of a zero). Which one?'),
          placeholder: T('Código', 'Code'),
          hint: T(`Filtrá con la vista los "${none}" y compará esos códigos con la hoja ${cs}.`, `Look at the "${none}" rows and compare those codes with the ${cs} sheet.`),
          answer: (a) => V.norm(a).replace(/\s/g, '') === V.norm(typo),
        },
      ],
      tips: [
        T('#N/A no es un error tuyo: es la planilla diciéndote "esta clave no está". Investigalo.', '#N/A is not your mistake: it\'s the sheet telling you "this key isn\'t there". Investigate it.'),
        T(`El cuarto argumento de BUSCARX es lo que muestra si no encuentra: "${none}".`, `XLOOKUP's fourth argument is what it shows when nothing is found: "${none}".`),
      ],
      feedback: T('¡Bien visto lo del código mal escrito! Ya lo corregimos en el sistema y doy de alta al cliente nuevo.', 'Good catch on the mistyped code! We already fixed it in the system and I\'m registering the new customer.'),
      solution: {
        fill: [['C', 2, last, `=BUSCARX(B2;${P(cs)}A:A;${P(cs)}C:C;"${none}")`]],
        cells: { F2: `=CONTAR.SI(C2:C${last};"${none}")` },
        answers: { 2: typo },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // La clave no está en la primera columna: BUSCARX (o INDICE + COINCIDIR)
  // ---------------------------------------------------------------------------
  C.register('m7_left', (ctx) => {
    const r = ctx.rng;
    const k = ctx.size === 'large' ? 22 : ctx.size === 'medium' ? 16 : 10;
    const areas = AREAS.slice(0, 4).map(C.L2);
    let staff;
    let absences;
    let byArea;
    do {
      staff = C.people(r, k).map((name, i) => ({ name, area: areas[i % 4], id: 2000 + r.int(1, 9) * 100 + i * 7 }));
      absences = staff.map(() => r.int(0, 9));
      byArea = areas.map((a) => sum(staff.map((s, i) => (s.area === a ? absences[i] : 0))));
    } while (C.uniqueExtreme(absences) < 0 || C.uniqueExtreme(byArea) < 0);
    const order = r.shuffle(staff.map((_, i) => i));
    const last = k + 1;
    const ns = T('Nómina', 'Payroll');
    const top = staff[C.uniqueExtreme(absences)].name;
    const topArea = areas[C.uniqueExtreme(byArea)];
    return {
      from: 'paula',
      dept: 'rrhh',
      subject: T('Ausencias del mes: falta el nombre', "This month's absences: the name is missing"),
      file: T('ausencias_mes.xlsx', 'monthly_absences.xlsx'),
      email: T(
        `<p>El reloj de fichaje solo exporta el <b>legajo</b>. Necesito el <b>nombre</b> y el <b>área</b> de cada persona, que están en la hoja <b>${ns}</b>.</p>
         <p>Te aviso que en la nómina el legajo está en la <b>última</b> columna (así lo arma el sistema, no lo puedo cambiar).</p>`,
        `<p>The time clock only exports the <b>employee ID</b>. I need each person's <b>name</b> and <b>area</b>, which are in the <b>${ns}</b> sheet.</p>
         <p>Heads up: in the payroll the ID is in the <b>last</b> column (that's how the system builds it, I can't change it).</p>`
      ),
      sheets: [
        {
          name: T('Ausencias', 'Absences'),
          cols: 8,
          rows: k + 4,
          colWidths: [80, 100, 170, 130, 60, 60, 60, 60],
          data: { at: 'A1', rows: [[T('Legajo', 'ID'), T('Días ausente', 'Days absent'), T('Nombre', 'Name'), T('Área', 'Area')], ...order.map((i) => [staff[i].id, absences[i]])] },
          locked: ['A1:B' + last, 'C1:D1'],
          header: ['A1:D1'],
          targets: ['C2:D' + last],
          start: 'C2',
        },
        {
          name: ns,
          cols: 4,
          rows: k + 3,
          colWidths: [170, 130, 80, 60],
          data: { at: 'A1', rows: [[T('Nombre', 'Name'), T('Área', 'Area'), T('Legajo', 'ID')], ...staff.map((s) => [s.name, s.area, s.id])] },
          locked: ['A1:D' + (k + 3)],
          header: ['A1:C1'],
        },
      ],
      objectives: [
        {
          text: T(`<b>Nombre</b> de cada persona (C2:C${last}). BUSCARV no sirve: la clave está a la derecha.`, `<b>Name</b> of each person (C2:C${last}). VLOOKUP won't work: the key is on the right.`),
          hint: `=${fn('BUSCARX')}(A2; ${P(ns)}C:C; ${P(ns)}A:A)`,
          check: V.column('C', 2, last, (row) => staff[order[row - 2]].name, { uses: ['BUSCARX', 'INDICE'] }),
        },
        {
          text: T(`<b>Área</b> de cada persona (D2:D${last}).`, `<b>Area</b> of each person (D2:D${last}).`),
          hint: `=${fn('BUSCARX')}(A2; ${P(ns)}C:C; ${P(ns)}B:B)`,
          check: V.column('D', 2, last, (row) => staff[order[row - 2]].area, { uses: ['BUSCARX', 'INDICE'] }),
        },
        {
          text: T('❓ ¿Quién tuvo <b>más días de ausencia</b>?', '❓ Who had the <b>most days absent</b>?'),
          placeholder: T('Nombre', 'Name'),
          hint: T('Mirá el máximo de la columna B.', 'Look at the maximum of column B.'),
          answer: V.answerText([top]),
        },
        {
          text: T('❓ ¿Qué <b>área</b> suma más días de ausencia?', '❓ Which <b>area</b> adds up the most days absent?'),
          placeholder: T('Área', 'Area'),
          hint: T(`En celdas libres: =SUMAR.SI(D2:D${last}; "${areas[0]}"; B2:B${last}) y lo mismo para cada área.`, `In free cells: =SUMIF(D2:D${last}, "${areas[0]}", B2:B${last}) and the same for each area.`),
          answer: V.answerText([topArea]),
        },
      ],
      tips: [
        T('BUSCARX(valor; dónde buscar; qué devolver): el rango de resultado puede estar a la izquierda.', 'XLOOKUP(value, where to look, what to return): the result range can be on the left.'),
        T('Alternativa clásica: =INDICE(Nómina!A:A; COINCIDIR(A2; Nómina!C:C; 0)).', 'Classic alternative: =INDEX(Payroll!A:A, MATCH(A2, Payroll!C:C, 0)).'),
      ],
      feedback: T('¡Gracias! Con esto ya puedo hablar con cada jefe de área.', 'Thanks! With this I can talk to each area manager.'),
      solution: {
        fill: [['C', 2, last, `=BUSCARX(A2;${P(ns)}C:C;${P(ns)}A:A)`], ['D', 2, last, `=BUSCARX(A2;${P(ns)}C:C;${P(ns)}B:B)`]],
        answers: { 2: top, 3: topArea },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Tramos de comisión: BUSCARV con coincidencia aproximada
  // ---------------------------------------------------------------------------
  C.register('m7_tiers', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [10, 14], [20, 28], [36, 48]);
    const tiers = [[0, 0.01], [20000, 0.02], [50000, 0.035], [100000, 0.05]];
    const rateFor = (v) => tiers.filter((t) => v >= t[0]).pop()[1];
    const sellers = C.people(r, n);
    const sales = sellers.map(() => r.step(5000, 160000, 500));
    // Casos justo en el límite de un tramo, para practicar el ">=".
    sales[r.int(0, n - 1)] = 50000;
    sales[r.int(0, n - 1)] = 20000;
    if (!sales.some((v) => v >= 100000)) sales[0] = 120000;
    const comm = sales.map((v) => v * rateFor(v));
    const top = sales.filter((v) => v >= 100000).length;
    const last = n + 1;
    const ts = T('Tramos', 'Brackets');
    return {
      from: 'julia',
      dept: 'finanzas',
      subject: T('Comisiones del mes por tramos', 'Monthly commissions by bracket'),
      file: T('comisiones_mes.xlsx', 'monthly_commissions.xlsx'),
      email: T(
        `<p>Hay que liquidar las comisiones. El porcentaje depende del <b>tramo</b> de ventas de cada vendedor (hoja <b>${ts}</b>): por ejemplo, desde $50.000 se cobra 3,5%.</p>
         <p>Necesito el <b>%</b> y la <b>comisión en $</b> de cada uno, y el total a pagar.</p>`,
        `<p>We have to pay commissions. The percentage depends on each seller's sales <b>bracket</b> (<b>${ts}</b> sheet): for example, from $50,000 they get 3.5%.</p>
         <p>I need each seller's <b>%</b> and <b>commission in $</b>, and the total to pay.</p>`
      ),
      sheets: [
        {
          name: T('Comisiones', 'Commissions'),
          cols: 7,
          rows: n + 4,
          colWidths: [170, 110, 100, 120, 60, 60, 60],
          data: { at: 'A1', rows: [[T('Vendedor', 'Seller'), T('Ventas', 'Sales'), T('% comisión', 'Commission %'), T('Comisión', 'Commission')], ...sellers.map((s, i) => [s, sales[i]])] },
          locked: ['A1:B' + last, 'C1:D1'],
          header: ['A1:D1'],
          targets: ['C2:D' + last],
          formats: { B: 'currency', C: 'percent', D: 'currency' },
          start: 'C2',
        },
        {
          name: ts,
          cols: 3,
          rows: 7,
          colWidths: [110, 90, 60],
          data: { at: 'A1', rows: [[T('Desde', 'From'), '%'], ...tiers] },
          locked: ['A1:C7'],
          header: ['A1:B1'],
          formats: { A: 'currency', B: 'percent' },
        },
      ],
      objectives: [
        {
          text: T(`<b>% de comisión</b> (C2:C${last}) según el tramo, con BUSCARV aproximado.`, `<b>Commission %</b> (C2:C${last}) by bracket, with an approximate VLOOKUP.`),
          hint: `=${fn('BUSCARV')}(B2; ${P(ts)}$A$2:$B$5; 2; ${T('VERDADERO', 'TRUE')})`,
          check: V.column('C', 2, last, (row) => rateFor(sales[row - 2]), { uses: ['BUSCARV'], tol: 1e-9 }),
        },
        {
          text: T(`<b>Comisión en $</b> (D2:D${last}) = ventas × %.`, `<b>Commission in $</b> (D2:D${last}) = sales × %.`),
          hint: '=B2*C2',
          check: V.column('D', 2, last, (row) => comm[row - 2], { refsFn: (row) => ['B' + row, 'C' + row] }),
        },
        {
          text: T('❓ ¿Cuánto hay que pagar <b>en total</b> de comisiones?', '❓ How much is the <b>total</b> commission payout?'),
          placeholder: T('Un monto', 'An amount'),
          hint: T(`=SUMA(D2:D${last})`, `=SUM(D2:D${last})`),
          answer: V.answerNumber(sum(comm), 0.01),
        },
        {
          text: T('❓ ¿Cuántos vendedores llegaron al <b>tramo más alto</b> (5%)?', '❓ How many sellers reached the <b>top bracket</b> (5%)?'),
          placeholder: T('Cantidad', 'Count'),
          hint: T(`=CONTAR.SI(C2:C${last}; 5%)`, `=COUNTIF(C2:C${last}, 5%)`),
          answer: V.answerNumber(top, 0),
        },
      ],
      tips: [
        T('VERDADERO = "buscá el tramo": el mayor "Desde" que no supera las ventas.', 'TRUE = "find the bracket": the largest "From" that does not exceed the sales.'),
        T('Fijate el que vendió exactamente $50.000: tiene que caer en 3,5%.', 'Check the one who sold exactly $50,000: they must fall in 3.5%.'),
      ],
      feedback: T('Liquidación lista y sin errores. Antes lo hacíamos con SI anidados de tres pisos. 😅', 'Payout ready and error-free. We used to do this with three-level nested IFs. 😅'),
      solution: {
        fill: [['C', 2, last, `=BUSCARV(B2;${P(ts)}$A$2:$B$5;2;VERDADERO)`], ['D', 2, last, '=B2*C2']],
        answers: { 2: String(sum(comm)), 3: String(top) },
      },
    };
  });
})();
