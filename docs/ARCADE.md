# Modo ARCADE: reglas y balance

## Reglas

- **Reloj único (supervivencia).** Cada pedido llega con su **plazo**. El plazo es proporcional al esfuerzo
  estimado para resolverlo, así que un pedido de Senior trae más tiempo que uno de Junior. Lo que te sobra queda de
  **reserva**, pero al llegar el pedido siguiente se arrastran como mucho **2:00**. La partida arranca con 1:00 de
  reserva más el plazo del primer pedido.
- **Penalizaciones:** respuesta incorrecta −12 s, entregar incompleto −20 s y saltear −45 s. Saltear además
  descuenta lo que quedaba del plazo de ese pedido; si no, saltear daría tiempo gratis. Las penalizaciones crecen
  un 25 % por oleada.
- **Oleadas cada 3 misiones.** En cada oleada:
  - el plazo pasa de ×1.5 a ×1.32, ×1.14… del esfuerzo, con un mínimo de ×0.35;
  - el reloj corre un 10 % más rápido;
  - las misiones salen de niveles más avanzados del rango, con tablas grandes desde la oleada 4;
  - la música se acelera.
- **Ranking:** gana quien resuelve **más misiones**. A igual cantidad, gana quien lo hizo en **menos tiempo total**.
  Se guardan las 5 mejores partidas de cada rango, con el ritmo (misiones por minuto) y los puntos como dato
  informativo.

### Esfuerzo estimado de un pedido

Es lo que tardaría un jugador promedio, en segundos (`effort()` en `js/game/arcade.js`):

```
lectura (30 s; 40 s si usa otra herramienta)
+ cada entregable × (40 s en planilla | 55 s en tabla dinámica/gráfico/SQL/dashboard/informe)
                  × dificultad de la etapa (1 · 1.15 · 1.3 · 1.45) × (1 + filas/400)
+ cada pregunta × 25 s × (1 + filas/150)
+ cada opción múltiple × 20 s
```

## Logros y recompensas (v0.8)

Cada logro desbloquea un objeto decorativo para la oficina. Se pone o se saca desde el **cofre** que está al lado
de la máquina ARCADE. La libreta (pestaña 🏆 Logros) muestra cada logro con su objetivo, el progreso y una vista
previa animada de la recompensa.

| Logro | Objetivo | Recompensa |
|-------|----------|------------|
| 🎮 Primer pedido | 1 misión en una partida | 🌳 Ficus gigante (al lado del pizarrón) |
| 🔥 Calentando motores | 3 misiones en una partida | 🧶 Alfombra persa (mesa de reuniones) |
| ✋ Media docena | 6 misiones en una partida | ☕ Cafetera espresso (reemplaza la de la cocina) |
| 📦 Docena | 12 misiones en una partida | 🖥️ PC gamer (tu escritorio) |
| 🌊 Surfeando datos | llegar a la oleada 3 | 💡 Guirnalda de luces (pared de la oficina y la cocina) |
| 🌪️ Ojo de la tormenta | llegar a la oleada 5 | 🐱 Michi, el gato (pasea, duerme y se deja acariciar) |
| 👑 Leyenda del ARCADE | llegar a la oleada 7 | 🖼️ Cuadro «Analista del mes» (oficina de Marta) |
| ⏱️ Contrarreloj | 3 misiones en menos de 8:00 de partida | 🪑 Silla gamer (reemplaza tu silla) |
| ⚡ Velocista | 6 misiones en menos de 18:00 de partida | 🎵 Tocadiscos (living) |
| 🎯 Mano firme | 5 misiones seguidas sin penalizaciones | 🐠 Pecera (living) |
| 🧊 Sangre fría | entregar con menos de 15 s en el reloj | 🪴 Bonsái (mesa ratona) |
| 🏃 Maratón | 25 misiones sumando partidas | 🐶 Firulais, el perro (pasea y se deja acariciar) |
| 🪙 Cliente fiel | jugar 10 partidas | 🍩 Caja de donas (mesada de la cocina) |
| 🧭 Todoterreno | 3 misiones en una partida de cada rango | 🟣 Neón «DATA» (pared de la oficina) |
| 🏆 Senior bajo presión | 9 misiones en una partida de rango Senior | 🏆 Trofeo dorado (tu escritorio) |

Según la simulación de abajo:

- un jugador promedio consigue los de 3 y 6 misiones y la oleada 3–4;
- el experto llega a la docena y a la oleada 5–6;
- la oleada 7 queda como desafío para pocos;
- los logros que se suman entre partidas (Maratón, Cliente fiel) premian volver a jugar.

## Simulación

