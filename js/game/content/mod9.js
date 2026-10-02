/*
 * Analyst Adventure — Nivel 9 (etapa Junior): tablas dinámicas.
 * Resumir miles de filas sin fórmulas: Filas, Columnas, Valores (Suma, Recuento, Promedio…),
 * Filtros y "% del total".
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const C = AA.Content;
  const Pv = AA.Pivot;
  const T = (es, en) => AA.T(es, en);
  const { REGIONS, CATEGORIES, CARRIERS, PRODUCTS } = C.DATA;
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  // Un objetivo que solo se evalúa cuando el anterior ya está cumplido (evita notas repetidas).
  const after = (prev, check) => (S) => (prev(S) === true ? check(S) : false);

  C.module({
    id: 'mod9',
    title: { es: 'Tablas dinámicas', en: 'Pivot tables' },
    xp: 120,
    tier: 1,
    skills: ['pivotWhat', 'pivotValues', 'pivotCross', 'pivotFilter'],
    templates: ['m9_sellers', 'm9_tickets', 'm9_cross', 'm9_avg', 'm9_share'],
    seeds: [901, 902, 903, 904, 905],
    intro: {
      es: 'Si hay una herramienta que aparece en <b>todas</b> las búsquedas de Junior, es esta: la <b>tabla dinámica</b>. Resume miles de filas en segundos, sin escribir una sola fórmula.',
      en: 'If there is one tool that shows up in <b>every</b> Junior job posting, it\'s this one: the <b>pivot table</b>. It summarizes thousands of rows in seconds, without writing a single formula.',
    },
    skillDefs: {
      pivotWhat: {
        title: { es: 'Qué es una tabla dinámica', en: 'What a pivot table is' },
        say: {
          es: 'Una tabla dinámica agrupa y resume. Tiene cuatro áreas: <b>Filas</b> (una fila por cada valor, por ejemplo cada vendedor), <b>Columnas</b> (opcional, cruza con otra dimensión), <b>Valores</b> (qué número resumir) y <b>Filtros</b> (qué datos incluir).',
          en: 'A pivot table groups and summarizes. It has four areas: <b>Rows</b> (one row per value, e.g. each seller), <b>Columns</b> (optional, crosses with another dimension), <b>Values</b> (which number to summarize) and <b>Filters</b> (which data to include).',
        },
        tip: { es: 'En Excel: Insertar → Tabla dinámica. En Google Sheets: Insertar → Tabla dinámica. Mismas cuatro áreas.', en: 'In Excel: Insert → PivotTable. In Google Sheets: Insert → Pivot table. Same four areas.' },
      },
      pivotValues: {
        title: { es: 'Suma, Recuento o Promedio', en: 'Sum, Count or Average' },
        say: {
          es: '<b>Suma</b> para totales (ventas, horas). <b>Recuento</b> para "cuántos" (tickets, pedidos): cuenta filas, sirve con cualquier campo. <b>Promedio</b> para valores típicos (tiempo de entrega, ticket promedio). Elegir mal la agregación es el error más común.',
          en: '<b>Sum</b> for totals (sales, hours). <b>Count</b> for "how many" (tickets, orders): it counts rows and works with any field. <b>Average</b> for typical values (delivery time, average ticket). Picking the wrong aggregation is the most common mistake.',
        },
        tip: { es: 'Si el número que ves "es demasiado grande", fijate si no estás sumando algo que había que promediar.', en: 'If the number looks "too big", check you are not summing something that should be averaged.' },
      },
      pivotCross: {
        title: { es: 'Cruzar dos dimensiones', en: 'Crossing two dimensions' },
        say: {
          es: 'Con un campo en Filas y otro en <b>Columnas</b> obtenés una matriz: por ejemplo regiones × trimestres. Los totales generales aparecen al final de cada fila y columna.',
          en: 'With one field in Rows and another in <b>Columns</b> you get a matrix: for example regions × quarters. Grand totals appear at the end of each row and column.',
        },
        tip: { es: 'Más de 8-10 columnas ya no se lee: elegí la dimensión con menos valores para Columnas.', en: 'More than 8-10 columns is unreadable: put the dimension with fewer values in Columns.' },
      },
      pivotFilter: {
        title: { es: 'Filtros y % del total', en: 'Filters and % of total' },
        say: {
          es: 'El área <b>Filtros</b> deja afuera lo que no querés analizar (por ejemplo, solo un transportista). "Mostrar valores como <b>% del total general</b>" convierte cada número en su participación: ideal para preguntas como "¿qué parte de las ventas viene de Online?".',
          en: 'The <b>Filters</b> area leaves out what you don\'t want to analyze (for example, just one carrier). "Show values as <b>% of grand total</b>" turns each number into its share: perfect for questions like "what part of sales comes from Online?".',
        },
        tip: { es: 'Siempre mirá cuántos registros quedaron incluidos después de filtrar.', en: 'Always check how many records remain after filtering.' },
      },
    },
  });

  const fieldsTip = () => T('Hacé clic en un campo para mandarlo a un área, o arrastralo.', 'Click a field to send it to an area, or drag it.');

  // ---------------------------------------------------------------------------
  // Ventas por vendedor (Suma, ordenado)
  // ---------------------------------------------------------------------------
  C.register('m9_sellers', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [40, 60], [90, 130], [160, 220]);
    const sellers = C.people(r, ctx.size === 'small' ? 6 : 9);
    const regs = REGIONS.slice(0, 4).map(C.L2);
    let rows;
    let totals;
    do {
      const skill = sellers.map(() => 0.6 + r.next());
      rows = Array.from({ length: n }, () => {
        const s = r.int(0, sellers.length - 1);
        return [`2024-0${r.int(1, 6)}-${String(r.int(1, 28)).padStart(2, '0')}`, sellers[s], r.pick(regs), Math.round(r.step(500, 9000, 50) * skill[s])];
      });
      totals = sellers.map((s) => sum(rows.filter((x) => x[1] === s).map((x) => x[3])));
    } while (C.uniqueExtreme(totals) < 0 || C.uniqueExtreme(totals, true) < 0);
    const H = { date: T('Fecha', 'Date'), who: T('Vendedor', 'Seller'), reg: T('Región', 'Region'), amt: T('Monto', 'Amount') };
    const top = C.uniqueExtreme(totals);
    const low = C.uniqueExtreme(totals, true);
    const base = Pv.expect({ rows: H.who, columns: null, value: H.amt, aggs: ['SUM'] });
    return {
      from: 'bruno',
      dept: 'ventas',
      subject: T('Ranking de vendedores del semestre', 'Seller ranking for the semester'),
      file: T('ventas_semestre.xlsx', 'semester_sales.xlsx'),
      email: T(
        `<p>Necesito el <b>total vendido por cada vendedor</b> en el semestre, ordenado de mayor a menor, para entregar los premios.</p><p>Son ${n} ventas: no lo hagas a mano, usá una tabla dinámica.</p>`,
        `<p>I need the <b>total sold by each seller</b> this semester, sorted from largest to smallest, to hand out the awards.</p><p>There are ${n} sales: don't do it by hand, use a pivot table.</p>`
      ),
      pivot: { table: C.table([H.date, H.who, H.reg, H.amt], rows), money: [H.amt] },
      objectives: [
        {
          text: T(`Tabla dinámica: <b>${H.who}</b> en Filas y <b>Suma de ${H.amt}</b> en Valores.`, `Pivot table: <b>${H.who}</b> in Rows and <b>Sum of ${H.amt}</b> in Values.`),
          hint: fieldsTip(),
          check: base,
        },
        {
          text: T('Ordená las filas de <b>mayor a menor</b>.', 'Sort the rows from <b>largest to smallest</b>.'),
          hint: T('"Ordenar filas" → "Total: mayor a menor".', '"Sort rows" → "Total: largest first".'),
          check: after(base, Pv.expect({ rows: H.who, value: H.amt, aggs: ['SUM'], sort: 'desc' })),
        },
        {
          text: T('❓ ¿Quién <b>vendió más</b>?', '❓ Who <b>sold the most</b>?'),
          placeholder: T('Nombre', 'Name'),
          hint: T('La primera fila después de ordenar.', 'The first row after sorting.'),
          answer: AA.V.answerText([sellers[top]]),
        },
        {
          text: T('❓ ¿Cuánto vendió quien <b>quedó último</b>?', '❓ How much did the <b>last</b> seller sell?'),
          placeholder: T('Un monto', 'An amount'),
          hint: T('La última fila antes del total general.', 'The last row before the grand total.'),
          answer: AA.V.answerNumber(totals[low], 0.5),
        },
      ],
      tips: [T('Valores con un número → Suma por defecto.', 'A number in Values → Sum by default.'), T('El total general tiene que coincidir con la suma de toda la columna Monto.', 'The grand total must match the sum of the whole Amount column.')],
      feedback: T('¡Premios entregados! Y el ranking quedó para el próximo semestre.', 'Awards handed out! And the ranking is ready for next semester.'),
      solution: { pivot: { rows: H.who, columns: null, value: { field: H.amt, agg: 'SUM' }, filter: null, show: 'value', sort: 'desc' }, answers: { 2: sellers[top], 3: String(totals[low]) } },
    };
  });

  // ---------------------------------------------------------------------------
  // Tickets por categoría (Recuento)
  // ---------------------------------------------------------------------------
  C.register('m9_tickets', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [40, 60], [90, 130], [160, 220]);
    const cats = [['Facturación', 'Billing'], ['Envíos', 'Shipping'], ['Producto roto', 'Broken product'], ['Devoluciones', 'Returns'], ['Cuenta', 'Account']].map(C.L2);
    const chans = [['Teléfono', 'Phone'], ['Chat', 'Chat'], ['Email', 'Email']].map(C.L2);
    let rows;
    let counts;
    let byChan;
    do {
      const w = cats.map(() => r.next());
      rows = Array.from({ length: n }, (_, i) => {
        let pick = r.next() * sum(w);
        let c = 0;
        while (pick > w[c]) pick -= w[c++];
        return ['T-' + (4001 + i), cats[Math.min(c, cats.length - 1)], r.pick(chans), r.int(1, 72)];
      });
      counts = cats.map((c) => rows.filter((x) => x[1] === c).length);
      byChan = chans.map((c) => rows.filter((x) => x[2] === c).length);
    } while (C.uniqueExtreme(counts) < 0 || C.uniqueExtreme(byChan) < 0);
    const H = { id: 'Ticket', cat: T('Categoría', 'Category'), ch: T('Canal', 'Channel'), hrs: T('Horas hasta resolver', 'Hours to resolve') };
    const top = C.uniqueExtreme(counts);
    const base = Pv.expect({ rows: H.cat, columns: null, aggs: ['COUNT'] });
    return {
      from: 'sofi',
      dept: 'data',
      subject: T('¿De qué se quejan los clientes?', 'What are customers complaining about?'),
      file: T('tickets_soporte.xlsx', 'support_tickets.xlsx'),
      email: T(
        `<p>Atención al cliente quiere saber <b>cuántos tickets hubo de cada categoría</b> para decidir dónde poner más gente.</p><p>Ojo: no es una suma de horas, es <b>contar tickets</b>.</p>`,
        `<p>Customer care wants to know <b>how many tickets there were in each category</b> to decide where to add people.</p><p>Careful: it's not a sum of hours, it's <b>counting tickets</b>.</p>`
      ),
      pivot: { table: C.table([H.id, H.cat, H.ch, H.hrs], rows) },
      objectives: [
        {
          text: T(`<b>${H.cat}</b> en Filas y la <b>cantidad de tickets</b> (Recuento) en Valores.`, `<b>${H.cat}</b> in Rows and the <b>number of tickets</b> (Count) in Values.`),
          hint: T(`Mandá ${H.id} (o cualquier campo) a Valores y elegí "Recuento".`, `Send ${H.id} (or any field) to Values and choose "Count".`),
          check: base,
        },
        {
          text: T('❓ ¿Qué categoría tiene <b>más tickets</b>?', '❓ Which category has the <b>most tickets</b>?'),
          placeholder: T('Categoría', 'Category'),
          hint: T('Ordená de mayor a menor si no se ve fácil.', 'Sort from largest to smallest if it is not obvious.'),
          answer: AA.V.answerText([cats[top]]),
        },
        {
          text: T(`❓ ¿Cuántos tickets de esa categoría hubo?`, '❓ How many tickets did that category have?'),
          placeholder: T('Cantidad', 'Count'),
          hint: T('El número de esa fila.', 'The number in that row.'),
          answer: AA.V.answerNumber(counts[top], 0),
        },
        {
          text: T(`❓ Cambiá la tabla: ¿por qué <b>${H.ch.toLowerCase()}</b> entran más tickets?`, `❓ Change the table: through which <b>${H.ch.toLowerCase()}</b> do most tickets come in?`),
          placeholder: T('Canal', 'Channel'),
          hint: T(`Poné ${H.ch} en Filas en lugar de ${H.cat}.`, `Put ${H.ch} in Rows instead of ${H.cat}.`),
          answer: AA.V.answerText([chans[C.uniqueExtreme(byChan)]]),
        },
      ],
      tips: [T('Recuento cuenta filas: da igual qué campo uses en Valores.', 'Count counts rows: it doesn\'t matter which field you use in Values.'), T('Una tabla dinámica se reorganiza en segundos: probá distintas combinaciones.', 'A pivot table rearranges in seconds: try different combinations.')],
      feedback: T('Ya tenemos el dato para reforzar el equipo. ¡Gracias!', 'We have the data to reinforce the team. Thanks!'),
      solution: { pivot: { rows: H.cat, columns: null, value: { field: H.id, agg: 'COUNT' }, filter: null, show: 'value', sort: 'none' }, answers: { 1: cats[top], 2: String(counts[top]), 3: chans[C.uniqueExtreme(byChan)] } },
    };
  });

  // ---------------------------------------------------------------------------
  // Región × trimestre (Filas y Columnas)
  // ---------------------------------------------------------------------------
  C.register('m9_cross', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [50, 70], [100, 140], [180, 240]);
    const regs = REGIONS.map(C.L2);
    const qs = ['Q1', 'Q2', 'Q3', 'Q4'];
    let rows;
    let cell;
    let qTot;
    do {
      rows = Array.from({ length: n }, () => [r.pick(regs), r.pick(qs), C.L2(r.pick(CATEGORIES.slice(0, 4))), r.step(1000, 20000, 100)]);
      rows.sort((a, b) => qs.indexOf(a[1]) - qs.indexOf(b[1]));
      cell = regs.map((g) => qs.map((q) => sum(rows.filter((x) => x[0] === g && x[1] === q).map((x) => x[3]))));
      qTot = qs.map((q, j) => sum(regs.map((_, i) => cell[i][j])));
    } while (C.uniqueExtreme(cell.flat()) < 0 || C.uniqueExtreme(qTot) < 0 || cell.flat().some((v) => !v));
    const H = { reg: T('Región', 'Region'), q: T('Trimestre', 'Quarter'), cat: T('Categoría', 'Category'), amt: T('Ventas', 'Sales') };
    const k = C.uniqueExtreme(cell.flat());
    const bestReg = regs[Math.floor(k / 4)];
    const bestQ = qs[k % 4];
    const askReg = r.int(0, regs.length - 1);
    const askQ = r.int(0, 3);
    const base = Pv.expect({ rows: H.reg, columns: H.q, value: H.amt, aggs: ['SUM'] });
    return {
      from: 'julia',
      dept: 'finanzas',
      subject: T('Ventas por región y trimestre', 'Sales by region and quarter'),
      file: T('ventas_anuales.xlsx', 'annual_sales.xlsx'),
      email: T(
        `<p>Para el presupuesto del año que viene necesito ver las ventas <b>por región y por trimestre</b> en una misma tabla: regiones en filas, trimestres en columnas.</p>`,
        `<p>For next year's budget I need to see sales <b>by region and by quarter</b> in one table: regions in rows, quarters in columns.</p>`
      ),
      pivot: { table: C.table([H.reg, H.q, H.cat, H.amt], rows), money: [H.amt] },
      objectives: [
        {
          text: T(`<b>${H.reg}</b> en Filas, <b>${H.q}</b> en Columnas y <b>Suma de ${H.amt}</b> en Valores.`, `<b>${H.reg}</b> in Rows, <b>${H.q}</b> in Columns and <b>Sum of ${H.amt}</b> in Values.`),
          hint: fieldsTip(),
          check: base,
        },
        {
          text: T(`❓ ¿Cuánto vendió <b>${regs[askReg]}</b> en el <b>${qs[askQ]}</b>?`, `❓ How much did <b>${regs[askReg]}</b> sell in <b>${qs[askQ]}</b>?`),
          placeholder: T('Un monto', 'An amount'),
          hint: T('Cruce de esa fila con esa columna.', 'Where that row meets that column.'),
          answer: AA.V.answerNumber(cell[askReg][askQ], 0.5),
        },
        {
          text: T('❓ ¿Qué <b>trimestre</b> fue el mejor del año (total general)?', '❓ Which <b>quarter</b> was the best of the year (grand total)?'),
          placeholder: 'Q1, Q2…',
          hint: T('Mirá la fila "Total general".', 'Look at the "Grand total" row.'),
          answer: AA.V.answerText([qs[C.uniqueExtreme(qTot)]]),
        },
        {
          text: T('❓ ¿Qué combinación región + trimestre tuvo la venta más alta? Respondé la <b>región</b>.', '❓ Which region + quarter combination had the highest sales? Answer the <b>region</b>.'),
          placeholder: T('Región', 'Region'),
          hint: T('Buscá el número más grande de la matriz (sin contar los totales).', 'Find the largest number in the matrix (excluding totals).'),
          answer: AA.V.answerText([bestReg]),
        },
      ],
      tips: [T('Trimestres en Columnas: son pocos (4), así la tabla se lee bien.', 'Quarters in Columns: there are few (4), so the table reads well.'), T('Leé la matriz como un mapa de calor: buscá el número más alto de cada fila y de cada columna.', 'Read the matrix like a heat map: find the highest number in each row and column.')],
      feedback: T(`Clarísimo. Ya vi que ${bestReg} en ${bestQ} fue el pico: lo uso para el presupuesto.`, `Crystal clear. I saw ${bestReg} in ${bestQ} was the peak: I'll use it for the budget.`),
      solution: { pivot: { rows: H.reg, columns: H.q, value: { field: H.amt, agg: 'SUM' }, filter: null, show: 'value', sort: 'none' }, answers: { 1: String(cell[askReg][askQ]), 2: qs[C.uniqueExtreme(qTot)], 3: bestReg } },
    };
  });

  // ---------------------------------------------------------------------------
  // Promedio con filtro (días de entrega por zona, un transportista)
  // ---------------------------------------------------------------------------
  C.register('m9_avg', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [50, 70], [100, 140], [180, 240]);
    const carriers = r.sample(CARRIERS, 3);
    const regs = REGIONS.slice(0, 4).map(C.L2);
    const focus = carriers[r.int(0, 2)];
    let rows;
    let avg;
    do {
      const slow = regs.map(() => 1 + r.int(0, 4));
      rows = Array.from({ length: n }, (_, i) => {
        const g = r.int(0, regs.length - 1);
        const c = r.pick(carriers);
        return ['E-' + (8001 + i), c, regs[g], r.int(1, 3) + slow[g] + (c === focus ? r.int(0, 3) : 0), r.step(900, 4000, 10)];
      });
      avg = regs.map((g) => {
        const v = rows.filter((x) => x[1] === focus && x[2] === g).map((x) => x[3]);
        return v.length ? sum(v) / v.length : 0;
      });
    } while (C.uniqueExtreme(avg) < 0 || avg.some((v) => !v));
    const H = { id: T('Envío', 'Shipment'), car: T('Transportista', 'Carrier'), reg: T('Zona', 'Zone'), days: T('Días de entrega', 'Delivery days'), cost: T('Costo', 'Cost') };
    const worst = C.uniqueExtreme(avg);
    const base = Pv.expect({ rows: H.reg, columns: null, value: H.days, aggs: ['AVG'] });
    return {
      from: 'ramiro',
      dept: 'logistica',
      subject: T(`¿Cuánto tarda ${focus} en cada zona?`, `How long does ${focus} take in each zone?`),
      file: T('entregas.xlsx', 'deliveries.xlsx'),
      email: T(
        `<p>Mañana me reúno con <b>${focus}</b>. Necesito el <b>promedio de días de entrega por zona</b>, solo de sus envíos.</p>`,
        `<p>Tomorrow I'm meeting <b>${focus}</b>. I need the <b>average delivery days per zone</b>, only for their shipments.</p>`
      ),
      pivot: { table: C.table([H.id, H.car, H.reg, H.days, H.cost], rows), money: [H.cost] },
      objectives: [
        {
          text: T(`<b>${H.reg}</b> en Filas y <b>Promedio de ${H.days}</b> en Valores.`, `<b>${H.reg}</b> in Rows and <b>Average of ${H.days}</b> in Values.`),
          hint: T('Cambiá "Suma" por "Promedio" en la píldora de Valores.', 'Change "Sum" to "Average" in the Values pill.'),
          check: base,
        },
        {
          text: T(`Filtro: solo los envíos de <b>${focus}</b>.`, `Filter: only <b>${focus}</b> shipments.`),
          hint: T(`Mandá ${H.car} a Filtros y dejá tildado solo ${focus}.`, `Send ${H.car} to Filters and leave only ${focus} checked.`),
          check: after(base, Pv.expect({ rows: H.reg, value: H.days, aggs: ['AVG'], filter: { field: H.car, values: [focus] } })),
        },
        {
          text: T(`❓ ¿En qué zona <b>${focus}</b> tarda más en promedio?`, `❓ In which zone is <b>${focus}</b> slowest on average?`),
          placeholder: T('Zona', 'Zone'),
          hint: T('El promedio más alto con el filtro puesto.', 'The highest average with the filter on.'),
          answer: AA.V.answerText([regs[worst]]),
        },
        {
          text: T('❓ ¿Cuántos días tarda ahí? (con un decimal)', '❓ How many days does it take there? (one decimal)'),
          placeholder: T('Días', 'Days'),
          hint: T('El valor de esa fila.', 'The value in that row.'),
          answer: AA.V.answerNumber(avg[worst], 0.06),
        },
      ],
      tips: [T('Días de entrega se promedia: sumarlos no significa nada.', 'Delivery days are averaged: summing them means nothing.'), T('Mirá abajo cuántos registros quedaron con el filtro.', 'Check below how many records remain with the filter.')],
      feedback: T('Con esto llego a la reunión con datos, no con quejas. 💪', "With this I go into the meeting with data, not complaints. 💪"),
      solution: { pivot: { rows: H.reg, columns: null, value: { field: H.days, agg: 'AVG' }, filter: { field: H.car, values: [focus] }, show: 'value', sort: 'none' }, answers: { 2: regs[worst], 3: String(avg[worst]) } },
    };
  });

  // ---------------------------------------------------------------------------
  // Participación de cada canal (% del total general)
  // ---------------------------------------------------------------------------
  C.register('m9_share', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [40, 60], [90, 130], [160, 220]);
    const chans = [['Tienda', 'Store'], ['Online', 'Online'], ['Mayorista', 'Wholesale'], ['Marketplace', 'Marketplace']].map(C.L2);
    const prods = r.sample(PRODUCTS, 6).map(C.L2);
    let rows;
    let tot;
    do {
      const w = chans.map(() => 0.4 + r.next());
      rows = Array.from({ length: n }, () => {
        const c = r.int(0, chans.length - 1);
        return [chans[c], r.pick(prods), Math.round(r.step(200, 6000, 10) * w[c])];
      });
      tot = chans.map((c) => sum(rows.filter((x) => x[0] === c).map((x) => x[2])));
    } while (C.uniqueExtreme(tot) < 0 || tot.some((v) => !v));
    const all = sum(tot);
    const ask = r.int(0, chans.length - 1);
    const H = { ch: T('Canal', 'Channel'), prod: T('Producto', 'Product'), rev: T('Facturación', 'Revenue') };
    const base = Pv.expect({ rows: H.ch, columns: null, value: H.rev, aggs: ['SUM'] });
    return {
      from: 'tomas',
      dept: 'marketing',
      subject: T('¿Qué parte de la facturación viene de cada canal?', 'What share of revenue comes from each channel?'),
      file: T('facturacion_canales.xlsx', 'channel_revenue.xlsx'),
      email: T(
        '<p>Para el plan de marketing necesito la <b>participación de cada canal</b> en la facturación: no los pesos, el <b>porcentaje del total</b>.</p>',
        '<p>For the marketing plan I need each channel\'s <b>share</b> of revenue: not the dollars, the <b>percentage of the total</b>.</p>'
      ),
      pivot: { table: C.table([H.ch, H.prod, H.rev], rows), money: [H.rev] },
      objectives: [
        {
          text: T(`<b>${H.ch}</b> en Filas y <b>Suma de ${H.rev}</b> en Valores.`, `<b>${H.ch}</b> in Rows and <b>Sum of ${H.rev}</b> in Values.`),
          hint: fieldsTip(),
          check: base,
        },
        {
          text: T('Mostrá los valores como <b>% del total general</b>.', 'Show the values as <b>% of grand total</b>.'),
          hint: T('"Mostrar valores como" → "% del total general".', '"Show values as" → "% of grand total".'),
          check: after(base, Pv.expect({ rows: H.ch, value: H.rev, aggs: ['SUM'], show: 'pct' })),
        },
        {
          text: T(`❓ ¿Qué porcentaje de la facturación viene de <b>${chans[ask]}</b>? (con un decimal)`, `❓ What percentage of revenue comes from <b>${chans[ask]}</b>? (one decimal)`),
          placeholder: '%',
          hint: T('Leelo de la tabla con el %.', 'Read it from the table with %.'),
          answer: (a) => AA.V.answerNumber((tot[ask] / all) * 100, 0.06)(String(a).replace('%', '')),
        },
        {
          text: T('❓ ¿Qué canal tiene la <b>mayor participación</b>?', '❓ Which channel has the <b>largest share</b>?'),
          placeholder: T('Canal', 'Channel'),
          hint: T('El porcentaje más alto.', 'The highest percentage.'),
          answer: AA.V.answerText([chans[C.uniqueExtreme(tot)]]),
        },
      ],
      tips: [T('El total general con % siempre da 100%.', 'The grand total in % always equals 100%.'), T('Participación = parte ÷ total: comparar porcentajes es más fácil que comparar millones.', 'Share = part ÷ total: comparing percentages is easier than comparing millions.')],
      feedback: T('¡Justo lo que necesitaba para repartir el presupuesto de campañas!', 'Exactly what I needed to split the campaign budget!'),
      solution: { pivot: { rows: H.ch, columns: null, value: { field: H.rev, agg: 'SUM' }, filter: null, show: 'pct', sort: 'none' }, answers: { 2: String(Math.round((tot[ask] / all) * 1000) / 10), 3: chans[C.uniqueExtreme(tot)] } },
    };
  });
})();
