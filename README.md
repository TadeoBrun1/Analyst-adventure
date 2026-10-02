# Analyst Adventure

Juego 2D para aprender a usar planillas de cálculo (Excel / Google Sheets) haciendo el trabajo de un
**analista de datos**: empezás como pasante en *Grupo Cóndor* y, resolviendo pedidos reales de distintas
áreas (Ventas, RR.HH., Marketing, Logística…), vas subiendo de Pasante a Lead.

Inspirado en *Database Detective: Minor Crimes Division*: planillas, tablas dinámicas, SQL, dashboards e informes, como en el trabajo real.

## Cómo jugar

### Versión de escritorio (ejecutable)

El juego se distribuye como aplicación de escritorio con **Electron**, lista para publicarse en Steam
(ver [`docs/STEAM.md`](docs/STEAM.md)).

- **Descargar una build**: en GitHub → pestaña **Actions** → última ejecución de *Build ejecutables* →
  **Artifacts**. Para Windows, `AnalystAdventure-…-portable.exe` se abre con doble clic, sin instalar.
- **Desde el código** (requiere [Node.js](https://nodejs.org) 20 o superior):

```bash
npm install
npm start            # abre el juego en una ventana
npm run dist:win     # genera el .exe en dist/ (también: dist:linux, dist:mac)
```

En la versión de escritorio las partidas se guardan en archivos
(`%APPDATA%/Analyst Adventure/saves/slot1.json` … `slot3.json` en Windows), compatibles con Steam Cloud.
Las opciones van en `settings.json`, en la misma carpeta.
`F11` o `Alt+Enter` alternan pantalla completa.

### Versión web

También funciona abriendo `index.html` en el navegador (o con `npm run web`). En ese caso la partida
se guarda en el navegador (`localStorage`).

### Cómo se juega

- **Menú principal**: *Jugar* (3 ranuras de partida), *Opciones* (música de fondo activada/desactivada y
  volumen de música, efectos y voces;
  ventana o pantalla completa; tamaño de ventana; idioma **español / inglés**) y *Salir*. Todo se maneja
  también con las flechas, incluidos los cuadros de pausa y confirmación.
- **Partida nueva**: elegís tu nombre y armás tu personaje: hombre o mujer, tono de piel, peinado y color de
  pelo, barba y su color, anteojos y ropa (remera, camisa, buzo o saco; pantalón o pollera). Se puede cambiar
  después desde la pausa (*👕 Cambiar aspecto*).
- **Oficina**: caminá con `WASD` / flechas e interactuá con `E` / `Espacio` (o con clic). `F` abre y cierra la
  libreta. `Esc` abre la pausa.
  Tiene un **comedor** a la izquierda (cafetera, heladera, mesas), el área de escritorios con sala de reuniones,
  la oficina de vidrio de Marta y un living con sofá; casi todo tiene algo para descubrir.
  - **Leo** (en el comedor, junto al café) explica cada nivel antes de empezarlo; lo que enseña queda en tu **📒 libreta**.
  - La **📒 libreta** también muestra tu ficha: rango, XP, cuánto falta para el próximo ascenso y el nivel actual.
  - Música: un tema lo-fi tranquilo en el menú y uno alegre con swing en la oficina (todo sintetizado, sin archivos).
  - Tu **computadora** → bandeja de entrada con las tareas de cada nivel y la **práctica libre**. Dentro de una
    tarea, `Esc` vuelve a la bandeja y otro `Esc` a la oficina (la libreta se abre con su botón, porque la `F`
    se usa para escribir).
  - **Marta** (jefa) → historia y ascensos. **Pizarra** → plan de carrera.
  - El equipo: **Leonel "Leo" Bargas** (analista senior), su hermano **Tadeo Bargas** (Marketing) y **Camila
    Navarro** (Data Engineer). En el comedor, **Jean Joestar** (arquitecto y "artista del concreto", viene por el
    café) y **Juan Roberto Tercero De Iscariote**, que recita versos de distintos poetas.
- **Progresión**: los niveles se agrupan en **etapas**, una por rango (Pasante → Junior → Semi-Senior →
  Senior → Lead). Cada nivel tiene 5 tareas obligatorias; al terminarlas se abre la práctica libre (casos
  generados al azar con tablas medianas o grandes).
  - Para ascender hacen falta **las dos cosas**: completar todos los niveles de la etapa y llegar a la XP del rango.
  - Solo los **primeros 4 casos de práctica de cada nivel** suman XP (alcanzan para el ascenso con 3 o 4);
    después se puede seguir practicando sin límite, pero sin XP. Los niveles de una etapa ya superada no dan XP.
  - El **📈 plan de carrera** muestra qué hace cada rango en la vida real, qué te falta para ascender y la hoja de ruta.
- **Herramientas** (versiones simples de las reales, para que después sea fácil pasar a Excel, Tableau, Power BI o una base de datos):
  - **Planilla con varias hojas**: referencias como `Productos!A:D` o `'Lista de precios'!B2`, BUSCARV/BUSCARX entre hojas.
  - **Tabla dinámica**: Filas, Columnas, Valores (Suma, Recuento, Promedio, Máx, Mín), Filtros y "% del total".
  - **Consola SQL**: SELECT, WHERE, ORDER BY, LIMIT, COUNT/SUM/AVG, GROUP BY, HAVING, JOIN, CASE; esquema de tablas,
    colores de sintaxis y errores explicados en criollo ("¿falta una coma?", "los textos van entre comillas simples").
  - **Dashboards**: KPIs, varios gráficos y un filtro global; arreglar dashboards ajenos o armarlos desde cero.
  - **Informes y resúmenes ejecutivos**: elegir titular, evidencia, gráfico y recomendación; cada opción incorrecta
    explica por qué no sirve, y a la derecha se ve la diapositiva final.
  - **Revisión**: marcar con 🚩 las celdas con errores del trabajo de Nico (el junior) y arreglarlas.
- **Celebración**: al completar un nivel o ascender, confeti y fanfarria.
- **Gráficos (Nivel 6)**: constructor estilo Tableau / Power BI. Arrastrás *dimensiones* y *medidas* a
  **Columnas**, **Filas**, **Color** y **Filtros**, elegís el tipo con **Mostrarme** (barras, líneas, torta,
  dispersión), la agregación (Suma, Promedio, Recuento, Mín, Máx), el orden y un título que cuente la conclusión.
- **Planilla**: funciona como Excel/Sheets.
  - Fórmulas con `=`, funciones en **español o inglés** (`SUMA`/`SUM`), argumentos separados con `;` o `,`.
  - Clic en celdas mientras escribís una fórmula para insertar referencias; `F4` agrega `$`.
  - Controlador de relleno (arrastrar el cuadradito), `Ctrl+C/V`, `Ctrl+D`, `Ctrl+R`, `Ctrl+Z/Y`, `Ctrl+flechas`.
  - Los objetivos se validan solos; las preguntas ❓ se responden escribiendo (estilo detective).
- **Sonido**: todo sintetizado en el momento (música chiptune, efectos y un "bip" por palabra en los diálogos).

## Etapas de desarrollo

El contenido de cada rango se basa en un análisis de ofertas laborales y escaleras de carrera reales:
ver [`docs/CARRERA.md`](docs/CARRERA.md).

| Versión | Contenido | Estado |
|------|-----------|--------|
| **0.1–0.2** | Motor de planilla, oficina 2D, menú con 3 ranuras, opciones (sonido, pantalla, idioma), audio, libreta. Niveles 1–5: fórmulas básicas · funciones de resumen · SI/Y/O · limpieza de texto · CONTAR.SI/SUMAR.SI y `$`. | ✅ |
| **0.3** | Etapa **Pasante** completa: Nivel 6 de **gráficos** (constructor estilo Tableau). Ascensos por etapa + XP, límite de XP en prácticas, plan de carrera con lo que hace cada rango en la vida real. | ✅ |
| **0.4 · Junior** | Niveles 7–11: **BUSCARV/BUSCARX** con varias hojas · **calidad de datos** (duplicados, vacíos, números como texto, reglas de validez) · **tablas dinámicas** · **SQL básico** · **reportes, pedidos puntuales y mantenimiento de dashboards**. | ✅ |
| **0.4 · Semi-Senior** | Niveles 12–15: **estadística** (mediana, desvío, atípicos, correlación ≠ causalidad, descomponer una caída) · **dashboards desde cero** · **análisis de punta a punta + storytelling** · **revisar el trabajo de un junior** (planilla, SQL y dashboard). | ✅ |
| **0.4 · Senior** | Niveles 16–19: **definir KPIs** (conversión, churn, OTIF, NPS, metas, indicadores adelantados) · **pruebas A/B** (lift, significancia, resguardo, segmentos, diseño) · **datos incompletos** (escenarios, sesgo, estimaciones) · **resúmenes ejecutivos**. | ✅ |
| **0.4.1** | Oficina rediseñada: más grande y luminosa, con comedor, plantas, sala de reuniones y living. | ✅ |
| **0.4.2** | Ficha del jugador (rango, XP y nivel) dentro de la libreta; música nueva para la oficina y opción para apagar la música. | ✅ |
| **0.5** | Creador de personaje, nuevos personajes en el comedor (Jean y Juan Roberto), equipo renombrado, tecla `F` para la libreta, flechas en todos los menús y `Esc` para salir de las tareas. | ✅ |
| **0.5.1** | Sillas en los escritorios (te sentás antes de usar la computadora), guía ilustrada de la planilla con botón ❓ Ayuda, ayudas en el momento justo (copiar una fórmula arrastrando, marcar filas y columnas) y panel de objetivos con color propio. | ✅ |
| **Lead** | Priorizar pedidos, encuadrar problemas con otras áreas, mentorear, gobierno de datos, final de carrera. | ⏳ |

## Estructura

```
index.html
css/style.css
assets/               ícono y fuentes incluidas (licencia OFL)
electron/main.js      proceso principal de escritorio: ventana, guardado en archivo, pantalla completa
electron/preload.js   puente seguro entre el juego y el sistema
docs/STEAM.md         guía para publicar en Steam
docs/CARRERA.md       análisis: qué hace cada rango en la vida real vs. los niveles del juego
.github/workflows/    compilación automática de ejecutables (Windows, Linux, macOS)
js/
  engine/formula.js       tokenizer, parser, evaluador y ~60 funciones (ES/EN)
  engine/sheet.js         modelo de hoja: celdas, recálculo, referencias circulares
  i18n/i18n.js            idiomas: AA.T('es', 'en'), documentación de funciones en inglés
  ui/grid.js              componente visual de planilla (selección, edición, relleno, F4, deshacer…)
  ui/menu.js, menu-bg.js  menú principal (ranuras, opciones) y su fondo animado
  ui/common.js            modales (con navegación por flechas) y avisos
  ui/creator.js           creador de personaje (aspecto, pelo, barba, ropa)
  game/storage.js         3 ranuras + configuración (archivos en escritorio, localStorage en web)
  game/settings.js        idioma, volúmenes y pantalla
  game/audio.js           música, efectos y voces sintetizados con Web Audio
  game/state.js           carrera, XP, personajes y partida
  game/validators.js      validadores de objetivos (celdas, columnas, $, respuestas)
  game/content/lib.js     generador aleatorio con semilla, datos bilingües, armado de misiones
  charts/chart-model.js   modelo de gráficos: campos, agregaciones, "Mostrarme" y validación
  charts/chart-builder.js constructor visual estilo Tableau (estantes, arrastrar y soltar, SVG)
  tools/pivot.js          tabla dinámica (modelo, validador y editor)
  tools/sql.js            motor SQL en memoria con errores explicados
  tools/sql-console.js    consola SQL (esquema, editor con colores, resultados)
  tools/dashboard.js      dashboards (KPIs, gráficos, filtro global) y sus validadores
  tools/report.js         armado de informes y resúmenes ejecutivos
  game/workspace.js       arma el "espacio de trabajo" de cada misión (hojas + herramientas) y el estado que validan los objetivos
  game/content/mod1-19.js plantillas de misión de cada nivel (95 en total); del 7 en adelante cada archivo trae también su lección
  game/content/curriculum.js  niveles, etapas, reglas de XP, lecciones de Leo y páginas de la libreta
  game/office.js          oficina 2D en canvas (mapa, colisiones, interacción)
  game/sprites.js         personajes pixel-art dibujados por código
  game/dialog.js          diálogos palabra por palabra con sonido y opciones
  game/story.js           historia y líneas de cada personaje
  game/screens.js         bandeja, pantalla de misión, libreta y plan de carrera
  main.js                 arranque y navegación entre pantallas
tests/
  engine.test.js        tests del motor de fórmulas
  missions.test.js      resuelve las 95 plantillas (tamaños, semillas, idiomas) y prueba errores típicos
  tools.test.js         tabla dinámica, SQL (resultados y mensajes de error), dashboards e informes
  chart.test.js         modelo de gráficos (agregaciones, color, filtros, Mostrarme)
  progression.test.js   economía de XP: cada ascenso pide la etapa completa + 3 o 4 prácticas; repetir no permite saltear rangos
```

## Tests

```bash
npm test
```

## Agregar una misión

Cada misión es una **plantilla** (ver `js/game/content/mod1.js`): una función que recibe un generador
aleatorio con semilla y el tamaño de tabla, y devuelve el email, los datos, los rangos bloqueados/a
completar, los objetivos (`check(S)` sobre la hoja o `answer(texto)` para preguntas) y una **solución de
referencia**. Los tests resuelven cada plantilla con su solución en varios tamaños, semillas e idiomas.
Para sumarla a un nivel, agregá su id en `templates` dentro de `js/game/content/curriculum.js`.
