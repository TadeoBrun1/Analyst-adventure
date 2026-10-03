/*
 * Analyst Adventure — Bienvenida y guías de primera vez (oficina, computadora, planilla y herramientas).
 * Las explicaciones usan animaciones en vivo sobre la interfaz real (no capturas).
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const T = (es, en) => ({ es, en });
  const L = (es, en) => AA.T(es, en);

  // Ilumina elementos uno detrás de otro, en bucle (para mostrar columnas, filas, etc.).
  function sweep(ctx, els, cls, ms) {
    let k = 0;
    const step = () => {
      els.forEach((e) => e.classList.remove(cls));
      if (els.length) els[k % els.length].classList.add(cls);
      k++;
    };
    step();
    ctx.every(step, ms || 450);
  }
  const clear = (cls) => document.querySelectorAll('.' + cls).forEach((e) => e.classList.remove(cls));

  // Personaje caminando dentro de una tarjeta (animación con el mismo sprite del juego).
  function walkerDemo(ctx) {
    const cv = ctx.demo.querySelector('canvas.walker');
    if (!cv) return;
    const g = cv.getContext('2d');
    let t = 0;
    ctx.every(() => {
      t += 1;
      const W = cv.width;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, W, cv.height);
      g.fillStyle = '#c4ccd9';
      g.fillRect(0, 0, W, cv.height);
      g.setTransform(2, 0, 0, 2, 0, 0);
      g.imageSmoothingEnabled = false;
      const phase = t % 120;
      const right = phase < 60;
      const x = right ? 12 + phase * 1.1 : 12 + (120 - phase) * 1.1;
      AA.Sprites.drawChar(g, x, 44, AA.State.CHARACTERS.player, right ? 'right' : 'left', 1 + (Math.floor(t / 4) % 2));
      const keys = ctx.demo.querySelectorAll('.kd-key');
      keys.forEach((k) => k.classList.toggle('down', (right && k.dataset.k === 'D') || (!right && k.dataset.k === 'A')));
    }, 60);
  }

  // Mini planilla que "escribe" una fórmula y muestra el resultado.
  function typeDemo(ctx) {
    const cell = ctx.demo.querySelector('[data-type]');
    const bar = ctx.demo.querySelector('.td-bar span');
    if (!cell) return;
    const text = '=C2*D2';
    let i = 0;
    ctx.every(() => {
      i = (i + 1) % (text.length + 8);
      if (i <= text.length) {
        cell.textContent = text.slice(0, i);
        bar.textContent = text.slice(0, i);
        cell.classList.remove('done');
      } else if (i === text.length + 1) {
        cell.textContent = '330';
        cell.classList.add('done');
      }
    }, 260);
  }

  const Guides = {
    // Pantalla de bienvenida: cómo se juega y qué son los eventos especiales.
    welcome(done) {
      if (AA.Tour.seen('welcome')) return done && done();
      const row = (i, icon, title, text) => `<div class="wl-row" style="--d:${150 + i * 140}ms"><div class="wl-ico">${icon}</div><div><b>${title}</b><p>${text}</p></div></div>`;
      AA.UI.modal({
        title: L('👋 ¡Te damos la bienvenida a Analyst Adventure!', '👋 Welcome to Analyst Adventure!'),
        wide: true,
        closable: false,
        className: 'welcome',
        html: `
          <p class="wl-lead">${L('Empezás como pasante en el equipo de datos de <b>Grupo Cóndor</b>. Así se juega:', 'You start as an intern on the data team at <b>Grupo Cóndor</b>. Here is how to play:')}</p>
          <div class="wl-rows">
            ${row(0, '🚶', L('Recorré la oficina', 'Explore the office'), L('Caminá, hablá con el equipo y descubrí la oficina. Leo te enseña cada herramienta antes de usarla.', 'Walk around, talk to the team and explore. Leo teaches you each tool before you use it.'))}
            ${row(1, '📊', L('Completá misiones', 'Complete missions'), L('Las tareas llegan por mail a tu computadora: planillas tipo Excel, tablas dinámicas, SQL, gráficos, dashboards e informes.', 'Tasks arrive by email on your computer: Excel-like spreadsheets, pivot tables, SQL, charts, dashboards and reports.'))}
            ${row(2, '📣', L('¡Atención a los eventos especiales!', 'Watch out for special events!'), L('A veces, al entregar un informe, el equipo te pide que <b>presentes los resultados</b> y te hace preguntas sobre <b>tus datos</b>. Prestá atención a lo que calculás: no vas a poder volver a mirar la planilla.', 'Sometimes, when you submit a report, the team asks you to <b>present the results</b> and quizzes you on <b>your data</b>. Pay attention to what you calculate: you won\'t be able to look at the sheet again.'))}
            ${row(3, '🏅', L('Subí de rango', 'Climb the ranks'), L('Pasante → Junior → Semi-Senior → Senior. Cada etapa trae tareas nuevas, como en un trabajo real.', 'Intern → Junior → Mid-level → Senior. Every stage brings new tasks, just like a real job.'))}
            ${row(4, '📒', L('Tu libreta', 'Your notebook'), L('Todo lo que aprendés queda anotado. Abrila con <kbd>F</kbd> en la oficina.', 'Everything you learn gets written down. Open it with <kbd>F</kbd> in the office.'))}
          </div>`,
        buttons: [{ label: L('¡A trabajar! →', "Let's get to work! →"), primary: true, action: () => (AA.Tour.markSeen('welcome'), done && done()) }],
      });
    },

    // Guía de la oficina (después de la bienvenida).
    office(done) {
      const O = AA.Office;
      AA.Tour.run(
        'office',
        [
          {
            target: () => O.rectOf('player'),
            pad: 14,
            title: T('🚶 Este es tu personaje', '🚶 This is you'),
            text: T('Caminá con <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> o con las flechas.', 'Walk with <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or the arrow keys.'),
            demo: () => `<div class="kd"><canvas class="walker" width="300" height="110"></canvas><div class="kd-keys"><span class="kd-key" data-k="W">W</span><span class="kd-key" data-k="A">A</span><span class="kd-key" data-k="S">S</span><span class="kd-key" data-k="D">D</span></div></div>`,
            onEnter: walkerDemo,
          },
          {
            target: () => O.rectOf('marta'),
            pad: 16,
            title: T('❗ Hablar e interactuar', '❗ Talk and interact'),
            text: T('Acercate a una persona u objeto y apretá <kbd>E</kbd> (o hacé clic). El <b>❗ amarillo</b> te marca a quién ir a ver. Ahora te espera <b>Marta</b>, la jefa, en la oficina de vidrio.', 'Walk up to a person or object and press <kbd>E</kbd> (or click). The <b>yellow ❗</b> tells you who to go see. Right now <b>Marta</b>, the boss, is waiting in the glass office.'),
            demo: () => `<div class="kd-e"><span class="kd-key big pulse">E</span><span class="kd-mark">!</span></div>`,
          },
          {
            target: () => O.rectOf('computer'),
            pad: 10,
            title: T('🖥️ Tu computadora', '🖥️ Your computer'),
            text: T('Acá llegan las misiones por mail. Te sentás, abrís la bandeja y elegís qué hacer. Se habilita después de la primera charla con Leo.', 'Missions arrive here by email. You sit down, open the inbox and pick what to do. It unlocks after your first chat with Leo.'),
          },
          {
            target: () => O.rectOf('leo'),
            pad: 16,
            title: T('☕ Leo, en el comedor', '☕ Leo, in the kitchen'),
            text: T('Leo te explica cada nivel antes de empezarlo. Lo que te enseña queda en tu libreta.', 'Leo explains each level before you start it. What he teaches goes into your notebook.'),
          },
          {
            target: '#hud-notebook',
            title: T('📒 Libreta', '📒 Notebook'),
            text: T('Tu rango, tu XP y todo lo que aprendiste. Atajo: <kbd>F</kbd>.', 'Your rank, your XP and everything you learned. Shortcut: <kbd>F</kbd>.'),
          },
          {
            target: '#hud-career',
            title: T('📈 Plan de carrera', '📈 Career plan'),
            text: T('Qué hace cada rango en la vida real y qué te falta para ascender.', 'What each rank does in real life and what you need for your next promotion.'),
          },
          {
            target: '#hud-menu',
            title: T('☰ Menú', '☰ Menu'),
            text: T('Pausa, opciones (música, idioma, pantalla) y cambiar tu aspecto. Atajo: <kbd>Esc</kbd>.', 'Pause, options (music, language, display) and change your look. Shortcut: <kbd>Esc</kbd>.'),
          },
        ],
        { onDone: () => done && done() }
      );
    },

    // Guía de la bandeja de entrada (la primera vez que abrís la computadora).
    inbox() {
      const chips = `<div class="legend">
        <span class="lg new" style="--d:0ms">★ ${L('Nuevo', 'New')}</span>
        <span class="lg prog" style="--d:150ms">✎ ${L('En progreso', 'In progress')}</span>
        <span class="lg ok" style="--d:300ms">✔ ${L('Entregado', 'Delivered')}</span>
        <span class="lg extra" style="--d:450ms">🎲 ${L('Extra', 'Extra')}</span>
        <span class="lg favor" style="--d:600ms">🤝 ${L('Favor', 'Favor')}</span></div>`;
      AA.Tour.run('inbox', [
        {
          target: '.mail-list',
          pad: 0,
          title: T('📨 Tu bandeja de entrada', '📨 Your inbox'),
          text: T('Acá están todas tus misiones, ordenadas por <b>etapa</b> (tu rango) y por <b>nivel</b>.', 'All your missions are here, sorted by <b>stage</b> (your rank) and <b>level</b>.'),
        },
        {
          target: '.stage-head',
          title: T('🎓 Etapas plegables', '🎓 Collapsible stages'),
          text: T('Cada rango es una etapa. Hacé clic para plegarla o desplegarla; el juego recuerda cómo la dejaste.', 'Each rank is a stage. Click to collapse or expand it; the game remembers how you left it.'),
          onEnter: (ctx) => {
            const h = document.querySelector('.stage-head .chev');
            if (h) ctx.every(() => h.classList.toggle('tour-wiggle'), 600);
          },
          onLeave: () => clear('tour-wiggle'),
        },
        {
          target: () => document.querySelector('.stage.open .mail-group-head'),
          title: T('🗂️ Niveles', '🗂️ Levels'),
          text: T('Cada nivel tiene <b>5 tareas obligatorias</b>. El contador muestra cuántas entregaste.', 'Each level has <b>5 required tasks</b>. The counter shows how many you delivered.'),
        },
        {
          target: () => document.querySelector('.mail-item.new') || document.querySelector('.mail-item.active'),
          title: T('🎨 Los colores dicen el estado', '🎨 Colors show the status'),
          text: T('Las tareas <b>nuevas</b> se ven en ámbar. Las que empezaste, en azul; las entregadas, apagadas.', '<b>New</b> tasks are amber. The ones you started are blue; delivered ones are dimmed.'),
          demo: chips,
        },
        {
          target: () => document.querySelector('.mail-item.practice'),
          title: T('🎲 Misiones extra', '🎲 Extra missions'),
          text: T('Cuando terminás las 5 tareas de un nivel, aparece la <b>práctica libre</b> en violeta: casos aleatorios, con tablas más grandes, que suman XP extra. Siempre las vas a reconocer por ese color.', 'When you finish a level\'s 5 tasks, <b>free practice</b> appears in purple: random cases with bigger tables that earn extra XP. You will always spot them by that color.'),
        },
        {
          target: () => document.querySelector('.mail-view .attachment') || document.querySelector('.mail-view'),
          title: T('📎 Leé el pedido y abrí el archivo', '📎 Read the request and open the file'),
          text: T('Cada mail explica qué necesita esa persona. El archivo adjunto abre la herramienta para resolverlo.', 'Each email explains what that person needs. The attachment opens the tool to solve it.'),
        },
        {
          target: '.os-bar [data-act="back"]',
          title: T('↩️ Volver a la oficina', '↩️ Back to the office'),
          text: T('Con este botón o con <kbd>Esc</kbd>.', 'With this button or <kbd>Esc</kbd>.'),
        },
      ]);
    },

    // Guía de la planilla (primera tarea) o de la herramienta que se esté viendo.
    mission(ms, force) {
      const view = ms.activeView;
      if (ms.arcade) return;
      // Primera tarea sin guía (práctica libre o favor): qué cambia.
      if (!ms.guided && (force || !AA.Tour.seen('unguided'))) {
        return AA.Tour.run(
          'unguided',
          [
            {
              target: '.card.brief',
              pad: 0,
              title: T('📧 Sin paso a paso', '📧 No step-by-step'),
              text: T('Las prácticas libres y los favores de cosas que ya hiciste no te dicen <b>cómo</b> hacerlo: solo el pedido, como en un trabajo real. Leé qué necesita la persona y decidí vos qué funciones o herramientas usar. Si te trabás, siempre tenés <b>💡 Pista</b>.', 'Free practice and favors about things you already did don\'t tell you <b>how</b> to do it: just the request, like a real job. Read what the person needs and decide which functions or tools to use. If you get stuck, <b>💡 Hint</b> is always there.'),
            },
            {
              target: () => document.querySelector('.ss-status'),
              title: T('🧮 Recuento, suma y promedio', '🧮 Count, sum and average'),
              text: T('Seleccioná un rango y mirá abajo de la planilla: aparecen el recuento, la suma, el promedio, el mínimo y el máximo, como en Excel. Sirve para chequear rápido sin contar a mano.', 'Select a range and look below the sheet: count, sum, average, min and max appear, just like Excel. Handy for quick checks without counting by hand.'),
            },
            {
              target: () => document.querySelector('.ss-tools'),
              title: T('🔽 Filtrar, buscar y pintar', '🔽 Filter, find and paint'),
              text: T('¿Te preguntan cuántos productos vendieron menos de 10? Activá <b>🔽 Filtro</b>, tocá ▾ en esa columna y elegí «menor que 10»: abajo dice <b>«Se encontraron X de N registros»</b>. También podés <b>🔍 Buscar</b> (<kbd>Ctrl</kbd>+<kbd>B</kbd>), pintar filas con <kbd>Ctrl</kbd>+clic en su número o usar <b>✨ Resaltar celdas</b>.', 'Asked how many products sold fewer than 10? Turn on <b>🔽 Filter</b>, tap ▾ on that column and choose "less than 10": below it says <b>"Found X of N records"</b>. You can also <b>🔍 Find</b> (<kbd>Ctrl</kbd>+<kbd>F</kbd>), paint rows with <kbd>Ctrl</kbd>+click on their number or use <b>✨ Highlight cells</b>.'),
            },
            {
              target: () => document.querySelector('[data-pick]'),
              title: T('📍 Responder con una celda', '📍 Answer with a cell'),
              text: T('¿Calculaste la respuesta en una celda (por ejemplo con un CONTAR.SI)? Seleccionala y tocá 📍: el valor pasa solo a la respuesta.', 'Did you calculate the answer in a cell (for example with COUNTIF)? Select it and tap 📍: the value goes straight into the answer.'),
            },
          ],
          { force, onDone: () => ms.focusActive() }
        );
      }
      if (view === 'sheets' && ms.defs.length) {
        if (!force && AA.Tour.seen('sheet') && !AA.Tour.seen('gridtools')) return this.gridTools(ms);
        return this.sheet(ms, force);
      }
      return this.tool(view, force);
    },

    sheet(ms, force) {
      const grid = ms.grids[ms.activeSheet];
      if (!grid) return;
      const root = grid.root || document;
      const cols = () => [...root.querySelectorAll('th.ss-colhead')].slice(0, 6);
      const rows = () => [...root.querySelectorAll('th.ss-rowhead')].slice(0, 8);
      const cellB3 = () => root.querySelector('td[data-c="1"][data-r="2"]');
      // Zona visible de la tabla (encabezados + primeras filas), para ver las animaciones enteras.
      const tableArea = () => {
        const last = [...root.querySelectorAll('th.ss-rowhead')].slice(0, 9).pop();
        const cs = cols();
        const lastCell = last && cs.length ? root.querySelector(`td[data-c="${cs[cs.length - 1].dataset.c}"][data-r="${last.dataset.r}"]`) : null;
        return unionRect([...cs, ...rows().slice(0, 1).map((r) => r), lastCell].filter(Boolean));
      };
      const unionRect = (els) => {
        if (!els.length) return null;
        const rs = els.map((e) => e.getBoundingClientRect());
        const l = Math.min(...rs.map((r) => r.left));
        const t = Math.min(...rs.map((r) => r.top));
        return { left: l, top: t, width: Math.max(...rs.map((r) => r.right)) - l, height: Math.max(...rs.map((r) => r.bottom)) - t };
      };
      AA.Tour.run(
        'sheet',
        [
          {
            target: '.ms-side',
            pad: 0,
            title: T('🎯 Tus objetivos', '🎯 Your objectives'),
            text: T('Esto es lo que pide el pedido. Cada objetivo <b>se tilda solo</b> cuando lo cumplís. Las preguntas ❓ se responden escribiendo.', 'This is what the request asks for. Each objective <b>ticks itself</b> when you meet it. Questions ❓ are answered by typing.'),
          },
          {
            target: tableArea,
            title: T('🔤 Columnas: letras', '🔤 Columns: letters'),
            text: T('Una planilla es una tabla gigante. Las <b>columnas</b> van de arriba hacia abajo y se nombran con <b>letras</b>: A, B, C…', 'A spreadsheet is a giant table. <b>Columns</b> run top to bottom and are named with <b>letters</b>: A, B, C…'),
            onEnter: (ctx) => {
              const cs = cols();
              let k = 0;
              ctx.every(() => {
                clear('tour-col');
                const c = cs[k % cs.length];
                if (c) root.querySelectorAll(`[data-c="${c.dataset.c}"]`).forEach((e) => e.classList.add('tour-col'));
                k++;
              }, 520);
            },
            onLeave: () => clear('tour-col'),
          },
          {
            target: tableArea,
            title: T('🔢 Filas: números', '🔢 Rows: numbers'),
            text: T('Las <b>filas</b> van de izquierda a derecha y se numeran: 1, 2, 3… Normalmente, cada fila es un registro (un pedido, un cliente, un mes).', '<b>Rows</b> run left to right and are numbered: 1, 2, 3… Usually each row is one record (an order, a customer, a month).'),
            onEnter: (ctx) => {
              const rs = rows();
              let k = 0;
              ctx.every(() => {
                clear('tour-row');
                const r = rs[k % rs.length];
                if (r) r.closest('tr').querySelectorAll('th, td').forEach((e) => e.classList.add('tour-row'));
                k++;
              }, 480);
            },
            onLeave: () => clear('tour-row'),
          },
          {
            target: tableArea,
            title: T('📍 Celdas: letra + número', '📍 Cells: letter + number'),
            text: T('Cada celda es el cruce de una columna y una fila. Su dirección se escribe <b>letra + número</b>: esta es la <b>B3</b>.', 'Each cell is where a column and a row cross. Its address is <b>letter + number</b>: this one is <b>B3</b>.'),
            demo: () => `<div class="addr"><span class="a-col">B</span><span class="a-plus">+</span><span class="a-row">3</span><span class="a-eq">=</span><span class="a-cell">B3</span></div>`,
            onEnter: (ctx) => {
              const c = cellB3();
              if (c) c.classList.add('tour-cell');
              const blink = () => {
                root.querySelectorAll('[data-c="1"]').forEach((e) => e.classList.toggle('tour-col'));
                const r = root.querySelector('th.ss-rowhead[data-r="2"]');
                if (r) r.closest('tr').querySelectorAll('th, td').forEach((e) => e.classList.toggle('tour-row'));
              };
              blink();
              ctx.every(blink, 700);
            },
            onLeave: () => {
              clear('tour-col');
              clear('tour-row');
              clear('tour-cell');
            },
          },
          {
            target: () => root.querySelector('.ss-bar') || root.querySelector('.ss-formula'),
            title: T('✍️ Escribir y calcular', '✍️ Typing and calculating'),
            text: T('Seleccioná una celda y escribí. Si empieza con <b>=</b> es una <b>fórmula</b>: la planilla calcula sola. Arriba, en la barra, ves lo que tiene la celda. <b>Enter</b> confirma, <b>Esc</b> cancela.', 'Select a cell and type. If it starts with <b>=</b> it is a <b>formula</b>: the sheet calculates for you. The bar above shows what the cell contains. <b>Enter</b> confirms, <b>Esc</b> cancels.'),
            demo: () => `<div class="td"><div class="td-bar"><i>fx</i><span></span></div><table class="tut-sheet"><tr><th></th><th>C</th><th>D</th><th>E</th></tr><tr><th>2</th><td>11</td><td>30</td><td data-type class="sel"></td></tr></table></div>`,
            onEnter: typeDemo,
          },
          {
            target: () => root.querySelector('td.target') || cellB3(),
            title: T('⬇️ Copiar hacia abajo', '⬇️ Copy down'),
            text: T('Escribí la fórmula una vez y <b>arrastrá el cuadradito azul</b> de la esquina hacia abajo: cada fila recibe la fórmula de arriba, ajustada. Las celdas <b>amarillas</b> son las que tenés que completar; las grises son datos originales.', 'Type the formula once and <b>drag the little blue square</b> in the corner down: each row gets the formula from above, adjusted. <b>Yellow</b> cells are the ones you fill in; gray ones are original data.'),
            demo: () => `<table class="tut-sheet tut-fill"><tr><th></th><th>A</th><th>B</th><th>C</th></tr><tr><th>2</th><td>2</td><td>500</td><td class="sel">=A2*B2<i class="tut-handle"></i></td></tr><tr><th>3</th><td>4</td><td>250</td><td class="ghost">=A3*B3</td></tr><tr><th>4</th><td>1</td><td>900</td><td class="ghost">=A4*B4</td></tr></table>`,
          },
          {
            target: () => root.querySelector('th.ss-colhead[data-c="2"]'),
            pad: 6,
            title: T('🖱️ Marcar una columna o fila entera', '🖱️ Select a whole column or row'),
            text: T('Clic en la <b>letra</b> marca toda la columna; clic en el <b>número</b>, toda la fila. Así seguís fácil los datos.', 'Click a <b>letter</b> to select the whole column; click a <b>number</b> for the whole row. It makes the data easy to follow.'),
            onEnter: (ctx) => {
              const toggle = () => root.querySelectorAll('[data-c="2"]').forEach((e) => e.classList.toggle('tour-col'));
              toggle();
              ctx.every(toggle, 650);
            },
            onLeave: () => clear('tour-col'),
          },
          {
            target: () => root.querySelector('.ss-tools'),
            pad: 4,
            title: T('🔍 Buscar, filtrar y marcar', '🔍 Find, filter and mark'),
            text: T('Para tablas grandes: <b>🔍 Buscar</b> (<kbd>Ctrl</kbd>+<kbd>B</kbd>) resalta lo que escribas, <b>🔽 Filtro</b> deja solo las filas que cumplen una condición, <b>🖌</b> pinta celdas (o <kbd>Ctrl</kbd>+clic en el número de fila) y <b>✨ Resaltar celdas</b> marca solas las que cumplen algo. Abajo ves cuántas son.', 'For big tables: <b>🔍 Find</b> (<kbd>Ctrl</kbd>+<kbd>F</kbd>) highlights what you type, <b>🔽 Filter</b> keeps only the rows that meet a condition, <b>🖌</b> paints cells (or <kbd>Ctrl</kbd>+click a row number) and <b>✨ Highlight cells</b> marks the ones that meet a rule. The count shows below.'),
          },
          {
            target: '.ms-top [data-act="submit"]',
            title: T('📤 Entregar', '📤 Submit'),
            text: T('Con todos los objetivos tildados se habilita <b>Entregar informe</b>. Ojo: a veces, al entregar, el equipo te pide <b>presentar los resultados</b> y te pregunta por tus datos. ¡Miralos bien antes!', 'Once every objective is ticked, <b>Submit report</b> unlocks. Careful: sometimes the team asks you to <b>present the results</b> and asks about your data. Look at them closely first!'),
          },
          {
            target: '.ms-top [data-act="help"]',
            title: T('❓ Ayuda', '❓ Help'),
            text: T('Esta guía vuelve cuando quieras con <b>❓ Ayuda</b>. También tenés <b>💡 Pista</b>, el pedido original y tu libreta.', 'This guide comes back anytime with <b>❓ Help</b>. You also have <b>💡 Hint</b>, the original request and your notebook.'),
          },
        ],
        {
          force,
          onDone: () => {
            const st = AA.State;
            st.data.flags.tipHeaders = true;
            st.save();
            AA.Tour.markSeen('gridtools'); // esta guía ya mostró las herramientas
            ms.focusActive();
          },
        }
      );
    },

    // Herramientas nuevas de la planilla (para quien ya había visto la guía de la planilla).
    gridTools(ms) {
      const grid = ms.grids[ms.activeSheet];
      if (!grid) return;
      const root = grid.root;
      AA.Tour.run(
        'gridtools',
        [
          {
            target: () => root.querySelector('.ss-tools [data-tool="find"]'),
            pad: 4,
            title: T('🔍 ¡Nuevo! Buscar', '🔍 New! Find'),
            text: T('Con <kbd>Ctrl</kbd>+<kbd>B</kbd> (o <kbd>Ctrl</kbd>+<kbd>F</kbd>) escribís un número o una palabra y se resaltan <b>todas</b> las celdas que lo tienen, con el total. <kbd>Enter</kbd> salta a la siguiente. Podés buscar en toda la hoja, en una columna o en una fila.', 'With <kbd>Ctrl</kbd>+<kbd>F</kbd> (or <kbd>Ctrl</kbd>+<kbd>B</kbd>) type a number or a word and <b>every</b> cell that has it lights up, with the total. <kbd>Enter</kbd> jumps to the next one. Search the whole sheet, one column or one row.'),
          },
          {
            target: () => root.querySelector('.ss-tools [data-tool="filter"]'),
            pad: 4,
            title: T('🔽 Filtro', '🔽 Filter'),
            text: T('Activalo (<kbd>Ctrl</kbd>+<kbd>Mayús</kbd>+<kbd>L</kbd>) y tocá ▾ en la letra de una columna: «menor que 10», «contiene Norte», «los 5 mayores»… Se ocultan las filas que no cumplen y abajo dice <b>cuántos registros se encontraron</b>.', 'Turn it on (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>L</kbd>) and tap ▾ on a column letter: "less than 10", "contains North", "top 5"… Rows that don\'t match are hidden and the bar below says <b>how many records were found</b>.'),
          },
          {
            target: () => root.querySelector('.ss-tools [data-paint="y"]'),
            pad: 6,
            title: T('🖌 Pintar y ✨ resaltar', '🖌 Paint and ✨ highlight'),
            text: T('Pintá la selección con un color, o hacé <kbd>Ctrl</kbd>+clic en el número de una fila para pintarla entera. <b>✨ Resaltar celdas</b> pinta solas las que cumplen una condición. Abajo ves <b>cuántas hay de cada color</b>. Nada de esto cambia los datos: solo ayuda a mirar.', 'Paint the selection with a color, or <kbd>Ctrl</kbd>+click a row number to paint the whole row. <b>✨ Highlight cells</b> paints the ones that meet a condition automatically. Below you see <b>how many of each color</b>. None of this changes the data: it just helps you look.'),
          },
        ],
        { onDone: () => ms.focusActive() }
      );
    },

    // Guías cortas de cada herramienta, la primera vez que se abre.
    tool(view, force) {
      const S = {
        pivot: [
          { target: '.cb-fields', title: T('📋 Campos', '📋 Fields'), text: T('Las columnas de la tabla de datos. Arrastralas (o hacé clic) a las áreas de la tabla dinámica.', 'The columns of the data table. Drag them (or click) into the pivot table areas.') },
          { target: '.pv-areas', title: T('🧩 Filas, Columnas, Valores y Filtros', '🧩 Rows, Columns, Values and Filters'), text: T('<b>Filas</b>: cómo agrupar. <b>Valores</b>: qué calcular (Suma, Recuento, Promedio). <b>Filtros</b>: qué dejar afuera.', '<b>Rows</b>: how to group. <b>Values</b>: what to calculate (Sum, Count, Average). <b>Filters</b>: what to leave out.') },
          { target: '.pv-out', title: T('📊 Resultado', '📊 Result'), text: T('La tabla resumen se arma sola mientras armás la dinámica.', 'The summary table builds itself as you set up the pivot.') },
        ],
        chart: [
          { target: '.cb-fields', title: T('📋 Dimensiones y medidas', '📋 Dimensions and measures'), text: T('<b>Abc</b> y 📅 son dimensiones (categorías); <b>#</b> son medidas (números).', '<b>Abc</b> and 📅 are dimensions (categories); <b>#</b> are measures (numbers).') },
          { target: '.cb-shelves', title: T('🗄️ Estantes', '🗄️ Shelves'), text: T('Columnas, Filas, Color y Filtros, como en Tableau. Soltá los campos acá.', 'Columns, Rows, Color and Filters, just like Tableau. Drop the fields here.') },
          { target: '.cb-main', title: T('📈 El gráfico', '📈 The chart'), text: T('Elegí el tipo con <b>Mostrarme</b> y poné un título que cuente la conclusión.', 'Pick the type with <b>Show Me</b> and write a title that tells the takeaway.') },
        ],
        sql: [
          { target: '.sql-schema', title: T('🗄️ Tablas', '🗄️ Tables'), text: T('Las tablas de la base y sus columnas. Clic para insertar el nombre; 👁 muestra las primeras filas.', 'The database tables and their columns. Click to insert a name; 👁 shows the first rows.') },
          { target: '.sql-editor', title: T('⌨️ Consulta', '⌨️ Query'), text: T('Escribí tu <code>SELECT</code> y ejecutalo con <kbd>Ctrl</kbd>+<kbd>Enter</kbd>.', 'Write your <code>SELECT</code> and run it with <kbd>Ctrl</kbd>+<kbd>Enter</kbd>.') },
          { target: '.sql-result', title: T('📄 Resultado', '📄 Result'), text: T('Acá aparecen las filas que devuelve. Si hay un error, te explica qué pasó.', 'The returned rows show up here. If there is an error, it explains what happened.') },
        ],
        dashboard: [
          { target: '.db-bar', title: T('🧰 Barra del dashboard', '🧰 Dashboard bar'), text: T('Título, filtro global y botones para agregar KPIs y gráficos.', 'Title, global filter and buttons to add KPIs and charts.') },
          { target: '.db-grid', title: T('🧱 Elementos', '🧱 Tiles'), text: T('Cada tarjeta responde una pregunta. Con ✏️ la editás y con 🗑 la quitás.', 'Each tile answers one question. ✏️ edits it and 🗑 removes it.') },
        ],
        report: [
          { target: '.rp-opts', title: T('🧩 Armá el informe', '🧩 Build the report'), text: T('Elegí el titular, la evidencia y la recomendación. Cada parte tiene opciones mejores y peores.', 'Choose the headline, the evidence and the recommendation. Each part has better and worse options.') },
          { target: '.rp-preview', title: T('👁 Vista previa', '👁 Preview'), text: T('Así lo ve quien lo recibe. Pensá en esa persona: ¿se entiende sin explicarlo?', 'This is what the reader sees. Think of that person: is it clear without explaining?') },
        ],
      }[view];
      if (!S) return;
      AA.Tour.run('tool-' + view, S, { force });
    },
  };

  AA.Guides = Guides;
})();
