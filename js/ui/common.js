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
          ${opts.title ? `<header class="modal-head"><h2>${opts.title}</h2>${this.modalClosable ? '<button class="modal-x" aria-label="Cerrar">✕</button>' : ''}</header>` : ''}
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

    deptBadge(dept) {
      const color = AA.State.DEPT_COLORS[dept] || '#8b95a7';
      return `<span class="badge" style="--c:${color}">${AA.escapeHtml(dept)}</span>`;
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
