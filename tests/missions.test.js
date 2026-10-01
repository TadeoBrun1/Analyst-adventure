/*
 * Resuelve cada misión con las fórmulas "de manual" y verifica que todos los objetivos
 * se cumplan; también prueba errores típicos que NO deberían aceptarse.
 * Ejecutar con: node tests/missions.test.js
 */
'use strict';
require('../js/engine/formula.js');
require('../js/engine/sheet.js');
require('../js/game/validators.js');
require('../js/game/missions/registry.js');
require('../js/game/missions/stage1.js');

const AA = globalThis.AA;
const F = AA.Formula;
let passed = 0;
let failed = 0;

function setup(id, inputs) {
  const m = AA.Missions.byId(id);
  const sh = AA.Missions.buildSheet(m.sheet);
  for (const [ref, input] of Object.entries(inputs)) {
    const p = F.parseRef(ref);
    sh.setInput(p.col, p.row, input, true);
  }
  return { m, sh, S: AA.V.query(sh) };
}
// Rellena una fórmula hacia abajo como lo haría el controlador de relleno.
function fillDown(inputs, col, r1, r2, formula) {
  for (let r = r1; r <= r2; r++) inputs[col + r] = F.shiftFormula(formula, 0, r - r1);
  return inputs;
}
function expectObjective(id, inputs, index, expected, label, answer) {
  const { m, S } = setup(id, inputs);
  const o = m.objectives[index];
  const res = o.answer ? o.answer(answer) : o.check(S);
  const ok = expected === 'note' ? typeof res === 'string' : res === expected;
  if (ok) passed++;
  else {
    failed++;
    console.error(`✗ [${id} #${index + 1}] ${label}: esperado ${expected}, obtuve ${JSON.stringify(res)}`);
  }
}
function expectAll(id, inputs, answers) {
  const { m, S } = setup(id, inputs);
  m.objectives.forEach((o, i) => {
    const res = o.answer ? o.answer(answers[i]) : o.check(S);
    if (res === true) passed++;
    else {
      failed++;
      console.error(`✗ [${id} #${i + 1}] solución correcta rechazada: ${JSON.stringify(res)}`);
    }
  });
}

// --- M1
const m1 = fillDown({ E1: 'Total' }, 'E', 2, 11, '=C2*D2');
expectAll('m1_pedidos', m1, { 3: 'Notebook' });
expectObjective('m1_pedidos', { E2: '75' }, 1, 'note', 'valor escrito a mano');
expectObjective('m1_pedidos', { E2: '=3*25' }, 1, 'note', 'fórmula con números fijos');
expectObjective('m1_pedidos', { E2: '=C2*D2', E3: '=C2*D2' }, 2, 'note', 'relleno incompleto');
expectObjective('m1_pedidos', {}, 3, false, 'respuesta incorrecta', 'Escritorio');

// --- M2
const m2 = fillDown({}, 'F', 2, 13, '=SUMA(C2:E2)');
Object.assign(m2, { I2: '=SUMA(F2:F13)', I3: '=PROMEDIO(F2:F13)', I4: '=MAX(F2:F13)', I5: '=MIN(F2:F13)', I6: '=CONTARA(A2:A13)' });
expectAll('m2_resumen', m2, { 5: 'Carla Méndez' });
const m2en = fillDown({}, 'F', 2, 13, '=SUM(C2:E2)');
Object.assign(m2en, { I2: '=SUM(F:F)', I3: '=AVERAGE(F2:F13)', I4: '=MAX(F2:F13)', I5: '=MIN(F2:F13)', I6: '=COUNT(F2:F13)' });
expectAll('m2_resumen', m2en, { 5: 'carla' });
expectObjective('m2_resumen', fillDown({}, 'F', 2, 13, '=C2+D2+E2'), 0, 'note', 'sin SUMA');
expectObjective('m2_resumen', { I3: '=SUMA(F2:F13)/12' }, 2, 'note', 'promedio sin PROMEDIO');

// --- M3
const m3 = fillDown({}, 'E', 2, 13, '=SI(C2>=D2;"Sí";"No")');
fillDown(m3, 'F', 2, 13, '=SI(E2="Sí";C2*10%;0)');
m3.I2 = '=SUMA(F2:F13)';
expectAll('m3_bonos', m3, { 3: '7', 4: 'Sí' });
const m3b = fillDown({}, 'E', 2, 13, '=IF(C2>=D2,"Si","No")');
fillDown(m3b, 'F', 2, 13, '=IF(C2>=D2,C2*0.1,0)');
m3b.I2 = '=SUM(F2:F13)';
expectAll('m3_bonos', m3b, { 3: '7', 4: 'si' });
expectObjective('m3_bonos', fillDown({}, 'E', 2, 13, '=SI(C2>D2;"Sí";"No")'), 0, 'note', '> en vez de >=');
expectObjective('m3_bonos', {}, 4, false, 'Valeria no cobra', 'No');

// --- M4
const m4 = fillDown({}, 'E', 2, 13, '=NOMPROPIO(ESPACIOS(A2))');
fillDown(m4, 'F', 2, 13, '=MINUSC(ESPACIOS(B2))');
fillDown(m4, 'G', 2, 13, '=PROPER(TRIM(C2))');
expectAll('m4_limpieza', m4, { 3: '9' });
expectObjective('m4_limpieza', fillDown({}, 'E', 2, 13, '=NOMPROPIO(A2)'), 0, 'note', 'sin ESPACIOS');
expectObjective('m4_limpieza', fillDown({}, 'F', 2, 13, '=ESPACIOS(B2)'), 1, 'note', 'sin MINUSC');
expectObjective('m4_limpieza', {}, 3, false, 'contó sin deduplicar', '12');

// --- M5
const m5 = fillDown({}, 'I', 2, 5, '=CONTAR.SI($B$2:$B$25;H2)');
fillDown(m5, 'J', 2, 5, '=SUMAR.SI($B$2:$B$25;H2;$E$2:$E$25)');
fillDown(m5, 'K', 2, 5, '=CONTAR.SI.CONJUNTO($B$2:$B$25;H2;$D$2:$D$25;"Demorado")');
expectAll('m5_envios', m5, { 3: 'Sur', 4: 'LogiExpress' });
const m5cols = fillDown({}, 'I', 2, 5, '=COUNTIF(B:B,H2)');
fillDown(m5cols, 'J', 2, 5, '=SUMIF(B:B,H2,E:E)');
fillDown(m5cols, 'K', 2, 5, '=COUNTIFS(B:B,H2,D:D,"Demorado")');
expectAll('m5_envios', m5cols, { 3: 'sur', 4: 'logiexpress' });
const noDollar = fillDown({}, 'I', 2, 5, '=CONTAR.SI(B2:B25;H2)');
const { m: mm5, S: s5 } = setup('m5_envios', noDollar);
const res5 = mm5.objectives[0].check(s5);
if (typeof res5 === 'string' && res5.includes('$')) passed++;
else {
  failed++;
  console.error('✗ [m5_envios #1] sin $ debería sugerir referencias absolutas:', res5);
}

console.log(`\n${passed} OK, ${failed} fallidos`);
process.exit(failed ? 1 : 0);
