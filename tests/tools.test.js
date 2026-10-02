/* Tests de las herramientas: tabla dinámica, SQL, dashboards e informes. Ejecutar con: node tests/tools.test.js */
'use strict';
require('../js/engine/formula.js');
require('../js/engine/sheet.js');
require('../js/i18n/i18n.js');
require('../js/charts/chart-model.js');
require('../js/tools/pivot.js');
require('../js/tools/sql.js');
require('../js/tools/dashboard.js');
require('../js/tools/report.js');

const AA = globalThis.AA;
const Pv = AA.Pivot;
const SQL = AA.SQL;
const D = AA.Dash;
const Ch = AA.Chart;
let passed = 0;
let failed = 0;
function eq(a, b, label) {
  const ok = JSON.stringify(a) === JSON.stringify(b);
  if (ok) passed++;
  else {
    failed++;
    console.error(`✗ ${label}: esperado ${JSON.stringify(b)}, obtuve ${JSON.stringify(a)}`);
  }
}
function ok(cond, label) {
  if (cond) passed++;
  else {
    failed++;
    console.error('✗ ' + label);
  }
}
function throwsLike(fn, re, label) {
  try {
    fn();
    failed++;
    console.error(`✗ ${label}: no dio error`);
  } catch (e) {
    if (re.test(e.message)) passed++;
    else {
      failed++;
      console.error(`✗ ${label}: mensaje inesperado → ${e.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Tabla dinámica
// ---------------------------------------------------------------------------
const tbl = {
  headers: ['Región', 'Mes', 'Canal', 'Monto'],
  rows: [
    ['Norte', 'Ene', 'Online', 100],
    ['Sur', 'Ene', 'Tienda', 50],
    ['Norte', 'Feb', 'Tienda', 30],
    ['Sur', 'Feb', 'Online', 200],
    ['Centro', 'Feb', 'Online', 80],
  ],
};
const ps = (o) => Object.assign(Pv.emptySpec(), o);
let p = Pv.resolve(ps({ rows: 'Región', value: { field: 'Monto', agg: 'SUM' } }), tbl);
eq([p.rowKeys, p.rowTotals, p.grand], [['Norte', 'Sur', 'Centro'], [130, 250, 80], 460], 'pivot: suma por región');
p = Pv.resolve(ps({ rows: 'Región', value: { field: 'Monto', agg: 'SUM' }, sort: 'desc' }), tbl);
eq(p.rowKeys, ['Sur', 'Norte', 'Centro'], 'pivot: orden descendente');
p = Pv.resolve(ps({ rows: 'Región', columns: 'Mes', value: { field: 'Monto', agg: 'SUM' } }), tbl);
eq([p.colKeys, p.cells, p.colTotals], [['Ene', 'Feb'], [[100, 30], [50, 200], [null, 80]], [150, 310]], 'pivot: filas × columnas con celdas vacías');
p = Pv.resolve(ps({ rows: 'Canal', value: { field: 'Región', agg: 'SUM' } }), tbl);
eq([p.agg, p.rowTotals], ['COUNT', [3, 2]], 'pivot: un texto en Valores se cuenta');
p = Pv.resolve(ps({ rows: 'Región', value: { field: 'Monto', agg: 'AVG' } }), tbl);
eq([p.rowTotals, p.grand], [[65, 125, 80], 92], 'pivot: promedio (el total general promedia filas, no promedios)');
p = Pv.resolve(ps({ rows: 'Región', value: { field: 'Monto', agg: 'SUM' }, filter: { field: 'Canal', values: ['Online'] } }), tbl);
eq([p.rowKeys, p.rowTotals, p.count], [['Norte', 'Sur', 'Centro'], [100, 200, 80], 3], 'pivot: filtro');
p = Pv.resolve(ps({ rows: 'Región', value: { field: 'Monto', agg: 'SUM' }, show: 'pct' }), tbl);
eq(Math.round(p.rowTotals[1] * 1000) / 1000, 0.543, 'pivot: % del total');
eq(Pv.resolve(ps({ rows: 'Región', value: { field: 'Monto', agg: 'AVG' }, show: 'pct' }), tbl).ok, false, 'pivot: % del total no aplica a promedios');
eq(Pv.resolve(ps({ rows: 'Región' }), tbl).ok, false, 'pivot: sin valores no hay tabla');
const pvCheck = Pv.expect({ rows: 'Región', columns: null, value: 'Monto', aggs: ['SUM'], sort: 'desc' });
ok(pvCheck({ pivot: { spec: ps({ rows: 'Región', value: { field: 'Monto', agg: 'SUM' }, sort: 'desc' }), table: tbl } }) === true, 'pivot.expect acepta la tabla correcta');
ok(typeof pvCheck({ pivot: { spec: ps({ rows: 'Región', value: { field: 'Monto', agg: 'COUNT' } }), table: tbl } }) === 'string', 'pivot.expect explica la agregación incorrecta');
ok(typeof pvCheck({ pivot: { spec: ps({ rows: 'Región', columns: 'Mes', value: { field: 'Monto', agg: 'SUM' } }), table: tbl } }) === 'string', 'pivot.expect rechaza columnas de más');

// ---------------------------------------------------------------------------
// SQL
// ---------------------------------------------------------------------------
const db = {
  ventas: {
    headers: ['id', 'vendedor', 'region', 'monto', 'fecha', 'id_producto'],
    rows: [
      [1, 'Ana', 'Norte', 100, '2024-01-05', 1],
      [2, 'Bruno', 'Sur', 250, '2024-01-09', 2],
      [3, 'Ana', 'Norte', 50, '2024-02-01', 2],
      [4, 'Carla', 'Centro', 300, '2024-02-11', 3],
      [5, 'Bruno', 'Sur', null, '2024-03-02', 9],
    ],
  },
  productos: { headers: ['id', 'nombre', 'categoria'], rows: [[1, 'Mouse', 'Perif'], [2, 'Teclado', 'Perif'], [3, 'Monitor', 'Pantallas']] },
};
const q = (s) => SQL.execute(s, db);
eq(q("SELECT vendedor FROM ventas WHERE region = 'Norte'").rows, [['Ana'], ['Ana']], 'sql: WHERE');
eq(q('SELECT vendedor, monto FROM ventas ORDER BY monto DESC LIMIT 2').rows, [['Carla', 300], ['Bruno', 250]], 'sql: ORDER BY + LIMIT');
eq(q('SELECT COUNT(*), COUNT(monto), SUM(monto), AVG(monto), MIN(monto), MAX(monto) FROM ventas').rows, [[5, 4, 700, 175, 50, 300]], 'sql: agregaciones ignoran NULL');
eq(q('SELECT region, SUM(monto) AS total FROM ventas GROUP BY region ORDER BY total DESC').rows, [['Centro', 300], ['Sur', 250], ['Norte', 150]], 'sql: GROUP BY + alias en ORDER BY');
eq(q('SELECT region, COUNT(*) FROM ventas GROUP BY region HAVING COUNT(*) > 1').rows, [['Norte', 2], ['Sur', 2]], 'sql: HAVING');
eq(q('SELECT v.id, p.nombre FROM ventas v JOIN productos p ON v.id_producto = p.id').rows.length, 4, 'sql: JOIN descarta sin pareja');
eq(q('SELECT v.id, p.nombre FROM ventas v LEFT JOIN productos p ON v.id_producto = p.id WHERE p.nombre IS NULL').rows, [[5, null]], 'sql: LEFT JOIN conserva sin pareja');
eq(q('SELECT p.categoria, SUM(v.monto) FROM ventas v JOIN productos p ON v.id_producto = p.id GROUP BY p.categoria').rows, [['Perif', 400], ['Pantallas', 300]], 'sql: JOIN + GROUP BY');
eq(q("SELECT id FROM ventas WHERE monto BETWEEN 60 AND 260 AND vendedor IN ('Ana', 'Bruno')").rows, [[1], [2]], 'sql: BETWEEN e IN');
eq(q("SELECT id FROM ventas WHERE vendedor LIKE 'b%'").rows, [[2], [5]], 'sql: LIKE sin distinguir mayúsculas');
eq(q("SELECT id, CASE WHEN monto >= 200 THEN 'Alta' ELSE 'Baja' END AS tipo FROM ventas WHERE monto IS NOT NULL").rows.map((r) => r[1]), ['Baja', 'Alta', 'Baja', 'Alta'], 'sql: CASE');
eq(q('SELECT SUBSTR(fecha, 1, 7) AS mes, COUNT(*) FROM ventas GROUP BY SUBSTR(fecha, 1, 7)').rows, [['2024-01', 2], ['2024-02', 2], ['2024-03', 1]], 'sql: GROUP BY de una expresión');
eq(q('SELECT DISTINCT region FROM ventas ORDER BY region').rows, [['Centro'], ['Norte'], ['Sur']], 'sql: DISTINCT');
eq(q('SELECT ROUND(AVG(monto), 1) FROM ventas').rows, [[175]], 'sql: ROUND');
eq(q('select count(*) as n from VENTAS;').rows, [[5]], 'sql: mayúsculas indistintas y ;');
eq(q("SELECT * FROM ventas WHERE region = 'norte'").notes.length, 1, 'sql: pista de mayúsculas cuando da 0 filas');
eq(q('SELECT vendedor AS v, monto FROM ventas ORDER BY 2 DESC LIMIT 1').rows, [['Carla', 300]], 'sql: ORDER BY por posición');
throwsLike(() => q('SELECT * FROM venta'), /ventas/, 'sql: tabla inexistente sugiere la correcta');
throwsLike(() => q('SELECT vendedr FROM ventas'), /vendedor/, 'sql: columna inexistente sugiere la correcta');
throwsLike(() => q('SELECT vendedor, SUM(monto) FROM ventas'), /GROUP BY/, 'sql: columna sin agrupar');
throwsLike(() => q('SELECT * FROM ventas WHERE SUM(monto) > 1'), /HAVING/, 'sql: agregación en WHERE');
throwsLike(() => q('SELECT * FROM ventas GROUP BY region WHERE monto > 1'), /orden/i, 'sql: cláusulas desordenadas');
throwsLike(() => q('SELECT * FROM ventas WHERE region = "Norte"'), /comillas simples/, 'sql: comillas dobles para textos');
throwsLike(() => q('SELECT id FROM ventas v JOIN productos p ON v.id_producto = p.id'), /más de una tabla/, 'sql: columna ambigua');
throwsLike(() => q('SELECT vendedor monto FROM ventas'), /coma/, 'sql: falta una coma');
throwsLike(() => q('SELECT region'), /FROM/, 'sql: falta FROM');
throwsLike(() => q("SELECT * FROM ventas WHERE region == 'Norte'"), /"="/, 'sql: == no existe');
eq(SQL.sameResult(q('SELECT region, SUM(monto) FROM ventas GROUP BY region'), { rows: [['Sur', 250], ['Norte', 150], ['Centro', 300]] }), true, 'sql: comparar sin orden');
ok(typeof SQL.sameResult(q('SELECT region, SUM(monto) FROM ventas GROUP BY region'), { rows: [['Sur', 250], ['Norte', 150], ['Centro', 300]], ordered: true }) === 'string', 'sql: comparar con orden');
ok(/columna/.test(SQL.sameResult(q('SELECT region FROM ventas'), { rows: [['x', 1]] })), 'sql: nota de columnas');
eq([SQL.uses('SELECT a FROM t WHERE b = 1', 'WHERE'), SQL.uses('SELECT a FROM t', 'WHERE'), SQL.uses('SELECT COUNT(*) FROM t', 'COUNT')], [true, false, true], 'sql: detectar cláusulas usadas');

// ---------------------------------------------------------------------------
// Dashboards
// ---------------------------------------------------------------------------
const spec = (o) => Object.assign(Ch.emptySpec(), o);
const dash = {
  title: 'Test',
  filter: { field: 'Canal', values: ['Online'] },
  tiles: [
    { id: 'k1', kind: 'kpi', title: 'Ventas', field: 'Monto', agg: 'SUM', format: 'money' },
    { id: 'c1', kind: 'chart', chart: spec({ mark: 'bar', columns: { field: 'Región' }, rows: { field: 'Monto', agg: 'SUM' }, sort: 'desc' }) },
  ],
};
const S = { dash: { spec: dash, table: tbl } };
eq(D.kpiValue(dash.tiles[0], D.filteredTable(dash, tbl)), 380, 'dashboard: KPI con filtro global');
eq(D.fmtKpi(12345, 'money'), '$12.3K', 'dashboard: formato de KPI');
ok(D.hasKpi({ field: 'Monto', aggs: ['SUM'] })(S) === true, 'dashboard: hasKpi');
ok(typeof D.hasKpi({ field: 'Monto', aggs: ['AVG'] })(S) === 'string', 'dashboard: hasKpi explica la agregación');
ok(D.hasChart({ marks: ['bar'], dim: 'Región', measure: 'Monto', aggs: ['SUM'], sort: 'desc' })(S) === true, 'dashboard: hasChart');
ok(D.hasChart({ marks: ['line'], dim: 'Mes' })(S) === false, 'dashboard: hasChart sin gráfico parecido');
ok(D.globalFilter('Canal', ['Online'])(S) === true && D.globalFilter('Región')(S) === false, 'dashboard: filtro global');
ok(D.tile('k1', D.kpiIs({ field: 'Monto', aggs: ['SUM'] }))(S) === true, 'dashboard: tile por id');
ok(typeof D.tile('zz', () => true)(S) === 'string', 'dashboard: tile borrado');
ok(typeof D.tileCount(1, 1)(S) === 'string', 'dashboard: demasiados elementos');

// ---------------------------------------------------------------------------
// Informes
// ---------------------------------------------------------------------------
const rep = { sections: [{ id: 'h', label: 'Titular', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B', why: 'no' }], correct: 'a' }, { id: 'e', label: 'Evidencia', multi: 2, options: [{ id: 'x' }, { id: 'y' }, { id: 'z', why: 'falso' }], correct: ['x', 'y'] }] };
const sec = (id, choices) => AA.Report.section(rep, id)({ report: { choices } });
eq([sec('h', {}), sec('h', { h: 'a' }), sec('h', { h: 'b' })], [false, true, 'no'], 'informe: sección simple');
eq([sec('e', { e: ['x'] }).includes('2'), sec('e', { e: ['x', 'z'] }), sec('e', { e: ['y', 'x'] })], [true, 'falso', true], 'informe: sección de varias opciones');

console.log(`\n${passed} OK, ${failed} fallidos`);
process.exit(failed ? 1 : 0);
