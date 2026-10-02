/*
 * Economía de XP y ascensos: que repetir prácticas no permita saltear rangos.
 * Ejecutar con: node tests/progression.test.js
 */
'use strict';
require('../js/engine/formula.js');
require('../js/engine/sheet.js');
require('../js/i18n/i18n.js');
require('../js/game/validators.js');
require('../js/game/state.js');
require('../js/charts/chart-model.js');
require('../js/game/content/lib.js');
for (const m of ['mod1', 'mod2', 'mod3', 'mod4', 'mod5', 'mod6']) {
  try {
    require(`../js/game/content/${m}.js`);
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') throw e;
  }
}
require('../js/game/content/curriculum.js');

const AA = globalThis.AA;
// Almacenamiento en memoria (sin navegador ni Electron).
const mem = {};
AA.Storage = { readSlot: (i) => mem[i] || null, writeSlot: (i, t) => (mem[i] = t), deleteSlot: (i) => delete mem[i] };

const St = AA.State;
const Cu = AA.Curriculum;
let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) passed++;
  else {
    failed++;
    console.error('✗ ' + label);
  }
}
const story = (id) => ({ id, kind: 'story', module: Cu.parseId(id).mod, xp: Cu.moduleById(Cu.parseId(id).mod).xp });
const practice = (mod, size) => ({ id: Cu.practiceId(mod, mod.templates[0], size, 1), kind: 'practice', module: mod.id });
const tier0 = Cu.tierModules(0);

St.newGame(1, 'Test');

// 1) 1000 prácticas del Nivel 1: solo las primeras suman XP y el rango no cambia.
const mod1 = Cu.MODULES[0];
for (const id of Cu.requiredIds(mod1)) St.completeMission(story(id), 0);
const xpAfterStory = St.data.xp;
for (let i = 0; i < 1000; i++) St.completeMission(practice(mod1, 'large'), 0);
ok(St.data.xp === xpAfterStory + Cu.PRACTICE_XP_LIMIT * Cu.practiceXp(mod1, 'large'), `solo ${Cu.PRACTICE_XP_LIMIT} prácticas suman XP (XP=${St.data.xp})`);
ok(St.rankIndex() === 0, '1000 prácticas no te ascienden');

// 2) Aunque la XP alcance, sin completar la etapa no hay ascenso.
St.data.xp = 1e6;
ok(St.rankIndex() === 0, 'con XP de sobra pero niveles incompletos seguís de Pasante');
St.data.xp = xpAfterStory;

// 3) Completar toda la etapa de Pasante + algunas prácticas → Junior.
for (const mod of tier0) for (const id of Cu.requiredIds(mod)) if (!St.isCompleted(id)) St.completeMission(story(id), 0);
let extra = 0;
while (St.rankIndex() === 0 && extra < 50) {
  const mod = tier0[tier0.length - 1 - (extra % tier0.length)];
  St.completeMission(practice(mod, 'medium'), 0);
  extra++;
}
ok(St.rankIndex() === 1, `con la etapa completa + ${extra} prácticas llegás a Junior`);
ok(extra >= 2 && extra <= 8, `hacen falta unas pocas prácticas para el ascenso (fueron ${extra})`);

// 4) Siendo Junior, las prácticas de Pasante ya no dan XP.
const before = St.data.xp;
const res = St.completeMission(practice(tier0[0], 'large'), 0);
ok(St.data.xp === before && res.gained === 0 && res.noXpReason === 'rank', 'prácticas de un rango anterior dan 0 XP');

// 5) No se puede llegar a Senior farmeando: la etapa Junior todavía no tiene niveles completos.
for (let i = 0; i < 1000; i++) for (const mod of tier0) St.completeMission(practice(mod, 'large'), 0);
ok(St.rankIndex() === 1, 'miles de prácticas no llevan a Semi-Senior ni a Senior');
St.data.xp = 1e6;
ok(St.rankIndex() === 1, 'ni siquiera con XP infinita (faltan los niveles de la etapa Junior)');

// 6) El rango alcanzado no baja aunque cambien las reglas o el contenido.
St.data.xp = 0;
ok(St.rankIndex() === 1, 'el rango alcanzado no baja');

// 7) Las tareas obligatorias repetidas no suman XP de nuevo.
const xp0 = St.data.xp;
St.completeMission(story(Cu.requiredIds(mod1)[0]), 0);
ok(St.data.xp === xp0, 'repetir una tarea obligatoria no suma XP');

console.log(`\n${passed} OK, ${failed} fallidos`);
process.exit(failed ? 1 : 0);
