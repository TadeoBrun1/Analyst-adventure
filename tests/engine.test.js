/* Tests del motor de fórmulas. Ejecutar con: node tests/engine.test.js */
'use strict';
require('../js/engine/formula.js');
require('../js/engine/sheet.js');

const AA = globalThis.AA;
const F = AA.Formula;
let passed = 0;
let failed = 0;

function show(v) {
  return F.isErr(v) ? v.code : JSON.stringify(v);
}
function eq(actual, expected, label) {
  const ok =
    typeof expected === 'number' && typeof actual === 'number'
      ? Math.abs(actual - expected) < 1e-9
      : typeof expected === 'string' && expected.startsWith('#')
        ? F.isErr(actual) && actual.code === expected
        : actual === expected;
  if (ok) passed++;
  else {
    failed++;
    console.error(`✗ ${label}: esperado ${JSON.stringify(expected)}, obtuve ${show(actual)}`);
  }
}

function sheetWith(data) {
  const s = new AA.Sheet(12, 40);
  for (const [ref, input] of Object.entries(data)) {
    const p = F.parseRef(ref);
    s.setInput(p.col, p.row, input, true);
  }
  return s;
}
function calc(s, formula) {
  s.setInput(11, 39, formula, true);
  return s.getValue(11, 39);
}

// --- Aritmética y precedencia
const s0 = sheetWith({});
eq(calc(s0, '=1+2*3'), 7, 'precedencia');
eq(calc(s0, '=(1+2)*3'), 9, 'paréntesis');
eq(calc(s0, '=2^3^2'), 64, 'potencia izq-der');
eq(calc(s0, '=-2^2'), 4, 'unario antes de ^ (como Excel)');
eq(calc(s0, '=10%'), 0.1, 'porcentaje');
eq(calc(s0, '=1/0'), '#DIV/0!', 'div0');
eq(calc(s0, '="a"&"b"&1'), 'ab1', 'concatenación');
eq(calc(s0, '=1=1'), true, 'igualdad');
eq(calc(s0, '="Hola"="hola"'), true, 'texto sin mayúsculas');
eq(calc(s0, '=FOO(1)'), '#NAME?', 'función desconocida');
eq(calc(s0, '=hola'), '#NAME?', 'nombre suelto');
eq(calc(s0, '=SUMA(1;2'), '#ERROR!', 'paréntesis sin cerrar');

// --- Referencias y funciones básicas
const s1 = sheetWith({ A1: '10', A2: '20', A3: '30', A4: 'texto', A5: '', B1: '=A1*2', B2: '=B1+A2' });
eq(s1.val('B1'), 20, 'referencia simple');
eq(s1.val('B2'), 40, 'cadena de referencias');
eq(calc(s1, '=SUMA(A1:A5)'), 60, 'SUMA ignora texto en rangos');
eq(calc(s1, '=SUM(A1:A3, 5)'), 65, 'SUM con coma');
eq(calc(s1, '=PROMEDIO(A1:A4)'), 20, 'PROMEDIO');
eq(calc(s1, '=MAX(A1:A3)'), 30, 'MAX');
eq(calc(s1, '=MIN(A1:A3)'), 10, 'MIN');
eq(calc(s1, '=CONTAR(A1:A5)'), 3, 'CONTAR');
eq(calc(s1, '=CONTARA(A1:A5)'), 4, 'CONTARA');
eq(calc(s1, '=CONTAR.BLANCO(A1:A5)'), 1, 'CONTAR.BLANCO');
eq(calc(s1, '=A1+A4'), '#VALUE!', 'suma con texto');
eq(calc(s1, '=SUMA(A:A)'), 60, 'rango de columna completa');
eq(calc(s1, '=REDONDEAR(2.345; 2)'), 2.35, 'REDONDEAR');
eq(calc(s1, '=REDONDEAR(1.005; 2)'), 1.01, 'REDONDEAR caso flotante');

// --- Circularidad
const s2 = sheetWith({ A1: '=B1', B1: '=A1' });
eq(s2.val('A1'), '#CIRC!', 'circular');

// --- Lógica
const s3 = sheetWith({ C2: '35000', D2: '35000' });
eq(calc(s3, '=SI(C2>=D2;"Sí";"No")'), 'Sí', 'SI con >=');
eq(calc(s3, '=IF(C2>D2,"Sí","No")'), 'No', 'IF con >');
eq(calc(s3, '=SI(C2>=D2; C2*10%; 0)'), 3500, 'SI con porcentaje');
eq(calc(s3, '=Y(C2>0; D2>0)'), true, 'Y');
eq(calc(s3, '=O(C2>99999; D2>99999)'), false, 'O');
eq(calc(s3, '=SI.ERROR(1/0; "x")'), 'x', 'SI.ERROR');

