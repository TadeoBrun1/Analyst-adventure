/*
 * Analyst Adventure — Eventos especiales: presentar los resultados frente al equipo.
 * Al entregar un informe, a veces el equipo te pide que expliques lo que encontraste.
 * Las preguntas se arman con los datos REALES de la planilla que acabás de completar,
 * así que conviene prestar atención a lo que calculás.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const T = (es, en) => AA.T(es, en);
  const esc = (s) => AA.escapeHtml(s);

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const isNum = (v) => typeof v === 'number' && isFinite(v);
  const isText = (v) => typeof v === 'string' && v.trim() !== '';

  // Arma una pregunta de opción múltiple (la correcta queda en una posición al azar).
  function mcq(text, correct, wrongs, explain) {
    const opts = [correct];
    for (const w of wrongs) if (opts.length < 4 && !opts.includes(w)) opts.push(w);
    if (opts.length < 2) return null;
    const order = shuffle(opts);
    return { text, options: order, correct: order.indexOf(correct), answer: correct, explain };
  }

  // Distractores numéricos plausibles para un valor.
  function numWrongs(v, fmtv, extra) {
    const cands = (extra || []).concat([v * 0.8, v * 1.25, v * 1.1, v * 0.9, v + (v >= 10 ? Math.round(v * 0.15) : 1)]);
    const out = [];
    for (const c of cands) {
      const s = fmtv(c);
      if (s !== fmtv(v) && !out.includes(s)) out.push(s);
    }
    return out;
  }

  // Lee lo que completaste (rangos "a completar") y genera preguntas sobre esos resultados.
  function questions(mission, book, defs) {
    const F = AA.Formula;
    const out = [];
    if (!book || !defs) return out;
    defs.forEach((d, i) => {
      const def = d.def;
      if (!def || def.readonly || !def.targets) return;
      const sheet = book.sheets[i];
      if (!sheet) return;
      const formats = def.formats || {};
      const fmtOf = (c, r) => formats[F.makeRef(c, r)] || formats[F.indexToCol(c)] || null;
      const shown = (c, r) => (sheet && AA.formatValue ? AA.formatValue(sheet.getValue(c, r), fmtOf(c, r)) : String(sheet.getValue(c, r)));
      for (const ref of def.targets) {
        const k = F.parseRange(ref);
        if (!k) continue;
        // Columna de resultados (3 filas o más)
        if (k.c1 === k.c2 && k.r2 - k.r1 >= 2) {
          const c = k.c1;
          const rows = [];
          for (let r = k.r1; r <= k.r2; r++) rows.push(r);
          const vals = rows.map((r) => sheet.getValue(c, r));
          const header = k.r1 > 0 && isText(sheet.getValue(c, k.r1 - 1)) ? sheet.getValue(c, k.r1 - 1) : F.indexToCol(c);
          // Columna de etiquetas: la primera columna de texto (sin repetidos) en esas filas.
          let lc = -1;
          for (let x = 0; x < sheet.cols && lc < 0; x++) {
            if (x === c) continue;
            const ls = rows.map((r) => sheet.getValue(x, r));
            if (ls.every(isText) && new Set(ls).size === ls.length) lc = x;
          }
          const labels = lc >= 0 ? rows.map((r) => String(sheet.getValue(lc, r))) : null;
          const lHeader = lc >= 0 && k.r1 > 0 && isText(sheet.getValue(lc, k.r1 - 1)) ? sheet.getValue(lc, k.r1 - 1) : T('fila', 'row');
          if (vals.every(isNum)) {
            const fmt = fmtOf(c, k.r1);
            const fmtv = (v) => (AA.formatValue ? AA.formatValue(v, fmt || (Number.isInteger(v) ? 'int' : 'dec2')) : String(v));
            const max = Math.max(...vals);
            const min = Math.min(...vals);
            if (labels && vals.filter((v) => v === max).length === 1) {
              const best = labels[vals.indexOf(max)];
              out.push(
                mcq(
                  T(`¿Qué <b>${esc(lHeader)}</b> tuvo el <b>${esc(header)}</b> más alto?`, `Which <b>${esc(lHeader)}</b> had the highest <b>${esc(header)}</b>?`),
                  best,
                  shuffle(labels.filter((l) => l !== best)),
                  T(`Fue <b>${esc(best)}</b>, con ${esc(fmtv(max))}.`, `It was <b>${esc(best)}</b>, with ${esc(fmtv(max))}.`)
                )
              );
            }
            if (labels && vals.filter((v) => v === min).length === 1 && rows.length >= 4) {
              const worst = labels[vals.indexOf(min)];
              out.push(
                mcq(
                  T(`¿Qué <b>${esc(lHeader)}</b> tuvo el <b>${esc(header)}</b> más bajo?`, `Which <b>${esc(lHeader)}</b> had the lowest <b>${esc(header)}</b>?`),
                  worst,
                  shuffle(labels.filter((l) => l !== worst)),
                  T(`<b>${esc(worst)}</b>, con ${esc(fmtv(min))}.`, `<b>${esc(worst)}</b>, with ${esc(fmtv(min))}.`)
                )
              );
            }
            const sum = vals.reduce((a, b) => a + b, 0);
            if (fmt !== 'percent') {
              out.push(
                mcq(
                  T(`¿Cuánto suma en total la columna <b>${esc(header)}</b>?`, `What does the <b>${esc(header)}</b> column add up to?`),
                  fmtv(sum),
                  shuffle(numWrongs(sum, fmtv, [sum - max, sum + max])),
                  T(`El total da ${esc(fmtv(sum))}.`, `The total is ${esc(fmtv(sum))}.`)
                )
              );
            }
          } else if (vals.every(isText)) {
            const counts = {};
            vals.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
            const cats = Object.keys(counts);
            if (cats.length >= 2 && cats.length <= 6) {
              const top = cats.sort((a, b) => counts[b] - counts[a])[0];
              const n = counts[top];
              out.push(
                mcq(
                  T(`¿Cuántas filas quedaron como «${esc(top)}» en <b>${esc(header)}</b>?`, `How many rows ended up as "${esc(top)}" in <b>${esc(header)}</b>?`),
                  String(n),
                  shuffle([n + 1, n - 1, n + 2, n - 2].filter((x) => x >= 0).map(String)),
                  T(`Fueron ${n} de ${vals.length}.`, `It was ${n} out of ${vals.length}.`)
                )
              );
              if (labels) {
                const j = Math.floor(Math.random() * rows.length);
                out.push(
                  mcq(
                    T(`¿Qué resultado tuvo <b>${esc(labels[j])}</b> en <b>${esc(header)}</b>?`, `What result did <b>${esc(labels[j])}</b> get in <b>${esc(header)}</b>?`),
                    String(vals[j]),
                    shuffle(cats.filter((x) => x !== vals[j])),
                    T(`Quedó como «${esc(vals[j])}».`, `It came out as "${esc(vals[j])}".`)
                  )
                );
              }
            }
          }
        } else if (k.r2 - k.r1 <= 3 && k.c2 - k.c1 <= 1) {
          // Celdas de resumen con su etiqueta a la izquierda (por ejemplo "Total" → 1.250).
          for (let r = k.r1; r <= k.r2; r++) {
            for (let c = k.c1; c <= k.c2; c++) {
              const v = sheet.getValue(c, r);
              const label = c > 0 ? sheet.getValue(c - 1, r) : null;
              if (!isNum(v) || !isText(label) || label.length > 60) continue;
              const fmt = fmtOf(c, r);
              const fmtv = (x) => (AA.formatValue ? AA.formatValue(x, fmt || (Number.isInteger(x) ? 'int' : 'dec2')) : String(x));
              out.push(
                mcq(
                  T(`En tu informe, ¿cuánto te dio «${esc(label)}»?`, `In your report, what did "${esc(label)}" come out to?`),
                  shown(c, r) || fmtv(v),
                  shuffle(numWrongs(v, fmtv)),
                  T(`Te dio ${esc(shown(c, r))}.`, `It came out to ${esc(shown(c, r))}.`)
                )
              );
            }
          }
        }
      }
    });
    // Hasta 3 preguntas, variadas.
    const valid = out.filter(Boolean);
    const seen = new Set();
    const chosen = [];
    for (const q of shuffle(valid)) {
      const key = q.text.replace(/<[^>]+>/g, '').slice(0, 18);
      if (seen.has(key)) continue;
      seen.add(key);
      chosen.push(q);
      if (chosen.length === 3) break;
    }
    return chosen;
  }

  // Quién pregunta: el equipo de analistas (Nico solo cuando ya volvió).
  function audience() {
    const list = ['marta', 'leo', 'camila', 'tadeo'];
    if (AA.State.rankIndex() >= 2) list.push('nico');
    return list;
  }

  const Present = {
    questions,
    audience,

    // Corre el evento: escena + preguntas. done({ correct, total, bonus })
    run(ev, done) {
      const crowd = audience();
      const askers = shuffle(crowd.filter((id) => id !== 'marta'));
      let correct = 0;
      const total = ev.questions.length;
      AA.Office.startPresentation({
        title: ev.mission.subject,
        file: ev.mission.file,
        crowd,
        bars: this.boardBars(ev),
        total,
      });
      const ask = (i) => {
        if (i >= total) return finish();
        const q = ev.questions[i];
        const who = askers[i % askers.length];
        AA.Office.presentState({ asking: who, index: i, correct });
        AA.Dialog.open([
          {
            who,
            text: `${T(`<span class="muted">Pregunta ${i + 1} de ${total}</span><br>`, `<span class="muted">Question ${i + 1} of ${total}</span><br>`)}${q.text}`,
            choices: q.options.map((o, k) => ({
              label: o,
              action: () => {
                const ok = k === q.correct;
                if (ok) correct++;
                AA.Office.presentState({ asking: who, index: i, correct, reaction: ok ? 'ok' : 'bad' });
                AA.Audio.play(ok ? 'success' : 'error');
                AA.Dialog.open(
                  [
                    {
                      who,
                      text: ok
                        ? `${pick([T('¡Exacto!', 'Exactly!'), T('¡Perfecto, eso mismo!', 'Perfect, that is it!'), T('Muy bien. 👏', 'Very good. 👏')])} ${q.explain}`
                        : `${pick([T('Mmm, no era eso.', 'Hmm, that was not it.'), T('Uy, no.', 'Oops, no.')])} ${q.explain}`,
                    },
                  ],
                  () => ask(i + 1)
                );
              },
            })),
          },
        ]);
      };
      const finish = () => {
        const bonus = correct * (ev.xpEach || 0);
        AA.Office.presentState({ asking: 'marta', index: total, correct, done: true });
        const verdict =
          correct === total
            ? T('¡Impecable! Se nota que entendiste los datos, no solo las fórmulas.', 'Flawless! It shows you understood the data, not just the formulas.')
            : correct >= total / 2
              ? T('Bien. La próxima mirá los resultados con más calma antes de entregar.', 'Good. Next time take a closer look at the results before submitting.')
              : T('Te faltó mirar los resultados. Un analista tiene que poder explicar lo que entrega.', 'You needed to look at your results. An analyst must be able to explain what they deliver.');
        if (correct === total) {
          AA.Audio.play('levelup');
          AA.UI.confetti(120);
        }
        AA.Dialog.open(
          [
            { who: 'marta', text: `${verdict} <b>${correct}/${total}</b>${bonus ? T(` · +${bonus} XP extra`, ` · +${bonus} bonus XP`) : ''}` },
          ],
          () => done({ correct, total, bonus })
        );
      };
      // Pequeña pausa para la "cinemática" de entrada y después habla Marta.
      setTimeout(() => {
        AA.Dialog.open(
          [
            {
              who: 'marta',
              text: T(
                `📣 ¡Evento especial! {name}, antes de cerrar <b>${esc(ev.mission.subject)}</b>, contale al equipo qué encontraste. Tenemos algunas preguntas sobre tus datos.`,
                `📣 Special event! {name}, before we close <b>${esc(ev.mission.subject)}</b>, tell the team what you found. We have a few questions about your data.`
              ),
            },
          ],
          () => ask(0)
        );
      }, 1700);
    },

    // Barras para dibujar en el pizarrón (sin números: los datos los tenés que recordar vos).
    boardBars(ev) {
      const n = 6 + Math.floor(Math.random() * 3);
      const bars = [];
      for (let i = 0; i < n; i++) bars.push(0.25 + Math.random() * 0.75);
      return bars;
    },
  };

  AA.Present = Present;
})();
