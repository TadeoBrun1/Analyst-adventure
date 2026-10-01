/*
 * Analyst Adventure — Personajes pixel-art dibujados por código (sin imágenes externas).
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt)));
    const r = f((n >> 16) & 255);
    const g = f((n >> 8) & 255);
    const b = f(n & 255);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  // Dibuja un personaje con los pies en (x, y). dir: down|up|left|right. frame: 0 quieto, 1/2 caminando.
  function drawChar(ctx, x, y, c, dir, frame, opts) {
    opts = opts || {};
    x = Math.round(x);
    y = Math.round(y);
    const R = (px, py, w, h, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(x + px, y + py, w, h);
    };
    // sombra
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(x, y - 1, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    const bob = frame ? -1 : 0;
    const sitting = !!opts.sitting;
    // piernas
    if (!sitting) {
      const l = frame === 1 ? 2 : 0;
      const r = frame === 2 ? 2 : 0;
      R(-6, -9 + l, 5, 8 - l, c.pants);
      R(1, -9 + r, 5, 8 - r, c.pants);
      R(-6, -2, 5, 2, '#1d1d24');
      R(1, -2, 5, 2, '#1d1d24');
    } else {
      R(-6, -9, 12, 5, c.pants);
    }
    // torso y brazos
    const ty = -21 + bob + (sitting ? 3 : 0);
    R(-8, ty, 16, 13, c.shirt);
    R(-8, ty + 11, 16, 2, shade(c.shirt, -40));
    const armSwing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    if (dir === 'left' || dir === 'right') {
      const ax = dir === 'left' ? -3 : 0;
      R(ax, ty + 1 + armSwing, 3, 10, shade(c.shirt, -25));
      R(ax, ty + 11 + armSwing, 3, 2, c.skin);
    } else {
      R(-10, ty + 1 + armSwing, 3, 10, shade(c.shirt, -25));
      R(7, ty + 1 - armSwing, 3, 10, shade(c.shirt, -25));
      R(-10, ty + 11 + armSwing, 3, 2, c.skin);
      R(7, ty + 11 - armSwing, 3, 2, c.skin);
    }
    // cabeza
    const hy = ty - 12;
    R(-7, hy, 14, 12, c.skin);
    // pelo
    R(-8, hy - 2, 16, 5, c.hair);
    if (dir === 'up') {
      R(-8, hy, 16, 12, c.hair);
      if (c.longHair) R(-8, hy + 10, 16, 5, c.hair);
    } else {
      if (dir === 'down') {
        R(-8, hy + 2, 2, 5, c.hair);
        R(6, hy + 2, 2, 5, c.hair);
      } else if (dir === 'left') R(3, hy + 2, 5, 6, c.hair);
      else R(-8, hy + 2, 5, 6, c.hair);
      if (c.longHair) {
        if (dir !== 'right') R(5, hy + 2, 3, 13, c.hair);
        if (dir !== 'left') R(-8, hy + 2, 3, 13, c.hair);
      }
      // ojos
      const eye = '#1e1e28';
      if (dir === 'down') {
        R(-4, hy + 5, 2, 2, eye);
        R(2, hy + 5, 2, 2, eye);
        R(-1, hy + 9, 3, 1, shade(c.skin, -40));
      } else if (dir === 'left') R(-5, hy + 5, 2, 2, eye);
      else R(3, hy + 5, 2, 2, eye);
      if (c.glasses) {
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        if (dir === 'down') {
          ctx.strokeRect(x - 6 + 0.5, y + hy + 4 + 0.5, 5, 4);
          ctx.strokeRect(x + 1 + 0.5, y + hy + 4 + 0.5, 5, 4);
        } else {
          const gx = dir === 'left' ? -7 : 1;
          ctx.strokeRect(x + gx + 0.5, y + hy + 4 + 0.5, 6, 4);
        }
      }
    }
  }

  // Retrato para el cuadro de diálogo.
  function drawPortrait(canvas, c) {
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const s = canvas.width / 24;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.imageSmoothingEnabled = false;
    drawChar(ctx, 12, 44, c, 'down', 0);
  }

  AA.Sprites = { drawChar, drawPortrait, shade };
})();
