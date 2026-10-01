/*
 * Analyst Adventure — Arranque y control de pantallas.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const esc = (s) => AA.escapeHtml(s);

  const Game = {
    screen: 'title',

    boot() {
      AA.UI.init();
      AA.Dialog.init(document.getElementById('dialog'));
      AA.Office.init(document.getElementById('office-canvas'), {
        onInteract: (id) => this.interact(id),
        getMarkers: () => this.markers(),
        paused: () => this.screen !== 'office' || AA.Dialog.isOpen() || AA.UI.isModalOpen(),
      });
      this.bindTitle();
      this.bindHud();
      window.addEventListener('keydown', (e) => this.handleKey(e));
      this.show('title');
    },

    show(name) {
      this.screen = name;
      document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === 'screen-' + name));
      if (name === 'office') AA.Office.start();
      else AA.Office.stop();
    },

    // --- Pantalla de título
    bindTitle() {
      const hasSave = AA.State.hasSave() && AA.State.load();
      const cont = document.getElementById('btn-continue');
      const reset = document.getElementById('btn-reset');
      const form = document.getElementById('new-game');
      const input = document.getElementById('player-name');
      if (hasSave) {
        cont.hidden = false;
        reset.hidden = false;
        cont.innerHTML = `Continuar como <b>${esc(AA.State.data.name)}</b> <span>· ${esc(AA.State.rank().name)}</span>`;
      }
      cont.addEventListener('click', () => {
        if (AA.State.load()) this.enterOffice();
      });
      reset.addEventListener('click', () => {
        AA.UI.modal({
          title: '¿Borrar la partida?',
          html: '<p>Se pierde todo el progreso guardado en este navegador.</p>',
          buttons: [
            { label: 'Cancelar' },
            {
              label: 'Borrar',
              primary: true,
              action: () => {
                AA.State.reset();
                cont.hidden = true;
                reset.hidden = true;
              },
            },
          ],
        });
      });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = input.value.trim().slice(0, 24);
        if (!name) {
          input.focus();
          input.classList.add('shake');
          setTimeout(() => input.classList.remove('shake'), 400);
          return;
        }
        const start = () => {
          AA.State.newGame(name);
          AA.Office.player.x = 11 * 32 + 16;
          AA.Office.player.y = 9 * 32 + 26;
          this.enterOffice();
        };
        if (AA.State.hasSave()) {
          AA.UI.modal({
            title: '¿Empezar de nuevo?',
            html: '<p>Ya hay una partida guardada. Si empezás una nueva, se reemplaza.</p>',
            buttons: [{ label: 'Cancelar' }, { label: 'Nueva partida', primary: true, action: start }],
          });
        } else start();
      });
    },

    // --- HUD de la oficina
    bindHud() {
      document.getElementById('hud-career').addEventListener('click', () => AA.Screens.openCareer());
      document.getElementById('hud-manual').addEventListener('click', () => AA.Screens.openManual());
      document.getElementById('hud-menu').addEventListener('click', () => {
        AA.UI.modal({
          title: 'Menú',
          html: '<p>Tu progreso se guarda automáticamente en este navegador.</p>',
          buttons: [
            { label: 'Volver al título', action: () => location.reload() },
            { label: 'Seguir jugando', primary: true },
          ],
        });
      });
    },
    updateHud() {
      const st = AA.State;
      const prog = st.rankProgress();
      document.getElementById('hud-player').innerHTML = `
        <div class="hud-name">${esc(st.data.name)}</div>
        <div class="hud-rank">${esc(prog.cur.name)}</div>
        ${AA.UI.xpBar(prog.pct)}
        <div class="hud-xp">${st.data.xp} XP${prog.next ? ` · próximo: ${esc(prog.next.name)} (${prog.next.xp})` : ''}</div>`;
      document.getElementById('hud-missions').textContent = `Tareas ${st.completedCount()}/${AA.Missions.list.length}`;
    },

    markers() {
      const st = AA.State;
      if (!st.data) return {};
      const m = {};
      if (!st.data.flags.intro || st.data.flags.rankSeen < st.rankIndex()) m.marta = true;
      else if (st.nextMission()) m.computer = true;
      if (st.data.flags.intro && !st.data.flags.metLeo) m.leo = true;
      return m;
    },

    // --- Navegación
    enterOffice() {
      this.show('office');
      this.updateHud();
      if (!AA.State.data.flags.intro) setTimeout(() => AA.Story.intro(), 400);
      else if (AA.State.data.flags.rankSeen < AA.State.rankIndex()) {
        AA.UI.toast('📣 <b>Marta</b> quiere hablar con vos en su oficina.', 'info');
      }
    },
    openComputer() {
      this.show('computer');
      AA.Screens.Inbox.render();
    },
    openMission(id) {
      const m = AA.Missions.byId(id);
      if (!m || !AA.State.isAvailable(m)) return;
      this.show('mission');
      AA.Screens.MissionScreen.open(m);
    },

    interact(id) {
      switch (id) {
        case 'computer':
          if (!AA.State.data.flags.intro) {
            AA.Dialog.open([{ who: 'narrator', text: 'La computadora pide usuario y contraseña. Mejor hablá primero con Marta, en la oficina de vidrio.' }]);
            return;
          }
          this.openComputer();
          return;
        case 'whiteboard':
          AA.Screens.openCareer();
          return;
        case 'marta':
          AA.Story.marta();
          return;
        case 'leo':
          AA.Story.leo();
          return;
        case 'sofi':
          AA.Story.sofi();
          return;
        case 'tomas':
          AA.Story.tomas();
          return;
        default:
          AA.Story.flavor(id);
      }
    },

    handleKey(e) {
      if (e.defaultPrevented) return;
      if (AA.UI.isModalOpen()) {
        if (e.key === 'Escape' && AA.UI.modalClosable) {
          e.preventDefault();
          AA.UI.closeModal();
        }
        return;
      }
      if (AA.Dialog.isOpen()) {
        if (!e.repeat) AA.Dialog.handleKey(e);
        else e.preventDefault();
        return;
      }
      if (this.screen === 'computer' && e.key === 'Escape') {
        e.preventDefault();
        this.enterOffice();
      }
    },
  };

  AA.Game = Game;
  window.addEventListener('DOMContentLoaded', () => Game.boot());
})();
