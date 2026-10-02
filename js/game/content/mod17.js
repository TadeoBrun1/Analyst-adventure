/*
 * Analyst Adventure — Nivel 17 (etapa Senior): pruebas A/B.
 * Tasa de conversión por variante, lift, significancia con un puntaje z simple, métricas de
 * resguardo, resultados por segmento y diseño del experimento (tamaño de muestra y duración).
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const C = AA.Content;
  const V = AA.V;
  const F = AA.Formula;
  const T = (es, en) => AA.T(es, en);
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const P = (name) => F.sheetPrefix(name);
  const fn = (n) => AA.fnName(n);
  const pct = (x) => (Math.round(x * 1000) / 10).toLocaleString('en-US') + '%';

  C.module({
    id: 'mod17',
    title: { es: 'Pruebas A/B', en: 'A/B tests' },
    xp: 200,
    tier: 3,
    skills: ['abWhat', 'abRate', 'abSignif', 'abPitfalls'],
    templates: ['m17_basic', 'm17_notsig', 'm17_guardrail', 'm17_segments', 'm17_design'],
    seeds: [1701, 1702, 1703, 1704, 1705],
    intro: {
      es: '¿Te acordás de la correlación entre publicidad y ventas, que no probaba nada? La forma de saber si algo <b>causa</b> un resultado es un <b>experimento</b>. En las empresas digitales se llama <b>prueba A/B</b>, y un Senior tiene que saber diseñarla y leerla sin engañarse.',
      en: 'Remember the correlation between advertising and sales that proved nothing? The way to know whether something <b>causes</b> a result is an <b>experiment</b>. In digital companies it\'s called an <b>A/B test</b>, and a Senior must know how to design and read one without fooling themselves.',
    },
    skillDefs: {
      abWhat: {
        title: { es: 'Qué es una prueba A/B', en: 'What an A/B test is' },
        say: {
          es: 'Se reparte a los usuarios <b>al azar</b> en dos grupos: <b>A</b> (control, lo de siempre) y <b>B</b> (variante, con <b>un solo</b> cambio). Como lo único distinto es el cambio, si B convierte más, fue por el cambio. La <b>métrica principal</b> se decide <b>antes</b> de empezar.',
          en: 'Users are split <b>at random</b> into two groups: <b>A</b> (control, as usual) and <b>B</b> (variant, with <b>a single</b> change). Since the only difference is the change, if B converts more, it was because of the change. The <b>primary metric</b> is decided <b>before</b> starting.',
        },
        tip: { es: 'Al azar significa al azar: no "B para los clientes nuevos".', en: 'Random means random: not "B for new customers".' },
      },
      abRate: {
        title: { es: 'Conversión y lift', en: 'Conversion and lift' },
        say: {
          es: 'Por variante: <b>conversión</b> = conversiones ÷ visitantes. El <b>lift</b> es la mejora relativa de B sobre A: <code>=(C4-B4)/B4</code>. Un lift de 20% sobre una conversión de 4% lleva a 4,8%.',
          en: 'Per variant: <b>conversion</b> = conversions ÷ visitors. <b>Lift</b> is B\'s relative improvement over A: <code>=(C4-B4)/B4</code>. A 20% lift on a 4% conversion takes it to 4.8%.',
        },
        tip: { es: 'Lift relativo (%) no es lo mismo que diferencia en puntos (pp).', en: 'Relative lift (%) is not the same as a difference in points (pp).' },
      },
      abSignif: {
        title: { es: '¿Es real o es azar?', en: 'Is it real or chance?' },
        say: {
          es: 'Con pocos visitantes, B puede ganar por suerte. El <b>puntaje z</b> compara la diferencia con el "ruido": tasa conjunta <code>p=(convA+convB)/(visA+visB)</code>, error <code>=RAIZ(p*(1-p)*(1/visA+1/visB))</code> y <code>z=(tasaB−tasaA)/error</code>. Si <b>|z| ≥ 1,96</b>, la diferencia es <b>significativa</b> al 95%: es muy poco probable que sea azar.',
          en: 'With few visitors, B can win by luck. The <b>z-score</b> compares the difference with the "noise": pooled rate <code>p=(convA+convB)/(visA+visB)</code>, error <code>=SQRT(p*(1-p)*(1/visA+1/visB))</code> and <code>z=(rateB−rateA)/error</code>. If <b>|z| ≥ 1.96</b>, the difference is <b>significant</b> at 95%: very unlikely to be chance.',
        },
        fns: ['RAIZ', 'ABS'],
        tip: { es: 'No significativo no quiere decir "B no sirve": quiere decir "todavía no lo sabemos".', en: 'Not significant doesn\'t mean "B doesn\'t work": it means "we don\'t know yet".' },
      },
      abPitfalls: {
        title: { es: 'Las trampas', en: 'The pitfalls' },
        say: {
          es: '<b>1)</b> Cortar la prueba apenas "da significativo" (hay que esperar el tamaño planeado). <b>2)</b> Mirar 20 métricas hasta que una gane. <b>3)</b> Ignorar las <b>métricas de resguardo</b> (más ventas pero menos ingreso). <b>4)</b> No mirar <b>segmentos</b>: B puede ganar en total y perder en celulares.',
          en: '<b>1)</b> Stopping the test as soon as it "turns significant" (you must wait for the planned size). <b>2)</b> Looking at 20 metrics until one wins. <b>3)</b> Ignoring <b>guardrail metrics</b> (more sales but less revenue). <b>4)</b> Not looking at <b>segments</b>: B can win overall and lose on mobile.',
        },
        tip: { es: 'Regla práctica de tamaño: visitantes por grupo ≈ 16 × p × (1−p) ÷ (mejora mínima)².', en: 'Rule of thumb for size: visitors per group ≈ 16 × p × (1−p) ÷ (minimum improvement)².' },
      },
    },
  });

  // Genera días × variante con las tasas dadas.
  function abData(r, days, perDay, pA, pB, extra) {
    const rows = [];
    for (let d = 1; d <= days; d++) {
      for (const [v, p] of [['A', pA], ['B', pB]]) {
        const vis = perDay();
        let conv = 0;
        for (let k = 0; k < vis; k++) if (r.next() < p) conv++;
        rows.push([d, v, vis, conv, ...(extra ? [extra(v, conv)] : [])]);
      }
    }
    return rows;
  }
  function stats(rows) {
    const vA = sum(rows.filter((x) => x[1] === 'A').map((x) => x[2]));
    const vB = sum(rows.filter((x) => x[1] === 'B').map((x) => x[2]));
    const cA = sum(rows.filter((x) => x[1] === 'A').map((x) => x[3]));
    const cB = sum(rows.filter((x) => x[1] === 'B').map((x) => x[3]));
    const rA = cA / vA;
    const rB = cB / vB;
    const p = (cA + cB) / (vA + vB);
    const se = Math.sqrt(p * (1 - p) * (1 / vA + 1 / vB));
    return { vA, vB, cA, cB, rA, rB, lift: (rB - rA) / rA, p, se, z: (rB - rA) / se };
  }

  // Hoja de resultado estándar (B = control, C = variante) y sus objetivos.
  function resultSheet(ds, last, s, extraRows) {
    const lab = {
      vis: T('Visitantes', 'Visitors'),
      conv: T('Conversiones', 'Conversions'),
      rate: T('Tasa de conversión', 'Conversion rate'),
      lift: T('Lift (B vs. A)', 'Lift (B vs. A)'),
      p: T('Tasa conjunta (p)', 'Pooled rate (p)'),
      se: T('Error estándar', 'Standard error'),
      z: T('Puntaje z', 'z-score'),
      sig: T('¿Significativo? (|z| ≥ 1,96)', 'Significant? (|z| ≥ 1.96)'),
    };
    const sheet = {
      name: T('Resultado', 'Result'),
      cols: 5,
      rows: 14,
      colWidths: [230, 120, 120, 40, 40],
      data: { at: 'A1', rows: [['', T('A (control)', 'A (control)'), T('B (variante)', 'B (variant)')], [lab.vis], [lab.conv], [lab.rate], [], [lab.lift], [lab.p], [lab.se], [lab.z], [lab.sig], ...(extraRows || [])] },
      locked: ['A1:C1', 'A2:A12'],
      header: ['A1:C1'],
      labels: ['A2:A12'],
      targets: ['B2:C4', 'B6:B10'],
      formats: { B2: 'int', C2: 'int', B3: 'int', C3: 'int', B4: 'percent', C4: 'percent', B6: 'percent', B7: 'percent', B8: 'dec2', B9: 'dec2' },
      start: 'B2',
    };
    sheet.formats.B8 = 'dec5';
    const objectives = [
      {
        text: T(`<b>Visitantes</b> y <b>conversiones</b> de cada variante (B2:C3), sumando la hoja ${ds}.`, `<b>Visitors</b> and <b>conversions</b> per variant (B2:C3), adding up the ${ds} sheet.`),
        hint: `=${fn('SUMAR.SI')}(${P(ds)}$B:$B; "A"; ${P(ds)}C:C)`,
        check: V.cells([['B2', s.vA], ['C2', s.vB], ['B3', s.cA], ['C3', s.cB]], { uses: ['SUMAR.SI', 'SUMAR.SI.CONJUNTO'] }),
      },
      { text: T('<b>Tasa de conversión</b> de cada una (B4:C4).', '<b>Conversion rate</b> of each (B4:C4).'), hint: '=B3/B2', check: V.cells([['B4', s.rA], ['C4', s.rB]], { tol: 0.00001, refs: undefined }) },
      { text: T('<b>Lift</b> (B6) = (tasa B − tasa A) ÷ tasa A.', '<b>Lift</b> (B6) = (rate B − rate A) ÷ rate A.'), hint: '=(C4-B4)/B4', check: V.cell('B6', s.lift, { refs: ['B4', 'C4'], tol: 0.0001 }) },
      {
        text: T('<b>Tasa conjunta</b> (B7), <b>error estándar</b> (B8) y <b>puntaje z</b> (B9).', '<b>Pooled rate</b> (B7), <b>standard error</b> (B8) and <b>z-score</b> (B9).'),
        hint: T(`B7: =(B3+C3)/(B2+C2) · B8: =RAIZ(B7*(1-B7)*(1/B2+1/C2)) · B9: =(C4-B4)/B8`, `B7: =(B3+C3)/(B2+C2) · B8: =SQRT(B7*(1-B7)*(1/B2+1/C2)) · B9: =(C4-B4)/B8`),
        check: V.cells([['B7', s.p], ['B8', s.se], ['B9', s.z]], { tol: 0.0001, usesByRef: { B8: ['RAIZ', 'POTENCIA'] } }),
      },
      { text: T('B10: ¿es <b>significativo</b>? (VERDADERO si |z| ≥ 1,96)', 'B10: is it <b>significant</b>? (TRUE if |z| ≥ 1.96)'), hint: '=ABS(B9)>=1.96', check: V.cell('B10', V.bool(Math.abs(s.z) >= 1.96), { refs: ['B9'] }) },
    ];
    const solution = {
      cells: { B2: `=SUMAR.SI(${P(ds)}$B:$B;"A";${P(ds)}C:C)`, C2: `=SUMAR.SI(${P(ds)}$B:$B;"B";${P(ds)}C:C)`, B3: `=SUMAR.SI(${P(ds)}$B:$B;"A";${P(ds)}D:D)`, C3: `=SUMAR.SI(${P(ds)}$B:$B;"B";${P(ds)}D:D)`, B4: '=B3/B2', C4: '=C3/C2', B6: '=(C4-B4)/B4', B7: '=(B3+C3)/(B2+C2)', B8: '=RAIZ(B7*(1-B7)*(1/B2+1/C2))', B9: '=(C4-B4)/B8', B10: '=ABS(B9)>=1.96' },
    };
    return { sheet, objectives, solution };
  }
  const dataSheet = (name, headers, rows) => ({
    name,
    cols: headers.length + 1,
    rows: rows.length + 3,
    colWidths: headers.map(() => 100).concat([40]),
    data: { at: 'A1', rows: [headers, ...rows] },
    locked: [`A1:${F.indexToCol(headers.length)}${rows.length + 3}`],
    header: [`A1:${F.indexToCol(headers.length - 1)}1`],
  });

  // ---------------------------------------------------------------------------
  // Prueba A/B clara: B gana y es significativo
  // ---------------------------------------------------------------------------
  C.register('m17_basic', (ctx) => {
    const r = ctx.rng;
    const days = ctx.size === 'large' ? 28 : ctx.size === 'medium' ? 21 : 14;
    let rows;
    let s;
    do {
      rows = abData(r, days, () => r.int(300, 500), 0.04, 0.049);
      s = stats(rows);
    } while (s.z < 2.3 || s.z > 5);
    const ds = T('Datos', 'Data');
    const res = resultSheet(ds, rows.length + 1, s);
    return {
      from: 'tomas',
      dept: 'marketing',
      subject: T('Resultado de la prueba del botón nuevo', 'Result of the new button test'),
      file: T('prueba_ab_boton.xlsx', 'ab_test_button.xlsx'),
      email: T(
        `<p>Durante ${days} días mostramos el botón de compra viejo (<b>A</b>) a la mitad de los visitantes y el nuevo (<b>B</b>) a la otra mitad, al azar. Los datos diarios están en <b>${ds}</b>.</p><p>¿B convierte más? ¿Es real o puede ser suerte? Necesito una recomendación.</p>`,
        `<p>For ${days} days we showed the old buy button (<b>A</b>) to half the visitors and the new one (<b>B</b>) to the other half, at random. Daily data is in <b>${ds}</b>.</p><p>Does B convert more? Is it real or could it be luck? I need a recommendation.</p>`
      ),
      sheets: [res.sheet, dataSheet(ds, [T('Día', 'Day'), T('Variante', 'Variant'), T('Visitantes', 'Visitors'), T('Conversiones', 'Conversions')], rows)],
      objectives: [
        ...res.objectives,
        {
          text: T('❓ ¿Qué recomendás?', '❓ What do you recommend?'),
          choices: [T(`Implementar B: convierte un ${pct(s.lift)} más y la diferencia es significativa (z = ${s.z.toFixed(2)}).`, `Roll out B: it converts ${pct(s.lift)} more and the difference is significant (z = ${s.z.toFixed(2)}).`), T('Seguir la prueba otro mes por las dudas.', 'Keep testing another month just in case.'), T('Quedarnos con A: el cambio es chico.', 'Keep A: the change is small.')],
          correct: 0,
          why: [null, T('Ya llegó al tamaño planeado y es significativo: seguir solo demora la mejora.', 'It already reached the planned size and is significant: continuing only delays the improvement.'), T(`Un ${pct(s.lift)} más de conversión, sostenido, es mucha plata.`, `${pct(s.lift)} more conversion, sustained, is a lot of money.`)],
          hint: T('Mirá B10.', 'Look at B10.'),
        },
      ],
      tips: [T('Las fórmulas de z están en la libreta (Nivel 17).', 'The z formulas are in the notebook (Level 17).'), T('|z| ≥ 1,96 → significativo al 95%.', '|z| ≥ 1.96 → significant at 95%.')],
      feedback: T('¡B ya está en producción! Y en el informe pusimos el z: Dirección confía más así.', 'B is live! And we put the z in the report: Management trusts it more that way.'),
      solution: Object.assign(res.solution, { answers: { 5: 0 } }),
    };
  });

  // ---------------------------------------------------------------------------
  // Lift grande pero no significativo (muestra chica)
  // ---------------------------------------------------------------------------
  C.register('m17_notsig', (ctx) => {
    const r = ctx.rng;
    const days = ctx.size === 'large' ? 10 : ctx.size === 'medium' ? 7 : 5;
    let rows;
    let s;
    do {
      rows = abData(r, days, () => r.int(40, 80), 0.05, 0.058);
      s = stats(rows);
    } while (!(s.lift > 0.1 && s.z > 0.4 && s.z < 1.6));
    const ds = T('Datos', 'Data');
    const res = resultSheet(ds, rows.length + 1, s);
    return {
      from: 'tomas',
      dept: 'marketing',
      subject: T('¡La landing nueva vende muchísimo más!', 'The new landing page sells way more!'),
      file: T('prueba_ab_landing.xlsx', 'ab_test_landing.xlsx'),
      email: T(
        `<p>¡Mirá! Después de ${days} días, la landing nueva (<b>B</b>) tiene un ${pct(s.lift)} más de conversión. Ya quiero implementarla para todos. ¿Me confirmás con los números?</p><p>Los datos están en <b>${ds}</b>.</p>`,
        `<p>Look! After ${days} days, the new landing page (<b>B</b>) has ${pct(s.lift)} more conversion. I want to roll it out to everyone. Can you confirm with the numbers?</p><p>The data is in <b>${ds}</b>.</p>`
      ),
      sheets: [res.sheet, dataSheet(ds, [T('Día', 'Day'), T('Variante', 'Variant'), T('Visitantes', 'Visitors'), T('Conversiones', 'Conversions')], rows)],
      objectives: [
        ...res.objectives,
        {
          text: T('❓ ¿Qué le respondés a Tomás?', '❓ What do you tell Tomás?'),
          choices: [T(`Implementarla ya: ${pct(s.lift)} más es muchísimo.`, `Roll it out now: ${pct(s.lift)} more is huge.`), T(`Todavía no se puede concluir: con tan pocos visitantes la diferencia puede ser azar (z = ${s.z.toFixed(2)}). Hay que seguir hasta el tamaño de muestra planeado.`, `We can't conclude yet: with so few visitors the difference may be chance (z = ${s.z.toFixed(2)}). We must keep going until the planned sample size.`), T('Descartar B: no funciona.', "Discard B: it doesn't work.")],
          correct: 1,
          why: [T('El lift es grande, pero con esta muestra puede ser suerte: mirá B10.', 'The lift is big, but with this sample it may be luck: look at B10.'), null, T('No significativo no prueba que B no sirva: solo que todavía no sabemos.', "Not significant doesn't prove B doesn't work: just that we don't know yet.")],
          hint: T('Mirá B10.', 'Look at B10.'),
        },
      ],
      tips: [T('Con pocos datos, las diferencias grandes aparecen por azar todo el tiempo.', 'With little data, big differences show up by chance all the time.'), T('Un lift sin significancia es una anécdota, no una conclusión.', 'A lift without significance is an anecdote, not a conclusion.')],
      feedback: T('Ok, la dejamos correr dos semanas más. Mejor eso que implementar algo por casualidad.', "Ok, we'll let it run two more weeks. Better that than rolling out something by chance."),
      solution: Object.assign(res.solution, { answers: { 5: 1 } }),
    };
  });

  // ---------------------------------------------------------------------------
  // Más conversiones, menos ingresos (métrica de resguardo)
  // ---------------------------------------------------------------------------
  C.register('m17_guardrail', (ctx) => {
    const r = ctx.rng;
    const days = ctx.size === 'large' ? 28 : ctx.size === 'medium' ? 21 : 14;
    let rows;
    let s;
    let revA;
    let revB;
    do {
      rows = abData(r, days, () => r.int(300, 500), 0.04, 0.05, (v, conv) => {
        let total = 0;
        for (let k = 0; k < conv; k++) total += v === 'A' ? r.step(80, 160, 1) : r.step(55, 115, 1);
        return total;
      });
      s = stats(rows);
      revA = sum(rows.filter((x) => x[1] === 'A').map((x) => x[4]));
      revB = sum(rows.filter((x) => x[1] === 'B').map((x) => x[4]));
    } while (s.z < 2.2 || revB / s.vB >= (revA / s.vA) * 0.95);
    const ds = T('Datos', 'Data');
    const res = resultSheet(ds, rows.length + 1, s, [[], [T('Ingresos', 'Revenue')], [T('Ingreso por visitante', 'Revenue per visitor')]]);
    res.sheet.targets.push('B12:C13');
    res.sheet.locked = ['A1:C1', 'A2:A13'];
    res.sheet.labels = ['A2:A13'];
    Object.assign(res.sheet.formats, { B12: 'currency', C12: 'currency', B13: 'currency', C13: 'currency' });
    res.sheet.rows = 15;
    res.solution.cells.B12 = `=SUMAR.SI(${P(ds)}$B:$B;"A";${P(ds)}E:E)`;
    res.solution.cells.C12 = `=SUMAR.SI(${P(ds)}$B:$B;"B";${P(ds)}E:E)`;
    res.solution.cells.B13 = '=B12/B2';
    res.solution.cells.C13 = '=C12/C2';
    return {
      from: 'bruno',
      dept: 'ventas',
      subject: T('El descuento automático: ¿lo dejamos?', 'The automatic discount: do we keep it?'),
      file: T('prueba_ab_descuento.xlsx', 'ab_test_discount.xlsx'),
      email: T(
        `<p>Probamos mostrar un <b>descuento automático</b> (B) contra el carrito normal (A). Ya sé que B vende más… pero Finanzas pregunta si <b>ganamos más plata</b>. En <b>${ds}</b> están visitantes, conversiones e ingresos por día.</p>`,
        `<p>We tested showing an <b>automatic discount</b> (B) against the normal cart (A). I know B sells more… but Finance asks whether we <b>make more money</b>. <b>${ds}</b> has visitors, conversions and revenue per day.</p>`
      ),
      sheets: [res.sheet, dataSheet(ds, [T('Día', 'Day'), T('Variante', 'Variant'), T('Visitantes', 'Visitors'), T('Conversiones', 'Conversions'), T('Ingresos', 'Revenue')], rows)],
      objectives: [
        ...res.objectives,
        {
          text: T('<b>Ingresos</b> (B12:C12) e <b>ingreso por visitante</b> (B13:C13) de cada variante.', '<b>Revenue</b> (B12:C12) and <b>revenue per visitor</b> (B13:C13) per variant.'),
          hint: T(`B12: =SUMAR.SI(${P(ds)}$B:$B; "A"; ${P(ds)}E:E) · B13: =B12/B2`, `B12: =SUMIF(${P(ds)}$B:$B, "A", ${P(ds)}E:E) · B13: =B12/B2`),
          check: V.cells([['B12', revA], ['C12', revB], ['B13', revA / s.vA], ['C13', revB / s.vB]], { tol: 0.01 }),
        },
        {
          text: T('❓ ¿Qué recomendás?', '❓ What do you recommend?'),
          choices: [T(`Implementar B: convierte ${pct(s.lift)} más y es significativo.`, `Roll out B: it converts ${pct(s.lift)} more and it's significant.`), T(`No implementar B así: vende más, pero cada visitante deja ${pct(1 - revB / s.vB / (revA / s.vA))} menos de ingreso. Probar un descuento más chico.`, `Don't roll out B as is: it sells more, but each visitor brings ${pct(1 - revB / s.vB / (revA / s.vA))} less revenue. Test a smaller discount.`), T('Seguir la prueba indefinidamente.', 'Keep the test running indefinitely.')],
          correct: 1,
          why: [T('Mirá la métrica de resguardo: el ingreso por visitante baja.', 'Look at the guardrail metric: revenue per visitor drops.'), null, T('Ya hay suficiente información para decidir.', 'There is already enough information to decide.')],
          hint: T('Compará B13 y C13.', 'Compare B13 and C13.'),
        },
      ],
      tips: [T('Una métrica de resguardo vigila que la mejora en una cosa no rompa otra.', "A guardrail metric makes sure improving one thing doesn't break another."), T('Más ventas con menos plata por venta puede ser peor negocio.', 'More sales with less money per sale can be worse business.')],
      feedback: T('Finanzas aplaudió. Probamos un descuento más chico la semana que viene. 💸', 'Finance applauded. We\'re testing a smaller discount next week. 💸'),
      solution: Object.assign(res.solution, { answers: { 6: 1 } }),
    };
  });

  // ---------------------------------------------------------------------------
  // B gana en total pero pierde en celulares (segmentos)
  // ---------------------------------------------------------------------------
  C.register('m17_segments', (ctx) => {
    const r = ctx.rng;
    const days = ctx.size === 'large' ? 21 : ctx.size === 'medium' ? 14 : 10;
    const devs = [T('Escritorio', 'Desktop'), T('Celular', 'Mobile')];
    let rows;
    let s;
    let seg;
    do {
      rows = [];
      for (let d = 1; d <= days; d++) {
        for (const [dev, pA, pB, lo, hi] of [[devs[0], 0.05, 0.068, 250, 400], [devs[1], 0.035, 0.03, 150, 260]]) {
          for (const [v, p] of [['A', pA], ['B', pB]]) {
            const vis = r.int(lo, hi);
            let conv = 0;
            for (let k = 0; k < vis; k++) if (r.next() < p) conv++;
            rows.push([d, dev, v, vis, conv]);
          }
        }
      }
      const agg = (dev, v) => {
        const sub = rows.filter((x) => (!dev || x[1] === dev) && x[2] === v);
        return sum(sub.map((x) => x[4])) / sum(sub.map((x) => x[3]));
      };
      s = { A: agg(null, 'A'), B: agg(null, 'B') };
      seg = devs.map((dv) => [agg(dv, 'A'), agg(dv, 'B')]);
    } while (!(s.B > s.A * 1.05 && seg[0][1] > seg[0][0] && seg[1][1] < seg[1][0] * 0.95));
    const ds = T('Datos', 'Data');
    const last = rows.length + 1;
    const sumifs = (valCol, devRef, varRef) => `SUMAR.SI.CONJUNTO(${P(ds)}$${valCol}:$${valCol};${P(ds)}$B:$B;${devRef};${P(ds)}$C:$C;${varRef})`;
    return {
      from: 'marta',
      dept: 'analytics',
      subject: T('El checkout nuevo: ¿para todos?', 'The new checkout: for everyone?'),
      file: T('prueba_ab_checkout.xlsx', 'ab_test_checkout.xlsx'),
      email: T(
        `<p>La prueba del checkout nuevo (B) terminó y en total gana. Antes de implementarlo quiero ver el resultado <b>por dispositivo</b>: los celulares tienen otra pantalla y otros usuarios. Los datos (día, dispositivo, variante) están en <b>${ds}</b>.</p>`,
        `<p>The new checkout test (B) is over and it wins overall. Before rolling it out I want to see the result <b>by device</b>: phones have a different screen and different users. The data (day, device, variant) is in <b>${ds}</b>.</p>`
      ),
      sheets: [
        {
          name: T('Resultado', 'Result'),
          cols: 5,
          rows: 8,
          colWidths: [180, 110, 110, 40, 40],
          data: { at: 'A1', rows: [[T('Conversión', 'Conversion'), 'A', 'B'], ['Total'], ...devs.map((d) => [d])] },
          locked: ['A1:C1', 'A2:A4'],
          header: ['A1:C1'],
          labels: ['A2:A4'],
          targets: ['B2:C4'],
          formats: { B: 'percent', C: 'percent' },
          start: 'B2',
        },
        dataSheet(ds, [T('Día', 'Day'), T('Dispositivo', 'Device'), T('Variante', 'Variant'), T('Visitantes', 'Visitors'), T('Conversiones', 'Conversions')], rows),
      ],
      objectives: [
        {
          text: T('<b>Conversión total</b> de A y B (B2:C2).', '<b>Total conversion</b> of A and B (B2:C2).'),
          hint: T(`=SUMAR.SI(${P(ds)}$C:$C; B$1; ${P(ds)}$E:$E)/SUMAR.SI(${P(ds)}$C:$C; B$1; ${P(ds)}$D:$D)`, `=SUMIF(${P(ds)}$C:$C, B$1, ${P(ds)}$E:$E)/SUMIF(${P(ds)}$C:$C, B$1, ${P(ds)}$D:$D)`),
          check: V.cells([['B2', s.A], ['C2', s.B]], { tol: 0.00001, uses: ['SUMAR.SI', 'SUMAR.SI.CONJUNTO'] }),
        },
        {
          text: T('<b>Conversión por dispositivo</b> (B3:C4), con SUMAR.SI.CONJUNTO y referencias mixtas.', '<b>Conversion by device</b> (B3:C4), with SUMIFS and mixed references.'),
          hint: `=${sumifs('E', '$A3', 'B$1').replace('SUMAR.SI.CONJUNTO', fn('SUMAR.SI.CONJUNTO'))}/${sumifs('D', '$A3', 'B$1').replace('SUMAR.SI.CONJUNTO', fn('SUMAR.SI.CONJUNTO'))}`,
          check: V.cells([['B3', seg[0][0]], ['C3', seg[0][1]], ['B4', seg[1][0]], ['C4', seg[1][1]]], { tol: 0.00001, uses: ['SUMAR.SI.CONJUNTO'] }),
        },
        {
          text: T('❓ ¿Qué recomendás?', '❓ What do you recommend?'),
          choices: [T('Implementar B para todos: gana en el total.', 'Roll out B for everyone: it wins overall.'), T(`Implementar B solo en ${devs[0].toLowerCase()} y revisar el diseño en ${devs[1].toLowerCase()}, donde convierte peor que A.`, `Roll out B only on ${devs[0].toLowerCase()} and review the design on ${devs[1].toLowerCase()}, where it converts worse than A.`), T('Descartar B: en algún segmento pierde.', 'Discard B: it loses in one segment.')],
          correct: 1,
          why: [T(`En ${devs[1].toLowerCase()} B convierte peor: implementarlo ahí pierde ventas.`, `On ${devs[1].toLowerCase()} B converts worse: rolling it out there loses sales.`), null, T(`En ${devs[0].toLowerCase()} gana claramente: descartarlo pierde esa mejora.`, `On ${devs[0].toLowerCase()} it clearly wins: discarding it loses that improvement.`)],
          hint: T('Compará B y C en cada fila.', 'Compare B and C in each row.'),
        },
      ],
      tips: [T('$A3 fija la columna del dispositivo; B$1 fija la fila de la variante: una sola fórmula para las cuatro celdas.', '$A3 locks the device column; B$1 locks the variant row: a single formula for all four cells.'), T('El total puede esconder segmentos que se comportan al revés.', 'The total can hide segments behaving the opposite way.')],
      feedback: T('Lo lanzamos solo en escritorio y el equipo de diseño ya está rehaciendo la versión móvil. ¡Bien visto!', 'We launched it on desktop only and the design team is already redoing the mobile version. Well spotted!'),
      solution: {
        cells: { B2: `=SUMAR.SI(${P(ds)}$C:$C;B$1;${P(ds)}$E:$E)/SUMAR.SI(${P(ds)}$C:$C;B$1;${P(ds)}$D:$D)`, C2: `=SUMAR.SI(${P(ds)}$C:$C;C$1;${P(ds)}$E:$E)/SUMAR.SI(${P(ds)}$C:$C;C$1;${P(ds)}$D:$D)` },
        fillBlock: [['B', 'C', 3, 4, `=${sumifs('E', '$A3', 'B$1')}/${sumifs('D', '$A3', 'B$1')}`]],
        answers: { 2: 1 },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Diseñar la prueba: tamaño de muestra, duración y reglas
  // ---------------------------------------------------------------------------
  C.register('m17_design', (ctx) => {
    const r = ctx.rng;
    const p = r.pick([0.02, 0.03, 0.04, 0.05, 0.06]);
    const mde = r.pick([0.004, 0.005, 0.006, 0.008, 0.01]);
    const daily = r.step(1500, 6000, 100);
    const perGroup = (16 * p * (1 - p)) / (mde * mde);
    const days = Math.ceil((2 * perGroup) / daily);
    return {
      from: 'tomas',
      dept: 'marketing',
      subject: T('Queremos probar un formulario más corto', 'We want to test a shorter form'),
      file: T('diseno_prueba.xlsx', 'test_design.xlsx'),
      email: T(
        `<p>Antes de lanzar la prueba del formulario corto, Marta quiere que la <b>diseñemos bien</b>: cuántos visitantes hacen falta, cuántos días tiene que durar y qué reglas vamos a seguir.</p><p>Hoy convertimos un <b>${pct(p)}</b>, queremos detectar mejoras de al menos <b>${(mde * 100).toFixed(1)} puntos</b> y tenemos <b>${daily.toLocaleString('en-US')}</b> visitantes por día.</p>`,
        `<p>Before launching the short-form test, Marta wants us to <b>design it properly</b>: how many visitors we need, how many days it must run and which rules we'll follow.</p><p>Today we convert <b>${pct(p)}</b>, we want to detect improvements of at least <b>${(mde * 100).toFixed(1)} points</b> and we have <b>${daily.toLocaleString('en-US')}</b> visitors per day.</p>`
      ),
      sheet: {
        cols: 4,
        rows: 9,
        colWidths: [320, 120, 40, 40],
        data: { at: 'A1', rows: [[T('Conversión actual (p)', 'Current conversion (p)'), p], [T('Mejora mínima a detectar (en puntos)', 'Minimum improvement to detect (points)'), mde], [T('Visitantes por día (total)', 'Visitors per day (total)'), daily], [], [T('Visitantes necesarios por grupo', 'Visitors needed per group')], [T('Días de prueba (redondeado hacia arriba)', 'Test days (rounded up)')]] },
        locked: ['A1:B3', 'A5:A6'],
        labels: ['A1:A3', 'A5:A6'],
        targets: ['B5:B6'],
        formats: { B1: 'percent', B2: 'percent', B3: 'int', B5: 'int' },
        start: 'B5',
      },
      objectives: [
        { text: T('B5: <b>visitantes por grupo</b> ≈ 16 × p × (1 − p) ÷ mejora².', 'B5: <b>visitors per group</b> ≈ 16 × p × (1 − p) ÷ improvement².'), hint: '=16*B1*(1-B1)/B2^2', check: V.cell('B5', perGroup, { refs: ['B1', 'B2'], tol: 0.5 }) },
        { text: T('B6: <b>días de prueba</b> = 2 grupos × B5 ÷ visitantes por día, redondeado hacia arriba.', 'B6: <b>test days</b> = 2 groups × B5 ÷ daily visitors, rounded up.'), hint: `=${fn('REDONDEAR.MAS')}(2*B5/B3; 0)`, check: V.cell('B6', days, { refs: ['B5', 'B3'], uses: ['REDONDEAR.MAS', 'ENTERO', 'REDONDEAR'] }) },
        {
          text: T('❓ ¿Cuál va a ser la <b>métrica principal</b>?', '❓ What will the <b>primary metric</b> be?'),
          choices: [T('La tasa de conversión (formularios completados ÷ visitantes), decidida antes de empezar.', 'Conversion rate (completed forms ÷ visitors), decided before starting.'), T('La que mejor dé al final de la prueba.', 'Whichever looks best at the end of the test.'), T('Todas: clics, tiempo en página, scroll… alguna va a ganar.', "All of them: clicks, time on page, scroll… one will win.")],
          correct: 0,
          why: [null, T('Elegir la métrica después de ver los datos es hacer trampa (aunque sea sin querer).', 'Choosing the metric after seeing the data is cheating (even unintentionally).'), T('Con 20 métricas, alguna "gana" por azar: es justamente la trampa.', 'With 20 metrics, one "wins" by chance: that\'s exactly the trap.')],
          hint: T('Una sola, decidida antes.', 'Just one, decided beforehand.'),
        },
        {
          text: T(`❓ Al día 3, B "gana" con z = 2,1. ¿Qué hacés?`, '❓ On day 3, B "wins" with z = 2.1. What do you do?'),
          choices: [T('Cortar la prueba e implementar B: ya es significativo.', 'Stop the test and roll out B: it\'s already significant.'), T(`Seguir hasta los ${days} días planeados: mirar antes de tiempo y cortar apenas "gana" multiplica los falsos positivos.`, `Keep going until the planned ${days} days: peeking and stopping as soon as it "wins" multiplies false positives.`), T('Agregar una variante C para aprovechar.', 'Add a variant C to make the most of it.')],
          correct: 1,
          why: [T('Con pocos días, el z sube y baja por azar: cortar en el primer pico es la trampa más común.', 'With few days, z goes up and down by chance: stopping at the first peak is the most common trap.'), null, T('Cambiar la prueba en el medio invalida el diseño.', 'Changing the test midway invalidates the design.')],
          hint: T('El tamaño se decide antes.', 'The size is decided beforehand.'),
        },
        {
          text: T('❓ ¿Cómo repartís a los visitantes entre A y B?', '❓ How do you split visitors between A and B?'),
          choices: [T('B a los clientes nuevos y A a los que ya compraron.', 'B for new customers and A for returning ones.'), T('Al azar, mitad y mitad, durante todo el período.', 'At random, half and half, for the whole period.'), T('A la primera semana y B la segunda.', 'A the first week and B the second.')],
          correct: 1,
          why: [T('Los grupos serían distintos de entrada: no sabrías si la diferencia es por el formulario o por el tipo de cliente.', "The groups would differ from the start: you wouldn't know if the difference is due to the form or the customer type."), null, T('Cada semana es distinta (feriados, campañas): mezclarías el efecto del tiempo.', 'Each week is different (holidays, campaigns): you would mix in the effect of time.')],
          hint: T('Lo único distinto tiene que ser el cambio.', 'The only difference must be the change.'),
        },
      ],
      tips: [T('Cuanto más chica la mejora que querés detectar, más visitantes necesitás (al cuadrado).', 'The smaller the improvement you want to detect, the more visitors you need (squared).'), T('^ eleva a una potencia: B2^2 es B2 al cuadrado.', '^ raises to a power: B2^2 is B2 squared.')],
      feedback: T('Diseño aprobado. Ahora la prueba tiene reglas claras antes de empezar: así nadie "acomoda" el resultado.', 'Design approved. Now the test has clear rules before it starts: that way nobody "adjusts" the result.'),
      solution: { cells: { B5: '=16*B1*(1-B1)/B2^2', B6: '=REDONDEAR.MAS(2*B5/B3;0)' }, answers: { 2: 0, 3: 1, 4: 1 } },
    };
  });
})();
