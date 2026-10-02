/*
 * Analyst Adventure — Currículum: niveles, lecciones de Leo, páginas de la libreta y misiones.
 *
 * Cada nivel:
 *   1. Leo da la lección (y las páginas quedan en la libreta).
 *   2. Se desbloquean 5 tareas obligatorias (plantillas con semilla fija, tablas chicas).
 *   3. Al completarlas, se abre la práctica libre: casos aleatorios con tablas medianas o grandes.
 *   4. El nivel siguiente se abre al completar las 5 tareas (y, a veces, al llegar a cierto rango).
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});

  // ---------------------------------------------------------------------------
  // Páginas de la libreta (habilidades). `fns` agrega la sintaxis de esas funciones.
  // ---------------------------------------------------------------------------
  const SKILLS = {
    formulas: {
      title: { es: 'Fórmulas: el signo =', en: 'Formulas: the = sign' },
      say: {
        es: 'Todo empieza con el signo <b>=</b>. Si escribís <code>=2+3</code>, la celda muestra 5. Sin el igual, la planilla lo toma como texto y no calcula nada.',
        en: 'Everything starts with the <b>=</b> sign. If you type <code>=2+3</code>, the cell shows 5. Without the equals sign, the sheet treats it as text and calculates nothing.',
      },
      tip: { es: 'Si ves tu fórmula escrita tal cual en la celda, te olvidaste el =.', en: 'If you see your formula written as-is in the cell, you forgot the =.' },
    },
    refs: {
      title: { es: 'Referencias de celda', en: 'Cell references' },
      say: {
        es: 'Cada celda tiene una dirección: columna y fila, como <b>B2</b>. Con <code>=B2*C2</code> la fórmula usa lo que haya en esas celdas, y si los datos cambian, el resultado se actualiza solo.',
        en: 'Every cell has an address: column and row, like <b>B2</b>. With <code>=B2*C2</code> the formula uses whatever is in those cells, and if the data changes, the result updates by itself.',
      },
      tip: { es: 'Mientras escribís una fórmula, hacé clic en una celda para insertar su referencia.', en: 'While typing a formula, click a cell to insert its reference.' },
    },
    operators: {
      title: { es: 'Operadores: + − * / %', en: 'Operators: + − * / %' },
      say: {
        es: 'Para hacer cuentas: <code>+</code> suma, <code>-</code> resta, <code>*</code> multiplica y <code>/</code> divide. Primero se resuelven * y /; con paréntesis cambiás el orden: <code>=(B2+C2)*2</code>. Y <code>%</code> divide por 100: <code>21%</code> es 0.21.',
        en: 'To calculate: <code>+</code> adds, <code>-</code> subtracts, <code>*</code> multiplies and <code>/</code> divides. * and / go first; parentheses change the order: <code>=(B2+C2)*2</code>. And <code>%</code> divides by 100: <code>21%</code> is 0.21.',
      },
      tip: { es: 'Los decimales se escriben con punto: 0.5.', en: 'Decimals use a dot: 0.5.' },
    },
    fill: {
      title: { es: 'Rellenar y copiar fórmulas', en: 'Fill and copy formulas' },
      say: {
        es: 'No hace falta escribir la misma fórmula 50 veces. Seleccioná la celda y arrastrá el <b>cuadradito azul</b> de la esquina: la planilla ajusta las referencias solas (B2 pasa a B3, B4…). También sirven <b>Ctrl+D</b> y <b>Ctrl+C / Ctrl+V</b>.',
        en: "You don't need to type the same formula 50 times. Select the cell and drag the <b>little blue square</b> in its corner: the sheet adjusts the references by itself (B2 becomes B3, B4…). <b>Ctrl+D</b> and <b>Ctrl+C / Ctrl+V</b> work too.",
      },
      tip: { es: 'Seleccioná un rango y apretá Ctrl+D: copia la primera fila en todas.', en: 'Select a range and press Ctrl+D: it copies the first row into all of them.' },
    },
    rawdata: {
      title: { es: 'Regla de oro: no tocar los datos originales', en: "Golden rule: don't touch the original data" },
      say: {
        es: 'Las columnas grises son datos originales y están bloqueadas. Siempre se trabaja en columnas nuevas: si te equivocás, el original sigue intacto.',
        en: "Gray columns are original data and they're locked. Always work in new columns: if you make a mistake, the original stays intact.",
      },
      tip: { es: 'En un trabajo real nadie te va a bloquear las celdas: el hábito tiene que ser tuyo.', en: "In a real job nobody will lock the cells for you: the habit has to be yours." },
    },
    ranges: {
      title: { es: 'Rangos', en: 'Ranges' },
      say: {
        es: 'Un rango es un grupo de celdas: <code>B2:B10</code> significa "de B2 hasta B10". También puede ser un bloque (<code>B2:D10</code>) o una columna entera (<code>B:B</code>).',
        en: 'A range is a group of cells: <code>B2:B10</code> means "from B2 to B10". It can also be a block (<code>B2:D10</code>) or a whole column (<code>B:B</code>).',
      },
      tip: { es: 'Mientras escribís una fórmula, arrastrá con el mouse para insertar un rango.', en: 'While typing a formula, drag with the mouse to insert a range.' },
    },
    sum: {
      title: { es: 'SUMA', en: 'SUM' },
      fns: ['SUMA'],
      say: {
        es: '<b>SUMA</b> suma un rango entero de una: <code>=SUMA(B2:B10)</code>. Es lo mismo que B2+B3+…+B10, pero no se rompe si la tabla crece.',
        en: '<b>SUM</b> adds a whole range at once: <code>=SUM(B2:B10)</code>. Same as B2+B3+…+B10, but it doesn\'t break when the table grows.',
      },
      tip: { es: 'SUMA ignora los textos de un rango: por eso podés incluir el encabezado.', en: 'SUM ignores text in a range: that is why you can include the header.' },
    },
    average: {
      title: { es: 'PROMEDIO', en: 'AVERAGE' },
      fns: ['PROMEDIO'],
      say: {
        es: '<b>PROMEDIO</b> suma los números y divide por cuántos hay. Ignora las celdas vacías y los textos.',
        en: '<b>AVERAGE</b> adds the numbers and divides by how many there are. It ignores empty cells and text.',
      },
      tip: { es: 'Un promedio puede engañar si hay valores extremos: mirá también MAX y MIN.', en: 'An average can mislead when there are extreme values: check MAX and MIN too.' },
    },
    maxmin: {
      title: { es: 'MAX y MIN', en: 'MAX and MIN' },
      fns: ['MAX', 'MIN'],
      say: {
        es: '<b>MAX</b> devuelve el número más grande de un rango y <b>MIN</b> el más chico. Sirven para encontrar récords… y errores de carga.',
        en: '<b>MAX</b> returns the largest number in a range and <b>MIN</b> the smallest. Great for finding records… and data-entry errors.',
      },
      tip: { es: 'Para saber de QUIÉN es el máximo, buscalo en la columna con la vista (por ahora).', en: 'To find WHO has the maximum, look for it in the column (for now).' },
    },
    count: {
      title: { es: 'CONTAR y CONTARA', en: 'COUNT and COUNTA' },
      fns: ['CONTAR', 'CONTARA'],
      say: {
        es: '<b>CONTAR</b> cuenta celdas con números; <b>CONTARA</b> cuenta celdas no vacías (texto incluido). Para saber cuántas filas tiene tu tabla, CONTARA sobre una columna de nombres es ideal.',
        en: '<b>COUNT</b> counts cells with numbers; <b>COUNTA</b> counts non-empty cells (text included). To know how many rows your table has, COUNTA over a names column is ideal.',
      },
      tip: { es: 'CONTAR sobre una columna de texto da 0: no es un error, es que no hay números.', en: 'COUNT over a text column gives 0: not an error, there are just no numbers.' },
    },
    compare: {
      title: { es: 'Comparaciones', en: 'Comparisons' },
      say: {
        es: 'Una comparación devuelve VERDADERO o FALSO: <code>=C2>=D2</code>. Los comparadores son <code>=</code>, <code>&lt;&gt;</code> (distinto), <code>&gt;</code>, <code>&lt;</code>, <code>&gt;=</code> y <code>&lt;=</code>.',
        en: 'A comparison returns TRUE or FALSE: <code>=C2>=D2</code>. The operators are <code>=</code>, <code>&lt;&gt;</code> (not equal), <code>&gt;</code>, <code>&lt;</code>, <code>&gt;=</code> and <code>&lt;=</code>.',
      },
      tip: { es: 'Ojo con los bordes: "llegar a la meta" ¿es &gt; o &gt;=?', en: 'Watch the edges: is "reaching the goal" &gt; or &gt;=?' },
    },
    if: {
      title: { es: 'SI: tomar decisiones', en: 'IF: making decisions' },
      fns: ['SI'],
      say: {
        es: '<b>SI</b> toma una decisión: <code>=SI(C2>=D2; "Sí"; "No")</code>. Primero la prueba, después qué mostrar si se cumple y por último qué mostrar si no. Los resultados también pueden ser cuentas: <code>=SI(C2>=D2; C2*10%; 0)</code>.',
        en: '<b>IF</b> makes a decision: <code>=IF(C2>=D2, "Yes", "No")</code>. First the test, then what to show if it is true and finally what to show if not. Results can be calculations too: <code>=IF(C2>=D2, C2*10%, 0)</code>.',
      },
      tip: { es: 'Leelo en voz alta: "SI pasa esto, mostrá esto; si no, esto otro".', en: 'Read it out loud: "IF this happens, show this; otherwise, that".' },
    },
    quotes: {
      title: { es: 'Textos dentro de fórmulas', en: 'Text inside formulas' },
      say: {
        es: 'Si una fórmula tiene que escribir un texto, va entre comillas dobles: <code>"Aprobado"</code>. Sin comillas, la planilla cree que es el nombre de algo y muestra <b>#NAME?</b>.',
        en: 'If a formula has to write text, it goes in double quotes: <code>"Pass"</code>. Without quotes, the sheet thinks it is the name of something and shows <b>#NAME?</b>.',
      },
      tip: { es: 'Los números van sin comillas: "100" es un texto, 100 es un número.', en: 'Numbers go without quotes: "100" is text, 100 is a number.' },
    },
    andor: {
      title: { es: 'Y / O: varias condiciones', en: 'AND / OR: several conditions' },
      fns: ['Y', 'O'],
      say: {
        es: '<b>Y</b> es VERDADERO si se cumplen <i>todas</i> las condiciones; <b>O</b> si se cumple <i>al menos una</i>. Se usan dentro de SI: <code>=SI(Y(B2>=5; C2>=1000); "VIP"; "Estándar")</code>.',
        en: '<b>AND</b> is TRUE if <i>all</i> conditions are met; <b>OR</b> if <i>at least one</i> is. Use them inside IF: <code>=IF(AND(B2>=5, C2>=1000), "VIP", "Standard")</code>.',
      },
      tip: { es: 'Probá cada condición por separado en una celda libre si el resultado no te cierra.', en: "Test each condition separately in a free cell if the result doesn't add up." },
    },
    trim: {
      title: { es: 'ESPACIOS', en: 'TRIM' },
      fns: ['ESPACIOS'],
      say: {
        es: 'Los datos que vienen de formularios están llenos de espacios invisibles. <b>ESPACIOS</b> borra los del principio y del final, y deja uno solo entre palabras.',
        en: 'Data coming from forms is full of invisible spaces. <b>TRIM</b> removes the ones at the start and end, and leaves a single space between words.',
      },
      tip: { es: 'Los espacios invisibles rompen búsquedas y conteos: limpialos siempre primero.', en: 'Invisible spaces break lookups and counts: always clean them first.' },
    },
    case: {
      title: { es: 'MAYUSC, MINUSC y NOMPROPIO', en: 'UPPER, LOWER and PROPER' },
      fns: ['MAYUSC', 'MINUSC', 'NOMPROPIO'],
      say: {
        es: '<b>MAYUSC</b> pasa todo a mayúsculas, <b>MINUSC</b> a minúsculas y <b>NOMPROPIO</b> pone En Mayúscula Cada Palabra. Ideales para nombres, emails y códigos.',
        en: '<b>UPPER</b> makes everything uppercase, <b>LOWER</b> lowercase and <b>PROPER</b> Capitalizes Each Word. Ideal for names, emails and codes.',
      },
      tip: { es: 'Los emails siempre en minúsculas; los códigos, en mayúsculas.', en: 'Emails always lowercase; codes, uppercase.' },
    },
    nesting: {
      title: { es: 'Anidar funciones', en: 'Nesting functions' },
      say: {
        es: 'Una función puede ir adentro de otra: <code>=NOMPROPIO(ESPACIOS(A2))</code>. Se resuelve de adentro hacia afuera: primero limpia los espacios y después arregla las mayúsculas.',
        en: 'A function can go inside another one: <code>=PROPER(TRIM(A2))</code>. It is solved from the inside out: first it cleans the spaces, then it fixes the capitals.',
      },
      tip: { es: 'Contá los paréntesis: cada función que abrís hay que cerrarla.', en: 'Count the parentheses: every function you open must be closed.' },
    },
    concat: {
      title: { es: 'Unir textos con &', en: 'Joining text with &' },
      fns: ['CONCATENAR'],
      say: {
        es: 'El operador <b>&amp;</b> pega textos: <code>=A2&amp;" "&amp;B2</code> une nombre y apellido con un espacio en el medio. CONCATENAR hace lo mismo.',
        en: 'The <b>&amp;</b> operator glues texts: <code>=A2&amp;" "&amp;B2</code> joins first and last name with a space in between. CONCATENATE does the same.',
      },
      tip: { es: 'No te olvides del espacio entre comillas, si no queda "JuanPérez".', en: 'Don\'t forget the space in quotes, or you get "JohnSmith".' },
    },
    len: {
      title: { es: 'LARGO', en: 'LEN' },
      fns: ['LARGO'],
      say: {
        es: '<b>LARGO</b> cuenta los caracteres de una celda, espacios incluidos. Sirve para validar códigos, teléfonos o documentos que deben tener un largo fijo.',
        en: '<b>LEN</b> counts the characters in a cell, spaces included. Useful to validate codes, phone numbers or IDs that must have a fixed length.',
      },
      tip: { es: 'Combinalo con SI: =SI(LARGO(B2)=10; "OK"; "Revisar").', en: 'Combine it with IF: =IF(LEN(B2)=10, "OK", "Check").' },
    },
    countif: {
      title: { es: 'CONTAR.SI', en: 'COUNTIF' },
      fns: ['CONTAR.SI'],
      say: {
        es: '<b>CONTAR.SI</b> cuenta las celdas que cumplen un criterio: <code>=CONTAR.SI(B2:B50; "Norte")</code>. El criterio puede ser un texto, una celda (H2) o una comparación entre comillas: <code>"&gt;1000"</code>.',
        en: '<b>COUNTIF</b> counts the cells that meet a criterion: <code>=COUNTIF(B2:B50, "North")</code>. The criterion can be text, a cell (H2) or a comparison in quotes: <code>"&gt;1000"</code>.',
      },
      tip: { es: '"&lt;&gt;Cancelado" cuenta todo lo que NO es Cancelado. "N*" cuenta lo que empieza con N.', en: '"&lt;&gt;Cancelled" counts everything that is NOT Cancelled. "N*" counts what starts with N.' },
    },
    sumif: {
      title: { es: 'SUMAR.SI', en: 'SUMIF' },
      fns: ['SUMAR.SI'],
      say: {
        es: '<b>SUMAR.SI</b> suma solo las filas que cumplen el criterio: <code>=SUMAR.SI(B2:B50; "Norte"; E2:E50)</code>. Primero dónde buscar, después qué buscar y al final qué sumar.',
        en: '<b>SUMIF</b> adds only the rows that meet the criterion: <code>=SUMIF(B2:B50, "North", E2:E50)</code>. First where to look, then what to look for and finally what to add.',
      },
      tip: { es: 'El rango de búsqueda y el de suma tienen que tener el mismo tamaño.', en: 'The lookup range and the sum range must be the same size.' },
    },
    ifs: {
      title: { es: 'Varias condiciones: .CONJUNTO', en: 'Several conditions: …IFS' },
      fns: ['CONTAR.SI.CONJUNTO', 'SUMAR.SI.CONJUNTO'],
      say: {
        es: '<b>CONTAR.SI.CONJUNTO</b> y <b>SUMAR.SI.CONJUNTO</b> aceptan varios pares rango/criterio, y todos tienen que cumplirse. Ojo: en SUMAR.SI.CONJUNTO el rango a sumar va <b>primero</b>.',
        en: '<b>COUNTIFS</b> and <b>SUMIFS</b> accept several range/criterion pairs, and all of them must be met. Careful: in SUMIFS the range to add goes <b>first</b>.',
      },
      tip: { es: 'Cada par es "dónde buscar; qué buscar".', en: 'Each pair is "where to look, what to look for".' },
    },
    absolute: {
      title: { es: 'Referencias absolutas ($)', en: 'Absolute references ($)' },
      say: {
        es: 'Al copiar una fórmula, las referencias se corren. Si un rango o una celda tienen que quedarse quietos, fijalos con $: <code>$B$2:$B$50</code> o <code>$F$5</code>. Mientras editás, <b>F4</b> agrega los $ por vos.',
        en: 'When you copy a formula, references shift. If a range or a cell must stay put, lock it with $: <code>$B$2:$B$50</code> or <code>$F$5</code>. While editing, <b>F4</b> adds the $ for you.',
      },
      tip: { es: 'Si al copiar los números de abajo dan raro, casi seguro te faltó un $.', en: 'If the numbers below look off after copying, you almost certainly missed a $.' },
    },
    mixed: {
      title: { es: 'Referencias mixtas', en: 'Mixed references' },
      say: {
        es: '<code>$G2</code> fija solo la columna y <code>H$1</code> fija solo la fila. Con eso armás tablas de doble entrada escribiendo una sola fórmula y copiándola hacia abajo y hacia la derecha.',
        en: '<code>$G2</code> locks only the column and <code>H$1</code> locks only the row. With that you build cross-tabs by writing a single formula and copying it down and to the right.',
      },
      tip: { es: 'F4 varias veces: $A$1 → A$1 → $A1 → A1.', en: 'F4 several times: $A$1 → A$1 → $A1 → A1.' },
    },
  };

  // ---------------------------------------------------------------------------
  // Niveles
  // ---------------------------------------------------------------------------
  const MODULES = [
    {
      id: 'mod1',
      title: { es: 'Fórmulas básicas', en: 'Basic formulas' },
      xp: 40,
      minRank: 0,
      skills: ['formulas', 'refs', 'operators', 'fill', 'rawdata'],
      templates: ['m1_orders', 'm1_budget', 'm1_stock', 'm1_vat', 'm1_unit'],
      seeds: [101, 102, 103, 104, 105],
      intro: {
        es: '¡Hola! Así que vos sos la persona nueva. Antes de que toques datos reales, te explico lo básico de las planillas. Prestá atención, que es la base de todo.',
        en: "Hi! So you're the new hire. Before you touch real data, let me explain spreadsheet basics. Pay attention: it's the foundation of everything.",
      },
    },
    {
      id: 'mod2',
      title: { es: 'Funciones de resumen', en: 'Summary functions' },
      xp: 50,
      minRank: 0,
      skills: ['ranges', 'sum', 'average', 'maxmin', 'count'],
      templates: ['m2_quarter', 'm2_visits', 'm2_training', 'm2_expenses', 'm2_callcenter'],
      seeds: [201, 202, 203, 204, 205],
      intro: {
        es: 'Ya hacés cuentas celda por celda. Ahora vamos a resumir columnas enteras con <b>funciones</b>: cinco que vas a usar todos los días.',
        en: 'You can already calculate cell by cell. Now we\'ll summarize whole columns with <b>functions</b>: five you\'ll use every single day.',
      },
    },
    {
      id: 'mod3',
      title: { es: 'Lógica: SI', en: 'Logic: IF' },
      xp: 60,
      minRank: 0,
      skills: ['compare', 'if', 'quotes', 'andor'],
      templates: ['m3_bonus', 'm3_grades', 'm3_restock', 'm3_shipping', 'm3_vip'],
      seeds: [301, 302, 303, 304, 305],
      intro: {
        es: 'Hora de que tus planillas <b>tomen decisiones</b>. Con esto vas a poder clasificar, marcar alertas y calcular bonos.',
        en: 'Time for your spreadsheets to <b>make decisions</b>. With this you\'ll classify rows, flag alerts and calculate bonuses.',
      },
    },
    {
      id: 'mod4',
      title: { es: 'Limpieza de texto', en: 'Text cleaning' },
      xp: 70,
      minRank: 1,
      skills: ['trim', 'case', 'nesting', 'concat', 'len'],
      templates: ['m4_clients', 'm4_codes', 'm4_fullname', 'm4_emails', 'm4_phones'],
      seeds: [401, 402, 403, 404, 405],
      intro: {
        es: '¡Felicitaciones por el ascenso! Ahora toca la parte que nadie te cuenta del trabajo: <b>limpiar datos</b>. Los datos reales vienen sucios. Siempre.',
        en: 'Congrats on the promotion! Now comes the part of the job nobody tells you about: <b>cleaning data</b>. Real data comes dirty. Always.',
      },
    },
    {
      id: 'mod5',
      title: { es: 'Conteos condicionales y $', en: 'Conditional counts and $' },
      xp: 80,
      minRank: 1,
      skills: ['countif', 'sumif', 'ifs', 'absolute', 'mixed'],
      templates: ['m5_shipments', 'm5_sales', 'm5_tickets', 'm5_commission', 'm5_matrix'],
      seeds: [501, 502, 503, 504, 505],
      intro: {
        es: 'Último tema de esta etapa, y el que más vas a usar en tu vida: <b>contar y sumar con condiciones</b>. Y de yapa, el famoso <b>$</b>.',
        en: 'The last topic of this stage, and the one you\'ll use the most in your life: <b>counting and adding with conditions</b>. Plus, the famous <b>$</b>.',
      },
    },
  ];
  const REQUIRED = 5;

  const ST = () => AA.State;
  const moduleById = (id) => MODULES.find((m) => m.id === id) || null;
  const storyId = (mod, k) => `${mod.id}-${k + 1}`;

  const Curriculum = {
    MODULES,
    SKILLS,
    REQUIRED,
    moduleById,

    // --- Estado de cada nivel
    requiredIds(mod) {
      return mod.templates.slice(0, REQUIRED).map((_, k) => storyId(mod, k));
    },
    doneCount(mod) {
      return this.requiredIds(mod).filter((id) => ST().isCompleted(id)).length;
    },
    isModuleComplete(mod) {
      return this.doneCount(mod) >= REQUIRED;
    },
    // Motivo por el que un nivel está bloqueado (o null si está abierto).
    lockReason(mod) {
      const i = MODULES.indexOf(mod);
      if (i > 0 && !this.isModuleComplete(MODULES[i - 1])) {
        return AA.T(`Completá las ${REQUIRED} tareas del Nivel ${i}`, `Complete the ${REQUIRED} tasks of Level ${i}`);
      }
      if (ST().rankIndex() < mod.minRank) {
        return AA.T(`Requiere ser ${AA.L(ST().RANKS[mod.minRank].name)} (practicá para sumar XP)`, `Requires ${AA.L(ST().RANKS[mod.minRank].name)} (practice to earn XP)`);
      }
      return null;
    },
    isUnlocked(mod) {
      return !this.lockReason(mod);
    },
    lessonDone(mod) {
      return !!ST().data.lessons[mod.id];
    },
    // Nivel en curso: el primero abierto que no está completo (o el último).
    currentModule() {
      for (const m of MODULES) if (this.isUnlocked(m) && !this.isModuleComplete(m)) return m;
      return null;
    },
    // ¿Leo tiene una lección pendiente?
    pendingLesson() {
      return MODULES.find((m) => this.isUnlocked(m) && !this.lessonDone(m)) || null;
    },
    unlockedModules() {
      return MODULES.filter((m) => this.isUnlocked(m));
    },

    // --- Misiones obligatorias
    missionAvailable(id) {
      const p = this.parseId(id);
      if (!p || p.kind !== 'story') return false;
      const mod = moduleById(p.mod);
      if (!mod || !this.isUnlocked(mod) || !this.lessonDone(mod)) return false;
      return p.k === 0 || ST().isCompleted(storyId(mod, p.k - 1));
    },
    nextMission() {
      const mod = this.currentModule();
      if (!mod || !this.lessonDone(mod)) return null;
      return this.requiredIds(mod).find((id) => !ST().isCompleted(id)) || null;
    },

    // --- Identificadores: "mod1-3" (obligatoria) o "p:mod1:m1_vat:medium:12345" (práctica)
    parseId(id) {
      let m = /^(mod\d+)-(\d+)$/.exec(id);
      if (m) return { kind: 'story', mod: m[1], k: Number(m[2]) - 1 };
      m = /^p:(mod\d+):([a-z0-9_]+):(medium|large):(\d+)$/.exec(id);
      if (m) return { kind: 'practice', mod: m[1], template: m[2], size: m[3], seed: Number(m[4]) };
      return null;
    },
    practiceId(mod, template, size, seed) {
      return `p:${mod.id}:${template}:${size}:${seed}`;
    },
    newPractice(mod, size) {
      const template = mod.templates[Math.floor(Math.random() * mod.templates.length)];
      const seed = Math.floor(Math.random() * 1e9);
      return this.practiceId(mod, template, size, seed);
    },
    practiceXp(mod, size) {
      return size === 'large' ? Math.round(mod.xp * 1.6) : mod.xp;
    },

    // Arma la misión completa en el idioma pedido.
    build(id, lang) {
      const p = this.parseId(id);
      if (!p) return null;
      const mod = moduleById(p.mod);
      if (!mod) return null;
      let m;
      if (p.kind === 'story') {
        m = AA.Content.build(mod.templates[p.k], { seed: mod.seeds[p.k], size: 'small', story: true, first: mod.id === 'mod1' && p.k === 0, lang });
        m.xp = mod.xp;
        m.order = p.k + 1;
      } else {
        m = AA.Content.build(p.template, { seed: p.seed, size: p.size, lang });
        m.xp = this.practiceXp(mod, p.size);
        m.subject = AA.T('🎲 Práctica · ', '🎲 Practice · ') + m.subject;
      }
      m.id = id;
      m.kind = p.kind;
      m.module = mod.id;
      m.teaches = mod.skills;
      return m;
    },

    // Lección de Leo como líneas de diálogo.
    lessonLines(mod) {
      const lines = [{ who: 'leo', text: mod.intro }];
      for (const id of mod.skills) lines.push({ who: 'leo', text: SKILLS[id].say });
      lines.push({
        who: 'leo',
        text: {
          es: `Todo esto te lo dejé anotado en tu <b>libreta</b> (botón 📒). Ahora andá a tu computadora: tenés <b>${REQUIRED} tareas</b> del Nivel ${MODULES.indexOf(mod) + 1}. Cuando las termines, podés seguir practicando con casos nuevos para sumar experiencia.`,
          en: `I wrote all of this down in your <b>notebook</b> (📒 button). Now go to your computer: you have <b>${REQUIRED} tasks</b> in Level ${MODULES.indexOf(mod) + 1}. Once you finish them, you can keep practicing with new cases to earn experience.`,
        },
      });
      return lines;
    },
  };

  AA.Curriculum = Curriculum;
})();
