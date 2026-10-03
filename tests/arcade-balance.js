/*
 * Simulador de balance del ARCADE: juega miles de partidas con jugadores de distinto nivel
 * usando las mismas reglas del juego (plazo por pedido, reserva con tope, velocidad y
 * penalizaciones por oleada) y muestra hasta dónde llega cada uno en cada rango.
 *
 * Modelo de jugador: tarda (k × esfuerzo del pedido) ± 25 %, y en cada pregunta se equivoca con
 * probabilidad pq (cada error: penalización + 12 s para corregir); con probabilidad pi entrega
 * incompleto una vez. El "esfuerzo" es el que estima el juego para un jugador promedio (k = 1).
 *
 * Ejecutar con: npm run balance   (o: node tests/arcade-balance.js [partidas])
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
AA.escapeHtml = AA.escapeHtml || ((s) => String(s));
const St = AA.State;
const Cu = AA.Curriculum;
const A = AA.Arcade;

const PLAYERS = [
  ['Experto', { k: 0.5, pq: 0.05, pi: 0.03 }],
  ['Bueno', { k: 0.75, pq: 0.1, pi: 0.06 }],
  ['Promedio', { k: 1.0, pq: 0.18, pi: 0.1 }],
  ['Novato', { k: 1.4, pq: 0.3, pi: 0.18 }],
];

function setRank(rank) {
  St.newGame(1, 'Sim');
  for (const m of Cu.MODULES) {
    if (m.tier > rank) break;
    St.data.lessons[m.id] = true;
  }
  St.data.xp = St.RANKS[rank].xp;
  St.data.rankReached = rank;
}

function play(rank, P) {
  let clock = A.START_TIME;
  let wave = 1;
  let missions = 0;
  let played = 0;
  A.run = { rank, wave, recent: [] };
  for (let guard = 0; guard < 300; guard++) {
    A.run.wave = wave;
    const m = A.newMission();
    clock = Math.min(clock, A.RESERVE_CAP) + A.budgetFor(m.effort, wave);
    const q = m.objectives.filter((o) => o.answer).length;
    let t = m.effort * P.k * (0.75 + Math.random() * 0.5);
    let pen = 0;
    for (let i = 0; i < q; i++)
      while (Math.random() < P.pq) {
        pen += A.penaltyOf('wrong', wave);
        t += 12 * P.k;
      }
    if (Math.random() < P.pi) {
      pen += A.penaltyOf('incomplete', wave);
      t += 20 * P.k;
    }
    const sp = A.speed(wave);
    if (t * sp + pen >= clock) return { missions, wave, played: played + Math.max(0, clock - pen) / sp };
    clock -= t * sp + pen;
    played += t;
    missions++;
    if (missions % A.PER_WAVE === 0) wave++;
  }
  return { missions, wave, played };
}

const N = Number(process.argv[2]) || 400;
const q = (a, p) => [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))];
const fmt = (secs) => {
  const s = Math.round(secs);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
console.log(`ARCADE · ${N} partidas por jugador y rango\n`);
const RANK = ['', 'Junior', 'Semi-Senior', 'Senior'];
console.log('Rango         Jugador    Misiones (p10–p90)   Oleada   Duración   Ritmo');
for (const rank of [1, 2, 3]) {
  setRank(rank);
  for (const [name, P] of PLAYERS) {
    const rs = Array.from({ length: N }, () => play(rank, P));
    const ms = rs.map((r) => r.missions);
    const ws = rs.map((r) => r.wave);
    const ds = rs.map((r) => r.played);
    const pace = rs.map((r) => (r.played > 0 ? r.missions / (r.played / 60) : 0));
    console.log(
      `${RANK[rank].padEnd(13)} ${name.padEnd(10)} ${String(q(ms, 0.5)).padStart(3)} (${q(ms, 0.1)}–${q(ms, 0.9)})`.padEnd(46) +
        `${String(q(ws, 0.5)).padStart(4)}   ${fmt(q(ds, 0.5)).padStart(8)}   ${q(pace, 0.5).toFixed(2)}`
    );
  }
  // Esfuerzo y plazo típicos por oleada
  const row = [];
  for (const w of [1, 3, 5, 7]) {
    A.run = { rank, wave: w, recent: [] };
    const e = Array.from({ length: 120 }, () => A.newMission().effort);
    const med = q(e, 0.5);
    row.push(`ola ${w}: esfuerzo ${fmt(med)} → plazo ${fmt(A.budgetFor(med, w))} (×${A.speed(w).toFixed(1)})`);
  }
  console.log('   ' + row.join(' · ') + '\n');
}
