# Analyst Adventure

Juego 2D para aprender a usar planillas de cálculo (Excel / Google Sheets) haciendo el trabajo de un
**analista de datos**: empezás como pasante en *Grupo Cóndor* y, resolviendo pedidos reales de distintas
áreas (Ventas, RR.HH., Marketing, Logística…), vas subiendo hasta Senior.

Inspirado en *Database Detective: Minor Crimes Division*, pero con planillas en lugar de SQL.

## Cómo jugar

No requiere instalación ni build: abrí `index.html` en el navegador.

Si preferís servirlo localmente:

```bash
npx serve .        # o: python3 -m http.server
```

- **Oficina**: caminá con `WASD` / flechas e interactuá con `E` / `Espacio` (o con clic).
  - Tu **computadora** → bandeja de entrada con los pedidos (misiones).
  - **Marta** (jefa) → historia y ascensos.
  - **Leo** (analista senior, junto al café) → manual de funciones, consejos y atajos.
  - **Pizarra** → plan de carrera.
- **Planilla**: funciona como Excel/Sheets.
  - Fórmulas con `=`, funciones en **español o inglés** (`SUMA`/`SUM`), argumentos separados con `;` o `,`.
  - Clic en celdas mientras escribís una fórmula para insertar referencias; `F4` agrega `$`.
  - Controlador de relleno (arrastrar el cuadradito), `Ctrl+C/V`, `Ctrl+D`, `Ctrl+Z/Y`, `Ctrl+flechas`.
  - Los objetivos se validan solos; las preguntas ❓ se responden escribiendo (estilo detective).
- El progreso se guarda automáticamente en el navegador (`localStorage`).

## Etapas de desarrollo

| Etapa | Contenido | Estado |
|------|-----------|--------|
| **1** | Motor de planilla, oficina 2D, diálogos, bandeja de entrada, guardado. Misiones: fórmulas y relleno, `SUMA/PROMEDIO/MAX/MIN/CONTAR`, `SI`, limpieza de texto (`ESPACIOS/NOMPROPIO/MINUSC`), `CONTAR.SI/SUMAR.SI/CONTAR.SI.CONJUNTO` y referencias absolutas. Ascenso a Analista Junior. | ✅ |
| **2** | Limpieza avanzada: números guardados como texto, duplicados, ordenar y filtrar, buscar y reemplazar. Cruce de tablas con `BUSCARV` / `BUSCARX` / `INDICE`+`COINCIDIR`. Varias hojas por libro. | ⏳ |
| **3** | Tablas dinámicas y **constructor de dashboards** (gráficos de barras/líneas/torta, KPIs). | ⏳ |
| **4** | Casos Senior estilo detective (fraude en viáticos, anomalías), evaluación de dashboards, final de carrera. | ⏳ |

## Estructura

```
index.html
css/style.css
js/
  engine/formula.js     tokenizer, parser, evaluador y ~60 funciones (ES/EN)
  engine/sheet.js       modelo de hoja: celdas, recálculo, referencias circulares
  ui/grid.js            componente visual de planilla (selección, edición, relleno, F4, deshacer…)
  ui/common.js          modales y avisos
  game/state.js         carrera, XP, personajes y guardado
  game/validators.js    validadores de objetivos (celdas, columnas, respuestas)
  game/missions/        registro de misiones y misiones por etapa
  game/office.js        oficina 2D en canvas (mapa, colisiones, interacción)
  game/sprites.js       personajes pixel-art dibujados por código
  game/dialog.js        diálogos con máquina de escribir y opciones
  game/story.js         historia y líneas de cada personaje
  game/screens.js       bandeja de entrada, pantalla de misión, manual y carrera
  main.js               arranque y navegación entre pantallas
tests/
  engine.test.js        tests del motor de fórmulas
  missions.test.js      resuelve cada misión y verifica soluciones correctas e incorrectas
```

## Tests

```bash
npm test
```

## Agregar una misión

Las misiones son objetos de datos (ver el comentario en `js/game/missions/registry.js` y los ejemplos en
`js/game/missions/stage1.js`): un email, un dataset, rangos bloqueados/a completar y una lista de objetivos.
Cada objetivo tiene un `check(S)` (validación sobre la hoja) o un `answer(texto)` (pregunta abierta).
