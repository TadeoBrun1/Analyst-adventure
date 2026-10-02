/*
 * Analyst Adventure — Armado de informes y presentaciones (storytelling / resumen ejecutivo).
 *
 * El informe se arma eligiendo, sección por sección, qué decir: el titular, la evidencia,
 * el gráfico que lo respalda y la recomendación. Cada opción incorrecta explica por qué
 * no sirve (sin datos que la respalden, demasiado técnica, sin acción concreta…).
 * A la derecha se ve la diapositiva tal como la vería quien la recibe.
 *
 * report = { kind: 'story' | 'exec', heading, table?, sections: [
 *   { id, label, prompt, slot: 'title' | 'text' | 'bullets' | 'chart', multi?: n,
 *     options: [{ id, text?, chart?: { spec, table? }, why? }], correct: id | [ids] } ] }
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const T = (es, en) => (AA.T ? AA.T(es, en) : es);
  const esc = (s) => (AA.escapeHtml ? AA.escapeHtml(s) : String(s));

  const chosen = (S, id) => {
    const v = S.report && S.report.choices ? S.report.choices[id] : undefined;
    return v === undefined || v === null ? [] : [].concat(v);
  };

  // Validador de una sección: check(S) con S.report = { choices: { idSección: idOpción | [ids] } }.
  function section(report, id) {
    const sec = report.sections.find((x) => x.id === id);
    const correct = [].concat(sec.correct);
    return (S) => {
      const got = chosen(S, id);
      if (!got.length) return false;
      if (sec.multi && got.length < sec.multi) return T(`Elegí ${sec.multi} opciones en "${sec.label}".`, `Choose ${sec.multi} options in "${sec.label}".`);
      const wrong = got.find((g) => !correct.includes(g));
      if (wrong) {
        const opt = sec.options.find((o) => o.id === wrong);
        return (opt && opt.why) || T(`Revisá "${sec.label}".`, `Check "${sec.label}".`);
      }
      return got.length === correct.length ? true : false;
    };
  }

  class ReportBuilder {
    constructor(root, report, choices, opts) {
      this.root = root;
      this.report = report;
      this.choices = Object.assign({}, choices || {});
      this.opts = opts || {};
      this.renderers = new Map();
      this.build();
    }

    build() {
      const r = this.report;
      const optHtml = (sec, o) => {
        const on = [].concat(this.choices[sec.id] === undefined ? [] : this.choices[sec.id]).includes(o.id);
        return `<button class="rp-opt ${on ? 'on' : ''} ${o.chart ? 'has-chart' : ''}" data-sec="${sec.id}" data-opt="${o.id}">
          <span class="rp-mark">${sec.multi ? (on ? '☑' : '☐') : on ? '◉' : '○'}</span>
          <span class="rp-opt-body">${o.chart ? `<span class="rp-thumb" data-thumb="${sec.id}:${o.id}"></span>` : ''}${o.text ? `<span>${o.text}</span>` : ''}</span>
        </button>`;
      };
      this.root.innerHTML = `
        <div class="rp">
          <section class="rp-build">
            ${r.sections
              .map(
                (sec, i) => `
              <div class="rp-sec">
                <h4><span class="rp-num">${i + 1}</span>${esc(sec.label)}${sec.multi ? ` <span class="muted">(${T('elegí', 'choose')} ${sec.multi})</span>` : ''}</h4>
                ${sec.prompt ? `<p class="muted small">${sec.prompt}</p>` : ''}
                <div class="rp-opts ${sec.slot === 'chart' ? 'charts' : ''}">${sec.options.map((o) => optHtml(sec, o)).join('')}</div>
              </div>`
              )
              .join('')}
          </section>
          <section class="rp-preview">
            <div class="rp-preview-label">👁 ${T('Así lo ve quien lo recibe', 'What the reader sees')}</div>
            <div class="rp-slide"></div>
          </section>
        </div>`;
      this.root.querySelectorAll('.rp-opt').forEach((b) =>
        b.addEventListener('click', () => {
          const sec = r.sections.find((x) => x.id === b.dataset.sec);
          const id = b.dataset.opt;
          if (sec.multi) {
            const cur = [].concat(this.choices[sec.id] || []);
            const k = cur.indexOf(id);
            if (k >= 0) cur.splice(k, 1);
            else {
              if (cur.length >= sec.multi) cur.shift();
              cur.push(id);
            }
            this.choices[sec.id] = cur;
          } else this.choices[sec.id] = id;
          AA.Audio.play('select');
          this.build();
          if (this.opts.onChange) this.opts.onChange(this.choices);
        })
      );
      this.drawThumbs();
      this.drawSlide();
    }

    // Cada opción de gráfico puede traer su propia tabla (o usa la del informe).
    rendererFor(chart) {
      const table = chart.table || this.report.table;
      if (!this.renderers.has(table)) this.renderers.set(table, new AA.ChartRenderer(table));
      return this.renderers.get(table);
    }

    drawThumbs() {
      this.root.querySelectorAll('[data-thumb]').forEach((host) => {
        const [sid, oid] = host.dataset.thumb.split(':');
        const sec = this.report.sections.find((x) => x.id === sid);
        const o = sec.options.find((x) => x.id === oid);
        requestAnimationFrame(() => this.rendererFor(o.chart).draw(host, o.chart.spec || o.chart, {}));
      });
    }

    drawSlide() {
      const slide = this.root.querySelector('.rp-slide');
      const r = this.report;
      const pick = (sec) => [].concat(this.choices[sec.id] === undefined ? [] : this.choices[sec.id]).map((id) => sec.options.find((o) => o.id === id)).filter(Boolean);
      let html = `<div class="rp-slide-head">${esc(r.heading || '')}</div>`;
      let chartOpt = null;
      for (const sec of r.sections) {
        const got = pick(sec);
        const empty = `<span class="rp-ph">${esc(sec.label)}…</span>`;
        if (sec.slot === 'title') html += `<h2 class="rp-title">${got.length ? got[0].text : empty}</h2>`;
        else if (sec.slot === 'chart') {
          chartOpt = got[0] || null;
          html += `<div class="rp-slide-chart">${chartOpt ? '' : empty}</div>`;
        } else if (sec.slot === 'bullets') html += `<div class="rp-block"><b>${esc(sec.short || sec.label)}</b>${got.length ? `<ul>${got.map((o) => `<li>${o.text}</li>`).join('')}</ul>` : `<p>${empty}</p>`}</div>`;
        else html += `<div class="rp-block ${sec.tone || ''}"><b>${esc(sec.short || sec.label)}</b><p>${got.length ? got.map((o) => o.text).join(' ') : empty}</p></div>`;
      }
      slide.className = 'rp-slide ' + (r.kind || 'story');
      slide.innerHTML = html;
      if (chartOpt) {
        const host = slide.querySelector('.rp-slide-chart');
        requestAnimationFrame(() => this.rendererFor(chartOpt.chart).draw(host, chartOpt.chart.spec || chartOpt.chart, {}));
      }
    }

    destroy() {}
  }

  AA.Report = { section };
  AA.ReportBuilder = ReportBuilder;
})();
