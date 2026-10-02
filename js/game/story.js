/*
 * Analyst Adventure — Historia y diálogos de la oficina.
 * Flujo: Marta te recibe → Leo explica el nivel → tareas en la computadora → práctica libre.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const S = () => AA.State;
  const Cu = () => AA.Curriculum;
  const T = (es, en) => ({ es, en });
  const levelNum = (mod) => Cu().MODULES.indexOf(mod) + 1;

  const LEO_TIPS = [
    T('Antes de calcular nada, mirá los datos. Cinco minutos de mirar te ahorran una hora de corregir.', 'Before calculating anything, look at the data. Five minutes of looking saves an hour of fixing.'),
    T('Nunca pises los datos originales. Trabajá en columnas nuevas. El "yo del futuro" te lo va a agradecer.', 'Never overwrite the original data. Work in new columns. Future you will thank you.'),
    T('Si un número te sorprende, desconfiá primero de tu fórmula, después de los datos y recién al final del mundo.', 'If a number surprises you, doubt your formula first, then the data, and only then the world.'),
    T('Una fórmula con un número fijo adentro (=B2*1.21) es una bomba de tiempo. Poné el 1.21 en una celda y referencialo.', 'A formula with a hard-coded number (=B2*1.21) is a time bomb. Put 1.21 in a cell and reference it.'),
    T('Un buen análisis responde una pregunta concreta. Si no sabés cuál es, preguntá antes de abrir la planilla.', "A good analysis answers a concrete question. If you don't know which one, ask before opening the sheet."),
    T('La práctica libre es donde se hace la diferencia: tablas más grandes, mismos conceptos, más experiencia.', 'Free practice is where you get good: bigger tables, same concepts, more experience.'),
    T('<b>Ctrl+flecha</b> salta hasta el final de un bloque de datos. Con Shift además lo selecciona.', '<b>Ctrl+arrow</b> jumps to the end of a block of data. With Shift it selects it too.'),
  ];

  const SHORTCUTS = T(
    `<b>Enter</b> confirma y baja · <b>Tab</b> confirma y va a la derecha · <b>Esc</b> cancela<br>
     <b>F2</b> o doble clic: editar · <b>Supr</b>: borrar · <b>F4</b>: fijar referencia con $<br>
     <b>Ctrl+C / Ctrl+V</b>: copiar y pegar · <b>Ctrl+D</b>: rellenar abajo · <b>Ctrl+R</b>: a la derecha<br>
     <b>Ctrl+Z / Ctrl+Y</b>: deshacer y rehacer · <b>Shift+flechas</b>: seleccionar rango`,
    `<b>Enter</b> confirms and moves down · <b>Tab</b> confirms and moves right · <b>Esc</b> cancels<br>
     <b>F2</b> or double-click: edit · <b>Del</b>: clear · <b>F4</b>: lock reference with $<br>
     <b>Ctrl+C / Ctrl+V</b>: copy and paste · <b>Ctrl+D</b>: fill down · <b>Ctrl+R</b>: fill right<br>
     <b>Ctrl+Z / Ctrl+Y</b>: undo and redo · <b>Shift+arrows</b>: select a range`
  );

  const Story = {
    SHORTCUTS,

    intro(onDone) {
      AA.Dialog.open(
        [
          { who: 'marta', text: T('¡Hola, <b>{name}</b>! Te damos la bienvenida a <b>Grupo Cóndor</b>. Soy Marta, jefa del equipo de Analytics.', 'Hi <b>{name}</b>! Welcome to <b>Grupo Cóndor</b>. I\'m Marta, head of the Analytics team.') },
          { who: 'marta', text: T('Acá todas las áreas nos piden lo mismo: Ventas, Recursos Humanos, Marketing, Logística, Finanzas… <b>respuestas a partir de datos</b>.', 'Here every department asks us for the same thing: Sales, HR, Marketing, Logistics, Finance… <b>answers from data</b>.') },
          { who: 'marta', text: T('Arrancás como <b>Pasante de Datos</b>. Si hacés bien tu trabajo vas a ir subiendo: Junior, Semi-Senior, Senior…', 'You start as a <b>Data Intern</b>. Do good work and you\'ll climb: Junior, Mid-level, Senior…') },
          { who: 'marta', text: T('Pero antes de darte trabajo, andá a ver a <b>Leo</b>, que está junto a la máquina de café. Te va a explicar lo básico de las planillas.', 'But before I give you work, go see <b>Leo</b> by the coffee machine. He\'ll explain spreadsheet basics.') },
        ],
        () => {
          S().data.flags.intro = true;
          S().save();
          AA.UI.toast(AA.T('☕ Caminá hasta <b>Leo</b>, junto a la máquina de café (WASD / flechas) y presioná <b>E</b>.', '☕ Walk to <b>Leo</b>, by the coffee machine (WASD / arrows), and press <b>E</b>.'), 'info');
          if (onDone) onDone();
        }
      );
    },

    marta() {
      const st = S();
      if (!st.data.flags.intro) return this.intro();
      const rankIdx = st.rankIndex();
      if (st.data.flags.rankSeen < rankIdx) {
        const rank = st.RANKS[rankIdx];
        st.data.flags.rankSeen = rankIdx;
        st.save();
        AA.Audio.play('levelup');
        AA.Dialog.open(
          [
            { who: 'marta', text: T('{name}, pasá, sentate. Tengo que hablar con vos.', '{name}, come in, have a seat. We need to talk.') },
            { who: 'marta', text: T('Estuve mirando tu trabajo. Fórmulas prolijas, datos que cierran, y las otras áreas están contentas.', "I've been looking at your work. Tidy formulas, numbers that add up, and the other teams are happy.") },
            { who: 'marta', text: T(`Así que es oficial: a partir de hoy sos <b>${rank.name.es}</b>. ¡Felicitaciones! 🎉`, `So it's official: starting today you're a <b>${rank.name.en}</b>. Congratulations! 🎉`) },
            { who: 'marta', text: T('Más responsabilidad, pedidos más difíciles… y Leo seguro tiene algo nuevo para enseñarte.', "More responsibility, harder requests… and I'm sure Leo has something new to teach you.") },
          ],
          () => AA.Game.updateHud()
        );
        return;
      }
      const lesson = Cu().pendingLesson();
      const cur = Cu().currentModule();
      const lines = [];
      if (lesson) {
        lines.push({ who: 'marta', text: T(`Leo te está esperando para explicarte el <b>Nivel ${levelNum(lesson)}: ${lesson.title.es}</b>. Está junto al café.`, `Leo is waiting to walk you through <b>Level ${levelNum(lesson)}: ${lesson.title.en}</b>. He's by the coffee machine.`) });
      } else if (Cu().nextMission()) {
        lines.push({ who: 'marta', text: pick([T('Buen trabajo hasta ahora. Seguí así.', 'Good work so far. Keep it up.'), T('Me llegan buenos comentarios de las otras áreas. 👌', "I'm hearing good things from the other teams. 👌"), T('Recordá: un dato sin contexto es solo un número.', 'Remember: data without context is just a number.')]) });
        lines.push({ who: 'marta', text: T('Tenés tareas nuevas en tu computadora.', 'You have new tasks on your computer.') });
      } else {
        const blocked = Cu().MODULES.find((m) => !Cu().isUnlocked(m) && Cu().isModuleComplete(Cu().MODULES[Cu().MODULES.indexOf(m) - 1] || m));
        if (blocked && st.rankIndex() < blocked.minRank) {
          const need = st.RANKS[blocked.minRank];
          lines.push({ who: 'marta', text: T(`El Nivel ${levelNum(blocked)} es trabajo de <b>${need.name.es}</b>. Te faltan ${need.xp - st.data.xp} XP: hacé casos de <b>práctica</b> en tu computadora y volvé a hablar conmigo.`, `Level ${levelNum(blocked)} is work for a <b>${need.name.en}</b>. You need ${need.xp - st.data.xp} more XP: do some <b>practice</b> cases on your computer and come back.`) });
        } else if (!cur) {
          lines.push({ who: 'marta', text: T('Terminaste todos los niveles de esta etapa. Impresionante.', 'You finished every level of this stage. Impressive.') });
          lines.push({ who: 'marta', text: T('Podés seguir practicando para sumar experiencia. Lo que viene (BUSCARV, tablas dinámicas, dashboards) llega en la <b>Etapa 2</b>.', 'You can keep practicing to earn experience. What comes next (VLOOKUP, pivot tables, dashboards) arrives in <b>Stage 2</b>.') });
        } else {
          lines.push({ who: 'marta', text: T('Seguí así. Si te sobra tiempo, la práctica libre te ayuda a afianzar lo aprendido.', 'Keep it up. If you have spare time, free practice helps you lock in what you learned.') });
        }
      }
      AA.Dialog.open(lines);
    },

    // Lección de Leo para un nivel: al terminar, las páginas quedan en la libreta.
    lesson(mod, replay) {
      const lines = Cu().lessonLines(mod);
      AA.Dialog.open(lines, () => {
        if (replay) return;
        S().setLessonDone(mod.id);
        AA.Audio.play('unlock');
        AA.UI.toast(AA.T(`📒 Nuevas páginas en tu libreta: <b>${AA.L(mod.title)}</b>`, `📒 New pages in your notebook: <b>${AA.L(mod.title)}</b>`), 'ok');
        setTimeout(() => AA.UI.toast(AA.T('🖥️ Tenés tareas nuevas en tu computadora.', '🖥️ You have new tasks on your computer.'), 'info'), 900);
        AA.Game.updateHud();
      });
    },

    leo() {
      const st = S();
      const lines = [];
      if (!st.data.flags.metLeo) {
        st.data.flags.metLeo = true;
        st.save();
        lines.push({ who: 'leo', text: T('¡Hola! Vos sos {name}, ¿no? Yo soy Leo, analista senior. Bah, "senior": tengo más horas de planillas que de sueño.', 'Hey! You must be {name}. I\'m Leo, senior analyst. Well, "senior": I have more hours of spreadsheets than of sleep.') });
      }
      const pending = Cu().pendingLesson();
      if (pending && st.data.flags.intro) {
        if (lines.length) AA.Dialog.open(lines, () => this.lesson(pending));
        else this.lesson(pending);
        return;
      }
      const learned = Cu().MODULES.filter((m) => Cu().lessonDone(m));
      lines.push({
        who: 'leo',
        text: pick([T('¿Qué necesitás?', 'What do you need?'), T('¿Un cafecito y una fórmula?', 'A coffee and a formula?'), T('¿En qué te doy una mano?', 'How can I help?')]),
        choices: [
          { label: AA.T('📒 Abrir mi libreta', '📒 Open my notebook'), action: () => AA.Screens.openNotebook() },
          ...(learned.length ? [{ label: AA.T('🔁 Repasar una lección', '🔁 Review a lesson'), action: () => this.reviewMenu(learned) }] : []),
          { label: AA.T('💡 Darme un consejo', '💡 Give me a tip'), action: () => AA.Dialog.open([{ who: 'leo', text: pick(LEO_TIPS) }]) },
          { label: AA.T('⌨️ Atajos de teclado', '⌨️ Keyboard shortcuts'), action: () => AA.Dialog.open([{ who: 'leo', text: SHORTCUTS }]) },
          { label: AA.T('Nada, gracias', 'Nothing, thanks'), action: () => {} },
        ],
      });
      AA.Dialog.open(lines);
    },

    reviewMenu(learned) {
      AA.Dialog.open([
        {
          who: 'leo',
          text: T('¿Qué lección querés repasar?', 'Which lesson do you want to review?'),
          choices: learned
            .slice(-6)
            .map((m) => ({ label: `${AA.T('Nivel', 'Level')} ${levelNum(m)} · ${AA.L(m.title)}`, action: () => this.lesson(m, true) }))
            .concat([{ label: AA.T('Ninguna', 'None'), action: () => {} }]),
        },
      ]);
    },

    sofi() {
      const lines = Cu().lessonDone(Cu().MODULES[3])
        ? [T('Ahora que sabés limpiar texto, te va a encantar cuando lleguen números guardados como texto. Spoiler: llegan.', "Now that you can clean text, you'll love it when numbers stored as text show up. Spoiler: they will.")]
        : [
            T('Yo armo los procesos que traen los datos a la empresa. Si llegan sucios… bueno, no siempre es culpa mía. 😅', "I build the pipelines that bring data into the company. If it arrives dirty… well, it's not always my fault. 😅"),
            T('Dato de color: el 80% del trabajo de un analista es limpiar datos. El otro 20% es quejarse de limpiar datos.', "Fun fact: 80% of an analyst's job is cleaning data. The other 20% is complaining about cleaning data."),
            T('Regla de oro: nunca confíes en un dato que no revisaste.', "Golden rule: never trust data you haven't checked."),
          ];
      AA.Dialog.open([{ who: 'sofi', text: pick(lines) }]);
    },

    tomas() {
      AA.Dialog.open([
        {
          who: 'tomas',
          text: pick([
            T('En Marketing medimos todo: aperturas, clics, conversiones… lo que no medimos es cuánto café tomamos.', "In Marketing we measure everything: opens, clicks, conversions… what we don't measure is how much coffee we drink."),
            T('Cuando aprendas a limpiar texto te voy a pasar la base de clientes. Preparate.', "Once you learn to clean text I'll send you the customer list. Get ready."),
            T('¿Viste que la práctica libre genera casos nuevos cada vez? Yo practiqué tanto que sueño en celdas.', 'Did you notice free practice generates new cases every time? I practiced so much I dream in cells.'),
          ]),
        },
      ]);
    },

    flavor(id) {
      const t = {
        coffee: pick([
          T('Te servís un café. +10 de concentración. (No hace nada, pero se siente bien.)', "You pour yourself a coffee. +10 focus. (It does nothing, but it feels good.)"),
          T('La máquina hace un ruido sospechoso y te da un cortado. Nadie sabe por qué.', 'The machine makes a suspicious noise and gives you a macchiato. Nobody knows why.'),
          T('Hay un cartel: "Si la máquina dice ERROR, no es #DIV/0!. Llamar a mantenimiento."', 'A sign says: "If the machine says ERROR, it is not #DIV/0!. Call maintenance."'),
        ]),
        nico: T('El escritorio de Nico. Un post-it dice: "Vuelvo de vacaciones el lunes. NO TOCAR mi planilla de presupuesto (la de 47 pestañas)."', 'Nico\'s desk. A sticky note says: "Back from vacation on Monday. DO NOT TOUCH my budget spreadsheet (the one with 47 tabs)."'),
        books: pick([
          T('Un libro: «Storytelling con datos». Tiene más subrayados que páginas.', 'A book: "Storytelling with Data". It has more highlights than pages.'),
          T('Un libro: «Excel para valientes». Alguien escribió en la tapa "y para desesperados".', 'A book: "Excel for the Brave". Someone wrote "and the desperate" on the cover.'),
          T('Un libro: «Cómo mentir con estadísticas». Marta lo tiene marcado como "lectura obligatoria".', 'A book: "How to Lie with Statistics". Marta marked it as "required reading".'),
        ]),
        bossdesk: T('Un post-it: "Revisar KPIs de Q2". Al lado, una taza que dice: "En Dios confiamos; los demás, traigan datos".', 'A sticky note: "Review Q2 KPIs". Next to it, a mug that says: "In God we trust; all others bring data".'),
        sofa: T('Un sofá muy cómodo. Mejor no sentarse: hay planillas esperando.', 'A very comfy sofa. Better not sit down: spreadsheets are waiting.'),
        exit: T('¿Irte ya? Todavía hay datos que analizar. (Usá el menú ☰ para salir del juego.)', 'Leaving already? There is still data to analyze. (Use the ☰ menu to quit.)'),
      }[id];
      if (t) AA.Dialog.open([{ who: 'narrator', text: t }]);
    },
  };

  AA.Story = Story;
})();
