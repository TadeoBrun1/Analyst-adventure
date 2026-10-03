# Carrera de un analista de datos: realidad vs. Analyst Adventure

Este documento compara lo que se espera de un analista de datos en cada rango (según ofertas laborales,
escaleras de carrera de empresas y guías de la industria) con lo que enseña el juego. Como el objetivo
del juego es **aprender**, el contenido de cada etapa tiene que coincidir con lo que se pide en el
trabajo real.

## 1. Qué se espera en cada rango

### Pasante / Entry level (antes de Junior)
- Excel/Sheets con soltura: fórmulas, funciones de resumen, `SI`, limpieza de texto, conteos condicionales.
- **Gráficos básicos**: elegir el tipo correcto (barras, líneas, torta) y que se entiendan. Las guías lo
  marcan como un requisito "no negociable" del primer puesto.
- Seguir pedidos concretos con supervisión.

### Analista Junior
- Excel avanzado: `BUSCARV` / `BUSCARX`, **tablas dinámicas**, validación de datos.
- Limpieza y control de calidad de datos antes de analizarlos.
- Reportes recurrentes y pedidos puntuales (*ad-hoc*) de otras áreas.
- **Mantiene** dashboards que armaron otros; SQL básico.
- Presenta resultados a su equipo o a un grupo chico (reportes simples, 1–2 gráficos).

### Analista Semi-Senior (Mid-level)
- Se hace cargo de un análisis **de punta a punta**: de la pregunta a la recomendación.
- **Construye dashboards desde cero** (varios gráficos, filtros, KPIs) en Tableau / Power BI / Looker.
- Estadística descriptiva e inferencial básica: explica **por qué** pasó algo, no solo qué pasó.
- *Storytelling* con datos para otras áreas; revisa el trabajo de juniors (por ejemplo, revisión de dashboards).

### Analista Senior
- **Define KPIs** y marcos de métricas junto al negocio.
- Diseña e interpreta experimentos (pruebas A/B).
- Prepara **resúmenes ejecutivos** listos para decidir: qué pasó, por qué y qué hacer.
- Toma decisiones con datos incompletos o desprolijos; mentorea a juniors.

### Lead de Datos
- Estrategia de analítica del área y **priorización** de pedidos (hoja de ruta).
- Encuadra problemas con los stakeholders antes de analizarlos.
- Revisa la calidad del trabajo del equipo, mentorea y forma.
- Gobierno de datos: definiciones únicas, fuentes confiables, documentación.

### ¿Quién hace gráficos y presentaciones?
**Todos los rangos**, pero con distinto alcance:

| Rango | Gráficos | Presentaciones |
|------|----------|----------------|
| Pasante | Gráficos simples bien elegidos | Mostrar un resultado con un título claro |
| Junior | Gráficos en reportes; mantiene dashboards existentes | Reporte para su equipo |
| Semi-Senior | Dashboards desde cero, interactivos | Historia con datos para otra área |
| Senior | Elige qué medir (KPIs) | Resumen ejecutivo para gerencia |
| Lead | Define estándares de visualización | Estrategia y prioridades para la dirección |

## 2. Cómo estaba el juego (v0.2) y qué cambió (v0.3–v0.4)

| Problema en v0.2 | Cambio en v0.3 |
|---|---|
| Se llegaba a **Junior con 800 XP**, a mitad de la etapa, sin saber gráficos. | Junior pide **2200 XP + completar toda la etapa Pasante** (niveles 1 a 6). |
| No había gráficos, aunque son un requisito de entrada. | **Nivel 6 · Gráficos** con un constructor estilo Tableau (ver abajo). |
| La práctica libre daba XP infinita: con muchas repeticiones se podía llegar a Senior sin aprender lo de Junior. | Solo los **primeros 4 casos de práctica de cada nivel** suman XP. Los niveles de una etapa ya superada dan **0 XP**. Un rango solo se alcanza con la etapa anterior completa, así que ningún farmeo saltea contenido. |
| El rango podía cambiar si cambiaban las reglas. | El rango alcanzado queda guardado y no baja. |
| El plan de carrera solo mostraba XP. | Muestra qué hace cada rango en la vida real, qué falta para ascender (niveles + XP) y la hoja de ruta. |

### Economía de XP (etapa Pasante)

| Concepto | Valor |
|---|---|
| Niveles 1–6, 5 tareas cada uno (40/50/60/70/80/90 XP por tarea) | 1950 XP |
| Umbral de Analista Junior | 2200 XP |
| Lo que falta, cubierto con práctica | 250 XP ≈ **3 casos** (4 como máximo) |
| Práctica que suma XP | primeros 4 casos por nivel (tabla grande = ×1,6) |
| Después de eso / de una etapa anterior | 0 XP (se puede seguir practicando) |