// --- Texto
eq(F.callByName('ESPACIOS', ['  juan   pérez  ']), 'juan pérez', 'ESPACIOS');
eq(F.callByName('NOMPROPIO', ['mARÍA gómez']), 'María Gómez', 'NOMPROPIO con acentos');
eq(F.callByName('MINUSC', ['JUAN@MAIL.COM']), 'juan@mail.com', 'MINUSC');
eq(F.callByName('MAYÚSC', ['salta']), 'SALTA', 'MAYUSC con acento en el nombre');
eq(F.callByName('LARGO', [' ab ']), 4, 'LARGO');
eq(F.callByName('IZQUIERDA', ['Córdoba', 3]), 'Cór', 'IZQUIERDA');
eq(F.callByName('SUSTITUIR', ['1-2-3', '-', '']), '123', 'SUSTITUIR');

// --- Condicionales
const s4 = sheetWith({
  B1: 'Norte', B2: 'Sur', B3: 'Norte', B4: 'Centro',
  C1: '100', C2: '200', C3: '300', C4: '50',
  D1: 'Demorado', D2: 'Demorado', D3: 'Entregado', D4: 'Demorado',
});
eq(calc(s4, '=CONTAR.SI(B1:B4;"Norte")'), 2, 'CONTAR.SI texto');
eq(calc(s4, '=CONTAR.SI(C1:C4;">100")'), 2, 'CONTAR.SI >');
eq(calc(s4, '=CONTAR.SI(B1:B4;"<>Norte")'), 2, 'CONTAR.SI <>');
eq(calc(s4, '=CONTAR.SI(B1:B4;"N*")'), 2, 'CONTAR.SI comodín');
eq(calc(s4, '=SUMAR.SI(B1:B4;"Norte";C1:C4)'), 400, 'SUMAR.SI');
eq(calc(s4, '=COUNTIFS(B1:B4,"Norte",D1:D4,"Demorado")'), 1, 'COUNTIFS');
eq(calc(s4, '=SUMAR.SI.CONJUNTO(C1:C4;B1:B4;"<>Sur";D1:D4;"Demorado")'), 150, 'SUMAR.SI.CONJUNTO');
eq(calc(s4, '=PROMEDIO.SI(B1:B4;"Norte";C1:C4)'), 200, 'PROMEDIO.SI');

// --- Búsqueda
const s5 = sheetWith({ A1: 'P1', B1: 'Teclado', A2: 'P2', B2: 'Mouse', A3: 'P3', B3: 'Monitor', E1: '1', E2: '5', E3: '10' });
eq(calc(s5, '=BUSCARV("P2";A1:B3;2;FALSO)'), 'Mouse', 'BUSCARV exacto');
eq(calc(s5, '=BUSCARV("P9";A1:B3;2;FALSO)'), '#N/A', 'BUSCARV no encontrado');
eq(calc(s5, '=VLOOKUP(7,E1:E3,1)'), 5, 'VLOOKUP aproximado');
eq(calc(s5, '=BUSCARX("P3";A1:A3;B1:B3)'), 'Monitor', 'BUSCARX');
eq(calc(s5, '=COINCIDIR("P3";A1:A3;0)'), 3, 'COINCIDIR');
eq(calc(s5, '=INDICE(A1:B3;2;2)'), 'Mouse', 'INDICE');

// --- Desplazamiento de referencias (copiar/rellenar)
eq(F.shiftFormula('=C2*D2', 0, 1), '=C3*D3', 'shift relativo');
eq(F.shiftFormula('=CONTAR.SI($B$2:$B$25;H2)', 0, 3), '=CONTAR.SI($B$2:$B$25;H5)', 'shift absoluto');
eq(F.shiftFormula('=A$1+$A1', 1, 1), '=B$1+$A2', 'shift mixto');
eq(F.shiftFormula('="A1"&A1', 0, 1), '="A1"&A2', 'shift no toca textos');
eq(F.shiftFormula('=A1', 0, -1), '=#REF!', 'shift fuera de la hoja');
eq(F.toggleAbsolute('=A1+B2', 2).text, '=$A$1+B2', 'F4 una vez');
eq(F.toggleAbsolute('=$A$1', 3).text, '=A$1', 'F4 dos veces');
eq(F.toggleAbsolute('=CONTAR.SI(B2:B25', 17).text, '=CONTAR.SI($B$2:$B$25', 'F4 sobre un rango');
eq(F.toggleAbsolute('=CONTAR.SI(B2:B25', 17).caret, 21, 'F4 deja el cursor al final del rango');
eq(F.toggleAbsolute('=SUMA(A1:A3)+B1', 7).text, '=SUMA($A$1:$A$3)+B1', 'F4 en el primer extremo');

