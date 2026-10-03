/*
 * Logros del ARCADE y decoración de la oficina:
 *   - definiciones completas (12 o más logros, cada uno con una recompensa distinta),
 *   - se desbloquean con las partidas y se acumulan las estadísticas,
 *   - la decoración solo se puede poner si está desbloqueada,
 *   - con toda la decoración puesta se sigue pudiendo llegar a todos los lugares de la oficina.
 * Ejecutar con: node tests/achievements.test.js
 */
'use strict';
require('../js/engine/formula.js');
require('../js/i18n/i18n.js');
require('../js/game/state.js');
require('../js/game/decor.js');
require('../js/game/achievements.js');
require('../js/game/office.js');
require('../js/game/audio.js');

const AA = globalThis.AA;
const mem = {};
AA.Storage = { readSlot: (i) => mem[i] || null, writeSlot: (i, t) => (mem[i] = t), deleteSlot: (i) => delete mem[i] };
AA.escapeHtml = AA.escapeHtml || ((s) => String(s));
const St = AA.State;
const A = AA.Achievements;
const D = AA.Decor;
let passed = 0;
let failed = 0;
const ok = (cond, label) => {
  if (cond) passed++;
  else {
    failed++;
    console.error('✗ ' + label);
  }
};

// --- Definiciones
ok(A.LIST.length >= 12, `al menos 12 logros (hay ${A.LIST.length})`);
ok(new Set(A.LIST.map((a) => a.id)).size === A.LIST.length, 'ids de logros únicos');
ok(new Set(A.LIST.map((a) => a.reward)).size === A.LIST.length, 'cada logro da una recompensa distinta');
for (const a of A.LIST) {
  ok(!!D.byId(a.reward), `${a.id}: la recompensa ${a.reward} existe`);
  for (const lang of ['es', 'en']) ok(a.name[lang] && a.goal[lang], `${a.id}: nombre y objetivo en ${lang}`);
}
for (const it of D.ITEMS) {
  ok(!!A.achievementFor(it.id), `${it.id}: algún logro lo desbloquea`);
  ok(it.name.es && it.name.en && it.desc.es && it.desc.en && it.icon, `${it.id}: nombre, descripción e ícono`);
  ok(Array.isArray(it.box) && it.box.length === 4 && typeof it.paint === 'function', `${it.id}: se puede dibujar (vista previa)`);
}

// --- Desbloqueo con partidas
St.newGame(1, 'Logros');
const run = (o) => Object.assign({ rank: 1, missions: 0, wave: 1, times: [], streak: 0, maxStreak: 0, minClock: null, achieved: [] }, o);
ok(A.count() === 0, 'partida nueva: sin logros');
ok(!D.unlocked('ficus') && (D.set('ficus', true), !D.on('ficus')), 'no se puede poner un objeto bloqueado');

let got = A.check(run({ missions: 1, times: [200] })).map((a) => a.id);
ok(got.length === 1 && got[0] === 'first', 'primera misión → «Primer pedido»');
ok(D.unlocked('ficus') && D.on('ficus'), 'el ficus queda desbloqueado (y se puede poner)');
ok(St.data.flags.chestNew, 'aviso en el cofre');

const r1 = run({ missions: 4, wave: 2, times: [100, 230, 400, 700], maxStreak: 4, minClock: 40 });
got = A.finishRun(r1).map((a) => a.id);
ok(got.includes('warmup') && got.includes('fast3') && !got.includes('six'), `4 misiones (3 en 6:40): calentando motores + contrarreloj (${got})`);
ok(A.stats().runs === 1 && A.stats().missions === 4, 'estadísticas: 1 partida, 4 misiones');

