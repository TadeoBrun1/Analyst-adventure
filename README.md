# Analyst Adventure

Juego 2D para aprender a usar planillas de cálculo (Excel / Google Sheets) haciendo el trabajo de un
**analista de datos**: empezás como pasante en *Grupo Cóndor* y, resolviendo pedidos reales de distintas
áreas (Ventas, RR.HH., Marketing, Logística…), vas subiendo hasta Senior.

Inspirado en *Database Detective: Minor Crimes Division*, pero con planillas en lugar de SQL.

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

- **Menú principal**: *Jugar* (3 ranuras de partida), *Opciones* (volumen de música, efectos y voces;
  ventana o pantalla completa; tamaño de ventana; idioma **español / inglés**) y *Salir*.
- **Oficina**: caminá con `WASD` / flechas e interactuá con `E` / `Espacio` (o con clic). `Esc` abre la pausa.
  - **Leo** (junto al café) explica cada nivel antes de empezarlo; lo que enseña queda en tu **📒 libreta**.
  - Tu **computadora** → bandeja de entrada con las tareas de cada nivel y la **práctica libre**.
  - **Marta** (jefa) → historia y ascensos. **Pizarra** → plan de carrera.
- **Progresión**: 5 niveles por etapa. Cada nivel tiene 5 tareas obligatorias; al terminarlas se abre la
  práctica libre (casos generados al azar con tablas medianas o grandes) para sumar experiencia. Algunos
  niveles piden un rango mínimo, así que la práctica es parte del camino.
- **Planilla**: funciona como Excel/Sheets.
  - Fórmulas con `=`, funciones en **español o inglés** (`SUMA`/`SUM`), argumentos separados con `;` o `,`.
  - Clic en celdas mientras escribís una fórmula para insertar referencias; `F4` agrega `$`.
  - Controlador de relleno (arrastrar el cuadradito), `Ctrl+C/V`, `Ctrl+D`, `Ctrl+R`, `Ctrl+Z/Y`, `Ctrl+flechas`.
  - Los objetivos se validan solos; las preguntas ❓ se responden escribiendo (estilo detective).
- **Sonido**: todo sintetizado en el momento (música chiptune, efectos y un "bip" por palabra en los diálogos).

## Etapas de desarrollo

| Etapa | Contenido | Estado |
|------|-----------|--------|
| **1** | Motor de planilla, oficina 2D, menú con 3 ranuras, opciones (sonido, pantalla, idioma), audio, libreta. 5 niveles: fórmulas básicas · funciones de resumen · SI/Y/O · limpieza de texto · CONTAR.SI/SUMAR.SI y `$`. 25 tareas + práctica aleatoria infinita. | ✅ |
| **2** | Limpieza avanzada: números guardados como texto, duplicados, ordenar y filtrar, buscar y reemplazar. Cruce de tablas con `BUSCARV` / `BUSCARX` / `INDICE`+`COINCIDIR`. Varias hojas por libro. | ⏳ |
| **3** | Tablas dinámicas y **constructor de dashboards** (gráficos de barras/líneas/torta, KPIs). | ⏳ |
| **4** | Casos Senior estilo detective (fraude en viáticos, anomalías), evaluación de dashboards, final de carrera. | ⏳ |

## Estructura

```
index.html
css/style.css
assets/               ícono y fuentes incluidas (licencia OFL)
electron/main.js      proceso principal de escritorio: ventana, guardado en archivo, pantalla completa
electron/preload.js   puente seguro entre el juego y el sistema
docs/STEAM.md         guía para publicar en Steam
.github/workflows/    compilación automática de ejecutables (Windows, Linux, macOS)
js/
  engine/formula.js       tokenizer, parser, evaluador y ~60 funciones (ES/EN)
  engine/sheet.js         modelo de hoja: celdas, recálculo, referencias circulares
  i18n/i18n.js            idiomas: AA.T('es', 'en'), documentación de funciones en inglés
  ui/grid.js              componente visual de planilla (selección, edición, relleno, F4, deshacer…)
  ui/menu.js, menu-bg.js  menú principal (ranuras, opciones) y su fondo animado
  ui/common.js            modales y avisos
  game/storage.js         3 ranuras + configuración (archivos en escritorio, localStorage en web)
  game/settings.js        idioma, volúmenes y pantalla
  game/audio.js           música, efectos y voces sintetizados con Web Audio
  game/state.js           carrera, XP, personajes y partida
  game/validators.js      validadores de objetivos (celdas, columnas, $, respuestas)
  game/content/lib.js     generador aleatorio con semilla, datos bilingües, armado de misiones
  game/content/mod1-5.js  plantillas de misión de cada nivel (25 en total)
  game/content/curriculum.js  niveles, lecciones de Leo y páginas de la libreta
  game/office.js          oficina 2D en canvas (mapa, colisiones, interacción)
  game/sprites.js         personajes pixel-art dibujados por código
  game/dialog.js          diálogos palabra por palabra con sonido y opciones
  game/story.js           historia y líneas de cada personaje
  game/screens.js         bandeja, pantalla de misión, libreta y plan de carrera
  main.js                 arranque y navegación entre pantallas
tests/
  engine.test.js        tests del motor de fórmulas
  missions.test.js      resuelve las 25 plantillas (tamaños, semillas, idiomas) y prueba errores típicos
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