// --- Entrada de celdas
eq(AA.parseCellInput('  12 ').v, 12, 'número con espacios');
eq(AA.parseCellInput("'123").v, '123', 'apóstrofo fuerza texto');
eq(AA.parseCellInput('10%').v, 0.1, 'porcentaje literal');
const s6 = new AA.Sheet(3, 3);
s6.setValue(0, 0, '123');
eq(s6.getInput(0, 0), "'123", 'texto numérico se muestra con apóstrofo');
s6.setInput(1, 0, s6.getInput(0, 0));
eq(s6.getValue(1, 0), '123', 'ida y vuelta conserva el texto');

// --- Análisis
const info = F.analyze('=SUM(C2:E2)+promedio(A1)');
eq(info.funcs.has('SUMA') && info.funcs.has('PROMEDIO'), true, 'analyze funciones canónicas');
eq(info.refs.has('A1'), true, 'analyze refs');

// --- Varias hojas (libro)
const wb = new AA.Workbook();
const hp = wb.add('Pedidos', new AA.Sheet(8, 20));
const hq = wb.add('Productos', new AA.Sheet(4, 20));
const hl = wb.add('Lista de precios', new AA.Sheet(4, 20));
[['P1', 10], ['P2', 20], ['P3', 30]].forEach(([k, v], i) => {
  hq.setInput(0, i, k, true);
  hq.setInput(1, i, String(v), true);
});
hl.setInput(0, 0, '5', true);
hp.setInput(0, 0, 'P2', true);
const at = (ref, f) => {
  const p = F.parseRef(ref);
  hp.setInput(p.col, p.row, f, true);
  return hp.getValue(p.col, p.row);
};
eq(at('B1', '=BUSCARV(A1;Productos!A:B;2;FALSO)'), 20, 'BUSCARV en otra hoja (columnas enteras)');
eq(at('C1', '=VLOOKUP(A1,Productos!$A$1:$B$3,2,FALSE)'), 20, 'VLOOKUP con rango fijo de otra hoja');
eq(at('D1', '=BUSCARX(A1;Productos!A1:A3;Productos!B1:B3)'), 20, 'BUSCARX entre hojas');
eq(at('E1', "='Lista de precios'!A1*2"), 10, 'hoja con espacios entre comillas');
eq(at('F1', '=SUMA(productos!B:B)'), 60, 'nombre de hoja sin distinguir mayúsculas');
eq(at('G1', '=Nada!A1'), '#REF!', 'hoja inexistente');
eq(at('H1', '=SUMA(Productos!A1:Pedidos!B2)'), '#ERROR!', 'un rango no abarca dos hojas');
hq.setInput(1, 1, '99', true);
eq(hp.val('B1'), 99, 'cambiar otra hoja recalcula');
eq(F.shiftFormula('=BUSCARV(A1;Productos!$A$1:B5;2)', 0, 1), '=BUSCARV(A2;Productos!$A$1:B6;2)', 'copiar respeta el prefijo de hoja');
eq(F.toggleAbsolute('=Productos!A1', 12).text, '=Productos!$A$1', 'F4 con prefijo de hoja');
eq(F.formulaRefs('=Productos!A1:B3+C2').length, 1, 'solo se resaltan las referencias de la hoja actual');
eq(F.analyze('=BUSCARX(A2;Productos!A:A;Productos!C:C)').sheets.has('PRODUCTOS'), true, 'analyze detecta hojas usadas');
eq(F.sheetPrefix('Lista de precios'), "'Lista de precios'!", 'prefijo con comillas');
eq(F.sheetPrefix('Ventas'), 'Ventas!', 'prefijo simple');
// Ciclo entre hojas
hq.setInput(3, 0, '=Pedidos!A10', true);
hp.setInput(0, 9, '=Productos!D1', true);
eq(hp.val('A10'), '#CIRC!', 'referencia circular entre hojas');

// --- Estadística
const st = sheetWith({ A1: '1', A2: '2', A3: '3', A4: '4', A5: '100', B1: '2', B2: '4', B3: '6', B4: '8', B5: '10' });
eq(calc(st, '=MEDIANA(A1:A5)'), 3, 'mediana resiste valores extremos');
eq(calc(st, '=PERCENTIL(A1:A4;0.5)'), 2.5, 'percentil interpolado');
eq(calc(st, '=CUARTIL(A1:A5;1)'), 2, 'cuartil 1');
eq(calc(st, '=COEF.DE.CORREL(A1:A4;B1:B4)'), 1, 'correlación perfecta');
eq(calc(st, '=PENDIENTE(B1:B4;A1:A4)'), 2, 'pendiente');
eq(calc(st, '=VAR(A1:A4)'), 1.6666666666666667, 'varianza');
eq(Math.round(calc(st, '=DISTR.NORM.ESTAND.N(1.96;VERDADERO)') * 1000) / 1000, 0.975, 'normal estándar');
eq(calc(st, '=PERCENTIL(A1:A4;2)'), '#NUM!', 'percentil fuera de rango');

console.log(`\n${passed} OK, ${failed} fallidos`);
process.exit(failed ? 1 : 0);
