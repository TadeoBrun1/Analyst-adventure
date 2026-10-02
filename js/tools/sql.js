/*
 * Analyst Adventure — Motor SQL simplificado (en memoria).
 *
 * Soporta lo que un analista usa el 90% del tiempo:
 *   SELECT [DISTINCT] columnas | * | expresiones [AS alias]
 *   FROM tabla [alias] [[INNER | LEFT] JOIN tabla [alias] ON condición]...
 *   [WHERE condición] [GROUP BY ...] [HAVING condición] [ORDER BY ... [ASC|DESC]] [LIMIT n [OFFSET m]]
 * Condiciones: = <> != < > <= >=, AND, OR, NOT, LIKE, IN (...), BETWEEN, IS [NOT] NULL.
 * Funciones: COUNT, SUM, AVG, MIN, MAX (con DISTINCT), ROUND, ABS, UPPER, LOWER, LENGTH,
 *            SUBSTR, TRIM, REPLACE, COALESCE, IFNULL, CASE WHEN … THEN … ELSE … END.
 *
 * Los errores explican qué está mal en palabras simples (en español o inglés).
 * Tablas: { nombre: { headers: [...], rows: [[...], ...] } }
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const T = (es, en) => (AA.T ? AA.T(es, en) : es);

  class SqlError extends Error {}
  const fail = (es, en) => {
    throw new SqlError(T(es, en));
  };

  const KEYWORDS = new Set(['SELECT', 'DISTINCT', 'FROM', 'WHERE', 'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC', 'LIMIT', 'OFFSET', 'AS', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'IS', 'NULL', 'JOIN', 'INNER', 'LEFT', 'OUTER', 'ON', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'TRUE', 'FALSE']);
  const AGG_FUNCS = new Set(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX']);
  const SCALAR_FUNCS = new Set(['ROUND', 'ABS', 'UPPER', 'LOWER', 'LENGTH', 'SUBSTR', 'SUBSTRING', 'TRIM', 'REPLACE', 'COALESCE', 'IFNULL']);
  const lower = (s) => String(s).toLowerCase();

  // ---------------------------------------------------------------------------
  // Tokenizer
  // ---------------------------------------------------------------------------
  function tokenize(src) {
    const toks = [];
    let i = 0;
    const n = src.length;
    while (i < n) {
      const ch = src[i];
      if (/\s/.test(ch)) {
        i++;
        continue;
      }
      if (ch === '-' && src[i + 1] === '-') {
        while (i < n && src[i] !== '\n') i++;
        continue;
      }
      if (/\d/.test(ch) || (ch === '.' && /\d/.test(src[i + 1] || ''))) {
        const m = /^(\d+\.?\d*|\.\d+)/.exec(src.slice(i));
        toks.push({ t: 'num', v: parseFloat(m[0]), s: i, e: i + m[0].length });
        i += m[0].length;
        continue;
      }
      if (ch === "'") {
        let j = i + 1;
        let out = '';
        for (;;) {
          if (j >= n) fail('Falta cerrar las comillas simples de un texto.', 'A text is missing its closing single quote.');
          if (src[j] === "'") {
            if (src[j + 1] === "'") {
              out += "'";
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
      if (ch === '"' || ch === '`') {
        const close = src.indexOf(ch, i + 1);
        if (close < 0) fail(`Falta cerrar ${ch}.`, `Missing closing ${ch}.`);
        toks.push({ t: 'id', v: src.slice(i + 1, close), quoted: ch, s: i, e: close + 1 });
        i = close + 1;
        continue;
      }
      const m = /^[A-Za-z_À-ſ][A-Za-z0-9_À-ſ]*/.exec(src.slice(i));
      if (m) {
        const up = m[0].toUpperCase();
        toks.push(KEYWORDS.has(up) ? { t: 'kw', v: up, s: i, e: i + m[0].length } : { t: 'id', v: m[0], s: i, e: i + m[0].length });
        i += m[0].length;
        continue;
      }
      const two = src.substr(i, 2);
      if (['<=', '>=', '<>', '!=', '||', '=='].includes(two)) {
        if (two === '==') fail('En SQL la igualdad se escribe con un solo "=".', 'In SQL equality is written with a single "=".');
        toks.push({ t: 'op', v: two, s: i, e: i + 2 });
        i += 2;
        continue;
      }
      if ('=<>+-*/%(),.;'.includes(ch)) {
        toks.push({ t: 'op', v: ch, s: i, e: i + 1 });
        i++;
        continue;
      }
      fail(`No entiendo el carácter "${ch}".`, `I don't understand the character "${ch}".`);
    }
    return toks;
  }

  // ---------------------------------------------------------------------------
  // Parser
  // ---------------------------------------------------------------------------
  const CLAUSE_ORDER = ['SELECT', 'FROM', 'WHERE', 'GROUP', 'HAVING', 'ORDER', 'LIMIT'];
  const ORDER_MSG = () => T('El orden de las cláusulas es: SELECT … FROM … WHERE … GROUP BY … HAVING … ORDER BY … LIMIT.', 'The clause order is: SELECT … FROM … WHERE … GROUP BY … HAVING … ORDER BY … LIMIT.');

  function parse(src) {
    const toks = tokenize(src);
    while (toks.length && toks[toks.length - 1].t === 'op' && toks[toks.length - 1].v === ';') toks.pop();
    let p = 0;
    const peek = (k = 0) => toks[p + k];
    const next = () => toks[p++];
    const isKw = (tok, ...kws) => tok && tok.t === 'kw' && kws.includes(tok.v);
    const isOp = (tok, ...ops) => tok && tok.t === 'op' && ops.includes(tok.v);
    const text = (tok) => (tok ? src.slice(tok.s, tok.e) : T('el final', 'the end'));
    const expectKw = (kw, es, en) => {
      if (!isKw(peek(), kw)) fail(es || `Se esperaba ${kw} y encontré "${text(peek())}".`, en || `Expected ${kw} but found "${text(peek())}".`);
      return next();
    };
    const expectOp = (op) => {
      if (!isOp(peek(), op)) fail(`Se esperaba "${op}" y encontré "${text(peek())}".`, `Expected "${op}" but found "${text(peek())}".`);
      return next();
    };

    if (!toks.length) fail('La consulta está vacía. Empezá con SELECT.', 'The query is empty. Start with SELECT.');
    if (!isKw(peek(), 'SELECT')) fail(`Una consulta empieza con SELECT (encontré "${text(peek())}").`, `A query starts with SELECT (found "${text(peek())}").`);
    next();
    const q = { distinct: false, columns: [], from: null, joins: [], where: null, groupBy: [], having: null, orderBy: [], limit: null, offset: 0 };
    if (isKw(peek(), 'DISTINCT')) {
      next();
      q.distinct = true;
    }
    // Lista del SELECT
    for (;;) {
      const start = peek();
      if (!start || isKw(start, 'FROM')) fail('Falta qué columnas querés ver después de SELECT (o * para todas).', 'After SELECT, list the columns you want (or * for all of them).');
      if (isOp(start, '*')) {
        next();
        q.columns.push({ star: true });
      } else if (start.t === 'id' && isOp(peek(1), '.') && isOp(peek(2), '*')) {
        p += 3;
        q.columns.push({ star: true, table: start.v });
      } else {
        const first = p;
        const expr = parseExpr();
        const exprText = src.slice(toks[first].s, toks[p - 1].e).trim();
        let alias = null;
        let implicit = false;
        if (isKw(peek(), 'AS')) {
          next();
          const a = next();
          if (!a || (a.t !== 'id' && a.t !== 'str')) fail('Después de AS va el nombre de la columna.', 'AS must be followed by the column name.');
          alias = a.v;
        } else if (peek() && peek().t === 'id') {
          alias = next().v;
          implicit = true;
        }
        q.columns.push({ expr, alias, implicit, text: exprText });
      }
      if (isOp(peek(), ',')) {
        next();
        continue;
      }
      break;
    }
    if (!isKw(peek(), 'FROM')) {
      if (!peek()) fail('Falta FROM: ¿de qué tabla salen los datos? Ej: SELECT * FROM ventas', 'FROM is missing: which table does the data come from? E.g.: SELECT * FROM sales');
      fail(`Se esperaba FROM o una coma y encontré "${text(peek())}". ¿Falta una coma entre columnas?`, `Expected FROM or a comma but found "${text(peek())}". Is a comma missing between columns?`);
    }
    next();
    q.from = parseTableRef();
    for (;;) {
      let type = null;
      if (isKw(peek(), 'JOIN')) type = 'inner';
      else if (isKw(peek(), 'INNER') && isKw(peek(1), 'JOIN')) {
        next();
        type = 'inner';
      } else if (isKw(peek(), 'LEFT')) {
        next();
        if (isKw(peek(), 'OUTER')) next();
        if (!isKw(peek(), 'JOIN')) fail('Después de LEFT va JOIN.', 'LEFT must be followed by JOIN.');
        type = 'left';
      }
      if (!type) break;
      next();
      const ref = parseTableRef();
      expectKw('ON', 'Después de JOIN tabla va ON, con la condición que une las tablas. Ej: ON v.id_producto = p.id', 'After JOIN table comes ON, with the condition that links the tables. E.g.: ON s.product_id = p.id');
      q.joins.push(Object.assign(ref, { type, on: parseExpr() }));
    }
    let lastClause = 1;
    const clause = (kw) => {
      const idx = CLAUSE_ORDER.indexOf(kw);
      if (idx < lastClause) fail(ORDER_MSG(), ORDER_MSG());
      lastClause = idx;
    };
    if (isKw(peek(), 'WHERE')) {
      clause('WHERE');
      next();
      q.where = parseExpr();
    }
    if (isKw(peek(), 'GROUP')) {
      clause('GROUP');
      next();
      expectKw('BY', 'Se escribe GROUP BY.', 'It is written GROUP BY.');
      q.groupBy.push(parseExpr());
      while (isOp(peek(), ',')) {
        next();
        q.groupBy.push(parseExpr());
      }
    }
    if (isKw(peek(), 'HAVING')) {
      clause('HAVING');
      next();
      q.having = parseExpr();
    }
    if (isKw(peek(), 'ORDER')) {
      clause('ORDER');
      next();
      expectKw('BY', 'Se escribe ORDER BY.', 'It is written ORDER BY.');
      for (;;) {
        const expr = parseExpr();
        let desc = false;
        if (isKw(peek(), 'DESC')) {
          next();
          desc = true;
        } else if (isKw(peek(), 'ASC')) next();
        q.orderBy.push({ expr, desc });
        if (!isOp(peek(), ',')) break;
        next();
      }
    }
    if (isKw(peek(), 'LIMIT')) {
      clause('LIMIT');
      next();
      const nTok = next();
      if (!nTok || nTok.t !== 'num') fail('LIMIT lleva un número: LIMIT 10.', 'LIMIT takes a number: LIMIT 10.');
      q.limit = Math.trunc(nTok.v);
      if (isKw(peek(), 'OFFSET')) {
        next();
        const o = next();
        if (!o || o.t !== 'num') fail('OFFSET lleva un número.', 'OFFSET takes a number.');
        q.offset = Math.trunc(o.v);
      }
    }
    if (peek()) {
      const tk = peek();
      if (isKw(tk, 'WHERE', 'GROUP', 'HAVING', 'ORDER', 'LIMIT', 'FROM')) fail(ORDER_MSG(), ORDER_MSG());
      fail(`No entiendo "${src.slice(tk.s).trim().slice(0, 30)}" en esa posición.`, `I don't understand "${src.slice(tk.s).trim().slice(0, 30)}" there.`);
    }
    return q;

    function parseTableRef() {
      const t = next();
      if (!t || t.t !== 'id') fail(`Después de FROM/JOIN va el nombre de una tabla (encontré "${text(t)}").`, `FROM/JOIN must be followed by a table name (found "${text(t)}").`);
      let alias = null;
      if (isKw(peek(), 'AS')) {
        next();
        alias = next().v;
      } else if (peek() && peek().t === 'id') alias = next().v;
      return { table: t.v, alias: alias || t.v };
    }

    // Expresiones (precedencia: OR < AND < NOT < comparación < || < + - < * / % < unario)
    function parseExpr() {
      return parseOr();
    }
    function parseOr() {
      let l = parseAnd();
      while (isKw(peek(), 'OR')) {
        next();
        l = { type: 'bin', op: 'OR', l, r: parseAnd() };
      }
      return l;
    }
    function parseAnd() {
      let l = parseNot();
      while (isKw(peek(), 'AND')) {
        next();
        l = { type: 'bin', op: 'AND', l, r: parseNot() };
      }
      return l;
    }
    function parseNot() {
      if (isKw(peek(), 'NOT')) {
        next();
        return { type: 'un', op: 'NOT', e: parseNot() };
      }
      return parseCmp();
    }
    function parseCmp() {
      const l = parseConcat();
      const tk = peek();
      if (isOp(tk, '=', '<>', '!=', '<', '>', '<=', '>=')) {
        next();
        return { type: 'bin', op: tk.v === '!=' ? '<>' : tk.v, l, r: parseConcat() };
      }
      let not = false;
      if (isKw(tk, 'NOT') && isKw(peek(1), 'LIKE', 'IN', 'BETWEEN')) {
        next();
        not = true;
      }
      if (isKw(peek(), 'LIKE')) {
        next();
        return { type: 'like', e: l, pat: parseConcat(), not };
      }
      if (isKw(peek(), 'IN')) {
        next();
        expectOp('(');
        const list = [parseExpr()];
        while (isOp(peek(), ',')) {
          next();
          list.push(parseExpr());
        }
        expectOp(')');
        return { type: 'in', e: l, list, not };
      }
      if (isKw(peek(), 'BETWEEN')) {
        next();
        const lo = parseConcat();
        expectKw('AND', 'BETWEEN se escribe: BETWEEN valor1 AND valor2.', 'BETWEEN is written: BETWEEN value1 AND value2.');
        return { type: 'between', e: l, lo, hi: parseConcat(), not };
      }
      if (isKw(peek(), 'IS')) {
        next();
        let n = false;
        if (isKw(peek(), 'NOT')) {
          next();
          n = true;
        }
        expectKw('NULL', 'Después de IS va NULL (o NOT NULL).', 'IS must be followed by NULL (or NOT NULL).');
        return { type: 'isnull', e: l, not: n };
      }
      return l;
    }
    function parseConcat() {
      let l = parseAdd();
      while (isOp(peek(), '||')) {
        next();
        l = { type: 'bin', op: '||', l, r: parseAdd() };
      }
      return l;
    }
    function parseAdd() {
      let l = parseMul();
      while (isOp(peek(), '+', '-')) {
        const op = next().v;
        l = { type: 'bin', op, l, r: parseMul() };
      }
      return l;
    }
    function parseMul() {
      let l = parseUnary();
      while (isOp(peek(), '*', '/', '%')) {
        const op = next().v;
        l = { type: 'bin', op, l, r: parseUnary() };
      }
      return l;
    }
    function parseUnary() {
      if (isOp(peek(), '-')) {
        next();
        return { type: 'un', op: '-', e: parseUnary() };
      }
      if (isOp(peek(), '+')) {
        next();
        return parseUnary();
      }
      return parsePrimary();
    }
    function parsePrimary() {
      const tk = next();
      if (!tk) fail('La consulta está incompleta.', 'The query is incomplete.');
      if (tk.t === 'num') return { type: 'lit', v: tk.v };
      if (tk.t === 'str') return { type: 'lit', v: tk.v };
      if (isKw(tk, 'NULL')) return { type: 'lit', v: null };
      if (isKw(tk, 'TRUE')) return { type: 'lit', v: 1 };
      if (isKw(tk, 'FALSE')) return { type: 'lit', v: 0 };
      if (isOp(tk, '(')) {
        if (isKw(peek(), 'SELECT')) fail('Las subconsultas no están disponibles en esta versión. Probá con JOIN o en dos pasos.', 'Subqueries are not available in this version. Try a JOIN or two steps.');
        const e = parseExpr();
        expectOp(')');
        return e;
      }
      if (isKw(tk, 'CASE')) {
        const whens = [];
        while (isKw(peek(), 'WHEN')) {
          next();
          const cond = parseExpr();
          expectKw('THEN', 'Cada WHEN lleva su THEN: CASE WHEN condición THEN valor … END.', 'Each WHEN needs a THEN: CASE WHEN condition THEN value … END.');
          whens.push({ cond, val: parseExpr() });
        }
        if (!whens.length) fail('CASE necesita al menos un WHEN.', 'CASE needs at least one WHEN.');
        let els = null;
        if (isKw(peek(), 'ELSE')) {
          next();
          els = parseExpr();
        }
        expectKw('END', 'Falta END al final del CASE.', 'END is missing at the end of CASE.');
        return { type: 'case', whens, els };
      }
      if (tk.t === 'id') {
        if (isOp(peek(), '(') && !tk.quoted) {
          next();
          const name = tk.v.toUpperCase();
          if (!AGG_FUNCS.has(name) && !SCALAR_FUNCS.has(name)) fail(`No conozco la función ${name}.`, `Unknown function ${name}.`);
          const node = { type: 'func', name, args: [], distinct: false, star: false };
          if (isOp(peek(), '*')) {
            if (name !== 'COUNT') fail(`${name}(*) no existe: el * solo va en COUNT(*).`, `${name}(*) does not exist: * only goes in COUNT(*).`);
            next();
            node.star = true;
          } else if (!isOp(peek(), ')')) {
            if (isKw(peek(), 'DISTINCT')) {
              next();
              node.distinct = true;
            }
            node.args.push(parseExpr());
            while (isOp(peek(), ',')) {
              next();
              node.args.push(parseExpr());
            }
          }
          expectOp(')');
          return node;
        }
        if (isOp(peek(), '.')) {
          next();
          const c = next();
          if (!c || c.t !== 'id') fail(`Después de "${tk.v}." va el nombre de una columna.`, `"${tk.v}." must be followed by a column name.`);
          return { type: 'col', table: tk.v, name: c.v, quoted: c.quoted };
        }
        return { type: 'col', table: null, name: tk.v, quoted: tk.quoted };
      }
      if (tk.t === 'kw') fail(`"${tk.v}" está en un lugar donde no corresponde. ${ORDER_MSG()}`, `"${tk.v}" is in the wrong place. ${ORDER_MSG()}`);
      fail(`No esperaba "${text(tk)}" en esa posición.`, `Did not expect "${text(tk)}" there.`);
    }
  }

  // ---------------------------------------------------------------------------
  // Evaluación
  // ---------------------------------------------------------------------------
  const isNull = (v) => v === null || v === undefined || v === '';
  function toNumber(v) {
    if (typeof v === 'number') return v;
    if (isNull(v)) return null;
    const n = Number(v);
    return isFinite(n) && String(v).trim() !== '' ? n : NaN;
  }
  function compare(a, b) {
    if (typeof a === 'number' && typeof b === 'number') return a < b ? -1 : a > b ? 1 : 0;
    if (typeof a === 'number' || typeof b === 'number') {
      const x = toNumber(a);
      const y = toNumber(b);
      if (!isNaN(x) && !isNaN(y) && x !== null && y !== null) return x < y ? -1 : x > y ? 1 : 0;
    }
    const x = String(a);
    const y = String(b);
    return x < y ? -1 : x > y ? 1 : 0;
  }
  function likeRegex(pat) {
    const body = String(pat)
      .split('')
      .map((c) => (c === '%' ? '.*' : c === '_' ? '.' : c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      .join('');
    return new RegExp('^' + body + '$', 'is');
  }
  const truthy = (v) => !isNull(v) && v !== 0 && v !== false;

  function hasAgg(e) {
    if (!e || typeof e !== 'object') return false;
    if (e.type === 'func' && AGG_FUNCS.has(e.name)) return true;
    return ['l', 'r', 'e', 'pat', 'lo', 'hi', 'els'].some((k) => hasAgg(e[k])) || (e.args || []).some(hasAgg) || (e.list || []).some(hasAgg) || (e.whens || []).some((w) => hasAgg(w.cond) || hasAgg(w.val));
  }
  function walk(e, fn) {
    if (!e || typeof e !== 'object') return;
    fn(e);
    ['l', 'r', 'e', 'pat', 'lo', 'hi', 'els'].forEach((k) => walk(e[k], fn));
    (e.args || []).forEach((a) => walk(a, fn));
    (e.list || []).forEach((a) => walk(a, fn));
    (e.whens || []).forEach((w) => {
      walk(w.cond, fn);
      walk(w.val, fn);
    });
  }
  const sameExpr = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  function editDistance(a, b) {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return dp[a.length][b.length];
  }
  function closest(name, options) {
    let best = null;
    let d = Infinity;
    for (const o of options) {
      const k = editDistance(lower(name), lower(o));
      if (k < d) {
        d = k;
        best = o;
      }
    }
    return d <= Math.max(2, Math.floor(name.length / 3)) ? best : null;
  }

  function execute(sql, tables) {
    const q = parse(sql);
    const tableNames = Object.keys(tables);
    const findTable = (name) => tableNames.find((t) => lower(t) === lower(name));
    // Fuentes (FROM + JOINs)
    const sources = [q.from, ...q.joins].map((ref) => {
      const real = findTable(ref.table);
      if (!real) {
        const sug = closest(ref.table, tableNames);
        fail(`No existe la tabla "${ref.table}".${sug ? ` ¿Quisiste decir ${sug}?` : ''} Tablas disponibles: ${tableNames.join(', ')}.`, `There is no table "${ref.table}".${sug ? ` Did you mean ${sug}?` : ''} Available tables: ${tableNames.join(', ')}.`);
      }
      return { alias: ref.alias, table: real, cols: tables[real].headers, data: tables[real].rows, ref };
    });
    const aliasSeen = new Set();
    for (const s of sources) {
      if (aliasSeen.has(lower(s.alias))) fail(`La tabla ${s.alias} aparece dos veces: poneles un alias distinto a cada una.`, `Table ${s.alias} appears twice: give each one a different alias.`);
      aliasSeen.add(lower(s.alias));
    }
    const selectAliases = q.columns.filter((c) => c.alias).map((c) => c.alias);
    q.columns.forEach((c) => {
      if (c.implicit && sources.some((s) => s.cols.some((col) => lower(col) === lower(c.alias)))) {
        fail(`¿Falta una coma? "${c.text} ${c.alias}" se lee como una columna llamada ${c.alias}. Separá las columnas con comas.`, `Missing a comma? "${c.text} ${c.alias}" reads as one column named ${c.alias}. Separate columns with commas.`);
      }
    });

    // Resolución de columnas: devuelve [índiceDeFuente, índiceDeColumna].
    function resolveCol(node, where) {
      if (node._res) return node._res;
      const candidates = [];
      const srcs = node.table ? sources.filter((s) => lower(s.alias) === lower(node.table) || lower(s.table) === lower(node.table)) : sources;
      if (node.table && !srcs.length) fail(`"${node.table}.${node.name}": no hay ninguna tabla llamada ${node.table} en el FROM/JOIN.`, `"${node.table}.${node.name}": there is no table called ${node.table} in FROM/JOIN.`);
      srcs.forEach((s) => {
        const si = sources.indexOf(s);
        s.cols.forEach((c, ci) => {
          if (lower(c) === lower(node.name)) candidates.push([si, ci]);
        });
      });
      if (candidates.length > 1) fail(`La columna "${node.name}" existe en más de una tabla: aclarala con tabla.columna (ej: ${sources[candidates[0][0]].alias}.${node.name}).`, `Column "${node.name}" exists in more than one table: qualify it as table.column (e.g. ${sources[candidates[0][0]].alias}.${node.name}).`);
      if (!candidates.length) {
        if (node.quoted === '"') fail(`No existe la columna "${node.name}". Si es un texto, va entre comillas simples: '${node.name}'.`, `There is no column "${node.name}". If it is a text value, use single quotes: '${node.name}'.`);
        if (where === 'where' && selectAliases.some((a) => lower(a) === lower(node.name))) fail(`"${node.name}" es un alias del SELECT y en WHERE todavía no existe. Repetí la expresión completa.`, `"${node.name}" is a SELECT alias and does not exist yet in WHERE. Repeat the full expression.`);
        const all = [...new Set(srcs.flatMap((s) => s.cols))];
        const sug = closest(node.name, all);
        fail(`No existe la columna "${node.name}".${sug ? ` ¿Quisiste decir ${sug}?` : ''} Columnas: ${all.join(', ')}.`, `There is no column "${node.name}".${sug ? ` Did you mean ${sug}?` : ''} Columns: ${all.join(', ')}.`);
      }
      node._res = candidates[0];
      return node._res;
    }

    // Evalúa una expresión sobre una fila combinada (row = array de filas, una por fuente).
    function evalRow(e, row, ctx) {
      switch (e.type) {
        case 'lit':
          return e.v;
        case 'col': {
          if (ctx && ctx.aliases && !e.table) {
            const k = ctx.aliases.findIndex((a) => a && lower(a) === lower(e.name));
            if (k >= 0) return ctx.out[k];
          }
          const [si, ci] = resolveCol(e, ctx && ctx.where);
          const r = row[si];
          return r ? (r[ci] === undefined ? null : r[ci]) : null;
        }
        case 'func':
          if (AGG_FUNCS.has(e.name)) {
            if (!ctx || !ctx.group) fail(`${e.name}() resume muchas filas y no se puede usar en WHERE. Para filtrar por un resumen usá HAVING después de GROUP BY.`, `${e.name}() summarizes many rows and cannot be used in WHERE. To filter on a summary use HAVING after GROUP BY.`);
            return aggregate(e, ctx.group);
          }
          return scalarFn(e, row, ctx);
        case 'un': {
          const v = evalRow(e.e, row, ctx);
          if (e.op === 'NOT') return isNull(v) ? null : truthy(v) ? 0 : 1;
          const n = toNumber(v);
          return n === null ? null : -n;
        }
        case 'bin': {
          if (e.op === 'AND') {
            const a = evalRow(e.l, row, ctx);
            if (!isNull(a) && !truthy(a)) return 0;
            const b = evalRow(e.r, row, ctx);
            if (!isNull(b) && !truthy(b)) return 0;
            return isNull(a) || isNull(b) ? null : 1;
          }
          if (e.op === 'OR') {
            const a = evalRow(e.l, row, ctx);
            if (truthy(a)) return 1;
            const b = evalRow(e.r, row, ctx);
            if (truthy(b)) return 1;
            return isNull(a) || isNull(b) ? null : 0;
          }
          const a = evalRow(e.l, row, ctx);
          const b = evalRow(e.r, row, ctx);
          if (e.op === '||') return isNull(a) || isNull(b) ? null : String(a) + String(b);
          if (isNull(a) || isNull(b)) return null;
          if (['=', '<>', '<', '>', '<=', '>='].includes(e.op)) {
            const c = compare(a, b);
            return { '=': c === 0, '<>': c !== 0, '<': c < 0, '>': c > 0, '<=': c <= 0, '>=': c >= 0 }[e.op] ? 1 : 0;
          }
          const x = toNumber(a);
          const y = toNumber(b);
          if (isNaN(x) || isNaN(y)) fail(`No se puede hacer "${e.op}" con textos.`, `Cannot apply "${e.op}" to text.`);
          if (e.op === '+') return x + y;
          if (e.op === '-') return x - y;
          if (e.op === '*') return x * y;
          if (e.op === '/') return y === 0 ? null : x / y;
          if (e.op === '%') return y === 0 ? null : x % y;
          return null;
        }
        case 'like': {
          const v = evalRow(e.e, row, ctx);
          const pat = evalRow(e.pat, row, ctx);
          if (isNull(v) || isNull(pat)) return null;
          const ok = likeRegex(pat).test(String(v));
          return (e.not ? !ok : ok) ? 1 : 0;
        }
        case 'in': {
          const v = evalRow(e.e, row, ctx);
          if (isNull(v)) return null;
          const ok = e.list.some((x) => {
            const w = evalRow(x, row, ctx);
            return !isNull(w) && compare(v, w) === 0;
          });
          return (e.not ? !ok : ok) ? 1 : 0;
        }
        case 'between': {
          const v = evalRow(e.e, row, ctx);
          const lo = evalRow(e.lo, row, ctx);
          const hi = evalRow(e.hi, row, ctx);
          if (isNull(v) || isNull(lo) || isNull(hi)) return null;
          const ok = compare(v, lo) >= 0 && compare(v, hi) <= 0;
          return (e.not ? !ok : ok) ? 1 : 0;
        }
        case 'isnull': {
          const n = isNull(evalRow(e.e, row, ctx));
          return (e.not ? !n : n) ? 1 : 0;
        }
        case 'case': {
          for (const w of e.whens) if (truthy(evalRow(w.cond, row, ctx))) return evalRow(w.val, row, ctx);
          return e.els ? evalRow(e.els, row, ctx) : null;
        }
        default:
          return null;
      }
    }

    function scalarFn(e, row, ctx) {
      const args = e.args.map((a) => evalRow(a, row, ctx));
      const need = (min, max) => {
        if (args.length < min || args.length > max) fail(`Cantidad de argumentos incorrecta en ${e.name}().`, `Wrong number of arguments in ${e.name}().`);
      };
      switch (e.name) {
        case 'ROUND': {
          need(1, 2);
          const x = toNumber(args[0]);
          if (x === null) return null;
          const d = args.length > 1 ? Math.trunc(toNumber(args[1]) || 0) : 0;
          const f = Math.pow(10, d);
          return Math.round(x * f + Math.sign(x) * 1e-9) / f;
        }
        case 'ABS':
          need(1, 1);
          return args[0] === null ? null : Math.abs(toNumber(args[0]));
        case 'UPPER':
          need(1, 1);
          return isNull(args[0]) ? null : String(args[0]).toUpperCase();
        case 'LOWER':
          need(1, 1);
          return isNull(args[0]) ? null : String(args[0]).toLowerCase();
        case 'LENGTH':
          need(1, 1);
          return isNull(args[0]) ? null : String(args[0]).length;
        case 'TRIM':
          need(1, 1);
          return isNull(args[0]) ? null : String(args[0]).trim();
        case 'SUBSTR':
        case 'SUBSTRING': {
          need(2, 3);
          if (isNull(args[0])) return null;
          const s = String(args[0]);
          const start = Math.max(1, Math.trunc(toNumber(args[1]) || 1));
          return args.length > 2 ? s.substr(start - 1, Math.trunc(toNumber(args[2]) || 0)) : s.slice(start - 1);
        }
        case 'REPLACE':
          need(3, 3);
          return isNull(args[0]) ? null : String(args[0]).split(String(args[1])).join(String(args[2]));
        case 'COALESCE':
        case 'IFNULL':
          if (e.name === 'IFNULL') need(2, 2);
          for (const a of args) if (!isNull(a)) return a;
          return null;
        default:
          return null;
      }
    }

    function aggregate(e, rows) {
      if (e.args.some(hasAgg)) fail('No se puede poner una función de resumen dentro de otra (ej: SUM(COUNT(...))).', 'An aggregate function cannot go inside another one (e.g. SUM(COUNT(...))).');
      if (e.name === 'COUNT' && e.star) return rows.length;
      if (e.args.length !== 1) fail(`${e.name}() lleva una sola columna o expresión.`, `${e.name}() takes a single column or expression.`);
      let vals = rows.map((r) => evalRow(e.args[0], r, null)).filter((v) => !isNull(v));
      if (e.distinct) {
        const seen = new Set();
        vals = vals.filter((v) => {
          const k = typeof v + ':' + String(v);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      }
      if (e.name === 'COUNT') return vals.length;
      if (e.name === 'MIN' || e.name === 'MAX') {
        if (!vals.length) return null;
        return vals.reduce((m, v) => ((e.name === 'MIN' ? compare(v, m) < 0 : compare(v, m) > 0) ? v : m));
      }
      const nums = vals.map(toNumber);
      if (nums.some((n) => isNaN(n))) fail(`${e.name}() necesita números y la columna tiene textos.`, `${e.name}() needs numbers and the column has text.`);
      if (!nums.length) return null;
      const sum = nums.reduce((a, b) => a + b, 0);
      return e.name === 'SUM' ? sum : sum / nums.length;
    }

    // Validar columnas aunque no haya filas.
    q.columns.forEach((c) => c.expr && walk(c.expr, (n) => n.type === 'col' && resolveColSafe(n)));
    [q.where, ...q.joins.map((j) => j.on), ...q.groupBy].forEach((x) => walk(x, (n) => n.type === 'col' && resolveCol(n, x === q.where ? 'where' : null)));
    function resolveColSafe(n) {
      resolveCol(n, null);
    }
    if (q.where && hasAgg(q.where)) fail('Las funciones como SUM o COUNT no van en WHERE. Para filtrar por un resumen usá HAVING después de GROUP BY.', 'Functions like SUM or COUNT do not go in WHERE. To filter on a summary use HAVING after GROUP BY.');
    q.columns.forEach((c) => {
      if (c.star && c.table && !sources.some((s) => lower(s.alias) === lower(c.table))) fail(`${c.table}.*: no hay ninguna tabla ${c.table} en el FROM.`, `${c.table}.*: there is no table ${c.table} in FROM.`);
    });

    // FROM + JOINs
    let rows = sources[0].data.map((r) => [r]);
    sources.slice(1).forEach((src, k) => {
      const join = q.joins[k];
      const out = [];
      for (const left of rows) {
        let matched = false;
        for (const r of src.data) {
          const combo = left.concat([r]);
          if (truthy(evalRow(join.on, combo, null))) {
            out.push(combo);
            matched = true;
          }
        }
        if (!matched && join.type === 'left') out.push(left.concat([null]));
      }
      rows = out;
    });
    if (q.where) rows = rows.filter((r) => truthy(evalRow(q.where, r, { where: 'where' })));

    // Columnas de salida
    const outCols = [];
    q.columns.forEach((c) => {
      if (c.star) {
        sources.forEach((s, si) => {
          if (c.table && lower(s.alias) !== lower(c.table)) return;
          s.cols.forEach((name, ci) => outCols.push({ name, expr: { type: 'col', _res: [si, ci], name } }));
        });
      } else outCols.push({ name: c.alias || (c.expr.type === 'col' ? c.expr.name : c.text), expr: c.expr, alias: c.alias });
    });
    const aliases = outCols.map((c) => c.alias || null);
    const grouped = q.groupBy.length > 0 || q.columns.some((c) => c.expr && hasAgg(c.expr)) || (q.having && true) || q.orderBy.some((o) => hasAgg(o.expr));

    let result = [];
    if (grouped) {
      if (q.columns.some((c) => c.star)) fail('Con GROUP BY o funciones de resumen no se puede usar *: elegí las columnas.', 'With GROUP BY or aggregate functions you cannot use *: choose the columns.');
      // Las columnas sueltas tienen que estar en el GROUP BY.
      const groupCols = q.groupBy.map((g) => (g.type === 'col' ? resolveCol(g).join(':') : null));
      const checkBare = (e, label) => {
        if (q.groupBy.some((g) => sameExpr(stripRes(g), stripRes(e)))) return;
        if (e.type === 'func' && AGG_FUNCS.has(e.name)) return;
        if (e.type === 'col') {
          if (selectAliases.some((a) => lower(a) === lower(e.name)) && label === 'order') return;
          const key = resolveCol(e).join(':');
          if (!groupCols.includes(key)) fail(`La columna "${e.name}" tiene que estar en el GROUP BY o dentro de una función como SUM o COUNT.`, `Column "${e.name}" must be in GROUP BY or inside a function like SUM or COUNT.`);
          return;
        }
        ['l', 'r', 'e', 'pat', 'lo', 'hi', 'els'].forEach((k) => e[k] && checkBare(e[k], label));
        (e.args || []).forEach((a) => checkBare(a, label));
        (e.list || []).forEach((a) => checkBare(a, label));
        (e.whens || []).forEach((w) => {
          checkBare(w.cond, label);
          checkBare(w.val, label);
        });
      };
      outCols.forEach((c) => checkBare(c.expr, 'select'));
      const groups = new Map();
      for (const r of rows) {
        const key = JSON.stringify(q.groupBy.map((g) => evalRow(g, r, null)));
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(r);
      }
      if (!q.groupBy.length && !groups.size) groups.set('[]', []);
      for (const g of groups.values()) {
        const first = g[0] || sources.map(() => null);
        const ctx = { group: g };
        const out = outCols.map((c) => evalRow(c.expr, first, ctx));
        const full = Object.assign({}, ctx, { aliases, out });
        if (q.having && !truthy(evalRow(q.having, first, full))) continue;
        result.push({ out, keys: q.orderBy.map((o) => orderValue(o, first, full)) });
      }
    } else {
      for (const r of rows) {
        const out = outCols.map((c) => evalRow(c.expr, r, null));
        result.push({ out, keys: q.orderBy.map((o) => orderValue(o, r, { aliases, out })) });
      }
    }
    function orderValue(o, row, ctx) {
      if (o.expr.type === 'lit' && typeof o.expr.v === 'number') {
        const k = Math.trunc(o.expr.v) - 1;
        if (k < 0 || k >= ctx.out.length) fail(`ORDER BY ${o.expr.v}: no hay una columna en esa posición.`, `ORDER BY ${o.expr.v}: there is no column at that position.`);
        return ctx.out[k];
      }
      return evalRow(o.expr, row, ctx);
    }
    function stripRes(e) {
      return JSON.parse(JSON.stringify(e, (k, v) => (k === '_res' || k === 'quoted' ? undefined : v)));
    }

    if (q.distinct) {
      const seen = new Set();
      result = result.filter((r) => {
        const k = JSON.stringify(r.out);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }
    if (q.orderBy.length) {
      result.sort((a, b) => {
        for (let i = 0; i < q.orderBy.length; i++) {
          const x = a.keys[i];
          const y = b.keys[i];
          let c;
          if (isNull(x) && isNull(y)) c = 0;
          else if (isNull(x)) c = -1;
          else if (isNull(y)) c = 1;
          else c = compare(x, y);
          if (c) return q.orderBy[i].desc ? -c : c;
        }
        return 0;
      });
    }
    let outRows = result.map((r) => r.out);
    if (q.offset) outRows = outRows.slice(q.offset);
    if (q.limit !== null) outRows = outRows.slice(0, q.limit);

    // Pista amable: 0 filas por una diferencia de mayúsculas en un texto del WHERE.
    const notes = [];
    if (!outRows.length && q.where) {
      walk(q.where, (n) => {
        if (n.type === 'lit' && typeof n.v === 'string' && !/[%_]/.test(n.v)) {
          for (const s of sources) {
            for (const r of s.data) {
              const hit = r.find((v) => typeof v === 'string' && v !== n.v && v.toLowerCase() === n.v.toLowerCase());
              if (hit) {
                if (!notes.length) notes.push(T(`0 filas. Ojo: '${n.v}' no es igual a '${hit}' (mayúsculas y minúsculas importan).`, `0 rows. Careful: '${n.v}' is not the same as '${hit}' (case matters).`));
                return;
              }
            }
          }
        }
      });
    }
    return { columns: outCols.map((c) => c.name), rows: outRows, notes, query: q };
  }

  // ---------------------------------------------------------------------------
  // Comparar resultados (para validar objetivos)
  // ---------------------------------------------------------------------------
  const normCell = (v) => {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return v;
    return String(v)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();
  };
  function cellEq(a, b, tol) {
    const x = normCell(a);
    const y = normCell(b);
    if (x === null || y === null) return x === y;
    if (typeof x === 'number' || typeof y === 'number') {
      const p = toNumber(x);
      const q = toNumber(y);
      if (p === null || q === null || isNaN(p) || isNaN(q)) return false;
      return Math.abs(p - q) <= Math.max(tol, Math.abs(q) * 1e-9);
    }
    return x === y;
  }
  const rowKey = (r) => JSON.stringify(r.map((v) => (typeof normCell(v) === 'number' ? Math.round(normCell(v) * 100) / 100 : normCell(v))));

  // expected = { rows: [[...]], ordered?: bool, tol?: número }  → true | nota
  function sameResult(res, expected) {
    const tol = expected.tol === undefined ? 0.01 : expected.tol;
    const want = expected.rows;
    const width = want.length ? want[0].length : expected.width || 0;
    if (want.length && res.columns.length !== width) {
      return T(`Tu consulta devuelve ${res.columns.length} columna(s) y el pedido necesita ${width}. Revisá el SELECT.`, `Your query returns ${res.columns.length} column(s) and the request needs ${width}. Check the SELECT.`);
    }
    if (res.rows.length !== want.length) {
      return T(`Tu consulta devuelve ${res.rows.length} fila(s) y el pedido necesita ${want.length}. Revisá el WHERE, el GROUP BY o el LIMIT.`, `Your query returns ${res.rows.length} row(s) and the request needs ${want.length}. Check WHERE, GROUP BY or LIMIT.`);
    }
    let a = res.rows;
    let b = want;
    if (!expected.ordered) {
      a = [...a].sort((x, y) => (rowKey(x) < rowKey(y) ? -1 : 1));
      b = [...b].sort((x, y) => (rowKey(x) < rowKey(y) ? -1 : 1));
    }
    const ok = a.every((r, i) => r.every((v, j) => cellEq(v, b[i][j], tol)));
    if (ok) return true;
    if (expected.ordered) {
      const sa = [...res.rows].sort((x, y) => (rowKey(x) < rowKey(y) ? -1 : 1));
      const sb = [...want].sort((x, y) => (rowKey(x) < rowKey(y) ? -1 : 1));
      if (sa.every((r, i) => r.every((v, j) => cellEq(v, sb[i][j], tol)))) return T('Los datos están bien pero el orden no: revisá el ORDER BY.', 'The data is right but the order is not: check ORDER BY.');
    }
    return T('La cantidad de filas y columnas es correcta, pero los valores no coinciden. Revisá condiciones y cálculos.', 'The number of rows and columns is right, but the values do not match. Check conditions and calculations.');
  }

  // Cláusulas que usa una consulta (para exigir el concepto que se está enseñando).
  function uses(sql, what) {
    let q;
    try {
      q = parse(sql);
    } catch (e) {
      return false;
    }
    switch (what) {
      case 'WHERE':
        return !!q.where;
      case 'GROUP BY':
        return q.groupBy.length > 0;
      case 'ORDER BY':
        return q.orderBy.length > 0;
      case 'LIMIT':
        return q.limit !== null;
      case 'JOIN':
        return q.joins.length > 0;
      case 'LEFT JOIN':
        return q.joins.some((j) => j.type === 'left');
      case 'HAVING':
        return !!q.having;
      case 'DISTINCT':
        return q.distinct;
      case 'CASE': {
        let found = false;
        q.columns.forEach((c) => walk(c.expr, (n) => n.type === 'case' && (found = true)));
        return found;
      }
      default: {
        // Una función: COUNT, SUM, AVG…
        let found = false;
        const all = [q.where, q.having, ...q.columns.map((c) => c.expr), ...q.orderBy.map((o) => o.expr)];
        all.forEach((x) => walk(x, (n) => n.type === 'func' && n.name === what && (found = true)));
        return found;
      }
    }
  }

  AA.SQL = { tokenize, parse, execute, sameResult, uses, SqlError, KEYWORDS };
})();
