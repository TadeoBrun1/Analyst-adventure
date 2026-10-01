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
    if (F.isErr(val)) return `${ref} muestra ${val.code}: ${val.detail}`;
    if (!matches(val, expected, opts)) return opts.wrongNote || `${ref} tiene un valor, pero no es el esperado.`;
    if (opts.formula !== false && !S.isF(ref)) return `${ref} tiene el valor correcto, pero escrito a mano. Usá una fórmula para que se actualice sola.`;
    const info = S.info(ref);
    if (opts.uses && !usesAny(info.funcs, opts.uses)) return `${ref} da bien, pero esta vez usá la función ${opts.uses[0]}.`;
    if (opts.refs) {
      const missing = opts.refs.filter((r) => !info.refs.has(r));
      if (missing.length) return `${ref} debería calcularse a partir de ${opts.refs.join(' y ')}, no con números fijos.`;
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
        return norm(S.v(ref)) === norm(expected) ? true : `${ref} dice "${F.toText(S.v(ref))}". Tiene que decir "${expected}".`;
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
          return `${ok} de ${total} correctas. ${firstNote} ¿Copiaste la fórmula sin fijar el rango con $? (F4)`;
        }
        return `${ok} de ${total} correctas.` + (firstNote ? ' ' + firstNote : '');
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
          const res = checkCell(S, ref, exp, opts);
          if (res === true) ok++;
          else if (!firstNote && typeof res === 'string') firstNote = res;
        }
        if (ok === list.length) return true;
        if (!anyFilled) return false;
        return `${ok} de ${list.length} correctas.` + (firstNote ? ' ' + firstNote : '');
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
