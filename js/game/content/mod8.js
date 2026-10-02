/*
 * Analyst Adventure — Nivel 8 (etapa Junior): control de calidad de datos.
 * Duplicados, datos faltantes, números guardados como texto, reglas de validez y un
 * informe de calidad antes de usar una base.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const C = AA.Content;
  const V = AA.V;
  const F = AA.Formula;
  const T = (es, en) => AA.T(es, en);
  const { CITIES, AREAS } = C.DATA;
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const P = (name) => F.sheetPrefix(name);
  const fn = (n) => AA.fnName(n);
  const pct = (x) => (Math.round(x * 1000) / 10).toLocaleString('en-US') + '%';

  C.module({
    id: 'mod8',
    title: { es: 'Calidad de datos', en: 'Data quality' },
    xp: 110,
    tier: 1,
    skills: ['quality', 'duplicates', 'blanks', 'types', 'validity'],
    templates: ['m8_duplicates', 'm8_blanks', 'm8_textnum', 'm8_validity', 'm8_report'],
    seeds: [801, 802, 803, 804, 805],
    intro: {
      es: 'Antes de analizar cualquier base, un buen Junior la <b>revisa</b>. Un informe hermoso con datos rotos es peor que no tener informe. Hoy aprendés a medir la calidad de los datos.',
      en: 'Before analyzing any dataset, a good Junior <b>checks</b> it. A beautiful report on broken data is worse than no report. Today you learn to measure data quality.',
    },
    skillDefs: {
      quality: {
        title: { es: 'Las preguntas de calidad', en: 'The quality questions' },
        say: {
          es: 'Antes de usar una base, preguntate: ¿está <b>completa</b>? ¿hay <b>duplicados</b>? ¿los valores son <b>válidos</b> (edades posibles, categorías que existen)? ¿los <b>tipos</b> son correctos (números que son números)? Medilo con fórmulas, no "a ojo".',
          en: 'Before using a dataset, ask: is it <b>complete</b>? are there <b>duplicates</b>? are values <b>valid</b> (possible ages, categories that exist)? are <b>types</b> right (numbers that are numbers)? Measure it with formulas, not by eye.',
        },
        tip: { es: 'Nunca borres datos "malos" sin dejar registro: marcá, contá e informá.', en: 'Never delete "bad" data without a trace: flag, count and report.' },
      },
      duplicates: {
        title: { es: 'Duplicados', en: 'Duplicates' },
        say: {
          es: '<code>=CONTAR.SI($A$2:$A$100; A2)</code> dice cuántas veces aparece cada valor: más de 1 es duplicado. Para marcar solo la <b>primera aparición</b> se usa un rango que crece: <code>=SI(CONTAR.SI($A$2:A2; A2)=1; "Sí"; "No")</code>.',
          en: '<code>=COUNTIF($A$2:$A$100, A2)</code> tells how many times each value appears: more than 1 is a duplicate. To flag only the <b>first appearance</b> use a growing range: <code>=IF(COUNTIF($A$2:A2, A2)=1, "Yes", "No")</code>.',
        },
        fns: ['CONTAR.SI'],
        tip: { es: '$A$2:A2 es una referencia mixta: el inicio queda fijo y el final baja al copiar.', en: '$A$2:A2 is a mixed reference: the start stays fixed and the end moves down when copied.' },
      },
      blanks: {
        title: { es: 'Datos faltantes', en: 'Missing data' },
        say: {
          es: '<code>=CONTAR.BLANCO(C2:C200)</code> cuenta celdas vacías y <code>=CONTARA(A2:A200)</code> las que tienen algo. El <b>% completo</b> de una columna es 1 − vacíos ÷ total.',
          en: '<code>=COUNTBLANK(C2:C200)</code> counts empty cells and <code>=COUNTA(A2:A200)</code> the filled ones. A column\'s <b>% complete</b> is 1 − blanks ÷ total.',
        },
        fns: ['CONTAR.BLANCO', 'CONTARA'],
        tip: { es: 'Un dato faltante no es un cero: no lo completes con 0 "para que cierre".', en: 'A missing value is not a zero: don\'t fill it with 0 "to make it work".' },
      },
      types: {
        title: { es: 'Números guardados como texto', en: 'Numbers stored as text' },
        say: {
          es: 'Al importar datos, a veces un número llega como <b>texto</b> (se alinea a la izquierda). SUMA lo ignora sin avisar. <code>=ESNUMERO(B2)</code> lo detecta y <code>=VALOR(B2)</code> lo convierte en número.',
          en: 'When importing data, a number sometimes arrives as <b>text</b> (left-aligned). SUM ignores it silently. <code>=ISNUMBER(B2)</code> detects it and <code>=VALUE(B2)</code> turns it into a number.',
        },
        fns: ['ESNUMERO', 'VALOR'],
        tip: { es: 'Si un total "no te cierra" con el del sistema, sospechá de números como texto.', en: "If a total doesn't match the system's, suspect numbers stored as text." },
      },
      validity: {
        title: { es: 'Reglas de validez', en: 'Validity rules' },
        say: {
          es: 'Cada columna tiene valores posibles. Escribilos como reglas: <code>=Y(B2>=18; B2<=70)</code> para edades, <code>=CONTAR.SI(Lista!$A$2:$A$6; C2)>0</code> para categorías permitidas, <code>=D2>0</code> para montos.',
          en: 'Every column has possible values. Write them as rules: <code>=AND(B2>=18, B2<=70)</code> for ages, <code>=COUNTIF(List!$A$2:$A$6, C2)>0</code> for allowed categories, <code>=D2>0</code> for amounts.',
        },
        fns: ['Y'],
        tip: { es: 'Una fórmula de comparación (=D2>0) ya devuelve VERDADERO o FALSO: no hace falta un SI.', en: 'A comparison formula (=D2>0) already returns TRUE or FALSE: no IF needed.' },
      },
    },
  });

  // ---------------------------------------------------------------------------
  // Suscriptores duplicados
  // ---------------------------------------------------------------------------
  C.register('m8_duplicates', (ctx) => {
    const r = ctx.rng;
    const base = C.rowsFor(ctx, [12, 15], [25, 32], [40, 50]);
    const extra = ctx.size === 'large' ? r.int(8, 10) : ctx.size === 'medium' ? r.int(5, 7) : r.int(3, 4);
    const people = C.peopleParts(r, base, true).map((p) => ({ email: `${p.first}.${p.last}@mail.com`.toLowerCase(), name: `${p.first} ${p.last}`, date: `2024-${String(r.int(1, 12)).padStart(2, '0')}-${String(r.int(1, 28)).padStart(2, '0')}` }));
    const rows = people.slice();
    for (let i = 0; i < extra; i++) rows.splice(r.int(1, rows.length), 0, r.pick(people.slice(0, Math.ceil(base / 2))));
    const n = rows.length;
    const last = n + 1;
    const reps = rows.map((x) => rows.filter((y) => y.email === x.email).length);
    const firsts = rows.map((x, i) => rows.findIndex((y) => y.email === x.email) === i);
    const unique = new Set(rows.map((x) => x.email)).size;
    const YES = T('Sí', 'Yes');
    return {
      from: 'tomas',
      dept: 'marketing',
      subject: T('La base de suscriptores tiene repetidos', 'The subscriber list has duplicates'),
      file: T('suscriptores.xlsx', 'subscribers.xlsx'),
      email: T(
        '<p>Vamos a mandar el newsletter y hay gente que se suscribió dos o tres veces (y después se queja de que le llega todo repetido).</p><p>Necesito saber <b>cuántos suscriptores únicos</b> tenemos y cuántas filas sobran. No borres nada todavía: solo marcá.</p>',
        '<p>We\'re sending the newsletter and some people subscribed two or three times (and then complain they get everything twice).</p><p>I need to know <b>how many unique subscribers</b> we have and how many rows are extra. Don\'t delete anything yet: just flag.</p>'
      ),
      sheet: {
        cols: 9,
        rows: n + 4,
        colWidths: [230, 160, 100, 110, 120, 30, 160, 70, 60],
        data: { at: 'A1', rows: [['Email', T('Nombre', 'Name'), T('Alta', 'Signup'), T('Repeticiones', 'Repetitions'), T('¿Primera vez?', 'First time?')], ...rows.map((x) => [x.email, x.name, x.date])] },
        cells: { G1: T('Suscriptores únicos', 'Unique subscribers') },
        locked: ['A1:C' + last, 'D1:E1', 'G1'],
        header: ['A1:E1'],
        labels: ['G1'],
        targets: ['D2:E' + last, 'H1'],
        start: 'D2',
      },
      objectives: [
        {
          text: T(`<b>Repeticiones</b> de cada email (D2:D${last}).`, `<b>Repetitions</b> of each email (D2:D${last}).`),
          hint: `=${fn('CONTAR.SI')}($A$2:$A$${last}; A2)`,
          check: V.column('D', 2, last, (row) => reps[row - 2], { uses: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'], dollarHint: true }),
        },
        {
          text: T(`<b>¿Primera vez?</b> (E2:E${last}): "${YES}" solo en la primera aparición de cada email.`, `<b>First time?</b> (E2:E${last}): "${YES}" only on the first appearance of each email.`),
          hint: `=${fn('SI')}(${fn('CONTAR.SI')}($A$2:A2; A2)=1; "${YES}"; "No")`,
          check: V.column('E', 2, last, (row) => (firsts[row - 2] ? YES : 'No'), { uses: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO', 'COINCIDIR'] }),
        },
        {
          text: T('En H1, cuántos <b>suscriptores únicos</b> hay.', 'In H1, how many <b>unique subscribers</b> there are.'),
          hint: `=${fn('CONTAR.SI')}(E2:E${last}; "${YES}")`,
          check: V.cell('H1', unique, { uses: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'] }),
        },
        {
          text: T('❓ ¿Cuántas filas <b>sobran</b> (habría que borrar)?', '❓ How many rows are <b>extra</b> (should be deleted)?'),
          placeholder: T('Cantidad', 'Count'),
          hint: T('Total de filas menos suscriptores únicos.', 'Total rows minus unique subscribers.'),
          answer: V.answerNumber(n - unique, 0),
        },
      ],
      tips: [
        T('Para la primera aparición, el rango crece: $A$2:A2, $A$2:A3, $A$2:A4… (solo el inicio lleva $).', 'For the first appearance, the range grows: $A$2:A2, $A$2:A3, $A$2:A4… (only the start has $).'),
        T('Marcar en vez de borrar te deja revisar antes de perder datos.', 'Flagging instead of deleting lets you review before losing data.'),
      ],
      feedback: T('¡Genial! Limpié la base con tus marcas. Nadie más va a recibir el newsletter tres veces.', 'Great! I cleaned the list using your flags. Nobody will get the newsletter three times again.'),
      solution: {
        fill: [['D', 2, last, `=CONTAR.SI($A$2:$A$${last};A2)`], ['E', 2, last, `=SI(CONTAR.SI($A$2:A2;A2)=1;"${YES}";"No")`]],
        cells: { H1: `=CONTAR.SI(E2:E${last};"${YES}")` },
        answers: { 3: String(n - unique) },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Completitud de una base de empleados
  // ---------------------------------------------------------------------------
  C.register('m8_blanks', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [14, 18], [28, 36], [48, 60]);
    const people = C.peopleParts(r, n, true);
    const areas = AREAS.map(C.L2);
    const fields = [T('Email', 'Email'), T('Teléfono', 'Phone'), T('Ciudad', 'City'), T('Área', 'Area')];
    let rows;
    let blanks;
    do {
      const pPhone = 0.3 + r.next() * 0.15;
      const pEmail = 0.1 + r.next() * 0.1;
      const probs = r.chance(0.5) ? [pEmail, pPhone, 0.06, 0.02] : [pPhone, pEmail, 0.06, 0.02];
      rows = people.map((p) => [
        `${p.first} ${p.last}`,
        r.chance(probs[0]) ? null : `${p.first}.${p.last}@grupocondor.com`.toLowerCase(),
        r.chance(probs[1]) ? null : `11-${r.int(4000, 6999)}-${r.int(1000, 9999)}`,
        r.chance(probs[2]) ? null : r.pick(CITIES),
        r.chance(probs[3]) ? null : r.pick(areas),
      ]);
      blanks = [1, 2, 3, 4].map((c) => rows.filter((x) => x[c] === null).length);
    } while (C.uniqueExtreme(blanks) < 0 || blanks[0] === 0 || blanks[1] === 0);
    const last = n + 1;
    const worst = C.uniqueExtreme(blanks);
    const phoneMissing = blanks[1] / n;
    return {
      from: 'paula',
      dept: 'rrhh',
      subject: T('¿Qué tan completa está la base de empleados?', 'How complete is the employee database?'),
      file: T('base_empleados.xlsx', 'employee_database.xlsx'),
      email: T(
        '<p>Migramos la base de empleados a un sistema nuevo y sospecho que se perdieron datos. Antes de usarla necesito saber <b>cuántos vacíos hay en cada campo</b> y qué <b>% de completitud</b> tiene cada uno.</p>',
        '<p>We migrated the employee database to a new system and I suspect data was lost. Before using it I need to know <b>how many blanks each field has</b> and each field\'s <b>% completeness</b>.</p>'
      ),
      sheet: {
        cols: 10,
        rows: n + 4,
        colWidths: [160, 230, 120, 120, 130, 30, 110, 80, 100, 50],
        data: [
          { at: 'A1', rows: [[T('Nombre', 'Name'), ...fields], ...rows] },
          { at: 'G1', rows: [[T('Campo', 'Field'), T('Vacíos', 'Blanks'), T('% completo', '% complete')], ...fields.map((f) => [f])] },
        ],
        cells: { G7: T('Total de filas', 'Total rows') },
        locked: ['A1:E' + last, 'G1:I1', 'G2:G5', 'G7'],
        header: ['A1:E1', 'G1:I1'],
        labels: ['G2:G5', 'G7'],
        targets: ['H2:I5', 'H7'],
        formats: { I: 'percent' },
        start: 'H2',
      },
      objectives: [
        {
          text: T('<b>Vacíos</b> de cada campo (H2:H5) con CONTAR.BLANCO.', '<b>Blanks</b> in each field (H2:H5) with COUNTBLANK.'),
          hint: `=${fn('CONTAR.BLANCO')}(B2:B${last}) ${T('para Email; C, D y E para los demás', 'for Email; C, D and E for the others')}`,
          check: V.cells(blanks.map((b, i) => ['H' + (i + 2), b]), { uses: ['CONTAR.BLANCO', 'CONTAR.SI'] }),
        },
        {
          text: T('En H7, el <b>total de filas</b> (CONTARA de los nombres).', 'In H7, the <b>total rows</b> (COUNTA of the names).'),
          hint: `=${fn('CONTARA')}(A2:A${last})`,
          check: V.cell('H7', n, { uses: ['CONTARA', 'CONTAR.SI'] }),
        },
        {
          text: T('<b>% completo</b> de cada campo (I2:I5) = 1 − vacíos ÷ total.', '<b>% complete</b> of each field (I2:I5) = 1 − blanks ÷ total.'),
          hint: '=1-H2/$H$7',
          check: V.column('I', 2, 5, (row) => 1 - blanks[row - 2] / n, { refsFn: (row) => ['H' + row, 'H7'], tol: 0.0005, dollarHint: true }),
        },
        {
          text: T('❓ ¿Qué campo está <b>menos completo</b>?', '❓ Which field is <b>least complete</b>?'),
          placeholder: T('Campo', 'Field'),
          hint: T('El de menor % en la columna I.', 'The lowest % in column I.'),
          answer: V.answerText([fields[worst]]),
        },
        {
          text: T('❓ Paula quiere mandar un SMS a <b>todo el personal</b> usando el teléfono de esta base. ¿Qué le decís?', '❓ Paula wants to text <b>all staff</b> using the phone numbers in this database. What do you tell her?'),
          choices: [
            T('Que sí: la columna Teléfono existe, así que llega a todos.', 'Yes: the Phone column exists, so it reaches everyone.'),
            T(`Que va a llegar a una parte: al ${pct(phoneMissing)} le falta el teléfono. Conviene avisar o completar esos datos antes.`, `It will only reach part of them: ${pct(phoneMissing)} have no phone number. Better to warn her or fill in that data first.`),
            T('Que no se puede usar ninguna columna de una base con vacíos.', 'That no column of a database with blanks can be used.'),
          ],
          correct: 1,
          why: [
            T('La columna existe, pero tiene vacíos: esas personas no recibirían el mensaje.', 'The column exists, but it has blanks: those people would not get the message.'),
            null,
            T('Exagerado: los datos incompletos se pueden usar, siempre que digas cuánto falta.', 'Too extreme: incomplete data can be used, as long as you say how much is missing.'),
          ],
          hint: T('Mirá el % completo del teléfono.', 'Look at the phone % complete.'),
        },
      ],
      tips: [
        T('CONTAR.BLANCO cuenta las celdas vacías de un rango.', 'COUNTBLANK counts the empty cells in a range.'),
        T('Fijá el total con $ ($H$7) para copiar la fórmula del %.', 'Lock the total with $ ($H$7) to copy the % formula.'),
      ],
      feedback: T('Con este diagnóstico le pedí a cada jefe que complete los datos faltantes. ¡Gracias!', 'With this diagnosis I asked each manager to fill in the missing data. Thanks!'),
      solution: {
        cells: { H2: `=CONTAR.BLANCO(B2:B${last})`, H3: `=CONTAR.BLANCO(C2:C${last})`, H4: `=CONTAR.BLANCO(D2:D${last})`, H5: `=CONTAR.BLANCO(E2:E${last})`, H7: `=CONTARA(A2:A${last})` },
        fill: [['I', 2, 5, '=1-H2/$H$7']],
        answers: { 3: fields[worst], 4: 1 },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Importes guardados como texto
  // ---------------------------------------------------------------------------
  C.register('m8_textnum', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [14, 18], [28, 36], [48, 60]);
    const nText = ctx.size === 'large' ? r.int(10, 14) : ctx.size === 'medium' ? r.int(6, 9) : r.int(3, 5);
    const amounts = Array.from({ length: n }, () => r.step(150, 9800, 0.5));
    const textIdx = new Set(r.sample([...Array(n).keys()], nText));
    const cells = amounts.map((a, i) => (textIdx.has(i) ? F.fmtNumber(a) : a));
    const realSum = sum(amounts);
    const shownSum = sum(amounts.filter((_, i) => !textIdx.has(i)));
    const last = n + 1;
    return {
      from: 'julia',
      dept: 'finanzas',
      subject: T('El total de facturas no me cierra', "The invoice total doesn't add up"),
      file: T('facturas_importadas.xlsx', 'imported_invoices.xlsx'),
      email: T(
        `<p>Importé las facturas del mes desde el sistema viejo y la suma me da menos de lo que dice el sistema. Creo que algunos importes quedaron <b>guardados como texto</b>.</p><p>¿Me ayudás a detectarlos, convertirlos y decirme cuánta plata "no veía" la suma?</p>`,
        `<p>I imported this month's invoices from the old system and the sum is lower than what the system says. I think some amounts were <b>stored as text</b>.</p><p>Can you help me detect them, convert them and tell me how much money the sum "couldn't see"?</p>`
      ),
      sheet: {
        cols: 8,
        rows: n + 4,
        colWidths: [90, 110, 120, 120, 30, 190, 120, 50],
        data: { at: 'A1', rows: [[T('Factura', 'Invoice'), T('Importe', 'Amount'), T('¿Es número?', 'Is number?'), T('Importe limpio', 'Clean amount')], ...cells.map((c, i) => ['F-' + (3001 + i), c])] },
        cells: { F2: T('SUMA de la columna B', 'SUM of column B'), F3: T('SUMA corregida (D)', 'Corrected SUM (D)') },
        locked: ['A1:B' + last, 'C1:D1', 'F2:F3'],
        header: ['A1:D1'],
        labels: ['F2:F3'],
        targets: ['C2:D' + last, 'G2:G3'],
        formats: { D: 'currency', G: 'currency' },
        start: 'C2',
      },
      objectives: [
        {
          text: T(`<b>¿Es número?</b> (C2:C${last}) con ESNUMERO.`, `<b>Is number?</b> (C2:C${last}) with ISNUMBER.`),
          hint: `=${fn('ESNUMERO')}(B2)`,
          check: V.column('C', 2, last, (row) => V.bool(!textIdx.has(row - 2)), { uses: ['ESNUMERO', 'ESTEXTO'] }),
        },
        {
          text: T(`<b>Importe limpio</b> (D2:D${last}): todos como número, con VALOR.`, `<b>Clean amount</b> (D2:D${last}): all as numbers, with VALUE.`),
          hint: `=${fn('VALOR')}(B2)`,
          check: V.column('D', 2, last, (row) => amounts[row - 2], { uses: ['VALOR'] }),
        },
        {
          text: T('En G2 la <b>SUMA de la columna B</b> y en G3 la <b>SUMA corregida</b> (columna D).', 'In G2 the <b>SUM of column B</b> and in G3 the <b>corrected SUM</b> (column D).'),
          hint: T(`G2: =SUMA(B2:B${last}) · G3: =SUMA(D2:D${last})`, `G2: =SUM(B2:B${last}) · G3: =SUM(D2:D${last})`),
          check: V.cells([['G2', shownSum], ['G3', realSum]], { uses: ['SUMA'] }),
        },
        {
          text: T('❓ ¿Cuántos importes estaban guardados <b>como texto</b>?', '❓ How many amounts were stored <b>as text</b>?'),
          placeholder: T('Cantidad', 'Count'),
          hint: T(`=CONTAR.SI(C2:C${last}; FALSO)`, `=COUNTIF(C2:C${last}, FALSE)`),
          answer: V.answerNumber(nText, 0),
        },
        {
          text: T('❓ ¿Cuánta plata <b>no veía</b> la suma original (G3 − G2)?', '❓ How much money did the original sum <b>miss</b> (G3 − G2)?'),
          placeholder: T('Un monto', 'An amount'),
          hint: '=G3-G2',
          answer: V.answerNumber(realSum - shownSum, 0.01),
        },
      ],
      tips: [
        T('Un número como texto se ve alineado a la izquierda y al editarlo empieza con \'.', "A number stored as text is left-aligned and starts with ' when you edit it."),
        T('SUMA ignora los textos sin avisar: por eso el total no cierra.', 'SUM ignores text silently: that\'s why the total does not add up.'),
      ],
      feedback: T('¡Ahí estaba la diferencia! Ya cerré el mes con el número correcto.', 'There was the difference! I closed the month with the right number.'),
      solution: {
        fill: [['C', 2, last, '=ESNUMERO(B2)'], ['D', 2, last, '=VALOR(B2)']],
        cells: { G2: `=SUMA(B2:B${last})`, G3: `=SUMA(D2:D${last})` },
        answers: { 3: String(nText), 4: String(realSum - shownSum) },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Reglas de validez (edad, área permitida, sueldo)
  // ---------------------------------------------------------------------------
  C.register('m8_validity', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [14, 18], [28, 36], [48, 60]);
    const areas = AREAS.map(C.L2);
    const rows = Array.from({ length: n }, (_, i) => ({ id: 3100 + i * 3, age: r.int(19, 64), area: r.pick(areas), salary: r.step(450000, 1800000, 1000) }));
    const idx = r.shuffle([...Array(n).keys()]);
    const badAge = ctx.size === 'small' ? 2 : 3;
    const badArea = ctx.size === 'small' ? 1 : 2;
    const badSal = ctx.size === 'small' ? 1 : 2;
    let k = 0;
    for (let i = 0; i < badAge; i++) rows[idx[k++]].age = r.pick([7, 15, 120, 210, 0, 99]);
    for (let i = 0; i < badArea; i++) {
      const row = rows[idx[k++]];
      row.area = row.area.length > 6 ? row.area.slice(0, 3) + row.area.slice(4) : row.area + 's';
    }
    for (let i = 0; i < badSal; i++) rows[idx[k++]].salary = r.pick([0, -150000]);
    const ageOk = rows.map((x) => x.age >= 18 && x.age <= 70);
    const areaOk = rows.map((x) => areas.some((a) => V.norm(a) === V.norm(x.area)));
    const salOk = rows.map((x) => x.salary > 0);
    const review = rows.filter((_, i) => !(ageOk[i] && areaOk[i] && salOk[i])).length;
    const last = n + 1;
    const ls = T('Áreas válidas', 'Valid areas');
    const OK = 'OK';
    const REV = T('Revisar', 'Review');
    return {
      from: 'paula',
      dept: 'rrhh',
      subject: T('Validar la carga de legajos', 'Validate the employee records upload'),
      file: T('legajos_nuevos.xlsx', 'new_records.xlsx'),
      email: T(
        `<p>Una consultora cargó a mano los legajos nuevos y no confío del todo. Las reglas son: <b>edad entre 18 y 70</b>, un <b>área que exista</b> (hoja <b>${ls}</b>) y <b>sueldo mayor a 0</b>.</p><p>Marcá cada regla y decime cuántas filas hay que revisar.</p>`,
        `<p>A consulting firm typed in the new employee records by hand and I don't fully trust it. The rules are: <b>age between 18 and 70</b>, an <b>area that exists</b> (<b>${ls}</b> sheet) and <b>salary greater than 0</b>.</p><p>Check each rule and tell me how many rows need review.</p>`
      ),
      sheets: [
        {
          name: T('Legajos', 'Records'),
          cols: 10,
          rows: n + 4,
          colWidths: [70, 60, 150, 110, 90, 90, 100, 90, 50, 50],
          data: { at: 'A1', rows: [[T('Legajo', 'ID'), T('Edad', 'Age'), T('Área', 'Area'), T('Sueldo', 'Salary'), T('Edad OK', 'Age OK'), T('Área OK', 'Area OK'), T('Sueldo OK', 'Salary OK'), T('Estado', 'Status')], ...rows.map((x) => [x.id, x.age, x.area, x.salary])] },
          locked: ['A1:D' + last, 'E1:H1'],
          header: ['A1:H1'],
          targets: ['E2:H' + last],
          formats: { D: 'currency' },
          start: 'E2',
        },
        {
          name: ls,
          cols: 3,
          rows: areas.length + 3,
          colWidths: [170, 60, 60],
          data: { at: 'A1', rows: [[T('Área', 'Area')], ...areas.map((a) => [a])] },
          locked: ['A1:C' + (areas.length + 3)],
          header: ['A1'],
        },
      ],
      objectives: [
        {
          text: T(`<b>Edad OK</b> (E2:E${last}): VERDADERO si está entre 18 y 70.`, `<b>Age OK</b> (E2:E${last}): TRUE if it is between 18 and 70.`),
          hint: `=${fn('Y')}(B2>=18; B2<=70)`,
          check: V.column('E', 2, last, (row) => V.bool(ageOk[row - 2])),
        },
        {
          text: T(`<b>Área OK</b> (F2:F${last}): VERDADERO si el área está en la hoja ${ls}.`, `<b>Area OK</b> (F2:F${last}): TRUE if the area is in the ${ls} sheet.`),
          hint: `=${fn('CONTAR.SI')}(${P(ls)}$A$2:$A$${areas.length + 1}; C2)>0`,
          check: V.column('F', 2, last, (row) => V.bool(areaOk[row - 2]), { uses: ['CONTAR.SI', 'BUSCARX', 'COINCIDIR', 'BUSCARV', 'ESERROR', 'SI.ERROR'] }),
        },
        {
          text: T(`<b>Sueldo OK</b> (G2:G${last}): VERDADERO si es mayor a 0.`, `<b>Salary OK</b> (G2:G${last}): TRUE if it is greater than 0.`),
          hint: '=D2>0',
          check: V.column('G', 2, last, (row) => V.bool(salOk[row - 2])),
        },
        {
          text: T(`<b>Estado</b> (H2:H${last}): "${OK}" si cumple las tres reglas; si no, "${REV}".`, `<b>Status</b> (H2:H${last}): "${OK}" if it meets all three rules; otherwise "${REV}".`),
          hint: `=${fn('SI')}(${fn('Y')}(E2; F2; G2); "${OK}"; "${REV}")`,
          check: V.column('H', 2, last, (row) => (ageOk[row - 2] && areaOk[row - 2] && salOk[row - 2] ? OK : REV), { uses: ['SI', 'SI.CONJUNTO'] }),
        },
        {
          text: T('❓ ¿Cuántas filas hay que <b>revisar</b>?', '❓ How many rows need <b>review</b>?'),
          placeholder: T('Cantidad', 'Count'),
          hint: T(`=CONTAR.SI(H2:H${last}; "${REV}")`, `=COUNTIF(H2:H${last}, "${REV}")`),
          answer: V.answerNumber(review, 0),
        },
      ],
      tips: [
        T(`El nombre de la hoja tiene espacios: va entre comillas simples, ${P(ls)}A:A.`, `The sheet name has spaces: use single quotes, ${P(ls)}A:A.`),
        T('Una regla por columna es más fácil de revisar que una fórmula gigante.', 'One rule per column is easier to review than one giant formula.'),
      ],
      feedback: T('Le mandé la lista de filas a revisar a la consultora. Ya están corrigiendo. ¡Gran control!', 'I sent the list of rows to review to the consulting firm. They\'re fixing them. Great check!'),
      solution: {
        sheets: {},
        fill: [['E', 2, last, '=Y(B2>=18;B2<=70)'], ['F', 2, last, `=CONTAR.SI(${P(ls)}$A$2:$A$${areas.length + 1};C2)>0`], ['G', 2, last, '=D2>0'], ['H', 2, last, `=SI(Y(E2;F2;G2);"${OK}";"${REV}")`]],
        answers: { 4: String(review) },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Informe de calidad antes de usar una base
  // ---------------------------------------------------------------------------
  C.register('m8_report', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [16, 20], [30, 40], [50, 64]);
    let rows;
    let blanks;
    let neg;
    do {
      rows = Array.from({ length: n }, (_, i) => {
        const roll = r.next();
        const amount = roll < 0.12 ? null : roll < 0.2 ? -r.step(200, 3000, 50) : r.step(300, 12000, 50);
        return ['P-' + (7001 + i), `2024-06-${String(r.int(1, 30)).padStart(2, '0')}`, amount];
      });
      blanks = rows.filter((x) => x[2] === null).length;
      neg = rows.filter((x) => x[2] !== null && x[2] < 0).length;
    } while (!blanks || !neg);
    const usable = (n - blanks - neg) / n;
    const last = n + 1;
    return {
      from: 'marta',
      dept: 'analytics',
      subject: T('Antes de calcular las ventas de junio…', 'Before calculating June sales…'),
      file: T('pedidos_junio.xlsx', 'june_orders.xlsx'),
      email: T(
        '<p>Dirección me pide las ventas de junio con esta base. Antes de dar un número quiero un <b>mini informe de calidad</b>: cuántas filas hay, cuántos montos vacíos, cuántos negativos y qué % de filas es utilizable.</p>',
        '<p>Management wants June sales from this dataset. Before giving a number I want a <b>mini quality report</b>: how many rows there are, how many empty amounts, how many negatives and what % of rows is usable.</p>'
      ),
      sheet: {
        cols: 8,
        rows: n + 4,
        colWidths: [90, 110, 110, 30, 190, 110, 50, 50],
        data: { at: 'A1', rows: [[T('Pedido', 'Order'), T('Fecha', 'Date'), T('Monto', 'Amount')], ...rows] },
        cells: { E1: T('Control', 'Check'), F1: T('Resultado', 'Result'), E2: T('Filas', 'Rows'), E3: T('Montos vacíos', 'Empty amounts'), E4: T('Montos negativos', 'Negative amounts'), E5: T('% de filas utilizables', '% usable rows') },
        locked: ['A1:C' + last, 'E1:F1', 'E2:E5'],
        header: ['A1:C1', 'E1:F1'],
        labels: ['E2:E5'],
        targets: ['F2:F5'],
        formats: { C: 'currency', F5: 'percent' },
        start: 'F2',
      },
      objectives: [
        {
          text: T('F2: cantidad de <b>filas</b>.', 'F2: number of <b>rows</b>.'),
          hint: `=${fn('CONTARA')}(A2:A${last})`,
          check: V.cell('F2', n, { uses: ['CONTARA'] }),
        },
        {
          text: T('F3: <b>montos vacíos</b>.', 'F3: <b>empty amounts</b>.'),
          hint: `=${fn('CONTAR.BLANCO')}(C2:C${last})`,
          check: V.cell('F3', blanks, { uses: ['CONTAR.BLANCO', 'CONTAR.SI'] }),
        },
        {
          text: T('F4: <b>montos negativos</b> (devoluciones o errores).', 'F4: <b>negative amounts</b> (returns or errors).'),
          hint: `=${fn('CONTAR.SI')}(C2:C${last}; "<0")`,
          check: V.cell('F4', neg, { uses: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'] }),
        },
        {
          text: T('F5: <b>% de filas utilizables</b> = (filas − vacíos − negativos) ÷ filas.', 'F5: <b>% usable rows</b> = (rows − empty − negative) ÷ rows.'),
          hint: '=(F2-F3-F4)/F2',
          check: V.cell('F5', usable, { refs: ['F2', 'F3', 'F4'], tol: 0.0005 }),
        },
        {
          text: T('❓ ¿Cómo le contestás a Dirección?', '❓ How do you answer Management?'),
          choices: [
            T('Mando la suma de la columna C y listo: es el dato que pidieron.', 'I send the sum of column C and that\'s it: it\'s what they asked for.'),
            T(`Doy la suma aclarando que solo el ${pct(usable)} de las filas tiene un monto válido, y que los negativos son a revisar (¿devoluciones?).`, `I give the sum noting that only ${pct(usable)} of the rows have a valid amount, and that the negatives need review (returns?).`),
            T('No doy ningún número hasta que la base esté perfecta.', "I don't give any number until the data is perfect."),
          ],
          correct: 1,
          why: [
            T('Un número sin aclarar sus problemas puede llevar a una mala decisión.', 'A number without its caveats can lead to a bad decision.'),
            null,
            T('Los datos nunca son perfectos: se informa el número con sus limitaciones.', 'Data is never perfect: you report the number with its limitations.'),
          ],
          hint: T('Un buen analista da el dato Y su contexto.', 'A good analyst gives the number AND its context.'),
        },
      ],
      tips: [
        T('CONTAR.SI con "<0" cuenta los negativos.', 'COUNTIF with "<0" counts negatives.'),
        T('Este control rápido se puede reusar cada mes: dejalo armado.', 'This quick check can be reused every month: leave it set up.'),
      ],
      feedback: T('Perfecto. Dirección agradeció la aclaración y Ventas ya está revisando los negativos.', 'Perfect. Management appreciated the caveat and Sales is already reviewing the negatives.'),
      solution: {
        cells: { F2: `=CONTARA(A2:A${last})`, F3: `=CONTAR.BLANCO(C2:C${last})`, F4: `=CONTAR.SI(C2:C${last};"<0")`, F5: '=(F2-F3-F4)/F2' },
        answers: { 4: 1 },
      },
    };
  });
})();