got = A.finishRun(run({ missions: 7, wave: 3, times: [60, 120, 200, 300, 400, 900, 1000], maxStreak: 5, minClock: 9 })).map((a) => a.id);
ok(['six', 'wave3', 'fast6', 'steady', 'cold'].every((x) => got.includes(x)), `7 misiones rápidas sin errores y al límite: ${got}`);
ok(A.stats().missions === 11 && A.stats().bestMissions === 7, 'se suman misiones y se guarda la mejor partida');
ok(!A.unlocked('marathon'), 'maratón todavía no (11/25)');
for (let i = 0; i < 4; i++) A.finishRun(run({ missions: 4, wave: 2, times: [500, 1000, 1500, 2000] }));
ok(A.unlocked('marathon') && A.stats().missions === 27, 'maratón: 25 misiones sumando partidas');
ok(!A.unlocked('regular'), 'cliente fiel todavía no (6 partidas)');
for (let i = 0; i < 4; i++) A.finishRun(run({ missions: 0 }));
ok(A.unlocked('regular'), 'cliente fiel: 10 partidas');

ok(!A.unlocked('allranks'), 'todoterreno todavía no (solo Junior)');
A.finishRun(run({ rank: 2, missions: 3 }));
A.finishRun(run({ rank: 3, missions: 9, wave: 4 }));
ok(A.unlocked('allranks') && A.unlocked('senior9'), 'todoterreno y senior bajo presión');
ok(!A.unlocked('wave7') && !A.unlocked('dozen'), 'oleada 7 y docena siguen bloqueados');
ok(A.unlocked('collector') && D.unlocked('dancebtn'), 'coleccionista: con 8 logros se desbloquea el botón de baile');
ok(A.progressText(A.byId('dozen')).includes('9/12'), `progreso de «Docena»: ${A.progressText(A.byId('dozen'))}`);
St.newGame(2, 'Pocos');
for (const id of ['first', 'warmup', 'six', 'wave3', 'fast3', 'fast6', 'steady']) St.data.achievements[id] = 1;
ok(A.check(run({ missions: 0 })).length === 0 && !A.unlocked('collector'), 'con 7 logros todavía no hay coleccionista');
St.data.achievements.cold = 1;
ok(A.check(run({ missions: 0 })).map((a) => a.id).join() === 'collector', 'con el octavo logro llega coleccionista');

// --- Tocadiscos: 3 vinilos con 8 compases de acordes y melodía
const V = AA.Audio.VINYLS;
ok(Object.keys(V).length === 3, 'el tocadiscos tiene 3 vinilos');
for (const [id, v] of Object.entries(V)) {
  ok(v.name.es && v.name.en && v.tempo > 60 && v.tempo < 180, `${id}: nombre y tempo`);
  ok(v.prog.length === 8 && v.mel.length === 8 && v.mel.every((bar) => bar.length === 8), `${id}: 8 compases de corcheas`);
  ok(v.prog.every((c) => c.n.length >= 3 && c.b > 20 && c.b < 60), `${id}: acordes con bajo`);
  ok(!!AA.Audio.TRACKS['vinyl_' + id], `${id}: tema registrado`);
}

// --- Oficina: con toda la decoración puesta se llega a todos lados
for (const a of A.LIST) St.data.achievements[a.id] = Date.now();
for (const it of D.ITEMS) D.set(it.id, true);
const O = AA.Office;
const MAP = O.MAP;
const solid = new Set(D.solidTiles().map(([x, y]) => x + ',' + y));
for (const [x, y] of D.solidTiles()) ok(O.WALKABLE.has(MAP[y][x]), `decoración sólida sobre piso libre (${x},${y})`);
const walk = (x, y) => MAP[y] && O.WALKABLE.has(MAP[y][x]) && !solid.has(x + ',' + y);
const seen = new Set(['14,8']);
const queue = [[14, 8]];
while (queue.length) {
  const [x, y] = queue.shift();
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const k = x + dx + ',' + (y + dy);
    if (!seen.has(k) && walk(x + dx, y + dy)) {
      seen.add(k);
      queue.push([x + dx, y + dy]);
    }
  }
}
for (const sp of O.SPOTS) {
  let reach = false;
  for (let x = sp.x - 1; x <= sp.x + sp.w; x++) for (let y = sp.y - 1; y <= sp.y + sp.h; y++) if (seen.has(x + ',' + y)) reach = true;
  ok(reach, `se llega a «${AA.L(sp.label)}» (${sp.x},${sp.y}) con toda la decoración puesta`);
}

console.log(`${failed ? '✗' : '✓'} Logros y decoración: ${passed} OK, ${failed} fallidos`);
process.exit(failed ? 1 : 0);
