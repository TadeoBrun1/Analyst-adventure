/*
 * Analyst Adventure — Cuadro de diálogo con efecto máquina de escribir y opciones.
 * lines: [{ who: 'marta', text: '...', choices?: [{ label, action }] }]
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});

  const Dialog = {
    root: null,
    lines: [],
    index: 0,
    timer: null,
    onDone: null,

    init(root) {
      this.root = root;
      root.innerHTML = `
        <div class="dlg-box">
          <canvas class="dlg-portrait" width="96" height="96"></canvas>
          <div class="dlg-body">
            <div class="dlg-name"></div>
            <div class="dlg-text"></div>
            <div class="dlg-choices"></div>
            <div class="dlg-next">▼</div>
          </div>
        </div>`;
      this.portrait = root.querySelector('.dlg-portrait');
      this.nameEl = root.querySelector('.dlg-name');
      this.textEl = root.querySelector('.dlg-text');
      this.choicesEl = root.querySelector('.dlg-choices');
      this.nextEl = root.querySelector('.dlg-next');
      root.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-choice]');
        if (btn) {
          this.choose(+btn.dataset.choice);
          return;
        }
        this.advance();
      });
    },

    isOpen() {
      return this.root && !this.root.classList.contains('hidden');
    },

    open(lines, onDone) {
      this.lines = lines.filter(Boolean);
      if (!this.lines.length) {
        if (onDone) onDone();
        return;
      }
      this.index = 0;
      this.onDone = onDone || null;
      this.root.classList.remove('hidden');
      this.showLine();
    },

    close() {
      clearTimeout(this.timer);
      this.root.classList.add('hidden');
      const cb = this.onDone;
      this.onDone = null;
      if (cb) cb();
    },

    current() {
      return this.lines[this.index];
    },

    showLine() {
      const line = this.current();
      const ch = AA.State.CHARACTERS[line.who] || { name: line.who };
      const name = line.who === 'player' ? AA.State.data.name : AA.L(ch.name);
      const role = AA.L(ch.role);
      this.nameEl.innerHTML = `${AA.escapeHtml(name)}${role ? ` <span>· ${AA.escapeHtml(role)}</span>` : ''}`;
      if (ch.skin) {
        this.portrait.style.display = '';
        AA.Sprites.drawPortrait(this.portrait, ch);
      } else this.portrait.style.display = 'none';
      this.voice = ch.voice || 0;
      this.full = AA.fillName(AA.L(line.text));
      // La línea se divide en etiquetas HTML, espacios y palabras; se revela palabra por palabra.
      this.tokens = this.full.match(/<[^>]*>|\s+|[^<\s]+/g) || [];
      this.pos = 0;
      this.textEl.innerHTML = '';
      this.choicesEl.innerHTML = '';
      this.nextEl.style.visibility = 'hidden';
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.tick(), 80);
    },

    // Muestra la siguiente palabra (con su "bip") y programa la próxima.
    tick() {
      let word = null;
      while (this.pos < this.tokens.length) {
        const tok = this.tokens[this.pos++];
        if (tok[0] !== '<' && /\S/.test(tok)) {
          word = tok;
          break;
        }
      }
      if (!word) {
        this.finishLine();
        return;
      }
      this.textEl.innerHTML = this.tokens.slice(0, this.pos).join('');
      const plain = word.replace(/&[a-z]+;/g, 'x');
      if (/[\p{L}\p{N}]/u.test(plain)) AA.Audio.blip(this.voice);
      let delay = 55 + Math.min(plain.length, 10) * 7;
      if (/[.!?…:]$/.test(plain)) delay += 160;
      else if (/[,;]$/.test(plain)) delay += 70;
      if (this.pos >= this.tokens.length) {
        this.finishLine();
        return;
      }
      this.timer = setTimeout(() => this.tick(), delay);
    },

    finishLine() {
      clearTimeout(this.timer);
      this.timer = null;
      this.textEl.innerHTML = this.full;
      const line = this.current();
      if (line.choices) {
        this.choicesEl.innerHTML = line.choices
          .map((c, i) => `<button class="btn btn-choice" data-choice="${i}"><kbd>${i + 1}</kbd> ${AA.escapeHtml(c.label)}</button>`)
          .join('');
        this.nextEl.style.visibility = 'hidden';
      } else this.nextEl.style.visibility = 'visible';
    },

    advance() {
      if (!this.isOpen()) return;
      if (this.timer) {
        this.finishLine();
        return;
      }
      if (this.current().choices) return;
      this.index++;
      if (this.index >= this.lines.length) this.close();
      else this.showLine();
    },

    choose(i) {
      const line = this.current();
      if (!line || !line.choices || this.timer) return;
      const c = line.choices[i];
      if (!c) return;
      this.root.classList.add('hidden');
      clearTimeout(this.timer);
      this.onDone = null;
      AA.Audio.play('select');
      if (c.action) c.action();
    },

    handleKey(e) {
      if (!this.isOpen()) return false;
      if (e.key === ' ' || e.key === 'Enter' || e.key.toLowerCase() === 'e') {
        e.preventDefault();
        this.advance();
      } else if (/^[1-9]$/.test(e.key)) {
        this.choose(+e.key - 1);
      } else if (e.key === 'Escape') {
        const line = this.current();
        if (!line.choices) this.close();
      }
      return true;
    },
  };

  AA.Dialog = Dialog;
})();
