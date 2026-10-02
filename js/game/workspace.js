/*
 * Analyst Adventure — Espacio de trabajo de una misión.
 * Una misión puede traer varias herramientas a la vez: hojas de cálculo (una o varias),
 * tabla dinámica, gráfico, dashboard, consola SQL e informe. Este módulo arma el libro de
 * hojas, decide qué pestañas mostrar y construye el estado `S` que reciben los validadores.
 * Lo usan la pantalla de misión y los tests (que resuelven cada misión con su solución).
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const F = AA.Formula;
  const T = (es, en) => AA.T(es, en);

  // Hoja de solo lectura con una tabla de datos (para gráficos, tablas dinámicas y dashboards).
  function dataSheet(table) {
    const cols = table.headers.length;
    const last = table.rows.length + 1;
    const width = Math.max(cols, 6);
    return {
      cols: width,
      rows: last + 3,
      colWidths: table.headers.map((h, i) => (typeof table.rows[0][i] === 'number' ? 110 : 150)),
      data: { at: 'A1', rows: [table.headers, ...table.rows] },
      locked: [`A1:${F.indexToCol(width - 1)}${last + 3}`],
      header: [`A1:${F.indexToCol(cols - 1)}1`],
      readonly: true,
    };
  }

  const toolTable = (m) => (m.chart && m.chart.table) || (m.pivot && m.pivot.table) || (m.dashboard && m.dashboard.table) || null;

  const Workspace = {
    dataSheet,

    // Hojas del libro: [{ name, def }]. La primera es la hoja de trabajo.
    sheetDefs(m) {
      if (m.sheets) return m.sheets.map((d) => ({ name: d.name, def: d }));
      if (m.sheet) return [{ name: m.sheet.name || T('Hoja1', 'Sheet1'), def: m.sheet }];
      const table = toolTable(m);
      if (table) return [{ name: T('Datos', 'Data'), def: dataSheet(table) }];
      return [];
    },

    buildBook(m) {
      const book = new AA.Workbook();
      for (const d of this.sheetDefs(m)) book.add(d.name, AA.Content.buildSheet(d.def));
      return book;
    },

    // Pestañas de la misión, en orden. 'sheets' es la planilla (o los datos de solo lectura).
    views(m) {
      const tools = [];
      if (m.sql) tools.push({ id: 'sql', label: '🗄️ SQL' });
      if (m.pivot) tools.push({ id: 'pivot', label: T('🧮 Tabla dinámica', '🧮 Pivot table') });
      if (m.chart) tools.push({ id: 'chart', label: T('📊 Gráfico', '📊 Chart') });
      if (m.dashboard) tools.push({ id: 'dashboard', label: '📈 Dashboard' });
      const defs = this.sheetDefs(m);
      const readonly = defs.length && defs.every((d) => d.def.readonly);
      const sheets = defs.length ? [{ id: 'sheets', label: readonly ? T('📋 Datos', '📋 Data') : T('📋 Planilla', '📋 Spreadsheet') }] : [];
      const report = m.report ? [{ id: 'report', label: m.report.kind === 'exec' ? T('📝 Resumen ejecutivo', '📝 Executive summary') : T('📝 Informe', '📝 Report') }] : [];
      // Con planilla editable, se empieza por la planilla; si es solo de datos, va al final.
      return readonly ? [...tools, ...sheets, ...report] : [...sheets, ...tools, ...report];
    },

    // Estado inicial de las herramientas.
    emptyParts(m) {
      return {
        chart: m.chart ? AA.Chart.emptySpec() : null,
        pivot: m.pivot ? AA.Pivot.emptySpec() : null,
        dash: m.dashboard ? JSON.parse(JSON.stringify(m.dashboard.initial || AA.Dash.emptySpec())) : null,
        sql: [],
        report: {},
        flags: [],
      };
    },

    // Ejecuta las consultas guardadas (se guardan solo los textos).
    runSql(m, queries) {
      if (!m.sql) return [];
      return queries.map((q) => {
        try {
          return { q, res: AA.SQL.execute(q, m.sql.tables) };
        } catch (e) {
          return { q, res: null, error: e.message };
        }
      });
    },

    // Estado que reciben los check(S) de los objetivos.
    state(m, book, parts, sqlRuns) {
      const main = book.sheets[0] || new AA.Sheet(1, 1);
      const S = AA.V.query(main);
      S.book = book;
      S.sheetQ = (name) => AA.V.query(book.get(name));
      S.flags = new Set(parts.flags || []);
      if (m.chart) {
        S.spec = parts.chart;
        S.table = m.chart.table;
      }
      if (m.pivot) S.pivot = { spec: parts.pivot, table: m.pivot.table };
      if (m.dashboard) S.dash = { spec: parts.dash, table: m.dashboard.table };
      if (m.sql) S.sql = { runs: sqlRuns || this.runSql(m, parts.sql || []) };
      if (m.report) S.report = { choices: parts.report || {} };
      return S;
    },

    // Escrituras de una solución de referencia: [[nombreDeHoja | null, 'B2', '=fórmula'], ...]
    solutionWrites(sol) {
      const out = [];
      const add = (sheet, part) => {
        for (const [col, r1, r2, f] of part.fill || []) for (let r = r1; r <= r2; r++) out.push([sheet, col + r, F.shiftFormula(f, 0, r - r1)]);
        for (const [row, c1, c2, f] of part.fillRight || []) {
          const a = F.colToIndex(c1);
          const b = F.colToIndex(c2);
          for (let c = a; c <= b; c++) out.push([sheet, F.indexToCol(c) + row, F.shiftFormula(f, c - a, 0)]);
        }
        for (const [c1, c2, r1, r2, f] of part.fillBlock || []) {
          const a = F.colToIndex(c1);
          const b = F.colToIndex(c2);
          for (let c = a; c <= b; c++) for (let r = r1; r <= r2; r++) out.push([sheet, F.indexToCol(c) + r, F.shiftFormula(f, c - a, r - r1)]);
        }
        for (const [ref, f] of Object.entries(part.cells || {})) out.push([sheet, ref, f]);
      };
      add(null, sol);
      for (const [name, part] of Object.entries(sol.sheets || {})) add(name, part);
      return out;
    },

    // Aplica la solución de referencia: devuelve { book, parts, S }.
    solve(m) {
      const book = this.buildBook(m);
      const sol = m.solution || {};
      for (const [name, ref, f] of this.solutionWrites(sol)) {
        const sh = name ? book.get(name) : book.sheets[0];
        const p = F.parseRef(ref);
        sh.setInput(p.col, p.row, f, true);
      }
      const parts = this.emptyParts(m);
      if (sol.chart) parts.chart = sol.chart;
      if (sol.pivot) parts.pivot = sol.pivot;
      if (sol.dashboard) parts.dash = sol.dashboard;
      if (sol.sql) parts.sql = sol.sql;
      if (sol.report) parts.report = sol.report;
      if (sol.flags) parts.flags = sol.flags;
      return { book, parts, S: this.state(m, book, parts) };
    },
  };

  AA.Workspace = Workspace;
})();
