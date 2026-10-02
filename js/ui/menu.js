/*
 * Analyst Adventure — Menú principal: Jugar (3 ranuras), Opciones y Salir.
 * El panel de opciones también se usa dentro del juego (menú ☰).
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const esc = (s) => AA.escapeHtml(s);
  const T = (es, en) => AA.T(es, en);

  const Menu = {
    root: null,
    view: 'main',

    init() {
      this.root = document.getElementById('menu-content');
      AA.MenuBg.init(document.getElementById('menu-bg'));
      // Navegación con teclado: flechas entre elementos [data-nav], Enter elige, Esc vuelve.
      this.root.addEventListener('keydown', (e) => this.handleKey(e));
      this.root.addEventListener('mouseover', (e) => {
        const el = e.target.closest('[data-nav]');
        if (el && document.activeElement !== el && el.tagName !== 'INPUT') {
          el.focus({ preventScroll: true });
        }
      });
      this.root.addEventListener('focusin', (e) => {
        if (e.target.closest('[data-nav]')) AA.Audio.play('move');
      });
      AA.Settings.onChange = () => {
        if (this.view === 'options' && AA.Game.screen === 'title') this.show('options');
        if (this.optionsHost) this.renderOptions(this.optionsHost);
      };
    },

    open() {
      AA.MenuBg.start();
      this.renderChrome();
      this.show('main');
    },
    close() {
      AA.MenuBg.stop();
    },

    renderChrome() {
      document.getElementById('menu-tagline').textContent = T('De pasante a Senior, una celda a la vez.', 'From intern to Senior, one cell at a time.');
      document.getElementById('menu-foot').innerHTML = `v${AA.VERSION} · ${T('De Pasante a Senior: 19 niveles', 'From Intern to Senior: 19 levels')} · <kbd>↑</kbd><kbd>↓</kbd> ${T('mover', 'move')} · <kbd>Enter</kbd> ${T('elegir', 'select')} · <kbd>Esc</kbd> ${T('volver', 'back')}`;
    },

    show(view) {
      this.view = view;
      this.root.className = 'menu-content view-' + view;
      if (view === 'main') this.renderMain();
      else if (view === 'slots') this.renderSlots();
      else if (view === 'options') this.renderOptionsPage();
      const first = this.root.querySelector('[data-autofocus]') || this.root.querySelector('[data-nav]');
      if (first) first.focus({ preventScroll: true });
    },

    // -----------------------------------------------------------------------
    renderMain() {
      const desk = !!AA.Storage.desktop();
      this.root.innerHTML = `
        <nav class="menu-main">
          <button class="menu-btn" data-nav data-act="play" data-autofocus><span class="ico">▶</span>${T('Jugar', 'Play')}</button>
          <button class="menu-btn" data-nav data-act="options"><span class="ico">⚙</span>${T('Opciones', 'Options')}</button>
          ${desk ? `<button class="menu-btn" data-nav data-act="quit"><span class="ico">⏻</span>${T('Salir del juego', 'Quit game')}</button>` : ''}
        </nav>`;
      this.root.querySelector('[data-act="play"]').addEventListener('click', () => {
        AA.Audio.play('select');
        this.show('slots');
      });
      this.root.querySelector('[data-act="options"]').addEventListener('click', () => {
        AA.Audio.play('select');
        this.show('options');
      });
      const quit = this.root.querySelector('[data-act="quit"]');
      if (quit) quit.addEventListener('click', () => AA.Storage.desktop().quit());
    },

    // -----------------------------------------------------------------------
    renderSlots(editing) {
      const fmtDate = (ts) => new Date(ts).toLocaleDateString(AA.lang === 'en' ? 'en-US' : 'es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      const cards = [1, 2, 3]
        .map((i) => {
          const s = AA.State.slotSummary(i);
          if (editing === i) {
            return `
              <form class="slot-card editing" data-slot="${i}">
                <div class="slot-num">${T('Ranura', 'Slot')} ${i}</div>
                <label for="slot-name-${i}">${T('¿Cómo te llamás?', "What's your name?")}</label>
                <input id="slot-name-${i}" maxlength="20" autocomplete="off" data-nav data-autofocus placeholder="${T('Tu nombre', 'Your name')}">
                <div class="slot-actions">
                  <button class="btn btn-primary" type="submit" data-nav>${T('Comenzar', 'Start')}</button>
                  <button class="btn btn-ghost" type="button" data-nav data-act="cancel">${T('Cancelar', 'Cancel')}</button>
                </div>
              </form>`;
          }
          if (!s) {
            return `
              <div class="slot-card empty" data-slot="${i}">
                <div class="slot-num">${T('Ranura', 'Slot')} ${i}</div>
                <div class="slot-empty-icon">+</div>
                <div class="muted">${T('Vacía', 'Empty')}</div>
                <button class="btn btn-primary" data-nav data-act="new" ${i === 1 ? 'data-autofocus' : ''}>${T('Nueva partida', 'New game')}</button>
              </div>`;
          }
          const pct = Math.round((s.done / s.total) * 100);
          return `
            <div class="slot-card" data-slot="${i}">
              <div class="slot-num">${T('Ranura', 'Slot')} ${i}</div>
              <div class="slot-name">${esc(s.name)}</div>
              <div class="slot-rank">${esc(s.rank)} · ${s.xp} XP</div>
              <div class="slot-progress"><div style="width:${pct}%"></div></div>
              <div class="muted small">${T('Tareas', 'Tasks')} ${s.done}/${s.total} · ${fmtDate(s.lastPlayed)}</div>
              ${s.migrated ? `<div class="slot-note">${T('Partida de la versión anterior: el progreso se reinició con la nueva carrera.', 'Save from the previous version: progress was reset for the new career.')}</div>` : ''}
              <div class="slot-actions">
                <button class="btn btn-primary" data-nav data-act="continue" ${i === 1 ? 'data-autofocus' : ''}>${T('Continuar', 'Continue')}</button>
                <button class="btn btn-ghost danger" data-nav data-act="delete" title="${T('Borrar partida', 'Delete save')}">🗑</button>
              </div>
            </div>`;
        })
        .join('');
      this.root.innerHTML = `
        <h2 class="menu-h">${T('Elegí una partida', 'Choose a save slot')}</h2>
        <div class="slots">${cards}</div>
        <button class="menu-back" data-nav data-act="back">← ${T('Volver', 'Back')}</button>`;

      this.root.querySelector('[data-act="back"]').addEventListener('click', () => this.back());
      this.root.querySelectorAll('[data-slot]').forEach((card) => {
        const i = Number(card.dataset.slot);
        const on = (act, fn) => {
          const b = card.querySelector(`[data-act="${act}"]`);
          if (b) b.addEventListener('click', fn);
        };
        on('new', () => {
          AA.Audio.play('select');
          this.renderSlots(i);
          card.ownerDocument.getElementById('slot-name-' + i).focus();
        });
        on('continue', () => {
          AA.Audio.play('select');
          if (AA.State.loadSlot(i)) AA.Game.startGame();
        });
        on('delete', () => {
          AA.UI.modal({
            title: T('¿Borrar la partida?', 'Delete this save?'),
            html: `<p>${T(`Se pierde todo el progreso de la ranura ${i}.`, `All progress in slot ${i} will be lost.`)}</p>`,
            buttons: [
              { label: T('Cancelar', 'Cancel') },
              {
                label: T('Borrar', 'Delete'),
                primary: true,
                action: () => {
                  AA.State.deleteSlot(i);
                  AA.Audio.play('back');
                  this.renderSlots();
                },
              },
            ],
          });
        });
        on('cancel', () => {
          AA.Audio.play('back');
          this.renderSlots();
        });
        if (card.tagName === 'FORM') {
          card.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = card.querySelector('input');
            const name = input.value.trim().slice(0, 20);
            if (!name) {
              AA.Audio.play('error');
              input.classList.add('shake');
              setTimeout(() => input.classList.remove('shake'), 400);
              return;
            }
            AA.Audio.play('unlock');
            AA.State.newGame(i, name);
            AA.Game.startGame();
          });
        }
      });
      const auto = this.root.querySelector('[data-autofocus]');
      if (auto) auto.focus({ preventScroll: true });
    },

    // -----------------------------------------------------------------------
    renderOptionsPage() {
      this.root.innerHTML = `
        <h2 class="menu-h">${T('Opciones', 'Options')}</h2>
        <div class="options-host"></div>
        <button class="menu-back" data-nav data-act="back">← ${T('Volver', 'Back')}</button>`;
      this.renderOptions(this.root.querySelector('.options-host'));
      this.root.querySelector('[data-act="back"]').addEventListener('click', () => this.back());
    },

    // Panel de opciones reutilizable (menú principal y menú dentro del juego).
    renderOptions(host) {
      const S = AA.Settings;
      const v = S.data.volume;
      const desk = S.canResize();
      const fs = S.isFullscreen();
      const slider = (key, label) => `
        <label class="opt-row">
          <span>${label}</span>
          <input type="range" min="0" max="100" step="5" value="${Math.round(v[key] * 100)}" data-vol="${key}" data-nav>
          <b data-vol-label="${key}">${Math.round(v[key] * 100)}%</b>
        </label>`;
      const seg = (name, options, current) =>
        `<div class="seg" role="group">${options
          .map(([val, label, disabled]) => `<button type="button" data-nav data-${name}="${val}" class="${val === current ? 'on' : ''}" ${disabled ? 'disabled' : ''}>${label}</button>`)
          .join('')}</div>`;
      host.innerHTML = `
        <div class="options">
          <section>
            <h3>🔊 ${T('Sonido', 'Sound')}</h3>
            ${slider('master', T('General', 'Master'))}
            <div class="opt-row"><span>${T('Música de fondo', 'Background music')}</span>${seg('music', [['on', `🎵 ${T('Activada', 'On')}`], ['off', `🔇 ${T('Desactivada', 'Off')}`]], S.data.musicOn === false ? 'off' : 'on')}</div>
            ${slider('music', T('Volumen de la música', 'Music volume'))}
            ${slider('sfx', T('Efectos', 'Effects'))}
            ${slider('voice', T('Voces (diálogos)', 'Voices (dialogue)'))}
          </section>
          <section>
            <h3>🖥 ${T('Pantalla', 'Display')}</h3>
            <div class="opt-row"><span>${T('Modo', 'Mode')}</span>${seg('fs', [['window', T('Ventana', 'Windowed')], ['full', T('Pantalla completa', 'Fullscreen')]], fs ? 'full' : 'window')}</div>
            ${
              desk
                ? `<div class="opt-row"><span>${T('Tamaño de ventana', 'Window size')}</span>${seg('size', S.WINDOW_SIZES.map((sz) => [sz, sz.replace('x', '×'), fs]), S.data.windowSize)}</div>`
                : `<p class="muted small">${T('El tamaño de ventana se elige en la versión de escritorio.', 'Window size can be chosen in the desktop version.')}</p>`
            }
            <p class="muted small"><kbd>F11</kbd> ${desk ? '/ <kbd>Alt</kbd>+<kbd>Enter</kbd> ' : ''}${T('alterna pantalla completa.', 'toggles fullscreen.')}</p>
          </section>
          <section>
            <h3>🌐 ${T('Idioma', 'Language')}</h3>
            <div class="opt-row"><span>${T('Idioma del juego', 'Game language')}</span>${seg('lang', [['es', 'Español'], ['en', 'English']], AA.lang)}</div>
          </section>
        </div>`;

      host.querySelectorAll('[data-vol]').forEach((inp) => {
        const key = inp.dataset.vol;
        inp.addEventListener('input', () => {
          S.setVolume(key, Number(inp.value) / 100);
          // Mover el volumen de la música con la música apagada la vuelve a encender.
          if (key === 'music' && S.data.musicOn === false && Number(inp.value) > 0) {
            S.setMusicOn(true);
            host.querySelectorAll('[data-music]').forEach((x) => x.classList.toggle('on', x.dataset.music === 'on'));
            inp.closest('.opt-row').classList.remove('dim');
          }
          host.querySelector(`[data-vol-label="${key}"]`).textContent = inp.value + '%';
        });
        inp.addEventListener('change', () => {
          if (key === 'voice') {
            AA.Audio.blip(330);
            setTimeout(() => AA.Audio.blip(300), 110);
          } else AA.Audio.play('select');
        });
      });
      host.querySelectorAll('[data-music]').forEach((b) =>
        b.addEventListener('click', () => {
          AA.Audio.play('select');
          S.setMusicOn(b.dataset.music === 'on');
          host.querySelectorAll('[data-music]').forEach((x) => x.classList.toggle('on', x === b));
          const range = host.querySelector('[data-vol="music"]');
          if (range) range.closest('.opt-row').classList.toggle('dim', !S.data.musicOn);
        })
      );
      const musicRange = host.querySelector('[data-vol="music"]');
      if (musicRange) musicRange.closest('.opt-row').classList.toggle('dim', S.data.musicOn === false);
      host.querySelectorAll('[data-fs]').forEach((b) =>
        b.addEventListener('click', () => {
          AA.Audio.play('select');
          S.setFullscreen(b.dataset.fs === 'full');
          setTimeout(() => this.renderOptions(host), 350);
        })
      );
      host.querySelectorAll('[data-size]').forEach((b) =>
        b.addEventListener('click', () => {
          AA.Audio.play('select');
          S.setWindowSize(b.dataset.size);
          this.renderOptions(host);
        })
      );
      host.querySelectorAll('[data-lang]').forEach((b) =>
        b.addEventListener('click', () => {
          if (b.dataset.lang === AA.lang) return;
          AA.Audio.play('select');
          S.setLang(b.dataset.lang);
          if (AA.Game.screen === 'title') {
            this.renderChrome();
            this.show('options');
          } else {
            AA.Game.onLanguageChanged();
          }
        })
      );
    },

    back() {
      AA.Audio.play('back');
      this.show('main');
    },

    handleKey(e) {
      const items = [...this.root.querySelectorAll('[data-nav]')].filter((el) => !el.disabled && el.offsetParent !== null);
      const i = items.indexOf(document.activeElement);
      const isRange = document.activeElement && document.activeElement.type === 'range';
      const isText = document.activeElement && document.activeElement.tagName === 'INPUT' && !isRange;
      if (e.key === 'ArrowDown' || (e.key === 'ArrowRight' && !isRange && !isText)) {
        e.preventDefault();
        items[(i + 1 + items.length) % items.length].focus();
      } else if (e.key === 'ArrowUp' || (e.key === 'ArrowLeft' && !isRange && !isText)) {
        e.preventDefault();
        items[(i - 1 + items.length) % items.length].focus();
      } else if (e.key === 'Escape' && this.view !== 'main' && AA.Game.screen === 'title' && !AA.UI.isModalOpen()) {
        e.preventDefault();
        if (this.view === 'slots' && this.root.querySelector('form.slot-card')) this.renderSlots();
        else this.back();
      }
    },
  };

  AA.Menu = Menu;
})();
