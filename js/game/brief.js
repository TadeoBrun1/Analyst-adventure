/*
 * Analyst Adventure — Pedidos "sin guía" (práctica libre, favores y ARCADE).
 * En las tareas obligatorias el panel izquierdo explica paso a paso qué hacer. En las demás,
 * como en un trabajo real, solo se ve el pedido: QUÉ hay que entregar y DÓNDE, pero no CÓMO
 * (sin nombres de funciones, fórmulas de ejemplo ni instrucciones de procedimiento).
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});

  let FN_RE = null;
  // Nombres de todas las funciones (español e inglés), para reconocer "con SUMAR.SI", "(MAX y MIN)", etc.
  function fnPattern() {
    if (FN_RE) return FN_RE;
    const names = new Set();
    for (const d of AA.Formula.functionList()) [d.name].concat(d.aliases || []).forEach((n) => names.add(n.toUpperCase()));
    const list = [...names].sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    FN_RE = `(?:<b>|<code>)?(?:${list.join('|')})(?:</b>|</code>)?(?![A-Za-zÁÉÍÓÚÑáéíóúñ(]|\\.[A-Za-z])`;
    return FN_RE;
  }

  // Saca las pistas de "cómo" de un texto (deja el "qué").
  function howFree(html) {
    if (!html) return html;
    const FN = fnPattern();
    let s = String(html);
    // Fórmulas de ejemplo: "con una fórmula: =C2*D2", ": =C2*21%", "con =SUMA(C2:E2)"
    s = s.replace(/\s*(?:con una fórmula|with a formula|con|with|usando|using)?\s*:?\s*<code>\s*=[^<]*<\/code>/gi, '');
    s = s.replace(/:\s*=[A-Z0-9$(),.:;+\-*/%\s]+(?=[.(]|$)/g, '');
    // Sentencias de procedimiento.
    s = s.replace(/\s*(?:Usá|Use|Fijá|Lock|Escribila|Write it)(?=\s)[^.]*\.(?=\s|$|<)/g, '');
    // "BUSCARV no sirve: …" / "VLOOKUP won't work: …"
    s = s.replace(new RegExp(`\\s*${FN}\\s+(?:no sirve|won't work|doesn't work|does not work)[^.]*\\.`, 'g'), '');
        // "con ESPACIOS y NOMPROPIO", "with SUMIF", "con BUSCARV aproximado"
    const JOIN = '(?:\\s*(?:,|y|o|and|or)\\s*)';
    s = s.replace(new RegExp(`\\s+(?:con|usando|with|using)\\s+${FN}(?:${JOIN}${FN})*(?:\\s+(?:aproximado|exacto|approximate|exact))?`, 'g'), '');
    // "with an approximate VLOOKUP"
    s = s.replace(new RegExp(`,?\\s+(?:with|using)\\s+an?\\s+(?:approximate|exact)\\s+${FN}`, 'g'), '');
        // "(MAX y MIN)", "(CONTAR)", "(CONTARA de los nombres)", "(COUNTA over the names)"
    s = s.replace(new RegExp(`\\s*\\(\\s*${FN}[^)]*\\)`, 'g'), '');
    // "Copiá la fórmula hacia abajo hasta E19." → qué tiene que quedar completo
    s = s.replace(/Copiá la fórmula(?: hacia abajo)? hasta (?:<b>)?([A-Z]+\d+)(?:<\/b>)?\.?/g, 'Que la columna quede completa hasta <b>$1</b>.');
    s = s.replace(/Copy the formula(?: down)? to (?:<b>)?([A-Z]+\d+)(?:<\/b>)?\.?/g, 'The column must be complete down to <b>$1</b>.');
    // Lo que quede escrito como nombre de función se usa como palabra común: "la SUMA" → "la suma".
    s = s.replace(new RegExp(`(^|[\\s(/,])(${FN})(?=[\\s.,;:)/]|$)`, 'g'), (all, pre, fn) => (fn.length > 2 && !/["«]/.test(pre) && !/^(?:<[^>]+>)?(VERDADERO|FALSO|TRUE|FALSE)/.test(fn) ? pre + fn.replace(/<[^>]+>/g, '').toLowerCase() : all));
        s = s.replace(/\s{2,}/g, ' ').replace(/\s+([.,;:])/g, '$1').replace(/,\s*\./g, '.').replace(/:\s*\.$/, '.').trim();
    return s;
  }

  const plain = (h) => String(h || '').replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').trim();

  // Encabezado de la columna de una celda (fila 1 de la hoja, o lo que escriba la solución).
  function headerOf(mission, book, ref) {
    const F = AA.Formula;
    const p = F.parseRef(ref);
    if (!p || !book) return null;
    const sheet = book.sheets[0];
    const v = sheet && sheet.getValue(p.col, 0);
    if (typeof v === 'string' && v.trim()) return v.trim();
    const sol = (mission.solution && mission.solution.cells) || {};
    const h = sol[F.makeRef(p.col, 0)];
    return typeof h === 'string' && !h.startsWith('=') ? h : null;
  }

  // Lista de entregables (sin pasos) a partir de los objetivos que se verifican solos.
  function deliverables(mission, book) {
    const L = (x) => AA.L(x);
    const out = [];
    for (const o of mission.objectives) {
      if (o.answer || o.choices) continue;
      const raw = L(o.text);
      let s = howFree(raw);
      // Si casi no queda texto ("En F2:"), se describe por la celda: «Stock final» en F2:F19.
      const words = plain(s).split(/\s+/).filter((w) => /[\p{L}]/u.test(w) && !/^\(?[A-Z]{1,2}\d/.test(w));
      if (words.length < 2 || /:$/.test(plain(s))) {
        const refs = plain(raw).match(/\b[A-Z]{1,2}\d{1,3}(?::[A-Z]{1,2}\d{1,3})?\b/g) || [];
        const ref = refs[0];
        const h = ref && headerOf(mission, book, ref.split(':')[0]);
        const tail = ref && ref.includes(':') ? '' : AA.T(' (y el resto de la columna)', ' (and the rest of the column)');
        s = h ? AA.T(`<b>${AA.escapeHtml(h)}</b> en ${ref}`, `<b>${AA.escapeHtml(h)}</b> in ${ref}`) + tail : s;
      }
      if (plain(s)) out.push(s);
    }
    // Sin repetidos
    return out.filter((x, i) => out.indexOf(x) === i);
  }

  AA.Brief = { howFree, deliverables, plain };
})();
