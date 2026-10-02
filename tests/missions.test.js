/*
 * Resuelve automáticamente cada plantilla de misión con su solución de referencia, en varios
 * tamaños, semillas e idiomas, y verifica que:
 *   - todos los objetivos se cumplan con la solución,
 *   - ninguno se cumpla con la hoja vacía o con respuestas incorrectas,
 *   - la solución solo escriba en celdas no bloqueadas y dentro de la hoja.
 * Ejecutar con: node tests/missions.test.js
 */
'use strict';
require('../js/engine/formula.js');
require('../js/engine/sheet.js');
require('../js/i18n/i18n.js');
require('../js/game/validators.js');
require('../js/game/state.js');
require('../js/charts/chart-model.js');
require('../js/tools/pivot.js');
require('../js/tools/sql.js');
require('../js/tools/dashboard.js');
require('../js/tools/report.js');
require('../js/game/workspace.js');
require('../js/game/content/lib.js');
const MODS = require('fs').readdirSync(require('path').join(__dirname, '../js/game/content')).filter((f) => /^mod\d+\.js$/.test(f)).sort((a, b) => parseInt(a.slice(3)) - parseInt(b.slice(3)));
for (const f of MODS) require(`../js/game/content/${f}`);
require('../js/game/content/curriculum.js');

const AA = globalThis.AA;
const F = AA.Formula;
const V = AA.V;
let passed = 0;
let failed = 0;
const fail = (msg) => {
  failed++;
  if (failed <= 40) console.error('✗ ' + msg);
};

const W = AA.Workspace;

// Resuelve la misión dos veces: sin hacer nada (no se tiene que cumplir ningún objetivo) y con la
// solución de referencia (se tienen que cumplir todos).
function checkMission(m, label) {
  const defs = W.sheetDefs(m);
  // 1) Estado vacío.
  const S0 = W.state(m, W.buildBook(m), W.emptyParts(m));
  m.objectives.forEach((o, i) => {
    let res;
    if (o.choices) {
      res = false;
      if (!(o.correct >= 0 && o.correct < o.choices.length)) fail(`${label} #${i + 1}: la opción correcta no existe`);
    } else res = o.answer ? o.answer('respuesta-incorrecta-xyz') : o.check(S0);
    if (res === true) fail(`${label} #${i + 1} se cumple sin hacer nada`);
    else passed++;
  });
  // 2) La solución solo escribe en celdas permitidas.
  const sol = m.solution || {};
  for (const [name, ref] of W.solutionWrites(sol)) {
    const d = name ? defs.find((x) => x.name === name) : defs[0];
    if (!d) {
      fail(`${label}: la solución escribe en una hoja que no existe (${name})`);
      continue;
    }
    const p = F.parseRef(ref);
    if (!p || p.col >= d.def.cols || p.row >= d.def.rows) fail(`${label}: la solución escribe fuera de la hoja (${ref})`);
    const locked = (d.def.locked || []).map(F.parseRange);
    if (locked.some((k) => p.col >= k.c1 && p.col <= k.c2 && p.row >= k.r1 && p.row <= k.r2)) fail(`${label}: la solución escribe en una celda bloqueada (${ref})`);
  }
  if (m.chart && sol.chart && !AA.Chart.resolve(sol.chart, m.chart.table).ok) fail(`${label}: la solución no se puede dibujar`);
  if (m.sql) {
    for (const q of sol.sql || []) {
      try {
        AA.SQL.execute(q, m.sql.tables);
      } catch (e) {
        fail(`${label}: la consulta de la solución falla → ${q} → ${e.message}`);
      }
    }
  }
  // 3) Con la solución, todo cumplido.
  const { S } = W.solve(m);
  m.objectives.forEach((o, i) => {
    let res;
    if (o.answer || o.choices) {
      const a = (sol.answers || {})[i];
      if (a === undefined) {
        fail(`${label} #${i + 1}: falta la respuesta en la solución`);
        return;
      }
      res = o.choices ? a === o.correct : o.answer(a);
    } else res = o.check(S);
    if (res === true) passed++;
    else fail(`${label} #${i + 1}: la solución no lo cumple → ${JSON.stringify(res)}`);
  });
}

