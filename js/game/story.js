/*
 * Analyst Adventure — Historia y diálogos de la oficina.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const S = () => AA.State;
  const done = (id) => S().isCompleted(id);

  const LEO_TIPS = [
    'Antes de calcular nada, mirá los datos. Ordená, filtrá, buscá cosas raras. Cinco minutos de mirar te ahorran una hora de corregir.',
    'Nunca pises los datos originales. Trabajá en columnas nuevas o en otra hoja. El "yo del futuro" te lo va a agradecer.',
    'Si un número te sorprende, desconfiá primero de tu fórmula y después de los datos. Recién al final, del mundo.',
    'Una fórmula con un número fijo adentro (=B2*1.21) es una bomba de tiempo. Poné el 1.21 en una celda y referencialo.',
    'Usá <b>F4</b> mientras escribís una referencia para fijarla con $. Es el atajo que más tiempo me ahorró en la vida.',
    'Un buen análisis responde una pregunta concreta. Si no sabés cuál es la pregunta, preguntá antes de abrir la planilla.',
    '<b>Ctrl+flecha</b> salta hasta el final de un bloque de datos. Con Shift además, lo selecciona.',
    'Acá aceptamos funciones en español y en inglés: SUMA o SUM, CONTAR.SI o COUNTIF. En tu próximo laburo vas a ver las dos.',
  ];

  const SHORTCUTS = `
    <b>Enter</b> confirma y baja · <b>Tab</b> confirma y va a la derecha · <b>Esc</b> cancela<br>
    <b>F2</b> o doble clic: editar · <b>Supr</b>: borrar · <b>F4</b>: fijar referencia con $<br>
    <b>Ctrl+C / Ctrl+V</b>: copiar y pegar fórmulas · <b>Ctrl+D</b>: rellenar hacia abajo<br>
    <b>Ctrl+Z / Ctrl+Y</b>: deshacer y rehacer · <b>Shift+flechas</b>: seleccionar rango`;

  const Story = {
    intro(onDone) {
      AA.Dialog.open(
        [
          { who: 'marta', text: '¡Hola, <b>{name}</b>! Te damos la bienvenida a <b>Grupo Cóndor</b>. Soy Marta, jefa del equipo de Analytics.' },
          { who: 'marta', text: 'Somos una empresa con muchas áreas: Ventas, Recursos Humanos, Marketing, Logística, Finanzas… y todas nos piden lo mismo: <b>respuestas a partir de datos</b>.' },
          { who: 'marta', text: 'Arrancás como <b>Pasante de Datos</b>. Si hacés bien tu trabajo, vas a ir subiendo: Junior, Semi-Senior, Senior… quién sabe, capaz algún día te quedás con mi oficina. 😉' },
          { who: 'marta', text: 'Tu escritorio es el de arriba a la izquierda, el de la pantalla que brilla. Ahí te dejé tu primer email.' },
          { who: 'marta', text: 'Si te trabás, hablá con <b>Leo</b>, que suele estar junto a la máquina de café. Sabe todo sobre planillas.' },
        ],
        () => {
          S().data.flags.intro = true;
          S().save();
          AA.UI.toast('🖥️ Caminá hasta tu computadora (WASD / flechas) y presioná <b>E</b>.', 'info');
          if (onDone) onDone();
        }
      );
    },

    marta() {
      const st = S();
      const rankIdx = st.rankIndex();
      if (!st.data.flags.intro) return this.intro();
      if (st.data.flags.rankSeen < rankIdx) {
        const rank = st.RANKS[rankIdx];
        st.data.flags.rankSeen = rankIdx;
        st.save();
        AA.Dialog.open(
          [
            { who: 'marta', text: '{name}, pasá, sentate. Tengo que hablar con vos.' },
            { who: 'marta', text: 'Estuve mirando tu trabajo. Fórmulas prolijas, datos que cierran, y la gente de las otras áreas está contenta.' },
            { who: 'marta', text: `Así que es oficial: a partir de hoy sos <b>${rank.name}</b>. ¡Felicitaciones! 🎉` },
            { who: 'marta', text: 'Más responsabilidad, pedidos más difíciles… y el mismo sueldo hasta la próxima paritaria. Bienvenida/o al mundo real. 😄' },
          ],
          () => AA.Game.updateHud()
        );
        return;
      }
      const next = st.nextMission();
      if (!next) {
        AA.Dialog.open([
          { who: 'marta', text: 'Terminaste todo lo que tenía para vos esta semana. Impresionante.' },
          { who: 'marta', text: 'Se vienen cosas más grandes: datos con números guardados como texto, cruces de tablas con BUSCARV, tablas dinámicas y tu primer <b>dashboard</b>.' },
          { who: 'marta', text: 'Eso queda para la <b>Etapa 2</b> del juego. ¡Gracias por jugar esta primera parte!' },
        ]);
        return;
      }
      const sender = AA.State.CHARACTERS[next.from];
      const lines = [];
      if (st.completedCount() === 0) {
        lines.push({ who: 'marta', text: 'Tu primer email te está esperando en la computadora. Arriba a la izquierda, la pantalla que brilla.' });
      } else {
        lines.push({
          who: 'marta',
          text: pick([
            'Buen trabajo hasta ahora. Seguí así.',
            'Me llegan buenos comentarios de las otras áreas. 👌',
            'Recordá: un dato sin contexto es solo un número.',
          ]),
        });
        lines.push({
          who: 'marta',
          text: next.from === 'marta'
            ? 'Te dejé otro pedido en tu bandeja de entrada.'
            : `Te escribió <b>${sender.name}</b> (${sender.role}). Fijate en tu bandeja de entrada.`,
        });
      }
      AA.Dialog.open(lines);
    },

    leo() {
      const first = !S().data.flags.metLeo;
      const lines = [];
      if (first) {
        S().data.flags.metLeo = true;
        S().save();
        lines.push({ who: 'leo', text: '¡Hola! Vos sos {name}, ¿no? Yo soy Leo, analista senior. Bah, "senior": tengo más horas de Excel que de sueño.' });
        lines.push({ who: 'leo', text: 'Cuando quieras, venite al café: te puedo prestar mi <b>manual de funciones</b> o tirarte algún consejo.' });
      }
      lines.push({
        who: 'leo',
        text: first ? '¿Te sirve algo ahora?' : pick(['¿Qué necesitás?', '¿Un cafecito y una fórmula?', '¿En qué te doy una mano?']),
        choices: [
          { label: 'Ver el manual de funciones', action: () => AA.Screens.openManual() },
          { label: 'Darme un consejo', action: () => AA.Dialog.open([{ who: 'leo', text: pick(LEO_TIPS) }]) },
          { label: 'Atajos de teclado', action: () => AA.Dialog.open([{ who: 'leo', text: SHORTCUTS }]) },
          { label: 'Nada, gracias', action: () => {} },
        ],
      });
      AA.Dialog.open(lines);
    },

    sofi() {
      const lines = done('m4_limpieza')
        ? [
            'Vi que limpiaste la base de Marketing. ¿Usaste ESPACIOS? Es mi función favorita, no te miento.',
            'Ahora que sabés limpiar texto, te va a encantar cuando lleguen números guardados como texto. Spoiler: llegan.',
          ]
        : [
            'Yo armo los procesos que traen los datos a la empresa. Si llegan sucios… bueno, no siempre es culpa mía. 😅',
            'Dato de color: el 80% del trabajo de un analista es limpiar datos. El otro 20% es quejarse de limpiar datos.',
            'Regla de oro: nunca confíes en un dato que no revisaste.',
          ];
      AA.Dialog.open([{ who: 'sofi', text: pick(lines) }]);
    },

    tomas() {
      let text;
      if (done('m4_limpieza')) text = '¡Gracias por la base limpia! El newsletter llegó a todos y nadie recibió dos veces el mismo mail. Bueno, casi nadie.';
      else if (done('m3_bonos')) text = 'Che, te mandé un mail con la base de clientes. Está… complicada. Perdón de antemano.';
      else text = pick([
        'En Marketing medimos todo: aperturas, clics, conversiones… lo que no medimos es cuánto café tomamos.',
        '¡Hola! Pronto te voy a pedir una mano con una base de clientes. Preparate.',
      ]);
      AA.Dialog.open([{ who: 'tomas', text }]);
    },

    flavor(id) {
      const t = {
        coffee: pick([
          'Te servís un café. +10 de concentración. (No hace nada, pero se siente bien.)',
          'La máquina hace un ruido sospechoso y te da un cortado. Nadie sabe por qué.',
          'Hay un cartel: "Si la máquina dice ERROR, no es #DIV/0!. Llamar a mantenimiento."',
        ]),
        nico: 'El escritorio de Nico. Un post-it dice: "Vuelvo de vacaciones el lunes. NO TOCAR mi planilla de presupuesto (la de 47 pestañas)."',
        books: pick([
          'Un libro: «Storytelling con datos». Tiene más subrayados que páginas.',
          'Un libro: «Excel para valientes». Alguien escribió en la tapa "y para desesperados".',
          'Un libro: «El arte de la tabla dinámica». Parece que nadie lo devolvió a la biblioteca.',
          'Un libro: «Cómo mentir con estadísticas». Marta lo tiene marcado como "lectura obligatoria".',
        ]),
        bossdesk: 'Un post-it: "Revisar KPIs de Q2". Al lado, una taza que dice: "En Dios confiamos; los demás, traigan datos".',
        sofa: 'Un sofá muy cómodo. Mejor no sentarse: hay planillas esperando.',
        exit: S().nextMission() ? '¿Irte ya? Todavía hay datos que analizar.' : 'Terminaste la jornada. ¡La Etapa 2 te espera!',
      }[id];
      if (t) AA.Dialog.open([{ who: 'narrator', text: t }]);
    },
  };

  AA.State.CHARACTERS.narrator = { name: '', role: '' };
  AA.Story = Story;
})();