Para medir el balance, `npm run balance` corre `tests/arcade-balance.js`, que juega cientos de partidas por rango
con cuatro tipos de jugador y las mismas reglas del juego:

| Jugador  | Tarda (× esfuerzo, ±25 %) | Se equivoca en cada pregunta | Entrega incompleto |
|----------|---------------------------|------------------------------|--------------------|
| Experto  | 0.5                       | 5 %                          | 3 %                |
| Bueno    | 0.75                      | 10 %                         | 6 %                |
| Promedio | 1.0                       | 18 %                         | 10 %               |
| Novato   | 1.4                       | 30 %                         | 18 %               |

### Antes (v0.7.1): +85 s fijos por misión, sin importar su tamaño

| Rango       | Experto           | Bueno             | Promedio          | Novato |
|-------------|-------------------|-------------------|-------------------|--------|
| Junior      | 6 misiones, ola 3 | 2 misiones, ola 1 | 1 misión          | 0      |
| Semi-Senior | 3 misiones, ola 2 | 1 misión          | 1 misión          | 0      |
| Senior      | 1 misión          | 0                 | 0                 | 0      |

Era muy difícil y además desparejo. Los pedidos de Senior llevan el doble que los de Junior pero daban el mismo
tiempo, así que en Senior casi nadie pasaba de la primera misión.

### Ahora (v0.7.2): mediana de 600 partidas, con el rango p10–p90 entre paréntesis

| Rango       | Jugador  | Misiones     | Oleada | Duración |
|-------------|----------|--------------|--------|----------|
| Junior      | Experto  | 17 (16–18)   | 6      | 35 min   |
| Junior      | Bueno    | 12 (11–14)   | 5      | 36 min   |
| Junior      | Promedio | 9 (7–10)     | 4      | 33 min   |
| Junior      | Novato   | 3 (0–5)      | 2      | 16 min   |
| Semi-Senior | Experto  | 16 (15–18)   | 6      | 54 min   |
| Semi-Senior | Bueno    | 12 (10–13)   | 5      | 54 min   |
| Semi-Senior | Promedio | 8 (6–9)      | 3      | 44 min   |
| Semi-Senior | Novato   | 3 (0–4)      | 2      | 21 min   |
| Senior      | Experto  | 17 (15–18)   | 6      | 54 min   |
| Senior      | Bueno    | 12 (10–14)   | 5      | 61 min   |
| Senior      | Promedio | 9 (7–10)     | 4      | 62 min   |
| Senior      | Novato   | 3 (0–5)      | 2      | 36 min   |

- **Los tres rangos rinden igual** para el mismo tipo de jugador (±1 misión). Subir de rango cambia las
  herramientas, no la dificultad del juego.
- **Cada nivel de jugador llega a un lugar distinto:**
  - el novato juega 2 o 3 pedidos;
  - el promedio llega a la oleada 3 o 4;
  - el bueno, a la 5;
  - el experto, a la 6.
  Hay techo: la reserva tiene tope y los plazos bajan del ×0.5 en la oleada 7, así que nadie juega para siempre.
- **La duración depende del rango.** Los pedidos de Semi-Senior y Senior son más largos (tablas grandes, varios
  entregables), así que una partida dura más aunque se resuelva la misma cantidad de misiones.

### Prueba en el navegador

Se jugó el ARCADE real en Chromium, adelantando el reloj y resolviendo cada pedido después de «esfuerzo × k»
segundos. También se probaron una vez saltear y responder mal. Los resultados coinciden con la simulación:

| Rango       | Jugador        | Resultado                    |
|-------------|----------------|------------------------------|
| Junior      | promedio (k=1) | 9 misiones, oleada 4         |
| Junior      | experto (k=0.5)| 16 misiones, oleada 6        |
| Semi-Senior | promedio (k=1) | 6 misiones, oleada 3         |
| Senior      | promedio (k=1) | 9 misiones, oleada 4         |
| Senior      | experto (k=0.5)| 17 misiones, oleada 6        |

## Límites

- Los tiempos humanos son una **estimación**: nadie jugó todavía el ARCADE con cronómetro. Si con partidas reales
  el ARCADE queda fácil o difícil en general, el ajuste está en un solo lugar: `budgetFor()` (×1.5 inicial, −0.18
  por oleada) o el multiplicador de `effort()`. Después hay que correr `npm run balance` para ver el efecto.
- Algunos pedidos de Semi-Senior en las oleadas 5–7 (informes con tablas grandes) se estiman en más de 7 minutos.
  Si se sienten muy largos para un ARCADE, se puede limitar el tamaño "large" a las etapas Pasante y Junior.
