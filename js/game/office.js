/*
 * Analyst Adventure — La oficina: mundo 2D con vista cenital.
 * El jugador camina con WASD/flechas e interactúa con E/Espacio (o con clic).
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});

  const T = 32;
  // Leyenda: # pared · . piso · | puerta · D escritorio · B escritorio de la jefa · K biblioteca
  //          W pizarra · G vidrio · S sofá · C cafetera · P planta · = salida
  const MAP = [
    '####################',
    '#K.WW......#.BB...K#',
    '#..........#.......#',
    '#.DD..DD...G.......#',
    '#..........G.......#',
    '#.DD..DD...|.......#',
    '#..........####GG###',
    '#..................#',
    '#P.....SSS.....C..P#',
    '#..................#',
    '#....P.........P...#',
    '########==##########',
  ];
  const COLS = MAP[0].length;
  const ROWS = MAP.length;
  const WORLD_W = COLS * T;
  const WORLD_H = ROWS * T;
  const WALKABLE = new Set(['.', '|']);

  const NPCS = [
    { id: 'marta', tx: 15, ty: 3, dir: 'down' },
    { id: 'leo', tx: 14, ty: 8, dir: 'right' },
    { id: 'sofi', tx: 7, ty: 4, dir: 'up', sitting: true },
    { id: 'tomas', tx: 6, ty: 6, dir: 'up', sitting: true },
  ];

  // Zonas interactivas (en tiles).
  const SPOTS = [
    { id: 'computer', x: 2, y: 3, w: 2, h: 1, label: 'Usar computadora' },
    { id: 'whiteboard', x: 3, y: 1, w: 2, h: 1, label: 'Plan de carrera' },
    { id: 'coffee', x: 15, y: 8, w: 1, h: 1, label: 'Máquina de café' },
    { id: 'nico', x: 2, y: 5, w: 2, h: 1, label: 'Escritorio vacío' },
    { id: 'books', x: 1, y: 1, w: 1, h: 1, label: 'Biblioteca' },
    { id: 'books', x: 18, y: 1, w: 1, h: 1, label: 'Biblioteca' },
    { id: 'bossdesk', x: 13, y: 1, w: 2, h: 1, label: 'Escritorio de Marta' },
    { id: 'sofa', x: 7, y: 8, w: 3, h: 1, label: 'Sofá' },
    { id: 'exit', x: 8, y: 11, w: 2, h: 1, label: 'Salida' },
  ];

  const Office = {
    canvas: null,
    ctx: null,
    running: false,
    keys: new Set(),
    player: { x: 11 * T + 16, y: 9 * T + 26, dir: 'up', frame: 0, anim: 0, moving: false },
    near: null,
    hover: null,
    t: 0,
    onInteract: null,
    getMarkers: null,
    paused: () => false,

    init(canvas, opts) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.onInteract = opts.onInteract;
      this.getMarkers = opts.getMarkers;
      this.paused = opts.paused || this.paused;
      this.npcs = NPCS.map((n) => Object.assign({}, n, { x: n.tx * T + 16, y: n.ty * T + 26 }));
      this.spots = SPOTS.concat(
        this.npcs.map((n) => ({
          id: n.id,
          x: n.tx,
          y: n.ty,
          w: 1,
          h: 1,
          npc: true,
          label: 'Hablar con ' + AA.State.CHARACTERS[n.id].name.split(' ')[0],
        }))
      );

      window.addEventListener('keydown', (e) => {
        if (!this.running || e.defaultPrevented) return;
        const k = e.key.toLowerCase();
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
          if (this.paused()) return;
          this.keys.add(k);
          e.preventDefault();
        } else if ((k === 'e' || k === ' ' || k === 'enter') && !this.paused()) {
          if (this.near) {
            e.preventDefault();
            this.keys.clear();
            this.onInteract(this.near.id);
          }
        }
      });
      window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
      window.addEventListener('blur', () => this.keys.clear());

      canvas.addEventListener('mousemove', (e) => {
        const p = this.toWorld(e);
        this.hover = this.spotAt(p.x, p.y);
        canvas.style.cursor = this.hover ? 'pointer' : 'default';
      });
      canvas.addEventListener('mouseleave', () => (this.hover = null));
      canvas.addEventListener('click', (e) => {
        if (this.paused()) return;
        const p = this.toWorld(e);
        const s = this.spotAt(p.x, p.y);
        if (s) {
          this.facePlayerTo(s);
          this.onInteract(s.id);
        }
      });
    },

    start() {
      if (this.running) return;
      this.running = true;
      this.last = performance.now();
      const loop = (now) => {
        if (!this.running) return;
        const dt = Math.min(0.05, (now - this.last) / 1000);
        this.last = now;
        this.update(dt);
        this.draw();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    },
    stop() {
      this.running = false;
      this.keys.clear();
    },

    // --- Coordenadas
    view() {
      const c = this.canvas;
      const dpr = window.devicePixelRatio || 1;
      const cw = c.clientWidth;
      const ch = c.clientHeight;
      if (c.width !== Math.round(cw * dpr) || c.height !== Math.round(ch * dpr)) {
        c.width = Math.round(cw * dpr);
        c.height = Math.round(ch * dpr);
      }
      const reserve = cw > 900 ? 40 : 0; // espacio para la barra de ayuda inferior
      const scale = Math.min(cw / WORLD_W, (ch - reserve) / WORLD_H);
      return { scale, ox: (cw - WORLD_W * scale) / 2, oy: (ch - reserve - WORLD_H * scale) / 2, dpr };
    },
    toWorld(e) {
      const r = this.canvas.getBoundingClientRect();
      const v = this.view();
      return { x: (e.clientX - r.left - v.ox) / v.scale, y: (e.clientY - r.top - v.oy) / v.scale };
    },
    spotAt(x, y) {
      const tx = Math.floor(x / T);
      const ty = Math.floor(y / T);
      // Los personajes se dibujan más altos que su tile: también cuenta el tile de arriba.
      const npc = this.spots.find((s) => s.npc && tx === s.x && (ty === s.y || ty === s.y - 1));
      if (npc) return npc;
      return this.spots.find((s) => !s.npc && tx >= s.x && tx < s.x + s.w && ty >= s.y && ty < s.y + s.h) || null;
    },
    facePlayerTo(s) {
      const cx = (s.x + s.w / 2) * T;
      const cy = (s.y + s.h / 2) * T;
      const dx = cx - this.player.x;
      const dy = cy - this.player.y;
      this.player.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
    },

    // --- Lógica
    solidAt(px, py) {
      const tx = Math.floor(px / T);
      const ty = Math.floor(py / T);
      if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
      if (!WALKABLE.has(MAP[ty][tx])) return true;
      return this.npcs.some((n) => n.tx === tx && n.ty === ty);
    },
    blocked(x, y) {
      const hw = 8;
      return (
        this.solidAt(x - hw, y - 8) ||
        this.solidAt(x + hw, y - 8) ||
        this.solidAt(x - hw, y - 1) ||
        this.solidAt(x + hw, y - 1)
      );
    },
    update(dt) {
      this.t += dt;
      const p = this.player;
      let dx = 0;
      let dy = 0;
      if (!this.paused()) {
        if (this.keys.has('arrowleft') || this.keys.has('a')) dx -= 1;
        if (this.keys.has('arrowright') || this.keys.has('d')) dx += 1;
        if (this.keys.has('arrowup') || this.keys.has('w')) dy -= 1;
        if (this.keys.has('arrowdown') || this.keys.has('s')) dy += 1;
      }
      p.moving = dx !== 0 || dy !== 0;
      if (p.moving) {
        const len = Math.hypot(dx, dy);
        const speed = 120 * dt;
        const mx = (dx / len) * speed;
        const my = (dy / len) * speed;
        if (!this.blocked(p.x + mx, p.y)) p.x += mx;
        if (!this.blocked(p.x, p.y + my)) p.y += my;
        p.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
        p.anim += dt * 8;
        p.frame = 1 + (Math.floor(p.anim) % 2);
      } else {
        p.frame = 0;
      }
      // Lo más cercano con lo que se puede interactuar.
      let best = null;
      let bestD = 30;
      for (const s of this.spots) {
        const rx1 = s.x * T;
        const ry1 = s.y * T;
        const rx2 = rx1 + s.w * T;
        const ry2 = ry1 + s.h * T;
        const cx = Math.max(rx1, Math.min(p.x, rx2));
        const cy = Math.max(ry1, Math.min(p.y - 6, ry2));
        const d = Math.hypot(cx - p.x, cy - (p.y - 6));
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }
      this.near = best;
    },

    // --- Dibujo
    draw() {
      const ctx = this.ctx;
      const v = this.view();
      ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
      ctx.fillStyle = '#12131c';
      ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
      ctx.setTransform(v.dpr * v.scale, 0, 0, v.dpr * v.scale, v.dpr * v.ox, v.dpr * v.oy);
      ctx.imageSmoothingEnabled = false;

      const markers = this.getMarkers ? this.getMarkers() : {};
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) this.drawTile(x, y, markers);

      // Personajes ordenados por profundidad.
      const actors = this.npcs.map((n) => ({ y: n.y, draw: () => this.drawNpc(n) }));
      actors.push({ y: this.player.y, draw: () => AA.Sprites.drawChar(ctx, this.player.x, this.player.y, AA.State.CHARACTERS.player, this.player.dir, this.player.frame) });
      actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());

      // Marcadores "!"
      const bounce = Math.sin(this.t * 5) * 2;
      if (markers.computer) this.drawMarker(3 * T, 3 * T - 14 + bounce, '#ffd23f');
      for (const n of this.npcs) if (markers[n.id]) this.drawMarker(n.x, n.y - 46 + bounce, '#ffd23f');
      if (markers.whiteboard) this.drawMarker(4 * T, T - 6 + bounce, '#7cf29a');

      const target = this.near || this.hover;
      if (target) this.drawPrompt(target, !!this.near && target === this.near);
    },

    drawMarker(x, y, color) {
      const ctx = this.ctx;
      ctx.fillStyle = '#1b1d2b';
      this.roundRect(x - 8, y - 20, 16, 18, 4);
      ctx.fill();
      ctx.fillStyle = color;
      this.roundRect(x - 6, y - 18, 12, 14, 3);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 3, y - 4);
      ctx.lineTo(x + 3, y - 4);
      ctx.lineTo(x, y + 1);
      ctx.fill();
      ctx.fillStyle = '#1b1d2b';
      ctx.fillRect(x - 1, y - 16, 2, 6);
      ctx.fillRect(x - 1, y - 8, 2, 2);
    },

    drawPrompt(s, canUse) {
      const ctx = this.ctx;
      const text = (canUse ? 'E · ' : '') + s.label;
      ctx.font = '600 10px "Inter", system-ui, sans-serif';
      const w = ctx.measureText(text).width + 14;
      let x = (s.x + s.w / 2) * T - w / 2;
      let y = s.y * T - (s.npc ? 50 : 22);
      x = Math.max(4, Math.min(WORLD_W - w - 4, x));
      y = Math.max(4, y);
      ctx.fillStyle = canUse ? 'rgba(255,210,63,0.95)' : 'rgba(20,22,34,0.9)';
      this.roundRect(x, y, w, 18, 4);
      ctx.fill();
      ctx.fillStyle = canUse ? '#1b1d2b' : '#fff';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x + 7, y + 9.5);
    },
    roundRect(x, y, w, h, r) {
      const ctx = this.ctx;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    },

    drawNpc(n) {
      const c = AA.State.CHARACTERS[n.id];
      const ctx = this.ctx;
      // Mirar al jugador cuando está cerca.
      let dir = n.dir;
      if (!n.sitting) {
        const dx = this.player.x - n.x;
        const dy = this.player.y - n.y;
        if (Math.hypot(dx, dy) < 70) dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
      }
      if (n.sitting) {
        // silla
        ctx.fillStyle = '#2b2e44';
        ctx.fillRect(n.x - 9, n.y - 14, 18, 12);
        ctx.fillStyle = '#3a3f5c';
        ctx.fillRect(n.x - 9, n.y - 4, 18, 4);
      }
      AA.Sprites.drawChar(ctx, n.x, n.y, c, dir, 0, { sitting: n.sitting });
    },

    floorColor(x, y) {
      const boss = x >= 12 && x <= 18 && y >= 1 && y <= 5;
      if (boss) return (x + y) % 2 ? '#7a5638' : '#7f5b3c';
      return (x + y) % 2 ? '#3a3f5c' : '#373b57';
    },

    drawTile(x, y, markers) {
      const ctx = this.ctx;
      const ch = MAP[y][x];
      const px = x * T;
      const py = y * T;
      const R = (dx, dy, w, h, col) => {
        ctx.fillStyle = col;
        ctx.fillRect(px + dx, py + dy, w, h);
      };
      // piso de base para todo lo que no es pared
      if (ch !== '#' && ch !== '=') {
        R(0, 0, T, T, this.floorColor(x, y));
        if (ch === '.' || ch === '|') {
          ctx.fillStyle = 'rgba(255,255,255,0.025)';
          ctx.fillRect(px, py, T, 1);
        }
      }
      switch (ch) {
        case '#': {
          R(0, 0, T, T, '#1f2133');
          const below = y + 1 < ROWS ? MAP[y + 1][x] : '#';
          if (below !== '#' && below !== '=') {
            R(0, 14, T, 18, '#2c3050');
            R(0, 30, T, 2, '#151726');
            // ventanas en la pared superior
            if (y === 0 && ((x >= 6 && x <= 9) || (x >= 14 && x <= 16))) {
              R(3, 2, 26, 24, '#151726');
              R(5, 4, 22, 20, '#6fa8dc');
              R(5, 16, 22, 8, '#3d6c9e');
              R(7 + (x % 3) * 3, 12, 5, 12, '#23395d');
              R(16, 8 + (x % 2) * 4, 6, 16, '#2a4670');
              R(15, 4, 2, 20, '#151726');
            }
          }
          break;
        }
        case 'G':
          R(12, 0, 8, T, 'rgba(160,210,255,0.35)');
          R(13, 2, 1, T - 4, 'rgba(255,255,255,0.5)');
          R(11, 0, 1, T, '#8fb7d9');
          R(20, 0, 1, T, '#8fb7d9');
          if (y === 6) {
            R(0, 0, T, T, '#1f2133');
            R(0, 4, T, 10, 'rgba(160,210,255,0.35)');
            R(0, 14, T, 18, '#2c3050');
          }
          break;
        case '|':
          R(10, 0, 2, T, '#a07850');
          R(20, 0, 2, T, '#a07850');
          break;
        case 'D':
        case 'B': {
          const left = MAP[y][x - 1] !== ch;
          const wood = ch === 'B' ? '#5b3a24' : '#8a6a4a';
          R(left ? 2 : 0, 6, left ? 30 : 30, 20, wood);
          R(left ? 2 : 0, 24, left ? 30 : 30, 4, AA.Sprites.shade(wood, -35));
          if (left) {
            // monitor
            const isMine = ch === 'D' && x === 2 && y === 3;
            const glow = isMine && markers.computer ? (Math.sin(this.t * 4) > 0 ? '#9be7ff' : '#5fc8ff') : ch === 'B' ? '#c9d6ff' : '#6fd3ff';
            const off = ch === 'D' && x === 2 && y === 5;
            R(10, 0, 20, 14, '#1b1d2b');
            R(12, 2, 16, 10, off ? '#2c2f45' : glow);
            if (!off) {
              R(14, 4, 8, 1, 'rgba(0,0,0,0.25)');
              R(14, 7, 11, 1, 'rgba(0,0,0,0.25)');
            }
            R(18, 14, 4, 3, '#1b1d2b');
          } else {
            // teclado y taza
            R(2, 12, 16, 6, '#d8dce8');
            R(3, 13, 14, 1, '#aab0c4');
            R(22, 10, 6, 7, ch === 'B' ? '#e74c3c' : '#ecf0f1');
          }
          break;
        }
        case 'K':
          R(2, 0, 28, 30, '#5b3a24');
          for (let i = 0; i < 3; i++) {
            R(4, 2 + i * 9, 24, 8, '#3b2516');
            const cols = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6'];
            for (let j = 0; j < 5; j++) R(5 + j * 5, 3 + i * 9, 4, 7, cols[(j + i + x) % 5]);
          }
          break;
        case 'W': {
          const left = MAP[y][x - 1] !== 'W';
          R(left ? 2 : 0, 2, 30, 22, '#f5f7fb');
          R(left ? 2 : 0, 2, 30, 2, '#b7bdcc');
          R(left ? 2 : 0, 24, 30, 3, '#9aa1b5');
          if (left) {
            R(6, 18, 3, 4, '#4f8cff');
            R(11, 14, 3, 8, '#4f8cff');
            R(16, 10, 3, 12, '#4f8cff');
            R(21, 7, 3, 15, '#2fbf71');
          } else {
            ctx.strokeStyle = '#e5484d';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(px + 2, py + 20);
            ctx.lineTo(px + 10, py + 14);
            ctx.lineTo(px + 18, py + 16);
            ctx.lineTo(px + 27, py + 7);
            ctx.stroke();
          }
          break;
        }
        case 'S': {
          const left = MAP[y][x - 1] !== 'S';
          const right = MAP[y][x + 1] !== 'S';
          R(left ? 3 : 0, 6, (left ? 29 : 32) - (right ? 3 : 0), 22, '#6c4ab6');
          R(left ? 3 : 0, 6, (left ? 29 : 32) - (right ? 3 : 0), 7, '#7e5cc9');
          if (left) R(3, 6, 5, 22, '#5a3b9c');
          if (right) R(24, 6, 5, 22, '#5a3b9c');
          break;
        }
        case 'C':
          R(6, 0, 20, 28, '#9aa1b5');
          R(8, 2, 16, 10, '#2b2e44');
          R(10, 4, 4, 2, '#e5484d');
          R(12, 16, 8, 8, '#2b2e44');
          R(13, 19, 6, 5, '#f5f7fb');
          R(14, 18, 4, 1, '#6b3e1f');
          break;
        case 'P':
          R(10, 18, 12, 12, '#a0522d');
          R(10, 18, 12, 3, '#8b4513');
          ctx.fillStyle = '#2fbf71';
          ctx.beginPath();
          ctx.arc(px + 16, py + 12, 9, 0, Math.PI * 2);
          ctx.arc(px + 10, py + 8, 6, 0, Math.PI * 2);
          ctx.arc(px + 22, py + 8, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#25a35f';
          ctx.beginPath();
          ctx.arc(px + 16, py + 4, 6, 0, Math.PI * 2);
          ctx.fill();
          break;
        case '=':
          // La salida ocupa dos tiles: se dibuja entera desde el primero.
          if (MAP[y][x - 1] !== '=') {
            R(0, 0, T * 2, T, '#1f2133');
            R(2, 0, T * 2 - 4, 28, '#0d0e15');
            R(T * 2 / 2 - 1, 0, 2, 28, '#1f2133');
            R(T - 16, 10, 32, 10, '#2fbf71');
            ctx.fillStyle = '#0d0e15';
            ctx.font = 'bold 7px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('SALIDA', px + T, py + 15.5);
            ctx.textAlign = 'left';
          }
          break;
        default:
          break;
      }
    },
  };

  AA.Office = Office;
})();