// 1) Todas las plantillas, en ambos idiomas, en todos los tamaños.
const ids = Object.keys(AA.Content.templates);
for (const id of ids) {
  for (const lang of ['es', 'en']) {
    for (const [size, seeds] of [['small', [1, 2, 3]], ['medium', [11, 12, 13]], ['large', [21, 22]]]) {
      for (const seed of seeds) {
        AA.setLang(lang);
        let m;
        try {
          m = AA.Content.build(id, { seed, size, lang });
        } catch (e) {
          fail(`${id} ${lang} ${size} ${seed}: error al generar → ${e.stack}`);
          continue;
        }
        checkMission(m, `${id} [${lang} ${size} #${seed}]`);
      }
    }
  }
}

// 2) Las misiones obligatorias del currículum (semillas fijas).
for (const mod of AA.Curriculum.MODULES) {
  for (const id of AA.Curriculum.requiredIds(mod)) {
    for (const lang of ['es', 'en']) {
      AA.setLang(lang);
      const m = AA.Curriculum.build(id, lang);
      if (!m || m.id !== id || !m.xp) fail(`currículum: ${id} mal armada`);
      else checkMission(m, `${id} [${lang}]`);
    }
  }
}

// 3) Los identificadores de práctica se pueden reconstruir.
const mod1 = AA.Curriculum.MODULES[0];
const pid = AA.Curriculum.newPractice(mod1, 'large');
const pm = AA.Curriculum.build(pid, 'es');
if (pm && pm.kind === 'practice' && pm.xp === AA.Curriculum.practiceXp(mod1, 'large')) passed++;
else fail('práctica: no se reconstruye desde su id');

// 4) Determinismo: misma semilla, misma misión.
const a = JSON.stringify(AA.Content.build('m5_matrix', { seed: 7, size: 'medium', lang: 'es' }).sheet);
const b = JSON.stringify(AA.Content.build('m5_matrix', { seed: 7, size: 'medium', lang: 'es' }).sheet);
if (a === b) passed++;
else fail('las plantillas no son deterministas');

// 5) Errores típicos que NO tienen que aceptarse.
function attempt(id, writes, objIndex, expectNoteIncludes) {
  AA.setLang('es');
  const m = AA.Content.build(id, { seed: 5, size: 'small', lang: 'es' });
  const sh = AA.Content.buildSheet(m.sheet);
  for (const [ref, f] of writes(m)) {
    const p = F.parseRef(ref);
    sh.setInput(p.col, p.row, f, true);
  }
  const res = m.objectives[objIndex].check(V.query(sh));
  const ok = res !== true && (!expectNoteIncludes || (typeof res === 'string' && res.includes(expectNoteIncludes)));
  if (ok) passed++;
  else fail(`error típico aceptado en ${id} #${objIndex + 1}: ${JSON.stringify(res)}`);
}
const lastRow = (m) => m.sheet.data.rows.length;
const fillCol = (col, r1, r2, f) => {
  const out = [];
  for (let r = r1; r <= r2; r++) out.push([col + r, F.shiftFormula(f, 0, r - r1)]);
  return out;
};
attempt('m1_orders', (m) => [['E2', String(m.sheet.data.rows[1][2] * m.sheet.data.rows[1][3])]], 1, 'a mano');
// Variantes válidas que SÍ tienen que aceptarse.
function accepted(id, writes, objIndex) {
  AA.setLang('es');
  const m = AA.Content.build(id, { seed: 5, size: 'small', lang: 'es' });
  const sh = AA.Content.buildSheet(m.sheet);
  for (const [ref, f] of writes(m)) {
    const p = F.parseRef(ref);
    sh.setInput(p.col, p.row, f, true);
  }
  const res = m.objectives[objIndex].check(V.query(sh));
  if (res === true) passed++;
  else fail(`variante válida rechazada en ${id} #${objIndex + 1}: ${JSON.stringify(res)}`);
}
accepted('m1_orders', () => [['E2', '=PRODUCTO(C2:D2)']], 1);
accepted('m1_orders', () => [['E2', '=D2*C2']], 1);
accepted('m2_quarter', (m) => fillCol('F', 2, lastRow(m), '=C2+D2+E2').map(([r]) => [r, '=SUM(C' + r.slice(1) + ':E' + r.slice(1) + ')']), 0);
accepted('m5_commission', (m) => fillCol('C', 2, lastRow(m), '=B2*F$2'), 0);
accepted('m5_shipments', () => fillCol('I', 2, 5, '=COUNTIF(B:B,H2)'), 0);
attempt('m1_budget', (m) => fillCol('E', 2, lastRow(m), '=C2-D2'), 0, null);
attempt('m3_bonus', (m) => fillCol('E', 2, lastRow(m), '=SI(C2>D2;"Sí";"No")'), 0, '>=');
attempt('m3_vip', (m) => fillCol('D', 2, lastRow(m), '=SI(O(B2>=5;C2>=100000);"VIP";"Estándar")'), 0, null);
attempt('m4_clients', (m) => fillCol('E', 2, lastRow(m), '=NOMPROPIO(A2)'), 0, null);
attempt('m4_phones', (m) => fillCol('C', 2, lastRow(m), '=LARGO(B2)'), 0, null);
attempt('m5_shipments', () => fillCol('I', 2, 5, `=CONTAR.SI(B2:B24;H2)`), 0, '$');
attempt('m5_tickets', () => fillCol('G', 2, 4, '=F2/F5').concat([['F2', '=CONTAR.SI($C$2:$C$40;E2)'], ['F5', '=SUMA(F2:F4)']]), 2, null);
attempt('m5_commission', (m) => fillCol('C', 2, lastRow(m), '=B2*5%'), 0, null);
attempt('m5_commission', (m) => fillCol('C', 2, lastRow(m), '=B2*F2'), 0, null);

