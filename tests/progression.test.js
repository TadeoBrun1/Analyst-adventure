/*
 * Economía de XP y ascensos: que repetir prácticas no permita saltear rangos, y que cada
 * ascenso pida completar la etapa + unos pocos casos de práctica.
 * Ejecutar con: node tests/progression.test.js
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
const completeTier = (tier) => {
  for (const mod of Cu.tierModules(tier)) for (const id of Cu.requiredIds(mod)) if (!St.isCompleted(id)) St.completeMission(story(id), 0);
};
// Prácticas (medianas) del último nivel de la etapa hasta ascender.
const practiceUntilPromoted = (tier) => {
  const mods = Cu.tierModules(tier);
  let n = 0;
  while (St.rankIndex() === tier && n < 60) {
    St.completeMission(practice(mods[mods.length - 1 - (n % mods.length)], 'medium'), 0);
    n++;
  }
  return n;
};

ok(Cu.MODULES.length === 19, `hay 19 niveles (hay ${Cu.MODULES.length})`);
ok([0, 1, 2, 3].every((t) => Cu.tierModules(t).length >= 4) && Cu.tierModules(4).length === 0, 'cuatro etapas con niveles; Lead todavía sin niveles');

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

// 3) Cada etapa: completarla + unas pocas prácticas → ascenso al rango siguiente.
const names = ['Junior', 'Semi-Senior', 'Senior'];
for (let tier = 0; tier < 3; tier++) {
  completeTier(tier);
  const n = practiceUntilPromoted(tier);
  ok(St.rankIndex() === tier + 1, `etapa ${tier} completa → ${names[tier]}`);
  ok(n >= 2 && n <= 4, `para llegar a ${names[tier]} hacen falta 3 o 4 prácticas (fueron ${n})`);
  // Las prácticas de una etapa ya superada no dan XP.
  const before = St.data.xp;
  const res = St.completeMission(practice(Cu.tierModules(tier)[0], 'large'), 0);
  ok(St.data.xp === before && res.gained === 0 && res.noXpReason === 'rank', `prácticas de la etapa ${tier} ya no dan XP`);
}

// 4) No se puede llegar a Lead: esa etapa todavía no existe.
completeTier(3);
for (let i = 0; i < 1000; i++) for (const mod of Cu.MODULES) St.completeMission(practice(mod, 'large'), 0);
ok(St.rankIndex() === 3, 'miles de prácticas no llevan a Lead');
St.data.xp = 1e7;
ok(St.rankIndex() === 3, 'ni siquiera con XP infinita (faltan los niveles de Lead)');

// 5) El rango alcanzado no baja.
St.data.xp = 0;
ok(St.rankIndex() === 3, 'el rango alcanzado no baja');

// 6) Las tareas obligatorias repetidas no suman XP de nuevo.
const xp0 = St.data.xp;
St.completeMission(story(Cu.requiredIds(mod1)[0]), 0);
ok(St.data.xp === xp0, 'repetir una tarea obligatoria no suma XP');

// 7) Los niveles de una etapa piden el rango correspondiente.
St.newGame(2, 'Test2');
completeTier(0);
ok(!!Cu.lockReason(Cu.tierModules(1)[0]) === (St.rankIndex() < 1), 'el primer nivel Junior se abre recién al ser Junior');

console.log(`\n${passed} OK, ${failed} fallidos`);
process.exit(failed ? 1 : 0);
