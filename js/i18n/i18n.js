/*
 * Analyst Adventure — Idiomas (español / inglés).
 *   AA.T('texto en español', 'English text')  → texto en el idioma actual
 *   AA.L({ es: '...', en: '...' })             → idem para contenido guardado como objeto
 *   AA.fnName('SUMA')                          → 'SUMA' o 'SUM' según el idioma
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});

  AA.lang = 'es';
  AA.T = (es, en) => (AA.lang === 'en' && en !== undefined ? en : es);
  AA.L = (obj) => {
    if (obj === null || obj === undefined) return '';
    if (typeof obj !== 'object') return obj;
    return obj[AA.lang] !== undefined ? obj[AA.lang] : obj.es;
  };
  AA.setLang = (lang) => {
    AA.lang = lang === 'en' ? 'en' : 'es';
    if (typeof document !== 'undefined') document.documentElement.lang = AA.lang;
  };
  AA.detectLang = () => {
    const nav = typeof navigator !== 'undefined' ? navigator.language || '' : '';
    return /^es/i.test(nav) || !nav ? 'es' : 'en';
  };

  // Documentación de funciones en inglés (el motor guarda la versión en español).
  const EN = {
    SUMA: ['SUM', 'SUM(value1, [value2], ...)', 'Adds all the numbers in the given cells or ranges.', '=SUM(B2:B10)'],
    PROMEDIO: ['AVERAGE', 'AVERAGE(value1, [value2], ...)', 'Arithmetic mean (sum ÷ count) of the numbers.', '=AVERAGE(C2:C20)'],
    MAX: ['MAX', 'MAX(value1, [value2], ...)', 'Returns the largest number.', '=MAX(F2:F13)'],
    MIN: ['MIN', 'MIN(value1, [value2], ...)', 'Returns the smallest number.', '=MIN(F2:F13)'],
    MEDIANA: ['MEDIAN', 'MEDIAN(value1, [value2], ...)', 'The middle value of the sorted numbers.', '=MEDIAN(B2:B50)'],
    DESVEST: ['STDEV', 'STDEV(value1, [value2], ...)', 'Sample standard deviation: how far data spreads from the average.', '=STDEV(B2:B50)'],
    CONTAR: ['COUNT', 'COUNT(value1, [value2], ...)', 'Counts the cells that contain numbers.', '=COUNT(C2:C100)'],
    CONTARA: ['COUNTA', 'COUNTA(value1, [value2], ...)', 'Counts the cells that are NOT empty (numbers, text, anything).', '=COUNTA(A2:A100)'],
    'CONTAR.BLANCO': ['COUNTBLANK', 'COUNTBLANK(range)', 'Counts empty cells in a range. Great for spotting missing data.', '=COUNTBLANK(D2:D200)'],
    REDONDEAR: ['ROUND', 'ROUND(number, [digits])', 'Rounds a number to the given number of decimals.', '=ROUND(B2*1.21, 2)'],
    'REDONDEAR.MAS': ['ROUNDUP', 'ROUNDUP(number, [digits])', 'Rounds up (away from zero).', '=ROUNDUP(B2, 0)'],
    'REDONDEAR.MENOS': ['ROUNDDOWN', 'ROUNDDOWN(number, [digits])', 'Rounds down (toward zero).', '=ROUNDDOWN(B2, 0)'],
    ENTERO: ['INT', 'INT(number)', 'Rounds down to the nearest integer.', '=INT(B2)'],
    ABS: ['ABS', 'ABS(number)', 'Absolute value: the number without its sign.', '=ABS(C2-B2)'],
    RESIDUO: ['MOD', 'MOD(number, divisor)', 'Remainder of a division.', '=MOD(A2, 2)'],
    POTENCIA: ['POWER', 'POWER(number, power)', 'Raises a number to a power. Same as number^power.', '=POWER(2, 10)'],
    RAIZ: ['SQRT', 'SQRT(number)', 'Square root.', '=SQRT(16)'],
    PRODUCTO: ['PRODUCT', 'PRODUCT(value1, [value2], ...)', 'Multiplies all the numbers.', '=PRODUCT(B2:D2)'],
    SI: ['IF', 'IF(logical_test, value_if_true, [value_if_false])', 'If the condition is met returns one value; otherwise, another.', '=IF(C2>=D2, "Yes", "No")'],
    'SI.CONJUNTO': ['IFS', 'IFS(condition1, value1, [condition2, value2], ...)', 'Checks several conditions in order and returns the value of the first true one.', '=IFS(B2>=90, "A", B2>=70, "B", TRUE, "C")'],
    'SI.ERROR': ['IFERROR', 'IFERROR(value, value_if_error)', 'If the first value is an error (#N/A, #DIV/0!…), returns the second.', '=IFERROR(B2/C2, 0)'],
    Y: ['AND', 'AND(condition1, [condition2], ...)', 'TRUE if ALL conditions are met.', '=AND(C2>=5, D2>=1000)'],
    O: ['OR', 'OR(condition1, [condition2], ...)', 'TRUE if AT LEAST ONE condition is met.', '=OR(B2="North", B2="South")'],
    NO: ['NOT', 'NOT(condition)', 'Inverts a logical value.', '=NOT(ISBLANK(A2))'],
    ESPACIOS: ['TRIM', 'TRIM(text)', 'Removes spaces at the start and end, and leaves single spaces between words.', '=TRIM(A2)'],
    MAYUSC: ['UPPER', 'UPPER(text)', 'Converts text to UPPERCASE.', '=UPPER(A2)'],
    MINUSC: ['LOWER', 'LOWER(text)', 'Converts text to lowercase.', '=LOWER(B2)'],
    NOMPROPIO: ['PROPER', 'PROPER(text)', 'Capitalizes The First Letter Of Each Word.', '=PROPER(A2)'],
    LARGO: ['LEN', 'LEN(text)', 'Number of characters in a text (spaces count too).', '=LEN(A2)'],
    IZQUIERDA: ['LEFT', 'LEFT(text, [count])', 'Returns the first characters of a text.', '=LEFT(A2, 3)'],
    DERECHA: ['RIGHT', 'RIGHT(text, [count])', 'Returns the last characters of a text.', '=RIGHT(A2, 4)'],
    EXTRAE: ['MID', 'MID(text, start, count)', 'Extracts characters from the middle of a text.', '=MID(A2, 4, 3)'],
    CONCATENAR: ['CONCATENATE', 'CONCATENATE(text1, [text2], ...)', 'Joins several texts into one. You can also use the & operator.', '=CONCATENATE(A2, " ", B2)'],
    UNIRCADENAS: ['TEXTJOIN', 'TEXTJOIN(delimiter, ignore_empty, text1, ...)', 'Joins texts with a delimiter between them.', '=TEXTJOIN(", ", TRUE, A2:A5)'],
    SUSTITUIR: ['SUBSTITUTE', 'SUBSTITUTE(text, old_text, new_text, [instance])', 'Replaces a piece of text with another inside a cell.', '=SUBSTITUTE(A2, "-", "")'],
    VALOR: ['VALUE', 'VALUE(text)', 'Turns a text that looks like a number into a real number.', '=VALUE(B2)'],
    ENCONTRAR: ['FIND', 'FIND(find_text, within_text, [start])', 'Position of a text inside another (case-sensitive).', '=FIND("@", B2)'],
    HALLAR: ['SEARCH', 'SEARCH(find_text, within_text, [start])', 'Like FIND but not case-sensitive.', '=SEARCH("gmail", B2)'],
    ESBLANCO: ['ISBLANK', 'ISBLANK(value)', 'TRUE if the cell is empty.', '=ISBLANK(D2)'],
    ESNUMERO: ['ISNUMBER', 'ISNUMBER(value)', 'TRUE if the value is a number (handy for numbers stored as text).', '=ISNUMBER(C2)'],
    ESTEXTO: ['ISTEXT', 'ISTEXT(value)', 'TRUE if the value is text.', '=ISTEXT(C2)'],
    ESERROR: ['ISERROR', 'ISERROR(value)', 'TRUE if the value is an error.', '=ISERROR(B2/C2)'],
    'CONTAR.SI': ['COUNTIF', 'COUNTIF(range, criterion)', 'Counts the cells that meet a criterion, e.g. "North", ">100", "<>Cancelled".', '=COUNTIF(B2:B25, "North")'],
    'CONTAR.SI.CONJUNTO': ['COUNTIFS', 'COUNTIFS(range1, criterion1, [range2, criterion2], ...)', 'Counts the rows that meet ALL criteria.', '=COUNTIFS(B2:B25, "South", D2:D25, "Delayed")'],
    'SUMAR.SI': ['SUMIF', 'SUMIF(range, criterion, [sum_range])', 'Adds the values of the rows that meet a criterion.', '=SUMIF(B2:B25, "North", E2:E25)'],
    'SUMAR.SI.CONJUNTO': ['SUMIFS', 'SUMIFS(sum_range, range1, criterion1, [range2, criterion2], ...)', 'Adds the values of the rows that meet ALL criteria. Careful: the range to add goes first!', '=SUMIFS(E2:E25, B2:B25, "South", D2:D25, "Delivered")'],
    'PROMEDIO.SI': ['AVERAGEIF', 'AVERAGEIF(range, criterion, [average_range])', 'Average of the rows that meet a criterion.', '=AVERAGEIF(B2:B25, "North", E2:E25)'],
    'PROMEDIO.SI.CONJUNTO': ['AVERAGEIFS', 'AVERAGEIFS(average_range, range1, criterion1, ...)', 'Average of the rows that meet ALL criteria.', '=AVERAGEIFS(E2:E25, B2:B25, "South")'],
    'MAX.SI.CONJUNTO': ['MAXIFS', 'MAXIFS(max_range, range1, criterion1, ...)', 'Largest value among the rows that meet the criteria.', '=MAXIFS(E2:E25, B2:B25, "South")'],
    'MIN.SI.CONJUNTO': ['MINIFS', 'MINIFS(min_range, range1, criterion1, ...)', 'Smallest value among the rows that meet the criteria.', '=MINIFS(E2:E25, B2:B25, "South")'],
    BUSCARV: ['VLOOKUP', 'VLOOKUP(search_key, table, column, [approximate])', 'Finds a value in the FIRST column of a table and returns the value of another column in that row. Use FALSE for an exact match.', '=VLOOKUP(A2, Products!A:C, 3, FALSE)'],
    BUSCARX: ['XLOOKUP', 'XLOOKUP(search_key, lookup_range, result_range, [if_not_found])', 'Finds a value in a range and returns the value at the same position in another range.', '=XLOOKUP(A2, Clients!A:A, Clients!C:C, "N/A")'],
    COINCIDIR: ['MATCH', 'MATCH(search_key, range, [type])', 'Position of a value in a range. Use 0 for an exact match.', '=MATCH("South", H2:H5, 0)'],
    INDICE: ['INDEX', 'INDEX(range, row, [column])', 'Returns the value at the given row and column of a range.', '=INDEX(A2:C20, 5, 2)'],
  };

  // Documentación de una función en el idioma actual: { name, sig, desc, ex }.
  AA.fnDoc = (canonical) => {
    const d = AA.Formula.getFunction(canonical);
    if (!d) return null;
    const en = EN[d.name];
    if (AA.lang === 'en' && en) return { name: en[0], sig: en[1], desc: en[2], ex: en[3], def: d };
    return { name: d.name, sig: d.sig, desc: d.desc, ex: d.ex, def: d };
  };
  AA.fnName = (canonical) => {
    const doc = AA.fnDoc(canonical);
    return doc ? doc.name : canonical;
  };
})();
