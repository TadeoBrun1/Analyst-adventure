/*
 * Analyst Adventure — Registro de misiones y armado de la hoja inicial de cada una.
 *
 * Formato de una misión:
 *   id, stage, xp, dept, from (personaje), subject, file, email (HTML; {name} = jugador)
 *   sheet: { cols, rows, colWidths, data: { at, rows }, cells, locked, header, labels,
 *            targets, formats, showSpaces, start }
 *   objectives: [{ text, hint, check(S) } | { text, hint, answer(texto), placeholder }]
 *   tips, teaches (funciones que se suman al manual), feedback
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const F = AA.Formula;

  const Missions = {
    list: [],
    upcoming: [],
    add(...missions) {
      this.list.push(...missions);
    },
    byId(id) {
      return this.list.find((m) => m.id === id) || null;
    },
    // Hoja con los datos originales de la misión.
    buildSheet(def) {
      const sh = new AA.Sheet(def.cols, def.rows);
      const at = F.parseRef(def.data.at);
      def.data.rows.forEach((row, i) => row.forEach((v, j) => sh.setValue(at.col + j, at.row + i, v, true)));
      for (const [ref, v] of Object.entries(def.cells || {})) {
        const p = F.parseRef(ref);
        sh.setValue(p.col, p.row, v, true);
      }
      return sh;
    },
  };

  AA.Missions = Missions;
})();
