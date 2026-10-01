/*
 * Analyst Adventure — Misiones de la Etapa 1 (Pasante → Analista Junior).
 * Fórmulas básicas, rellenar, SUMA/PROMEDIO/MAX/MIN, SI, limpieza de texto y CONTAR.SI/SUMAR.SI.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const V = AA.V;
  const F = AA.Formula;

  // -------------------------------------------------------------------------
  // M1 — Pedidos de la semana
  // -------------------------------------------------------------------------
  const pedidos = [
    [1001, 'Teclado', 3, 25],
    [1002, 'Mouse', 10, 12.5],
    [1003, 'Monitor 24"', 2, 180],
    [1004, 'Auriculares', 5, 40],
    [1005, 'Webcam HD', 4, 55],
    [1006, 'Notebook', 1, 950],
    [1007, 'Silla ergonómica', 2, 210],
    [1008, 'Cable HDMI', 15, 8],
    [1009, 'Pendrive 32GB', 20, 9.5],
    [1010, 'Escritorio', 1, 320],
  ];
  const m1 = {
    id: 'm1_pedidos',
    stage: 1,
    xp: 100,
    dept: 'Ventas',
    from: 'marta',
    subject: 'Tu primera tarea: los pedidos de la semana',
    file: 'pedidos_semana.xlsx',
    email: `
      <p>¡Hola, {name}! Bienvenida/o al equipo de Analytics.</p>
      <p>Ventas nos mandó los pedidos de la semana, pero les falta lo más importante: <b>cuánto facturó cada pedido</b>.</p>
      <p>Te pido que agregues la columna <b>Total</b> (Cantidad × Precio unitario). Y no la calcules con la calculadora del celular 😅: usá <b>fórmulas</b>, así si cambia un dato el total se actualiza solo.</p>
      <p>Las columnas A a D son los datos originales: <b>no se tocan</b>.</p>
      <p>— Marta</p>`,
    sheet: {
      cols: 8,
      rows: 18,
      colWidths: [80, 150, 90, 120, 120, 90, 90, 90],
      data: { at: 'A1', rows: [['Pedido', 'Producto', 'Cantidad', 'Precio unitario'], ...pedidos] },
      locked: ['A1:D11'],
      header: ['A1:E1'],
      targets: ['E1:E11'],
      formats: { C: 'int', D: 'currency', E: 'currency' },
      start: 'E1',
    },
    objectives: [
      {
        text: 'Escribí el encabezado <b>Total</b> en la celda <b>E1</b>.',
        hint: 'Hacé clic en E1, escribí Total y presioná Enter.',
        check: V.text('E1', 'Total'),
      },
      {
        text: 'En <b>E2</b>, calculá el total del pedido 1001 con una fórmula: <code>=C2*D2</code>.',
        hint: 'Las fórmulas empiezan con "=". Escribí =C2*D2 en E2. También podés escribir "=" y hacer clic en C2, luego "*" y clic en D2.',
        check: V.cell('E2', pedidos[0][2] * pedidos[0][3], { refs: ['C2', 'D2'] }),
      },
      {
        text: 'Copiá la fórmula hacia abajo hasta <b>E11</b>.',
        hint: 'Seleccioná E2 y arrastrá el cuadradito azul de la esquina inferior derecha hasta E11. Otra opción: seleccioná E2:E11 y presioná Ctrl+D.',
        check: V.column('E', 3, 11, (r) => pedidos[r - 2][2] * pedidos[r - 2][3], { refsFn: (r) => ['C' + r, 'D' + r] }),
      },
      {
        text: '❓ ¿Qué producto generó el pedido de <b>mayor total</b>?',
        placeholder: 'Nombre del producto',
        hint: 'Mirá la columna E una vez completa y buscá el número más grande.',
        answer: V.answerText(['Notebook']),
      },
    ],
    tips: [
      'Toda fórmula empieza con <b>=</b>. Sin el igual, la hoja lo toma como texto.',
      'Una referencia como <b>C2</b> apunta a una celda: si el dato cambia, el resultado también.',
      'Al copiar una fórmula hacia abajo, las referencias se ajustan solas: C2 pasa a ser C3, C4…',
    ],
    teaches: [],
    feedback: '¡Excelente arranque! Las fórmulas que se actualizan solas son la base de todo lo que viene.',
  };

  // -------------------------------------------------------------------------
  // M2 — Resumen del primer trimestre
  // -------------------------------------------------------------------------
  const vendedores = [
    ['Ana Torres', 'Norte', 12400, 13100, 11800],
    ['Bruno Díaz', 'Sur', 9800, 10200, 9500],
    ['Carla Méndez', 'Centro', 15300, 14900, 16200],
    ['Diego Ruiz', 'Norte', 8700, 9100, 9900],
    ['Elena Paz', 'Oeste', 11200, 10800, 12500],
    ['Facundo Gil', 'Centro', 13400, 12900, 13800],
    ['Gabriela Sosa', 'Sur', 10100, 11300, 10900],
    ['Hernán Vega', 'Oeste', 7600, 8200, 7900],
    ['Inés Ramos', 'Norte', 14200, 15100, 14800],
    ['Julián Castro', 'Centro', 9300, 9700, 10400],
    ['Karina López', 'Sur', 12800, 12100, 13300],
    ['Lucas Ferreyra', 'Oeste', 10600, 11000, 10200],
  ];
  const totQ1 = vendedores.map((v) => v[2] + v[3] + v[4]);
  const sumQ1 = totQ1.reduce((a, b) => a + b, 0);
  const m2 = {
    id: 'm2_resumen',
    stage: 1,
    xp: 150,
    dept: 'Ventas',
    from: 'marta',
    subject: 'Resumen del trimestre para gerencia',
    file: 'ventas_Q1.xlsx',
    email: `
      <p>{name}, gerencia quiere un resumen rápido del <b>primer trimestre</b>.</p>
      <p>Primero completá el <b>Total Q1</b> de cada vendedor (enero + febrero + marzo) usando la función <b>SUMA</b>.</p>
      <p>Después armá el cuadro de indicadores de la derecha: ventas totales, promedio por vendedor, el mejor y el peor total individual, y cuántos vendedores hay.</p>
      <p>Ah, y decime quién fue la estrella del trimestre, que quiero felicitarla/o.</p>
      <p>— Marta</p>`,
    sheet: {
      cols: 10,
      rows: 20,
      colWidths: [130, 80, 90, 90, 90, 100, 24, 190, 110, 60],
      data: { at: 'A1', rows: [['Vendedor', 'Región', 'Enero', 'Febrero', 'Marzo', 'Total Q1'], ...vendedores] },
      cells: {
        H1: 'Indicador',
        I1: 'Valor',
        H2: 'Ventas totales Q1',
        H3: 'Promedio por vendedor',
        H4: 'Mayor total individual',
        H5: 'Menor total individual',
        H6: 'Cantidad de vendedores',
      },
      locked: ['A1:F1', 'A2:E13', 'H1:I1', 'H2:H6'],
      header: ['A1:F1', 'H1:I1'],
      labels: ['H2:H6'],
      targets: ['F2:F13', 'I2:I6'],
      formats: { C: 'int', D: 'int', E: 'int', F: 'int', I2: 'int', I3: 'int', I4: 'int', I5: 'int', I6: 'int' },
      start: 'F2',
    },
    objectives: [
      {
        text: 'Completá <b>Total Q1</b> (F2:F13) con <code>=SUMA(C2:E2)</code> en cada fila.',
        hint: 'En F2 escribí =SUMA(C2:E2). El ":" indica un rango (de C2 a E2). Después rellená hacia abajo hasta F13.',
        check: V.column('F', 2, 13, (r) => totQ1[r - 2], { uses: ['SUMA'] }),
      },
      {
        text: '<b>I2</b>: ventas totales del trimestre (suma de F2:F13).',
        hint: '=SUMA(F2:F13)',
        check: V.cell('I2', sumQ1, { uses: ['SUMA'] }),
      },
      {
        text: '<b>I3</b>: promedio por vendedor con <b>PROMEDIO</b>.',
        hint: '=PROMEDIO(F2:F13)',
        check: V.cell('I3', sumQ1 / totQ1.length, { uses: ['PROMEDIO'] }),
      },
      {
        text: '<b>I4</b> y <b>I5</b>: el mayor y el menor total con <b>MAX</b> y <b>MIN</b>.',
        hint: '=MAX(F2:F13) en I4 y =MIN(F2:F13) en I5.',
        check: (S) => {
          const a = V.checkCell(S, 'I4', Math.max(...totQ1), { uses: ['MAX'] });
          const b = V.checkCell(S, 'I5', Math.min(...totQ1), { uses: ['MIN'] });
          if (a === true && b === true) return true;
          if (typeof a === 'string') return a;
          if (typeof b === 'string') return b;
          return false;
        },
      },
      {
        text: '<b>I6</b>: cuántos vendedores hay, con <b>CONTARA</b> (cuenta celdas no vacías) o <b>CONTAR</b> (cuenta números).',
        hint: '=CONTARA(A2:A13) cuenta los nombres. =CONTAR(F2:F13) cuenta los totales numéricos. Cualquiera sirve.',
        check: V.cell('I6', totQ1.length, { uses: ['CONTARA', 'CONTAR'] }),
      },
      {
        text: '❓ ¿Quién fue la/el vendedor con <b>mayor total</b> del trimestre?',
        placeholder: 'Nombre y apellido',
        hint: 'Buscá en la columna F el valor que coincide con tu MAX de I4.',
        answer: V.answerText(['Carla Méndez', 'Carla', 'Mendez']),
      },
    ],
    tips: [
      '<b>SUMA(C2:E2)</b> es lo mismo que C2+D2+E2, pero escala: SUMA(C2:Z2) sigue siendo cortita.',
      'Los argumentos se separan con <b>;</b> (Excel/Sheets en español) o con <b>,</b>. Acá valen los dos.',
      'Las funciones se pueden escribir en español o en inglés: SUMA o SUM, PROMEDIO o AVERAGE.',
      'Mientras escribís una función, mirá la barra de ayuda debajo de la fórmula: te muestra qué argumento va.',
    ],
    teaches: ['SUMA', 'PROMEDIO', 'MAX', 'MIN', 'CONTAR', 'CONTARA'],
    feedback: 'Gerencia quedó encantada con el resumen. ¡Y Carla también, cuando le conté!',
  };

  // -------------------------------------------------------------------------
  // M3 — Bonos por objetivos (SI)
  // -------------------------------------------------------------------------
  const empleados = [
    ['Martín Acosta', 'Comercial', 52000, 50000],
    ['Lucía Benítez', 'Comercial', 47500, 50000],
    ['Sergio Campos', 'Retail', 38000, 35000],
    ['Valeria Duarte', 'Retail', 35000, 35000],
    ['Tomás Escobar', 'Comercial', 61200, 55000],
    ['Romina Farías', 'Online', 28900, 30000],
    ['Pablo Giménez', 'Online', 33400, 30000],
    ['Natalia Herrera', 'Retail', 31000, 35000],
    ['Ignacio Ibarra', 'Comercial', 49900, 50000],
    ['Florencia Juárez', 'Online', 30500, 30000],
    ['Rodrigo Kessler', 'Retail', 36700, 35000],
    ['Camila Luna', 'Comercial', 50000, 55000],
  ];
  const cumple = empleados.map((e) => e[2] >= e[3]);
  const bonos = empleados.map((e, i) => (cumple[i] ? e[2] * 0.1 : 0));
  const m3 = {
    id: 'm3_bonos',
    stage: 1,
    xp: 150,
    dept: 'RR.HH.',
    from: 'paula',
    subject: 'Urgente: liquidación de bonos del trimestre',
    file: 'bonos_Q1.xlsx',
    email: `
      <p>Hola {name}, soy Paula de Recursos Humanos. Marta me dijo que vos me podías ayudar.</p>
      <p>Tenemos que liquidar los bonos y la regla es simple:</p>
      <ul>
        <li>Si las <b>Ventas</b> son <b>mayores o iguales</b> a la <b>Meta</b>, la persona cumplió → <b>"Sí"</b>. Si no → <b>"No"</b>.</li>
        <li>Quien cumplió cobra un bono del <b>10% de sus ventas</b>. Quien no, 0.</li>
      </ul>
      <p>También necesito el <b>total a pagar</b> en bonos para pasárselo a Finanzas. ¡Gracias!</p>
      <p>— Paula Herrera, RR.HH.</p>`,
    sheet: {
      cols: 10,
      rows: 20,
      colWidths: [140, 100, 100, 100, 100, 100, 24, 200, 120, 60],
      data: { at: 'A1', rows: [['Empleado', 'Área', 'Ventas', 'Meta', '¿Cumplió?', 'Bono'], ...empleados] },
      cells: { H1: 'Resumen', I1: 'Valor', H2: 'Total a pagar en bonos' },
      locked: ['A1:F1', 'A2:D13', 'H1:I1', 'H2'],
      header: ['A1:F1', 'H1:I1'],
      labels: ['H2'],
      targets: ['E2:F13', 'I2'],
      formats: { C: 'currency', D: 'currency', F: 'currency', I2: 'currency' },
      start: 'E2',
    },
    objectives: [
      {
        text: '<b>¿Cumplió?</b> (E2:E13): usá <b>SI</b> para mostrar "Sí" o "No".',
        hint: 'En E2: =SI(C2>=D2; "Sí"; "No"). Los textos van entre comillas. Después rellená hasta E13.',
        check: V.column('E', 2, 13, (r) => (v) => V.norm(v) === (cumple[r - 2] ? 'si' : 'no'), {
          uses: ['SI'],
          wrongNote: 'Revisá la condición: "mayor o igual" se escribe >=.',
        }),
      },
      {
        text: '<b>Bono</b> (F2:F13): 10% de las ventas si cumplió; si no, 0.',
        hint: 'En F2: =SI(C2>=D2; C2*10%; 0). También vale =SI(E2="Sí"; C2*0.1; 0).',
        check: V.column('F', 2, 13, (r) => bonos[r - 2], { uses: ['SI'] }),
      },
      {
        text: '<b>I2</b>: total a pagar en bonos.',
        hint: '=SUMA(F2:F13)',
        check: V.cell('I2', bonos.reduce((a, b) => a + b, 0), { uses: ['SUMA'] }),
      },
      {
        text: '❓ ¿Cuántas personas cumplieron su meta?',
        placeholder: 'Un número',
        hint: 'Contá los "Sí" de la columna E. (En la próxima misión vas a aprender CONTAR.SI para hacerlo con una fórmula).',
        answer: V.answerNumber(cumple.filter(Boolean).length),
      },
      {
        text: '❓ Valeria Duarte vendió <b>exactamente</b> su meta. ¿Cobra bono? (Sí / No)',
        placeholder: 'Sí o No',
        hint: 'La regla dice "mayor o IGUAL". ¿Qué pasa con >= cuando los números son iguales?',
        answer: V.answerText(['si']),
      },
    ],
    tips: [
      '<b>SI(prueba; si_verdadero; si_falso)</b>: la prueba es una comparación como C2>=D2.',
      'Comparadores: <b>=</b> igual, <b>&lt;&gt;</b> distinto, <b>&gt;</b>, <b>&lt;</b>, <b>&gt;=</b>, <b>&lt;=</b>.',
      'Los textos dentro de una fórmula van entre comillas dobles: "Sí".',
      '10% es lo mismo que 0.1. Podés escribir C2*10% o C2*0.1.',
    ],
    teaches: ['SI', 'Y', 'O'],
    feedback: 'Paula me escribió para agradecerte. Nadie se quedó sin bono por un error de fórmula. 👏',
  };

  // -------------------------------------------------------------------------
  // M4 — Limpieza de la base de clientes (texto)
  // -------------------------------------------------------------------------
  const clientes = [
    ['  juan pérez', 'JUAN.PEREZ@MAIL.COM ', ' buenos aires'],
    ['MARÍA GÓMEZ ', ' maria.gomez@mail.com', 'CÓRDOBA  '],
    ['lucas   fernández', 'Lucas.F@Correo.com', 'rosario'],
    ['Sofía Martínez', ' sofia.martinez@mail.com  ', 'Mendoza'],
    ['  pedro alvarez ', 'PEDRO.ALVAREZ@MAIL.COM', '  la plata'],
    ['maría gómez', 'Maria.Gomez@Mail.com', 'córdoba'],
    ['ANA  RUIZ', 'ana.ruiz@correo.com ', 'SALTA'],
    ['juan PÉREZ ', ' juan.perez@mail.com', 'Buenos Aires'],
    ['Diego   Molina', 'DIEGO.MOLINA@MAIL.COM', ' neuquén '],
    ['valentina sosa', 'valen.sosa@correo.com', 'mar del plata'],
    ['  Sofía MARTÍNEZ', 'SOFIA.MARTINEZ@MAIL.COM', ' mendoza'],
    ['carlos díaz', 'carlos.diaz@mail.com', 'tucumán '],
  ];
  const fn = (name, v) => F.callByName(name, [v]);
  const nombreLimpio = clientes.map((c) => fn('NOMPROPIO', fn('ESPACIOS', c[0])));
  const emailLimpio = clientes.map((c) => fn('MINUSC', fn('ESPACIOS', c[1])));
  const ciudadLimpia = clientes.map((c) => fn('NOMPROPIO', fn('ESPACIOS', c[2])));
  const unicos = new Set(emailLimpio).size;
  const m4 = {
    id: 'm4_limpieza',
    stage: 1,
    xp: 180,
    dept: 'Marketing',
    from: 'tomas',
    subject: 'La base de clientes es un desastre 😩',
    file: 'clientes_newsletter.xlsx',
    email: `
      <p>¡{name}, auxilio! Soy Tomás de Marketing.</p>
      <p>Vamos a mandar el newsletter y la base de clientes está hecha un lío: espacios de más, nombres en MAYÚSCULAS, otros en minúsculas, mails con mayúsculas…</p>
      <p>Necesito tres columnas limpias:</p>
      <ul>
        <li><b>Nombre limpio</b>: sin espacios de más y con formato Nombre Propio.</li>
        <li><b>Email limpio</b>: sin espacios y todo en minúsculas.</li>
        <li><b>Ciudad limpia</b>: sin espacios de más y con formato Nombre Propio.</li>
      </ul>
      <p>Y sospecho que hay <b>clientes repetidos</b>… ¿me decís cuántos clientes únicos hay de verdad?</p>
      <p>— Tomás Quiroga, Marketing</p>`,
    sheet: {
      cols: 8,
      rows: 20,
      colWidths: [160, 210, 130, 24, 160, 210, 130, 60],
      data: { at: 'A1', rows: [['Nombre', 'Email', 'Ciudad'], ...clientes] },
      cells: { E1: 'Nombre limpio', F1: 'Email limpio', G1: 'Ciudad limpia' },
      locked: ['A1:C13', 'E1:G1'],
      header: ['A1:C1', 'E1:G1'],
      targets: ['E2:G13'],
      showSpaces: ['A2:C13'],
      start: 'E2',
    },
    objectives: [
      {
        text: '<b>Nombre limpio</b> (E2:E13) con <b>ESPACIOS</b> y <b>NOMPROPIO</b>.',
        hint: 'Se pueden anidar funciones: =NOMPROPIO(ESPACIOS(A2)). Primero se resuelve la de adentro.',
        check: V.column('E', 2, 13, (r) => nombreLimpio[r - 2], { exact: true, wrongNote: 'Ojo con mayúsculas y espacios: tiene que quedar como "Juan Pérez".' }),
      },
      {
        text: '<b>Email limpio</b> (F2:F13) con <b>ESPACIOS</b> y <b>MINUSC</b>.',
        hint: '=MINUSC(ESPACIOS(B2))',
        check: V.column('F', 2, 13, (r) => emailLimpio[r - 2], { exact: true, wrongNote: 'El email tiene que quedar sin espacios y todo en minúsculas.' }),
      },
      {
        text: '<b>Ciudad limpia</b> (G2:G13) con <b>ESPACIOS</b> y <b>NOMPROPIO</b>.',
        hint: '=NOMPROPIO(ESPACIOS(C2))',
        check: V.column('G', 2, 13, (r) => ciudadLimpia[r - 2], { exact: true, wrongNote: 'La ciudad tiene que quedar como "Buenos Aires".' }),
      },
      {
        text: '❓ Una vez limpia la base, ¿cuántos <b>clientes únicos</b> hay?',
        placeholder: 'Un número',
        hint: 'Con los datos limpios, los duplicados se vuelven idénticos. Compará los emails limpios: si dos son iguales, es la misma persona.',
        answer: V.answerNumber(unicos),
      },
    ],
    tips: [
      'Nunca modifiques los datos originales: trabajá en <b>columnas auxiliares</b>. Si te equivocás, el original sigue intacto.',
      'Los puntitos rojos <b>·</b> en los datos originales marcan espacios de más. ¡Los espacios invisibles rompen búsquedas y conteos!',
      '<b>ESPACIOS</b> quita espacios al principio, al final y los dobles entre palabras.',
      'Podés anidar funciones: <b>=MINUSC(ESPACIOS(B2))</b>.',
      '<b>LARGO(A2)</b> te dice cuántos caracteres tiene una celda: sirve para detectar espacios ocultos.',
    ],
    teaches: ['ESPACIOS', 'NOMPROPIO', 'MAYUSC', 'MINUSC', 'LARGO', 'CONCATENAR'],
    feedback: 'Tomás dice que la tasa de rebote del newsletter bajó un montón. ¡Datos limpios, campañas felices!',
  };

  // -------------------------------------------------------------------------
  // M5 — Envíos demorados (CONTAR.SI / SUMAR.SI / CONTAR.SI.CONJUNTO)
  // -------------------------------------------------------------------------
  const envios = [
    ['Sur', 'LogiExpress', 'Demorado', 1850],
    ['Oeste', 'TransAndes', 'Entregado', 1500],
    ['Centro', 'CorreoYa', 'Entregado', 900],
    ['Norte', 'TransAndes', 'Entregado', 1200],
    ['Norte', 'LogiExpress', 'Demorado', 1300],
    ['Centro', 'TransAndes', 'Entregado', 950],
    ['Sur', 'CorreoYa', 'Entregado', 1700],
    ['Oeste', 'LogiExpress', 'Demorado', 1650],
    ['Norte', 'CorreoYa', 'Entregado', 1100],
    ['Sur', 'LogiExpress', 'Demorado', 1900],
    ['Centro', 'LogiExpress', 'Demorado', 1000],
    ['Oeste', 'CorreoYa', 'Entregado', 1400],
    ['Norte', 'TransAndes', 'Cancelado', 1250],
    ['Sur', 'TransAndes', 'Entregado', 1750],
    ['Centro', 'CorreoYa', 'Entregado', 880],
    ['Oeste', 'LogiExpress', 'Demorado', 1600],
    ['Sur', 'LogiExpress', 'Demorado', 1950],
    ['Norte', 'TransAndes', 'Entregado', 1180],
    ['Centro', 'TransAndes', 'Cancelado', 920],
    ['Oeste', 'TransAndes', 'Entregado', 1450],
    ['Sur', 'CorreoYa', 'Demorado', 1800],
    ['Norte', 'LogiExpress', 'Entregado', 1320],
    ['Centro', 'CorreoYa', 'Entregado', 940],
    ['Oeste', 'LogiExpress', 'Demorado', 1620],
  ].map((e, i) => ['E-' + (201 + i), ...e]);
  const regiones = ['Norte', 'Sur', 'Centro', 'Oeste'];
  const porRegion = (fnRow) => regiones.map((reg) => envios.filter((e) => e[1] === reg).reduce((s, e) => s + fnRow(e), 0));
  const cantRegion = porRegion(() => 1);
  const costoRegion = porRegion((e) => e[4]);
  const demorRegion = porRegion((e) => (e[3] === 'Demorado' ? 1 : 0));
  const lastRow = envios.length + 1;
  const m5 = {
    id: 'm5_envios',
    stage: 1,
    xp: 220,
    dept: 'Logística',
    from: 'ramiro',
    subject: '¿Dónde se traban nuestros envíos?',
    file: 'envios_marzo.xlsx',
    email: `
      <p>Buenas, {name}. Ramiro, de Logística.</p>
      <p>Los clientes se quejan de demoras y quiero saber <b>dónde está el problema</b> antes de la reunión con los transportistas.</p>
      <p>Armé una tablita por región a la derecha. Necesito, para cada región:</p>
      <ul>
        <li>cuántos <b>envíos</b> hubo,</li>
        <li>el <b>costo total</b> de esos envíos,</li>
        <li>y cuántos quedaron <b>demorados</b>.</li>
      </ul>
      <p>Con eso decime qué región está peor y qué transportista acumula más demoras. Así voy a la reunión con datos y no con corazonadas.</p>
      <p>— Ramiro Ortiz, Logística</p>`,
    sheet: {
      cols: 12,
      rows: 30,
      colWidths: [70, 80, 110, 100, 90, 24, 24, 90, 80, 110, 100, 60],
      data: { at: 'A1', rows: [['Envío', 'Región', 'Transportista', 'Estado', 'Costo'], ...envios] },
      cells: {
        H1: 'Región', I1: 'Envíos', J1: 'Costo total', K1: 'Demorados',
        H2: 'Norte', H3: 'Sur', H4: 'Centro', H5: 'Oeste',
      },
      locked: ['A1:E' + lastRow, 'H1:K1', 'H2:H5'],
      header: ['A1:E1', 'H1:K1'],
      labels: ['H2:H5'],
      targets: ['I2:K5'],
      formats: { E: 'currency', J: 'currency' },
      start: 'I2',
    },
    objectives: [
      {
        text: '<b>Envíos</b> por región (I2:I5) con <b>CONTAR.SI</b>.',
        hint: `En I2: =CONTAR.SI($B$2:$B$${lastRow}; H2). Los $ fijan el rango para que no se corra al copiar hacia abajo (F4 los agrega).`,
        check: V.column('I', 2, 5, (r) => cantRegion[r - 2], { uses: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'], dollarHint: true }),
      },
      {
        text: '<b>Costo total</b> por región (J2:J5) con <b>SUMAR.SI</b>.',
        hint: `En J2: =SUMAR.SI($B$2:$B$${lastRow}; H2; $E$2:$E$${lastRow}). Primero el rango donde buscar, después el criterio y por último qué sumar.`,
        check: V.column('J', 2, 5, (r) => costoRegion[r - 2], { uses: ['SUMAR.SI', 'SUMAR.SI.CONJUNTO'], dollarHint: true }),
      },
      {
        text: '<b>Demorados</b> por región (K2:K5) con <b>CONTAR.SI.CONJUNTO</b> (dos condiciones).',
        hint: `En K2: =CONTAR.SI.CONJUNTO($B$2:$B$${lastRow}; H2; $D$2:$D$${lastRow}; "Demorado"). Cada par es rango + criterio.`,
        check: V.column('K', 2, 5, (r) => demorRegion[r - 2], { uses: ['CONTAR.SI.CONJUNTO'], dollarHint: true }),
      },
      {
        text: '❓ ¿Qué región tiene <b>más envíos demorados</b>?',
        placeholder: 'Región',
        hint: 'Mirá la columna K que acabás de completar.',
        answer: V.answerText(['Sur']),
      },
      {
        text: '❓ ¿Qué <b>transportista</b> acumula más demoras?',
        placeholder: 'Transportista',
        hint: 'Usá una celda libre: =CONTAR.SI.CONJUNTO(C2:C25; "LogiExpress"; D2:D25; "Demorado") y probá con cada transportista.',
        answer: V.answerText(['LogiExpress', 'Logi Express']),
      },
    ],
    tips: [
      '<b>CONTAR.SI(rango; criterio)</b>: el criterio puede ser un texto ("Norte"), una celda (H2) o una comparación (">1000").',
      'Referencias absolutas: <b>$B$2:$B$25</b> no cambia al copiar la fórmula. Mientras editás, <b>F4</b> agrega los $.',
      'Otra opción: usar columnas enteras como <b>B:B</b>. No se corren al copiar hacia abajo.',
      '<b>SUMAR.SI(rango; criterio; rango_suma)</b>: busca en un rango y suma en otro.',
      '<b>CONTAR.SI.CONJUNTO</b> acepta varios pares rango/criterio: todos tienen que cumplirse.',
    ],
    teaches: ['CONTAR.SI', 'SUMAR.SI', 'CONTAR.SI.CONJUNTO', 'SUMAR.SI.CONJUNTO', 'PROMEDIO.SI'],
    feedback: 'Ramiro fue a la reunión con tu tabla y LogiExpress ya prometió un plan de mejora para la región Sur. ¡Eso es impacto!',
  };

  // -------------------------------------------------------------------------
  // Próximamente (vistas previas bloqueadas en la bandeja)
  // -------------------------------------------------------------------------
  const upcoming = [
    { subject: 'Números guardados como texto (y otros horrores)', dept: 'Finanzas', from: 'Finanzas', rankName: 'Analista Semi-Senior' },
    { subject: 'Cruce de tablas: precios y pedidos con BUSCARV', dept: 'Ventas', from: 'Ventas', rankName: 'Analista Semi-Senior' },
    { subject: 'Tablas dinámicas para el comité', dept: 'Gerencia', from: 'Gerencia', rankName: 'Analista Semi-Senior' },
    { subject: 'Tu primer dashboard de KPIs', dept: 'Gerencia', from: 'Gerencia', rankName: 'Analista Senior' },
    { subject: 'CONFIDENCIAL: algo raro en los viáticos', dept: 'Auditoría', from: 'Auditoría', rankName: 'Analista Senior' },
  ];

  AA.Missions.add(m1, m2, m3, m4, m5);
  AA.Missions.upcoming.push(...upcoming);
})();
