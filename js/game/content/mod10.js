/*
 * Analyst Adventure — Nivel 10 (etapa Junior): SQL básico.
 * SELECT, WHERE, ORDER BY + LIMIT, funciones de resumen, GROUP BY + HAVING y JOIN.
 * Los resultados esperados se calculan en JavaScript (independientes del motor SQL).
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const C = AA.Content;
  const V = AA.V;
  const T = (es, en) => AA.T(es, en);
  const { REGIONS, CARRIERS, PRODUCTS } = C.DATA;
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const avg = (a) => (a.length ? sum(a) / a.length : null);
  const CITIES = ['Rosario', 'Mendoza', 'Salta', 'La Plata', 'Santa Fe', 'Tandil', 'Posadas', 'Corrientes'];
  const day = (start, i) => {
    const d = new Date(Date.UTC(2024, start, 1 + i));
    return d.toISOString().slice(0, 10);
  };

  C.module({
    id: 'mod10',
    title: { es: 'SQL básico', en: 'Basic SQL' },
    xp: 130,
    tier: 1,
    skills: ['sqlWhat', 'sqlSelect', 'sqlWhere', 'sqlOrder', 'sqlGroup', 'sqlJoin'],
    templates: ['m10_select', 'm10_top', 'm10_agg', 'm10_group', 'm10_join'],
    seeds: [1001, 1002, 1003, 1004, 1005],
    intro: {
      es: 'Las planillas tienen un límite: cuando los datos son millones de filas, viven en una <b>base de datos</b>. Y a las bases se les pregunta en <b>SQL</b>. Tranqui: es casi inglés, y lo que ya sabés de planillas te sirve un montón.',
      en: 'Spreadsheets have a limit: when data is millions of rows, it lives in a <b>database</b>. And you ask databases questions in <b>SQL</b>. Relax: it\'s almost plain English, and what you know about spreadsheets helps a lot.',
    },
    skillDefs: {
      sqlWhat: {
        title: { es: 'Qué es SQL', en: 'What SQL is' },
        say: {
          es: 'Una base de datos tiene <b>tablas</b> (como hojas) con <b>columnas</b> y <b>filas</b>. Con SQL escribís una <b>consulta</b> que describe qué datos querés, y la base te devuelve una tabla con el resultado. No modifica nada: solo lee.',
          en: 'A database has <b>tables</b> (like sheets) with <b>columns</b> and <b>rows</b>. With SQL you write a <b>query</b> describing the data you want, and the database returns a table with the result. It changes nothing: it only reads.',
        },
        tip: { es: 'Ejecutá con Ctrl+Enter. El 👁 al lado de cada tabla muestra sus primeras filas.', en: 'Run with Ctrl+Enter. The 👁 next to each table shows its first rows.' },
      },
      sqlSelect: {
        title: { es: 'SELECT y FROM', en: 'SELECT and FROM' },
        say: {
          es: '<code>SELECT</code> elige las columnas y <code>FROM</code> la tabla. <code>*</code> trae todas. <code>LIMIT</code> corta la cantidad de filas.',
          en: '<code>SELECT</code> picks the columns and <code>FROM</code> the table. <code>*</code> brings them all. <code>LIMIT</code> caps the number of rows.',
        },
        code: { es: 'SELECT nombre, ciudad\nFROM clientes\nLIMIT 10;', en: 'SELECT name, city\nFROM customers\nLIMIT 10;' },
        tip: { es: 'Las columnas van separadas por comas. Si te falta una coma, SQL cree que es un alias.', en: 'Columns are separated by commas. If a comma is missing, SQL thinks it is an alias.' },
      },
      sqlWhere: {
        title: { es: 'WHERE: filtrar filas', en: 'WHERE: filtering rows' },
        say: {
          es: '<code>WHERE</code> deja solo las filas que cumplen una condición. Los textos y las fechas van entre <b>comillas simples</b>. Se combinan con <code>AND</code> / <code>OR</code>. También: <code>LIKE \'A%\'</code> (empieza con A), <code>IN (\'Norte\', \'Sur\')</code>, <code>BETWEEN 10 AND 20</code>.',
          en: '<code>WHERE</code> keeps only the rows that meet a condition. Text and dates go in <b>single quotes</b>. Combine them with <code>AND</code> / <code>OR</code>. Also: <code>LIKE \'A%\'</code> (starts with A), <code>IN (\'North\', \'South\')</code>, <code>BETWEEN 10 AND 20</code>.',
        },
        code: { es: "SELECT nombre, plan\nFROM clientes\nWHERE ciudad = 'Rosario'\n  AND alta >= '2024-01-01';", en: "SELECT name, plan\nFROM customers\nWHERE city = 'Rosario'\n  AND signup_date >= '2024-01-01';" },
        tip: { es: 'En SQL las mayúsculas de los textos importan: \'Norte\' no es igual a \'norte\'.', en: "In SQL text case matters: 'North' is not the same as 'north'." },
      },
      sqlOrder: {
        title: { es: 'ORDER BY + LIMIT: los "top N"', en: 'ORDER BY + LIMIT: "top N"' },
        say: {
          es: '<code>ORDER BY monto DESC</code> ordena de mayor a menor (<code>ASC</code>, o nada, es de menor a mayor). Con <code>LIMIT 5</code> te quedás con las primeras: el clásico "top 5".',
          en: '<code>ORDER BY amount DESC</code> sorts from largest to smallest (<code>ASC</code>, or nothing, is smallest first). With <code>LIMIT 5</code> you keep the first ones: the classic "top 5".',
        },
        code: { es: 'SELECT vendedor, monto\nFROM ventas\nORDER BY monto DESC\nLIMIT 5;', en: 'SELECT seller, amount\nFROM sales\nORDER BY amount DESC\nLIMIT 5;' },
        tip: { es: 'El orden de las cláusulas es fijo: SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT.', en: 'Clause order is fixed: SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT.' },
      },
      sqlGroup: {
        title: { es: 'Resumir: COUNT, SUM, AVG y GROUP BY', en: 'Summarizing: COUNT, SUM, AVG and GROUP BY' },
        say: {
          es: '<code>COUNT(*)</code>, <code>SUM()</code>, <code>AVG()</code>, <code>MIN()</code>, <code>MAX()</code> resumen muchas filas en una. Con <code>GROUP BY region</code> resumen <b>por grupo</b>: es una tabla dinámica en SQL. Para filtrar grupos (no filas) se usa <code>HAVING</code>.',
          en: '<code>COUNT(*)</code>, <code>SUM()</code>, <code>AVG()</code>, <code>MIN()</code>, <code>MAX()</code> summarize many rows into one. With <code>GROUP BY region</code> they summarize <b>per group</b>: it\'s a pivot table in SQL. To filter groups (not rows) use <code>HAVING</code>.',
        },
        code: { es: "SELECT region, COUNT(*) AS pedidos, SUM(monto) AS total\nFROM pedidos\nGROUP BY region\nHAVING COUNT(*) > 10\nORDER BY total DESC;", en: "SELECT region, COUNT(*) AS orders, SUM(amount) AS total\nFROM orders\nGROUP BY region\nHAVING COUNT(*) > 10\nORDER BY total DESC;" },
        tip: { es: 'Toda columna del SELECT que no esté resumida tiene que estar en el GROUP BY.', en: 'Every SELECT column that is not summarized must be in GROUP BY.' },
      },
      sqlJoin: {
        title: { es: 'JOIN: cruzar tablas', en: 'JOIN: combining tables' },
        say: {
          es: '<code>JOIN</code> une dos tablas por una columna en común: es el BUSCARV de SQL. Se escribe <code>FROM ventas v JOIN productos p ON v.id_producto = p.id</code>. La <b>v</b> y la <b>p</b> son alias para escribir menos y para aclarar de qué tabla es cada columna.',
          en: '<code>JOIN</code> links two tables through a common column: it\'s SQL\'s VLOOKUP. Write <code>FROM sales s JOIN products p ON s.product_id = p.id</code>. <b>s</b> and <b>p</b> are aliases to type less and to make clear which table each column comes from.',
        },
        code: { es: 'SELECT p.categoria, SUM(v.cantidad) AS unidades\nFROM ventas v\nJOIN productos p ON v.id_producto = p.id\nGROUP BY p.categoria;', en: 'SELECT p.category, SUM(s.quantity) AS units\nFROM sales s\nJOIN products p ON s.product_id = p.id\nGROUP BY p.category;' },
        tip: { es: 'Si una columna existe en las dos tablas (como id), aclarala: v.id o p.id.', en: 'If a column exists in both tables (like id), qualify it: s.id or p.id.' },
      },
    },
  });

  // ---------------------------------------------------------------------------
  // SELECT + WHERE
  // ---------------------------------------------------------------------------
  C.register('m10_select', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [24, 30], [50, 70], [100, 140]);
    const city = r.pick(CITIES);
    const plans = ['Basic', 'Plus', 'Premium'];
    const people = C.peopleParts(r, n, true);
    let rows;
    let q2;
    do {
      rows = people.map((p, i) => ({
        id: i + 1,
        name: `${p.first} ${p.last}`,
        email: `${p.first}.${p.last}@mail.com`.toLowerCase(),
        city: r.chance(0.25) ? city : r.pick(CITIES),
        plan: r.pick(plans),
        date: day(r.int(0, 23) - 12, r.int(0, 27)),
      }));
      q2 = rows.filter((x) => x.plan === 'Premium' && x.date >= '2024-01-01');
    } while (!rows.some((x) => x.city === city) || q2.length < 2);
    const tb = T('clientes', 'customers');
    const c = { id: 'id', name: T('nombre', 'name'), email: 'email', city: T('ciudad', 'city'), plan: 'plan', date: T('alta', 'signup_date') };
    const table = { headers: [c.id, c.name, c.email, c.city, c.plan, c.date], rows: rows.map((x) => [x.id, x.name, x.email, x.city, x.plan, x.date]) };
    const exp1 = { rows: rows.filter((x) => x.city === city).map((x) => [x.name, x.email]) };
    const exp2 = { rows: q2.map((x) => [x.name, x.date]) };
    return {
      from: 'tadeo',
      dept: 'marketing',
      subject: T(`Clientes de ${city} para un evento`, `Customers in ${city} for an event`),
      file: T('crm.db', 'crm.db'),
      email: T(
        `<p>Hacemos un evento en <b>${city}</b> y quiero invitar a los clientes de ahí. La base del CRM ya no entra en una planilla, así que te pido que la consultes con <b>SQL</b>.</p><p>Después necesito a los clientes <b>Premium</b> que se dieron de alta desde 2024.</p>`,
        `<p>We're holding an event in <b>${city}</b> and I want to invite the customers there. The CRM database no longer fits in a spreadsheet, so please query it with <b>SQL</b>.</p><p>Then I need the <b>Premium</b> customers who signed up since 2024.</p>`
      ),
      sql: { tables: { [tb]: table }, starter: `SELECT *\nFROM ${tb}\nLIMIT 5;` },
      objectives: [
        {
          text: T(`Consulta: <b>${c.name}</b> y <b>${c.email}</b> de los clientes de <b>${city}</b>.`, `Query: <b>${c.name}</b> and <b>${c.email}</b> of the customers in <b>${city}</b>.`),
          hint: `SELECT ${c.name}, ${c.email} FROM ${tb} WHERE ${c.city} = '${city}'`,
          check: V.sql(exp1, { requires: ['WHERE'] }),
        },
        {
          text: T(`Consulta: <b>${c.name}</b> y <b>${c.date}</b> de los clientes <b>Premium</b> con alta desde el <b>2024-01-01</b>.`, `Query: <b>${c.name}</b> and <b>${c.date}</b> of <b>Premium</b> customers who signed up on or after <b>2024-01-01</b>.`),
          hint: `SELECT ${c.name}, ${c.date} FROM ${tb} WHERE ${c.plan} = 'Premium' AND ${c.date} >= '2024-01-01'`,
          check: V.sql(exp2, { requires: ['WHERE'] }),
        },
        {
          text: T('❓ ¿Cuántos clientes Premium se dieron de alta desde 2024?', '❓ How many Premium customers signed up since 2024?'),
          placeholder: T('Cantidad', 'Count'),
          hint: T('Mirá cuántas filas devolvió la consulta anterior.', 'Look at how many rows the previous query returned.'),
          answer: V.answerNumber(q2.length, 0),
        },
      ],
      tips: [T("Textos y fechas entre comillas simples: 'Premium', '2024-01-01'.", "Text and dates in single quotes: 'Premium', '2024-01-01'."), T('Las fechas en formato AAAA-MM-DD se pueden comparar con >= y <.', 'Dates in YYYY-MM-DD format can be compared with >= and <.')],
      feedback: T('¡Invitaciones enviadas! Y me guardé tu consulta para el próximo evento.', 'Invitations sent! And I saved your query for the next event.'),
      solution: {
        sql: [`SELECT ${c.name}, ${c.email} FROM ${tb} WHERE ${c.city} = '${city}'`, `SELECT ${c.name}, ${c.date} FROM ${tb} WHERE ${c.plan} = 'Premium' AND ${c.date} >= '2024-01-01'`],
        answers: { 2: String(q2.length) },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // ORDER BY + LIMIT
  // ---------------------------------------------------------------------------
  C.register('m10_top', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [24, 30], [50, 70], [100, 140]);
    const sellers = C.people(r, 8);
    const regs = REGIONS.slice(0, 4).map(C.L2);
    const reg = r.pick(regs);
    let rows;
    let amounts;
    do {
      rows = Array.from({ length: n }, (_, i) => ({ id: 1 + i, date: day(2, i), seller: r.pick(sellers), reg: r.pick(regs), amount: r.step(500, 25000, 10) }));
      amounts = rows.map((x) => x.amount).sort((a, b) => b - a);
    } while (new Set(amounts.slice(0, 6)).size < 6 || rows.filter((x) => x.reg === reg && x.amount > 10000).length < 2);
    const top5 = [...rows].sort((a, b) => b.amount - a.amount).slice(0, 5);
    const sub = rows.filter((x) => x.reg === reg && x.amount > 10000);
    const tb = T('ventas', 'sales');
    const c = { id: 'id', date: T('fecha', 'date'), seller: T('vendedor', 'seller'), reg: 'region', amount: T('monto', 'amount') };
    return {
      from: 'bruno',
      dept: 'ventas',
      subject: T('Las ventas más grandes del trimestre', 'The biggest sales of the quarter'),
      file: 'ventas.db',
      email: T(
        `<p>Quiero reconocer las <b>5 ventas más grandes</b> del trimestre: vendedor y monto, de mayor a menor.</p><p>Y otra cosa: las ventas de la región <b>${reg}</b> de <b>más de $10.000</b>, en orden de fecha.</p>`,
        `<p>I want to recognize the <b>5 biggest sales</b> of the quarter: seller and amount, from largest to smallest.</p><p>And another thing: sales in the <b>${reg}</b> region <b>over $10,000</b>, in date order.</p>`
      ),
      sql: { tables: { [tb]: { headers: [c.id, c.date, c.seller, c.reg, c.amount], rows: rows.map((x) => [x.id, x.date, x.seller, x.reg, x.amount]) } }, starter: `SELECT *\nFROM ${tb}\nLIMIT 5;` },
      objectives: [
        {
          text: T(`Las <b>5 ventas más grandes</b>: <b>${c.seller}</b> y <b>${c.amount}</b>, de mayor a menor.`, `The <b>5 biggest sales</b>: <b>${c.seller}</b> and <b>${c.amount}</b>, largest first.`),
          hint: `SELECT ${c.seller}, ${c.amount} FROM ${tb} ORDER BY ${c.amount} DESC LIMIT 5`,
          check: V.sql({ rows: top5.map((x) => [x.seller, x.amount]), ordered: true }, { requires: ['ORDER BY', 'LIMIT'] }),
        },
        {
          text: T(`Ventas de <b>${reg}</b> de más de 10000: <b>${c.date}</b>, <b>${c.seller}</b> y <b>${c.amount}</b>, ordenadas por fecha.`, `Sales in <b>${reg}</b> over 10000: <b>${c.date}</b>, <b>${c.seller}</b> and <b>${c.amount}</b>, sorted by date.`),
          hint: `SELECT ${c.date}, ${c.seller}, ${c.amount} FROM ${tb} WHERE region = '${reg}' AND ${c.amount} > 10000 ORDER BY ${c.date}`,
          check: V.sql({ rows: sub.map((x) => [x.date, x.seller, x.amount]), ordered: true }, { requires: ['WHERE', 'ORDER BY'] }),
        },
        {
          text: T('❓ ¿Quién hizo la <b>venta más grande</b>?', '❓ Who made the <b>biggest sale</b>?'),
          placeholder: T('Nombre', 'Name'),
          hint: T('La primera fila del top 5.', 'The first row of the top 5.'),
          answer: V.answerText([top5[0].seller]),
        },
      ],
      tips: [T('DESC = de mayor a menor. Sin DESC, ordena de menor a mayor.', 'DESC = largest first. Without DESC, it sorts smallest first.'), T('WHERE va antes de ORDER BY, y LIMIT siempre al final.', 'WHERE goes before ORDER BY, and LIMIT always last.')],
      feedback: T('¡Gracias! El reconocimiento va en la reunión del viernes.', 'Thanks! The recognition goes in Friday\'s meeting.'),
      solution: {
        sql: [`SELECT ${c.seller}, ${c.amount} FROM ${tb} ORDER BY ${c.amount} DESC LIMIT 5`, `SELECT ${c.date}, ${c.seller}, ${c.amount} FROM ${tb} WHERE region = '${reg}' AND ${c.amount} > 10000 ORDER BY ${c.date}`],
        answers: { 2: top5[0].seller },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Funciones de resumen sin agrupar
  // ---------------------------------------------------------------------------
  C.register('m10_agg', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [24, 30], [50, 70], [100, 140]);
    const regs = REGIONS.map(C.L2);
    const states = [['Entregado', 'Delivered'], ['Pendiente', 'Pending'], ['Cancelado', 'Cancelled']].map(C.L2);
    const rows = Array.from({ length: n }, (_, i) => ({ id: 101 + i, date: day(3, r.int(0, 60)), reg: r.pick(regs), st: r.chance(0.7) ? states[0] : r.chance(0.5) ? states[1] : states[2], amount: r.step(400, 15000, 10) }));
    if (!rows.some((x) => x.st === states[2])) rows[0].st = states[2];
    const amounts = rows.map((x) => x.amount);
    const deliv = rows.filter((x) => x.st === states[0]).map((x) => x.amount);
    const cancelled = rows.filter((x) => x.st === states[2]).length;
    const tb = T('pedidos', 'orders');
    const c = { id: 'id', date: T('fecha', 'date'), reg: 'region', st: T('estado', 'status'), amount: T('monto', 'amount') };
    return {
      from: 'julia',
      dept: 'finanzas',
      subject: T('Números rápidos de pedidos', 'Quick order numbers'),
      file: 'pedidos.db',
      email: T(
        '<p>Para el cierre necesito unos números rápidos de la tabla de pedidos: <b>total facturado</b> y <b>cantidad de pedidos</b>, el <b>monto promedio de los entregados</b> y el <b>pedido más caro y el más barato</b>.</p>',
        '<p>For the closing I need some quick numbers from the orders table: <b>total billed</b> and <b>number of orders</b>, the <b>average amount of delivered orders</b> and the <b>most and least expensive order</b>.</p>'
      ),
      sql: { tables: { [tb]: { headers: [c.id, c.date, c.reg, c.st, c.amount], rows: rows.map((x) => [x.id, x.date, x.reg, x.st, x.amount]) } }, starter: `SELECT *\nFROM ${tb}\nLIMIT 5;` },
      objectives: [
        {
          text: T(`Una fila con la <b>suma de ${c.amount}</b> y la <b>cantidad de pedidos</b>.`, `One row with the <b>sum of ${c.amount}</b> and the <b>number of orders</b>.`),
          hint: `SELECT SUM(${c.amount}), COUNT(*) FROM ${tb}`,
          check: V.sql({ rows: [[sum(amounts), n]] }, { requires: ['SUM', 'COUNT'] }),
        },
        {
          text: T(`El <b>promedio de ${c.amount}</b> de los pedidos <b>${states[0]}</b>.`, `The <b>average ${c.amount}</b> of <b>${states[0]}</b> orders.`),
          hint: `SELECT AVG(${c.amount}) FROM ${tb} WHERE ${c.st} = '${states[0]}'`,
          check: V.sql({ rows: [[avg(deliv)]] }, { requires: ['AVG', 'WHERE'] }),
        },
        {
          text: T(`El <b>${c.amount} más alto</b> y el <b>más bajo</b>, en una fila.`, `The <b>highest</b> and <b>lowest ${c.amount}</b>, in one row.`),
          hint: `SELECT MAX(${c.amount}), MIN(${c.amount}) FROM ${tb}`,
          check: V.sql({ rows: [[Math.max(...amounts), Math.min(...amounts)]] }, { requires: ['MAX', 'MIN'] }),
        },
        {
          text: T(`❓ ¿Cuántos pedidos quedaron <b>${states[2]}</b>?`, `❓ How many orders are <b>${states[2]}</b>?`),
          placeholder: T('Cantidad', 'Count'),
          hint: `SELECT COUNT(*) FROM ${tb} WHERE ${c.st} = '${states[2]}'`,
          answer: V.answerNumber(cancelled, 0),
        },
      ],
      tips: [T('Las funciones de resumen devuelven una sola fila con todo resumido.', 'Aggregate functions return a single row with everything summarized.'), T('COUNT(*) cuenta filas; COUNT(columna) cuenta las que no están vacías.', 'COUNT(*) counts rows; COUNT(column) counts non-empty ones.')],
      feedback: T('Listo el cierre. Y sin abrir una sola planilla. 😎', 'Closing done. Without opening a single spreadsheet. 😎'),
      solution: {
        sql: [`SELECT SUM(${c.amount}), COUNT(*) FROM ${tb}`, `SELECT AVG(${c.amount}) FROM ${tb} WHERE ${c.st} = '${states[0]}'`, `SELECT MAX(${c.amount}), MIN(${c.amount}) FROM ${tb}`],
        answers: { 3: String(cancelled) },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // GROUP BY + HAVING
  // ---------------------------------------------------------------------------
  C.register('m10_group', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [30, 40], [60, 80], [110, 150]);
    const carriers = r.sample(CARRIERS, 4);
    const regs = REGIONS.slice(0, 4).map(C.L2);
    const states = [['Entregado', 'Delivered'], ['Demorado', 'Delayed']].map(C.L2);
    let rows;
    let costAvg;
    let delayed;
    let limit;
    do {
      const bad = carriers.map(() => 0.1 + r.next() * 0.4);
      rows = Array.from({ length: n }, (_, i) => {
        const k = r.int(0, 3);
        return { id: 1 + i, car: carriers[k], reg: r.pick(regs), st: r.chance(bad[k]) ? states[1] : states[0], cost: r.step(800, 3200, 10) };
      });
      costAvg = regs.map((g) => avg(rows.filter((x) => x.reg === g).map((x) => x.cost)));
      delayed = carriers.map((cr) => rows.filter((x) => x.car === cr && x.st === states[1]).length);
      const sorted = [...delayed].sort((a, b) => b - a);
      limit = sorted[1] > sorted[2] ? sorted[2] : -1;
    } while (C.uniqueExtreme(costAvg) < 0 || new Set(costAvg.map((v) => v.toFixed(4))).size < 4 || limit < 1);
    const tb = T('envios', 'shipments');
    const c = { id: 'id', car: T('transportista', 'carrier'), reg: 'region', st: T('estado', 'status'), cost: T('costo', 'cost') };
    const byCar = carriers.map((cr) => [cr, rows.filter((x) => x.car === cr).length]);
    const byReg = regs.map((g, i) => [g, costAvg[i]]).sort((a, b) => b[1] - a[1]);
    const many = carriers.map((cr, i) => [cr, delayed[i]]).filter((x) => x[1] > limit);
    return {
      from: 'ramiro',
      dept: 'logistica',
      subject: T('Envíos por transportista y región', 'Shipments by carrier and region'),
      file: 'logistica.db',
      email: T(
        `<p>Necesito tres cosas de la tabla de envíos: <b>cuántos envíos hizo cada transportista</b>, el <b>costo promedio por región</b> (de mayor a menor) y <b>qué transportistas tienen más de ${limit} envíos demorados</b>.</p>`,
        `<p>I need three things from the shipments table: <b>how many shipments each carrier made</b>, the <b>average cost per region</b> (largest first) and <b>which carriers have more than ${limit} delayed shipments</b>.</p>`
      ),
      sql: { tables: { [tb]: { headers: [c.id, c.car, c.reg, c.st, c.cost], rows: rows.map((x) => [x.id, x.car, x.reg, x.st, x.cost]) } }, starter: `SELECT *\nFROM ${tb}\nLIMIT 5;` },
      objectives: [
        {
          text: T(`<b>${c.car}</b> y la <b>cantidad de envíos</b> de cada uno.`, `<b>${c.car}</b> and the <b>number of shipments</b> of each.`),
          hint: `SELECT ${c.car}, COUNT(*) FROM ${tb} GROUP BY ${c.car}`,
          check: V.sql({ rows: byCar }, { requires: ['GROUP BY'] }),
        },
        {
          text: T(`<b>region</b> y <b>costo promedio</b>, de mayor a menor costo.`, `<b>region</b> and <b>average cost</b>, highest cost first.`),
          hint: `SELECT region, AVG(${c.cost}) FROM ${tb} GROUP BY region ORDER BY AVG(${c.cost}) DESC`,
          check: V.sql({ rows: byReg, ordered: true }, { requires: ['GROUP BY', 'ORDER BY'] }),
        },
        {
          text: T(`Transportistas con <b>más de ${limit} envíos ${states[1]}</b>: <b>${c.car}</b> y cantidad.`, `Carriers with <b>more than ${limit} ${states[1]} shipments</b>: <b>${c.car}</b> and count.`),
          hint: `SELECT ${c.car}, COUNT(*) FROM ${tb} WHERE ${c.st} = '${states[1]}' GROUP BY ${c.car} HAVING COUNT(*) > ${limit}`,
          check: V.sql({ rows: many }, { requires: ['GROUP BY', 'HAVING'] }),
        },
        {
          text: T('❓ ¿Qué región tiene el <b>costo promedio más alto</b>?', '❓ Which region has the <b>highest average cost</b>?'),
          placeholder: T('Región', 'Region'),
          hint: T('La primera fila de la segunda consulta.', 'The first row of the second query.'),
          answer: V.answerText([byReg[0][0]]),
        },
      ],
      tips: [T('WHERE filtra filas antes de agrupar; HAVING filtra grupos después.', 'WHERE filters rows before grouping; HAVING filters groups after.'), T('Podés ordenar por una función: ORDER BY AVG(costo) DESC, o ponerle un alias y ordenar por él.', 'You can sort by a function: ORDER BY AVG(cost) DESC, or give it an alias and sort by that.')],
      feedback: T('Con esto renegociamos con los transportistas más lentos. ¡Muy útil!', "With this we're renegotiating with the slowest carriers. Very useful!"),
      solution: {
        sql: [`SELECT ${c.car}, COUNT(*) FROM ${tb} GROUP BY ${c.car}`, `SELECT region, AVG(${c.cost}) AS prom FROM ${tb} GROUP BY region ORDER BY prom DESC`, `SELECT ${c.car}, COUNT(*) FROM ${tb} WHERE ${c.st} = '${states[1]}' GROUP BY ${c.car} HAVING COUNT(*) > ${limit}`],
        answers: { 3: byReg[0][0] },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // JOIN entre ventas y productos
  // ---------------------------------------------------------------------------
  C.register('m10_join', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [24, 30], [50, 70], [100, 140]);
    const cats = [['Oficina', 'Office'], ['Electrónica', 'Electronics'], ['Muebles', 'Furniture']].map(C.L2);
    const prods = r.sample(PRODUCTS, ctx.size === 'small' ? 8 : 12).map((p, i) => ({ id: 10 + i, name: C.L2(p), cat: cats[i % 3], price: p[2] }));
    let sales;
    let units;
    let rev;
    do {
      sales = Array.from({ length: n }, (_, i) => ({ id: 501 + i, p: r.pick(prods), qty: r.int(1, 9) }));
      units = cats.map((c) => sum(sales.filter((s) => s.p.cat === c).map((s) => s.qty)));
      rev = cats.map((c) => sum(sales.filter((s) => s.p.cat === c).map((s) => s.qty * s.p.price)));
    } while (C.uniqueExtreme(rev) < 0 || new Set(rev).size < 3 || units.some((u) => !u));
    const tv = T('ventas', 'sales');
    const tp = T('productos', 'products');
    const c = { id: 'id', pid: T('id_producto', 'product_id'), qty: T('cantidad', 'quantity'), name: T('nombre', 'name'), cat: T('categoria', 'category'), price: T('precio', 'price') };
    const a = T('v', 's');
    const list = sales.map((s) => [s.id, s.p.name, s.qty]);
    const byCat = cats.map((cat, i) => [cat, units[i]]);
    const byRev = cats.map((cat, i) => [cat, rev[i]]).sort((x, y) => y[1] - x[1]);
    return {
      from: 'marta',
      dept: 'analytics',
      subject: T('Ventas por categoría (dos tablas)', 'Sales by category (two tables)'),
      file: 'comercial.db',
      email: T(
        `<p>La tabla de <b>${tv}</b> solo tiene el id del producto; el nombre, la categoría y el precio están en <b>${tp}</b>. Necesito:</p><ol><li>Un listado de ventas con el <b>nombre</b> del producto.</li><li>Las <b>unidades vendidas por categoría</b>.</li><li>La <b>facturación por categoría</b> (cantidad × precio), de mayor a menor.</li></ol>`,
        `<p>The <b>${tv}</b> table only has the product id; the name, category and price are in <b>${tp}</b>. I need:</p><ol><li>A list of sales with the product <b>name</b>.</li><li><b>Units sold per category</b>.</li><li><b>Revenue per category</b> (quantity × price), largest first.</li></ol>`
      ),
      sql: {
        tables: {
          [tv]: { headers: [c.id, c.pid, c.qty], rows: sales.map((s) => [s.id, s.p.id, s.qty]) },
          [tp]: { headers: [c.id, c.name, c.cat, c.price], rows: prods.map((p) => [p.id, p.name, p.cat, p.price]) },
        },
        starter: `SELECT *\nFROM ${tv}\nLIMIT 5;`,
      },
      objectives: [
        {
          text: T(`Cada venta con su <b>id</b>, el <b>${c.name}</b> del producto y la <b>${c.qty}</b>.`, `Each sale with its <b>id</b>, the product <b>${c.name}</b> and the <b>${c.qty}</b>.`),
          hint: `SELECT ${a}.id, p.${c.name}, ${a}.${c.qty} FROM ${tv} ${a} JOIN ${tp} p ON ${a}.${c.pid} = p.id`,
          check: V.sql({ rows: list }, { requires: ['JOIN'] }),
        },
        {
          text: T(`<b>${c.cat}</b> y <b>unidades vendidas</b> (suma de ${c.qty}).`, `<b>${c.cat}</b> and <b>units sold</b> (sum of ${c.qty}).`),
          hint: `SELECT p.${c.cat}, SUM(${a}.${c.qty}) FROM ${tv} ${a} JOIN ${tp} p ON ${a}.${c.pid} = p.id GROUP BY p.${c.cat}`,
          check: V.sql({ rows: byCat }, { requires: ['JOIN', 'GROUP BY'] }),
        },
        {
          text: T(`<b>${c.cat}</b> y <b>facturación</b> (${c.qty} × ${c.price}), de mayor a menor.`, `<b>${c.cat}</b> and <b>revenue</b> (${c.qty} × ${c.price}), largest first.`),
          hint: `SELECT p.${c.cat}, SUM(${a}.${c.qty} * p.${c.price}) AS ${T('facturacion', 'revenue')} FROM ${tv} ${a} JOIN ${tp} p ON ${a}.${c.pid} = p.id GROUP BY p.${c.cat} ORDER BY ${T('facturacion', 'revenue')} DESC`,
          check: V.sql({ rows: byRev, ordered: true }, { requires: ['JOIN', 'GROUP BY', 'ORDER BY'] }),
        },
        {
          text: T('❓ ¿Qué categoría <b>facturó más</b>?', '❓ Which category had the <b>highest revenue</b>?'),
          placeholder: T('Categoría', 'Category'),
          hint: T('La primera fila de la última consulta.', 'The first row of the last query.'),
          answer: V.answerText([byRev[0][0]]),
        },
      ],
      tips: [T('ON dice cómo se conectan: el id_producto de ventas es el id de productos.', 'ON says how they connect: the sales product_id is the products id.'), T('Con alias (v, p) las columnas quedan claras: v.cantidad, p.precio.', 'With aliases (s, p) columns are clear: s.quantity, p.price.')],
      feedback: T('¡Excelente! Esto antes eran dos planillas y un BUSCARV gigante. Ahora es una consulta.', 'Excellent! This used to be two spreadsheets and a giant VLOOKUP. Now it\'s one query.'),
      solution: {
        sql: [
          `SELECT ${a}.id, p.${c.name}, ${a}.${c.qty} FROM ${tv} ${a} JOIN ${tp} p ON ${a}.${c.pid} = p.id`,
          `SELECT p.${c.cat}, SUM(${a}.${c.qty}) FROM ${tv} ${a} JOIN ${tp} p ON ${a}.${c.pid} = p.id GROUP BY p.${c.cat}`,
          `SELECT p.${c.cat}, SUM(${a}.${c.qty} * p.${c.price}) AS rev FROM ${tv} ${a} JOIN ${tp} p ON ${a}.${c.pid} = p.id GROUP BY p.${c.cat} ORDER BY rev DESC`,
        ],
        answers: { 3: byRev[0][0] },
      },
    };
  });
})();
