/*
 * Analyst Adventure — Motor de fórmulas.
 * Tokenizer + parser + evaluador con funciones estilo Excel / Google Sheets.
 * Acepta nombres en español (SUMA, PROMEDIO, CONTAR.SI…) y en inglés (SUM, AVERAGE, COUNTIF…),
 * y separadores de argumentos "," o ";". Los decimales se escriben con punto.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});

  // ---------------------------------------------------------------------------
  // Errores
  // ---------------------------------------------------------------------------
  class FormulaError {
    constructor(code, detail) {
      this.code = code;
      this.detail = detail || '';
    }
    toString() {
      return this.code;
    }
  }

  const err = {
    div0: () => new FormulaError('#DIV/0!', 'División por cero.'),
    value: (d) => new FormulaError('#VALUE!', d || 'Tipo de dato incorrecto.'),
    name: (d) => new FormulaError('#NAME?', d || 'Nombre desconocido.'),
    ref: (d) => new FormulaError('#REF!', d || 'Referencia inválida.'),
    na: (d) => new FormulaError('#N/A', d || 'Valor no encontrado.'),
    num: (d) => new FormulaError('#NUM!', d || 'Número inválido.'),
    circ: () => new FormulaError('#CIRC!', 'Referencia circular: la fórmula depende de sí misma.'),
    parse: (d) => new FormulaError('#ERROR!', d || 'Error de sintaxis.'),
  };
  const isErr = (v) => v instanceof FormulaError;

  // ---------------------------------------------------------------------------
  // Direcciones de celdas
  // ---------------------------------------------------------------------------
  function colToIndex(letters) {
    let n = 0;
    for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
    return n - 1;
  }
  function indexToCol(i) {
    let s = '';
    i += 1;
    while (i > 0) {
      const m = (i - 1) % 26;
      s = String.fromCharCode(65 + m) + s;
      i = Math.floor((i - 1) / 26);
    }
    return s;
  }
  function parseRef(ref) {
    const m = /^\$?([A-Za-z]{1,3})\$?(\d+)$/.exec(String(ref).trim());
    if (!m) return null;
    return { col: colToIndex(m[1]), row: parseInt(m[2], 10) - 1 };
  }
  function makeRef(col, row, absC, absR) {
    return (absC ? '$' : '') + indexToCol(col) + (absR ? '$' : '') + (row + 1);
  }
  function parseRange(str) {
    const parts = String(str).split(':');
    const p = parseRef(parts[0]);
    const q = parts[1] ? parseRef(parts[1]) : p;
    if (!p || !q) return null;
    return {
      c1: Math.min(p.col, q.col),
      r1: Math.min(p.row, q.row),
      c2: Math.max(p.col, q.col),
      r2: Math.max(p.row, q.row),
    };
  }

  // ---------------------------------------------------------------------------
  // Valores de rango
  // ---------------------------------------------------------------------------
  class RangeValue {
    constructor(rows) {
      this.rows = rows;
    }
    get height() {
      return this.rows.length;
    }
    get width() {
      return this.rows.length ? this.rows[0].length : 0;
    }
    flat() {
      return this.rows.flat();
    }
  }
  const asRange = (v) => (v instanceof RangeValue ? v : new RangeValue([[v]]));

  // ---------------------------------------------------------------------------
  // Coerciones
  // ---------------------------------------------------------------------------
  function normName(s) {
    return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  }

  const NUM_RE = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;
  function parseNumberStrict(s) {
    if (typeof s !== 'string') return null;
    let t = s.trim();
    if (!t) return null;
    let pct = false;
    if (t.endsWith('%')) {
      pct = true;
      t = t.slice(0, -1).trim();
    }
    if (!NUM_RE.test(t)) return null;
    const n = parseFloat(t);
    return pct ? n / 100 : n;
  }

  function fmtNumber(n) {
    if (!isFinite(n)) return String(n);
    return String(Number(n.toPrecision(15)));
  }

  function toNum(v) {
    if (isErr(v)) return v;
    if (typeof v === 'number') return v;
    if (v === null || v === undefined) return 0;
    if (typeof v === 'boolean') return v ? 1 : 0;
    const n = parseNumberStrict(String(v));
    return n === null ? err.value(`"${v}" no es un número.`) : n;
  }

  function toText(v) {
    if (isErr(v)) return v.code;
    if (v === null || v === undefined) return '';
    if (typeof v === 'boolean') return v ? 'VERDADERO' : 'FALSO';
    if (typeof v === 'number') return fmtNumber(v);
    return String(v);
  }

  function toBool(v) {
    if (isErr(v)) return v;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    if (v === null || v === undefined) return false;
    const t = normName(String(v).trim());
    if (t === 'TRUE' || t === 'VERDADERO') return true;
    if (t === 'FALSE' || t === 'FALSO') return false;
    return err.value(`"${v}" no es VERDADERO ni FALSO.`);
  }

  function scalar(v) {
    if (v instanceof RangeValue) {
      if (v.height === 1 && v.width === 1) return v.rows[0][0];
      return err.value('Se esperaba una sola celda y recibí un rango.');
    }
    return v;
  }

  // Comparación estilo Excel: números < textos < booleanos; textos sin distinguir mayúsculas.
  function cmp(a, b) {
    if (a === null || a === undefined) a = typeof b === 'string' ? '' : typeof b === 'boolean' ? false : 0;
    if (b === null || b === undefined) b = typeof a === 'string' ? '' : typeof a === 'boolean' ? false : 0;
    const rank = (v) => (typeof v === 'number' ? 0 : typeof v === 'string' ? 1 : 2);
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (ra === 0) {
      if (Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(a), Math.abs(b))) return 0;
      return a < b ? -1 : 1;
    }
    if (ra === 1) {
      const x = a.toLowerCase();
      const y = b.toLowerCase();
      return x < y ? -1 : x > y ? 1 : 0;
    }
    return (a ? 1 : 0) - (b ? 1 : 0);
  }

  // ---------------------------------------------------------------------------
  // Tokenizer
  // ---------------------------------------------------------------------------
  const ID_START = /[A-Za-z_À-ſ]/;
  const REF_RE = /^(\$?)([A-Za-z]{1,3})(\$?)(\d+)(?![A-Za-z0-9_.(À-ſ])/;
  const COLRANGE_RE = /^(\$?)([A-Za-z]{1,3})\s*:\s*(\$?)([A-Za-z]{1,3})(?![A-Za-z0-9_.(À-ſ])/;
  const IDENT_RE = /^[A-Za-z_À-ſ][A-Za-z0-9_.À-ſ]*/;
  const NUMBER_RE = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/;

  function tokenize(src) {
    const toks = [];
    const n = src.length;
    let i = 0;
    while (i < n) {
      const ch = src[i];
      if (/\s/.test(ch)) {
        i++;
        continue;
      }
      const rest = src.slice(i);
      let m;
      if (/[\d.]/.test(ch) && (m = NUMBER_RE.exec(rest))) {
        toks.push({ t: 'num', v: parseFloat(m[0]), s: i, e: i + m[0].length });
        i += m[0].length;
        continue;
      }
      if (ch === '"') {
        let j = i + 1;
        let out = '';
        for (;;) {
          if (j >= n) throw err.parse('Falta cerrar las comillas de un texto.');
          if (src[j] === '"') {
            if (src[j + 1] === '"') {
              out += '"';
              j += 2;
              continue;
            }
            break;
          }
          out += src[j++];
        }
        toks.push({ t: 'str', v: out, s: i, e: j + 1 });
        i = j + 1;
        continue;
      }
      if (rest.startsWith('#REF!')) {
        toks.push({ t: 'referr', s: i, e: i + 5 });
        i += 5;
        continue;
      }
      if (ch === '$' || ID_START.test(ch)) {
        if ((m = REF_RE.exec(rest))) {
          toks.push({
            t: 'ref',
            absC: !!m[1],
            col: colToIndex(m[2]),
            absR: !!m[3],
            row: parseInt(m[4], 10) - 1,
            s: i,
            e: i + m[0].length,
          });
          i += m[0].length;
          continue;
        }
        if ((m = COLRANGE_RE.exec(rest))) {
          toks.push({
            t: 'colrange',
            absC1: !!m[1],
            c1: colToIndex(m[2]),
            absC2: !!m[3],
            c2: colToIndex(m[4]),
            s: i,
            e: i + m[0].length,
          });
          i += m[0].length;
          continue;
        }
        if ((m = IDENT_RE.exec(rest))) {
          const word = m[0];
          const end = i + word.length;
          let j = end;
          while (j < n && /\s/.test(src[j])) j++;
          if (src[j] === '(') {
            toks.push({ t: 'func', v: word, s: i, e: end });
          } else {
            const u = normName(word);
            if (u === 'TRUE' || u === 'VERDADERO') toks.push({ t: 'bool', v: true, s: i, e: end });
            else if (u === 'FALSE' || u === 'FALSO') toks.push({ t: 'bool', v: false, s: i, e: end });
            else toks.push({ t: 'name', v: word, s: i, e: end });
          }
          i = end;
          continue;
        }
        throw err.parse(`No entiendo "${ch}".`);
      }
      const two = src.substr(i, 2);
      if (two === '<=' || two === '>=' || two === '<>') {
        toks.push({ t: 'op', v: two, s: i, e: i + 2 });
        i += 2;
        continue;
      }
      if ('+-*/^&=<>%:'.includes(ch)) {
        toks.push({ t: 'op', v: ch, s: i, e: i + 1 });
        i++;
        continue;
      }
      if (ch === '(') {
        toks.push({ t: 'lparen', s: i, e: i + 1 });
        i++;
        continue;
      }
      if (ch === ')') {
        toks.push({ t: 'rparen', s: i, e: i + 1 });
        i++;
        continue;
      }
      if (ch === ',' || ch === ';') {
        toks.push({ t: 'sep', s: i, e: i + 1 });
        i++;
        continue;
      }
      throw err.parse(`Carácter inesperado: "${ch}".`);
    }
    return toks;
  }

  // ---------------------------------------------------------------------------
  // Parser (precedencia estilo Excel)
  // ---------------------------------------------------------------------------
  function parse(src) {
    const toks = tokenize(src);
    let p = 0;
    const peek = () => toks[p];
    const next = () => toks[p++];
    const isOp = (tok, ...ops) => tok && tok.t === 'op' && ops.includes(tok.v);
    const text = (tok) => src.slice(tok.s, tok.e);

    function binLevel(sub, ops) {
      return function () {
        let left = sub();
        while (isOp(peek(), ...ops)) {
          const op = next().v;
          left = { type: 'bin', op, left, right: sub() };
        }
        return left;
      };
    }

    function parseUnary() {
      if (isOp(peek(), '-', '+')) {
        const op = next().v;
        return { type: 'unary', op, arg: parseUnary() };
      }
      return parsePostfix();
    }
    function parsePostfix() {
      let node = parsePrimary();
      while (isOp(peek(), '%')) {
        next();
        node = { type: 'pct', arg: node };
      }
      return node;
    }
    const parsePow = binLevel(parseUnary, ['^']);
    const parseMul = binLevel(parsePow, ['*', '/']);
    const parseAdd = binLevel(parseMul, ['+', '-']);
    const parseConcat = binLevel(parseAdd, ['&']);
    const parseCompare = binLevel(parseConcat, ['=', '<>', '<', '>', '<=', '>=']);

    function parsePrimary() {
      const tok = next();
      if (!tok) throw err.parse('La fórmula está incompleta.');
      switch (tok.t) {
        case 'num':
          return { type: 'num', value: tok.v };
        case 'str':
          return { type: 'str', value: tok.v };
        case 'bool':
          return { type: 'bool', value: tok.v };
        case 'referr':
          return { type: 'referr' };
        case 'name':
          return { type: 'name', name: tok.v };
        case 'colrange':
          return {
            type: 'range',
            c1: Math.min(tok.c1, tok.c2),
            c2: Math.max(tok.c1, tok.c2),
            r1: 0,
            r2: null,
          };
        case 'ref': {
          if (isOp(peek(), ':')) {
            next();
            const t2 = next();
            if (!t2 || t2.t !== 'ref') throw err.parse('Rango incompleto: después de ":" tiene que ir otra celda (ej: A1:A10).');
            return {
              type: 'range',
              c1: Math.min(tok.col, t2.col),
              c2: Math.max(tok.col, t2.col),
              r1: Math.min(tok.row, t2.row),
              r2: Math.max(tok.row, t2.row),
            };
          }
          return { type: 'ref', col: tok.col, row: tok.row };
        }
        case 'func': {
          const open = next();
          if (!open || open.t !== 'lparen') throw err.parse(`Falta abrir el paréntesis de ${tok.v}.`);
          const args = [];
          if (peek() && peek().t === 'rparen') {
            next();
            return { type: 'func', name: tok.v, args };
          }
          for (;;) {
            args.push(parseCompare());
            const t = next();
            if (!t) throw err.parse(`Falta cerrar el paréntesis de ${tok.v.toUpperCase()}.`);
            if (t.t === 'rparen') break;
            if (t.t !== 'sep') throw err.parse(`Se esperaba ";" o ")" y encontré "${text(t)}".`);
          }
          return { type: 'func', name: tok.v, args };
        }
        case 'lparen': {
          const e = parseCompare();
          const t = next();
          if (!t || t.t !== 'rparen') throw err.parse('Falta cerrar un paréntesis.');
          return e;
        }
        default:
          throw err.parse(`No esperaba "${text(tok)}" en esa posición.`);
      }
    }

    if (!toks.length) throw err.parse('La fórmula está vacía.');
    const ast = parseCompare();
    if (p < toks.length) throw err.parse(`Sobra "${src.slice(toks[p].s).trim()}" al final de la fórmula.`);
    return ast;
  }

  // ---------------------------------------------------------------------------
  // Evaluador
  // ---------------------------------------------------------------------------
  function evaluate(node, ctx) {
    switch (node.type) {
      case 'num':
      case 'str':
      case 'bool':
        return node.value;
      case 'referr':
        return err.ref('La referencia quedó fuera de la hoja.');
      case 'name':
        return err.name(`"${node.name}" no es una función ni una celda válida. ¿Te faltaron comillas para un texto?`);
      case 'ref':
        return ctx.getCell(node.col, node.row);
      case 'range':
        return ctx.getRange(node.c1, node.r1, node.c2, node.r2 === null ? ctx.maxRow() : node.r2);
      case 'unary': {
        const v = toNum(scalar(evaluate(node.arg, ctx)));
        if (isErr(v)) return v;
        return node.op === '-' ? -v : v;
      }
      case 'pct': {
        const v = toNum(scalar(evaluate(node.arg, ctx)));
        if (isErr(v)) return v;
        return v / 100;
      }
      case 'bin':
        return evalBinary(node, ctx);
      case 'func':
        return callFunction(node, ctx);
      default:
        return err.value();
    }
  }

  function evalBinary(node, ctx) {
    const a = scalar(evaluate(node.left, ctx));
    if (isErr(a)) return a;
    const b = scalar(evaluate(node.right, ctx));
    if (isErr(b)) return b;
    const op = node.op;
    if (op === '&') return toText(a) + toText(b);
    if (op === '=' || op === '<>' || op === '<' || op === '>' || op === '<=' || op === '>=') {
      const c = cmp(a, b);
      switch (op) {
        case '=':
          return c === 0;
        case '<>':
          return c !== 0;
        case '<':
          return c < 0;
        case '>':
          return c > 0;
        case '<=':
          return c <= 0;
        default:
          return c >= 0;
      }
    }
    const x = toNum(a);
    if (isErr(x)) return x;
    const y = toNum(b);
    if (isErr(y)) return y;
    switch (op) {
      case '+':
        return x + y;
      case '-':
        return x - y;
      case '*':
        return x * y;
      case '/':
        return y === 0 ? err.div0() : x / y;
      case '^': {
        const r = Math.pow(x, y);
        return isFinite(r) ? r : err.num();
      }
      default:
        return err.value();
    }
  }

  // ---------------------------------------------------------------------------
  // Registro de funciones
  // ---------------------------------------------------------------------------
  const FUNCS = {}; // nombre canónico (español) -> definición
  const ALIASES = {}; // nombre normalizado -> definición

  function def(names, spec) {
    const d = Object.assign({ name: names[0], aliases: names.slice(1), min: 0, max: Infinity }, spec);
    for (const nm of names) ALIASES[normName(nm)] = d;
    FUNCS[names[0]] = d;
  }
  // Función con argumentos escalares; propaga el primer error.
  function sdef(names, spec, impl) {
    def(
      names,
      Object.assign({}, spec, {
        fn: (args) => {
          const s = args.map(scalar);
          for (const v of s) if (isErr(v)) return v;
          return impl(...s);
        },
      })
    );
  }

  function callFunction(node, ctx) {
    const d = ALIASES[normName(node.name)];
    if (!d) return err.name(`No conozco la función "${node.name.toUpperCase()}". Revisá cómo está escrita.`);
    if (node.args.length < d.min || node.args.length > d.max) {
      return err.value(`Cantidad de argumentos incorrecta para ${d.name}. Sintaxis: ${d.sig}`);
    }
    if (d.lazy) return d.fn(node.args.map((a) => () => evaluate(a, ctx)), ctx);
    return d.fn(node.args.map((a) => evaluate(a, ctx)), ctx);
  }

  function callByName(name, args) {
    const d = ALIASES[normName(name)];
    if (!d) return err.name();
    if (d.lazy) return d.fn(args.map((a) => () => a), null);
    return d.fn(args, null);
  }

  // Números de los argumentos: en rangos se ignoran textos/booleanos/vacíos (como Excel).
  function numbersFrom(args) {
    const out = [];
    for (const a of args) {
      if (a instanceof RangeValue) {
        for (const v of a.flat()) {
          if (isErr(v)) return v;
          if (typeof v === 'number') out.push(v);
        }
      } else {
        if (isErr(a)) return a;
        if (a === null) continue;
        const n = toNum(a);
        if (isErr(n)) return n;
        out.push(n);
      }
    }
    return out;
  }
  const withNums = (impl) => (args) => {
    const n = numbersFrom(args);
    return isErr(n) ? n : impl(n);
  };

  function roundWith(fnRound, x, d) {
    const f = Math.pow(10, d);
    return (Math.sign(x) * fnRound(Number((Math.abs(x) * f).toPrecision(15)))) / f;
  }

  // ---- Matemáticas y estadística
  def(['SUMA', 'SUM'], {
    min: 1, cat: 'Matemáticas', sig: 'SUMA(valor1; [valor2]; ...)',
    desc: 'Suma todos los números de las celdas o rangos indicados.', ex: '=SUMA(B2:B10)',
    fn: withNums((n) => n.reduce((s, x) => s + x, 0)),
  });
  def(['PROMEDIO', 'AVERAGE'], {
    min: 1, cat: 'Estadística', sig: 'PROMEDIO(valor1; [valor2]; ...)',
    desc: 'Calcula la media aritmética (suma ÷ cantidad) de los números.', ex: '=PROMEDIO(C2:C20)',
    fn: withNums((n) => (n.length ? n.reduce((s, x) => s + x, 0) / n.length : err.div0())),
  });
  def(['MAX'], {
    min: 1, cat: 'Estadística', sig: 'MAX(valor1; [valor2]; ...)',
    desc: 'Devuelve el número más grande.', ex: '=MAX(F2:F13)',
    fn: withNums((n) => (n.length ? Math.max(...n) : 0)),
  });
  def(['MIN'], {
    min: 1, cat: 'Estadística', sig: 'MIN(valor1; [valor2]; ...)',
    desc: 'Devuelve el número más chico.', ex: '=MIN(F2:F13)',
    fn: withNums((n) => (n.length ? Math.min(...n) : 0)),
  });
  def(['MEDIANA', 'MEDIAN'], {
    min: 1, cat: 'Estadística', sig: 'MEDIANA(valor1; [valor2]; ...)',
    desc: 'Devuelve el valor del medio de los números ordenados.', ex: '=MEDIANA(B2:B50)',
    fn: withNums((n) => {
      if (!n.length) return err.num();
      const s = [...n].sort((a, b) => a - b);
      const m = Math.floor(s.length / 2);
      return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    }),
  });
  def(['DESVEST', 'DESVEST.M', 'STDEV', 'STDEV.S'], {
    min: 1, cat: 'Estadística', sig: 'DESVEST(valor1; [valor2]; ...)',
    desc: 'Desviación estándar de una muestra: cuánto se alejan los datos del promedio.', ex: '=DESVEST(B2:B50)',
    fn: withNums((n) => {
      if (n.length < 2) return err.div0();
      const avg = n.reduce((s, x) => s + x, 0) / n.length;
      return Math.sqrt(n.reduce((s, x) => s + (x - avg) * (x - avg), 0) / (n.length - 1));
    }),
  });
  def(['CONTAR', 'COUNT'], {
    min: 1, cat: 'Estadística', sig: 'CONTAR(valor1; [valor2]; ...)',
    desc: 'Cuenta cuántas celdas contienen números.', ex: '=CONTAR(C2:C100)',
    fn: (args) => {
      let c = 0;
      for (const a of args) {
        if (a instanceof RangeValue) c += a.flat().filter((v) => typeof v === 'number').length;
        else if (a !== null && !isErr(a) && !isErr(toNum(a))) c++;
      }
      return c;
    },
  });
  def(['CONTARA', 'COUNTA'], {
    min: 1, cat: 'Estadística', sig: 'CONTARA(valor1; [valor2]; ...)',
    desc: 'Cuenta cuántas celdas NO están vacías (números, textos, lo que sea).', ex: '=CONTARA(A2:A100)',
    fn: (args) => {
      let c = 0;
      for (const a of args) {
        if (a instanceof RangeValue) c += a.flat().filter((v) => v !== null && v !== undefined).length;
        else if (a !== null) c++;
      }
      return c;
    },
  });
  def(['CONTAR.BLANCO', 'COUNTBLANK'], {
    min: 1, max: 1, cat: 'Estadística', sig: 'CONTAR.BLANCO(rango)',
    desc: 'Cuenta las celdas vacías de un rango. Ideal para detectar datos faltantes.', ex: '=CONTAR.BLANCO(D2:D200)',
    fn: (args) => asRange(args[0]).flat().filter((v) => v === null || v === undefined || v === '').length,
  });
  sdef(['REDONDEAR', 'ROUND'], {
    min: 1, max: 2, cat: 'Matemáticas', sig: 'REDONDEAR(número; [decimales])',
    desc: 'Redondea un número a la cantidad de decimales indicada.', ex: '=REDONDEAR(B2*1.21; 2)',
  }, (x, d) => {
    const n = toNum(x); if (isErr(n)) return n;
    const k = d === undefined ? 0 : toNum(d); if (isErr(k)) return k;
    return roundWith(Math.round, n, Math.trunc(k));
  });
  sdef(['REDONDEAR.MAS', 'ROUNDUP'], {
    min: 1, max: 2, cat: 'Matemáticas', sig: 'REDONDEAR.MAS(número; [decimales])',
    desc: 'Redondea hacia arriba (alejándose del cero).', ex: '=REDONDEAR.MAS(B2; 0)',
  }, (x, d) => {
    const n = toNum(x); if (isErr(n)) return n;
    const k = d === undefined ? 0 : toNum(d); if (isErr(k)) return k;
    return roundWith(Math.ceil, n, Math.trunc(k));
  });
  sdef(['REDONDEAR.MENOS', 'ROUNDDOWN'], {
    min: 1, max: 2, cat: 'Matemáticas', sig: 'REDONDEAR.MENOS(número; [decimales])',
    desc: 'Redondea hacia abajo (acercándose al cero).', ex: '=REDONDEAR.MENOS(B2; 0)',
  }, (x, d) => {
    const n = toNum(x); if (isErr(n)) return n;
    const k = d === undefined ? 0 : toNum(d); if (isErr(k)) return k;
    return roundWith(Math.floor, n, Math.trunc(k));
  });
  sdef(['ENTERO', 'INT'], {
    min: 1, max: 1, cat: 'Matemáticas', sig: 'ENTERO(número)',
    desc: 'Redondea hacia abajo hasta el entero más próximo.', ex: '=ENTERO(B2)',
  }, (x) => { const n = toNum(x); return isErr(n) ? n : Math.floor(n); });
  sdef(['ABS'], {
    min: 1, max: 1, cat: 'Matemáticas', sig: 'ABS(número)',
    desc: 'Valor absoluto: el número sin signo.', ex: '=ABS(C2-B2)',
  }, (x) => { const n = toNum(x); return isErr(n) ? n : Math.abs(n); });
  sdef(['RESIDUO', 'MOD'], {
    min: 2, max: 2, cat: 'Matemáticas', sig: 'RESIDUO(número; divisor)',
    desc: 'Resto de una división.', ex: '=RESIDUO(A2; 2)',
  }, (x, y) => {
    const a = toNum(x); if (isErr(a)) return a;
    const b = toNum(y); if (isErr(b)) return b;
    if (b === 0) return err.div0();
    return a - b * Math.floor(a / b);
  });
  sdef(['POTENCIA', 'POWER'], {
    min: 2, max: 2, cat: 'Matemáticas', sig: 'POTENCIA(número; exponente)',
    desc: 'Eleva un número a una potencia. Equivale a número^exponente.', ex: '=POTENCIA(2; 10)',
  }, (x, y) => {
    const a = toNum(x); if (isErr(a)) return a;
    const b = toNum(y); if (isErr(b)) return b;
    const r = Math.pow(a, b);
    return isFinite(r) ? r : err.num();
  });
  sdef(['RAIZ', 'SQRT'], {
    min: 1, max: 1, cat: 'Matemáticas', sig: 'RAIZ(número)',
    desc: 'Raíz cuadrada.', ex: '=RAIZ(16)',
  }, (x) => {
    const a = toNum(x); if (isErr(a)) return a;
    return a < 0 ? err.num('No existe la raíz de un número negativo.') : Math.sqrt(a);
  });
  def(['PRODUCTO', 'PRODUCT'], {
    min: 1, cat: 'Matemáticas', sig: 'PRODUCTO(valor1; [valor2]; ...)',
    desc: 'Multiplica todos los números.', ex: '=PRODUCTO(B2:D2)',
    fn: withNums((n) => n.reduce((s, x) => s * x, 1)),
  });

  // ---- Lógica
  def(['SI', 'IF'], {
    min: 2, max: 3, lazy: true, cat: 'Lógica', sig: 'SI(prueba_lógica; valor_si_verdadero; [valor_si_falso])',
    desc: 'Si la condición se cumple devuelve un valor; si no, otro.', ex: '=SI(C2>=D2; "Sí"; "No")',
    fn: (t) => {
      const c = toBool(scalar(t[0]()));
      if (isErr(c)) return c;
      if (c) return t[1]();
      return t.length > 2 ? t[2]() : false;
    },
  });
  def(['SI.CONJUNTO', 'IFS'], {
    min: 2, lazy: true, cat: 'Lógica', sig: 'SI.CONJUNTO(condición1; valor1; [condición2; valor2]; ...)',
    desc: 'Evalúa varias condiciones en orden y devuelve el valor de la primera verdadera.',
    ex: '=SI.CONJUNTO(B2>=90; "A"; B2>=70; "B"; VERDADERO; "C")',
    fn: (t) => {
      if (t.length % 2) return err.value('SI.CONJUNTO necesita pares de condición y valor.');
      for (let i = 0; i < t.length; i += 2) {
        const c = toBool(scalar(t[i]()));
        if (isErr(c)) return c;
        if (c) return t[i + 1]();
      }
      return err.na('Ninguna condición se cumplió.');
    },
  });
  def(['SI.ERROR', 'IFERROR'], {
    min: 2, max: 2, lazy: true, cat: 'Lógica', sig: 'SI.ERROR(valor; valor_si_error)',
    desc: 'Si el primer valor da error (#N/A, #DIV/0!…), devuelve el segundo.', ex: '=SI.ERROR(B2/C2; 0)',
    fn: (t) => {
      const v = t[0]();
      return isErr(scalar(v)) ? t[1]() : v;
    },
  });
  function boolsFrom(args) {
    const out = [];
    for (const a of args) {
      if (a instanceof RangeValue) {
        for (const v of a.flat()) {
          if (isErr(v)) return v;
          if (typeof v === 'boolean') out.push(v);
          else if (typeof v === 'number') out.push(v !== 0);
        }
      } else {
        const b = toBool(a);
        if (isErr(b)) return b;
        out.push(b);
      }
    }
    return out.length ? out : err.value('No hay valores lógicos para evaluar.');
  }
  def(['Y', 'AND'], {
    min: 1, cat: 'Lógica', sig: 'Y(condición1; [condición2]; ...)',
    desc: 'VERDADERO si TODAS las condiciones se cumplen.', ex: '=Y(C2>=D2; B2="Retail")',
    fn: (args) => { const b = boolsFrom(args); return isErr(b) ? b : b.every(Boolean); },
  });
  def(['O', 'OR'], {
    min: 1, cat: 'Lógica', sig: 'O(condición1; [condición2]; ...)',
    desc: 'VERDADERO si AL MENOS UNA condición se cumple.', ex: '=O(B2="Norte"; B2="Sur")',
    fn: (args) => { const b = boolsFrom(args); return isErr(b) ? b : b.some(Boolean); },
  });
  sdef(['NO', 'NOT'], {
    min: 1, max: 1, cat: 'Lógica', sig: 'NO(condición)',
    desc: 'Invierte un valor lógico.', ex: '=NO(ESBLANCO(A2))',
  }, (x) => { const b = toBool(x); return isErr(b) ? b : !b; });

  // ---- Texto
  sdef(['ESPACIOS', 'TRIM'], {
    min: 1, max: 1, cat: 'Texto', sig: 'ESPACIOS(texto)',
    desc: 'Quita los espacios del principio y del final, y deja uno solo entre palabras.', ex: '=ESPACIOS(A2)',
  }, (x) => toText(x).replace(/ {2,}/g, ' ').trim());
  sdef(['MAYUSC', 'UPPER'], {
    min: 1, max: 1, cat: 'Texto', sig: 'MAYUSC(texto)',
    desc: 'Convierte el texto a MAYÚSCULAS.', ex: '=MAYUSC(A2)',
  }, (x) => toText(x).toUpperCase());
  sdef(['MINUSC', 'LOWER'], {
    min: 1, max: 1, cat: 'Texto', sig: 'MINUSC(texto)',
    desc: 'Convierte el texto a minúsculas.', ex: '=MINUSC(B2)',
  }, (x) => toText(x).toLowerCase());
  sdef(['NOMPROPIO', 'PROPER'], {
    min: 1, max: 1, cat: 'Texto', sig: 'NOMPROPIO(texto)',
    desc: 'Pone En Mayúscula La Primera Letra De Cada Palabra.', ex: '=NOMPROPIO(A2)',
  }, (x) => toText(x).toLowerCase().replace(/(^|[^\p{L}])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()));
  sdef(['LARGO', 'LEN'], {
    min: 1, max: 1, cat: 'Texto', sig: 'LARGO(texto)',
    desc: 'Cantidad de caracteres de un texto (los espacios también cuentan).', ex: '=LARGO(A2)',
  }, (x) => toText(x).length);
  sdef(['IZQUIERDA', 'LEFT'], {
    min: 1, max: 2, cat: 'Texto', sig: 'IZQUIERDA(texto; [cantidad])',
    desc: 'Devuelve los primeros caracteres de un texto.', ex: '=IZQUIERDA(A2; 3)',
  }, (x, k) => {
    const n = k === undefined ? 1 : toNum(k); if (isErr(n)) return n;
    return n < 0 ? err.value() : toText(x).slice(0, Math.trunc(n));
  });
  sdef(['DERECHA', 'RIGHT'], {
    min: 1, max: 2, cat: 'Texto', sig: 'DERECHA(texto; [cantidad])',
    desc: 'Devuelve los últimos caracteres de un texto.', ex: '=DERECHA(A2; 4)',
  }, (x, k) => {
    const n = k === undefined ? 1 : toNum(k); if (isErr(n)) return n;
    if (n < 0) return err.value();
    const s = toText(x);
    return Math.trunc(n) === 0 ? '' : s.slice(-Math.trunc(n));
  });
  sdef(['EXTRAE', 'MID'], {
    min: 3, max: 3, cat: 'Texto', sig: 'EXTRAE(texto; posición_inicial; cantidad)',
    desc: 'Extrae caracteres del medio de un texto.', ex: '=EXTRAE(A2; 4; 3)',
  }, (x, s, k) => {
    const a = toNum(s); if (isErr(a)) return a;
    const b = toNum(k); if (isErr(b)) return b;
    if (a < 1 || b < 0) return err.value();
    return toText(x).substr(Math.trunc(a) - 1, Math.trunc(b));
  });
  def(['CONCATENAR', 'CONCATENATE', 'CONCAT'], {
    min: 1, cat: 'Texto', sig: 'CONCATENAR(texto1; [texto2]; ...)',
    desc: 'Une varios textos en uno. También podés usar el operador &.', ex: '=CONCATENAR(A2; " "; B2)',
    fn: (args) => {
      let out = '';
      for (const a of args) {
        for (const v of asRange(a).flat()) {
          if (isErr(v)) return v;
          out += toText(v);
        }
      }
      return out;
    },
  });
  def(['UNIRCADENAS', 'TEXTJOIN'], {
    min: 3, cat: 'Texto', sig: 'UNIRCADENAS(delimitador; ignorar_vacías; texto1; ...)',
    desc: 'Une textos separándolos con un delimitador.', ex: '=UNIRCADENAS(", "; VERDADERO; A2:A5)',
    fn: (args) => {
      const d = scalar(args[0]); if (isErr(d)) return d;
      const ign = toBool(scalar(args[1])); if (isErr(ign)) return ign;
      const parts = [];
      for (const a of args.slice(2)) {
        for (const v of asRange(a).flat()) {
          if (isErr(v)) return v;
          const t = toText(v);
          if (ign && t === '') continue;
          parts.push(t);
        }
      }
      return parts.join(toText(d));
    },
  });
  sdef(['SUSTITUIR', 'SUBSTITUTE'], {
    min: 3, max: 4, cat: 'Texto', sig: 'SUSTITUIR(texto; texto_original; texto_nuevo; [n_ocurrencia])',
    desc: 'Reemplaza un texto por otro dentro de una celda.', ex: '=SUSTITUIR(A2; "-"; "")',
  }, (x, o, nw, k) => {
    const s = toText(x); const a = toText(o); const b = toText(nw);
    if (a === '') return s;
    if (k === undefined) return s.split(a).join(b);
    const n = toNum(k); if (isErr(n)) return n;
    let idx = -1;
    for (let i = 0; i < Math.trunc(n); i++) {
      idx = s.indexOf(a, idx + 1);
      if (idx < 0) return s;
    }
    return s.slice(0, idx) + b + s.slice(idx + a.length);
  });
  sdef(['VALOR', 'VALUE'], {
    min: 1, max: 1, cat: 'Texto', sig: 'VALOR(texto)',
    desc: 'Convierte un texto que parece número en un número de verdad.', ex: '=VALOR(B2)',
  }, (x) => {
    if (typeof x === 'number') return x;
    const n = parseNumberStrict(toText(x));
    return n === null ? err.value(`"${toText(x)}" no se puede convertir en número.`) : n;
  });
  sdef(['ENCONTRAR', 'FIND'], {
    min: 2, max: 3, cat: 'Texto', sig: 'ENCONTRAR(texto_buscado; dentro_de; [posición_inicial])',
    desc: 'Posición de un texto dentro de otro (distingue mayúsculas).', ex: '=ENCONTRAR("@"; B2)',
  }, (q, s, k) => {
    const st = k === undefined ? 1 : toNum(k); if (isErr(st)) return st;
    const i = toText(s).indexOf(toText(q), Math.trunc(st) - 1);
    return i < 0 ? err.value(`No encontré "${toText(q)}".`) : i + 1;
  });
  sdef(['HALLAR', 'SEARCH'], {
    min: 2, max: 3, cat: 'Texto', sig: 'HALLAR(texto_buscado; dentro_de; [posición_inicial])',
    desc: 'Como ENCONTRAR pero sin distinguir mayúsculas.', ex: '=HALLAR("gmail"; B2)',
  }, (q, s, k) => {
    const st = k === undefined ? 1 : toNum(k); if (isErr(st)) return st;
    const i = toText(s).toLowerCase().indexOf(toText(q).toLowerCase(), Math.trunc(st) - 1);
    return i < 0 ? err.value(`No encontré "${toText(q)}".`) : i + 1;
  });

  // ---- Información
  def(['ESBLANCO', 'ISBLANK'], {
    min: 1, max: 1, cat: 'Información', sig: 'ESBLANCO(valor)',
    desc: 'VERDADERO si la celda está vacía.', ex: '=ESBLANCO(D2)',
    fn: (a) => { const v = scalar(a[0]); return v === null || v === undefined; },
  });
  def(['ESNUMERO', 'ISNUMBER'], {
    min: 1, max: 1, cat: 'Información', sig: 'ESNUMERO(valor)',
    desc: 'VERDADERO si el valor es un número (útil para detectar números guardados como texto).', ex: '=ESNUMERO(C2)',
    fn: (a) => typeof scalar(a[0]) === 'number',
  });
  def(['ESTEXTO', 'ISTEXT'], {
    min: 1, max: 1, cat: 'Información', sig: 'ESTEXTO(valor)',
    desc: 'VERDADERO si el valor es un texto.', ex: '=ESTEXTO(C2)',
    fn: (a) => typeof scalar(a[0]) === 'string',
  });
  def(['ESERROR', 'ISERROR'], {
    min: 1, max: 1, cat: 'Información', sig: 'ESERROR(valor)',
    desc: 'VERDADERO si el valor es un error.', ex: '=ESERROR(B2/C2)',
    fn: (a) => isErr(scalar(a[0])),
  });

  // ---- Condicionales (criterios)
  function wildcardRegex(pattern) {
    let re = '';
    for (let i = 0; i < pattern.length; i++) {
      const ch = pattern[i];
      if (ch === '~' && (pattern[i + 1] === '*' || pattern[i + 1] === '?')) {
        re += '\\' + pattern[++i];
      } else if (ch === '*') re += '[\\s\\S]*';
      else if (ch === '?') re += '[\\s\\S]';
      else re += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    return new RegExp('^' + re + '$', 'i');
  }
  function numOp(op, x, y) {
    const c = cmp(x, y);
    switch (op) {
      case '=': return c === 0;
      case '<>': return c !== 0;
      case '<': return c < 0;
      case '>': return c > 0;
      case '<=': return c <= 0;
      default: return c >= 0;
    }
  }
  function makeCriterion(crit) {
    crit = scalar(crit);
    if (isErr(crit)) return crit;
    if (typeof crit === 'number') {
      return (v) => (typeof v === 'number' ? cmp(v, crit) === 0 : typeof v === 'string' && parseNumberStrict(v) === crit);
    }
    if (typeof crit === 'boolean') return (v) => v === crit;
    const s = crit === null || crit === undefined ? '' : String(crit);
    const m = /^(<=|>=|<>|<|>|=)?([\s\S]*)$/.exec(s);
    const op = m[1] || '=';
    const operand = m[2];
    const num = parseNumberStrict(operand);
    if (num !== null) {
      return (v) => {
        const x = typeof v === 'number' ? v : typeof v === 'string' ? parseNumberStrict(v) : null;
        if (x === null) return op === '<>';
        return numOp(op, x, num);
      };
    }
    if (operand === '') {
      if (op === '=') return (v) => v === null || v === undefined || v === '';
      if (op === '<>') return (v) => !(v === null || v === undefined || v === '');
      return () => false;
    }
    if (op === '=' || op === '<>') {
      const re = wildcardRegex(operand);
      return (v) => {
        const hit = typeof v === 'string' && re.test(v);
        return op === '=' ? hit : !hit;
      };
    }
    return (v) => typeof v === 'string' && numOp(op, v, operand);
  }
  // Devuelve un arreglo de booleanos (uno por celda) para pares rango/criterio.
  function matchMask(pairs) {
    const first = asRange(pairs[0][0]);
    const h = first.height;
    const w = first.width;
    const mask = new Array(h * w).fill(true);
    for (const [rg, crit] of pairs) {
      const r = asRange(rg);
      if (r.height !== h || r.width !== w) return err.value('Todos los rangos de criterios deben tener el mismo tamaño.');
      const test = makeCriterion(crit);
      if (isErr(test)) return test;
      const vals = r.flat();
      for (let i = 0; i < vals.length; i++) {
        if (isErr(vals[i])) continue;
        if (mask[i] && !test(vals[i])) mask[i] = false;
      }
    }
    return mask;
  }
  function pairsFrom(args, start) {
    const pairs = [];
    for (let i = start; i < args.length; i += 2) pairs.push([args[i], args[i + 1]]);
    return pairs;
  }
  // Valores de un rango "objetivo" alineado con el rango de criterios.
  function alignedValues(target, h, w) {
    const r = asRange(target);
    const out = [];
    for (let i = 0; i < h; i++) for (let j = 0; j < w; j++) out.push(r.rows[i] ? r.rows[i][j] : undefined);
    return out;
  }

  def(['CONTAR.SI', 'COUNTIF'], {
    min: 2, max: 2, cat: 'Condicionales', sig: 'CONTAR.SI(rango; criterio)',
    desc: 'Cuenta las celdas que cumplen un criterio. Ej: "Norte", ">100", "<>Cancelado".', ex: '=CONTAR.SI(B2:B25; "Norte")',
    fn: (args) => {
      const mask = matchMask([[args[0], args[1]]]);
      return isErr(mask) ? mask : mask.filter(Boolean).length;
    },
  });
  def(['CONTAR.SI.CONJUNTO', 'COUNTIFS'], {
    min: 2, cat: 'Condicionales', sig: 'CONTAR.SI.CONJUNTO(rango1; criterio1; [rango2; criterio2]; ...)',
    desc: 'Cuenta las filas que cumplen TODOS los criterios.', ex: '=CONTAR.SI.CONJUNTO(B2:B25; "Sur"; D2:D25; "Demorado")',
    fn: (args) => {
      if (args.length % 2) return err.value('Los rangos y criterios van de a pares.');
      const mask = matchMask(pairsFrom(args, 0));
      return isErr(mask) ? mask : mask.filter(Boolean).length;
    },
  });
  def(['SUMAR.SI', 'SUMIF'], {
    min: 2, max: 3, cat: 'Condicionales', sig: 'SUMAR.SI(rango; criterio; [rango_suma])',
    desc: 'Suma los valores de las filas que cumplen un criterio.', ex: '=SUMAR.SI(B2:B25; "Norte"; E2:E25)',
    fn: (args) => {
      const mask = matchMask([[args[0], args[1]]]);
      if (isErr(mask)) return mask;
      const r = asRange(args[0]);
      const vals = alignedValues(args.length > 2 ? args[2] : args[0], r.height, r.width);
      let s = 0;
      for (let i = 0; i < mask.length; i++) {
        if (!mask[i]) continue;
        if (isErr(vals[i])) return vals[i];
        if (typeof vals[i] === 'number') s += vals[i];
      }
      return s;
    },
  });
  def(['SUMAR.SI.CONJUNTO', 'SUMIFS'], {
    min: 3, cat: 'Condicionales', sig: 'SUMAR.SI.CONJUNTO(rango_suma; rango1; criterio1; [rango2; criterio2]; ...)',
    desc: 'Suma los valores de las filas que cumplen TODOS los criterios. ¡Ojo: el rango a sumar va primero!',
    ex: '=SUMAR.SI.CONJUNTO(E2:E25; B2:B25; "Sur"; D2:D25; "Entregado")',
    fn: (args) => {
      if ((args.length - 1) % 2) return err.value('Los rangos y criterios van de a pares.');
      const mask = matchMask(pairsFrom(args, 1));
      if (isErr(mask)) return mask;
      const r = asRange(args[1]);
      const vals = alignedValues(args[0], r.height, r.width);
      let s = 0;
      for (let i = 0; i < mask.length; i++) {
        if (!mask[i]) continue;
        if (isErr(vals[i])) return vals[i];
        if (typeof vals[i] === 'number') s += vals[i];
      }
      return s;
    },
  });
  function avgMasked(mask, vals) {
    let s = 0;
    let c = 0;
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) continue;
      if (isErr(vals[i])) return vals[i];
      if (typeof vals[i] === 'number') {
        s += vals[i];
        c++;
      }
    }
    return c ? s / c : err.div0();
  }
  def(['PROMEDIO.SI', 'AVERAGEIF'], {
    min: 2, max: 3, cat: 'Condicionales', sig: 'PROMEDIO.SI(rango; criterio; [rango_promedio])',
    desc: 'Promedio de los valores de las filas que cumplen un criterio.', ex: '=PROMEDIO.SI(B2:B25; "Norte"; E2:E25)',
    fn: (args) => {
      const mask = matchMask([[args[0], args[1]]]);
      if (isErr(mask)) return mask;
      const r = asRange(args[0]);
      return avgMasked(mask, alignedValues(args.length > 2 ? args[2] : args[0], r.height, r.width));
    },
  });
  def(['PROMEDIO.SI.CONJUNTO', 'AVERAGEIFS'], {
    min: 3, cat: 'Condicionales', sig: 'PROMEDIO.SI.CONJUNTO(rango_promedio; rango1; criterio1; ...)',
    desc: 'Promedio de las filas que cumplen TODOS los criterios.', ex: '=PROMEDIO.SI.CONJUNTO(E2:E25; B2:B25; "Sur")',
    fn: (args) => {
      if ((args.length - 1) % 2) return err.value('Los rangos y criterios van de a pares.');
      const mask = matchMask(pairsFrom(args, 1));
      if (isErr(mask)) return mask;
      const r = asRange(args[1]);
      return avgMasked(mask, alignedValues(args[0], r.height, r.width));
    },
  });
  function extremeIfs(pick) {
    return (args) => {
      if ((args.length - 1) % 2) return err.value('Los rangos y criterios van de a pares.');
      const mask = matchMask(pairsFrom(args, 1));
      if (isErr(mask)) return mask;
      const r = asRange(args[1]);
      const vals = alignedValues(args[0], r.height, r.width);
      const nums = [];
      for (let i = 0; i < mask.length; i++) if (mask[i] && typeof vals[i] === 'number') nums.push(vals[i]);
      return nums.length ? pick(...nums) : 0;
    };
  }
  def(['MAX.SI.CONJUNTO', 'MAXIFS'], {
    min: 3, cat: 'Condicionales', sig: 'MAX.SI.CONJUNTO(rango_max; rango1; criterio1; ...)',
    desc: 'El valor más grande entre las filas que cumplen los criterios.', ex: '=MAX.SI.CONJUNTO(E2:E25; B2:B25; "Sur")',
    fn: extremeIfs(Math.max),
  });
  def(['MIN.SI.CONJUNTO', 'MINIFS'], {
    min: 3, cat: 'Condicionales', sig: 'MIN.SI.CONJUNTO(rango_min; rango1; criterio1; ...)',
    desc: 'El valor más chico entre las filas que cumplen los criterios.', ex: '=MIN.SI.CONJUNTO(E2:E25; B2:B25; "Sur")',
    fn: extremeIfs(Math.min),
  });

  // ---- Búsqueda
  function exactIndex(list, val) {
    if (typeof val === 'string' && /[*?]/.test(val)) {
      const re = wildcardRegex(val);
      return list.findIndex((k) => typeof k === 'string' && re.test(k));
    }
    return list.findIndex((k) => k !== null && k !== undefined && typeof k === typeof val && cmp(k, val) === 0);
  }
  function approxIndex(list, val, descending) {
    let found = -1;
    for (let i = 0; i < list.length; i++) {
      const k = list[i];
      if (k === null || k === undefined || typeof k !== typeof val) continue;
      const c = cmp(k, val);
      if (c === 0) return i;
      if (descending ? c > 0 : c < 0) found = i;
      else break;
    }
    return found;
  }
  def(['BUSCARV', 'VLOOKUP'], {
    min: 3, max: 4, cat: 'Búsqueda', sig: 'BUSCARV(valor_buscado; tabla; columna; [aproximado])',
    desc: 'Busca un valor en la PRIMERA columna de una tabla y devuelve el dato de otra columna de esa fila. Usá FALSO para coincidencia exacta.',
    ex: '=BUSCARV(A2; Productos!A:C; 3; FALSO)',
    fn: (args) => {
      const val = scalar(args[0]);
      if (isErr(val)) return val;
      if (!(args[1] instanceof RangeValue)) return err.value('El segundo argumento tiene que ser un rango (la tabla).');
      const tbl = args[1];
      const idx = toNum(scalar(args[2]));
      if (isErr(idx)) return idx;
      const col = Math.trunc(idx);
      if (col < 1) return err.value('El número de columna tiene que ser 1 o mayor.');
      if (col > tbl.width) return err.ref(`La tabla tiene ${tbl.width} columnas y pediste la ${col}.`);
      let approx = true;
      if (args.length > 3) {
        const b = toBool(scalar(args[3]));
        if (isErr(b)) return b;
        approx = b;
      }
      const keys = tbl.rows.map((r) => r[0]);
      const i = approx ? approxIndex(keys, val, false) : exactIndex(keys, val);
      if (i < 0) return err.na(`No encontré "${toText(val)}" en la primera columna de la tabla.`);
      const out = tbl.rows[i][col - 1];
      return out === null || out === undefined ? 0 : out;
    },
  });
  def(['BUSCARX', 'XLOOKUP'], {
    min: 3, max: 4, cat: 'Búsqueda', sig: 'BUSCARX(valor_buscado; rango_búsqueda; rango_resultado; [si_no_encuentra])',
    desc: 'Busca un valor en un rango y devuelve el dato de la misma posición en otro rango. Más flexible que BUSCARV.',
    ex: '=BUSCARX(A2; Clientes!A:A; Clientes!C:C; "Sin dato")',
    fn: (args) => {
      const val = scalar(args[0]);
      if (isErr(val)) return val;
      const look = asRange(args[1]);
      const ret = asRange(args[2]);
      const vertical = look.width === 1;
      if (!vertical && look.height !== 1) return err.value('El rango de búsqueda tiene que ser una sola fila o columna.');
      const list = vertical ? look.rows.map((r) => r[0]) : look.rows[0];
      const i = exactIndex(list, val);
      if (i < 0) return args.length > 3 ? scalar(args[3]) : err.na(`No encontré "${toText(val)}".`);
      if (vertical) {
        const row = ret.rows[i];
        if (!row) return err.ref();
        return row.length === 1 ? (row[0] === null ? 0 : row[0]) : new RangeValue([row]);
      }
      const colVals = ret.rows.map((r) => r[i]);
      return colVals.length === 1 ? (colVals[0] === null ? 0 : colVals[0]) : new RangeValue(colVals.map((v) => [v]));
    },
  });
  def(['COINCIDIR', 'MATCH'], {
    min: 2, max: 3, cat: 'Búsqueda', sig: 'COINCIDIR(valor_buscado; rango; [tipo])',
    desc: 'Posición de un valor dentro de un rango. Usá 0 para coincidencia exacta.', ex: '=COINCIDIR("Sur"; H2:H5; 0)',
    fn: (args) => {
      const val = scalar(args[0]);
      if (isErr(val)) return val;
      const rg = asRange(args[1]);
      if (rg.width !== 1 && rg.height !== 1) return err.na('El rango tiene que ser una sola fila o columna.');
      const list = rg.flat();
      let type = 1;
      if (args.length > 2) {
        const t = toNum(scalar(args[2]));
        if (isErr(t)) return t;
        type = Math.sign(t);
      }
      const i = type === 0 ? exactIndex(list, val) : approxIndex(list, val, type < 0);
      return i < 0 ? err.na(`No encontré "${toText(val)}".`) : i + 1;
    },
  });
  def(['INDICE', 'INDEX'], {
    min: 2, max: 3, cat: 'Búsqueda', sig: 'INDICE(rango; fila; [columna])',
    desc: 'Devuelve el valor de la fila y columna indicadas dentro de un rango.', ex: '=INDICE(A2:C20; 5; 2)',
    fn: (args) => {
      const rg = asRange(args[0]);
      const a = toNum(scalar(args[1]));
      if (isErr(a)) return a;
      let r = Math.trunc(a);
      let c = 1;
      if (args.length > 2) {
        const b = toNum(scalar(args[2]));
        if (isErr(b)) return b;
        c = Math.trunc(b);
      } else if (rg.height === 1) {
        c = r;
        r = 1;
      }
      if (r < 1 || c < 1 || r > rg.height || c > rg.width) return err.ref('La posición pedida está fuera del rango.');
      const v = rg.rows[r - 1][c - 1];
      return v === null || v === undefined ? 0 : v;
    },
  });

  // ---------------------------------------------------------------------------
  // Utilidades para el editor y las misiones
  // ---------------------------------------------------------------------------

  // Desplaza las referencias relativas de una fórmula (copiar/pegar, rellenar).
  function shiftFormula(input, dc, dr) {
    if (typeof input !== 'string' || input[0] !== '=') return input;
    let toks;
    try {
      toks = tokenize(input.slice(1));
    } catch (e) {
      return input;
    }
    let out = input.slice(1);
    for (let i = toks.length - 1; i >= 0; i--) {
      const t = toks[i];
      let rep = null;
      if (t.t === 'ref') {
        const c = t.absC ? t.col : t.col + dc;
        const r = t.absR ? t.row : t.row + dr;
        rep = c < 0 || r < 0 ? '#REF!' : makeRef(c, r, t.absC, t.absR);
      } else if (t.t === 'colrange') {
        const c1 = t.absC1 ? t.c1 : t.c1 + dc;
        const c2 = t.absC2 ? t.c2 : t.c2 + dc;
        rep = c1 < 0 || c2 < 0 ? '#REF!' : (t.absC1 ? '$' : '') + indexToCol(c1) + ':' + (t.absC2 ? '$' : '') + indexToCol(c2);
      }
      if (rep !== null) out = out.slice(0, t.s) + rep + out.slice(t.e);
    }
    return '=' + out;
  }

  // F4: alterna A1 → $A$1 → A$1 → $A1 → A1 en la referencia donde está el cursor.
  function toggleAbsolute(text, caret) {
    if (typeof text !== 'string' || text[0] !== '=') return null;
    let toks;
    try {
      toks = tokenize(text.slice(1));
    } catch (e) {
      return null;
    }
    const pos = caret - 1;
    const i = toks.findIndex((k) => k.t === 'ref' && pos >= k.s && pos <= k.e);
    if (i < 0) return null;
    const t = toks[i];
    // Si la referencia es un extremo de un rango (A1:B5), se alternan los dos extremos juntos.
    const isColon = (k) => k && k.t === 'op' && k.v === ':';
    let group = [t];
    if (isColon(toks[i - 1]) && toks[i - 2] && toks[i - 2].t === 'ref') group = [toks[i - 2], t];
    else if (isColon(toks[i + 1]) && toks[i + 2] && toks[i + 2].t === 'ref') group = [t, toks[i + 2]];
    const states = [[false, false], [true, true], [false, true], [true, false]];
    const cur = states.findIndex((s) => s[0] === t.absC && s[1] === t.absR);
    const [ac, ar] = states[(cur + 1) % 4];
    let body = text.slice(1);
    let end = 0;
    for (let g = group.length - 1; g >= 0; g--) {
      const k = group[g];
      const rep = makeRef(k.col, k.row, ac, ar);
      body = body.slice(0, k.s) + rep + body.slice(k.e);
      if (g === group.length - 1) end = k.s + rep.length;
    }
    // El cursor queda al final del grupo (ajustado si cambió el largo del primer extremo).
    const newToks = tokenize(body);
    const last = newToks.filter((k) => k.t === 'ref' && k.s >= group[0].s)[group.length - 1];
    return { text: '=' + body, caret: 1 + (last ? last.e : end) };
  }

  // Referencias de una fórmula (para resaltarlas mientras se edita).
  function formulaRefs(text) {
    if (typeof text !== 'string' || text[0] !== '=') return [];
    let toks;
    try {
      toks = tokenize(text.slice(1));
    } catch (e) {
      return [];
    }
    const out = [];
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (t.t === 'ref') {
        const n1 = toks[i + 1];
        const n2 = toks[i + 2];
        if (n1 && n1.t === 'op' && n1.v === ':' && n2 && n2.t === 'ref') {
          out.push({ c1: Math.min(t.col, n2.col), r1: Math.min(t.row, n2.row), c2: Math.max(t.col, n2.col), r2: Math.max(t.row, n2.row) });
          i += 2;
        } else out.push({ c1: t.col, r1: t.row, c2: t.col, r2: t.row });
      } else if (t.t === 'colrange') {
        out.push({ c1: Math.min(t.c1, t.c2), r1: 0, c2: Math.max(t.c1, t.c2), r2: null });
      }
    }
    return out;
  }

  // Analiza una fórmula: funciones usadas, celdas referenciadas, números literales.
  function analyze(input) {
    const res = { formula: false, error: null, funcs: new Set(), refs: new Set(), ranges: [], numbers: [] };
    if (typeof input !== 'string' || input[0] !== '=') return res;
    res.formula = true;
    let ast;
    try {
      ast = parse(input.slice(1));
    } catch (e) {
      res.error = e;
      return res;
    }
    (function walk(nd) {
      switch (nd.type) {
        case 'func': {
          const d = ALIASES[normName(nd.name)];
          res.funcs.add(d ? d.name : normName(nd.name));
          nd.args.forEach(walk);
          break;
        }
        case 'ref':
          res.refs.add(makeRef(nd.col, nd.row));
          break;
        case 'range':
          res.ranges.push(nd);
          break;
        case 'bin':
          walk(nd.left);
          walk(nd.right);
          break;
        case 'unary':
        case 'pct':
          walk(nd.arg);
          break;
        case 'num':
          res.numbers.push(nd.value);
          break;
        default:
          break;
      }
    })(ast);
    return res;
  }

  function canonicalName(name) {
    const d = ALIASES[normName(name)];
    return d ? d.name : null;
  }
  function getFunction(name) {
    return ALIASES[normName(name)] || null;
  }
  function functionList() {
    return Object.values(FUNCS);
  }

  AA.Formula = {
    FormulaError,
    RangeValue,
    errors: err,
    isErr,
    colToIndex,
    indexToCol,
    parseRef,
    parseRange,
    makeRef,
    normName,
    parseNumberStrict,
    fmtNumber,
    toNum,
    toText,
    toBool,
    cmp,
    tokenize,
    parse,
    evaluate,
    callByName,
    shiftFormula,
    toggleAbsolute,
    formulaRefs,
    analyze,
    canonicalName,
    getFunction,
    functionList,
  };
})();
