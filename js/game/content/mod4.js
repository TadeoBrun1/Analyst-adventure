/*
 * Analyst Adventure — Nivel 4: Limpieza de texto (ESPACIOS, MAYUSC/MINUSC/NOMPROPIO, &, LARGO).
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const C = AA.Content;
  const V = AA.V;
  const F = AA.Formula;
  const T = (es, en) => AA.T(es, en);
  const { CITIES, CATEGORIES, PRODUCTS } = C.DATA;
  // Las respuestas esperadas se calculan con el mismo motor que usa la planilla.
  const fx = (name, ...args) => F.callByName(name, args);
  const trim = (s) => fx('ESPACIOS', s);
  const proper = (s) => fx('NOMPROPIO', s);
  const lower = (s) => fx('MINUSC', s);
  const upper = (s) => fx('MAYUSC', s);
  const stripAccents = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

  // Ensuciar datos como lo haría un formulario mal cargado.
  function messCase(r, s) {
    switch (r.int(0, 3)) {
      case 0:
        return s.toUpperCase();
      case 1:
        return s.toLowerCase();
      case 2:
        return s;
      default:
        return s
          .split(' ')
          .map((w, i) => (i % 2 ? w.toUpperCase() : w.toLowerCase()))
          .join(' ');
    }
  }
  function messSpaces(r, s, force) {
    let out = s;
    if (force || r.chance(0.5)) out = ' '.repeat(r.int(1, 2)) + out;
    if (r.chance(0.5)) out += ' '.repeat(r.int(1, 2));
    if (r.chance(0.3) && out.trim().includes(' ')) out = out.replace(/(\S) (\S)/, '$1' + ' '.repeat(r.int(2, 3)) + '$2');
    return out;
  }
  const mess = (r, s, force) => messSpaces(r, messCase(r, s), force);

  // ---------------------------------------------------------------------------
  // Base de clientes: nombres, emails y ciudades + duplicados
  // ---------------------------------------------------------------------------
  C.register('m4_clients', (ctx) => {
    const r = ctx.rng;
    const k = C.rowsFor(ctx, [9, 10], [16, 20], [26, 30]);
    const dups = Math.max(2, Math.round(k / 4));
    const domains = ['mail.com', 'correo.com', 'email.com'];
    const people = C.peopleParts(r, k).map((p) => ({
      name: p.first + ' ' + p.last,
      email: (stripAccents(p.first) + '.' + stripAccents(p.last)).toLowerCase() + '@' + r.pick(domains),
      city: r.pick(CITIES),
    }));
    const entries = r.shuffle(people.concat(r.sample(people, dups)));
    const raw = entries.map((p, i) => [mess(r, p.name, i === 0), mess(r, p.email), mess(r, p.city)]);
    const n = raw.length;
    const last = n + 1;
    const fn = AA.fnName;
    return {
      from: 'tomas',
      dept: 'marketing',
      subject: T('La base de clientes es un desastre 😩', 'The customer list is a mess 😩'),
      file: T('clientes_newsletter.xlsx', 'newsletter_customers.xlsx'),
      email: T(
        `<p>¡Auxilio! Vamos a mandar el newsletter y la base está hecha un lío: espacios de más, MAYÚSCULAS, minúsculas…</p>
         <p>Necesito tres columnas limpias:</p>
         <ul><li><b>Nombre limpio</b>: sin espacios de más y en formato Nombre Propio.</li>
         <li><b>Email limpio</b>: sin espacios y todo en minúsculas.</li>
         <li><b>Ciudad limpia</b>: sin espacios de más y en formato Nombre Propio.</li></ul>
         <p>Y sospecho que hay <b>clientes repetidos</b>… ¿cuántos clientes únicos hay de verdad?</p>`,
        `<p>Help! We're about to send the newsletter and the list is a mess: extra spaces, UPPERCASE, lowercase…</p>
         <p>I need three clean columns:</p>
         <ul><li><b>Clean name</b>: no extra spaces, in Proper Case.</li>
         <li><b>Clean email</b>: no spaces and all lowercase.</li>
         <li><b>Clean city</b>: no extra spaces, in Proper Case.</li></ul>
         <p>And I suspect there are <b>duplicate customers</b>… how many unique customers do we really have?</p>`
      ),
      sheet: {
        cols: 8,
        rows: n + 8,
        colWidths: [170, 230, 130, 24, 170, 230, 130, 60],
        data: { at: 'A1', rows: [[T('Nombre', 'Name'), 'Email', T('Ciudad', 'City')], ...raw] },
        cells: { E1: T('Nombre limpio', 'Clean name'), F1: T('Email limpio', 'Clean email'), G1: T('Ciudad limpia', 'Clean city') },
        locked: ['A1:C' + last, 'E1:G1'],
        header: ['A1:C1', 'E1:G1'],
        targets: ['E2:G' + last],
        showSpaces: ['A2:C' + last],
        start: 'E2',
      },
      objectives: [
        {
          text: T(`<b>Nombre limpio</b> (E2:E${last}) con ESPACIOS y NOMPROPIO.`, `<b>Clean name</b> (E2:E${last}) with TRIM and PROPER.`),
          hint: T(`Se pueden anidar funciones: =${fn('NOMPROPIO')}(${fn('ESPACIOS')}(A2)).`, `Functions can be nested: =${fn('NOMPROPIO')}(${fn('ESPACIOS')}(A2)).`),
          check: V.column('E', 2, last, (row) => proper(trim(raw[row - 2][0])), { exact: true, wrongNote: T('Tiene que quedar como "Juan Pérez": sin espacios de más y con mayúscula inicial.', 'It should look like "Juan Pérez": no extra spaces and initial capitals.') }),
        },
        {
          text: T(`<b>Email limpio</b> (F2:F${last}) con ESPACIOS y MINUSC.`, `<b>Clean email</b> (F2:F${last}) with TRIM and LOWER.`),
          hint: `=${fn('MINUSC')}(${fn('ESPACIOS')}(B2))`,
          check: V.column('F', 2, last, (row) => lower(trim(raw[row - 2][1])), { exact: true, wrongNote: T('El email tiene que quedar sin espacios y en minúsculas.', 'The email must have no spaces and be lowercase.') }),
        },
        {
          text: T(`<b>Ciudad limpia</b> (G2:G${last}) con ESPACIOS y NOMPROPIO.`, `<b>Clean city</b> (G2:G${last}) with TRIM and PROPER.`),
          hint: `=${fn('NOMPROPIO')}(${fn('ESPACIOS')}(C2))`,
          check: V.column('G', 2, last, (row) => proper(trim(raw[row - 2][2])), { exact: true, wrongNote: T('La ciudad tiene que quedar como "Buenos Aires".', 'The city should look like "Buenos Aires".') }),
        },
        {
          text: T('❓ Con la base limpia, ¿cuántos <b>clientes únicos</b> hay?', '❓ With the list clean, how many <b>unique customers</b> are there?'),
          placeholder: T('Un número', 'A number'),
          hint: T('Con los datos limpios, los repetidos quedan idénticos. Compará los emails limpios.', 'Once cleaned, duplicates become identical. Compare the clean emails.'),
          answer: V.answerNumber(k),
        },
      ],
      tips: [
        T('Los puntitos rojos <b>·</b> marcan espacios de más en los datos originales.', 'The red dots <b>·</b> mark extra spaces in the original data.'),
        T('Nunca pises los datos originales: limpiá en columnas nuevas.', 'Never overwrite the original data: clean into new columns.'),
      ],
      feedback: T('¡La tasa de rebote del newsletter bajó un montón! Datos limpios, campañas felices.', "The newsletter bounce rate dropped a lot! Clean data, happy campaigns."),
      solution: {
        fill: [['E', 2, last, '=NOMPROPIO(ESPACIOS(A2))'], ['F', 2, last, '=MINUSC(ESPACIOS(B2))'], ['G', 2, last, '=NOMPROPIO(ESPACIOS(C2))']],
        answers: { 3: String(k) },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Códigos de producto y categorías
  // ---------------------------------------------------------------------------
  C.register('m4_codes', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [10, 12], [20, 25], [35, 40]);
    const cats = r.sample(CATEGORIES, 4).map(C.L2);
    const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
    const used = new Set();
    const rows = [];
    for (let i = 0; i < n; i++) {
      let code;
      do code = letters[r.int(0, letters.length - 1)] + letters[r.int(0, letters.length - 1)] + '-' + r.int(1000, 9999);
      while (used.has(code));
      used.add(code);
      const cat = cats[i < cats.length ? i : r.int(0, cats.length - 1)];
      rows.push({ code, cat, prod: C.L2(r.pick(PRODUCTS)), rawCode: messSpaces(r, r.chance(0.5) ? code.toLowerCase() : code, i === 0), rawCat: mess(r, cat) });
    }
    const counts = cats.map((c) => rows.filter((x) => x.cat === c).length);
    const asked = cats[counts.indexOf(Math.max(...counts))];
    const askedCount = Math.max(...counts);
    const last = n + 1;
    const fn = AA.fnName;
    return {
      from: 'sofi',
      dept: 'data',
      subject: T('Códigos de producto rotos', 'Broken product codes'),
      file: T('catalogo_codigos.xlsx', 'catalog_codes.xlsx'),
      email: T(
        `<p>El sistema nuevo rechaza los códigos de producto porque vienen con espacios y en minúscula. Y las categorías, ni hablar.</p>
         <ul><li><b>Código limpio</b>: sin espacios y en MAYÚSCULAS.</li><li><b>Categoría limpia</b>: sin espacios de más y en Nombre Propio.</li></ul>`,
        `<p>The new system rejects the product codes because they have spaces and lowercase letters. Don't get me started on the categories.</p>
         <ul><li><b>Clean code</b>: no spaces and in UPPERCASE.</li><li><b>Clean category</b>: no extra spaces, in Proper Case.</li></ul>`
      ),
      sheet: {
        cols: 8,
        rows: n + 8,
        colWidths: [120, 170, 150, 24, 130, 150, 60, 60],
        data: { at: 'A1', rows: [[T('Código', 'Code'), T('Producto', 'Product'), T('Categoría', 'Category')], ...rows.map((x) => [x.rawCode, x.prod, x.rawCat])] },
        cells: { E1: T('Código limpio', 'Clean code'), F1: T('Categoría limpia', 'Clean category') },
        locked: ['A1:C' + last, 'E1:F1'],
        header: ['A1:C1', 'E1:F1'],
        targets: ['E2:F' + last],
        showSpaces: ['A2:A' + last, 'C2:C' + last],
        start: 'E2',
      },
      objectives: [
        {
          text: T(`<b>Código limpio</b> (E2:E${last}) con ESPACIOS y MAYUSC.`, `<b>Clean code</b> (E2:E${last}) with TRIM and UPPER.`),
          hint: `=${fn('MAYUSC')}(${fn('ESPACIOS')}(A2))`,
          check: V.column('E', 2, last, (row) => upper(trim(rows[row - 2].rawCode)), { exact: true }),
        },
        {
          text: T(`<b>Categoría limpia</b> (F2:F${last}) con ESPACIOS y NOMPROPIO.`, `<b>Clean category</b> (F2:F${last}) with TRIM and PROPER.`),
          hint: `=${fn('NOMPROPIO')}(${fn('ESPACIOS')}(C2))`,
          check: V.column('F', 2, last, (row) => proper(trim(rows[row - 2].rawCat)), { exact: true }),
        },
        {
          text: T(`❓ ¿Cuántos productos son de la categoría <b>${asked}</b>?`, `❓ How many products are in the <b>${asked}</b> category?`),
          placeholder: T('Un número', 'A number'),
          hint: T(`Truco: en una columna libre poné =SI(F2="${asked}";1;0), rellená y sumá.`, `Trick: in a free column put =IF(F2="${asked}",1,0), fill down and sum.`),
          answer: V.answerNumber(askedCount),
        },
      ],
      tips: [T('Combiná herramientas: con SI + SUMA podés contar cualquier cosa.', 'Combine tools: with IF + SUM you can count anything.')],
      feedback: T('¡El sistema aceptó todo el catálogo! Te debo un café. ☕', 'The system accepted the whole catalog! I owe you a coffee. ☕'),
      solution: {
        fill: [['E', 2, last, '=MAYUSC(ESPACIOS(A2))'], ['F', 2, last, '=NOMPROPIO(ESPACIOS(C2))']],
        answers: { 2: String(askedCount) },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Nombre completo con & y LARGO
  // ---------------------------------------------------------------------------
  C.register('m4_fullname', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [10, 12], [20, 25], [35, 40]);
    const parts = C.peopleParts(r, n).map((p, i) => ({ first: mess(r, p.first, i === 0), last: mess(r, p.last) }));
    const full = (p) => proper(trim(p.first)) + ' ' + proper(trim(p.last));
    const lens = parts.map((p) => full(p).length);
    const maxLen = Math.max(...lens);
    const last = n + 1;
    const fn = AA.fnName;
    return {
      from: 'paula',
      dept: 'rrhh',
      subject: T('Credenciales del evento', 'Event badges'),
      file: T('credenciales.xlsx', 'badges.xlsx'),
      email: T(
        `<p>Vamos a imprimir las credenciales del evento anual y el nombre y el apellido vienen en columnas separadas (y desprolijos).</p>
         <p>Necesito el <b>Nombre completo</b> prolijo ("Nombre Apellido") y su <b>largo</b>, porque la credencial tiene un límite de caracteres.</p>`,
        `<p>We're printing badges for the annual event and first and last names come in separate (messy) columns.</p>
         <p>I need a tidy <b>Full name</b> ("First Last") and its <b>length</b>, because the badge has a character limit.</p>`
      ),
      sheet: {
        cols: 8,
        rows: n + 8,
        colWidths: [140, 140, 200, 90, 24, 90, 60, 60],
        data: { at: 'A1', rows: [[T('Nombre', 'First name'), T('Apellido', 'Last name')], ...parts.map((p) => [p.first, p.last])] },
        cells: { C1: T('Nombre completo', 'Full name'), D1: T('Largo', 'Length') },
        locked: ['A1:D1', 'A2:B' + last],
        header: ['A1:D1'],
        targets: ['C2:D' + last],
        showSpaces: ['A2:B' + last],
        start: 'C2',
      },
      objectives: [
        {
          text: T(`<b>Nombre completo</b> (C2:C${last}): nombre y apellido limpios, separados por un espacio.`, `<b>Full name</b> (C2:C${last}): clean first and last name, separated by a space.`),
          hint: `=${fn('NOMPROPIO')}(${fn('ESPACIOS')}(A2)) & " " & ${fn('NOMPROPIO')}(${fn('ESPACIOS')}(B2))`,
          check: V.column('C', 2, last, (row) => full(parts[row - 2]), { exact: true, wrongNote: T('Tiene que quedar "Nombre Apellido", con un solo espacio en el medio.', 'It should be "First Last", with a single space in between.') }),
        },
        {
          text: T(`<b>Largo</b> (D2:D${last}) con LARGO.`, `<b>Length</b> (D2:D${last}) with LEN.`),
          hint: `=${fn('LARGO')}(C2)`,
          check: V.column('D', 2, last, (row) => lens[row - 2], { uses: ['LARGO'] }),
        },
        {
          text: T('❓ ¿Cuántos caracteres tiene el <b>nombre completo más largo</b>?', '❓ How many characters does the <b>longest full name</b> have?'),
          placeholder: T('Un número', 'A number'),
          hint: T('MAX sobre la columna D.', 'MAX over column D.'),
          answer: V.answerNumber(maxLen),
        },
      ],
      tips: [T('El operador <b>&amp;</b> pega textos: <code>=A2&amp;" "&amp;B2</code>.', 'The <b>&amp;</b> operator glues texts: <code>=A2&amp;" "&amp;B2</code>.')],
      feedback: T('¡Las credenciales quedaron perfectas! Ni un nombre cortado.', 'The badges came out perfect! Not a single name cut off.'),
      solution: {
        fill: [['C', 2, last, '=NOMPROPIO(ESPACIOS(A2))&" "&NOMPROPIO(ESPACIOS(B2))'], ['D', 2, last, '=LARGO(C2)']],
        answers: { 2: String(maxLen) },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Emails corporativos
  // ---------------------------------------------------------------------------
  C.register('m4_emails', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [10, 12], [20, 25], [35, 40]);
    const parts = C.peopleParts(r, n, true).map((p, i) => ({ first: mess(r, p.first, i === 0), last: mess(r, p.last) }));
    const mail = (p) => lower(trim(p.first) + '.' + trim(p.last) + '@grupocondor.com');
    const ask = parts[r.int(1, n - 1)];
    const last = n + 1;
    const fn = AA.fnName;
    return {
      from: 'sofi',
      dept: 'data',
      subject: T('Altas de emails corporativos', 'New corporate email accounts'),
      file: T('altas_emails.xlsx', 'email_accounts.xlsx'),
      email: T(
        `<p>Entran ${n} personas nuevas y tengo que crearles el email. El formato es <b>nombre.apellido@grupocondor.com</b>, todo en minúsculas y sin espacios.</p>`,
        `<p>${n} new people are joining and I need to create their email accounts. The format is <b>first.last@grupocondor.com</b>, all lowercase and no spaces.</p>`
      ),
      sheet: {
        cols: 7,
        rows: n + 8,
        colWidths: [140, 140, 280, 24, 90, 60, 60],
        data: { at: 'A1', rows: [[T('Nombre', 'First name'), T('Apellido', 'Last name')], ...parts.map((p) => [p.first, p.last])] },
        cells: { C1: T('Email corporativo', 'Corporate email') },
        locked: ['A1:C1', 'A2:B' + last],
        header: ['A1:C1'],
        targets: ['C2:C' + last],
        showSpaces: ['A2:B' + last],
        start: 'C2',
      },
      objectives: [
        {
          text: T(`<b>Email corporativo</b> (C2:C${last}): nombre.apellido@grupocondor.com en minúsculas.`, `<b>Corporate email</b> (C2:C${last}): first.last@grupocondor.com in lowercase.`),
          hint: `=${fn('MINUSC')}(${fn('ESPACIOS')}(A2) & "." & ${fn('ESPACIOS')}(B2) & "@grupocondor.com")`,
          check: V.column('C', 2, last, (row) => mail(parts[row - 2]), { exact: true, uses: ['MINUSC'], wrongNote: T('Revisá: sin espacios, en minúsculas y con el punto entre nombre y apellido.', 'Check: no spaces, lowercase and a dot between first and last name.') }),
        },
        {
          text: T(`❓ ¿Cuál es el email de <b>${proper(trim(ask.first))} ${proper(trim(ask.last))}</b>?`, `❓ What is <b>${proper(trim(ask.first))} ${proper(trim(ask.last))}</b>'s email?`),
          placeholder: 'nombre.apellido@grupocondor.com',
          hint: T('Buscá su fila en la columna C.', 'Find their row in column C.'),
          answer: V.answerText([mail(ask)]),
        },
      ],
      tips: [T('Dentro de una fórmula, los textos fijos van entre comillas: "@grupocondor.com".', 'Inside a formula, fixed text goes in quotes: "@grupocondor.com".')],
      feedback: T('Cuentas creadas sin un solo rebote. ¡Gracias!', 'Accounts created without a single bounce. Thanks!'),
      solution: { fill: [['C', 2, last, '=MINUSC(ESPACIOS(A2)&"."&ESPACIOS(B2)&"@grupocondor.com")']], answers: { 1: mail(ask) } },
    };
  });

  // ---------------------------------------------------------------------------
  // Validar teléfonos con LARGO + SI
  // ---------------------------------------------------------------------------
  C.register('m4_phones', (ctx) => {
    const r = ctx.rng;
    const n = C.rowsFor(ctx, [10, 12], [20, 25], [35, 40]);
    const digits = (k) => {
      let s = String(r.int(1, 9));
      while (s.length < k) s += r.int(0, 9);
      return s;
    };
    const rows = C.people(r, n).map((who, i) => {
      const len = i === 0 ? 9 : i === 1 ? 10 : r.chance(0.25) ? r.pick([9, 11]) : 10;
      return { who, phone: messSpaces(r, digits(len), i === 1) };
    });
    const len = (x) => trim(x.phone).length;
    const review = T('Revisar', 'Check');
    const bad = rows.filter((x) => len(x) !== 10).length;
    const last = n + 1;
    const fn = AA.fnName;
    return {
      from: 'bruno',
      dept: 'ventas',
      subject: T('Teléfonos mal cargados', 'Badly entered phone numbers'),
      file: T('telefonos_clientes.xlsx', 'customer_phones.xlsx'),
      email: T(
        `<p>El sistema de SMS solo acepta teléfonos de <b>10 dígitos</b>, y la base tiene espacios y números mal cargados.</p>
         <ul><li><b>Largo</b>: cuántos dígitos tiene el teléfono, sin contar espacios.</li><li><b>Estado</b>: "OK" si tiene 10; si no, "${review}".</li></ul>`,
        `<p>The SMS system only accepts <b>10-digit</b> phone numbers, and the list has spaces and wrong numbers.</p>
         <ul><li><b>Length</b>: how many digits the phone number has, without spaces.</li><li><b>Status</b>: "OK" if it has 10; otherwise "${review}".</li></ul>`
      ),
      sheet: {
        cols: 8,
        rows: n + 8,
        colWidths: [170, 150, 90, 110, 24, 90, 60, 60],
        data: { at: 'A1', rows: [[T('Cliente', 'Customer'), T('Teléfono', 'Phone')], ...rows.map((x) => [x.who, x.phone])] },
        cells: { C1: T('Largo', 'Length'), D1: T('Estado', 'Status') },
        locked: ['A1:D1', 'A2:B' + last],
        header: ['A1:D1'],
        targets: ['C2:D' + last],
        showSpaces: ['B2:B' + last],
        start: 'C2',
      },
      objectives: [
        {
          text: T(`<b>Largo</b> (C2:C${last}): dígitos sin contar espacios.`, `<b>Length</b> (C2:C${last}): digits without counting spaces.`),
          hint: `=${fn('LARGO')}(${fn('ESPACIOS')}(B2))`,
          check: V.column('C', 2, last, (row) => len(rows[row - 2]), { uses: ['LARGO'], wrongNote: T('¿Contaste los espacios? Limpialos antes con ESPACIOS.', 'Did you count the spaces? Clean them first with TRIM.') }),
        },
        {
          text: T(`<b>Estado</b> (D2:D${last}): "OK" si tiene 10 dígitos; si no, "${review}".`, `<b>Status</b> (D2:D${last}): "OK" if it has 10 digits; otherwise "${review}".`),
          hint: `=${fn('SI')}(C2=10; "OK"; "${review}")`,
          check: V.column('D', 2, last, (row) => is(len(rows[row - 2]) === 10 ? 'OK' : review), { uses: ['SI'] }),
        },
        {
          text: T('❓ ¿Cuántos teléfonos hay que <b>revisar</b>?', '❓ How many phone numbers need <b>checking</b>?'),
          placeholder: T('Un número', 'A number'),
          hint: T(`Contá los "${review}".`, `Count the "${review}".`),
          answer: V.answerNumber(bad),
        },
      ],
      tips: [T('LARGO cuenta espacios también: por eso conviene limpiar primero.', 'LEN counts spaces too: that is why you clean first.')],
      feedback: T('Listo, ya le pasé la lista a los que tienen que corregir los teléfonos.', "Done, I passed the list to the team that has to fix the numbers."),
      solution: { fill: [['C', 2, last, '=LARGO(ESPACIOS(B2))'], ['D', 2, last, `=SI(C2=10;"OK";"${review}")`]], answers: { 2: String(bad) } },
    };
  });

  function is(word) {
    return (v) => V.norm(v) === V.norm(word);
  }
})();
