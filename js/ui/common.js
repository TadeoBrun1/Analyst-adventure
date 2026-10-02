/*
 * Analyst Adventure — Utilidades de interfaz: modales, avisos y helpers.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});

  AA.fillName = (html) => String(html).replace(/\{name\}/g, AA.escapeHtml(AA.State.data ? AA.State.data.name : 'Analista'));

  const UI = {
    modalEl: null,
    toastEl: null,
    modalClosable: true,
    onModalClose: null,

    init() {
      this.modalEl = document.getElementById('modal');
      this.toastEl = document.getElementById('toast');
      this.modalEl.addEventListener('mousedown', (e) => {
        if (e.target === this.modalEl && this.modalClosable) this.closeModal();
      });
      // Flechas: moverse entre los botones del cuadro (pausa, confirmaciones, opciones…). Enter elige.
      this.modalEl.addEventListener('keydown', (e) => this.modalKey(e));
    },

    modalKey(e) {
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (!keys.includes(e.key) || e.defaultPrevented) return;
      const a = document.activeElement;
      const isRange = a && a.type === 'range';
      const isText = a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && !isRange));
      if (isText) return;
      // en una barra de volumen, izquierda/derecha cambian el valor
      if (isRange && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return;
      const card = this.modalEl.querySelector('.modal-card');
      if (!card) return;
      const items = [...card.querySelectorAll('[data-nav], .nb-tab, .modal-foot .btn')].filter((el) => !el.disabled && el.offsetParent !== null);
      if (!items.length) return;
      e.preventDefault();
      e.stopPropagation();
      const i = items.indexOf(a);
      const next = e.key === 'ArrowDown' || e.key === 'ArrowRight';
      const j = i < 0 ? (next ? 0 : items.length - 1) : (i + (next ? 1 : -1) + items.length) % items.length;
      items[j].focus();
      AA.Audio.play('move');
    },

    isModalOpen() {
      return !this.modalEl.classList.contains('hidden');
    },

    // buttons: [{ label, primary, action, keepOpen }]
    modal(opts) {
      const el = this.modalEl;
      this.modalClosable = opts.closable !== false;
      this.onModalClose = opts.onClose || null;
      el.innerHTML = `
        <div class="modal-card ${opts.wide ? 'wide' : ''} ${opts.className || ''}" role="dialog" aria-modal="true">
          ${opts.title ? `<header class="modal-head"><h2>${opts.title}</h2>${this.modalClosable ? `<button class="modal-x" aria-label="${AA.T('Cerrar', 'Close')}">✕</button>` : ''}</header>` : ''}
          <div class="modal-body">${opts.html || ''}</div>
          ${opts.buttons && opts.buttons.length ? `<footer class="modal-foot">${opts.buttons
            .map((b, i) => `<button class="btn ${b.primary ? 'btn-primary' : ''}" data-btn="${i}">${b.label}</button>`)
            .join('')}</footer>` : ''}
        </div>`;
      el.classList.remove('hidden');
      const x = el.querySelector('.modal-x');
      if (x) x.addEventListener('click', () => this.closeModal());
      el.querySelectorAll('[data-btn]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const b = opts.buttons[+btn.dataset.btn];
          AA.Audio.play(b.primary ? 'select' : 'move');
          if (!b.keepOpen) this.closeModal(true);
          if (b.action) b.action();
        });
      });
      const primary = el.querySelector('.btn-primary') || el.querySelector('[data-btn]');
      if (primary) setTimeout(() => primary.focus(), 30);
      if (opts.onOpen) opts.onOpen(el.querySelector('.modal-card'));
    },

    closeModal(skipCallback) {
      if (this.modalEl.classList.contains('hidden')) return;
      this.modalEl.classList.add('hidden');
      this.modalEl.innerHTML = '';
      const cb = this.onModalClose;
      this.onModalClose = null;
      if (cb && !skipCallback) cb();
    },

    toast(msg, kind) {
      const t = document.createElement('div');
      t.className = 'toast-item ' + (kind || '');
      t.innerHTML = msg;
      this.toastEl.appendChild(t);
      while (this.toastEl.children.length > 4) this.toastEl.firstElementChild.remove();
      setTimeout(() => t.classList.add('out'), 3200);
      setTimeout(() => t.remove(), 3700);
    },

    // Lluvia de confeti sobre toda la pantalla (al completar un nivel o ascender).
    confetti(count) {
      if (typeof document === 'undefined') return;
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const c = document.createElement('canvas');
      c.className = 'confetti';
      document.body.appendChild(c);
      const dpr = window.devicePixelRatio || 1;
      const resize = () => {
        c.width = innerWidth * dpr;
        c.height = innerHeight * dpr;
      };
      resize();
      const ctx = c.getContext('2d');
      const colors = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#4a3aa7', '#ffd23f', '#ffffff'];
      const n = reduce ? 40 : count || 180;
      const parts = [];
      for (let i = 0; i < n; i++) {
        const fromLeft = i % 2 === 0;
        parts.push({
          x: (fromLeft ? 0.05 : 0.95) * innerWidth,
          y: innerHeight * 0.75,
          vx: (fromLeft ? 1 : -1) * (3 + Math.random() * 9),
          vy: -(10 + Math.random() * 12),
          w: 6 + Math.random() * 6,
          h: 8 + Math.random() * 10,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.4,
          color: colors[i % colors.length],
          shape: i % 5 === 0 ? 'circle' : 'rect',
          delay: Math.random() * 18,
        });
      }
      let frame = 0;
      const step = () => {
        frame++;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        let alive = 0;
        for (const p of parts) {
          if (frame < p.delay) {
            alive++;
            continue;
          }
          p.vy += 0.32;
          p.vx *= 0.99;
          p.vy = Math.min(p.vy, 6 + p.w * 0.2);
          p.x += p.vx + Math.sin((frame + p.delay * 10) / 12) * 0.8;
          p.y += p.vy;
          p.rot += p.vr;
          if (p.y < innerHeight + 30) alive++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
            ctx.fill();
          } else ctx.fillRect(-p.w / 2, -p.h / 4, p.w, p.h / 2 + Math.abs(Math.sin(p.rot)) * p.h / 2);
          ctx.restore();
        }
        if (alive && frame < 600) requestAnimationFrame(step);
        else c.remove();
      };
      requestAnimationFrame(step);
    },

    deptBadge(dept) {
      return `<span class="badge" style="--c:${AA.deptColor(dept)}">${AA.escapeHtml(AA.deptName(dept))}</span>`;
    },

    xpBar(pct) {
      return `<div class="xpbar"><div class="xpbar-fill" style="width:${Math.round(Math.max(0, Math.min(1, pct)) * 100)}%"></div></div>`;
    },

    portraitCanvas(who, size) {
      const c = document.createElement('canvas');
      c.width = size || 72;
      c.height = size || 72;
      c.className = 'portrait';
      AA.Sprites.drawPortrait(c, AA.State.CHARACTERS[who]);
      return c;
    },
  };

  AA.UI = UI;
})();
