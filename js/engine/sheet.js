/*
 * Analyst Adventure — Modelo de hoja de cálculo.
 * Guarda el contenido de cada celda (valor literal o fórmula) y calcula los valores
 * con caché y detección de referencias circulares.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const F = AA.Formula;

  // Convierte lo que el usuario escribe en el contenido de una celda.
  function parseInput(input) {
    if (input === null || input === undefined) return null;
    const s = String(input);
    if (s === '') return null;
    if (s[0] === '=' && s.length > 1) return { f: s };
    if (s[0] === "'") return s.length > 1 ? { v: s.slice(1) } : null;
    const n = F.parseNumberStrict(s);
    if (n !== null) return { v: n };
    const u = F.normName(s.trim());
    if (u === 'VERDADERO' || u === 'TRUE') return { v: true };
    if (u === 'FALSO' || u === 'FALSE') return { v: false };
    return { v: s };
  }

  class Sheet {
    constructor(cols = 12, rows = 30) {
      this.cols = cols;
      this.rows = rows;
      this.cells = new Map();
      this.cache = new Map();
      this.asts = new Map();
      this.computing = new Set();
      this.listeners = [];
      this.ctx = {
        getCell: (c, r) => this.getValue(c, r),
        getRange: (c1, r1, c2, r2) => this.getRange(c1, r1, c2, r2),
        maxRow: () => this.rows - 1,
      };
    }

    key(c, r) {
      return r * 4096 + c;
    }
    inBounds(c, r) {
      return c >= 0 && r >= 0 && c < this.cols && r < this.rows;
    }

    // --- Escritura
    setInput(c, r, input, silent) {
      if (!this.inBounds(c, r)) return;
      const cell = parseInput(input);
      const k = this.key(c, r);
      if (cell) this.cells.set(k, cell);
      else this.cells.delete(k);
      this.cache.clear();
      if (!silent) this.emit([{ c, r }]);
    }
    // Valor literal (para cargar datasets sin interpretar el texto).
    setValue(c, r, value, silent) {
      if (!this.inBounds(c, r)) return;
      const k = this.key(c, r);
      if (value === null || value === undefined || value === '') this.cells.delete(k);
      else this.cells.set(k, { v: value });
      this.cache.clear();
      if (!silent) this.emit([{ c, r }]);
    }
    batch(changes) {
      for (const ch of changes) this.setInput(ch.c, ch.r, ch.input, true);
      this.emit(changes);
    }

    // --- Lectura
    getInput(c, r) {
      const cell = this.cells.get(this.key(c, r));
      if (!cell) return '';
      if ('f' in cell) return cell.f;
      const v = cell.v;
      if (typeof v === 'number') return F.fmtNumber(v);
      if (typeof v === 'boolean') return v ? 'VERDADERO' : 'FALSO';
      const back = parseInput(v);
      return back && back.v === v ? v : "'" + v;
    }
    isFormula(c, r) {
      const cell = this.cells.get(this.key(c, r));
      return !!cell && 'f' in cell;
    }
    isEmpty(c, r) {
      return !this.cells.has(this.key(c, r));
    }

    getAst(f) {
      let ast = this.asts.get(f);
      if (ast === undefined) {
        try {
          ast = F.parse(f.slice(1));
        } catch (e) {
          ast = e instanceof F.FormulaError ? e : F.errors.parse(String(e && e.message));
        }
        this.asts.set(f, ast);
      }
      return ast;
    }

    getValue(c, r) {
      if (!this.inBounds(c, r)) return F.errors.ref('La referencia está fuera de la hoja.');
      const k = this.key(c, r);
      if (this.cache.has(k)) return this.cache.get(k);
      const cell = this.cells.get(k);
      if (!cell) return null;
      if (!('f' in cell)) return cell.v;
      if (this.computing.has(k)) return F.errors.circ();
      this.computing.add(k);
      let val;
      try {
        const ast = this.getAst(cell.f);
        if (ast instanceof F.FormulaError) val = ast;
        else {
          val = F.evaluate(ast, this.ctx);
          if (val instanceof F.RangeValue) {
            val = val.height === 1 && val.width === 1
              ? val.rows[0][0]
              : F.errors.value('La fórmula devuelve un rango entero. Usá una función como SUMA para resumirlo.');
          }
          if (val === null || val === undefined) val = 0;
          if (typeof val === 'number' && !isFinite(val)) val = F.errors.num();
        }
      } finally {
        this.computing.delete(k);
      }
      this.cache.set(k, val);
      return val;
    }

    getRange(c1, r1, c2, r2) {
      if (c1 < 0 || r1 < 0) return F.errors.ref();
      c2 = Math.min(c2, this.cols - 1);
      r2 = Math.min(r2, this.rows - 1);
      const rows = [];
      for (let r = r1; r <= r2; r++) {
        const row = [];
        for (let c = c1; c <= c2; c++) row.push(this.getValue(c, r));
        rows.push(row);
      }
      if (!rows.length) rows.push([null]);
      return new F.RangeValue(rows);
    }

    // --- Atajos con referencias tipo "A1"
    val(ref) {
      const p = F.parseRef(ref);
      return p ? this.getValue(p.col, p.row) : null;
    }
    input(ref) {
      const p = F.parseRef(ref);
      return p ? this.getInput(p.col, p.row) : '';
    }

    // --- Persistencia
    serialize() {
      const out = [];
      for (const k of this.cells.keys()) {
        const c = k % 4096;
        const r = Math.floor(k / 4096);
        out.push([c, r, this.getInput(c, r)]);
      }
      return out;
    }
    load(list) {
      this.cells.clear();
      for (const [c, r, input] of list) this.setInput(c, r, input, true);
      this.cache.clear();
      this.emit([]);
    }

    // --- Eventos
    onChange(fn) {
      this.listeners.push(fn);
    }
    emit(changes) {
      for (const fn of this.listeners) fn(changes);
    }
  }

  AA.Sheet = Sheet;
  AA.parseCellInput = parseInput;
})();
