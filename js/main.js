/*
 * Analyst Adventure — Arranque y control de pantallas.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const esc = (s) => AA.escapeHtml(s);
  const T = (es, en) => AA.T(es, en);
  const Cu = () => AA.Curriculum;

  AA.VERSION = '0.4.1';

  const Game = {
    screen: 'title',

    boot() {
      AA.UI.init();
      AA.Settings.load();
      AA.Audio.installUnlock();
      AA.Audio.ensure();
      AA.Audio.startMusic();
      AA.Dialog.init(document.getElementById('dialog'));
      AA.Office.init(document.getElementById('office-canvas'), {
        onInteract: (id) => this.interact(id),
        getMarkers: () => this.markers(),
        paused: () => this.screen !== 'office' || AA.Dialog.isOpen() || AA.UI.isModalOpen(),
      });
      AA.Menu.init();
      this.bindHud();
      window.addEventListener('keydown', (e) => this.handleKey(e));
      this.goToTitle();
    },

    show(name) {
      if (name !== this.screen) document.getElementById('toast').innerHTML = '';
      this.screen = name;
      document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === 'screen-' + name));
      if (name === 'office') AA.Office.start();
      else AA.Office.stop();
      if (name !== 'title') AA.Menu.close();
      AA.Audio.setDuck(name === 'mission' ? 0.45 : 1);
    },

    goToTitle() {
      this.show('title');
      AA.Menu.open();
    },

    // Se llama cuando una ranura quedó cargada (nueva o existente).
    startGame() {
      AA.Screens.clearCache();
      AA.Office.player.x = AA.Office.START.x;
      AA.Office.player.y = AA.Office.START.y;
      AA.Office.player.dir = 'up';
      this.enterOffice();
    },

    // --- HUD de la oficina
    bindHud() {
      document.getElementById('hud-notebook').addEventListener('click', () => AA.Screens.openNotebook());
      document.getElementById('hud-career').addEventListener('click', () => AA.Screens.openCareer());
      document.getElementById('hud-menu').addEventListener('click', () => this.openGameMenu());
    },
    updateHud() {
      const st = AA.State;
      if (!st.data) return;
      const prog = st.rankProgress();
      const cur = Cu().currentModule();
      const level = cur
        ? `${T('Nivel', 'Level')} ${Cu().MODULES.indexOf(cur) + 1} · ${esc(AA.L(cur.title))} · ${Cu().doneCount(cur)}/${Cu().REQUIRED}`
        : T('Todos los niveles disponibles completos · ¡Practicá!', 'All available levels complete · Keep practicing!');
      document.getElementById('hud-player').innerHTML = `
        <div class="hud-name">${esc(st.data.name)}</div>
        <div class="hud-rank">${esc(AA.L(prog.cur.name))}</div>
        ${AA.UI.xpBar(prog.pct)}
        <div class="hud-xp">${st.data.xp} XP${prog.next ? ` · ${T('próximo', 'next')}: ${esc(AA.L(prog.next.name))} (${prog.next.xp})` : ''}</div>
        <div class="hud-level">${level}</div>`;
      document.getElementById('hud-notebook').innerHTML = `📒 ${T('Libreta', 'Notebook')}`;
      document.getElementById('hud-career').innerHTML = `📈 ${T('Carrera', 'Career')}`;
      document.getElementById('hud-help').innerHTML = T(
        '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / flechas: caminar · <kbd>E</kbd> o <kbd>Espacio</kbd>: interactuar · <kbd>Esc</kbd>: menú',
        '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / arrows: walk · <kbd>E</kbd> or <kbd>Space</kbd>: interact · <kbd>Esc</kbd>: menu'
      );
    },

    markers() {
      const st = AA.State;
      if (!st.data) return {};
      const m = {};
      if (!st.data.flags.intro || st.data.flags.rankSeen < st.rankIndex()) m.marta = true;
      if (st.data.flags.intro && Cu().pendingLesson()) m.leo = true;
      else if (st.data.flags.intro && Cu().nextMission()) m.computer = true;
      return m;
    },

    // --- Menú dentro del juego
    openGameMenu() {
      const desk = AA.Storage.desktop();
      const buttons = [
        { label: `⚙ ${T('Opciones', 'Options')}`, action: () => this.openOptions() },
        {
          label: `⌂ ${T('Menú principal', 'Main menu')}`,
          action: () => {
            AA.State.save();
            this.goToTitle();
          },
        },
      ];
      if (desk) buttons.push({ label: `⏻ ${T('Salir del juego', 'Quit game')}`, action: () => desk.quit() });
      buttons.push({ label: T('Seguir jugando', 'Keep playing'), primary: true });
      AA.UI.modal({
        title: T('Pausa', 'Paused'),
        html: `<p>${T('Tu progreso se guarda automáticamente en la ranura', 'Your progress is saved automatically in slot')} ${AA.State.slot}.</p>`,
        wide: true,
        buttons,
      });
    },
    openOptions() {
      AA.UI.modal({
        title: `⚙ ${T('Opciones', 'Options')}`,
        wide: true,
        html: '<div class="options-host in-game"></div>',
        buttons: [{ label: T('Listo', 'Done'), primary: true }],
        onOpen: (card) => {
          AA.Menu.optionsHost = card.querySelector('.options-host');
          AA.Menu.renderOptions(AA.Menu.optionsHost);
        },
        onClose: () => (AA.Menu.optionsHost = null),
      });
    },
    onLanguageChanged() {
      AA.Screens.clearCache();
      this.updateHud();
      const modal = document.querySelector('#modal .modal-head h2');
      if (modal && AA.Menu.optionsHost) {
        modal.textContent = `⚙ ${T('Opciones', 'Options')}`;
        document.querySelector('#modal .modal-foot .btn').textContent = T('Listo', 'Done');
        AA.Menu.renderOptions(AA.Menu.optionsHost);
      }
    },

    // --- Navegación
    enterOffice() {
      this.show('office');
      this.updateHud();
      const st = AA.State;
      if (!st.data.flags.intro) setTimeout(() => AA.Story.intro(), 400);
      else if (st.data.flags.rankSeen < st.rankIndex()) AA.UI.toast(T('📣 <b>Marta</b> quiere hablar con vos en su oficina.', '📣 <b>Marta</b> wants to talk to you in her office.'), 'info');
      else if (Cu().pendingLesson()) AA.UI.toast(T('☕ <b>Leo</b> tiene algo nuevo para enseñarte (junto al café).', '☕ <b>Leo</b> has something new to teach you (by the coffee machine).'), 'info');
    },
    openComputer() {
      this.show('computer');
      AA.Screens.Inbox.render();
    },
    openMission(id) {
      const p = Cu().parseId(id);
      if (!p) return;
      if (p.kind === 'story' && !Cu().missionAvailable(id)) return;
      this.show('mission');
      AA.Screens.MissionScreen.open(id);
    },
    startPractice(mod, size) {
      const st = AA.State;
      const go = () => {
        const id = Cu().newPractice(mod, size);
        st.data.activePractice[mod.id] = id;
        st.save();
        this.openMission(id);
      };
      const active = st.data.activePractice[mod.id];
      if (active && st.data.progress[active]) {
        AA.UI.modal({
          title: T('¿Descartar el caso en curso?', 'Discard the case in progress?'),
          html: `<p>${T('Ya tenés un caso de práctica empezado en este nivel. Si generás uno nuevo, se descarta.', 'You already started a practice case in this level. Generating a new one discards it.')}</p>`,
          buttons: [
            { label: T('Cancelar', 'Cancel') },
            {
              label: T('Generar uno nuevo', 'Generate a new one'),
              primary: true,
              action: () => {
                delete st.data.progress[active];
                go();
              },
            },
          ],
        });
      } else go();
    },

    interact(id) {
      const st = AA.State;
      switch (id) {
        case 'computer':
          if (!st.data.flags.intro) {
            AA.Dialog.open([{ who: 'narrator', text: { es: 'La computadora pide usuario y contraseña. Mejor hablá primero con Marta, en la oficina de vidrio.', en: 'The computer asks for a username and password. Better talk to Marta first, in the glass office.' } }]);
            return;
          }
          if (!Cu().lessonDone(Cu().MODULES[0])) {
            AA.Dialog.open([{ who: 'narrator', text: { es: 'Antes de arrancar, Leo quería explicarte lo básico. Está junto a la máquina de café.', en: 'Before you start, Leo wanted to explain the basics. He is by the coffee machine.' } }]);
            return;
          }
          AA.Audio.play('select');
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
      if (e.key !== 'Escape') return;
      if (this.screen === 'computer') {
        e.preventDefault();
        this.enterOffice();
      } else if (this.screen === 'office') {
        e.preventDefault();
        this.openGameMenu();
      }
    },
  };

  AA.Game = Game;
  window.addEventListener('DOMContentLoaded', () => Game.boot());
})();
