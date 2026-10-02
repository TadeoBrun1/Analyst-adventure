/*
 * Analyst Adventure — Nivel 6: Gráficos (editor estilo Tableau).
 * Elegir el tipo de gráfico, dimensiones y medidas, agregación, orden, color, filtros
 * y un título que cuente la conclusión.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const C = AA.Content;
  const V = AA.V;
  const Ch = AA.Chart;
  const T = (es, en) => AA.T(es, en);
  const { REGIONS, MONTHS, CARRIERS, CATEGORIES } = C.DATA;
  const sum = (a) => a.reduce((s, x) => s + x, 0);

  // Un objetivo que solo se evalúa cuando el anterior ya está cumplido (evita notas repetidas).
  const after = (prev, check) => (Q) => (prev(Q) === true ? check(Q) : false);

  // Datos de envíos reutilizados por varias plantillas.
  const STATUS = [['Entregado', 'Delivered'], ['Demorado', 'Delayed'], ['Cancelado', 'Cancelled']];

  // ---------------------------------------------------------------------------
  // Barras: ventas por región, ordenadas y con título-conclusión
  // ---------------------------------------------------------------------------
  C.register('m6_bar', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [20, 26], [40, 60], [80, 120]);
    const regs = REGIONS.map(C.L2);
    const cats = CATEGORIES.slice(0, 4).map(C.L2);
    const sellers = C.people(r, 10);
    let rows;
    let totals;
    do {
      const weight = regs.map(() => 0.5 + r.next());
      rows = [];
      for (let i = 0; i < n; i++) {
        const g = r.int(0, regs.length - 1);
        rows.push([r.pick(sellers), regs[g], r.pick(cats), Math.round(r.step(500, 9000, 50) * weight[g])]);
      }
      totals = regs.map((g) => sum(rows.filter((x) => x[1] === g).map((x) => x[3])));
      const sorted = [...totals].sort((a, b) => b - a);
      if (sorted[0] !== sorted[1] && sorted[1] !== sorted[2] && totals.every((t) => t > 0)) break;
    } while (true);
    const order = totals.map((_, i) => i).sort((a, b) => totals[b] - totals[a]);
    const top = regs[order[0]];
    const second = totals[order[1]];
    const H = { who: T('Vendedor', 'Seller'), reg: T('Región', 'Region'), cat: T('Categoría', 'Category'), amt: T('Monto', 'Amount') };
    const base = Ch.expect({ marks: ['bar'], dim: H.reg, measure: H.amt, aggs: ['SUM'], color: null });
    return {
      from: 'bruno',
      dept: 'ventas',
      subject: T('Un gráfico para la reunión de ventas', 'A chart for the sales meeting'),
      file: T('ventas_regiones.twb', 'regional_sales.twb'),
      email: T(
        `<p>Mañana presento en la reunión de ventas y necesito <b>un gráfico</b> que muestre el <b>total vendido por región</b>.</p>
         <p>Que se entienda en dos segundos: ordenado de mayor a menor y con un título que diga la conclusión, no solo "Ventas por región".</p>`,
        `<p>Tomorrow I'm presenting at the sales meeting and I need <b>a chart</b> showing <b>total sales by region</b>.</p>
         <p>It must be clear in two seconds: sorted from largest to smallest and with a title that states the conclusion, not just "Sales by region".</p>`
      ),
      chart: { table: { headers: [H.who, H.reg, H.cat, H.amt], rows } },
      objectives: [
        {
          text: T(`Gráfico de <b>barras</b> con la <b>suma de ${H.amt}</b> por <b>${H.reg}</b>.`, `<b>Bar</b> chart with the <b>sum of ${H.amt}</b> by <b>${H.reg}</b>.`),
          hint: T(`Arrastrá ${H.reg} a Columnas y ${H.amt} a Filas. La agregación por defecto ya es Suma.`, `Drag ${H.reg} to Columns and ${H.amt} to Rows. The default aggregation is already Sum.`),
          check: base,
        },
        {
          text: T('Ordenalo de <b>mayor a menor</b>.', 'Sort it from <b>largest to smallest</b>.'),
          hint: T('Usá "Ordenar → Mayor a menor" en la barra de herramientas.', 'Use "Sort → Largest first" in the toolbar.'),
          check: after(base, Ch.expect({ sort: 'desc' })),
        },
        {
          text: T('Escribí un <b>título que cuente la conclusión</b>.', 'Write a <b>title that states the conclusion</b>.'),
          hint: T(`Por ejemplo: "${top} lidera las ventas". Nombrá a la región ganadora.`, `For example: "${top} leads sales". Name the winning region.`),
          check: after(base, Ch.expect({ titleIncludes: [top] })),
        },
        {
          text: T('❓ ¿Cuánto vendió la región que quedó <b>segunda</b>?', '❓ How much did the <b>second</b> region sell?'),
          placeholder: T('Un monto', 'An amount'),
          hint: T('Pasá el mouse por la segunda barra o activá "Etiquetas".', 'Hover over the second bar or turn on "Labels".'),
          answer: V.answerNumber(second, 0.5),
        },
      ],
      tips: [
        T('Barras = comparar categorías. Ordenadas, se leen al instante.', 'Bars = comparing categories. Sorted, they read instantly.'),
        T('En Tableau es igual: dimensión en Columnas, medida en Filas.', 'Tableau works the same: dimension on Columns, measure on Rows.'),
      ],
      feedback: T('¡La gerencia entendió todo en un vistazo! Un buen título vale más que mil ejes.', 'Management got it at a glance! A good title is worth a thousand axes.'),
      solution: {
        chart: { mark: 'bar', columns: { field: H.reg }, rows: { field: H.amt, agg: 'SUM' }, color: null, filter: null, sort: 'desc', title: `${top} ${T('lidera las ventas', 'leads sales')}`, labels: true },
        answers: { 3: String(second) },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Líneas: evolución mensual (sin ordenar por valor)
  // ---------------------------------------------------------------------------
  C.register('m6_line', (ctx) => {
    const r = ctx.rng;
    const channels = [['Web', 'Web'], ['Tienda', 'Store'], ['App', 'App']].map(C.L2);
    const up = r.chance(0.5);
    const months = MONTHS.map(C.L2);
    let rows;
    let totals;
    do {
      rows = [];
      months.forEach((mo, i) => {
        const trend = up ? 1 + i * 0.07 : 1.8 - i * 0.06;
        channels.forEach((ch) => rows.push([mo, ch, Math.round(r.int(300, 700) * trend)]));
      });
      totals = months.map((mo) => sum(rows.filter((x) => x[0] === mo).map((x) => x[2])));
    } while (C.uniqueExtreme(totals) < 0);
    const peak = months[C.uniqueExtreme(totals)];
    const H = { mo: T('Mes', 'Month'), ch: T('Canal', 'Channel'), ord: T('Pedidos', 'Orders') };
    const trendWords = up ? [T('crec', 'grow'), T('sub', 'increas'), T('aument', 'rise'), T('mejor', 'up')] : [T('baj', 'declin'), T('cae', 'decreas'), T('dismin', 'fall'), T('descend', 'drop'), T('cay', 'down')];
    const base = Ch.expect({ marks: ['line'], dim: H.mo, measure: H.ord, aggs: ['SUM'], color: null, markNote: T('Para mostrar una evolución en el tiempo, el gráfico ideal es de líneas.', 'To show change over time, a line chart is the right choice.') });
    return {
      from: 'tadeo',
      dept: 'marketing',
      subject: T('¿Cómo vienen los pedidos este año?', 'How are orders doing this year?'),
      file: T('pedidos_mensuales.twb', 'monthly_orders.twb'),
      email: T(
        `<p>Necesito ver cómo <b>evolucionaron los pedidos mes a mes</b> (sumando todos los canales) para el informe anual.</p>
         <p>Quiero saber si la tendencia es buena o mala y en qué mes tuvimos el pico.</p>`,
        `<p>I need to see how <b>orders evolved month by month</b> (adding up all channels) for the annual report.</p>
         <p>I want to know whether the trend is good or bad and which month had the peak.</p>`
      ),
      chart: { table: { headers: [H.mo, H.ch, H.ord], rows, time: [H.mo] } },
      objectives: [
        {
          text: T(`Gráfico de <b>líneas</b> con la <b>suma de ${H.ord}</b> por <b>${H.mo}</b>.`, `<b>Line</b> chart with the <b>sum of ${H.ord}</b> by <b>${H.mo}</b>.`),
          hint: T(`${H.mo} a Columnas, ${H.ord} a Filas. "Automático" ya elige líneas para fechas.`, `${H.mo} to Columns, ${H.ord} to Rows. "Automatic" already picks lines for dates.`),
          check: base,
        },
        {
          text: T('Mantené los meses en <b>orden cronológico</b> (sin ordenar por valor).', 'Keep the months in <b>chronological order</b> (no sorting by value).'),
          hint: T('"Ordenar → Orden original".', '"Sort → Original order".'),
          check: after(base, Ch.expect({ sort: 'none' })),
        },
        {
          text: T('Un <b>título</b> que diga si la tendencia sube o baja.', 'A <b>title</b> that says whether the trend goes up or down.'),
          hint: T('Por ejemplo: "Los pedidos crecen todo el año" o "Los pedidos bajan mes a mes".', 'For example: "Orders grow all year" or "Orders decline month by month".'),
          check: after(base, Ch.expect({ titleIncludes: trendWords })),
        },
        {
          text: T('❓ ¿En qué <b>mes</b> fue el pico de pedidos?', '❓ In which <b>month</b> did orders peak?'),
          placeholder: T('Mes', 'Month'),
          hint: T('El punto más alto de la línea.', 'The highest point of the line.'),
          answer: V.answerText([peak]),
        },
        {
          text: T('❓ ¿La tendencia del año es <b>creciente</b> o <b>decreciente</b>?', '❓ Is the yearly trend <b>increasing</b> or <b>decreasing</b>?'),
          placeholder: T('Creciente o decreciente', 'Increasing or decreasing'),
          hint: T('Compará el principio y el final de la línea.', 'Compare the start and end of the line.'),
          answer: (a) => {
            const t = V.norm(a);
            return up ? /^(crec|increas|sub|aument|up)/.test(t) : /^(decrec|decreas|baj|dismin|down|declin)/.test(t);
          },
        },
      ],
      tips: [
        T('Líneas = evolución en el tiempo. El eje X sigue el orden del calendario.', 'Lines = change over time. The X axis follows calendar order.'),
        T('Nunca ordenes los meses por valor: se pierde la historia.', 'Never sort months by value: the story gets lost.'),
      ],
      feedback: T('¡Clarísimo! Con este gráfico el informe se explica solo.', 'Crystal clear! With this chart the report explains itself.'),
      solution: {
        chart: { mark: 'line', columns: { field: H.mo }, rows: { field: H.ord, agg: 'SUM' }, color: null, filter: null, sort: 'none', title: up ? T('Los pedidos crecen todo el año', 'Orders grow all year') : T('Los pedidos bajan mes a mes', 'Orders decline month by month'), labels: false },
        answers: { 3: peak, 4: up ? T('creciente', 'increasing') : T('decreciente', 'decreasing') },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Torta: partes de un todo con pocas categorías (recuento de registros)
  // ---------------------------------------------------------------------------
  C.register('m6_pie', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [30, 40], [60, 90], [120, 160]);
    const channels = r.sample([['Email', 'Email'], ['Teléfono', 'Phone'], ['Chat', 'Chat'], ['Redes', 'Social media'], ['WhatsApp', 'WhatsApp']], r.int(3, 5)).map(C.L2);
    const prios = [['Alta', 'High'], ['Media', 'Medium'], ['Baja', 'Low']].map(C.L2);
    let rows;
    let counts;
    do {
      const w = channels.map(() => 0.3 + r.next());
      const tot = sum(w);
      rows = [];
      for (let i = 0; i < n; i++) {
        let x = r.next() * tot;
        let k = 0;
        while (x > w[k]) x -= w[k++];
        rows.push(['#' + (4001 + i), channels[Math.min(k, channels.length - 1)], r.pick(prios)]);
      }
      counts = channels.map((c) => rows.filter((x) => x[1] === c).length);
    } while (C.uniqueExtreme(counts) < 0 || counts.some((c) => c === 0));
    const topIdx = C.uniqueExtreme(counts);
    const pct = (counts[topIdx] / n) * 100;
    const H = { id: 'Ticket', ch: T('Canal', 'Channel'), pr: T('Prioridad', 'Priority') };
    const base = Ch.expect({ marks: ['pie'], dim: H.ch, measure: Ch.COUNT_FIELD, aggs: ['COUNT'], markNote: T('Para mostrar cómo se reparte un total entre pocas categorías, usá una torta.', 'To show how a total splits across a few categories, use a pie.') });
    const pctAnswer = (a) => V.answerNumber(pct, 0.6)(a) || V.answerNumber(pct / 100, 0.006)(a);
    return {
      from: 'camila',
      dept: 'data',
      subject: T('¿Por dónde nos contactan los clientes?', 'How do customers contact us?'),
      file: T('tickets_canales.twb', 'ticket_channels.twb'),
      email: T(
        `<p>Tenemos ${n} tickets de soporte. Quiero ver <b>qué parte del total</b> entra por cada canal, para decidir dónde poner más gente.</p>
         <p>Contá los tickets (cada fila es uno) y mostralo como partes de un todo.</p>`,
        `<p>We have ${n} support tickets. I want to see <b>what share of the total</b> comes through each channel, to decide where to add staff.</p>
         <p>Count the tickets (each row is one) and show it as parts of a whole.</p>`
      ),
      chart: { table: { headers: [H.id, H.ch, H.pr], rows } },
      objectives: [
        {
          text: T(`Una <b>torta</b> con la <b>cantidad de tickets</b> por <b>${H.ch}</b>.`, `A <b>pie</b> with the <b>number of tickets</b> by <b>${H.ch}</b>.`),
          hint: T(`${H.ch} a Columnas y "Cantidad de registros" a Filas; después elegí Torta en Mostrarme.`, `${H.ch} to Columns and "Number of records" to Rows; then pick Pie in Show Me.`),
          check: base,
        },
        {
          text: T('Un <b>título</b> que nombre el canal más usado.', 'A <b>title</b> that names the most used channel.'),
          hint: T(`Por ejemplo: "${channels[topIdx]} concentra la mayoría de los tickets".`, `For example: "${channels[topIdx]} handles most tickets".`),
          check: after(base, Ch.expect({ titleIncludes: [channels[topIdx]] })),
        },
        {
          text: T('❓ ¿Qué <b>porcentaje</b> del total entra por el canal más usado?', '❓ What <b>percentage</b> of the total comes through the most used channel?'),
          placeholder: T('Ej: 35', 'E.g. 35'),
          hint: T('La torta muestra el % de cada porción.', 'The pie shows the % of each slice.'),
          answer: pctAnswer,
        },
      ],
      tips: [
        T('Torta = partes de un todo, y solo con pocas porciones (6 como máximo).', 'Pie = parts of a whole, and only with few slices (6 at most).'),
        T('"Cantidad de registros" cuenta filas: es el Recuento de Tableau.', '"Number of records" counts rows: it is Tableau\'s Count.'),
      ],
      feedback: T('¡Gracias! Vamos a reforzar ese canal la semana que viene.', "Thanks! We'll reinforce that channel next week."),
      solution: {
        chart: { mark: 'pie', columns: { field: H.ch }, rows: { field: Ch.COUNT_FIELD, agg: 'COUNT' }, color: null, filter: null, sort: 'desc', title: `${channels[topIdx]} ${T('concentra la mayoría de los tickets', 'handles most tickets')}`, labels: false },
        answers: { 2: String(Math.round(pct * 10) / 10) },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Dispersión: relación entre dos medidas
  // ---------------------------------------------------------------------------
  C.register('m6_scatter', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [14, 18], [25, 35], [45, 60]);
    const positive = r.chance(0.35);
    const products = r.sample(C.DATA.PRODUCTS, Math.min(n, C.DATA.PRODUCTS.length));
    const rows = [];
    for (let i = 0; i < n; i++) {
      const p = products[i % products.length];
      const price = r.int(10, 200);
      const units = Math.max(5, Math.round((positive ? 40 + price * 1.6 : 420 - price * 1.8) + r.int(-45, 45)));
      rows.push([C.L2(p) + (i >= products.length ? ' ' + (Math.floor(i / products.length) + 1) : ''), price, units]);
    }
    const H = { p: T('Producto', 'Product'), price: T('Precio', 'Price'), units: T('Unidades', 'Units') };
    const base = Ch.expect({ marks: ['scatter'], x: H.price, y: H.units, markNote: T('Para ver la relación entre dos números se usa una dispersión.', 'To see the relationship between two numbers, use a scatter plot.') });
    return {
      from: 'julia',
      dept: 'finanzas',
      subject: T('¿El precio afecta cuánto vendemos?', 'Does price affect how much we sell?'),
      file: T('precio_vs_unidades.twb', 'price_vs_units.twb'),
      email: T(
        `<p>Antes de cambiar la lista de precios quiero ver si hay <b>relación entre el precio y las unidades vendidas</b> de cada producto.</p>
         <p>Poné el <b>precio en el eje horizontal</b> y las <b>unidades en el vertical</b>.</p>`,
        `<p>Before changing the price list I want to see whether there's a <b>relationship between price and units sold</b> for each product.</p>
         <p>Put <b>price on the horizontal axis</b> and <b>units on the vertical one</b>.</p>`
      ),
      chart: { table: { headers: [H.p, H.price, H.units], rows } },
      objectives: [
        {
          text: T(`Una <b>dispersión</b> con ${H.price} en Columnas y ${H.units} en Filas.`, `A <b>scatter plot</b> with ${H.price} on Columns and ${H.units} on Rows.`),
          hint: T('Dos medidas, una en cada estante. Mostrarme recomienda Dispersión.', 'Two measures, one on each shelf. Show Me recommends Scatter.'),
          check: base,
        },
        {
          text: T('Un <b>título</b> que mencione el precio.', 'A <b>title</b> that mentions price.'),
          hint: T('Por ejemplo: "A mayor precio, menos unidades".', 'For example: "Higher price, fewer units".'),
          check: after(base, Ch.expect({ titleIncludes: [T('precio', 'price')] })),
        },
        {
          text: T('❓ ¿La relación entre precio y unidades es <b>positiva</b> o <b>negativa</b>?', '❓ Is the relationship between price and units <b>positive</b> or <b>negative</b>?'),
          placeholder: T('Positiva o negativa', 'Positive or negative'),
          hint: T('Si al aumentar el precio los puntos bajan, es negativa.', 'If points go down as price goes up, it is negative.'),
          answer: (a) => (positive ? /^(posit)/ : /^(negat)/).test(V.norm(a)),
        },
      ],
      tips: [
        T('Dispersión = relación entre dos medidas. Cada punto es un registro.', 'Scatter = relationship between two measures. Each dot is a record.'),
        T('Correlación no es causalidad: el gráfico muestra relación, no el motivo.', 'Correlation is not causation: the chart shows a relationship, not the reason.'),
      ],
      feedback: T('Muy útil. Ahora sé qué productos aguantan una suba de precio.', 'Very useful. Now I know which products can handle a price increase.'),
      solution: {
        chart: { mark: 'scatter', columns: { field: H.price, agg: 'SUM' }, rows: { field: H.units, agg: 'SUM' }, color: null, filter: null, sort: 'none', title: positive ? T('A mayor precio, más unidades', 'Higher price, more units') : T('A mayor precio, menos unidades', 'Higher price, fewer units'), labels: false },
        answers: { 2: positive ? T('positiva', 'positive') : T('negativa', 'negative') },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Barras con color y filtro
  // ---------------------------------------------------------------------------
  C.register('m6_color', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [40, 50], [70, 100], [130, 170]);
    const regs = REGIONS.slice(0, 4).map(C.L2);
    const sts = STATUS.map(C.L2);
    const carriers = r.sample(CARRIERS, 3);
    const focus = carriers[r.int(0, 2)];
    let rows;
    let delayed;
    do {
      rows = [];
      for (let i = 0; i < n; i++) {
        const car = r.pick(carriers);
        const roll = r.next();
        const st = roll < (car === focus ? 0.35 : 0.15) ? 1 : roll < 0.45 ? 2 : 0;
        rows.push(['E-' + (701 + i), r.pick(regs), sts[st], car]);
      }
      delayed = regs.map((g) => rows.filter((x) => x[1] === g && x[2] === sts[1] && x[3] === focus).length);
    } while (C.uniqueExtreme(delayed) < 0);
    const worst = regs[C.uniqueExtreme(delayed)];
    const H = { id: T('Envío', 'Shipment'), reg: T('Región', 'Region'), st: T('Estado', 'Status'), car: T('Transportista', 'Carrier') };
    const base = Ch.expect({ marks: ['bar'], dim: H.reg, measure: Ch.COUNT_FIELD, aggs: ['COUNT'] });
    const withColor = after(base, Ch.expect({ color: H.st }));
    return {
      from: 'ramiro',
      dept: 'logistica',
      subject: T(`¿Cómo le va a ${focus}?`, `How is ${focus} doing?`),
      file: T('envios_transportistas.twb', 'carrier_shipments.twb'),
      email: T(
        `<p>Tengo reunión con <b>${focus}</b>. Necesito ver sus envíos <b>por región</b>, separados por <b>estado</b> (entregado, demorado, cancelado).</p>
         <p>Ojo: la tabla tiene los envíos de todos los transportistas; mostrá <b>solo los de ${focus}</b>.</p>`,
        `<p>I have a meeting with <b>${focus}</b>. I need to see their shipments <b>by region</b>, split by <b>status</b> (delivered, delayed, cancelled).</p>
         <p>Careful: the table has every carrier's shipments; show <b>only ${focus}'s</b>.</p>`
      ),
      chart: { table: { headers: [H.id, H.reg, H.st, H.car], rows } },
      objectives: [
        {
          text: T(`<b>Barras</b> con la cantidad de envíos por <b>${H.reg}</b>.`, `<b>Bars</b> with the number of shipments by <b>${H.reg}</b>.`),
          hint: T(`${H.reg} a Columnas y "Cantidad de registros" a Filas.`, `${H.reg} to Columns and "Number of records" to Rows.`),
          check: base,
        },
        {
          text: T(`Separá cada barra por <b>${H.st}</b> con el estante <b>Color</b>.`, `Split each bar by <b>${H.st}</b> using the <b>Color</b> shelf.`),
          hint: T(`Arrastrá ${H.st} a Color: las barras quedan apiladas por estado.`, `Drag ${H.st} to Color: bars get stacked by status.`),
          check: withColor,
        },
        {
          text: T(`<b>Filtrá</b> para ver solo a <b>${focus}</b>.`, `<b>Filter</b> to show only <b>${focus}</b>.`),
          hint: T(`Arrastrá ${H.car} a Filtros y dejá tildado solo ${focus}.`, `Drag ${H.car} to Filters and leave only ${focus} checked.`),
          check: after(withColor, Ch.expect({ filter: { field: H.car, values: [focus] } })),
        },
        {
          text: T(`❓ Para ${focus}, ¿qué región tiene <b>más envíos demorados</b>?`, `❓ For ${focus}, which region has the <b>most delayed shipments</b>?`),
          placeholder: T('Región', 'Region'),
          hint: T(`Mirá el color de "${sts[1]}" en cada barra (o pasá el mouse).`, `Look at the "${sts[1]}" color in each bar (or hover).`),
          answer: V.answerText([worst]),
        },
      ],
      tips: [
        T('Color agrega una segunda dimensión sin hacer otro gráfico.', 'Color adds a second dimension without making another chart.'),
        T('Los filtros muestran un subconjunto: el resto de los datos sigue ahí.', 'Filters show a subset: the rest of the data is still there.'),
      ],
      feedback: T(`Con esto ${focus} no tiene cómo discutir los números. ¡Gracias!`, `With this, ${focus} can't argue with the numbers. Thanks!`),
      solution: {
        chart: { mark: 'bar', columns: { field: H.reg }, rows: { field: Ch.COUNT_FIELD, agg: 'COUNT' }, color: H.st, filter: { field: H.car, values: [focus] }, sort: 'none', title: '', labels: false },
        answers: { 3: worst },
      },
    };
  });
})();
