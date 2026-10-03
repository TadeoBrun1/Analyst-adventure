/*
 * Analyst Adventure — Decoración de la oficina (recompensas de los logros del ARCADE).
 * Cada objeto se dibuja con el mismo código en la oficina y en las vistas previas (libreta y cofre).
 * Se activan o desactivan desde el cofre que está al lado de la máquina ARCADE.
 *
 * Coordenadas: cada objeto dibuja relativo a su "ancla" (0, 0). Para los objetos fijos el ancla es la
 * esquina superior izquierda de su tile; para las mascotas y la silla, el centro de los pies.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const T = 32;

  const rect = (ctx) => (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  const circle = (ctx, x, y, r, c) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  const shadow = (ctx, x, y, rx, ry) => {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  const hue = (t, k) => `hsl(${Math.floor((t * 90 + k * 50) % 360)}, 90%, 60%)`;

  // --- Alfombra persa (se dibuja entera; la oficina la recorta tile por tile)
  function paintRug(ctx, w, h) {
    const R = rect(ctx);
    R(0, 0, w, h, '#8c2f39');
    // flecos
    for (let y = 4; y < h - 4; y += 4) {
      R(-4, y, 4, 2, '#f1e3c6');
      R(w, y, 4, 2, '#f1e3c6');
    }
    R(0, 0, w, 6, '#e9c46a');
    R(0, h - 6, w, 6, '#e9c46a');
    R(0, 0, 6, h, '#e9c46a');
    R(w - 6, 0, 6, h, '#e9c46a');
    R(8, 8, w - 16, 4, '#264653');
    R(8, h - 12, w - 16, 4, '#264653');
    R(8, 8, 4, h - 16, '#264653');
    R(w - 12, 8, 4, h - 16, '#264653');
    // motivos del borde
    for (let x = 18; x < w - 18; x += 12) {
      R(x, 2, 4, 2, '#8c2f39');
      R(x, h - 4, 4, 2, '#8c2f39');
    }
    // trama de puntitos
    for (let y = 18; y < h - 16; y += 10) for (let x = 18 + ((y / 10) % 2) * 5; x < w - 16; x += 10) R(x, y, 2, 2, '#b04a52');
    // medallón central
    const cx = w / 2;
    const cy = h / 2;
    ctx.fillStyle = '#264653';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 26);
    ctx.lineTo(cx + 34, cy);
    ctx.lineTo(cx, cy + 26);
    ctx.lineTo(cx - 34, cy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e9c46a';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 16);
    ctx.lineTo(cx + 21, cy);
    ctx.lineTo(cx, cy + 16);
    ctx.lineTo(cx - 21, cy);
    ctx.closePath();
    ctx.fill();
    circle(ctx, cx, cy, 6, '#8c2f39');
    // esquinas
    for (const [x, y] of [[14, 14], [w - 22, 14], [14, h - 22], [w - 22, h - 22]]) {
      R(x, y, 8, 8, '#e9c46a');
      R(x + 2, y + 2, 4, 4, '#264653');
    }
  }

  // --- Mascotas: dir 'left'|'right'|'up'|'down', frame 0..1, state 'walk'|'idle'|'sleep'
  function paintCat(ctx, t, o) {
    const R = rect(ctx);
    const st = (o && o.state) || 'idle';
    const dir = (o && o.dir) || 'right';
    const fr = (o && o.frame) || 0;
    const orange = '#f2994a';
    const dark = '#c26a1f';
    shadow(ctx, 0, 0, 9, 2.5);
    if (st === 'sleep') {
      // hecho un bollito
      circle(ctx, 0, -5, 7, orange);
      circle(ctx, 4, -6, 4, orange);
      R(-6, -6, 3, 2, dark);
      R(-2, -10, 3, 2, dark);
      R(-7, -3, 12, 2, dark);
      R(3, -9, 2, 2, '#ffd3b0');
      const z = (t * 0.8) % 1;
      ctx.fillStyle = `rgba(255,255,255,${1 - z})`;
      ctx.font = 'bold 6px "Inter", sans-serif';
      ctx.fillText('z', 6 + z * 4, -12 - z * 8);
      return;
    }
    ctx.save();
    if (dir === 'left') ctx.scale(-1, 1);
    const leg = st === 'walk' ? (fr ? 1 : -1) : 0;
    // cola
    const sw = Math.sin(t * (st === 'walk' ? 8 : 3)) * 2;
    R(-10, -10 + sw * 0.5, 2, 6, orange);
    R(-11, -13 + sw, 2, 4, orange);
    // cuerpo
    R(-7, -9, 13, 6, orange);
    R(-5, -9, 2, 6, dark);
    R(-1, -9, 2, 6, dark);
    R(-6, -4, 11, 1, '#ffd3b0');
    // patas
    R(-6 + leg, -3, 2, 3, orange);
    R(3 - leg, -3, 2, 3, orange);
    // cabeza
    R(4, -13, 7, 6, orange);
    R(4, -15, 2, 2, orange);
    R(9, -15, 2, 2, orange);
    R(5, -14, 1, 1, '#ff9fb2');
    R(9, -14, 1, 1, '#ff9fb2');
    if (dir === 'up') {
      R(4, -13, 7, 6, dark);
    } else {
      R(6, -11, 1, 1, '#1b1d2b');
      R(9, -11, 1, 1, '#1b1d2b');
      R(8, -9, 1, 1, '#ff6b81');
    }
    ctx.restore();
  }

  function paintDog(ctx, t, o) {
    const R = rect(ctx);
    const st = (o && o.state) || 'idle';
    const dir = (o && o.dir) || 'right';
    const fr = (o && o.frame) || 0;
    const fur = '#d9a066';
    const dark = '#8a5a2b';
    shadow(ctx, 0, 0, 11, 3);
    if (st === 'sleep') {
      R(-10, -8, 18, 7, fur);
      R(4, -11, 8, 8, fur);
      R(4, -11, 3, 6, dark);
      R(9, -8, 2, 1, '#1b1d2b');
      R(-12, -5, 4, 2, fur);
      const z = (t * 0.7) % 1;
      ctx.fillStyle = `rgba(255,255,255,${1 - z})`;
      ctx.font = 'bold 6px "Inter", sans-serif';
      ctx.fillText('z', 10 + z * 4, -14 - z * 8);
      return;
    }
    ctx.save();
    if (dir === 'left') ctx.scale(-1, 1);
    const leg = st === 'walk' ? (fr ? 1 : -1) : 0;
    // cola que se mueve (mucho si está contento)
    const wag = Math.sin(t * (o && o.happy ? 22 : st === 'walk' ? 10 : 5)) * 3;
    ctx.fillStyle = fur;
    ctx.save();
    ctx.translate(-10, -10);
    ctx.rotate(-0.6 + wag * 0.12);
    ctx.fillRect(-1, -7, 3, 8);
    ctx.restore();
    // cuerpo
    R(-10, -12, 18, 8, fur);
    R(-10, -12, 18, 2, '#e8b884');
    R(-4, -12, 6, 4, dark);
    // patas
    R(-9 + leg, -4, 3, 4, fur);
    R(-4 - leg, -4, 3, 4, fur);
    R(2 + leg, -4, 3, 4, fur);
    R(6 - leg, -4, 3, 4, fur);
    // cabeza
    R(6, -18, 9, 9, fur);
    R(13, -14, 4, 4, '#e8b884');
    R(16, -14, 2, 2, '#1b1d2b');
    R(6, -18, 3, 8, dark); // oreja caída
    if (dir !== 'up') R(11, -16, 2, 2, '#1b1d2b');
    if (o && o.happy) R(14, -10, 2, 3, '#ff6b81'); // lengua
    // collar
    R(7, -10, 7, 2, '#e5484d');
    R(10, -9, 2, 2, '#ffd23f');
    ctx.restore();
  }

  // --- Silla gamer (origen: centro de la base, como la silla común)
  function paintGamerChair(ctx, t, o) {
    const R = rect(ctx);
    shadow(ctx, 0, -1, 11, 3);
    R(-10, -3, 5, 2, '#1b1d2b');
    R(5, -3, 5, 2, '#1b1d2b');
    R(-2, -3, 4, 2, '#1b1d2b');
    R(-1, -8, 2, 6, '#3a3d4a');
    // asiento
    R(-10, -18, 20, 11, '#1f2129');
    R(-10, -18, 20, 2, '#e5484d');
    R(-12, -15, 3, 6, '#2b2e3a');
    R(9, -15, 3, 6, '#2b2e3a');
    if (o && o.sit) o.sit();
    // respaldo alto con franjas rojas y almohadón
    R(-9, -26, 18, 23, '#1f2129');
    R(-9, -26, 18, 2, '#3a3d4a');
    R(-6, -24, 3, 20, '#e5484d');
    R(3, -24, 3, 20, '#e5484d');
    R(-4, -25, 8, 4, '#e5484d');
    R(-3, -24, 6, 2, '#ff8a8a');
    R(-5, -12, 10, 3, '#3a3d4a');
  }

  // --- Objetos
  const ITEMS = [
    {
      id: 'ficus',
      icon: '🌳',
      name: { es: 'Ficus gigante', en: 'Giant ficus' },
      desc: { es: 'Un árbol de interior que casi llega al techo, al lado del pizarrón.', en: 'An indoor tree that almost reaches the ceiling, next to the whiteboard.' },
      tile: [16, 1],
      solid: [[16, 1]],
      layer: 'actor',
      box: [-6, -40, 44, 72],
      paint(ctx, t) {
        const R = rect(ctx);
        shadow(ctx, 16, 29, 13, 3);
        R(8, 16, 16, 13, '#c97b4a');
        R(7, 15, 18, 3, '#a8613a');
        R(8, 22, 16, 2, '#e0a070');
        R(15, -6, 3, 22, '#7a5230');
        R(10, 2, 6, 2, '#7a5230');
        R(18, -3, 6, 2, '#7a5230');
        const s = Math.sin(t * 1.1) * 0.9;
        const leaf = [[16, -22, 11, '#2d6a4f'], [6, -14, 9, '#2d6a4f'], [26, -14, 9, '#2d6a4f'], [10, -26, 8, '#40916c'], [23, -27, 8, '#40916c'], [16, -32, 7, '#52b788'], [5, -3, 7, '#40916c'], [27, -4, 7, '#40916c'], [16, -12, 9, '#40916c'], [12, -20, 4, '#74c69d'], [21, -18, 3.5, '#74c69d'], [17, -29, 3, '#95d5b2']];
        for (const [x, y, r, c] of leaf) circle(ctx, x + s * (y < -15 ? 1.3 : 0.6), y, r, c);
      },
    },
    {
      id: 'rug',
      icon: '🧶',
      name: { es: 'Alfombra persa', en: 'Persian rug' },
      desc: { es: 'Debajo de la mesa de reuniones. Las reuniones se sienten más importantes.', en: 'Under the meeting table. Meetings feel more important.' },
      rug: [9, 8, 5, 4], // en tiles: x, y, ancho, alto
      layer: 'floor',
      box: [-6, -4, 172, 136],
      paint(ctx) {
        paintRug(ctx, 5 * T, 4 * T);
      },
    },
    {
      id: 'espresso',
      icon: '☕',
      name: { es: 'Cafetera espresso', en: 'Espresso machine' },
      desc: { es: 'Reemplaza la cafetera vieja de la cocina. Leo está emocionado.', en: 'Replaces the old kitchen coffee machine. Leo is thrilled.' },
      tile: [3, 1],
      layer: 'replace',
      box: [0, -28, 32, 36],
      paint(ctx, t) {
        const R = rect(ctx);
        R(4, -18, 24, 22, '#c9ced6');
        R(4, -18, 24, 3, '#eef1f5');
        R(4, 2, 24, 2, '#8f96a3');
        R(5, -22, 5, 4, '#ffffff');
        R(11, -22, 5, 4, '#ffffff');
        R(6, -21, 3, 1, '#7a4a2a');
        R(6, -13, 20, 6, '#2b2e3a');
        circle(ctx, 11, -10, 2.2, '#f7f1e3');
        ctx.strokeStyle = '#e5484d';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(11, -10);
        ctx.lineTo(11 + Math.cos(t * 2) * 1.8, -10 + Math.sin(t * 2) * 1.8);
        ctx.stroke();
        R(16, -11, 2, 2, Math.sin(t * 3) > 0 ? '#7cf29a' : '#2fbf71');
        R(20, -11, 4, 2, '#ffd23f');
        R(8, -6, 5, 3, '#4a4f63');
        R(19, -6, 5, 3, '#4a4f63');
        R(9, -2, 3, 3, '#ffffff');
        R(20, -2, 3, 3, '#ffffff');
        R(9, -2, 3, 1, '#7a4a2a');
        R(26, -9, 1, 8, '#9aa1b5');
        const p = (t * 1.5) % 1;
        ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - p)})`;
        ctx.fillRect(10, -4 - p * 10, 1, 2);
        ctx.fillRect(21, -5 - p * 9, 1, 2);
        ctx.fillRect(26, -11 - p * 8, 2, 2);
      },
    },
    {
      id: 'donuts',
      icon: '🍩',
      name: { es: 'Caja de donas', en: 'Box of donuts' },
      desc: { es: 'Siempre hay donas en la mesada de la cocina. Nadie sabe quién las trae.', en: 'There are always donuts on the kitchen counter. Nobody knows who brings them.' },
      tile: [4, 1],
      layer: 'replace',
      box: [2, -16, 28, 20],
      paint(ctx) {
        const R = rect(ctx);
        R(5, -13, 22, 6, '#ffc2d1');
        R(5, -13, 22, 1, '#ffe0e8');
        R(5, -7, 22, 9, '#ff9fb2');
        R(5, 1, 22, 1, '#e07a8f');
        const d = [[10, -4, '#ff6b9a'], [16, -4, '#7b4b2a'], [22, -4, '#ffe066']];
        for (const [x, y, c] of d) {
          circle(ctx, x, y, 3.2, '#e6b17a');
          circle(ctx, x, y - 0.5, 2.6, c);
          circle(ctx, x, y - 0.5, 0.9, '#ff9fb2');
          R(x - 2, y - 2, 1, 1, '#7cf29a');
          R(x + 1, y - 1, 1, 1, '#4fd1ff');
        }
      },
    },
    {
      id: 'pcgamer',
      icon: '🖥️',
      name: { es: 'PC gamer', en: 'Gaming PC' },
      desc: { es: 'Dos monitores y luces RGB en tu escritorio. Los gráficos se ven más rápido (dicen).', en: 'Two monitors and RGB lights on your desk. Charts load faster (they say).' },
      tile: [10, 3],
      layer: 'replace',
      box: [-2, -8, 36, 34],
      paint(ctx, t, o) {
        const R = rect(ctx);
        const glow = o && o.highlight && Math.sin(t * 4) > 0;
        // gabinete con ventilador RGB
        R(0, 2, 7, 16, '#14151c');
        R(1, 3, 5, 14, '#1f2129');
        circle(ctx, 3.5, 8, 2, hue(t, 0));
        circle(ctx, 3.5, 14, 2, hue(t, 2));
        // monitores
        R(7, -4, 13, 12, '#111218');
        R(20, -4, 12, 12, '#111218');
        R(8, -3, 11, 9, glow ? '#9be7ff' : '#0f2a3a');
        R(21, -3, 10, 9, glow ? '#9be7ff' : '#1a1030');
        // gráfico de barras y código
        R(9, 2, 2, 3, '#4fd1ff');
        R(12, 0, 2, 5, '#7cf29a');
        R(15, -1, 2, 6, '#ffd23f');
        for (let i = 0; i < 4; i++) R(22, -2 + i * 2, 3 + ((i * 5 + Math.floor(t * 2)) % 6), 1, i % 2 ? '#ff4fd8' : '#c084fc');
        // tira RGB bajo los monitores
        for (let i = 0; i < 12; i++) R(8 + i * 2, 8, 2, 1, hue(t, i * 0.4));
        R(12, 9, 3, 4, '#111218');
        R(24, 9, 3, 4, '#111218');
        R(10, 13, 20, 1, hue(t, 3));
      },
    },
    {
      id: 'gamerchair',
      icon: '🪑',
      name: { es: 'Silla gamer', en: 'Gaming chair' },
      desc: { es: 'Reemplaza tu silla. Respaldo alto, almohadón y franjas rojas: +10 de concentración.', en: 'Replaces your chair. High back, pillow and red stripes: +10 focus.' },
      layer: 'replace',
      origin: 'feet',
      box: [-15, -30, 30, 34],
      paint(ctx, t, o) {
        paintGamerChair(ctx, t, o);
      },
    },
    {
      id: 'cat',
      icon: '🐱',
      name: { es: 'Michi, el gato de la oficina', en: 'Michi, the office cat' },
      desc: { es: 'Pasea por la oficina y a veces se duerme una siesta. Acercate y acariciálo (E).', en: 'Wanders around the office and sometimes naps. Walk up and pet it (E).' },
      pet: 'cat',
      layer: 'pet',
      origin: 'feet',
      box: [-14, -20, 28, 22],
      paint(ctx, t, o) {
        paintCat(ctx, t, o || { state: 'walk', dir: 'right', frame: Math.floor(t * 6) % 2 });
      },
    },
    {
      id: 'dog',
      icon: '🐶',
      name: { es: 'Firulais, el perro de la oficina', en: 'Firulais, the office dog' },
      desc: { es: 'Da vueltas por la oficina moviendo la cola. Acercate y acariciálo (E).', en: 'Trots around the office wagging its tail. Walk up and pet it (E).' },
      pet: 'dog',
      layer: 'pet',
      origin: 'feet',
      box: [-16, -24, 36, 26],
      paint(ctx, t, o) {
        paintDog(ctx, t, o || { state: 'walk', dir: 'right', frame: Math.floor(t * 6) % 2 });
      },
    },
    {
      id: 'aquarium',
      icon: '🐠',
      name: { es: 'Pecera', en: 'Aquarium' },
      desc: { es: 'Dos peces nadan entre algas en el living, detrás del sofá. Muy relajante entre pedido y pedido.', en: 'Two fish swim among the weeds in the lounge, behind the sofa. Very relaxing between requests.' },
      tile: [23, 12],
      solid: [[23, 12]],
      layer: 'actor',
      box: [0, -18, 32, 48],
      paint(ctx, t) {
        const R = rect(ctx);
        shadow(ctx, 16, 29, 13, 3);
        R(3, 10, 26, 18, '#5b4636');
        R(3, 10, 26, 2, '#7a5e48');
        R(14, 14, 4, 2, '#3f3025');
        R(2, -13, 28, 23, 'rgba(120,200,255,0.55)');
        R(2, -14, 28, 2, '#2b2e3a');
        R(2, 8, 28, 2, '#2b2e3a');
        R(2, -14, 1, 24, '#2b2e3a');
        R(29, -14, 1, 24, '#2b2e3a');
        R(3, 4, 26, 4, '#e9c46a');
        R(6, 5, 2, 2, '#f4a261');
        R(20, 6, 3, 2, '#adb5bd');
        for (const [x, ph] of [[7, 0], [12, 1.5], [24, 0.7]]) for (let k = 0; k < 4; k++) R(x + Math.round(Math.sin(t * 2 + ph + k) * 1), 3 - k * 3, 2, 3, '#2fbf71');
        const f1 = 6 + ((t * 9) % 20);
        const f2 = 26 - ((t * 6 + 7) % 20);
        R(f1, -6, 4, 3, '#ff8a3d');
        R(f1 - 2, -5, 2, 1, '#ff8a3d');
        R(f1 + 3, -6, 1, 1, '#1b1d2b');
        R(f2, -1, 4, 3, '#4fd1ff');
        R(f2 + 4, 0, 2, 1, '#4fd1ff');
        R(f2, -1, 1, 1, '#1b1d2b');
        const b = (t * 0.9) % 1;
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(20, 2 - b * 14, 1, 1);
        ctx.fillRect(21, 4 - ((b + 0.4) % 1) * 14, 1, 1);
        R(4, -12, 4, 1, 'rgba(255,255,255,0.6)');
      },
    },
    {
      id: 'lights',
      icon: '💡',
      name: { es: 'Guirnalda de luces', en: 'String lights' },
      desc: { es: 'Lucecitas de colores a lo largo de la pared de la oficina y la cocina.', en: 'Colorful little lights along the office and kitchen wall.' },
      layer: 'wall',
      box: [0, 0, 128, 24],
      paint(ctx, t, o) {
        const from = o && o.from !== undefined ? o.from : 0;
        const to = o && o.to !== undefined ? o.to : 128;
        const span = 64;
        const sag = (x) => 9 + 5 * Math.sin((((x - from) % span) / span) * Math.PI);
        ctx.strokeStyle = '#3a3d4a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = from; x <= to; x += 4) (x === from ? ctx.moveTo : ctx.lineTo).call(ctx, x, sag(x));
        ctx.stroke();
        const cols = ['#ff4fd8', '#ffd23f', '#4fd1ff', '#7cf29a', '#ff8a3d'];
        let k = 0;
        for (let x = from + 8; x < to; x += 16, k++) {
          const on = Math.sin(t * 3 + k * 1.7) > -0.4;
          const c = cols[k % cols.length];
          if (on) {
            ctx.fillStyle = c + '55';
            ctx.beginPath();
            ctx.arc(x, sag(x) + 4, 4, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = on ? c : '#5a5d6a';
          ctx.fillRect(x - 1, sag(x) + 1, 3, 4);
          ctx.fillStyle = '#2b2e3a';
          ctx.fillRect(x - 1, sag(x), 3, 1);
        }
      },
    },
    {
      id: 'turntable',
      icon: '🎵',
      name: { es: 'Tocadiscos', en: 'Record player' },
      desc: { es: 'Al lado de la máquina ARCADE, con 3 vinilos: bossa nova, synthwave y cumbia. Acercate (E) y elegí qué suena en la oficina.', en: 'Next to the ARCADE machine, with 3 vinyls: bossa nova, synthwave and cumbia. Walk up (E) and pick what plays in the office.' },
      tile: [26, 7],
      solid: [[26, 7]],
      layer: 'actor',
      box: [-2, -30, 36, 60],
      paint(ctx, t, o) {
        const R = rect(ctx);
        shadow(ctx, 16, 29, 13, 3);
        R(3, 6, 26, 22, '#8b5e3c');
        R(3, 6, 26, 2, '#a87650');
        R(5, 10, 22, 16, '#6e4a2f');
        for (let i = 0; i < 5; i++) R(7 + i * 4, 12, 3, 12, ['#e5484d', '#1b1d2b', '#ffd23f', '#3d5a80', '#7cf29a'][i]);
        R(3, -4, 26, 11, '#2b2e3a');
        R(3, -4, 26, 2, '#4a4f63');
        const playing = !o || o.playing !== false;
        const label = (o && o.color) || '#e5484d';
        circle(ctx, 14, 1, 5, '#111218');
        circle(ctx, 14, 1, 1.8, label);
        if (playing) {
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(14, 1);
          ctx.lineTo(14 + Math.cos(t * 6) * 4, 1 + Math.sin(t * 6) * 4);
          ctx.stroke();
        }
        R(23, -3, 2, 2, '#c9ced6');
        R(21, -1, 3, 1, '#c9ced6');
        R(playing ? 19 : 21, playing ? 0 : -3, 2, 1, '#c9ced6');
        ctx.font = 'bold 8px "Inter", sans-serif';
        for (let k = 0; k < (playing ? 2 : 0); k++) {
          const p = (t * 0.5 + k * 0.5) % 1;
          ctx.fillStyle = `rgba(${k ? '79,209,255' : '255,79,216'},${1 - p})`;
          ctx.fillText(k ? '♫' : '♪', 10 + k * 8 + Math.sin(p * 6) * 3, -8 - p * 18);
        }
      },
    },
    {
      id: 'trophy',
      icon: '🏆',
      name: { es: 'Trofeo dorado', en: 'Golden trophy' },
      desc: { es: 'Brilla en tu escritorio. Para que todos sepan quién manda en el ARCADE.', en: 'It shines on your desk. So everyone knows who rules the ARCADE.' },
      tile: [11, 3],
      layer: 'top',
      box: [16, -16, 18, 32],
      paint(ctx, t) {
        const R = rect(ctx);
        R(22, 8, 9, 4, '#5b4636');
        R(23, 7, 7, 1, '#7a5e48');
        R(25, 3, 3, 4, '#d4a017');
        R(22, -7, 9, 10, '#f4c430');
        R(22, -7, 9, 2, '#ffe27a');
        R(20, -6, 2, 5, '#d4a017');
        R(31, -6, 2, 5, '#d4a017');
        R(24, -4, 2, 5, '#ffe27a');
        if (Math.sin(t * 2.5) > 0.6) {
          R(29, -11, 1, 5, '#ffffff');
          R(27, -9, 5, 1, '#ffffff');
        }
      },
    },
    {
      id: 'neon',
      icon: '🟣',
      name: { es: 'Cartel de neón «DATA»', en: '"DATA" neon sign' },
      desc: { es: 'Un cartel de neón en la pared de la oficina, entre la ventana y la biblioteca.', en: 'A neon sign on the office wall, between the window and the bookshelf.' },
      tile: [17, 0],
      layer: 'wall',
      box: [0, 4, 64, 26],
      paint(ctx, t) {
        const R = rect(ctx);
        R(4, 9, 56, 16, 'rgba(20,10,40,0.9)');
        R(4, 9, 56, 1, '#4a2a8f');
        const flick = Math.sin(t * 23) > 0.97 ? 0.35 : 1;
        ctx.save();
        ctx.globalAlpha = flick;
        ctx.font = '800 10px "Inter", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff4fd8';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ff9df0';
        ctx.fillText('DATA', 26, 17.5);
        ctx.shadowColor = '#4fd1ff';
        ctx.fillStyle = '#9be7ff';
        ctx.fillRect(46, 18, 2, 4);
        ctx.fillRect(50, 15, 2, 7);
        ctx.fillRect(54, 12, 2, 10);
        ctx.restore();
      },
    },
    {
      id: 'portrait',
      icon: '🖼️',
      name: { es: 'Cuadro «Analista del mes»', en: '"Analyst of the month" portrait' },
      desc: { es: 'Tu retrato con marco dorado, colgado en la oficina de Marta.', en: 'Your portrait in a golden frame, hanging in Marta\'s office.' },
      tile: [25, 0],
      layer: 'wall',
      box: [4, 6, 24, 26],
      paint(ctx) {
        const R = rect(ctx);
        const me = (AA.State && AA.State.CHARACTERS && AA.State.CHARACTERS.player) || {};
        const skin = me.skin || '#f1c27d';
        const hair = me.hair || '#4a2f1b';
        const shirt = me.shirt || '#4f8cff';
        R(6, 8, 20, 20, '#d4a017');
        R(7, 9, 18, 18, '#b8860b');
        R(8, 10, 16, 16, '#fdf3d7');
        R(10, 20, 12, 6, shirt);
        R(13, 13, 6, 7, skin);
        R(12, 11, 8, 3, hair);
        R(14, 16, 1, 1, '#1b1d2b');
        R(17, 16, 1, 1, '#1b1d2b');
        R(11, 27, 10, 3, '#8a6243');
        R(13, 28, 6, 1, '#ffe27a');
      },
    },
    {
      id: 'bonsai',
      icon: '🪴',
      name: { es: 'Bonsái', en: 'Bonsai' },
      desc: { es: 'Sobre la mesa ratona del living. Paciencia y sangre fría, como en el ARCADE.', en: 'On the lounge coffee table. Patience and a cool head, like in the ARCADE.' },
      tile: [24, 9],
      layer: 'top',
      box: [8, -18, 22, 26],
      paint(ctx, t) {
        const R = rect(ctx);
        R(13, 4, 14, 4, '#3d5a80');
        R(12, 3, 16, 2, '#51709c');
        R(19, -3, 2, 7, '#6b4226');
        R(17, -6, 3, 3, '#6b4226');
        R(21, -8, 2, 4, '#6b4226');
        const s = Math.sin(t * 0.9) * 0.4;
        circle(ctx, 16 + s, -8, 4, '#3a7d44');
        circle(ctx, 24 + s, -11, 4.5, '#3a7d44');
        circle(ctx, 20 + s, -14, 3.5, '#52a35c');
        circle(ctx, 17 + s, -10, 2, '#7cc47f');
        circle(ctx, 25 + s, -13, 2, '#7cc47f');
      },
    },
    {
      id: 'dancebtn',
      icon: '🕺',
      name: { es: 'Botón de baile «B»', en: '"B" dance button' },
      desc: { es: 'Un botón rojo gigante en el living. Apretalo (o la tecla B en cualquier parte de la oficina) y tu personaje se larga a bailar breakdance.', en: 'A giant red button in the lounge. Press it (or the B key anywhere in the office) and your character breaks into breakdance.' },
      tile: [19, 8],
      solid: [[19, 8]],
      layer: 'actor',
      box: [2, -14, 28, 44],
      paint(ctx, t, o) {
        const R = rect(ctx);
        const pressed = o && o.pressed;
        shadow(ctx, 16, 29, 11, 3);
        // pedestal
        R(8, 8, 16, 20, '#2b2e3a');
        R(8, 8, 16, 2, '#4a4f63');
        R(10, 14, 12, 8, '#1b1d2b');
        ctx.fillStyle = '#ffd23f';
        ctx.font = '800 6px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DANCE', 16, 20);
        ctx.textAlign = 'left';
        // botón gigante con la B
        const y = pressed ? 2 : 0;
        R(5, 2, 22, 7, '#9aa1b5');
        ctx.fillStyle = '#9b1c1c';
        ctx.beginPath();
        ctx.ellipse(16, 2 + y, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = pressed ? '#c53030' : '#e5484d';
        ctx.beginPath();
        ctx.ellipse(16, -1 + y * 1.5, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.ellipse(12, -3 + y * 1.5, 3, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 7px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('B', 16, -0.5 + y * 1.5);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        if (!pressed && Math.sin(t * 3) > 0.5) {
          R(25, -9, 1, 4, '#ffd23f');
          R(23, -7, 5, 1, '#ffd23f');
        }
      },
    },
  ];

  const byId = (id) => ITEMS.find((x) => x.id === id);
  const ST = () => AA.State;

  const Decor = {
    ITEMS,
    T,
    byId,
    paintRug,
    paintCat,
    paintDog,
    paintGamerChair,
    // ¿Está desbloqueado (algún logro lo da) y puesto en la oficina?
    unlocked(id) {
      return !!(AA.Achievements && AA.Achievements.rewardUnlocked(id));
    },
    on(id) {
      const d = ST() && ST().data && ST().data.decor;
      return !!(d && d[id] && this.unlocked(id));
    },
    set(id, value) {
      const st = ST();
      st.data.decor = Object.assign({}, st.data.decor, { [id]: !!value });
      st.save();
    },
    // Tiles que ocupa la decoración puesta (para las colisiones).
    solidTiles() {
      const out = [];
      for (const it of ITEMS) if (it.solid && this.on(it.id)) out.push(...it.solid);
      return out;
    },
    // Dibuja un objeto en (x, y) del mundo.
    paintAt(ctx, id, x, y, t, opts) {
      const it = byId(id);
      if (!it) return;
      ctx.save();
      ctx.translate(x, y);
      it.paint(ctx, t, opts);
      ctx.restore();
    },
    // Vista previa en un <canvas>: el objeto centrado y ampliado.
    renderPreview(canvas, id, t) {
      const it = byId(id);
      if (!it || !canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const cw = canvas.clientWidth || canvas.width;
      const ch = canvas.clientHeight || canvas.height;
      if (canvas.width !== Math.round(cw * dpr)) {
        canvas.width = Math.round(cw * dpr);
        canvas.height = Math.round(ch * dpr);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const [bx, by, bw, bh] = it.box;
      const s = Math.min((cw - 8) / bw, (ch - 8) / bh, 3);
      const ox = (cw - bw * s) / 2 - bx * s;
      const oy = (ch - bh * s) / 2 - by * s;
      ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
      ctx.imageSmoothingEnabled = false;
      it.paint(ctx, t || 0, { from: 0, to: 128 });
    },
    // --- Tocadiscos: elegir qué suena en la oficina (3 vinilos o la música de siempre).
    playingVinyl() {
      const v = ST().data && ST().data.flags.vinyl;
      return v && AA.Audio.VINYLS[v] && this.on('turntable') ? v : null;
    },
    openTurntable() {
      const V = AA.Audio.VINYLS;
      const L = (o) => AA.L(o);
      const esc = (x) => AA.escapeHtml(String(x));
      const styles = { bossa: AA.T('Bossa nova tranquila', 'Mellow bossa nova'), synth: AA.T('Synthwave ochentoso', '80s synthwave'), cumbia: AA.T('Cumbia para levantar el ánimo', 'Upbeat cumbia') };
      const render = (el) => {
        const cur = this.playingVinyl();
        const card = (id, title, sub, color) => `
          <button type="button" class="vinyl ${cur === id ? 'on' : ''}" data-vinyl="${id || ''}" data-nav>
            <span class="vinyl-disc" style="--vc:${color}"></span>
            <span class="vinyl-text"><b>${title}</b><span>${sub}</span></span>
            <span class="vinyl-state">${cur === id ? AA.T('▶ Sonando', '▶ Playing') : ''}</span>
          </button>`;
        el.querySelector('.vinyls').innerHTML =
          Object.keys(V).map((id) => card(id, esc(L(V[id].name)), styles[id], V[id].color)).join('') +
          card(null, AA.T('Música de la oficina', 'Office music'), AA.T('Sacar el vinilo y volver al tema de siempre', 'Take the vinyl off and go back to the usual tune'), '#9aa1b5');
        el.querySelectorAll('[data-vinyl]').forEach((b) =>
          b.addEventListener('click', () => {
            const id = b.dataset.vinyl || null;
            const st = ST();
            st.data.flags.vinyl = id;
            st.save();
            AA.Audio.play(id ? 'select' : 'back');
            if (AA.Game && AA.Game.refreshMusic) AA.Game.refreshMusic();
            if (id && AA.Settings && AA.Settings.data.musicOn === false) AA.UI.toast(AA.T('🔇 La música está apagada en las opciones.', '🔇 Music is turned off in the options.'), 'warn');
            render(el);
            const again = el.querySelector(`[data-vinyl="${id || ''}"]`);
            if (again) again.focus({ preventScroll: true });
          })
        );
      };
      AA.UI.modal({
        title: '🎵 ' + AA.T('Tocadiscos', 'Record player'),
        className: 'turntable-modal',
        html: `<p class="muted">${AA.T('Elegí un vinilo: suena en la oficina y mientras trabajás en la computadora (el ARCADE tiene su propia música).', 'Pick a vinyl: it plays in the office and while you work at the computer (the ARCADE has its own music).')}</p><div class="vinyls"></div>`,
        buttons: [{ label: AA.T('Listo', 'Done'), primary: true }],
        onOpen: render,
      });
    },

    // Anima todas las vistas previas de un contenedor mientras siga en pantalla.
    animatePreviews(root) {
      const cvs = [...root.querySelectorAll('canvas[data-prev]')];
      if (!cvs.length) return;
      const t0 = performance.now();
      const loop = (now) => {
        if (!root.isConnected || !cvs[0].isConnected) return;
        const t = (now - t0) / 1000;
        cvs.forEach((c) => this.renderPreview(c, c.dataset.prev, t));
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    },
  };

  AA.Decor = Decor;
})();
