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

  // Opciones del creador de personaje (también las usan los NPC).
  const HAIR_STYLES = ['short', 'spiky', 'curly', 'bob', 'long', 'ponytail', 'bun', 'bald'];
  const BEARDS = ['none', 'stubble', 'mustache', 'goatee', 'full'];
  const TOPS = ['tee', 'shirt', 'hoodie', 'blazer'];
  const BOTTOMS = ['pants', 'skirt'];

  // Normaliza un personaje: los NPC viejos usan longHair en lugar de hairStyle.
  function look(c) {
    return {
      body: c.body || 'm',
      skin: c.skin || '#f1c27d',
      hairStyle: c.hairStyle || (c.longHair ? 'long' : 'short'),
      hair: c.hair || '#3b2a20',
      beard: c.beard || 'none',
      beardColor: c.beardColor || c.hair || '#3b2a20',
      glasses: !!c.glasses,
      top: c.top || 'tee',
      shirt: c.shirt || '#4f8cff',
      bottom: c.bottom || 'pants',
      pants: c.pants || '#2b2f45',
    };
  }

  // Dibuja un personaje con los pies en (x, y). dir: down|up|left|right. frame: 0 quieto, 1/2 caminando.
  function drawChar(ctx, x, y, ch, dir, frame, opts) {
    opts = opts || {};
    const c = look(ch);
    x = Math.round(x);
    y = Math.round(y);
    const R = (px, py, w, h, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(x + px, y + py, w, h);
    };
    const female = c.body === 'f';
    const side = dir === 'left' || dir === 'right';
    // sombra
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(x, y - 1, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    const bob = frame ? -1 : 0;
    const sitting = !!opts.sitting;
    const shoe = '#1d1d24';
    // piernas (pantalón o pollera)
    if (!sitting) {
      const l = frame === 1 ? 2 : 0;
      const r = frame === 2 ? 2 : 0;
      if (c.bottom === 'skirt') {
        R(-6, -9 + l, 5, 8 - l, c.skin);
        R(1, -9 + r, 5, 8 - r, c.skin);
        R(-8, -12, 16, 6, c.pants);
        R(-7, -12, 14, 1, shade(c.pants, 25));
        R(-8, -7, 16, 1, shade(c.pants, -30));
      } else {
        R(-6, -9 + l, 5, 8 - l, c.pants);
        R(1, -9 + r, 5, 8 - r, c.pants);
      }
      R(-6, -2, 5, 2, shoe);
      R(1, -2, 5, 2, shoe);
    } else if (c.bottom === 'skirt') {
      R(-7, -10, 14, 5, c.pants);
      R(-6, -5, 12, 2, c.skin);
    } else {
      R(-6, -9, 12, 5, c.pants);
    }

    // torso y brazos
    const ty = -21 + bob + (sitting ? 3 : 0);
    const tw = female ? 14 : 16;
    const tx = -tw / 2;
    const shirtD = shade(c.shirt, -25);
    R(tx, ty, tw, 13, c.shirt);
    R(tx, ty + 11, tw, 2, shade(c.shirt, -40));
    // detalles de la prenda
    if (dir === 'up') {
      if (c.top === 'hoodie') {
        R(-5, ty, 10, 5, shirtD);
        R(-4, ty + 1, 8, 3, shade(c.shirt, -45));
      } else if (c.top === 'blazer') R(-1, ty + 3, 2, 8, shade(c.shirt, -20));
    } else if (!side) {
      if (c.top === 'shirt') {
        R(-4, ty, 3, 3, shade(c.shirt, 45));
        R(1, ty, 3, 3, shade(c.shirt, 45));
        R(0, ty + 3, 1, 8, shirtD);
        R(-1, ty + 5, 1, 1, '#f4f4f4');
        R(-1, ty + 8, 1, 1, '#f4f4f4');
      } else if (c.top === 'hoodie') {
        R(-5, ty - 1, 10, 3, shirtD);
        R(-2, ty + 2, 1, 4, '#f4f4f4');
        R(1, ty + 2, 1, 4, '#f4f4f4');
        R(-5, ty + 7, 10, 3, shirtD);
      } else if (c.top === 'blazer') {
        R(-3, ty, 6, 10, '#f4f4f4');
        R(-1, ty + 1, 2, 8, '#c0392b');
        R(-4, ty, 2, 7, shade(c.shirt, -35));
        R(2, ty, 2, 7, shade(c.shirt, -35));
        R(tx + 2, ty + 7, 3, 1, shirtD);
      } else {
        R(-3, ty, 6, 1, shade(c.shirt, -35));
      }
    } else if (c.top === 'hoodie') {
      R(dir === 'left' ? 2 : -6, ty - 1, 4, 4, shirtD);
    } else if (c.top === 'blazer' || c.top === 'shirt') {
      R(dir === 'left' ? -5 : 3, ty, 2, 3, c.top === 'blazer' ? '#f4f4f4' : shade(c.shirt, 45));
    }
    const armSwing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    if (side) {
      const ax = dir === 'left' ? -3 : 0;
      R(ax, ty + 1 + armSwing, 3, 10, shirtD);
      R(ax, ty + 11 + armSwing, 3, 2, c.skin);
    } else {
      R(tx - 2, ty + 1 + armSwing, 3, 10, shirtD);
      R(tx + tw - 1, ty + 1 - armSwing, 3, 10, shirtD);
      R(tx - 2, ty + 11 + armSwing, 3, 2, c.skin);
      R(tx + tw - 1, ty + 11 - armSwing, 3, 2, c.skin);
    }

    // cabeza
    const hy = ty - 12;
    R(-7, hy, 14, 12, c.skin);
    if (c.top === 'hoodie' && !side && dir !== 'up') R(-6, hy + 11, 12, 2, shirtD);
    const H = c.hair;
    const hs = c.hairStyle;
    const longish = hs === 'long' || hs === 'bob';
    const longLen = hs === 'long' ? 13 : 8;

    // pelo de atrás (va detrás de la cara en las vistas laterales y de frente)
    if (dir !== 'up' && longish) {
      if (dir !== 'right') R(5, hy + 2, 3, longLen, H);
      if (dir !== 'left') R(-8, hy + 2, 3, longLen, H);
    }
    if (hs === 'ponytail') {
      if (dir === 'left') R(7, hy + 3, 3, 9, H);
      else if (dir === 'right') R(-10, hy + 3, 3, 9, H);
      else if (dir === 'down') R(-1, hy - 3, 2, 2, shade(H, -25));
    }

    if (hs !== 'bald') {
      // flequillo / parte de arriba
      if (hs === 'curly') {
        R(-9, hy - 4, 18, 7, H);
        for (let i = 0; i < 4; i++) R(-7 + i * 4, hy - 4 + (i % 2), 2, 2, shade(H, 25));
      } else {
        R(-8, hy - 2, 16, 5, H);
      }
      if (hs === 'spiky') {
        R(-7, hy - 4, 3, 2, H);
        R(-2, hy - 5, 3, 3, H);
        R(3, hy - 4, 3, 2, H);
      }
      if (hs === 'bun') {
        R(-3, hy - 7, 6, 5, H);
        R(-2, hy - 6, 2, 1, shade(H, 25));
      }
      if (dir === 'up') {
        R(-8, hy, 16, 12, H);
        if (hs === 'long') R(-8, hy + 10, 16, 5, H);
        if (hs === 'ponytail') R(-2, hy + 10, 4, 7, H);
        if (hs === 'curly') R(-9, hy + 2, 18, 9, H);
      } else {
        const sides = hs === 'curly' ? 7 : 5;
        if (dir === 'down') {
          R(hs === 'curly' ? -9 : -8, hy + 2, hs === 'curly' ? 3 : 2, sides, H);
          R(hs === 'curly' ? 6 : 6, hy + 2, hs === 'curly' ? 3 : 2, sides, H);
        } else if (dir === 'left') R(3, hy + 2, 5, sides + 1, H);
        else R(-8, hy + 2, 5, sides + 1, H);
      }
    } else if (dir !== 'up') {
      R(-4, hy + 1, 3, 1, shade(c.skin, 30));
    } else {
      R(-3, hy + 2, 4, 2, shade(c.skin, 25));
    }

    if (dir === 'up') return;

    // cara
    const eye = '#1e1e28';
    const mouth = female ? '#c96a6a' : shade(c.skin, -40);
    if (dir === 'down') {
      R(-4, hy + 5, 2, 2, eye);
      R(2, hy + 5, 2, 2, eye);
      if (female) {
        R(-5, hy + 4, 1, 1, eye);
        R(4, hy + 4, 1, 1, eye);
      }
      R(-1, hy + 9, 3, 1, mouth);
    } else if (dir === 'left') {
      R(-5, hy + 5, 2, 2, eye);
      if (female) R(-6, hy + 4, 1, 1, eye);
      R(-6, hy + 9, 2, 1, mouth);
    } else {
      R(3, hy + 5, 2, 2, eye);
      if (female) R(5, hy + 4, 1, 1, eye);
      R(4, hy + 9, 2, 1, mouth);
    }

    // barba
    const B = c.beardColor;
    if (c.beard !== 'none') {
      if (dir === 'down') {
        if (c.beard === 'stubble') {
          ctx.globalAlpha = 0.35;
          R(-6, hy + 7, 12, 5, B);
          ctx.globalAlpha = 1;
          R(-1, hy + 9, 3, 1, mouth);
        }
        if (c.beard === 'mustache' || c.beard === 'goatee' || c.beard === 'full') R(-3, hy + 8, 6, 1, B);
        if (c.beard === 'goatee') R(-2, hy + 10, 4, 3, B);
        if (c.beard === 'full') {
          R(-7, hy + 6, 2, 6, B);
          R(5, hy + 6, 2, 6, B);
          R(-7, hy + 10, 14, 3, B);
          R(-1, hy + 9, 3, 1, mouth);
        }
      } else {
        const fx = dir === 'left' ? -7 : 1;
        if (c.beard === 'stubble') {
          ctx.globalAlpha = 0.35;
          R(fx, hy + 7, 6, 5, B);
          ctx.globalAlpha = 1;
        }
        if (c.beard === 'mustache' || c.beard === 'goatee' || c.beard === 'full') R(dir === 'left' ? -7 : 3, hy + 8, 4, 1, B);
        if (c.beard === 'goatee') R(dir === 'left' ? -7 : 4, hy + 10, 3, 3, B);
        if (c.beard === 'full') R(fx, hy + 9, 6, 4, B);
      }
    }

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

  AA.Sprites = { drawChar, drawPortrait, shade, look, HAIR_STYLES, BEARDS, TOPS, BOTTOMS };
})();
