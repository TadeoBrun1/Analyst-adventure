/*
 * Analyst Adventure — Librería para generar misiones.
 * - Generador aleatorio con semilla: la misma semilla produce siempre la misma misión
 *   (las misiones obligatorias usan semillas fijas; la práctica, semillas al azar).
 * - Listas de datos bilingües (personas, productos, regiones…).
 * - Registro de plantillas de misión.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const F = AA.Formula;

  // --- Aleatoriedad reproducible (mulberry32)
  function rng(seed) {
    let a = seed >>> 0;
    const next = () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const r = {
      next,
      int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
      pick: (arr) => arr[Math.floor(next() * arr.length)],
      chance: (p) => next() < p,
      shuffle: (arr) => {
        const out = arr.slice();
        for (let i = out.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          [out[i], out[j]] = [out[j], out[i]];
        }
        return out;
      },
      sample: (arr, n) => r.shuffle(arr).slice(0, n),
      // Múltiplo de `step` entre lo y hi.
      step: (lo, hi, step) => lo + step * Math.floor(next() * (Math.floor((hi - lo) / step) + 1)),
    };
    return r;
  }

  // --- Datos
  const FIRST = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elena', 'Facundo', 'Gabriela', 'Hernán', 'Inés', 'Julián', 'Karina', 'Lucas', 'Martina', 'Nicolás', 'Olivia', 'Pablo', 'Romina', 'Santiago', 'Tamara', 'Valentín', 'Lucía', 'Mateo', 'Camila', 'Joaquín', 'Florencia', 'Tomás', 'Agustina', 'Ezequiel', 'Micaela', 'Ramiro', 'Sofía', 'Ignacio', 'Valeria', 'Federico', 'Julieta', 'Gonzalo', 'Paula', 'Martín', 'Luciana', 'Emiliano'];
  const LAST = ['Torres', 'Díaz', 'Méndez', 'Ruiz', 'Paz', 'Gil', 'Sosa', 'Vega', 'Ramos', 'Castro', 'López', 'Ferreyra', 'Acosta', 'Benítez', 'Campos', 'Duarte', 'Escobar', 'Farías', 'Giménez', 'Herrera', 'Ibarra', 'Juárez', 'Kessler', 'Luna', 'Molina', 'Navarro', 'Ortiz', 'Pereyra', 'Quiroga', 'Romero', 'Suárez', 'Medina', 'Rojas', 'Aguirre', 'Cabrera', 'Peralta', 'Ríos', 'Correa', 'Morales', 'Vázquez'];
  const FIRST_ASCII = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elena', 'Facundo', 'Gabriela', 'Karina', 'Lucas', 'Martina', 'Pablo', 'Romina', 'Santiago', 'Tamara', 'Mateo', 'Camila', 'Florencia', 'Agustina', 'Micaela', 'Ramiro', 'Valeria', 'Federico', 'Julieta', 'Gonzalo', 'Paula', 'Luciana', 'Emiliano', 'Bianca', 'Marcos', 'Lorena'];
  const LAST_ASCII = ['Torres', 'Ruiz', 'Paz', 'Gil', 'Sosa', 'Vega', 'Ramos', 'Castro', 'Ferreyra', 'Acosta', 'Campos', 'Duarte', 'Escobar', 'Herrera', 'Ibarra', 'Luna', 'Molina', 'Navarro', 'Ortiz', 'Pereyra', 'Quiroga', 'Romero', 'Medina', 'Rojas', 'Aguirre', 'Cabrera', 'Peralta', 'Correa', 'Morales', 'Blanco'];
  const PRODUCTS = [
    ['Teclado', 'Keyboard', 25], ['Mouse', 'Mouse', 12.5], ['Monitor 24"', '24" Monitor', 180], ['Auriculares', 'Headphones', 40],
    ['Webcam HD', 'HD Webcam', 55], ['Notebook', 'Laptop', 950], ['Silla ergonómica', 'Ergonomic chair', 210], ['Cable HDMI', 'HDMI cable', 8],
    ['Pendrive 32GB', '32GB USB drive', 9.5], ['Escritorio', 'Desk', 320], ['Impresora', 'Printer', 240], ['Router', 'Router', 75],
    ['Tablet', 'Tablet', 390], ['Parlante', 'Speaker', 65], ['Disco SSD', 'SSD drive', 110], ['Lámpara LED', 'LED lamp', 28],
    ['Micrófono', 'Microphone', 85], ['Proyector', 'Projector', 520], ['Cargador', 'Charger', 22], ['Mochila', 'Backpack', 45],
    ['Celular', 'Smartphone', 610], ['Smartwatch', 'Smartwatch', 230], ['Hub USB', 'USB hub', 30], ['Soporte notebook', 'Laptop stand', 35],
    ['Mousepad', 'Mouse pad', 7.5], ['Tóner', 'Toner', 70], ['Resma A4', 'A4 paper ream', 6.5], ['Pizarra', 'Whiteboard', 95],
    ['Cafetera', 'Coffee maker', 140], ['Silla gamer', 'Gaming chair', 290],
  ];
  const CONCEPTS = [
    ['Alquiler', 'Rent'], ['Sueldos', 'Salaries'], ['Publicidad', 'Advertising'], ['Viajes', 'Travel'], ['Software', 'Software'],
    ['Capacitación', 'Training'], ['Insumos', 'Supplies'], ['Servicios', 'Utilities'], ['Mantenimiento', 'Maintenance'], ['Eventos', 'Events'],
    ['Fletes', 'Freight'], ['Seguros', 'Insurance'], ['Telefonía', 'Phone'], ['Limpieza', 'Cleaning'], ['Consultoría', 'Consulting'],
    ['Hardware', 'Hardware'], ['Viáticos', 'Per diem'], ['Impuestos', 'Taxes'], ['Marketing digital', 'Digital marketing'], ['Comisiones', 'Commissions'],
  ];
  const REGIONS = [['Norte', 'North'], ['Sur', 'South'], ['Centro', 'Center'], ['Este', 'East'], ['Oeste', 'West']];
  const CITIES = ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Mar del Plata', 'Salta', 'Tucumán', 'Neuquén', 'Santa Fe', 'Bahía Blanca', 'Corrientes', 'Posadas', 'Tandil'];
  const CARRIERS = ['TransAndes', 'LogiExpress', 'CorreoYa', 'RutaSur', 'PaqueFlash'];
  const MONTHS = [['Ene', 'Jan'], ['Feb', 'Feb'], ['Mar', 'Mar'], ['Abr', 'Apr'], ['May', 'May'], ['Jun', 'Jun'], ['Jul', 'Jul'], ['Ago', 'Aug'], ['Sep', 'Sep'], ['Oct', 'Oct'], ['Nov', 'Nov'], ['Dic', 'Dec']];
  const CATEGORIES = [['Herramientas', 'Tools'], ['Electrónica', 'Electronics'], ['Oficina', 'Office'], ['Limpieza', 'Cleaning'], ['Muebles', 'Furniture'], ['Cocina', 'Kitchen']];
  const AREAS = [['Comercial', 'Sales'], ['Retail', 'Retail'], ['Online', 'Online'], ['Operaciones', 'Operations'], ['Atención al cliente', 'Customer care']];
  const COMPANY = [['Distribuidora', 'Distributors'], ['Comercial', 'Trading'], ['Grupo', 'Group'], ['Industrias', 'Industries'], ['Estudio', 'Studio'], ['Servicios', 'Services']];

  const L2 = (pair) => (AA.lang === 'en' ? pair[1] : pair[0]);

  // Nombres completos únicos.
  function people(r, n) {
    const combos = [];
    for (const f of FIRST) for (const l of LAST) combos.push(f + ' ' + l);
    return r.sample(combos, n);
  }
  function peopleParts(r, n, ascii) {
    const fs = ascii ? FIRST_ASCII : FIRST;
    const ls = ascii ? LAST_ASCII : LAST;
    const combos = [];
    for (const f of fs) for (const l of ls) combos.push({ first: f, last: l });
    return r.sample(combos, n);
  }
  function companies(r, n) {
    const out = [];
    for (const p of COMPANY) for (const l of LAST) out.push(AA.lang === 'en' ? `${l} ${p[1]}` : `${p[0]} ${l}`);
    return r.sample(out, n);
  }

  // Cantidad de filas según el tamaño de la tabla.
  function rowsFor(ctx, small, medium, large) {
    const range = ctx.size === 'large' ? large : ctx.size === 'medium' ? medium : small;
    return ctx.rng.int(range[0], range[1]);
  }

  // Índice del máximo (o mínimo) si es único; -1 si hay empate.
  function uniqueExtreme(values, wantMin) {
    let best = wantMin ? Infinity : -Infinity;
    let idx = -1;
    let tie = false;
    values.forEach((v, i) => {
      if (wantMin ? v < best : v > best) {
        best = v;
        idx = i;
        tie = false;
      } else if (v === best) tie = true;
    });
    return tie ? -1 : idx;
  }

  const money = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const col = (i) => F.indexToCol(i);
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

  // --- Registro de plantillas
  const templates = {};
  function register(id, fn) {
    templates[id] = fn;
  }

  // Ejecuta una plantilla en un idioma dado y completa los datos comunes.
  function build(templateId, opts) {
    const fn = templates[templateId];
    if (!fn) throw new Error('Plantilla desconocida: ' + templateId);
    const prevLang = AA.lang;
    AA.setLang(opts.lang || prevLang);
    try {
      const ctx = {
        rng: rng(opts.seed),
        size: opts.size || 'small',
        story: !!opts.story,
        first: !!opts.first,
        lang: AA.lang,
      };
      const m = fn(ctx);
      const ch = AA.State.CHARACTERS[m.from];
      m.email = AA.T('<p>Hola, {name}:</p>', '<p>Hi {name},</p>') + m.email + `<p class="sign">— ${esc(AA.L(ch.name))} · ${esc(AA.L(ch.role))}</p>`;
      m.lang = AA.lang;
      m.template = templateId;
      return m;
    } finally {
      AA.setLang(prevLang);
    }
  }

  // Hoja inicial de una misión (datos originales + celdas fijas).
  function buildSheet(def) {
    const sh = new AA.Sheet(def.cols, def.rows);
    const at = F.parseRef(def.data.at);
    def.data.rows.forEach((row, i) => row.forEach((v, j) => sh.setValue(at.col + j, at.row + i, v, true)));
    for (const [ref, v] of Object.entries(def.cells || {})) {
      const p = F.parseRef(ref);
      sh.setValue(p.col, p.row, v, true);
    }
    return sh;
  }

  AA.Content = {
    rng,
    people,
    peopleParts,
    companies,
    rowsFor,
    uniqueExtreme,
    money,
    col,
    esc,
    L2,
    register,
    templates,
    build,
    buildSheet,
    DATA: { FIRST, LAST, PRODUCTS, CONCEPTS, REGIONS, CITIES, CARRIERS, MONTHS, CATEGORIES, AREAS },
  };
})();
