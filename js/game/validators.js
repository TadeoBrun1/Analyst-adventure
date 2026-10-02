/*
 * Analyst Adventure — Validadores de objetivos.
 * Cada objetivo tiene un check(S) que devuelve:
 *   true            → cumplido
 *   false           → pendiente
 *   "texto"         → pendiente, con una nota de ayuda para el jugador
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const F = AA.Formula;

  function norm(v) {
    return F.toText(v)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Consultas sobre la hoja que usan los validadores.
  function query(sheet) {
    return {
      sheet,
      v: (ref) => sheet.val(ref),
      input: (ref) => sheet.input(ref),
      isF: (ref) => sheet.input(ref)[0] === '=',
      empty: (ref) => sheet.input(ref) === '',
      info: (ref) => F.analyze(sheet.input(ref)),
      text: (ref) => norm(sheet.val(ref)),
    };
  }

  function matches(val, expected, opts) {
    if (typeof expected === 'function') return expected(val);
    if (typeof expected === 'number') {
      const tol = opts && opts.tol !== undefined ? opts.tol : 0.01;
      return typeof val === 'number' && Math.abs(val - expected) <= tol;
    }
    if (opts && opts.exact) return F.toText(val) === String(expected);
    return norm(val) === norm(expected);
  }

  function usesAny(funcs, names) {
    return names.some((n) => funcs.has(F.canonicalName(n) || n));
  }

  // Verifica una celda calculada con fórmula.
  function checkCell(S, ref, expected, opts) {
    opts = opts || {};
    if (S.empty(ref)) return false;
    const val = S.v(ref);
    if (F.isErr(val)) return AA.T(`${ref} muestra ${val.code}: ${val.detail}`, `${ref} shows ${val.code}: ${val.detail}`);
    if (!matches(val, expected, opts)) return opts.wrongNote || AA.T(`${ref} tiene un valor, pero no es el esperado.`, `${ref} has a value, but not the expected one.`);
    if (opts.formula !== false && !S.isF(ref)) {
      return AA.T(`${ref} tiene el valor correcto, pero escrito a mano. Usá una fórmula para que se actualice sola.`, `${ref} has the right value, but typed by hand. Use a formula so it updates by itself.`);
    }
    const info = S.info(ref);
    if (opts.uses && !usesAny(info.funcs, opts.uses)) {
      return AA.T(`${ref} da bien, pero esta vez usá la función ${AA.fnName(opts.uses[0])}.`, `${ref} is right, but this time use the ${AA.fnName(opts.uses[0])} function.`);
    }
    if (opts.refs) {
      // Una celda cuenta como usada si aparece sola (C2) o dentro de un rango (C2:D2, C:C).
      const covered = (ref) => {
        if (info.refs.has(ref)) return true;
        const p = F.parseRef(ref);
        return info.ranges.some((g) => p.col >= g.c1 && p.col <= g.c2 && p.row >= g.r1 && (g.r2 === null || p.row <= g.r2));
      };
      const missing = opts.refs.filter((r) => !covered(r));
      if (missing.length) {
        return AA.T(`${ref} debería calcularse a partir de ${opts.refs.join(' y ')}, no con números fijos.`, `${ref} should be calculated from ${opts.refs.join(' and ')}, not with fixed numbers.`);
      }
    }
    if (opts.absRows) {
      // Celdas que tienen que estar fijadas con $ (al menos la fila) para poder copiar la fórmula.
      const fixed = new Set();
      try {
        for (const t of F.tokenize(S.input(ref).slice(1))) if (t.t === 'ref' && t.absR) fixed.add(F.makeRef(t.col, t.row));
      } catch (e) {
        /* fórmula inválida: ya la reporta el valor */
      }
      const loose = opts.absRows.filter((r) => !fixed.has(r));
      if (loose.length) {
        return AA.T(
          `${ref} da bien, pero fijá ${loose.join(', ')} con $ (F4) para que no se corra al copiar.`,
          `${ref} is right, but lock ${loose.join(', ')} with $ (F4) so it doesn't shift when copied.`
        );
      }
    }
    return true;
  }

  const V = {
    norm,
    query,
    checkCell,

    // Texto literal escrito en una celda.
    text(ref, expected) {
      return (S) => {
        if (S.empty(ref)) return false;
        return norm(S.v(ref)) === norm(expected)
          ? true
          : AA.T(`${ref} dice "${F.toText(S.v(ref))}". Tiene que decir "${expected}".`, `${ref} says "${F.toText(S.v(ref))}". It should say "${expected}".`);
      };
    },

    cell(ref, expected, opts) {
      return (S) => checkCell(S, ref, expected, opts);
    },

    // Una columna de fórmulas, fila por fila. expectedFn(fila1based, S) → valor esperado.
    column(col, r1, r2, expectedFn, opts) {
      opts = opts || {};
      return (S) => {
        let ok = 0;
        let firstNote = null;
        let anyFilled = false;
        const total = r2 - r1 + 1;
        for (let r = r1; r <= r2; r++) {
          const ref = col + r;
          if (!S.empty(ref)) anyFilled = true;
          const extra = opts.refsFn ? Object.assign({}, opts, { refs: opts.refsFn(r) }) : opts;
          const res = checkCell(S, ref, expectedFn(r, S), extra);
          if (res === true) ok++;
          else if (!firstNote && typeof res === 'string') firstNote = res;
        }
        if (ok === total) return true;
        if (!anyFilled) return false;
        if (ok > 0 && opts.dollarHint && firstNote) {
          return AA.T(`${ok} de ${total} correctas. ${firstNote} ¿Copiaste la fórmula sin fijar el rango con $? (F4)`, `${ok} of ${total} correct. ${firstNote} Did you copy the formula without locking the range with $? (F4)`);
        }
        return AA.T(`${ok} de ${total} correctas.`, `${ok} of ${total} correct.`) + (firstNote ? ' ' + firstNote : '');
      };
    },

    // Varias celdas sueltas, cada una con su valor esperado: [[ref, valor], ...]
    cells(list, opts) {
      return (S) => {
        let ok = 0;
        let firstNote = null;
        let anyFilled = false;
        for (const [ref, exp] of list) {
          if (!S.empty(ref)) anyFilled = true;
          const cellOpts = opts && opts.usesByRef ? Object.assign({}, opts, { uses: opts.usesByRef[ref] }) : opts;
          const res = checkCell(S, ref, exp, cellOpts);
          if (res === true) ok++;
          else if (!firstNote && typeof res === 'string') firstNote = res;
        }
        if (ok === list.length) return true;
        if (!anyFilled) return false;
        return AA.T(`${ok} de ${list.length} correctas.`, `${ok} of ${list.length} correct.`) + (firstNote ? ' ' + firstNote : '');
      };
    },

    // Valor lógico: acepta VERDADERO/FALSO o textos como Sí/No, OK/Revisar.
    bool(expected) {
      const YES = ['verdadero', 'true', 'si', 'sí', 'yes', 'ok', 'valido', 'válido', 'valid'];
      const NO = ['falso', 'false', 'no', 'revisar', 'invalido', 'inválido', 'invalid', 'review'];
      return (val) => {
        if (typeof val === 'boolean') return val === expected;
        const t = norm(val);
        return expected ? YES.map(norm).includes(t) : NO.map(norm).includes(t);
      };
    },

    // Resultado de una consulta SQL. expected = { rows, ordered }. opts.requires: cláusulas que
    // tiene que usar (WHERE, GROUP BY, JOIN…) para practicar el concepto del pedido.
    // Basta con que ALGUNA consulta ejecutada lo cumpla; las notas salen de la última.
    sql(expected, opts) {
      opts = opts || {};
      const req = opts.requires || [];
      const fn = (S) => {
        const runs = (S.sql && S.sql.runs) || [];
        const okRun = (r) => r.res && AA.SQL.sameResult(r.res, expected) === true && req.every((k) => AA.SQL.uses(r.q, k));
        if (runs.some(okRun)) return true;
        const last = runs[runs.length - 1];
        if (!last || !last.res) return false;
        const same = AA.SQL.sameResult(last.res, expected);
        if (same !== true) return same;
        const missing = req.filter((k) => !AA.SQL.uses(last.q, k));
        return AA.T(`El resultado está bien, pero este pedido es para practicar ${missing.join(' y ')}: usalo en la consulta.`, `The result is right, but this request is to practice ${missing.join(' and ')}: use it in the query.`);
      };
      fn.sequential = true;
      return fn;
    },

    // Celdas marcadas como error al revisar el trabajo de otra persona.
    flags(expected) {
      const want = new Set(expected);
      return (S) => {
        const got = S.flags || new Set();
        if (!got.size) return false;
        const found = [...want].filter((r) => got.has(r)).length;
        const extra = [...got].filter((r) => !want.has(r)).length;
        if (found === want.size && !extra) return true;
        const parts = [];
        parts.push(AA.T(`Encontraste ${found} de ${want.size} errores.`, `You found ${found} of ${want.size} errors.`));
        if (extra) parts.push(AA.T(`${extra} de las celdas marcadas están bien: desmarcalas.`, `${extra} of the flagged cells are fine: unflag them.`));
        return parts.join(' ');
      };
    },

    // Respuesta escrita por el jugador (preguntas de "detective").
    answerNumber(expected, tol) {
      const t = tol === undefined ? 0.01 : tol;
      return (answer) => {
        const raw = String(answer || '').replace(/[$\s]/g, '');
        if (!raw) return false;
        const candidates = [raw.replace(/,/g, ''), raw.replace(/\./g, '').replace(',', '.')];
        return candidates.some((c) => {
          const n = Number(c);
          return isFinite(n) && Math.abs(n - expected) <= t;
        });
      };
    },
    answerText(accepted) {
      const list = accepted.map(norm);
      return (answer) => {
        const a = norm(answer);
        if (!a) return false;
        return list.some((x) => a === x || (x.length > 3 && a.includes(x)));
      };
    },
  };

  AA.V = V;
})();
