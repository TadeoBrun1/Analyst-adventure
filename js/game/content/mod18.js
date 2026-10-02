/*
 * Analyst Adventure — Nivel 18 (etapa Senior): trabajar con datos incompletos.
 * Medir cuánto falta, no rellenar con ceros, estimar con criterio (y marcarlo), escenarios
 * pesimista/optimista, sesgo de respuesta y decidir aunque falte información.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const C = AA.Content;
  const V = AA.V;
  const F = AA.Formula;
  const T = (es, en) => AA.T(es, en);
  const { REGIONS, MONTHS, CITIES } = C.DATA;
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const mean = (a) => sum(a) / a.length;
  const fn = (n) => AA.fnName(n);
  const pct = (x) => (Math.round(x * 1000) / 10).toLocaleString('en-US') + '%';
  const money = (x) => C.money(Math.round(x));

  C.module({
    id: 'mod18',
    title: { es: 'Datos incompletos', en: 'Incomplete data' },
    xp: 210,
    tier: 3,
    skills: ['missingWhy', 'missingImpact', 'impute', 'scenarios', 'decideAnyway'],
    templates: ['m18_survey', 'm18_impute', 'm18_scenarios', 'm18_bias', 'm18_decide'],
    seeds: [1801, 1802, 1803, 1804, 1805],
    intro: {
      es: 'En la vida real los datos <b>nunca</b> están completos: encuestas sin responder, sucursales que no mandan el dato, meses que se perdieron. Un Junior se traba; un Senior <b>decide igual</b>, siendo honesto sobre lo que no sabe.',
      en: "In real life data is <b>never</b> complete: unanswered surveys, branches that don't report, lost months. A Junior gets stuck; a Senior <b>decides anyway</b>, being honest about what they don't know.",
    },
    skillDefs: {
      missingWhy: {
        title: { es: '¿Por qué falta el dato?', en: 'Why is the data missing?' },
        say: {
          es: 'No es lo mismo un dato que falta <b>al azar</b> (se cayó el sistema un día) que uno que falta <b>por algo</b> (los clientes enojados no contestan la encuesta). En el segundo caso, lo que tenés <b>no representa a todos</b>.',
          en: "Data missing <b>at random</b> (the system went down one day) is not the same as data missing <b>for a reason</b> (angry customers don't answer the survey). In the second case, what you have <b>doesn't represent everyone</b>.",
        },
        tip: { es: 'Siempre informá la tasa de respuesta junto al resultado.', en: 'Always report the response rate along with the result.' },
      },
      missingImpact: {
        title: { es: 'Vacío no es cero', en: 'Blank is not zero' },
        say: {
          es: '<code>PROMEDIO</code> ignora las celdas vacías: promedia solo a quienes respondieron. Dividir la suma por el total de personas equivale a <b>contar los vacíos como 0</b> y hunde el resultado. Medí primero cuánto falta: <code>CONTAR</code> vs <code>CONTARA</code>.',
          en: '<code>AVERAGE</code> ignores blank cells: it averages only those who answered. Dividing the sum by all people is the same as <b>counting blanks as 0</b> and drags the result down. First measure how much is missing: <code>COUNT</code> vs <code>COUNTA</code>.',
        },
        fns: ['CONTAR', 'CONTARA'],
        tip: { es: 'Un 0 dice "no hubo nada"; un vacío dice "no sabemos".', en: 'A 0 says "there was nothing"; a blank says "we don\'t know".' },
      },
      impute: {
        title: { es: 'Estimar un dato faltante', en: 'Estimating a missing value' },
        say: {
          es: 'A veces conviene <b>estimar</b> el faltante con un criterio razonable: el promedio de los meses vecinos, la mediana de su grupo… <code>=SI(ESBLANCO(B5); PROMEDIO(B4; B6); B5)</code>. Regla de oro: <b>marcá siempre qué es estimado</b> y decí cómo lo estimaste.',
          en: 'Sometimes it makes sense to <b>estimate</b> the missing value with a reasonable criterion: the average of neighboring months, the median of its group… <code>=IF(ISBLANK(B5), AVERAGE(B4, B6), B5)</code>. Golden rule: <b>always flag what is estimated</b> and say how.',
        },
        fns: ['ESBLANCO'],
        tip: { es: 'Una estimación sin aviso es una mentira con buena intención.', en: 'An estimate without a warning is a well-meaning lie.' },
      },
      scenarios: {
        title: { es: 'Escenarios: pesimista, central y optimista', en: 'Scenarios: pessimistic, central and optimistic' },
        say: {
          es: 'Si no sabés un dato, calculá un <b>rango</b>: completá lo que falta con el peor valor razonable (pesimista), el típico (central) y el mejor (optimista). Un rango honesto vale más que un número falso preciso.',
          en: "If you don't know a value, compute a <b>range</b>: fill what's missing with the worst reasonable value (pessimistic), the typical one (central) and the best (optimistic). An honest range beats a precise false number.",
        },
        tip: { es: 'Preguntá: ¿cambia la decisión entre el peor y el mejor caso?', en: 'Ask: does the decision change between the worst and the best case?' },
      },
      decideAnyway: {
        title: { es: 'Decidir con incertidumbre', en: 'Deciding under uncertainty' },
        say: {
          es: 'Si la decisión es la misma en todos los escenarios, <b>decidí</b>: no hace falta el dato que falta. Si cambia, buscá la forma más barata de reducir la incertidumbre: pedir el dato, hacer un piloto, avanzar por etapas.',
          en: "If the decision is the same in every scenario, <b>decide</b>: you don't need the missing data. If it changes, find the cheapest way to reduce uncertainty: ask for the data, run a pilot, go in stages.",
        },
        tip: { es: 'Esperar a tener el 100% de los datos también es una decisión (y suele ser la peor).', en: 'Waiting for 100% of the data is also a decision (and often the worst one).' },
      },
    },
  });

  // ---------------------------------------------------------------------------
  // Encuesta de clima con preguntas sin responder
  // ---------------------------------------------------------------------------
  C.register('m18_survey', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [16, 22], [30, 40], [50, 64]);
    const qs = [T('Satisfacción', 'Satisfaction'), T('Liderazgo', 'Leadership'), T('Carga de trabajo', 'Workload')];
    let rows;
    let stat;
    do {
      rows = C.people(r, n).map((p) => {
        const mood = r.next();
        const s = Math.max(1, Math.min(5, Math.round(2 + mood * 3 + (r.next() - 0.5))));
        const l = r.chance(0.12) ? null : Math.max(1, Math.min(5, Math.round(1.5 + mood * 3 + (r.next() - 0.5) * 2)));
        // Los más disconformes con su carga de trabajo tienden a no responder esa pregunta.
        const wRaw = Math.max(1, Math.min(5, Math.round(1 + mood * 4)));
        const w = r.chance(wRaw <= 2 ? 0.7 : 0.15) ? null : wRaw;
        return [p, r.chance(0.05) ? null : s, l, w];
      });
      stat = [1, 2, 3].map((c) => {
        const vals = rows.map((x) => x[c]).filter((v) => v !== null);
        return { k: vals.length, rate: vals.length / n, avg: mean(vals), zero: sum(vals) / n };
      });
    } while (C.uniqueExtreme(stat.map((s) => s.rate), true) !== 2 || stat.some((s) => s.k < 3));
    const last = n + 1;
    const R = { k: n + 3, rate: n + 4, avg: n + 5, zero: n + 6 };
    const w = stat[2];
    return {
      from: 'paula',
      dept: 'rrhh',
      subject: T('Resultados de la encuesta de clima', 'Engagement survey results'),
      file: T('encuesta_clima.xlsx', 'engagement_survey.xlsx'),
      email: T(
        '<p>Terminó la encuesta de clima, pero no todos respondieron todas las preguntas. Necesito, por pregunta: <b>cuántos respondieron</b>, <b>% de respuesta</b> y el <b>promedio</b>. Nico ya me había mandado un "promedio" dividiendo por todos… ¿está bien?</p>',
        '<p>The engagement survey is over, but not everyone answered every question. I need, per question: <b>how many answered</b>, <b>response rate</b> and the <b>average</b>. Nico already sent me an "average" dividing by everyone… is that right?</p>'
      ),
      sheet: {
        cols: 6,
        rows: n + 8,
        colWidths: [260, 110, 110, 130, 40, 40],
        data: { at: 'A1', rows: [[T('Persona', 'Person'), ...qs], ...rows] },
        cells: { ['A' + R.k]: T('Respuestas', 'Responses'), ['A' + R.rate]: T('% de respuesta', 'Response rate'), ['A' + R.avg]: T('Promedio (solo quienes respondieron)', 'Average (respondents only)'), ['A' + R.zero]: T('Promedio de Nico (vacíos como 0)', "Nico's average (blanks as 0)") },
        locked: ['A1:D' + last, `A${R.k}:A${R.zero}`],
        header: ['A1:D1'],
        labels: [`A${R.k}:A${R.zero}`],
        targets: [`B${R.k}:D${R.zero}`],
        formats: { [`B${R.rate}`]: 'percent', [`C${R.rate}`]: 'percent', [`D${R.rate}`]: 'percent', [`B${R.avg}`]: 'dec2', [`C${R.avg}`]: 'dec2', [`D${R.avg}`]: 'dec2', [`B${R.zero}`]: 'dec2', [`C${R.zero}`]: 'dec2', [`D${R.zero}`]: 'dec2' },
        start: 'B' + R.k,
      },
      objectives: [
        { text: T(`Fila ${R.k}: <b>respuestas</b> de cada pregunta.`, `Row ${R.k}: <b>responses</b> per question.`), hint: `=${fn('CONTAR')}(B2:B${last})`, check: V.cells(['B', 'C', 'D'].map((c, i) => [c + R.k, stat[i].k]), { uses: ['CONTAR', 'CONTARA'] }) },
        { text: T(`Fila ${R.rate}: <b>% de respuesta</b> = respuestas ÷ personas.`, `Row ${R.rate}: <b>response rate</b> = responses ÷ people.`), hint: `=B${R.k}/${fn('CONTARA')}($A$2:$A$${last})`, check: V.cells(['B', 'C', 'D'].map((c, i) => [c + R.rate, stat[i].rate]), { tol: 0.0005 }) },
        { text: T(`Fila ${R.avg}: <b>promedio</b> de quienes respondieron.`, `Row ${R.avg}: <b>average</b> of respondents.`), hint: `=${fn('PROMEDIO')}(B2:B${last})`, check: V.cells(['B', 'C', 'D'].map((c, i) => [c + R.avg, stat[i].avg]), { uses: ['PROMEDIO'], tol: 0.001 }) },
        { text: T(`Fila ${R.zero}: el <b>"promedio" de Nico</b> (suma ÷ todas las personas), para comparar.`, `Row ${R.zero}: <b>Nico's "average"</b> (sum ÷ all people), to compare.`), hint: `=${fn('SUMA')}(B2:B${last})/${fn('CONTARA')}($A$2:$A$${last})`, check: V.cells(['B', 'C', 'D'].map((c, i) => [c + R.zero, stat[i].zero]), { tol: 0.001 }) },
        {
          text: T(`❓ ¿Qué informás para <b>${qs[2]}</b>?`, `❓ What do you report for <b>${qs[2]}</b>?`),
          choices: [
            T(`El promedio de quienes respondieron (${w.avg.toFixed(2)}), aclarando que solo respondió el ${pct(w.rate)}: puede que quienes están peor no hayan contestado.`, `The respondents' average (${w.avg.toFixed(2)}), noting only ${pct(w.rate)} answered: those worst off may not have answered.`),
            T(`El promedio de Nico (${w.zero.toFixed(2)}): incluye a todos.`, `Nico's average (${w.zero.toFixed(2)}): it includes everyone.`),
            T('Nada: con datos incompletos no se puede informar.', 'Nothing: incomplete data cannot be reported.'),
          ],
          correct: 0,
          why: [null, T('Cuenta como 0 a quien no respondió: inventa un dato y hunde el resultado.', "It counts non-respondents as 0: it invents data and drags the result down."), T('Se puede informar, con su tasa de respuesta y su advertencia.', 'It can be reported, with its response rate and a caveat.')],
          hint: T('Promedio honesto + cuánto falta.', 'Honest average + how much is missing.'),
        },
      ],
      tips: [T('CONTAR cuenta números (las respuestas); CONTARA cuenta lo que no está vacío (las personas).', 'COUNT counts numbers (answers); COUNTA counts non-empty cells (people).'), T('Mirá qué pregunta tiene la tasa de respuesta más baja: ¿por qué será?', 'See which question has the lowest response rate: why could that be?')],
      feedback: T('Informamos los promedios con su tasa de respuesta, y vamos a hacer entrevistas sobre carga de trabajo. Muy profesional.', "We reported the averages with their response rates, and we'll interview people about workload. Very professional."),
      solution: {
        fillRight: [[R.k, 'B', 'D', `=CONTAR(B2:B${last})`], [R.rate, 'B', 'D', `=B${R.k}/CONTARA($A$2:$A$${last})`], [R.avg, 'B', 'D', `=PROMEDIO(B2:B${last})`], [R.zero, 'B', 'D', `=SUMA(B2:B${last})/CONTARA($A$2:$A$${last})`]],
        answers: { 4: 0 },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Meses perdidos: estimar con los vecinos y marcarlo
  // ---------------------------------------------------------------------------
  C.register('m18_impute', (ctx) => {
    const r = ctx.rng;
    const months = MONTHS.map(C.L2);
    const base = r.step(80000, 150000, 1000);
    const sales = months.map((_, i) => Math.round(base * (1 + 0.04 * i + (r.next() - 0.5) * 0.15)));
    const pool = [2, 3, 4, 5, 6, 7, 8, 9, 10];
    let miss;
    do miss = r.sample(pool, ctx.size === 'small' ? 2 : 3);
    while (miss.some((m) => miss.includes(m + 1)));
    const shown = sales.map((s, i) => (miss.includes(i) ? null : s));
    const est = shown.map((s, i) => (s === null ? (shown[i - 1] + shown[i + 1]) / 2 : s));
    const EST = T('Estimado', 'Estimated');
    const REAL = T('Real', 'Actual');
    return {
      from: 'julia',
      dept: 'finanzas',
      subject: T('Faltan meses en el histórico de ventas', 'Months are missing in the sales history'),
      file: T('ventas_historico.xlsx', 'sales_history.xlsx'),
      email: T(
        `<p>Con la migración del sistema se perdieron ${miss.length} meses de ventas del año pasado. Necesito igual un <b>total anual</b> para el presupuesto.</p><p>Estimá los meses faltantes con el <b>promedio del mes anterior y el siguiente</b>, y marcá cuáles son estimados.</p>`,
        `<p>With the system migration we lost ${miss.length} months of last year's sales. I still need an <b>annual total</b> for the budget.</p><p>Estimate the missing months with the <b>average of the previous and next month</b>, and flag which ones are estimated.</p>`
      ),
      sheet: {
        cols: 8,
        rows: 16,
        colWidths: [80, 120, 140, 110, 30, 220, 130, 40],
        data: { at: 'A1', rows: [[T('Mes', 'Month'), T('Ventas', 'Sales'), T('Ventas (con estimados)', 'Sales (with estimates)'), T('Origen', 'Source')], ...months.map((m, i) => [m, shown[i]])] },
        cells: { F2: T('Total solo con datos reales', 'Total with actual data only'), F3: T('Total anual estimado', 'Estimated annual total') },
        locked: ['A1:B13', 'C1:D1', 'F2:F3'],
        header: ['A1:D1'],
        labels: ['F2:F3'],
        targets: ['C2:D13', 'G2:G3'],
        formats: { B: 'currency', C: 'currency', G: 'currency' },
        start: 'C2',
      },
      objectives: [
        {
          text: T('<b>Ventas con estimados</b> (C2:C13): el dato real si existe; si falta, el promedio del mes anterior y el siguiente.', '<b>Sales with estimates</b> (C2:C13): the actual value if it exists; if missing, the average of the previous and next month.'),
          hint: `=${fn('SI')}(${fn('ESBLANCO')}(B2); ${fn('PROMEDIO')}(B1; B3); B2)`,
          check: V.column('C', 2, 13, (row) => est[row - 2], { uses: ['ESBLANCO', 'SI'], tol: 0.01 }),
        },
        { text: T(`<b>Origen</b> (D2:D13): "${EST}" o "${REAL}".`, `<b>Source</b> (D2:D13): "${EST}" or "${REAL}".`), hint: `=${fn('SI')}(${fn('ESBLANCO')}(B2); "${EST}"; "${REAL}")`, check: V.column('D', 2, 13, (row) => (shown[row - 2] === null ? EST : REAL), { uses: ['SI'] }) },
        { text: T('G2: total con <b>datos reales</b> · G3: <b>total anual estimado</b>.', 'G2: total with <b>actual data</b> · G3: <b>estimated annual total</b>.'), hint: T('G2: =SUMA(B2:B13) · G3: =SUMA(C2:C13)', 'G2: =SUM(B2:B13) · G3: =SUM(C2:C13)'), check: V.cells([['G2', sum(shown.filter((x) => x !== null))], ['G3', sum(est)]], { uses: ['SUMA'] }) },
        {
          text: T('❓ ¿Cómo informás el total del año?', '❓ How do you report the annual total?'),
          choices: [
            T(`"Ventas del año: ${money(sum(shown.filter((x) => x !== null)))}" (la suma de lo que hay).`, `"Annual sales: ${money(sum(shown.filter((x) => x !== null)))}" (the sum of what we have).`),
            T(`"Ventas del año: ${money(sum(est))} (estimado: ${miss.length} meses se completaron con el promedio de los meses vecinos)."`, `"Annual sales: ${money(sum(est))} (estimated: ${miss.length} months were filled with the average of neighboring months)."`),
            T(`"Ventas del año: ${money(sum(est))}" sin aclarar nada, para no confundir.`, `"Annual sales: ${money(sum(est))}" with no caveat, to avoid confusion.`),
          ],
          correct: 1,
          why: [T('Subestima el año: faltan meses enteros.', 'It underestimates the year: whole months are missing.'), null, T('Si no aclarás que hay estimados, alguien lo va a tomar como un dato exacto.', "If you don't say there are estimates, someone will take it as an exact figure.")],
          hint: T('Número + cómo se estimó.', 'Number + how it was estimated.'),
        },
      ],
      tips: [T('ESBLANCO(B2) es VERDADERO si B2 está vacía.', 'ISBLANK(B2) is TRUE if B2 is empty.'), T('Los meses faltantes nunca son el primero ni el último: siempre tienen vecinos.', 'Missing months are never the first or last: they always have neighbors.')],
      feedback: T('Presupuesto armado con el total estimado y su aclaración. Auditoría ni preguntó: estaba todo explicado.', 'Budget built with the estimated total and its note. Audit didn\'t even ask: it was all explained.'),
      solution: { fill: [['C', 2, 13, '=SI(ESBLANCO(B2);PROMEDIO(B1;B3);B2)'], ['D', 2, 13, `=SI(ESBLANCO(B2);"${EST}";"${REAL}")`]], cells: { G2: '=SUMA(B2:B13)', G3: '=SUMA(C2:C13)' }, answers: { 3: 1 } },
    };
  });

  // ---------------------------------------------------------------------------
  // Sucursales sin informar stock: escenarios
  // ---------------------------------------------------------------------------
  C.register('m18_scenarios', (ctx) => {
    const r = ctx.rng;
    const nStores = ctx.size === 'large' ? 20 : ctx.size === 'medium' ? 16 : 12;
    const stores = r.sample(CITIES, Math.min(nStores, CITIES.length)).concat(Array.from({ length: Math.max(0, nStores - CITIES.length) }, (_, i) => `${T('Sucursal', 'Branch')} ${i + 1}`));
    const stock = stores.map(() => r.step(150, 900, 10));
    const nMiss = ctx.size === 'small' ? 3 : 4;
    const missIdx = r.sample([...Array(nStores).keys()], nMiss);
    const shown = stock.map((s, i) => (missIdx.includes(i) ? null : s));
    const known = shown.filter((x) => x !== null);
    const sumK = sum(known);
    const mn = Math.min(...known);
    const mx = Math.max(...known);
    const av = mean(known);
    const pes = sumK + nMiss * mn;
    const cen = sumK + nMiss * av;
    const opt = sumK + nMiss * mx;
    const robust = r.chance(0.5);
    const demand = robust ? Math.round((pes * (0.85 + r.next() * 0.1)) / 10) * 10 : Math.round(((pes + cen) / 2) / 10) * 10;
    const last = nStores + 1;
    return {
      from: 'ramiro',
      dept: 'logistica',
      subject: T('¿Alcanza el stock para la campaña?', 'Is there enough stock for the campaign?'),
      file: T('stock_sucursales.xlsx', 'branch_stock.xlsx'),
      email: T(
        `<p>Marketing quiere lanzar una campaña que necesita <b>${demand.toLocaleString('en-US')} unidades</b>. Pedí el stock a las sucursales, pero <b>${nMiss} no respondieron</b> y la decisión es hoy.</p><p>Armá escenarios con lo que tenemos y decime si avanzamos.</p>`,
        `<p>Marketing wants to launch a campaign that needs <b>${demand.toLocaleString('en-US')} units</b>. I asked the branches for their stock, but <b>${nMiss} didn't answer</b> and the decision is today.</p><p>Build scenarios with what we have and tell me whether we go ahead.</p>`
      ),
      sheet: {
        cols: 7,
        rows: Math.max(last + 3, 14),
        colWidths: [150, 120, 30, 260, 120, 40, 40],
        data: { at: 'A1', rows: [[T('Sucursal', 'Branch'), T('Stock informado', 'Reported stock')], ...stores.map((s, i) => [s, shown[i]])] },
        cells: {
          D2: T('Sucursales sin informar', 'Branches not reporting'),
          D3: T('Stock informado (total)', 'Reported stock (total)'),
          D4: T('Mínimo informado', 'Minimum reported'),
          D5: T('Promedio informado', 'Average reported'),
          D6: T('Máximo informado', 'Maximum reported'),
          D8: T('Escenario pesimista (faltantes = mínimo)', 'Pessimistic (missing = minimum)'),
          D9: T('Escenario central (faltantes = promedio)', 'Central (missing = average)'),
          D10: T('Escenario optimista (faltantes = máximo)', 'Optimistic (missing = maximum)'),
          D12: T('Demanda de la campaña', 'Campaign demand'),
          E12: demand,
        },
        locked: ['A1:B' + last, 'D2:D12', 'E12'],
        header: ['A1:B1'],
        labels: ['D2:D12'],
        targets: ['E2:E6', 'E8:E10'],
        formats: { E5: 'dec2' },
        start: 'E2',
      },
      objectives: [
        { text: T('E2: cuántas sucursales <b>no informaron</b>.', 'E2: how many branches <b>did not report</b>.'), hint: `=${fn('CONTAR.BLANCO')}(B2:B${last})`, check: V.cell('E2', nMiss, { uses: ['CONTAR.BLANCO', 'CONTAR.SI'] }) },
        { text: T('E3 a E6: <b>total, mínimo, promedio y máximo</b> informados.', 'E3 to E6: reported <b>total, minimum, average and maximum</b>.'), hint: T(`=SUMA(B2:B${last}) · =MIN(…) · =PROMEDIO(…) · =MAX(…)`, `=SUM(B2:B${last}) · =MIN(…) · =AVERAGE(…) · =MAX(…)`), check: V.cells([['E3', sumK], ['E4', mn], ['E5', av], ['E6', mx]], { usesByRef: { E3: ['SUMA'], E4: ['MIN'], E5: ['PROMEDIO'], E6: ['MAX'] } }) },
        { text: T('E8 a E10: los <b>tres escenarios</b> = informado + faltantes × (mínimo / promedio / máximo).', 'E8 to E10: the <b>three scenarios</b> = reported + missing × (minimum / average / maximum).'), hint: '=E3+E2*E4', check: V.cells([['E8', pes], ['E9', cen], ['E10', opt]], { tol: 0.5 }) },
        {
          text: T('❓ ¿Qué le decís a Ramiro?', '❓ What do you tell Ramiro?'),
          choices: [
            T('Avanzar con la campaña: alcanza incluso en el escenario pesimista.', 'Go ahead with the campaign: there is enough even in the pessimistic scenario.'),
            T('Depende de las sucursales que no informaron: antes de comprometer la campaña, pedirles el dato hoy (o reservar stock extra).', "It depends on the branches that didn't report: before committing to the campaign, get their data today (or reserve extra stock)."),
            T('No se puede decidir hasta que informen todas.', "We can't decide until every branch reports."),
          ],
          correct: robust ? 0 : 1,
          why: robust
            ? [null, T('Mirá el pesimista: ya alcanza. El dato que falta no cambia la decisión.', "Look at the pessimistic case: it's already enough. The missing data doesn't change the decision."), T('No hace falta esperar: en todos los escenarios alcanza.', "No need to wait: it's enough in every scenario.")]
            : [T('En el escenario pesimista no alcanza: es arriesgado.', "In the pessimistic scenario it isn't enough: it's risky."), null, T('No hace falta todo: alcanza con el dato de las que faltan, o con un plan B.', 'You don\'t need everything: the missing branches\' data, or a plan B, is enough.')],
          hint: T('Compará la demanda (E12) con los escenarios.', 'Compare demand (E12) with the scenarios.'),
        },
      ],
      tips: [T('Si la decisión es la misma en todos los escenarios, el dato faltante no importa.', "If the decision is the same in every scenario, the missing data doesn't matter."), T('MIN, PROMEDIO y MAX ignoran las celdas vacías.', 'MIN, AVERAGE and MAX ignore blank cells.')],
      feedback: robust ? T('Lanzamos la campaña sin esperar. Decisión rápida y bien fundada. 🚀', 'We launched the campaign without waiting. Fast, well-founded decision. 🚀') : T('Llamamos a las sucursales que faltaban y en una hora teníamos el dato. Buena decisión no apurarse.', 'We called the missing branches and had the data within an hour. Good call not to rush.'),
      solution: { cells: { E2: `=CONTAR.BLANCO(B2:B${last})`, E3: `=SUMA(B2:B${last})`, E4: `=MIN(B2:B${last})`, E5: `=PROMEDIO(B2:B${last})`, E6: `=MAX(B2:B${last})`, E8: '=E3+E2*E4', E9: '=E3+E2*E5', E10: '=E3+E2*E6' }, answers: { 3: robust ? 0 : 1 } },
    };
  });

  // ---------------------------------------------------------------------------
  // Sesgo de respuesta: promedio simple vs ponderado
  // ---------------------------------------------------------------------------
  C.register('m18_bias', (ctx) => {
    const r = ctx.rng;
    const regs = REGIONS.map(C.L2);
    let clients;
    let resp;
    let score;
    let simple;
    let weighted;
    do {
      clients = regs.map(() => r.step(400, 3000, 50));
      score = regs.map(() => Math.round((2.4 + r.next() * 2.4) * 10) / 10);
      resp = clients.map((c, i) => Math.round(c * (score[i] > 3.8 ? 0.25 + r.next() * 0.15 : 0.04 + r.next() * 0.06)));
      simple = sum(resp.map((n, i) => n * score[i])) / sum(resp);
      weighted = sum(clients.map((n, i) => n * score[i])) / sum(clients);
    } while (simple - weighted < 0.25 || resp.some((x) => x < 5));
    const rate = resp.map((x, i) => x / clients[i]);
    return {
      from: 'tadeo',
      dept: 'marketing',
      subject: T('¡La satisfacción subió a 4!', 'Satisfaction went up to 4!'),
      file: T('satisfaccion_regiones.xlsx', 'regional_satisfaction.xlsx'),
      email: T(
        `<p>La encuesta de satisfacción dio <b>${simple.toFixed(2)} sobre 5</b> en promedio. Quiero anunciarlo en la reunión de mañana.</p><p>Te paso el detalle por región (clientes, respuestas y promedio de cada una). ¿Me das el OK?</p>`,
        `<p>The satisfaction survey averaged <b>${simple.toFixed(2)} out of 5</b>. I want to announce it at tomorrow's meeting.</p><p>Here's the breakdown by region (customers, responses and each region's average). Do I have your OK?</p>`
      ),
      sheet: {
        cols: 8,
        rows: 10,
        colWidths: [110, 100, 110, 120, 130, 30, 300, 90],
        data: { at: 'A1', rows: [[T('Región', 'Region'), T('Clientes', 'Customers'), T('Respuestas', 'Responses'), T('Satisfacción', 'Satisfaction'), T('Tasa de respuesta', 'Response rate')], ...regs.map((g, i) => [g, clients[i], resp[i], score[i]])] },
        cells: { G2: T('Promedio de todas las respuestas (el de Tadeo)', 'Average of all responses (Tadeo\'s)'), G3: T('Promedio ponderado por clientes', 'Average weighted by customers') },
        locked: ['A1:D6', 'E1', 'G2:G3'],
        header: ['A1:E1'],
        labels: ['G2:G3'],
        targets: ['E2:E6', 'H2:H3'],
        formats: { E: 'percent', H: 'dec2' },
        start: 'E2',
      },
      objectives: [
        { text: T('<b>Tasa de respuesta</b> por región (E2:E6) = respuestas ÷ clientes.', '<b>Response rate</b> per region (E2:E6) = responses ÷ customers.'), hint: '=C2/B2', check: V.column('E', 2, 6, (row) => rate[row - 2], { tol: 0.0005, refsFn: (row) => ['C' + row, 'B' + row] }) },
        { text: T('H2: promedio de <b>todas las respuestas</b> (ponderado por respuestas).', 'H2: average of <b>all responses</b> (weighted by responses).'), hint: `=${fn('SUMAPRODUCTO')}(C2:C6; D2:D6)/${fn('SUMA')}(C2:C6)`, check: V.cell('H2', simple, { uses: ['SUMAPRODUCTO'], tol: 0.001 }) },
        { text: T('H3: promedio <b>ponderado por clientes</b> (lo que opinaría toda la base).', 'H3: average <b>weighted by customers</b> (what the whole base would say).'), hint: `=${fn('SUMAPRODUCTO')}(B2:B6; D2:D6)/${fn('SUMA')}(B2:B6)`, check: V.cell('H3', weighted, { uses: ['SUMAPRODUCTO'], tol: 0.001 }) },
        {
          text: T('❓ ¿Qué le decís a Tadeo?', '❓ What do you tell Tadeo?'),
          choices: [
            T(`Que anuncie ${simple.toFixed(2)}: es el promedio de las respuestas.`, `Announce ${simple.toFixed(2)}: it's the average of the responses.`),
            T(`Que las regiones más conformes respondieron mucho más: ponderando por clientes da ${weighted.toFixed(2)}. Conviene informar ese número y aclarar la tasa de respuesta.`, `The happiest regions answered much more: weighting by customers gives ${weighted.toFixed(2)}. Better to report that number and note the response rate.`),
            T('Que la encuesta no sirve y hay que tirarla.', 'That the survey is useless and should be thrown away.'),
          ],
          correct: 1,
          why: [T('Ese promedio está inflado: sobre-representa a las regiones que más contestaron.', 'That average is inflated: it over-represents the regions that answered most.'), null, T('Sirve: hay que corregir el sesgo, no descartarla.', 'It is useful: correct the bias, don\'t discard it.')],
          hint: T('Compará la tasa de respuesta y la satisfacción de cada región.', "Compare each region's response rate and satisfaction."),
        },
      ],
      tips: [T('SUMAPRODUCTO multiplica fila por fila y suma: perfecto para promedios ponderados.', 'SUMPRODUCT multiplies row by row and adds: perfect for weighted averages.'), T('Si los que responden son distintos de los que no, el promedio simple engaña.', "If those who answer differ from those who don't, the simple average misleads.")],
      feedback: T('Uf, casi anuncio un número inflado. Informamos el ponderado con la aclaración. ¡Gracias!', 'Phew, I almost announced an inflated number. We reported the weighted one with the note. Thanks!'),
      solution: { fill: [['E', 2, 6, '=C2/B2']], cells: { H2: '=SUMAPRODUCTO(C2:C6;D2:D6)/SUMA(C2:C6)', H3: '=SUMAPRODUCTO(B2:B6;D2:D6)/SUMA(B2:B6)' }, answers: { 3: 1 } },
    };
  });

  // ---------------------------------------------------------------------------
  // Decidir un proyecto con datos de un piloto
  // ---------------------------------------------------------------------------
  C.register('m18_decide', (ctx) => {
    const r = ctx.rng;
    const nPilot = ctx.size === 'large' ? 8 : ctx.size === 'medium' ? 6 : 5;
    const nStores = 20;
    let savings;
    let cost;
    let roi;
    do {
      savings = Array.from({ length: nPilot }, () => r.step(20000, 140000, 1000));
      cost = r.step(8000000, 20000000, 100000);
      const yearly = (x) => x * nStores * 12;
      roi = [Math.min(...savings), mean(savings), Math.max(...savings)].map((s) => yearly(s) / cost - 1);
    } while (!(roi[0] < -0.05 && roi[1] > 0.1));
    const last = nPilot + 1;
    return {
      from: 'graciela',
      dept: 'gerencia',
      subject: T('¿Aprobamos el sistema de reposición automática?', 'Do we approve the automatic restocking system?'),
      file: T('piloto_reposicion.xlsx', 'restocking_pilot.xlsx'),
      email: T(
        `<p>Probamos el sistema de reposición automática en ${nPilot} de nuestras ${nStores} sucursales. Implementarlo en todas cuesta <b>${money(cost)}</b>. Los ahorros del piloto variaron mucho entre sucursales.</p><p>¿Lo aprobamos? Quiero ver el retorno en el peor, el típico y el mejor caso.</p>`,
        `<p>We tested the automatic restocking system in ${nPilot} of our ${nStores} branches. Rolling it out everywhere costs <b>${money(cost)}</b>. Pilot savings varied a lot between branches.</p><p>Do we approve it? I want to see the return in the worst, typical and best case.</p>`
      ),
      sheet: {
        cols: 7,
        rows: Math.max(last + 3, 12),
        colWidths: [150, 160, 30, 270, 130, 130, 40],
        data: [
          { at: 'A1', rows: [[T('Sucursal piloto', 'Pilot branch'), T('Ahorro mensual', 'Monthly savings')], ...savings.map((s, i) => [`${T('Piloto', 'Pilot')} ${i + 1}`, s])] },
          { at: 'D1', rows: [[T('Escenario', 'Scenario'), T('Ahorro mensual', 'Monthly savings'), T('Retorno anual (ROI)', 'Annual return (ROI)')], [T('Pesimista (mínimo del piloto)', 'Pessimistic (pilot minimum)')], [T('Central (promedio)', 'Central (average)')], [T('Optimista (máximo)', 'Optimistic (maximum)')], [], [T('Costo del proyecto', 'Project cost'), cost], [T('Sucursales', 'Branches'), nStores]] },
        ],
        locked: ['A1:B' + last, 'D1:F1', 'D2:D4', 'D6:E7'],
        header: ['A1:B1', 'D1:F1'],
        labels: ['D2:D4', 'D6:D7'],
        targets: ['E2:F4'],
        formats: { B: 'currency', E: 'currency', F: 'percent' },
        start: 'E2',
      },
      objectives: [
        { text: T('E2:E4: ahorro mensual por sucursal en cada escenario (MIN, PROMEDIO, MAX del piloto).', 'E2:E4: monthly savings per branch in each scenario (pilot MIN, AVERAGE, MAX).'), hint: T(`=MIN(B2:B${last}) · =PROMEDIO(…) · =MAX(…)`, `=MIN(B2:B${last}) · =AVERAGE(…) · =MAX(…)`), check: V.cells([['E2', Math.min(...savings)], ['E3', mean(savings)], ['E4', Math.max(...savings)]], { usesByRef: { E2: ['MIN'], E3: ['PROMEDIO', 'MEDIANA'], E4: ['MAX'] } }) },
        { text: T('F2:F4: <b>ROI anual</b> = ahorro × sucursales × 12 ÷ costo − 1.', 'F2:F4: <b>annual ROI</b> = savings × branches × 12 ÷ cost − 1.'), hint: '=E2*$E$7*12/$E$6-1', check: V.column('F', 2, 4, (row) => roi[row - 2], { tol: 0.0005, refsFn: (row) => ['E' + row, 'E6', 'E7'], dollarHint: true }) },
        {
          text: T('❓ ¿Qué le recomendás a Graciela?', '❓ What do you recommend to Graciela?'),
          choices: [
            T('Aprobarlo para todas ya: el caso central da buen retorno.', 'Approve it for all branches now: the central case gives a good return.'),
            T(`Avanzar por etapas: en el caso central rinde (${pct(roi[1])}), pero en el pesimista no recupera la inversión. Ampliar a la mitad de las sucursales y medir 3 meses antes de ir por todas.`, `Go in stages: the central case pays off (${pct(roi[1])}), but the pessimistic one doesn't recover the investment. Expand to half the branches and measure 3 months before going all in.`),
            T('Rechazarlo: en el peor caso pierde plata.', 'Reject it: it loses money in the worst case.'),
          ],
          correct: 1,
          why: [T('Ignora que en el peor caso no recupera la inversión: es una apuesta grande con poca información.', "It ignores that the worst case doesn't recover the investment: a big bet with little information."), null, T('Descarta un proyecto que en el caso típico rinde bien: se puede reducir el riesgo avanzando por etapas.', 'It drops a project that pays off in the typical case: risk can be reduced by going in stages.')],
          hint: T('¿Cambia la decisión entre escenarios? Si cambia, reducí la incertidumbre.', 'Does the decision change between scenarios? If it does, reduce the uncertainty.'),
        },
      ],
      tips: [T('ROI = ganancia ÷ inversión − 1: 0% es "recupero lo invertido".', 'ROI = gain ÷ investment − 1: 0% means "I get my investment back".'), T('Con datos de un piloto chico, el promedio solo no alcanza: mirá el rango.', 'With data from a small pilot, the average alone is not enough: look at the range.')],
      feedback: T('Aprobado por etapas. El directorio valoró ver el peor caso: nadie quiere sorpresas. 👌', 'Approved in stages. The board appreciated seeing the worst case: nobody likes surprises. 👌'),
      solution: { cells: { E2: `=MIN(B2:B${last})`, E3: `=PROMEDIO(B2:B${last})`, E4: `=MAX(B2:B${last})` }, fill: [['F', 2, 4, '=E2*$E$7*12/$E$6-1']], answers: { 2: 1 } },
    };
  });
})();
