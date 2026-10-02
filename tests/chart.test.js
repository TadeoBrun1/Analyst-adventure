/* Tests del modelo de gráficos. Ejecutar con: node tests/chart.test.js */
'use strict';
require('../js/i18n/i18n.js');
require('../js/charts/chart-model.js');

const Ch = globalThis.AA.Chart;
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

const table = {
  headers: ['Mes', 'Región', 'Estado', 'Monto'],
  time: ['Mes'],
  rows: [
    ['Ene', 'Norte', 'OK', 100],
    ['Ene', 'Sur', 'Demora', 50],
    ['Feb', 'Norte', 'OK', 30],
    ['Feb', 'Sur', 'OK', 200],
    ['Mar', 'Centro', 'Demora', 80],
  ],
};
const spec = (o) => Object.assign(Ch.emptySpec(), o);

// Campos
const f = Ch.fields(table);
eq(f.filter((x) => x.role === 'dimension').map((x) => x.name), ['Mes', 'Región', 'Estado'], 'dimensiones detectadas');
eq(f.filter((x) => x.role === 'measure').map((x) => x.name), ['Monto', Ch.COUNT_FIELD], 'medidas detectadas');

// Barras: suma por región, orden de aparición y orden descendente
let r = Ch.resolve(spec({ columns: { field: 'Región' }, rows: { field: 'Monto', agg: 'SUM' } }), table);
eq([r.mark, r.orientation, r.categories, r.totals], ['bar', 'v', ['Norte', 'Sur', 'Centro'], [130, 250, 80]], 'barras por región');
r = Ch.resolve(spec({ columns: { field: 'Región' }, rows: { field: 'Monto', agg: 'SUM' }, sort: 'desc' }), table);
eq(r.categories, ['Sur', 'Norte', 'Centro'], 'orden descendente');
r = Ch.resolve(spec({ rows: { field: 'Región' }, columns: { field: 'Monto', agg: 'SUM' } }), table);
eq(r.orientation, 'h', 'dimensión en Filas → barras horizontales');

// Agregaciones
eq(Ch.resolve(spec({ columns: { field: 'Región' }, rows: { field: 'Monto', agg: 'AVG' } }), table).totals, [65, 125, 80], 'promedio');
eq(Ch.resolve(spec({ columns: { field: 'Región' }, rows: { field: Ch.COUNT_FIELD, agg: 'COUNT' } }), table).totals, [2, 2, 1], 'recuento de registros');
eq(Ch.resolve(spec({ columns: { field: 'Región' }, rows: { field: 'Monto', agg: 'MAX' } }), table).totals, [100, 200, 80], 'máximo');

// Automático: dimensión temporal → líneas
eq(Ch.resolve(spec({ columns: { field: 'Mes' }, rows: { field: 'Monto', agg: 'SUM' } }), table).mark, 'line', 'automático elige líneas para meses');

// Color: series apiladas por estado
r = Ch.resolve(spec({ columns: { field: 'Región' }, rows: { field: 'Monto', agg: 'SUM' }, color: 'Estado' }), table);
eq(r.series.map((s) => [s.key, s.values]), [['OK', [130, 200, 0]], ['Demora', [0, 50, 80]]], 'series por color');

// Filtro
r = Ch.resolve(spec({ columns: { field: 'Región' }, rows: { field: 'Monto', agg: 'SUM' }, filter: { field: 'Estado', values: ['OK'] } }), table);
eq([r.categories, r.totals], [['Norte', 'Sur'], [130, 200]], 'filtro por estado');

// Dispersión y combinaciones inválidas
const t2 = { headers: ['Producto', 'Precio', 'Unidades'], rows: [['A', 10, 300], ['B', 50, 120]] };
r = Ch.resolve(spec({ columns: { field: 'Precio', agg: 'SUM' }, rows: { field: 'Unidades', agg: 'SUM' } }), t2);
eq([r.kind, r.points.length, r.points[0].label], ['scatter', 2, 'A'], 'dispersión: un punto por registro');
eq(Ch.resolve(spec({ columns: { field: 'Región' }, rows: { field: 'Estado' } }), table).ok, false, 'dos dimensiones no se pueden graficar');
eq(Ch.resolve(spec({ columns: { field: 'Región' } }), table).ok, false, 'falta la medida');

// Mostrarme
eq(Ch.recommend(spec({ columns: { field: 'Región' }, rows: { field: 'Monto', agg: 'SUM' } }), table), { bar: 'best', line: 'ok', pie: 'ok', scatter: 'no' }, 'mostrarme: categorías');
eq(Ch.recommend(spec({ columns: { field: 'Mes' }, rows: { field: 'Monto', agg: 'SUM' } }), table).line, 'best', 'mostrarme: tiempo → líneas');
eq(Ch.recommend(spec({ columns: { field: 'Región' }, rows: { field: 'Monto', agg: 'AVG' } }), table).pie, 'no', 'mostrarme: no hay torta de promedios');
eq(Ch.recommend(spec({ columns: { field: 'Precio', agg: 'SUM' }, rows: { field: 'Unidades', agg: 'SUM' } }), t2).scatter, 'best', 'mostrarme: dos medidas → dispersión');

console.log(`\n${passed} OK, ${failed} fallidos`);
process.exit(failed ? 1 : 0);
