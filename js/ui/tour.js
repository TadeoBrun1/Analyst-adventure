/*
 * Analyst Adventure — Guías paso a paso ("tours") para la primera vez que entrás a cada sección.
 * Oscurece la pantalla, ilumina el elemento del que se habla y muestra una tarjeta con
 * explicaciones y pequeñas animaciones. Teclado: → / Enter sigue, ← vuelve, Esc saltea.
 *
 * step: { target?: selector | () => Element | DOMRect-like, title, text, demo?: html | () => html,
 *         onEnter?: (ctx) => void, onLeave?: () => void, pad?: number }
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const T = (es, en) => AA.T(es, en);

  const Tour = {
    active: null,

    seen(id) {
      const f = AA.State.data && AA.State.data.flags;
      return !!(f && f.tours && f.tours[id]);
    },
    markSeen(id) {
      const st = AA.State;
      if (!st.data) return;
      st.data.flags.tours = Object.assign({}, st.data.flags.tours, { [id]: true });
      st.save();
    },
    isOpen() {
      return !!this.active;
    },

    // Corre la guía si todavía no la viste (o si force).
    run(id, steps, opts) {
      opts = opts || {};
      if (this.active || (!opts.force && this.seen(id))) {
        if (opts.onDone && !this.active) opts.onDone();
        return false;
      }
      steps = steps.filter(Boolean);
      if (!steps.length) return false;
      const root = document.createElement('div');
      root.className = 'tour';
      root.innerHTML = `
        <div class="tour-hole"></div>
        <div class="tour-card" role="dialog" aria-live="polite">
          <div class="tour-step"></div>
          <h3 class="tour-title"></h3>
          <div class="tour-text"></div>
          <div class="tour-demo"></div>
          <div class="tour-foot">
            <button type="button" class="btn btn-ghost btn-sm" data-t="skip">${T('Saltar guía', 'Skip tour')}</button>
            <span class="spacer"></span>
            <button type="button" class="btn btn-sm" data-t="back">← ${T('Atrás', 'Back')}</button>
            <button type="button" class="btn btn-primary btn-sm" data-t="next"></button>
          </div>
        </div>`;
      document.body.appendChild(root);
      const a = (this.active = { id, steps, i: -1, root, opts, timers: [] });
      root.addEventListener('mousedown', (e) => e.stopPropagation());
      root.addEventListener('click', (e) => {
        e.stopPropagation();
        const b = e.target.closest('[data-t]');
        if (!b) return;
        if (b.dataset.t === 'next') this.go(a.i + 1);
        else if (b.dataset.t === 'back') this.go(a.i - 1);
        else this.end(true);
      });
      a.onKey = (e) => {
        if (!this.active) return;
        e.stopImmediatePropagation();
        if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.go(a.i + 1);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.go(a.i - 1);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.end(true);
        } else if (e.key !== 'Tab') e.preventDefault();
      };
      a.onResize = () => this.place();
      window.addEventListener('keydown', a.onKey, true);
      window.addEventListener('resize', a.onResize);
      requestAnimationFrame(() => root.classList.add('in'));
      this.go(0);
      return true;
    },

    clearTimers() {
      const a = this.active;
      a.timers.forEach((t) => clearTimeout(t) || clearInterval(t));
      a.timers = [];
    },
    // Timers que se limpian solos al cambiar de paso.
    later(fn, ms) {
      if (this.active) this.active.timers.push(setTimeout(fn, ms));
    },
    every(fn, ms) {
      if (this.active) this.active.timers.push(setInterval(fn, ms));
    },

    go(i) {
      const a = this.active;
      if (!a) return;
      if (i < 0) return;
      const prev = a.steps[a.i];
      if (prev && prev.onLeave) prev.onLeave();
      this.clearTimers();
      if (i >= a.steps.length) return this.end(false);
      a.i = i;
      const s = a.steps[i];
      const card = a.root.querySelector('.tour-card');
      card.classList.remove('swap');
      void card.offsetWidth;
      card.classList.add('swap');
      a.root.querySelector('.tour-step').textContent = `${i + 1} / ${a.steps.length}`;
      a.root.querySelector('.tour-title').innerHTML = AA.L(s.title);
      a.root.querySelector('.tour-text').innerHTML = AA.fillName(AA.L(s.text));
      const demo = typeof s.demo === 'function' ? s.demo() : s.demo ? AA.L(s.demo) : '';
      const demoEl = a.root.querySelector('.tour-demo');
      demoEl.innerHTML = demo || '';
      demoEl.style.display = demo ? '' : 'none';
      a.root.querySelector('[data-t="back"]').style.visibility = i === 0 ? 'hidden' : 'visible';
      a.root.querySelector('[data-t="next"]').innerHTML = i === a.steps.length - 1 ? `${T('¡Entendido!', 'Got it!')} ✔` : `${T('Siguiente', 'Next')} →`;
      AA.Audio.play(i === 0 ? 'page' : 'move');
      this.place();
      if (s.onEnter) s.onEnter({ demo: demoEl, later: (fn, ms) => this.later(fn, ms), every: (fn, ms) => this.every(fn, ms) });
      setTimeout(() => {
        const nb = a.root.querySelector('[data-t="next"]');
        if (nb && this.active === a) nb.focus({ preventScroll: true });
      }, 30);
    },

    rectOf(step) {
      let t = step.target;
      if (!t) return null;
      if (typeof t === 'function') t = t();
      if (typeof t === 'string') t = document.querySelector(t);
      if (!t) return null;
      if (t.getBoundingClientRect) {
        if (t.scrollIntoView && !step.noScroll) t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        const r = t.getBoundingClientRect();
        if (!r.width && !r.height) return null;
        return r;
      }
      return t; // rectángulo calculado (por ejemplo, un personaje del lienzo)
    },

    place() {
      const a = this.active;
      if (!a) return;
      const s = a.steps[a.i];
      const hole = a.root.querySelector('.tour-hole');
      const card = a.root.querySelector('.tour-card');
      const r = this.rectOf(s);
      const W = innerWidth;
      const H = innerHeight;
      const pad = s.pad === undefined ? 8 : s.pad;
      if (!r) {
        hole.classList.add('none');
        Object.assign(hole.style, { left: W / 2 + 'px', top: H / 2 + 'px', width: '0px', height: '0px' });
        card.style.left = Math.max(12, (W - card.offsetWidth) / 2) + 'px';
        card.style.top = Math.max(12, (H - card.offsetHeight) / 2) + 'px';
        return;
      }
      hole.classList.remove('none');
      const box = { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 };
      Object.assign(hole.style, { left: box.left + 'px', top: box.top + 'px', width: box.width + 'px', height: box.height + 'px' });
      // La tarjeta va donde haya lugar: abajo, arriba, a la derecha o a la izquierda.
      const cw = card.offsetWidth;
      const ch = card.offsetHeight;
      let left;
      let top;
      if (box.top + box.height + ch + 16 < H) {
        top = box.top + box.height + 12;
        left = box.left;
      } else if (box.top - ch - 12 > 0) {
        top = box.top - ch - 12;
        left = box.left;
      } else if (box.left + box.width + cw + 16 < W) {
        left = box.left + box.width + 12;
        top = box.top;
      } else {
        left = box.left - cw - 12;
        top = box.top;
      }
      card.style.left = Math.max(12, Math.min(W - cw - 12, left)) + 'px';
      card.style.top = Math.max(12, Math.min(H - ch - 12, top)) + 'px';
    },

    end(skipped) {
      const a = this.active;
      if (!a) return;
      const s = a.steps[a.i];
      if (s && s.onLeave) s.onLeave();
      this.clearTimers();
      window.removeEventListener('keydown', a.onKey, true);
      window.removeEventListener('resize', a.onResize);
      a.root.classList.remove('in');
      setTimeout(() => a.root.remove(), 200);
      this.active = null;
      this.markSeen(a.id);
      AA.Audio.play(skipped ? 'back' : 'select');
      if (a.opts.onDone) a.opts.onDone(skipped);
    },
  };

  AA.Tour = Tour;
})();