### Economía de XP de todas las etapas (v0.4)

Misma regla en cada ascenso: **XP de las tareas obligatorias de la etapa + 3 o 4 casos de práctica**.

| Ascenso a | Tareas de la etapa | XP por tarea | Umbral |
|---|---|---|---|
| Junior | Niveles 1–6 (30 tareas) | 40 → 90 | 2200 |
| Semi-Senior | Niveles 7–11 (25 tareas) | 100 → 140 | 5600 |
| Senior | Niveles 12–15 (20 tareas) | 150 → 180 | 9450 |
| Lead | Niveles 16–19 (20 tareas) | 190 → 220 | 14200 (la etapa Lead todavía no existe) |

Además, un rango solo se alcanza si **su etapa existe en el juego**: hoy el techo es Senior, sin importar
cuánta XP se acumule (lo verifica `tests/progression.test.js`, junto con el "3 o 4 prácticas" de cada ascenso).

## 3. Constructor de gráficos (Nivel 6)

Pensado como un "Tableau simplificado", para que después pasar a Tableau, Power BI o Looker Studio sea
directo. Usa los mismos conceptos y nombres:

- **Dimensiones** (Abc, 📅) y **medidas** (#), incluida *Cantidad de registros* (el *Recuento* de Tableau).
- Estantes **Columnas**, **Filas**, **Color** y **Filtros**; arrastrar y soltar o clic.
- **Mostrarme** (*Show Me*): recomienda el tipo de gráfico según los campos (barras, líneas, torta, dispersión).
- **Agregaciones**: Suma, Promedio, Recuento, Mín, Máx.
- Orden, etiquetas y un **título que cuenta la conclusión** (primer paso hacia las presentaciones).

Las 5 tareas del nivel: barras por región ordenadas, tendencia mensual con líneas, torta de canales,
dispersión precio–unidades y barras apiladas por estado con filtro.

## 4. Qué enseña cada etapa en la v0.4

Las herramientas son **versiones simplificadas de las reales**, con los mismos nombres y conceptos, para que
el salto a Excel, Google Sheets, Tableau, Power BI o una base de datos sea directo.

### Junior (niveles 7–11)

| Nivel | Qué se practica | Herramienta |
|---|---|---|
| 7 · Cruzar tablas | Varias hojas, `BUSCARV`, `BUSCARX`, #N/A y `SI.ERROR`, tramos con coincidencia aproximada | Planilla con varias hojas |
| 8 · Calidad de datos | Duplicados (`CONTAR.SI` con rango que crece), vacíos y % de completitud, números guardados como texto, reglas de validez, informe de calidad | Planilla |
| 9 · Tablas dinámicas | Filas, Columnas, Valores (Suma, Recuento, Promedio), Filtros, % del total | Tabla dinámica |
| 10 · SQL básico | `SELECT`, `WHERE`, `ORDER BY` + `LIMIT`, funciones de resumen, `GROUP BY` + `HAVING`, `JOIN` | Consola SQL |
| 11 · Reportes y dashboards existentes | Arreglar agregaciones y filtros viejos de un dashboard ajeno, responder pedidos puntuales con el filtro global, agregar lo que pide un área, contestar un pedido en dos líneas | Dashboard + tabla dinámica |

**Presentación del Junior:** responder un pedido puntual con "número + comparación" y mantener dashboards.

### Semi-Senior (niveles 12–15)

| Nivel | Qué se practica | Herramienta |
|---|---|---|
| 12 · Estadística | Promedio vs mediana, desvío estándar, atípicos, correlación (y un tercer factor), descomponer una caída por segmento | Planilla |
| 13 · Dashboards desde cero | Título, KPIs, un gráfico por pregunta, filtro global, 4 a 6 elementos | Dashboard |
| 14 · Análisis de punta a punta | Cruzar hojas, calcular tasas, encontrar dónde se concentra el problema y armar el informe (titular, evidencia, gráfico, recomendación) | Planilla + informe |
| 15 · Revisar a un junior | Marcar errores (rangos corridos, $ faltantes, números a mano, referencias equivocadas), arreglarlos y dar feedback útil, también en SQL y dashboards | Planilla con 🚩, SQL, dashboard |

**Presentación del Semi-Senior:** historia con datos para otra área (storytelling).

### Senior (niveles 16–19)

| Nivel | Qué se practica | Herramienta |
|---|---|---|
| 16 · Definir KPIs | Conversión, churn, OTIF, NPS, metas y semáforos, indicadores adelantados vs atrasados, métricas de vanidad | Planilla + preguntas |
| 17 · Pruebas A/B | Conversión, lift, puntaje z y significancia, métrica de resguardo, segmentos, tamaño de muestra y reglas del experimento | Planilla con varias hojas |
| 18 · Datos incompletos | Vacío ≠ cero, estimar y marcar, escenarios pesimista/central/optimista, sesgo de respuesta (`SUMAPRODUCTO`), decidir por etapas | Planilla |
| 19 · Resumen ejecutivo | Qué pasó / por qué / qué hacer + gráfico de respaldo, sin jerga ni metodología primero | Planilla + resumen ejecutivo |

**Presentación del Senior:** resumen ejecutivo para Gerencia General.

### Presentar y ayudar a otros (v0.6)

- **Eventos especiales (todas las etapas, desde el Nivel 2):** al entregar un informe con resultados en una tabla,
  a veces el equipo pide presentarlos. Las preguntas salen de los datos reales de esa planilla (mayor, menor,
  total, cuántos quedaron en cada categoría). Practica lo que se pide en cualquier rango: **poder explicar lo que
  entregás**. Cada respuesta correcta suma un 5 % de la XP de la tarea (como máximo 15 %): no cambia cuánto hay
  que practicar para ascender.
- **Favores de Nico (desde Semi-Senior):** limpieza de datos, informes y revisión del trabajo de un junior, con
  plantillas de niveles cuya lección ya diste. Un favor cada 2 tareas entregadas, 90 XP cada uno.

### Guiado al aprender, sin guía al practicar (v0.7)

- Las **5 tareas obligatorias** de cada nivel siguen guiadas paso a paso: sirven para aprender la herramienta.
- La **práctica libre**, los **favores** y el **ARCADE** muestran solo el pedido: qué hay que entregar y dónde, sin
  nombres de funciones ni fórmulas de ejemplo. Es lo que pasa en un trabajo real: hay que decidir cómo resolverlo.
- El **ARCADE** entrena hacer el trabajo **bajo presión de tiempo**. Cada rango usa solo las herramientas de su
  etapa (y de la anterior) que ya aprendiste, y la dificultad sube cada 3 misiones. No da XP: es para medirse.

### Próximo: Lead

Priorizar una bandeja de pedidos, encuadrar el problema con el área, definir métricas únicas (gobierno de
datos), mentorear al equipo y el final de carrera.

## Fuentes

- [GitLab Handbook – Data Analyst job family](https://handbook.gitlab.com/job-families/marketing/enterprise-data/data-analyst/)
- [GitLab – Data Analyst job description library](https://handbook.gitlab.com/job-description-library/marketing/enterprise-data/data-analyst/)
- [Pecan – Data analyst job titles and skill sets](https://www.pecan.ai/blog/data-analyst-job-titles-skill-sets/)
- [Pecan – How to become a senior data analyst](https://www.pecan.ai/blog/how-to-become-a-senior-data-analyst/)
- [CareerFoundry – Data analyst job descriptions](https://careerfoundry.com/en/blog/data-analytics/data-analyst-job-descriptions/)
- [Medium – Entry vs mid vs senior data analyst skills](https://medium.com/@e.ghelbur/entry-level-vs-mid-level-vs-senior-level-data-analyst-skills-830849049a75)
- [Careery – Data analyst career path](https://careery.pro/blog/data-analyst-careers/data-analyst-career-path)
- [Careery – Entry-level data analyst guide](https://careery.pro/blog/data-analyst-careers/entry-level-data-analyst-guide)
- [Teal – Entry level data analyst career path](https://www.tealhq.com/career-paths/entry-level-data-analyst)
- [Alooba – Senior data analyst](https://www.alooba.com/roles/senior-data-analyst/)
- [Alooba – Lead data analyst](https://www.alooba.com/roles/lead-data-analyst/)
- [DevOpsSchool – Senior data analyst role blueprint](https://www.devopsschool.com/blog/senior-data-analyst-role-blueprint-responsibilities-skills-kpis-and-career-path/)
- [DevOpsSchool – Lead data analyst role blueprint](https://www.devopsschool.com/blog/lead-data-analyst-role-blueprint-responsibilities-skills-kpis-and-career-path/)
- [Simplilearn – Data analyst career roadmap](https://www.simplilearn.com/career-roadmap/data-analyst)
- [Tableau Help – Build a bar chart](https://help.tableau.com/current/pro/desktop/en-us/buildexamples_bar.htm)
- [DataCamp – Tableau cheat sheet](https://www.datacamp.com/cheat-sheet/tableau-cheat-sheet)
