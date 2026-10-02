/*
 * Analyst Adventure — Nivel 12 (etapa Semi-Senior): estadística para explicar por qué pasó algo.
 * Promedio vs mediana, dispersión (desvío estándar), valores atípicos, correlación (y por qué
 * no es causalidad) y descomponer una variación por segmentos.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const C = AA.Content;
  const V = AA.V;
  const F = AA.Formula;
  const T = (es, en) => AA.T(es, en);
  const { REGIONS, CARRIERS, AREAS } = C.DATA;
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const mean = (a) => sum(a) / a.length;
  const sd = (a) => {
    const m = mean(a);
    return Math.sqrt(sum(a.map((x) => (x - m) * (x - m))) / (a.length - 1));
  };
  const median = (a) => {
    const s = [...a].sort((x, y) => x - y);
    const k = Math.floor(s.length / 2);
    return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2;
  };
  const correl = (x, y) => {
    const mx = mean(x);
    const my = mean(y);
    let a = 0;
    let b = 0;
    let c = 0;
    x.forEach((v, i) => {
      a += (v - mx) * (y[i] - my);
      b += (v - mx) * (v - mx);
      c += (y[i] - my) * (y[i] - my);
    });
    return a / Math.sqrt(b * c);
  };
  const fn = (n) => AA.fnName(n);
  const pct = (x) => (Math.round(x * 1000) / 10).toLocaleString('en-US') + '%';

  C.module({
    id: 'mod12',
    title: { es: 'Estadística: ¿por qué pasó?', en: 'Statistics: why did it happen?' },
    xp: 150,
    tier: 2,
    skills: ['meanMedian', 'spread', 'outliers', 'correlation', 'decompose'],
    templates: ['m12_median', 'm12_spread', 'm12_outliers', 'm12_correl', 'm12_why'],
    seeds: [1201, 1202, 1203, 1204, 1205],
    intro: {
      es: '¡Bienvenida a la etapa Semi-Senior! Un Junior cuenta <b>qué</b> pasó. Un Semi-Senior explica <b>por qué</b>. Para eso necesitás un poco de estadística: tranqui, nada de fórmulas raras, solo las ideas que más se usan.',
      en: 'Welcome to the Mid-level stage! A Junior reports <b>what</b> happened. A Mid-level analyst explains <b>why</b>. For that you need a bit of statistics: relax, no weird formulas, just the ideas used the most.',
    },
    skillDefs: {
      meanMedian: {
        title: { es: 'Promedio vs. mediana', en: 'Mean vs. median' },
        say: {
          es: 'El <b>promedio</b> se deja arrastrar por valores extremos: dos sueldos de gerencia lo inflan. La <b>mediana</b> es el valor del medio y no se mueve con los extremos. Para "lo típico" (sueldos, tiempos, precios de casas) suele ser mejor la mediana.',
          en: 'The <b>mean</b> gets dragged by extreme values: two executive salaries inflate it. The <b>median</b> is the middle value and doesn\'t move with extremes. For "typical" values (salaries, times, house prices) the median is usually better.',
        },
        fns: ['MEDIANA', 'PROMEDIO'],
        tip: { es: 'Si promedio y mediana están muy lejos, hay valores extremos: miralos.', en: 'If mean and median are far apart, there are extreme values: look at them.' },
      },
      spread: {
        title: { es: 'Dispersión: el desvío estándar', en: 'Spread: standard deviation' },
        say: {
          es: 'Dos transportistas pueden tardar 4 días en promedio, pero uno siempre tarda 4 y el otro a veces 1 y a veces 9. El <b>desvío estándar</b> (<code>DESVEST</code>) mide esa variabilidad. Dividido por el promedio da el <b>coeficiente de variación</b>, útil para comparar.',
          en: 'Two carriers can average 4 days, but one always takes 4 and the other sometimes 1 and sometimes 9. The <b>standard deviation</b> (<code>STDEV</code>) measures that variability. Divided by the mean it gives the <b>coefficient of variation</b>, useful for comparing.',
        },
        fns: ['DESVEST'],
        tip: { es: 'Para un cliente, a veces importa más la previsibilidad que la velocidad promedio.', en: 'For a customer, predictability sometimes matters more than average speed.' },
      },
      outliers: {
        title: { es: 'Valores atípicos', en: 'Outliers' },
        say: {
          es: 'Un valor <b>atípico</b> está muy lejos del resto. Una regla simple: más de 2 desvíos del promedio, <code>=ABS(C2-$G$1)>2*$G$2</code>. Un atípico puede ser un error de carga, un fraude o un caso real importante: <b>investigalo</b> antes de borrarlo.',
          en: 'An <b>outlier</b> is far from the rest. A simple rule: more than 2 standard deviations from the mean, <code>=ABS(C2-$G$1)>2*$G$2</code>. An outlier can be a typo, fraud or a real important case: <b>investigate it</b> before deleting it.',
        },
        fns: ['ABS'],
        tip: { es: 'Borrar atípicos "porque molestan" es una de las formas más comunes de mentir con datos.', en: 'Deleting outliers "because they get in the way" is one of the most common ways to lie with data.' },
      },
      correlation: {
        title: { es: 'Correlación (no es causalidad)', en: 'Correlation (is not causation)' },
        say: {
          es: '<code>=COEF.DE.CORREL(B2:B30; C2:C30)</code> va de −1 a 1: cerca de 1, dos columnas suben juntas. Pero que se muevan juntas <b>no prueba que una cause la otra</b>: puede haber un tercer factor (la temporada, el clima) que mueve a ambas. Para probar causa se necesita un experimento.',
          en: '<code>=CORREL(B2:B30, C2:C30)</code> goes from −1 to 1: near 1, two columns rise together. But moving together <b>does not prove one causes the other</b>: a third factor (season, weather) may drive both. Proving cause needs an experiment.',
        },
        fns: ['COEF.DE.CORREL'],
        tip: { es: 'Las ventas de helado y los ahogamientos están correlacionados. El culpable es el verano.', en: 'Ice cream sales and drownings are correlated. The culprit is summer.' },
      },
      decompose: {
        title: { es: 'Descomponer una variación', en: 'Breaking down a change' },
        say: {
          es: 'Cuando algo sube o baja, partilo por segmentos (región, canal, producto) y calculá cuánto aporta cada uno a la variación total: <code>=D2/$D$7</code>. Casi siempre uno o dos segmentos explican la mayor parte. Ahí está el "por qué".',
          en: 'When something goes up or down, split it by segment (region, channel, product) and compute how much each one contributes to the total change: <code>=D2/$D$7</code>. Almost always one or two segments explain most of it. That\'s where the "why" is.',
        },
        tip: { es: 'Variación absoluta para saber cuánto pesa; variación % para saber qué tan grave es en ese segmento.', en: 'Absolute change to know how much it weighs; % change to know how bad it is in that segment.' },
      },
    },
  });

  // ---------------------------------------------------------------------------
  // Sueldo "típico": promedio vs mediana
  // ---------------------------------------------------------------------------
  C.register('m12_median', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [14, 18], [30, 38], [50, 60]);
    const areas = AREAS.map(C.L2);
    const people = C.people(r, n);
    let salaries;
    let avg;
    let above;
    do {
      salaries = people.map(() => r.step(450000, 1200000, 5000));
      salaries[r.int(0, n - 1)] = r.step(4500000, 7000000, 50000);
      salaries[r.int(0, n - 1)] = r.step(3800000, 6000000, 50000);
      avg = mean(salaries);
      above = salaries.filter((s) => s > avg).length;
    } while (above > n / 3 || above < 2);
    const med = median(salaries);
    const last = n + 1;
    return {
      from: 'paula',
      dept: 'rrhh',
      subject: T('¿Cuál es el sueldo típico de la empresa?', "What is the company's typical salary?"),
      file: T('sueldos.xlsx', 'salaries.xlsx'),
      email: T(
        '<p>Para una búsqueda laboral quiero publicar <b>"el sueldo típico"</b> de la empresa. Calculá el promedio y la mediana, y decime cuántas personas ganan <b>más que el promedio</b>. Algo me dice que el promedio engaña.</p>',
        '<p>For a job posting I want to publish the company\'s <b>"typical salary"</b>. Compute the mean and the median, and tell me how many people earn <b>more than the mean</b>. Something tells me the mean is misleading.</p>'
      ),
      sheet: {
        cols: 8,
        rows: n + 4,
        colWidths: [170, 130, 120, 30, 260, 130, 50, 50],
        data: { at: 'A1', rows: [[T('Nombre', 'Name'), T('Área', 'Area'), T('Sueldo', 'Salary')], ...people.map((p, i) => [p, r.pick(areas), salaries[i]])] },
        cells: { E2: T('Sueldo promedio', 'Mean salary'), E3: T('Sueldo mediano', 'Median salary'), E4: T('Personas que ganan más que el promedio', 'People earning more than the mean') },
        locked: ['A1:C' + last, 'E2:E4'],
        header: ['A1:C1'],
        labels: ['E2:E4'],
        targets: ['F2:F4'],
        formats: { C: 'currency', F2: 'currency', F3: 'currency' },
        start: 'F2',
      },
      objectives: [
        { text: T('F2: <b>sueldo promedio</b>.', 'F2: <b>mean salary</b>.'), hint: `=${fn('PROMEDIO')}(C2:C${last})`, check: V.cell('F2', avg, { uses: ['PROMEDIO'] }) },
        { text: T('F3: <b>sueldo mediano</b>.', 'F3: <b>median salary</b>.'), hint: `=${fn('MEDIANA')}(C2:C${last})`, check: V.cell('F3', med, { uses: ['MEDIANA'] }) },
        {
          text: T('F4: cuántas personas ganan <b>más que el promedio</b>.', 'F4: how many people earn <b>more than the mean</b>.'),
          hint: `=${fn('CONTAR.SI')}(C2:C${last}; ">"&F2)`,
          check: V.cell('F4', above, { uses: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'] }),
        },
        {
          text: T('❓ ¿Qué número publicarías como "sueldo típico"?', '❓ Which number would you publish as the "typical salary"?'),
          choices: [T('El promedio: es el cálculo estándar.', 'The mean: it is the standard calculation.'), T('La mediana: no la distorsionan los pocos sueldos muy altos.', 'The median: the few very high salaries don\'t distort it.'), T('El sueldo más alto, para atraer candidatos.', 'The highest salary, to attract candidates.')],
          correct: 1,
          why: [T(`Solo ${above} de ${n} personas ganan más que el promedio: no es "típico", lo inflan dos sueldos de gerencia.`, `Only ${above} of ${n} people earn more than the mean: it's not "typical", two executive salaries inflate it.`), null, T('Eso sería engañar a los candidatos.', 'That would mislead candidates.')],
          hint: T('Mirá F4: ¿cuánta gente gana más que el promedio?', 'Look at F4: how many people earn more than the mean?'),
        },
      ],
      tips: [T('">"&F2 arma el criterio "mayor que" con el valor de F2.', '">"&F2 builds the "greater than" criterion with the value in F2.'), T('Ordená mentalmente: si la mitad gana menos que X, X es la mediana.', 'Think of it this way: if half earn less than X, X is the median.')],
      feedback: T('Publicamos la mediana con una nota. Mucho más honesto. ¡Gracias!', 'We published the median with a note. Much more honest. Thanks!'),
      solution: { cells: { F2: `=PROMEDIO(C2:C${last})`, F3: `=MEDIANA(C2:C${last})`, F4: `=CONTAR.SI(C2:C${last};">"&F2)` }, answers: { 3: 1 } },
    };
  });

  // ---------------------------------------------------------------------------
  // Mismo promedio, distinta confiabilidad (desvío estándar)
  // ---------------------------------------------------------------------------
  C.register('m12_spread', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [12, 15], [20, 26], [30, 40]);
    const cars = r.sample(CARRIERS, 3);
    let cols;
    let avgs;
    let sds;
    do {
      const gen = (base, spread) => Array.from({ length: n }, () => Math.max(1, Math.round(base + (r.next() + r.next() + r.next() - 1.5) * spread)));
      cols = [gen(4, 1.2), gen(4, 6), gen(5.5, 3)];
      const order = r.shuffle([0, 1, 2]);
      cols = order.map((i) => cols[i]);
      avgs = cols.map(mean);
      sds = cols.map(sd);
    } while (C.uniqueExtreme(sds, true) < 0 || C.uniqueExtreme(avgs, true) < 0 || C.uniqueExtreme(avgs, true) === C.uniqueExtreme(sds, true));
    const last = n + 1;
    const rA = n + 3;
    const rS = n + 4;
    const rC = n + 5;
    const reliable = C.uniqueExtreme(sds, true);
    const fastest = C.uniqueExtreme(avgs, true);
    return {
      from: 'ramiro',
      dept: 'logistica',
      subject: T('¿Con qué transportista nos quedamos?', 'Which carrier do we keep?'),
      file: T('dias_entrega.xlsx', 'delivery_days.xlsx'),
      email: T(
        `<p>Tenemos que renovar contrato con un solo transportista. Te paso los <b>días de entrega</b> de los últimos ${n} envíos de cada uno.</p><p>Los clientes se quejan más de la <b>incertidumbre</b> ("¿llega mañana o la semana que viene?") que de la demora. ¿Cuál es más <b>confiable</b>?</p>`,
        `<p>We need to renew the contract with a single carrier. Here are the <b>delivery days</b> of the last ${n} shipments of each.</p><p>Customers complain more about <b>uncertainty</b> ("does it arrive tomorrow or next week?") than delay. Which one is more <b>reliable</b>?</p>`
      ),
      sheet: {
        cols: 6,
        rows: n + 7,
        colWidths: [190, 120, 120, 120, 40, 40],
        data: { at: 'A1', rows: [[T('Envío', 'Shipment'), ...cars], ...Array.from({ length: n }, (_, i) => [`#${i + 1}`, cols[0][i], cols[1][i], cols[2][i]])] },
        cells: { ['A' + rA]: T('Promedio de días', 'Average days'), ['A' + rS]: T('Desvío estándar', 'Standard deviation'), ['A' + rC]: T('Coef. de variación', 'Coef. of variation') },
        locked: ['A1:D' + last, `A${rA}:A${rC}`],
        header: ['A1:D1'],
        labels: [`A${rA}:A${rC}`],
        targets: [`B${rA}:D${rC}`],
        formats: { [`B${rC}`]: 'percent', [`C${rC}`]: 'percent', [`D${rC}`]: 'percent', [`B${rA}`]: 'dec2', [`C${rA}`]: 'dec2', [`D${rA}`]: 'dec2', [`B${rS}`]: 'dec2', [`C${rS}`]: 'dec2', [`D${rS}`]: 'dec2' },
        start: 'B' + rA,
      },
      objectives: [
        { text: T(`Fila ${rA}: <b>promedio</b> de cada transportista.`, `Row ${rA}: each carrier's <b>average</b>.`), hint: `=${fn('PROMEDIO')}(B2:B${last})`, check: V.cells(['B', 'C', 'D'].map((c, i) => [c + rA, avgs[i]]), { uses: ['PROMEDIO'] }) },
        { text: T(`Fila ${rS}: <b>desvío estándar</b> de cada uno.`, `Row ${rS}: each one's <b>standard deviation</b>.`), hint: `=${fn('DESVEST')}(B2:B${last})`, check: V.cells(['B', 'C', 'D'].map((c, i) => [c + rS, sds[i]]), { uses: ['DESVEST'] }) },
        { text: T(`Fila ${rC}: <b>coeficiente de variación</b> = desvío ÷ promedio.`, `Row ${rC}: <b>coefficient of variation</b> = deviation ÷ average.`), hint: `=B${rS}/B${rA}`, check: V.cells(['B', 'C', 'D'].map((c, i) => [c + rC, sds[i] / avgs[i]]), { tol: 0.0005 }) },
        {
          text: T('❓ ¿Cuál es el <b>más rápido en promedio</b>?', '❓ Which one is the <b>fastest on average</b>?'),
          placeholder: T('Transportista', 'Carrier'),
          hint: T(`El menor de la fila ${rA}.`, `The lowest in row ${rA}.`),
          answer: V.answerText([cars[fastest]]),
        },
        {
          text: T('❓ Con lo que pide Ramiro, ¿con cuál te quedás?', '❓ Given what Ramiro asks, which one would you keep?'),
          choices: cars.map((c, i) => (i === reliable ? T(`${c}: tiene el menor desvío, sus entregas son las más previsibles.`, `${c}: it has the lowest deviation, its deliveries are the most predictable.`) : i === fastest ? T(`${c}: es el más rápido en promedio.`, `${c}: it is the fastest on average.`) : T(`${c}: está en el medio en todo.`, `${c}: it is in the middle on everything.`))),
          correct: reliable,
          why: cars.map((c, i) => (i === fastest ? T('Rápido en promedio, pero Ramiro pidió confiabilidad: mirá el desvío.', 'Fast on average, but Ramiro asked for reliability: look at the deviation.') : T('No es el más previsible: mirá el desvío estándar.', 'It is not the most predictable: look at the standard deviation.'))),
          hint: T('Confiable = poca variación.', 'Reliable = little variation.'),
        },
      ],
      tips: [T('Escribí la fórmula en B y copiala a la derecha (Ctrl+R).', 'Write the formula in B and copy it to the right (Ctrl+R).'), T('El desvío está en "días": un desvío de 3 significa que es común que llegue 3 días antes o después del promedio.', 'Deviation is in "days": a deviation of 3 means it often arrives 3 days earlier or later than average.')],
      feedback: T('Renovamos con el más previsible. Los reclamos ya bajaron. ¡Buena lectura de los datos!', 'We renewed with the most predictable one. Complaints already went down. Great reading of the data!'),
      solution: { fillRight: [[rA, 'B', 'D', `=PROMEDIO(B2:B${last})`], [rS, 'B', 'D', `=DESVEST(B2:B${last})`], [rC, 'B', 'D', `=B${rS}/B${rA}`]], answers: { 3: cars[fastest], 4: reliable } },
    };
  });

  // ---------------------------------------------------------------------------
  // Valores atípicos en viáticos
  // ---------------------------------------------------------------------------
  C.register('m12_outliers', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [18, 24], [34, 42], [55, 70]);
    const people = C.people(r, 10);
    let amounts;
    let m;
    let s;
    let flags;
    do {
      amounts = Array.from({ length: n }, () => r.step(2000, 9000, 50));
      const k = ctx.size === 'small' ? 2 : 3;
      for (let i = 0; i < k; i++) amounts[r.int(0, n - 1)] = r.step(38000, 65000, 100);
      m = mean(amounts);
      s = sd(amounts);
      flags = amounts.map((a) => Math.abs(a - m) > 2 * s);
    } while (flags.filter(Boolean).length < 2 || amounts.filter((a) => a > 30000).length !== flags.filter(Boolean).length || C.uniqueExtreme(amounts) < 0);
    const who = amounts.map(() => r.pick(people));
    const last = n + 1;
    const ATY = T('Atípico', 'Outlier');
    const NOR = 'Normal';
    const big = who[C.uniqueExtreme(amounts)];
    const count = flags.filter(Boolean).length;
    return {
      from: 'julia',
      dept: 'finanzas',
      subject: T('Viáticos que no me cierran', "Expense claims that don't look right"),
      file: T('viaticos.xlsx', 'expenses.xlsx'),
      email: T(
        '<p>Auditoría quiere que revisemos los viáticos del trimestre. No quiero acusar a nadie "a ojo": marcá con un criterio objetivo cuáles son <b>atípicos</b> (más de 2 desvíos del promedio).</p>',
        '<p>Audit wants us to review this quarter\'s expense claims. I don\'t want to accuse anyone "by eye": flag with an objective criterion which ones are <b>outliers</b> (more than 2 standard deviations from the mean).</p>'
      ),
      sheet: {
        cols: 8,
        rows: n + 4,
        colWidths: [80, 170, 110, 110, 30, 150, 110, 50],
        data: { at: 'A1', rows: [[T('Viático', 'Claim'), T('Empleado', 'Employee'), T('Monto', 'Amount'), T('¿Atípico?', 'Outlier?')], ...amounts.map((a, i) => ['V-' + (601 + i), who[i], a])] },
        cells: { F1: T('Promedio', 'Mean'), F2: T('Desvío estándar', 'Standard deviation') },
        locked: ['A1:C' + last, 'D1', 'F1:F2'],
        header: ['A1:D1'],
        labels: ['F1:F2'],
        targets: ['G1:G2', 'D2:D' + last],
        formats: { C: 'currency', G: 'currency' },
        start: 'G1',
      },
      objectives: [
        { text: T('G1 <b>promedio</b> y G2 <b>desvío estándar</b> de los montos.', 'G1 <b>mean</b> and G2 <b>standard deviation</b> of the amounts.'), hint: T(`G1: =PROMEDIO(C2:C${last}) · G2: =DESVEST(C2:C${last})`, `G1: =AVERAGE(C2:C${last}) · G2: =STDEV(C2:C${last})`), check: V.cells([['G1', m], ['G2', s]], { usesByRef: { G1: ['PROMEDIO'], G2: ['DESVEST'] } }) },
        {
          text: T(`<b>¿Atípico?</b> (D2:D${last}): "${ATY}" si se aleja más de 2 desvíos del promedio; si no, "${NOR}".`, `<b>Outlier?</b> (D2:D${last}): "${ATY}" if it is more than 2 deviations from the mean; otherwise "${NOR}".`),
          hint: `=${fn('SI')}(${fn('ABS')}(C2-$G$1)>2*$G$2; "${ATY}"; "${NOR}")`,
          check: V.column('D', 2, last, (row) => (flags[row - 2] ? ATY : NOR), { uses: ['SI'], dollarHint: true }),
        },
        { text: T('❓ ¿Cuántos viáticos son atípicos?', '❓ How many claims are outliers?'), placeholder: T('Cantidad', 'Count'), hint: `=${fn('CONTAR.SI')}(D2:D${last}; "${ATY}")`, answer: V.answerNumber(count, 0) },
        { text: T('❓ ¿Quién presentó el viático <b>más alto</b>?', '❓ Who submitted the <b>highest</b> claim?'), placeholder: T('Nombre', 'Name'), hint: T('El máximo de la columna C.', 'The maximum of column C.'), answer: V.answerText([big]) },
        {
          text: T('❓ ¿Qué hacés con los atípicos?', '❓ What do you do with the outliers?'),
          choices: [T('Los borro: arruinan el promedio.', 'I delete them: they ruin the average.'), T('Los mando a revisar con su comprobante: pueden ser un error de carga, un gasto real grande o un problema.', 'I send them for review with their receipts: they may be a typo, a real large expense or a problem.'), T('Los ignoro: son pocos.', 'I ignore them: there are few.')],
          correct: 1,
          why: [T('Borrar datos incómodos esconde justo lo que Auditoría quiere ver.', 'Deleting inconvenient data hides exactly what Audit wants to see.'), null, T('Pocos pero grandes: pueden ser la parte más importante del gasto.', 'Few but large: they may be the most important part of the spending.')],
          hint: T('Un atípico se investiga.', 'An outlier is investigated.'),
        },
      ],
      tips: [T('Fijá G1 y G2 con $ para copiar la fórmula.', 'Lock G1 and G2 with $ to copy the formula.'), T('ABS saca el signo: sirve para "lejos hacia arriba o hacia abajo".', 'ABS removes the sign: it works for "far up or far down".')],
      feedback: T('Auditoría ya pidió los comprobantes de esos viáticos. Criterio claro, sin acusar a nadie. 👏', 'Audit already requested the receipts for those claims. Clear criteria, no accusations. 👏'),
      solution: { cells: { G1: `=PROMEDIO(C2:C${last})`, G2: `=DESVEST(C2:C${last})` }, fill: [['D', 2, last, `=SI(ABS(C2-$G$1)>2*$G$2;"${ATY}";"${NOR}")`]], answers: { 2: String(count), 3: big, 4: 1 } },
    };
  });

  // ---------------------------------------------------------------------------
  // Correlación y un tercer factor (la temperatura)
  // ---------------------------------------------------------------------------
  C.register('m12_correl', (ctx) => {
    const r = ctx.rng;
    const n = ctx.size === 'large' ? 40 : ctx.size === 'medium' ? 30 : 20;
    let temp;
    let inv;
    let sales;
    let cIS;
    let cTS;
    let cTI;
    do {
      const phase = r.next() * 6;
      temp = Array.from({ length: n }, (_, i) => Math.round((22 + 9 * Math.sin(phase + i / 4) + (r.next() - 0.5) * 4) * 10) / 10);
      inv = temp.map((t) => r.step(0, 2000, 100) + Math.round(t * 400));
      sales = temp.map((t, i) => Math.round(8000 + t * 1500 + inv[i] * 0.15 + (r.next() - 0.5) * 6000));
      cIS = correl(inv, sales);
      cTS = correl(temp, sales);
      cTI = correl(temp, inv);
    } while (!(cIS > 0.6 && cTS > cIS + 0.03 && cTI > 0.6));
    const last = n + 1;
    return {
      from: 'tomas',
      dept: 'marketing',
      subject: T('¡La publicidad funciona! (¿o no?)', 'Advertising works! (or does it?)'),
      file: T('helados_semanal.xlsx', 'weekly_ice_cream.xlsx'),
      email: T(
        '<p>Mirá estos datos semanales de la línea de helados: cuando invertimos más en publicidad, vendemos más. Quiero ir a Dirección a pedir <b>el doble de presupuesto</b>. ¿Me ayudás a respaldarlo con números? Calculá las correlaciones.</p>',
        '<p>Look at this weekly data from the ice cream line: when we spend more on ads, we sell more. I want to go to Management and ask for <b>double the budget</b>. Can you help me back it up with numbers? Compute the correlations.</p>'
      ),
      sheet: {
        cols: 8,
        rows: n + 4,
        colWidths: [80, 120, 110, 110, 30, 290, 90, 50],
        data: { at: 'A1', rows: [[T('Semana', 'Week'), T('Temperatura °C', 'Temperature °C'), T('Inversión', 'Ad spend'), T('Ventas', 'Sales')], ...temp.map((t, i) => [i + 1, t, inv[i], sales[i]])] },
        cells: { F1: T('Correlación inversión – ventas', 'Correlation spend – sales'), F2: T('Correlación temperatura – ventas', 'Correlation temperature – sales'), F3: T('Correlación temperatura – inversión', 'Correlation temperature – spend') },
        locked: ['A1:D' + last, 'F1:F3'],
        header: ['A1:D1'],
        labels: ['F1:F3'],
        targets: ['G1:G3'],
        formats: { C: 'currency', D: 'currency', G: 'dec2' },
        start: 'G1',
      },
      objectives: [
        { text: T('G1: correlación entre <b>inversión y ventas</b>.', 'G1: correlation between <b>spend and sales</b>.'), hint: `=${fn('COEF.DE.CORREL')}(C2:C${last}; D2:D${last})`, check: V.cell('G1', cIS, { uses: ['COEF.DE.CORREL'], tol: 0.001 }) },
        { text: T('G2: correlación entre <b>temperatura y ventas</b>.', 'G2: correlation between <b>temperature and sales</b>.'), hint: `=${fn('COEF.DE.CORREL')}(B2:B${last}; D2:D${last})`, check: V.cell('G2', cTS, { uses: ['COEF.DE.CORREL'], tol: 0.001 }) },
        { text: T('G3: correlación entre <b>temperatura e inversión</b>.', 'G3: correlation between <b>temperature and spend</b>.'), hint: `=${fn('COEF.DE.CORREL')}(B2:B${last}; C2:C${last})`, check: V.cell('G3', cTI, { uses: ['COEF.DE.CORREL'], tol: 0.001 }) },
        {
          text: T('❓ ¿Qué le decís a Tomás?', '❓ What do you tell Tomás?'),
          choices: [
            T(`Que sí: una correlación de ${cIS.toFixed(2)} prueba que la publicidad causa las ventas.`, `Yes: a ${cIS.toFixed(2)} correlation proves advertising causes sales.`),
            T('Que la temperatura se mueve junto con las ventas Y con la inversión: el calor puede explicar las dos cosas. Para saber el efecto real de la publicidad hace falta un experimento (prueba A/B o por zonas).', 'Temperature moves with sales AND with spend: heat may explain both. To know the real effect of advertising we need an experiment (A/B test or by region).'),
            T('Que no hay ninguna relación entre publicidad y ventas.', 'That there is no relationship between advertising and sales.'),
          ],
          correct: 1,
          why: [T('Correlación no es causalidad: Marketing invierte más justo cuando hace calor.', 'Correlation is not causation: Marketing spends more exactly when it is hot.'), null, T(`Sí hay relación (${cIS.toFixed(2)}), pero no sabemos si es causa.`, `There is a relationship (${cIS.toFixed(2)}), but we don't know if it is causal.`)],
          hint: T('Mirá G3: ¿cuándo invierte más Marketing?', 'Look at G3: when does Marketing spend more?'),
        },
      ],
      tips: [T('Cerca de 1: suben juntas. Cerca de 0: no hay relación lineal.', 'Near 1: they rise together. Near 0: no linear relationship.'), T('Siempre preguntate: ¿hay un tercer factor que mueva a las dos?', 'Always ask: is there a third factor driving both?')],
      feedback: T('Ok, me convenciste: en vez del doble de presupuesto, pedimos hacer una prueba en dos zonas. Mucho más serio.', 'Ok, you convinced me: instead of double the budget, we\'re asking to test in two regions. Much more serious.'),
      solution: { cells: { G1: `=COEF.DE.CORREL(C2:C${last};D2:D${last})`, G2: `=COEF.DE.CORREL(B2:B${last};D2:D${last})`, G3: `=COEF.DE.CORREL(B2:B${last};C2:C${last})` }, answers: { 3: 1 } },
    };
  });

  // ---------------------------------------------------------------------------
  // ¿Por qué cayeron las ventas? Descomponer por región
  // ---------------------------------------------------------------------------
  C.register('m12_why', (ctx) => {
    const r = ctx.rng;
    const regs = REGIONS.map(C.L2);
    let prev;
    let cur;
    let diff;
    let culprit;
    do {
      prev = regs.map(() => r.step(80000, 260000, 1000));
      culprit = r.int(0, 4);
      cur = prev.map((p, i) => (i === culprit ? Math.round(p * (0.62 + r.next() * 0.12)) : Math.round(p * (0.95 + r.next() * 0.045))));
      diff = cur.map((c, i) => c - prev[i]);
    } while (sum(diff) >= 0 || C.uniqueExtreme(diff, true) !== culprit);
    const total = sum(diff);
    const share = diff.map((d) => d / total);
    const H = [T('Región', 'Region'), T('Mes anterior', 'Last month'), T('Mes actual', 'This month'), T('Variación $', 'Change $'), T('Variación %', 'Change %'), T('Peso en la caída', 'Share of drop')];
    return {
      from: 'marta',
      dept: 'analytics',
      subject: T('Las ventas cayeron: ¿por qué?', 'Sales dropped: why?'),
      file: T('ventas_comparacion.xlsx', 'sales_comparison.xlsx'),
      email: T(
        `<p>Dirección vio que las ventas cayeron ${pct(-total / sum(prev))} y ya hay teorías de todo tipo ("la inflación", "la competencia"…). Antes de opinar, quiero <b>datos</b>: descomponé la caída por región y decime dónde está concentrada.</p>`,
        `<p>Management saw sales drop ${pct(-total / sum(prev))} and there are all kinds of theories ("inflation", "competition"…). Before giving opinions, I want <b>data</b>: break the drop down by region and tell me where it is concentrated.</p>`
      ),
      sheet: {
        cols: 7,
        rows: 10,
        colWidths: [130, 120, 120, 120, 110, 130, 40],
        data: { at: 'A1', rows: [H, ...regs.map((g, i) => [g, prev[i], cur[i]]), ['Total']] },
        locked: ['A1:C6', 'A7', 'D1:F1'],
        header: ['A1:F1', 'A7:F7'],
        targets: ['B7:C7', 'D2:E7', 'F2:F6'],
        formats: { B: 'currency', C: 'currency', D: 'currency', E: 'percent', F: 'percent' },
        start: 'B7',
      },
      objectives: [
        { text: T('B7 y C7: <b>totales</b> de cada mes.', 'B7 and C7: each month\'s <b>totals</b>.'), hint: T('=SUMA(B2:B6)', '=SUM(B2:B6)'), check: V.cells([['B7', sum(prev)], ['C7', sum(cur)]], { uses: ['SUMA'] }) },
        { text: T('<b>Variación $</b> (D2:D7) = mes actual − mes anterior.', '<b>Change $</b> (D2:D7) = this month − last month.'), hint: '=C2-B2', check: V.column('D', 2, 7, (row) => (row === 7 ? total : diff[row - 2]), { refsFn: (row) => ['B' + row, 'C' + row] }) },
        { text: T('<b>Variación %</b> (E2:E7) = variación ÷ mes anterior.', '<b>Change %</b> (E2:E7) = change ÷ last month.'), hint: '=D2/B2', check: V.column('E', 2, 7, (row) => (row === 7 ? total / sum(prev) : diff[row - 2] / prev[row - 2]), { tol: 0.0005, refsFn: (row) => ['D' + row, 'B' + row] }) },
        { text: T('<b>Peso en la caída</b> (F2:F6) = variación de la región ÷ variación total.', '<b>Share of drop</b> (F2:F6) = region change ÷ total change.'), hint: '=D2/$D$7', check: V.column('F', 2, 6, (row) => share[row - 2], { tol: 0.0005, refsFn: (row) => ['D' + row, 'D7'], dollarHint: true }) },
        { text: T('❓ ¿Qué región <b>explica</b> la mayor parte de la caída?', '❓ Which region <b>explains</b> most of the drop?'), placeholder: T('Región', 'Region'), hint: T('El mayor % de la columna F.', 'The largest % in column F.'), answer: V.answerText([regs[culprit]]) },
        {
          text: T('❓ ¿Cuál es la conclusión para Dirección?', '❓ What is the conclusion for Management?'),
          choices: [
            T('Las ventas cayeron por la inflación.', 'Sales fell because of inflation.'),
            T(`La caída está concentrada en ${regs[culprit]}: explica el ${pct(share[culprit])} de la baja; el resto de las regiones está estable. Hay que investigar qué pasó ahí.`, `The drop is concentrated in ${regs[culprit]}: it explains ${pct(share[culprit])} of the decline; the other regions are stable. We need to investigate what happened there.`),
            T('Todas las regiones cayeron de forma pareja.', 'All regions dropped evenly.'),
          ],
          correct: 1,
          why: [T('Los datos no dicen nada de la inflación: si fuera eso, caerían todas las regiones.', 'The data says nothing about inflation: if that were it, every region would drop.'), null, T('Mirá la columna E: una región cae mucho más que las demás.', 'Look at column E: one region drops much more than the others.')],
          hint: T('¿Una región o todas?', 'One region or all of them?'),
        },
      ],
      tips: [T('Si el total bajó, D7 es negativo: dividir variaciones negativas entre sí da un % positivo de "peso".', 'If the total dropped, D7 is negative: dividing negative changes by each other gives a positive % "share".'), T('Una buena explicación es específica: "dónde" antes que "por qué".', 'A good explanation is specific: "where" before "why".')],
      feedback: T(`Con esto la discusión cambió: ahora estamos mirando qué pasó en ${regs[culprit]} (resultó ser un problema con un distribuidor).`, `This changed the conversation: now we're looking at what happened in ${regs[culprit]} (it turned out to be a distributor problem).`),
      solution: { cells: { B7: '=SUMA(B2:B6)', C7: '=SUMA(C2:C6)' }, fill: [['D', 2, 7, '=C2-B2'], ['E', 2, 7, '=D2/B2'], ['F', 2, 6, '=D2/$D$7']], answers: { 4: regs[culprit], 5: 1 } },
    };
  });
})();