// 6) Errores típicos de visualización que NO tienen que aceptarse.
function chartAttempt(id, mutate, objIndex, label) {
  AA.setLang('es');
  const m = AA.Content.build(id, { seed: 9, size: 'small', lang: 'es' });
  const spec = JSON.parse(JSON.stringify(m.solution.chart));
  mutate(spec, m);
  const res = m.objectives[objIndex].check({ spec, table: m.chart.table });
  if (res !== true) passed++;
  else fail(`error de gráfico aceptado (${label}) en ${id} #${objIndex + 1}`);
}
chartAttempt('m6_bar', (s) => (s.mark = 'pie'), 0, 'torta en vez de barras');
chartAttempt('m6_bar', (s) => (s.rows.agg = 'AVG'), 0, 'promedio en vez de suma');
chartAttempt('m6_bar', (s) => (s.sort = 'none'), 1, 'sin ordenar');
chartAttempt('m6_bar', (s) => (s.title = 'Ventas por región'), 2, 'título que no cuenta la conclusión');
chartAttempt('m6_line', (s) => (s.sort = 'desc'), 1, 'meses ordenados por valor');
chartAttempt('m6_line', (s) => (s.mark = 'bar'), 0, 'barras para una evolución');
chartAttempt('m6_scatter', (s) => ([s.columns, s.rows] = [s.rows, s.columns]), 0, 'ejes invertidos');
chartAttempt('m6_color', (s) => (s.filter = null), 2, 'sin filtro');
chartAttempt('m6_color', (s) => (s.color = null), 1, 'sin color');
// Variante válida: barras horizontales (dimensión en Filas) también cumplen.
{
  AA.setLang('es');
  const m = AA.Content.build('m6_bar', { seed: 9, size: 'small', lang: 'es' });
  const spec = JSON.parse(JSON.stringify(m.solution.chart));
  [spec.columns, spec.rows] = [spec.rows, spec.columns];
  const res = m.objectives[0].check({ spec, table: m.chart.table });
  if (res === true) passed++;
  else fail('barras horizontales rechazadas: ' + JSON.stringify(res));
}

console.log(`\n${ids.length} plantillas · ${passed} OK, ${failed} fallidos`);
process.exit(failed ? 1 : 0);
