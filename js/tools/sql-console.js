/*
 * Analyst Adventure — Consola SQL: esquema de tablas, editor con colores y resultados.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const T = (es, en) => AA.T(es, en);
  const esc = (s) => AA.escapeHtml(s);

  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  function colType(table, i) {
    const vals = table.rows.map((r) => r[i]).filter((v) => v !== null && v !== undefined && v !== '');
    if (vals.length && vals.every((v) => typeof v === 'number')) return 'num';
    if (vals.length && vals.every((v) => DATE_RE.test(String(v)))) return 'date';
    return 'text';
  }
  function fmtCell(v) {
    if (v === null || v === undefined || v === '') return '<span class="sql-null">NULL</span>';
    if (typeof v === 'number') return esc(Number.isInteger(v) ? String(v) : String(Math.round(v * 10000) / 10000));
    return esc(v);
  }

  // Colores de sintaxis (para la capa que va detrás del textarea).
  function highlight(src) {
    let out = '';
    let i = 0;
    const kws = AA.SQL.KEYWORDS;
    while (i < src.length) {
      const rest = src.slice(i);
      let m;
      if ((m = /^--[^\n]*/.exec(rest))) out += `<span class="hl-com">${esc(m[0])}</span>`;
      else if ((m = /^'(?:[^']|'')*'?/.exec(rest))) out += `<span class="hl-str">${esc(m[0])}</span>`;
      else if ((m = /^\d+(?:\.\d+)?/.exec(rest))) out += `<span class="hl-num">${m[0]}</span>`;
      else if ((m = /^[A-Za-z_À-ſ][A-Za-z0-9_À-ſ]*/.exec(rest))) {
        const up = m[0].toUpperCase();
        const fn = /^\s*\(/.test(src.slice(i + m[0].length));
        out += kws.has(up) ? `<span class="hl-kw">${esc(m[0])}</span>` : fn ? `<span class="hl-fn">${esc(m[0])}</span>` : esc(m[0]);
      } else m = [src[i]], (out += esc(src[i]));
      i += m[0].length;
    }
    return out + '\n';
  }

  class SqlConsole {
    constructor(root, tables, opts) {
      this.root = root;
      this.tables = tables;
      this.opts = opts || {};
      this.history = (this.opts.history || []).slice(-8);
      this.build();
      this.setText(this.opts.initial || '');
      if (this.opts.lastQuery) this.run(this.opts.lastQuery, true);
    }

    build() {
      const schema = Object.entries(this.tables)
        .map(
          ([name, t]) => `
          <div class="sql-table">
            <div class="sql-table-head">
              <button class="sql-ins sql-tname" data-ins="${esc(name)}" title="${T('Insertar el nombre', 'Insert the name')}">🗄️ ${esc(name)}</button>
              <span class="muted">${t.rows.length} ${T('filas', 'rows')}</span>
              <button class="sql-peek" data-peek="${esc(name)}" title="${T('Ver las primeras filas', 'Preview the first rows')}">👁</button>
            </div>
            <ul>${t.headers
              .map((h, i) => {
                const ty = colType(t, i);
                return `<li><button class="sql-ins" data-ins="${esc(h)}"><span class="sql-ty ${ty}">${ty === 'num' ? '123' : ty === 'date' ? '📅' : 'Abc'}</span>${esc(h)}</button></li>`;
              })
              .join('')}</ul>
          </div>`
        )
        .join('');
      this.root.innerHTML = `
        <div class="sql">
          <aside class="sql-schema">
            <h4>${T('Tablas', 'Tables')}</h4>
            ${schema}
            <p class="cb-help">${T('Clic en una columna para insertarla. 👁 muestra las primeras filas de una tabla.', 'Click a column to insert it. 👁 shows the first rows of a table.')}</p>
          </aside>
          <section class="sql-main">
            <div class="sql-editor">
              <pre class="sql-hl" aria-hidden="true"></pre>
              <textarea spellcheck="false" autocomplete="off" placeholder="SELECT …"></textarea>
            </div>
            <div class="sql-bar">
              <button class="btn btn-primary btn-sm" data-act="run">▶ ${T('Ejecutar', 'Run')} <kbd>Ctrl+Enter</kbd></button>
              <button class="btn btn-sm" data-act="clear">🧹 ${T('Limpiar', 'Clear')}</button>
              <div class="sql-history"></div>
            </div>
            <div class="sql-result"><div class="cb-empty"><span>${T('Escribí una consulta y ejecutala con <b>Ctrl+Enter</b>.', 'Write a query and run it with <b>Ctrl+Enter</b>.')}</span></div></div>
          </section>
        </div>`;
      this.ta = this.root.querySelector('textarea');
      this.hl = this.root.querySelector('.sql-hl');
      this.out = this.root.querySelector('.sql-result');
      this.ta.addEventListener('input', () => {
        this.sync();
        if (this.opts.onChange) this.opts.onChange(this.ta.value);
      });
      this.ta.addEventListener('scroll', () => {
        this.hl.scrollTop = this.ta.scrollTop;
        this.hl.scrollLeft = this.ta.scrollLeft;
      });
      this.ta.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          this.run(this.ta.value);
        } else if (e.key === 'Tab') {
          e.preventDefault();
          this.insert('  ');
        } else if (e.key === 'Escape') {
          this.ta.blur(); // el siguiente Esc vuelve a la bandeja
        }
      });
      this.root.querySelector('[data-act="run"]').addEventListener('click', () => this.run(this.ta.value));
      this.root.querySelector('[data-act="clear"]').addEventListener('click', () => {
        this.setText('');
        this.ta.focus();
        if (this.opts.onChange) this.opts.onChange('');
      });
      this.root.querySelectorAll('[data-ins]').forEach((b) =>
        b.addEventListener('click', () => {
          this.insert(b.dataset.ins);
          AA.Audio.play('type');
        })
      );
      this.root.querySelectorAll('[data-peek]').forEach((b) =>
        b.addEventListener('click', () => {
          const q = `SELECT * FROM ${b.dataset.peek} LIMIT 10`;
          this.setText(q);
          this.run(q);
        })
      );
      this.renderHistory();
    }

    setText(text) {
      this.ta.value = text;
      this.sync();
    }
    sync() {
      this.hl.innerHTML = highlight(this.ta.value);
    }
    insert(text) {
      const ta = this.ta;
      const a = ta.selectionStart;
      const b = ta.selectionEnd;
      const before = ta.value.slice(0, a);
      const pad = before && !/[\s(,.]$/.test(before) && !/^\s/.test(text) ? ' ' : '';
      ta.value = before + pad + text + ta.value.slice(b);
      const pos = a + pad.length + text.length;
      ta.setSelectionRange(pos, pos);
      ta.focus();
      this.sync();
      if (this.opts.onChange) this.opts.onChange(ta.value);
    }

    renderHistory() {
      const box = this.root.querySelector('.sql-history');
      box.innerHTML = this.history.length
        ? `<span class="muted">${T('Anteriores', 'Previous')}:</span>` +
          this.history
            .slice()
            .reverse()
            .slice(0, 5)
            .map((q, i) => `<button class="sql-hist" data-h="${i}" title="${esc(q)}">${esc(q.replace(/\s+/g, ' ').slice(0, 28))}${q.length > 28 ? '…' : ''}</button>`)
            .join('')
        : '';
      box.querySelectorAll('[data-h]').forEach((b) =>
        b.addEventListener('click', () => {
          this.setText(this.history.slice().reverse()[+b.dataset.h]);
          this.ta.focus();
        })
      );
    }

    run(query, silent) {
      const q = String(query || '').trim();
      if (!q) {
        this.out.innerHTML = `<div class="cb-empty"><span>${T('La consulta está vacía.', 'The query is empty.')}</span></div>`;
        return;
      }
      const t0 = performance.now();
      let res;
      try {
        res = AA.SQL.execute(q, this.tables);
      } catch (e) {
        if (!(e instanceof AA.SQL.SqlError)) console.error(e);
        this.out.innerHTML = `<div class="sql-error">⚠️ ${esc(e.message)}</div>`;
        if (!silent) {
          AA.Audio.play('error');
          if (this.opts.onRun) this.opts.onRun(q, null, e.message);
        }
        return;
      }
      const ms = Math.max(1, Math.round(performance.now() - t0));
      const shown = res.rows.slice(0, 200);
      this.out.innerHTML = `
        <div class="sql-meta">✔ ${res.rows.length} ${T(res.rows.length === 1 ? 'fila' : 'filas', res.rows.length === 1 ? 'row' : 'rows')} · ${ms} ms${res.rows.length > 200 ? ` · ${T('se muestran las primeras 200', 'showing the first 200')}` : ''}</div>
        ${res.notes.map((n) => `<div class="sql-note">💡 ${esc(n)}</div>`).join('')}
        <div class="sql-grid"><table>
          <thead><tr><th class="rn">#</th>${res.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
          <tbody>${shown.map((r, i) => `<tr><td class="rn">${i + 1}</td>${r.map((v) => `<td class="${typeof v === 'number' ? 'n' : ''}">${fmtCell(v)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></div>`;
      if (!silent) {
        AA.Audio.play('type');
        if (!this.history.length || this.history[this.history.length - 1] !== q) {
          this.history.push(q);
          this.history = this.history.slice(-8);
          this.renderHistory();
        }
        if (this.opts.onRun) this.opts.onRun(q, res, null);
      }
    }

    focus() {
      this.ta.focus();
    }
    destroy() {}
  }

  AA.SqlConsole = SqlConsole;
})();
