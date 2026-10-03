/*
 * ARCADE y pedidos sin guía:
 *   - cada rango usa solo niveles de su etapa y la anterior (y solo los que ya se aprendieron),
 *   - las misiones del ARCADE salen al azar, se pueden resolver y no se repiten seguidas,
 *   - el pedido sin guía no menciona funciones ni fórmulas de ejemplo.
 * Ejecutar con: node tests/arcade.test.js
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
const fs = require('fs');
const path = require('path');
fs.readdirSync(path.join(__dirname, '../js/game/content'))
  .filter((f) => /^mod\d+\.js$/.test(f))
  .forEach((f) => require(`../js/game/content/${f}`));
require('../js/game/content/curriculum.js');
require('../js/game/brief.js');
require('../js/game/arcade.js');

const AA = globalThis.AA;
const mem = {};
AA.Storage = { readSlot: (i) => mem[i] || null, writeSlot: (i, t) => (mem[i] = t), deleteSlot: (i) => delete mem[i] };
AA.escapeHtml = AA.escapeHtml || ((s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]));
const St = AA.State;
const Cu = AA.Curriculum;
const W = AA.Workspace;
const A = AA.Arcade;
let passed = 0;
let failed = 0;
const ok = (cond, label) => {
  if (cond) passed++;
  else {
    failed++;
    if (failed <= 30) console.error('✗ ' + label);
  }
};

// Nombres de funciones (para verificar que el pedido sin guía no los menciona).
const FN = new Set();
for (const d of AA.Formula.functionList()) [d.name].concat(d.aliases || []).forEach((n) => FN.add(n.toUpperCase()));
const mentionsFn = (html) => {
  const words = String(html).replace(/<[^>]+>/g, ' ').match(/[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ0-9.]+/g) || [];
  return words.filter((w) => FN.has(w.replace(/\.$/, '')) && !['Y', 'O', 'SI', 'NO'].includes(w)).filter((w) => w.length > 3);
};

for (const lang of ['es', 'en']) {
  AA.setLang(lang);
  for (const mod of Cu.MODULES) {
    for (const t of mod.templates) {
      const m = AA.Content.build(t, { seed: 5, size: 'medium', lang });
      const list = AA.Brief.deliverables(m, W.buildBook(m));
      const bad = list.flatMap(mentionsFn);
      ok(!bad.length, `${t} (${lang}): el pedido sin guía menciona funciones: ${bad.join(', ')}`);
      ok(list.every((x) => !/<code>\s*=/.test(x) && !/:\s*=[A-Z]/.test(x)), `${t} (${lang}): el pedido sin guía trae una fórmula de ejemplo`);
      const checks = m.objectives.filter((o) => !o.answer && !o.choices).length;
      ok(!checks || list.length > 0, `${t} (${lang}): el pedido sin guía quedó vacío`);
    }
  }
}
AA.setLang('es');

// Partida en distintos rangos: todos los niveles aprendidos hasta la etapa del rango.
function setRank(rank) {
  St.newGame(1, 'Test');
  for (const m of Cu.MODULES) {
    if (m.tier > rank) break;
    St.data.lessons[m.id] = true;
  }
  St.data.xp = St.RANKS[rank].xp;
  St.data.rankReached = rank;
}

for (const rank of [1, 2, 3]) {
  setRank(rank);
  const pool = A.pool(rank);
  ok(pool.length >= 3, `rango ${rank}: hay niveles para jugar`);
  ok(pool.every((m) => m.tier === rank || m.tier === rank - 1), `rango ${rank}: solo niveles de su etapa y la anterior`);
  ok(A.unlocked(rank) && !A.unlocked(rank + 1 > 3 ? 99 : rank + 1), `rango ${rank}: desbloqueado solo hasta su rango`);
  A.run = { rank, wave: 1, recent: [] };
  const seen = [];
  let prevTiers = 0;
  for (let w = 1; w <= 6; w++) {
    A.run.wave = w;
    const win = A.windowFor(rank, w);
    ok(win.length >= 3, `rango ${rank} oleada ${w}: al menos 3 niveles posibles`);
    const avg = win.reduce((a, m) => a + Cu.MODULES.indexOf(m), 0) / win.length;
    ok(avg >= prevTiers - 1e-9, `rango ${rank} oleada ${w}: la dificultad no baja`);
    prevTiers = avg;
    for (let k = 0; k < 3; k++) {
      const m = A.newMission();
      seen.push(m.module + ':' + m.id.split(':')[2]);
      ok(m.kind === 'arcade' && m.xp === 0, `rango ${rank}: misión de ARCADE bien marcada`);
      ok(win.some((x) => x.id === m.module), `rango ${rank} oleada ${w}: la misión sale de su ventana`);
    }
  }
  // No se repite la misma plantilla dos veces seguidas.
  ok(seen.every((x, i) => i === 0 || x !== seen[i - 1]), `rango ${rank}: no repite plantillas seguidas`);
}

// Un Junior recién ascendido (sin lecciones de Junior) juega con lo de Pasante.
St.newGame(1, 'Nuevo');
for (const m of Cu.MODULES) if (m.tier === 0) St.data.lessons[m.id] = true;
St.data.xp = St.RANKS[1].xp;
St.data.rankReached = 1;
ok(A.pool(1).every((m) => m.tier === 0), 'Junior sin lecciones nuevas: solo niveles ya aprendidos');

// Plazos: cada pedido trae tiempo según su tamaño, y se achica con las oleadas.
setRank(3);
A.run = { rank: 3, wave: 1, recent: [] };
for (let i = 0; i < 20; i++) {
  const m = A.newMission();
  ok(m.effort > 30 && m.effort < 1500, `esfuerzo razonable (${m.effort}s) en ${m.id}`);
}
for (const e of [120, 300, 600]) {
  for (let w = 1; w < 10; w++) ok(A.budgetFor(e, w + 1) <= A.budgetFor(e, w), `el plazo no crece con la oleada (${e}s, oleada ${w})`);
  ok(A.budgetFor(e, 1) > e, `en la oleada 1 el plazo alcanza para un jugador promedio (${e}s)`);
  ok(A.budgetFor(e, 1) > A.budgetFor(e / 2, 1), 'un pedido más largo trae más plazo');
}
ok(A.speed(1) === 1 && A.speed(5) > A.speed(2), 'el reloj se acelera con las oleadas');

// Ranking: más misiones primero; a igual cantidad, menos tiempo total.
const runs = [
  { missions: 8, secs: 900, score: 100 },
  { missions: 10, secs: 1500, score: 50 },
  { missions: 8, secs: 700, score: 10 },
];
const sorted = runs.slice().sort(A.byRank);
ok(sorted[0] === runs[1] && sorted[1] === runs[2] && sorted[2] === runs[0], 'ranking por misiones y luego por tiempo total');

// Favores de Nico: con guía si piden algo que todavía no hiciste en el modo historia.
St.newGame(1, 'Favor');
const fav = 'f:mod8:m8_duplicates:123';
const k = Cu.moduleById('mod8').templates.indexOf('m8_duplicates');
ok(!Cu.favorKnown(fav), 'favor de algo nunca hecho: con guía');
St.data.completed[`mod8-${k + 1}`] = { xp: 1, hints: 0, at: Date.now() };
ok(Cu.favorKnown(fav), 'favor de algo ya hecho: sin guía');

console.log(`${passed} OK, ${failed} fallidos`);
process.exit(failed ? 1 : 0);
