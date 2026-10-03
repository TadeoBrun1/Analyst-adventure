/*
 * Analyst Adventure — Arranque y control de pantallas.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const esc = (s) => AA.escapeHtml(s);
  const T = (es, en) => AA.T(es, en);
  const Cu = () => AA.Curriculum;

  AA.VERSION = '0.7.2';

  const Game = {
    screen: 'title',

    boot() {
      AA.UI.init();
      AA.Settings.load();
      AA.Audio.installUnlock();
      AA.Audio.ensure();
      AA.Audio.startMusic('lofi');
      AA.Dialog.init(document.getElementById('dialog'));
      AA.Office.init(document.getElementById('office-canvas'), {
        onInteract: (id) => this.interact(id),
        getMarkers: () => this.markers(),
        paused: () => this.screen !== 'office' || AA.Dialog.isOpen() || AA.UI.isModalOpen() || AA.Tour.isOpen(),
      });
      AA.Menu.init();
      this.bindHud();
      window.addEventListener('keydown', (e) => this.handleKey(e));
      this.goToTitle();
    },

    show(name) {
      if (name !== this.screen) document.getElementById('toast').innerHTML = '';
      this.screen = name;
      // La presentación usa la misma pantalla (y lienzo) que la oficina.
      const section = name === 'present' ? 'office' : name === 'arcade' ? 'mission' : name;
      document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === 'screen-' + section));
      document.getElementById('screen-office').classList.toggle('presenting', name === 'present');
      if (name !== 'present') AA.Office.stopPresentation();
      if (name === 'office' || name === 'present') AA.Office.start();
      else AA.Office.stop();
      if (name !== 'title') AA.Menu.close();
      AA.Audio.setDuck(name === 'mission' ? 0.45 : name === 'arcade' ? 0.75 : 1);
      // Menú: lo-fi tranquilo · oficina y tareas: el tema alegre de la oficina · ARCADE: chiptune que acelera.
      AA.Audio.startMusic(name === 'title' ? 'lofi' : name === 'arcade' ? 'arcade' : 'office');
    },

    goToTitle() {
      this.show('title');
      AA.Menu.open();
    },

    // Se llama cuando una ranura quedó cargada (nueva o existente).
    startGame() {
      AA.Screens.clearCache();
      this.hudXp = undefined;
      AA.Office.player.x = AA.Office.START.x;
      AA.Office.player.y = AA.Office.START.y;
      AA.Office.player.dir = 'up';
      AA.Office.standUp();
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
      // El rango, la XP y el nivel actual se ven en la libreta; el botón "salta" cuando sumás XP.
      if (this.hudXp !== undefined && st.data.xp > this.hudXp) {
        const b = document.getElementById('hud-notebook');
        b.classList.remove('bump');
        void b.offsetWidth;
        b.classList.add('bump');
      }
      this.hudXp = st.data.xp;
      document.getElementById('hud-notebook').innerHTML = `📒 ${T('Libreta', 'Notebook')} <kbd>F</kbd>`;
      document.getElementById('hud-career').innerHTML = `📈 ${T('Carrera', 'Career')}`;
      document.getElementById('hud-help').innerHTML = T(
        '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / flechas: caminar · <kbd>E</kbd> o <kbd>Espacio</kbd>: interactuar · <kbd>F</kbd>: libreta · <kbd>Esc</kbd>: menú',
        '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / arrows: walk · <kbd>E</kbd> or <kbd>Space</kbd>: interact · <kbd>F</kbd>: notebook · <kbd>Esc</kbd>: menu'
      );
    },

    markers() {
      const st = AA.State;
      if (!st.data) return {};
      const m = {};
      if (!st.data.flags.intro || st.data.flags.rankSeen < st.rankIndex()) m.marta = true;
      if (st.data.flags.intro && Cu().pendingLesson()) m.leo = true;
      if (st.rankIndex() >= 2 && (!st.data.flags.metNico || st.favorReady())) m.nico = true;
      if (st.rankIndex() >= 1 && !st.data.flags.arcadeSeen) m.arcade = true;
      else if (st.data.flags.intro && Cu().nextMission()) m.computer = true;
      return m;
    },

    // --- Menú dentro del juego
    openGameMenu() {
      const desk = AA.Storage.desktop();
      const buttons = [
        { label: `⚙ ${T('Opciones', 'Options')}`, action: () => this.openOptions() },
        { label: `👕 ${T('Cambiar aspecto', 'Change look')}`, action: () => AA.Creator.openModal() },
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
      // Primera vez: bienvenida (cómo se juega) → guía de la oficina → Marta.
      if (!st.data.flags.intro) setTimeout(() => AA.Guides.welcome(() => AA.Guides.office(() => AA.Story.intro())), 400);
      else if (st.data.flags.rankSeen < st.rankIndex()) AA.UI.toast(T('📣 <b>Marta</b> quiere hablar con vos en su oficina.', '📣 <b>Marta</b> wants to talk to you in her office.'), 'info');
      else if (Cu().pendingLesson()) AA.UI.toast(T('☕ <b>Leo</b> tiene algo nuevo para enseñarte (junto al café).', '☕ <b>Leo</b> has something new to teach you (by the coffee machine).'), 'info');
    },
    openComputer() {
      this.show('computer');
      AA.Screens.Inbox.render();
      setTimeout(() => this.screen === 'computer' && AA.Guides.inbox(), 250);
    },
    // Evento especial: presentar los resultados frente al equipo.
    presentResults(ev, done) {
      AA.UI.closeModal(true);
      this.show('present');
      AA.Present.run(ev, done);
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
          // Primero te sentás en tu silla; después se abre la computadora.
          AA.Office.sitAtDesk(() => this.openComputer());
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
        case 'nico':
          AA.Story.nico();
          return;
        case 'arcade':
          AA.Story.arcade();
          return;
        case 'camila':
        case 'tadeo':
        case 'jean':
        case 'juanroberto':
          AA.Story[id]();
          return;
        default:
          AA.Story.flavor(id);
      }
    },

    handleKey(e) {
      if (e.defaultPrevented) return;
      // F abre y cierra la libreta en la oficina (en la computadora se usa el botón: la F hace falta para escribir).
      const isF = (e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey && !e.repeat;
      if (isF && this.screen === 'office' && !AA.Dialog.isOpen()) {
        if (!AA.UI.isModalOpen()) {
          e.preventDefault();
          AA.Screens.openNotebook();
          return;
        }
        if (document.querySelector('#modal .modal-card.notebook')) {
          e.preventDefault();
          AA.Audio.play('page');
          AA.UI.closeModal();
          return;
        }
      }
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
      // Ctrl+F / Ctrl+B (buscar) y Ctrl+Mayús+L (filtro) en la planilla, aunque el foco esté en el panel:
      // así no se abre el buscador del navegador.
      if ((e.ctrlKey || e.metaKey) && (this.screen === 'mission' || this.screen === 'arcade')) {
        const k = e.key.toLowerCase();
        const ms = AA.Screens.MissionScreen;
        const g = ms.activeView === 'sheets' && ms.grids && ms.grids[ms.activeSheet];
        if (g && g.openFind && !e.shiftKey && (k === 'f' || k === 'b')) {
          e.preventDefault();
          g.openFind();
          return;
        }
        if (g && g.toggleFilter && e.shiftKey && k === 'l') {
          e.preventDefault();
          g.toggleFilter();
          return;
        }
      }
      if (e.key !== 'Escape') return;
      if (this.screen === 'arcade') {
        // En el ARCADE: primero salir del campo de texto; después, pausa.
        e.preventDefault();
        const a = document.activeElement;
        if (a && (a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || (a.tagName === 'INPUT' && a.type !== 'range' && a.type !== 'checkbox'))) {
          a.blur();
          return;
        }
        AA.Arcade.pause();
        return;
      }
      if (this.screen === 'mission') {
        // Primer Esc: salir del campo de texto en el que estés. Siguiente: volver a la bandeja de entrada.
        e.preventDefault();
        const a = document.activeElement;
        if (a && (a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || (a.tagName === 'INPUT' && a.type !== 'range' && a.type !== 'checkbox'))) {
          a.blur();
          return;
        }
        AA.Audio.play('back');
        AA.Screens.MissionScreen.leave(() => this.openComputer());
      } else if (this.screen === 'computer') {
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
