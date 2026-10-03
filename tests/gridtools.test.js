/*
 * Herramientas de la planilla (filtro, buscar, resaltar): reglas de las condiciones.
 * Ejecutar con: node tests/gridtools.test.js
 */
'use strict';
require('../js/engine/formula.js');
require('../js/i18n/i18n.js');
require('../js/ui/grid-tools.js');

const AA = globalThis.AA;
const { matches, toNum, describe } = AA.GridTools;
let ok = 0;
let bad = 0;
function check(name, got, want) {
  if (got === want) ok++;
  else {
    bad++;
    console.error(`✗ ${name}: esperaba ${JSON.stringify(want)}, salió ${JSON.stringify(got)}`);
  }
}

// Números escritos de distintas formas
check('toNum 12', toNum(12), 12);
check('toNum "12"', toNum('12'), 12);
check('toNum "3,5"', toNum('3,5'), 3.5);
check('toNum "1,250"', toNum('1,250'), 1250);
check('toNum "$1,250.50"', toNum('$1,250.50'), 1250.5);
check('toNum "15%"', toNum('15%'), 0.15);
check('toNum "-4"', toNum('-4'), -4);
check('toNum texto', toNum('Norte'), null);
check('toNum vacío', toNum(''), null);
check('toNum booleano', toNum(true), null);

// Comparaciones numéricas
const R = (op, a, b) => ({ op, a, b });
check('lt 9<10', matches(9, R('lt', '10')), true);
check('lt 10<10', matches(10, R('lt', '10')), false);
check('le 10<=10', matches(10, R('le', '10')), true);
check('gt texto', matches('Norte', R('gt', '10')), false);
check('ge', matches(10, R('ge', '10')), true);
check('between', matches(150, R('between', '100', '200')), true);
check('between al revés', matches(150, R('between', '200', '100')), true);
check('between afuera', matches(250, R('between', '100', '200')), false);
check('eq número', matches(10, R('eq', '10')), true);
check('eq número texto', matches('10', R('eq', '10.0')), true);
check('ne', matches(11, R('ne', '10')), true);

// Texto (sin distinguir mayúsculas)
check('eq texto', matches('Norte', R('eq', 'norte')), true);
check('eq texto con espacios', matches(' Norte ', R('eq', 'Norte')), true);
check('contains', matches('Zona Norte', R('contains', 'NORTE')), true);
check('notcontains', matches('Zona Sur', R('notcontains', 'norte')), true);
check('begins', matches('Teclado', R('begins', 'tec')), true);
check('begins no', matches('Mouse', R('begins', 'tec')), false);

// Vacías
check('blank', matches('', R('blank')), true);
check('blank null', matches(null, R('blank')), true);
check('nonblank', matches(0, R('nonblank')), true);

// Los N mayores / menores
const vals = [5, 40, 12, 7, 33, 21, 9];
check('top 3 incluye 40', matches(40, R('top', '3'), { values: vals }), true);
check('top 3 incluye 21', matches(21, R('top', '3'), { values: vals }), true);
check('top 3 excluye 12', matches(12, R('top', '3'), { values: vals }), false);
check('bottom 2 incluye 5', matches(5, R('bottom', '2'), { values: vals }), true);
check('bottom 2 incluye 7', matches(7, R('bottom', '2'), { values: vals }), true);
check('bottom 2 excluye 9', matches(9, R('bottom', '2'), { values: vals }), false);
check('top con texto', matches('x', R('top', '3'), { values: vals }), false);

// Errores de fórmula nunca cumplen
check('error', matches({ code: '#DIV/0!', detail: '' }, R('nonblank')), AA.Formula.isErr({ code: '#DIV/0!' }) ? false : true);

// Descripciones
AA.setLang('es');
check('describe lt', describe(R('lt', '10')), 'menor que «10»');
check('describe between', describe(R('between', '1', '5')), 'entre 1 y 5');
check('describe top', describe(R('top', '5')), 'los 5 mayores');
AA.setLang('en');
check('describe en', describe(R('blank')), 'is blank');

console.log(`${bad ? '✗' : '✓'} Herramientas de la planilla: ${ok} OK, ${bad} con error`);
process.exit(bad ? 1 : 0);
