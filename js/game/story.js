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
  // El trato cambia con tu rango: 0 pasante · 1 junior · 2 semi-senior · 3 senior · 4 lead.
  const rk = () => Math.min(S().rankIndex(), 4);
  const byRank = (arr) => arr[Math.min(rk(), arr.length - 1)];
  // Mitad de las veces, una frase de tu rango; si no, una del repertorio general.
  const rankOr = (rankLines, general) => (Math.random() < 0.5 ? byRank(rankLines) : pick(general));

  const LEO_TIPS = [
    T('Antes de calcular nada, mirá los datos. Cinco minutos de mirar te ahorran una hora de corregir.', 'Before calculating anything, look at the data. Five minutes of looking saves an hour of fixing.'),
    T('Nunca pises los datos originales. Trabajá en columnas nuevas. El "yo del futuro" te lo va a agradecer.', 'Never overwrite the original data. Work in new columns. Future you will thank you.'),
    T('Si un número te sorprende, desconfiá primero de tu fórmula, después de los datos y recién al final del mundo.', 'If a number surprises you, doubt your formula first, then the data, and only then the world.'),
    T('Una fórmula con un número fijo adentro (=B2*1.21) es una bomba de tiempo. Poné el 1.21 en una celda y referencialo.', 'A formula with a hard-coded number (=B2*1.21) is a time bomb. Put 1.21 in a cell and reference it.'),
    T('Un buen análisis responde una pregunta concreta. Si no sabés cuál es, preguntá antes de abrir la planilla.', "A good analysis answers a concrete question. If you don't know which one, ask before opening the sheet."),
    T('Si mi hermano Tadeo te pide «un numerito rápido», preguntale para qué es. Siempre es para una presentación en diez minutos.', 'If my brother Tadeo asks you for "a quick number", ask him what it\'s for. It\'s always for a presentation in ten minutes.'),
    T('La práctica libre es donde se hace la diferencia: tablas más grandes, mismos conceptos, más experiencia.', 'Free practice is where you get good: bigger tables, same concepts, more experience.'),
    T('<b>Ctrl+flecha</b> salta hasta el final de un bloque de datos. Con Shift además lo selecciona.', '<b>Ctrl+arrow</b> jumps to the end of a block of data. With Shift it selects it too.'),
  ];

  const POEMS = [
    { es: 'Caminante, no hay camino, se hace camino al andar.', en: 'Traveler, there is no road; the road is made by walking.', by: 'Antonio Machado' },
    { es: 'Ser o no ser, esa es la cuestión.', en: 'To be, or not to be, that is the question.', by: 'William Shakespeare' },
    { es: 'La esperanza es esa cosa con plumas que se posa en el alma.', en: 'Hope is the thing with feathers that perches in the soul.', by: 'Emily Dickinson' },
    { es: 'Juventud, divino tesoro, ¡ya te vas para no volver!', en: 'Youth, divine treasure, you leave never to return!', by: 'Rubén Darío' },
    { es: 'Y yo me iré. Y se quedarán los pájaros cantando.', en: 'And I will leave. And the birds will stay, singing.', by: 'Juan Ramón Jiménez' },
    { es: '¿Me contradigo? Muy bien, me contradigo. Soy amplio, contengo multitudes.', en: 'Do I contradict myself? Very well then I contradict myself. I am large, I contain multitudes.', by: 'Walt Whitman' },
    { es: 'Dos caminos se bifurcaban en un bosque, y yo tomé el menos transitado, y eso hizo toda la diferencia.', en: 'Two roads diverged in a wood, and I took the one less traveled by, and that has made all the difference.', by: 'Robert Frost' },
    { es: 'Ver un mundo en un grano de arena y un cielo en una flor silvestre.', en: 'To see a world in a grain of sand and a heaven in a wild flower.', by: 'William Blake' },
    { es: 'Nada te turbe, nada te espante; todo se pasa.', en: 'Let nothing disturb you, let nothing frighten you; all things pass.', by: 'Santa Teresa de Jesús' },
    { es: 'Hay golpes en la vida, tan fuertes… ¡Yo no sé!', en: "There are blows in life, so hard… I don't know!", by: 'César Vallejo' },
    { es: 'Yo no sé muchas cosas, es verdad. Digo tan sólo lo que he visto.', en: "I don't know many things, it's true. I only tell what I have seen.", by: 'León Felipe' },
    { es: 'No te quedes inmóvil al borde del camino.', en: "Don't stand still at the edge of the road.", by: 'Mario Benedetti' },
    { es: 'Tú me quieres alba, me quieres de espumas, me quieres de nácar.', en: 'You want me white as dawn, you want me made of foam, you want me made of pearl.', by: 'Alfonsina Storni' },
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

  // Qué cambia en cada ascenso (lo que hace ese rango en la vida real).
  const PROMO_LINES = {
    1: { who: 'marta', text: T('Como Junior vas a cruzar tablas, usar tablas dinámicas y SQL, cuidar la calidad de los datos y mantener dashboards. Y vas a responder pedidos de todas las áreas.', "As a Junior you'll join tables, use pivot tables and SQL, look after data quality and maintain dashboards. And you'll answer requests from every team.") },
    2: { who: 'marta', text: T('Como Semi-Senior ya no te voy a pedir números sueltos: vas a llevar análisis de punta a punta, armar dashboards desde cero, explicar <b>por qué</b> pasan las cosas… y revisar el trabajo de Nico.', "As a Mid-level analyst I won't ask you for loose numbers anymore: you'll run analyses end to end, build dashboards from scratch, explain <b>why</b> things happen… and review Nico's work.") },
    3: { who: 'marta', text: T('Como Senior vas a trabajar con Gerencia: definir KPIs, diseñar experimentos, decidir con datos incompletos y escribir resúmenes ejecutivos. Te van a escuchar: usalo bien.', "As a Senior you'll work with Management: define KPIs, design experiments, decide with incomplete data and write executive summaries. They'll listen to you: use it well.") },
  };

  const Story = {
    SHORTCUTS,

    intro(onDone) {
      AA.Dialog.open(
        [
          { who: 'marta', text: T('¡Hola, <b>{name}</b>! Te damos la bienvenida a <b>Grupo Cóndor</b>. Soy Marta, jefa del equipo de Analytics.', 'Hi <b>{name}</b>! Welcome to <b>Grupo Cóndor</b>. I\'m Marta, head of the Analytics team.') },
          { who: 'marta', text: T('Acá todas las áreas nos piden lo mismo: Ventas, Recursos Humanos, Marketing, Logística, Finanzas… <b>respuestas a partir de datos</b>.', 'Here every department asks us for the same thing: Sales, HR, Marketing, Logistics, Finance… <b>answers from data</b>.') },
          { who: 'marta', text: T('Arrancás como <b>Pasante de Datos</b>. Si hacés bien tu trabajo vas a ir subiendo: Junior, Semi-Senior, Senior…', 'You start as a <b>Data Intern</b>. Do good work and you\'ll climb: Junior, Mid-level, Senior…') },
          { who: 'marta', text: T('Pero antes de darte trabajo, andá a ver a <b>Leo</b>, que está en el comedor, junto a la máquina de café (a la izquierda). Te va a explicar lo básico de las planillas.', 'But before I give you work, go see <b>Leo</b> by the coffee machine, in the kitchen on the left. He\'ll explain spreadsheet basics.') },
        ],
        () => {
          S().data.flags.intro = true;
          S().save();
          AA.UI.toast(AA.T('☕ Caminá hasta <b>Leo</b>, en el comedor de la izquierda (WASD / flechas) y presioná <b>E</b>.', '☕ Walk to <b>Leo</b>, in the kitchen on the left (WASD / arrows), and press <b>E</b>.'), 'info');
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
        AA.Audio.play('fanfare');
        AA.UI.confetti(280);
        AA.Dialog.open(
          [
            { who: 'marta', text: T('{name}, pasá, sentate. Tengo que hablar con vos.', '{name}, come in, have a seat. We need to talk.') },
            { who: 'marta', text: T('Estuve mirando tu trabajo. Fórmulas prolijas, datos que cierran, y las otras áreas están contentas.', "I've been looking at your work. Tidy formulas, numbers that add up, and the other teams are happy.") },
            { who: 'marta', text: T(`Así que es oficial: a partir de hoy sos <b>${rank.name.es}</b>. ¡Felicitaciones! 🎉`, `So it's official: starting today you're a <b>${rank.name.en}</b>. Congratulations! 🎉`) },
            PROMO_LINES[rankIdx] || { who: 'marta', text: T('Más responsabilidad, pedidos más difíciles… y Leo seguro tiene algo nuevo para enseñarte.', "More responsibility, harder requests… and I'm sure Leo has something new to teach you.") },
            { who: 'marta', text: T('Pasá por donde está Leo: tiene la primera lección de tu nueva etapa.', 'Stop by Leo: he has the first lesson of your new stage.') },
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
        lines.push({
          who: 'marta',
          text: rankOr(
            [
              T('Para ser pasante, vas muy bien. Preguntá todo lo que necesites: para eso estás acá.', "For an intern, you're doing great. Ask whatever you need: that's what you're here for."),
              T('Como junior ya te piden cosas todas las áreas, y me llegan buenos comentarios. 👌', "As a junior every team asks you for things now, and I'm hearing good feedback. 👌"),
              T('Ahora que sos semi-senior espero análisis completos, no números sueltos. Vas bien.', "Now that you're mid-level I expect full analyses, not loose numbers. You're on track."),
              T('Gerencia ya pregunta por vos por nombre. Eso es ser senior.', 'Management asks for you by name now. That is what being senior means.'),
            ],
            [T('Buen trabajo hasta ahora. Seguí así.', 'Good work so far. Keep it up.'), T('Me llegan buenos comentarios de las otras áreas. 👌', "I'm hearing good things from the other teams. 👌"), T('Recordá: un dato sin contexto es solo un número.', 'Remember: data without context is just a number.')]
          ),
        });
        lines.push({ who: 'marta', text: T('Tenés tareas nuevas en tu computadora.', 'You have new tasks on your computer.') });
      } else {
        const ps = Cu().promotionStatus();
        if (ps && ps.contentReady && !ps.modulesMissing.length && ps.xpMissing > 0) {
          lines.push({
            who: 'marta',
            text: T(
              `Terminaste todos los niveles de tu etapa. Para ascender a <b>${ps.next.name.es}</b> te faltan <b>${ps.xpMissing} XP</b>: hacé casos de <b>práctica libre</b> en tu computadora (los primeros ${Cu().PRACTICE_XP_LIMIT} de cada nivel suman experiencia).`,
              `You finished every level of your stage. To be promoted to <b>${ps.next.name.en}</b> you need <b>${ps.xpMissing} more XP</b>: do some <b>free practice</b> cases on your computer (the first ${Cu().PRACTICE_XP_LIMIT} of each level earn experience).`
            ),
          });
        } else if (!cur) {
          lines.push({ who: 'marta', text: T('Ya dominás todo lo que tenemos para tu rango por ahora. Impresionante.', 'You have mastered everything we have for your rank for now. Impressive.') });
          lines.push({ who: 'marta', text: T('El próximo paso es <b>Lead de Datos</b>: estrategia, priorizar los pedidos del equipo, acordar con las áreas qué medir y cuidar el gobierno de los datos. Esa etapa llega en una próxima actualización.', 'The next step is <b>Data Lead</b>: strategy, prioritizing the team\'s requests, agreeing with other teams on what to measure and looking after data governance. That stage arrives in a future update.') });
          lines.push({ who: 'marta', text: T('Mientras tanto, la práctica libre de cualquier nivel sigue abierta para repasar.', 'Meanwhile, free practice for any level is still open for review.') });
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
        lines.push({ who: 'leo', text: T('El de Marketing que anda por ahí es Tadeo, mi hermano. Si te pide algo "para ayer", es normal.', 'The Marketing guy around here is Tadeo, my brother. If he asks for something "for yesterday", that\'s normal.') });
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
        text: pick(
          byRank([
            [T('¿Qué necesitás, pasante? Acá nadie muerde: preguntá lo que quieras.', 'What do you need, intern? Nobody bites here: ask anything.'), T('¿Un cafecito y una fórmula? Para un pasante, es el combo ideal.', 'A coffee and a formula? The perfect combo for an intern.')],
            [T('¿Qué onda, junior? ¿En qué te doy una mano?', "What's up, junior? How can I help?"), T('Junior que pregunta es junior que no rompe la planilla. Decime.', 'A junior who asks is a junior who doesn\'t break the sheet. Tell me.')],
            [T('¡Pero mirá quién viene: semi-senior de la casa! ¿Qué necesitás?', 'Look who it is: our mid-level analyst! What do you need?'), T('Ya sos semi-senior y seguís pasando por el café. Me gusta. ¿En qué te ayudo?', "You're mid-level now and you still stop by the coffee machine. I like it. How can I help?")],
            [T('Colega senior, ¿un café y hablamos de métricas?', 'Fellow senior, coffee and some metrics talk?'), T('Ahora que somos los dos senior, me podés ayudar vos a mí. Pero dale, ¿qué necesitás?', "Now that we're both senior, you could help me. But sure, what do you need?")],
          ])
        ),
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

    camila() {
      const st = S();
      const motto = T('¡Trabajando se saca este país adelante! 💪', 'Hard work is what moves this country forward! 💪');
      if (!st.data.flags.metCamila) {
        st.data.flags.metCamila = true;
        st.save();
        AA.Dialog.open([
          { who: 'camila', text: T('¡Hola! Soy Camila, Data Engineer. Perdón que no me levanto: estoy con un proceso de carga que no se puede cortar.', "Hi! I'm Camila, Data Engineer. Sorry I don't get up: I'm running a data load I can't stop."), },
          { who: 'camila', text: motto },
        ]);
        return;
      }
      const lines = [
        motto,
        T('No me distraigas que estoy en racha. ¡Trabajando se saca este país adelante!', "Don't distract me, I'm on a roll. Hard work moves this country forward!"),
        T('Yo armo los procesos que traen los datos a la empresa. Si llegan sucios… bueno, no siempre es culpa mía. 😅', "I build the pipelines that bring data into the company. If it arrives dirty… well, it's not always my fault. 😅"),
        T('Dato de color: el 80% del trabajo de un analista es limpiar datos. El otro 20% es quejarse de limpiar datos.', "Fun fact: 80% of an analyst's job is cleaning data. The other 20% is complaining about cleaning data."),
        T('Regla de oro: nunca confíes en un dato que no revisaste.', "Golden rule: never trust data you haven't checked."),
      ];
      lines.push(
        byRank([
          T('¿Pasante y ya te hacen trabajar con datos reales? Te damos la bienvenida al mundo real.', 'An intern already working with real data? Welcome to the real world.'),
          T('Junior: la etapa en la que todo el mundo te pide "un excelcito rápido".', 'Junior: the stage when everybody asks you for "a quick little spreadsheet".'),
          T('Semi-senior… ahora te toca revisar lo que hace Nico. Paciencia y café.', "Mid-level… now you get to review Nico's work. Patience and coffee."),
          T('Senior y todavía venís a charlar con la de infraestructura. Así me gusta.', 'Senior and you still come chat with the infrastructure person. I like that.'),
        ]),
        motto
      );
      if (Cu().lessonDone(Cu().MODULES[3])) lines.push(T('Ahora que sabés limpiar texto, te va a encantar cuando lleguen números guardados como texto. Spoiler: llegan.', "Now that you can clean text, you'll love it when numbers stored as text show up. Spoiler: they will."));
      AA.Dialog.open([{ who: 'camila', text: pick(lines) }]);
    },

    tadeo() {
      AA.Dialog.open([
        {
          who: 'tadeo',
          text: rankOr([
            T('¿Vos sos de las prácticas? Leo dice que aprendés rápido. Te voy a tener en cuenta, pasante.', "You're the new intern? Leo says you learn fast. I'll keep you in mind, intern."),
            T('¡Junior! Ahora te puedo pedir cosas oficialmente. Preparate.', 'Junior! Now I can officially ask you for things. Get ready.'),
            T('Semi-senior… ¿me explicás por qué bajaron las ventas? Con gráficos, porfa. Muchos gráficos.', 'Mid-level… can you explain why sales dropped? With charts, please. Lots of charts.'),
            T('Senior: ¿me ayudás a elegir qué KPI mirar? Mi jefe quiere "todos".', 'Senior: will you help me choose which KPI to track? My boss wants "all of them".'),
          ], [
            T('¡No tengo ni idea de qué estoy haciendo, pero algo estoy haciendo!', "I have no idea what I'm doing, but I'm doing something!"),
            T('En Marketing medimos todo: aperturas, clics, conversiones… lo que no medimos es cuánto café tomamos.', "In Marketing we measure everything: opens, clicks, conversions… what we don't measure is how much coffee we drink."),
            T('Leo es mi hermano. Él sabe de fórmulas; yo sé de campañas. Juntos somos… bueno, dos Bargas.', "Leo is my brother. He knows formulas; I know campaigns. Together we're… well, two Bargas."),
            T('Cuando aprendas a limpiar texto te voy a pasar la base de clientes. Preparate.', "Once you learn to clean text I'll send you the customer list. Get ready."),
            T('¿Viste que la práctica libre genera casos nuevos cada vez? Yo practiqué tanto que sueño en celdas.', 'Did you notice free practice generates new cases every time? I practiced so much I dream in cells.'),
          ]),
        },
      ]);
    },

    // Nico vuelve de vacaciones en Semi-Senior y te pide favores (tareas distintas a las del día a día).
    nico() {
      const st = S();
      if (st.rankIndex() < 2) return this.flavor('nico');
      const lines = [];
      if (!st.data.flags.metNico) {
        st.data.flags.metNico = true;
        st.save();
        lines.push({ who: 'nico', text: T('¡Volví de vacaciones! Y me entero de que ahora sos <b>semi-senior</b>. ¡Felicitaciones, {name}!', "I'm back from vacation! And I hear you're <b>mid-level</b> now. Congrats, {name}!") });
        lines.push({ who: 'nico', text: T('Marta me dijo que vas a revisar mi trabajo… y que te puedo pedir una mano cuando me trabe. 😅', 'Marta told me you\'ll be reviewing my work… and that I can ask you for help when I get stuck. 😅') });
      }
      if (st.data.favor) {
        lines.push({ who: 'nico', text: T('¿Pudiste mirar lo que te pasé? Está arriba de todo en tu bandeja, en <b>Favores de Nico</b>.', 'Did you get a chance to look at what I sent you? It\'s at the top of your inbox, under <b>Favors for Nico</b>.') });
        AA.Dialog.open(lines);
        return;
      }
      if (st.favorReady()) {
        const id = Cu().newFavor(st.data.flags.lastFavorKind);
        if (id) {
          const kind = Cu().favorKind(id);
          lines.push({
            who: 'nico',
            text: Cu().favorText(kind).ask,
            choices: [
              {
                label: AA.T('🤝 Dale, pasámelo', '🤝 Sure, send it over'),
                action: () => {
                  st.data.favor = id;
                  st.save();
                  AA.Audio.play('unlock');
                  AA.Dialog.open([{ who: 'nico', text: T('¡Sos lo más! Te lo mando a tu bandeja: está arriba de todo, en <b>Favores de Nico</b>.', "You're the best! I'm sending it to your inbox: it's at the top, under <b>Favors for Nico</b>.") }]);
                  AA.UI.toast(AA.T('📨 Nico te mandó un pedido: está arriba de todo en tu bandeja.', '📨 Nico sent you a request: it is at the top of your inbox.'), 'info');
                },
              },
              { label: AA.T('Ahora no puedo', "I can't right now"), action: () => AA.Dialog.open([{ who: 'nico', text: T('Tranqui, cuando tengas un rato me avisás.', 'No worries, let me know when you have some time.') }]) },
            ],
          });
          AA.Dialog.open(lines);
          return;
        }
      }
      lines.push({
        who: 'nico',
        text: rankOr(
          [
            null,
            null,
            T('Algún día voy a ser semi-senior como vos. Por ahora soy semi-senior en tomar mate.', "Someday I'll be mid-level like you. For now I'm mid-level at drinking mate."),
            T('¡Mirá vos, senior! Cuando sea grande quiero ser como vos. Por ahora soy senior en tomar mate.', "Look at you, senior! When I grow up I want to be like you. For now I'm senior at drinking mate."),
          ],
          [
            T('Si ves un #N/A en mi planilla, no fui yo. Bueno, sí fui yo.', 'If you see an #N/A in my sheet, it wasn\'t me. Well, yes it was.'),
            T('Mi planilla de presupuesto tiene 47 pestañas. Estoy pensando en ponerle un índice.', 'My budget spreadsheet has 47 tabs. I\'m thinking of adding a table of contents.'),
            T('Ahora estoy tranquilo. Cuando me trabe con algo, te aviso. 😄', "I'm fine for now. When I get stuck, I'll let you know. 😄"),
          ]
        ),
      });
      AA.Dialog.open(lines);
    },

    jean() {
      const title = byRank([T('pasante', 'intern'), T('junior', 'junior'), T('semi-senior', 'mid-level'), T('senior', 'senior')]);
      AA.Dialog.open([
        {
          who: 'jean',
          text: rankOr([
            T('¿Pasante? Yo también fui pasante. Del concreto, pero pasante.', 'An intern? I was an intern too. Of concrete, but an intern.'),
            T(`Ah, ascendiste a ${title.es}. Como un buen edificio: piso por piso.`, `Ah, you got promoted to ${title.en}. Like a good building: floor by floor.`),
          ], [
            T('¿El mejor libro que leí? <i>«5 formas de hacerle el amor al concreto»</i>.', 'The best book I ever read? <i>"5 Ways to Make Love to Concrete"</i>.'),
            T('No soy un simple arquitecto: yo soy un <b>artista del concreto</b>.', "I'm not a mere architect: I am a <b>concrete artist</b>."),
            T('Yo no trabajo acá, eh. Vengo por el café. Es el mejor de la cuadra… y diseñé tres edificios de esta cuadra.', "I don't work here, by the way. I come for the coffee. Best on the block… and I designed three buildings on this block."),
            T('Un buen dashboard es como un buen edificio: si lo tenés que explicar, está mal diseñado.', 'A good dashboard is like a good building: if you have to explain it, it was badly designed.'),
            T('Ustedes tienen celdas; yo tengo vigas. En el fondo, todos sostenemos algo.', 'You have cells; I have beams. Deep down, we all hold something up.'),
            T('Juan Roberto me recita poesía mientras tomo el café. Yo le dibujo catedrales en las servilletas. Es un buen trato.', 'Juan Roberto recites poetry while I drink my coffee. I draw cathedrals on his napkins. Fair deal.'),
          ]),
        },
      ]);
    },

    // Juan Roberto recita fragmentos cortos de poemas para que pienses un poco.
    juanroberto() {
      const p = pick(POEMS);
      const lines = [{ who: 'juanroberto', text: T(`«${p.es}»<br><span class="muted">— ${p.by}</span>`, `"${p.en}"<br><span class="muted">— ${p.by}</span>`) }];
      if (Math.random() < 0.4) {
        lines.push({
          who: 'juanroberto',
          text: pick([
            T('Pensalo un rato. Con el café se piensa mejor.', 'Think about it for a while. Coffee helps.'),
            T('Los datos dicen qué pasó. La poesía, qué significa.', 'Data tells you what happened. Poetry, what it means.'),
            T('Volvé cuando quieras: tengo versos para toda la jornada laboral.', 'Come back anytime: I have verses for the whole workday.'),
          ]),
        });
      }
      AA.Dialog.open(lines);
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
        fridge: pick([
          T('Un cartel en la heladera: "Rotulá tu tupper. Un tupper sin nombre es un dato sin etiqueta: nadie sabe de quién es."', 'A sign on the fridge: "Label your lunchbox. A lunchbox with no name is data with no label: nobody knows whose it is."'),
          T('Adentro hay un yogur vencido en 2019. Un caso claro de dato desactualizado.', 'There is a yogurt that expired in 2019. A clear case of stale data.'),
        ]),
        microwave: T('Hay una fila de 3 personas para el microondas. Leo dice que es el verdadero cuello de botella de la empresa.', 'There is a line of 3 people for the microwave. Leo says it is the real bottleneck of the company.'),
        cooler: T('Te servís un vaso de agua. Hidratarse también es parte del análisis.', 'You drink a glass of water. Staying hydrated is part of the analysis too.'),
        lunch: pick([
          T('En la mesa alguien dejó una servilleta con un gráfico de torta dibujado. Tiene 11 porciones. Leo la miró y suspiró.', 'Someone left a napkin with a pie chart on the table. It has 11 slices. Leo looked at it and sighed.'),
          T('Acá se almuerza a la una. Las mejores ideas del equipo salieron de esta mesa, no de las reuniones.', 'Lunch is at one o\'clock here. The team\'s best ideas came from this table, not from meetings.'),
          T('Un sobre de azúcar dice: "Dato curioso: el promedio miente cuando hay atípicos".', 'A sugar packet says: "Fun fact: the average lies when there are outliers".'),
        ]),
        vending: T('La máquina de snacks tiene un cartel: "Se aceptan monedas, no excusas".', 'The snack machine has a sign: "Coins accepted, excuses are not".'),
        meeting: T('La sala de reuniones. En la pantalla quedó una diapositiva: "¿Qué decisión querés tomar con este dato?"', 'The meeting area. A slide is still on the screen: "What decision do you want to make with this data?"'),
        printer: T('La impresora está imprimiendo un dashboard de 40 páginas. Nadie lo va a leer.', 'The printer is printing a 40-page dashboard. Nobody will read it.'),
        magazines: T('Revistas en la mesa ratona: «Datos Hoy», «El Analista Moderno» y un catálogo de plantas.', 'Magazines on the coffee table: "Data Today", "The Modern Analyst" and a plant catalog.'),
        plant: pick([
          T('Una planta muy bien cuidada. Tiene un cartelito: "Me riega Camila los lunes".', 'A well-kept plant. It has a little tag: "Camila waters me on Mondays".'),
          T('La planta crece un poco cada semana. Como tu XP.', 'The plant grows a little each week. Like your XP.'),
        ]),
        exit: T('¿Irte ya? Todavía hay datos que analizar. (Usá el menú ☰ para salir del juego.)', 'Leaving already? There is still data to analyze. (Use the ☰ menu to quit.)'),
      }[id];
      if (t) AA.Dialog.open([{ who: 'narrator', text: t }]);
    },
  };

  AA.Story = Story;
})();
