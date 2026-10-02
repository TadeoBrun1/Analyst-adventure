/*
 * Analyst Adventure — La oficina: mundo 2D con vista cenital.
 * El jugador camina con WASD/flechas e interactúa con E/Espacio (o con clic).
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});

  const T = 32;
  // Leyenda: # pared · . piso de oficina · , piso de madera (comedor) · _ alfombra · | puerta
  //          D escritorio · B escritorio de la jefa · K biblioteca · W pizarra · G/g vidrio (vertical/horizontal)
  //          F heladera · Q mesada · C cafetera · k pileta · M microondas · A dispenser de agua
  //          V máquina expendedora · T mesa · h silla · X mesa ratona · S sofá · Y impresora
  //          P planta grande · p planta chica · = salida
  const MAP = [
    '############################',
    '#FQCQkMA#KP.WWW..PKGK.BB.PK#',
    '#,,,,,,,#..........G.......#',
    '#,,,,,,,#.DD...DD..|.......#',
    '#,hh,hh,#..........G.......#',
    '#,TT,TT,#.DD...DD..Gp.....p#',
    '#,hh,hh,P..........gggggggg#',
    '#,,,,,,,,..................#',
    '#,,,,,,,,...........______.#',
    '#,hh,hh,,.hhh.......__XXX_.#',
    '#,TT,TT,P.TTT.....Y.__SSS_.#',
    '#,hh,hh,#.hhh.......______.#',
    '#p,,,,VP#P........P.P.....P#',
    '#############==#############',
  ];
  const COLS = MAP[0].length;
  const ROWS = MAP.length;
  const WORLD_W = COLS * T;
  const WORLD_H = ROWS * T;
  const WALKABLE = new Set(['.', ',', '_', '|']);
  // Ventanas de la pared superior (columnas).
  const WINDOWS = new Set([2, 4, 15, 16, 21, 24]);

  const NPCS = [
    { id: 'marta', tx: 23, ty: 3, dir: 'down' },
    { id: 'leo', tx: 4, ty: 2, dir: 'down' },
    { id: 'camila', tx: 15, ty: 4, dir: 'up', sitting: true },
    { id: 'tadeo', tx: 15, ty: 6, dir: 'up', sitting: true },
    // en el comedor, frente a frente en la misma mesa
    { id: 'jean', tx: 2, ty: 9, dir: 'down', sitting: true },
    { id: 'juanroberto', tx: 2, ty: 11, dir: 'up', sitting: true },
  ];

  // Zonas interactivas (en tiles).
  const SPOTS = [
    { id: 'computer', x: 10, y: 3, w: 2, h: 1, label: { es: 'Usar computadora', en: 'Use computer' } },
    { id: 'whiteboard', x: 12, y: 1, w: 3, h: 1, label: { es: 'Plan de carrera', en: 'Career plan' } },
    { id: 'coffee', x: 3, y: 1, w: 1, h: 1, label: { es: 'Máquina de café', en: 'Coffee machine' } },
    { id: 'fridge', x: 1, y: 1, w: 1, h: 1, label: { es: 'Heladera', en: 'Fridge' } },
    { id: 'microwave', x: 6, y: 1, w: 1, h: 1, label: { es: 'Microondas', en: 'Microwave' } },
    { id: 'cooler', x: 7, y: 1, w: 1, h: 1, label: { es: 'Dispenser de agua', en: 'Water cooler' } },
    { id: 'lunch', x: 2, y: 5, w: 2, h: 1, label: { es: 'Mesa del comedor', en: 'Lunch table' } },
    { id: 'lunch', x: 5, y: 5, w: 2, h: 1, label: { es: 'Mesa del comedor', en: 'Lunch table' } },
    { id: 'lunch', x: 5, y: 10, w: 2, h: 1, label: { es: 'Mesa del comedor', en: 'Lunch table' } },
    { id: 'vending', x: 6, y: 12, w: 1, h: 1, label: { es: 'Máquina de snacks', en: 'Snack machine' } },
    { id: 'nico', x: 10, y: 5, w: 2, h: 1, label: { es: 'Escritorio vacío', en: 'Empty desk' } },
    { id: 'books', x: 9, y: 1, w: 1, h: 1, label: { es: 'Biblioteca', en: 'Bookshelf' } },
    { id: 'books', x: 18, y: 1, w: 1, h: 1, label: { es: 'Biblioteca', en: 'Bookshelf' } },
    { id: 'books', x: 20, y: 1, w: 1, h: 1, label: { es: 'Biblioteca', en: 'Bookshelf' } },
    { id: 'books', x: 26, y: 1, w: 1, h: 1, label: { es: 'Biblioteca', en: 'Bookshelf' } },
    { id: 'meeting', x: 10, y: 10, w: 3, h: 1, label: { es: 'Mesa de reuniones', en: 'Meeting table' } },
    { id: 'printer', x: 18, y: 10, w: 1, h: 1, label: { es: 'Impresora', en: 'Printer' } },
    { id: 'bossdesk', x: 22, y: 1, w: 2, h: 1, label: { es: 'Escritorio de Marta', en: "Marta's desk" } },
    { id: 'magazines', x: 22, y: 9, w: 3, h: 1, label: { es: 'Mesa ratona', en: 'Coffee table' } },
    { id: 'sofa', x: 22, y: 10, w: 3, h: 1, label: { es: 'Sofá', en: 'Sofa' } },
    { id: 'plant', x: 10, y: 1, w: 1, h: 1, label: { es: 'Planta', en: 'Plant' } },
    { id: 'plant', x: 17, y: 1, w: 1, h: 1, label: { es: 'Planta', en: 'Plant' } },
    { id: 'plant', x: 8, y: 6, w: 1, h: 1, label: { es: 'Planta', en: 'Plant' } },
    { id: 'plant', x: 8, y: 10, w: 1, h: 1, label: { es: 'Planta', en: 'Plant' } },
    { id: 'exit', x: 13, y: 13, w: 2, h: 1, label: { es: 'Salida', en: 'Exit' } },
  ];
  const START = { x: 14 * T + 16, y: 8 * T + 26 };
  // Sillas de oficina libres: la tuya (frente a tu computadora) y la de Nico, que está de vacaciones.
  // Las de Camila y Tadeo se dibujan junto con ellos.
  const CHAIRS = [
    { tx: 10, ty: 4, mine: true },
    { tx: 10, ty: 6 },
  ];

  const Office = {
    canvas: null,
    ctx: null,
    running: false,
    keys: new Set(),
    START,
    player: { x: START.x, y: START.y, dir: 'up', frame: 0, anim: 0, moving: false },
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
          label: (() => {
            const c = AA.State.CHARACTERS[n.id];
            const nick = c.short || AA.L(c.name).split(' ')[0];
            return { es: 'Hablar con ' + nick, en: 'Talk to ' + nick };
          })(),
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
      // y para los botones de arriba (libreta, carrera y menú), así no tapan el mapa
      const hud = c.parentElement && c.parentElement.querySelector('.hud-right');
      const top = hud && hud.offsetHeight ? hud.offsetTop + hud.offsetHeight + 6 : 0;
      const scale = Math.min(cw / WORLD_W, (ch - reserve - top) / WORLD_H);
      return { scale, ox: (cw - WORLD_W * scale) / 2, oy: top + (ch - reserve - top - WORLD_H * scale) / 2, dpr };
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
      if (CHAIRS.some((c) => !c.mine && c.tx === tx && c.ty === ty)) return true;
      return this.npcs.some((n) => n.tx === tx && n.ty === ty);
    },

    // El jugador se sienta en su silla antes de usar la computadora.
    sitAtDesk(then) {
      const c = CHAIRS.find((ch) => ch.mine);
      const p = this.player;
      p.x = c.tx * T + 16;
      p.y = c.ty * T + 20; // pegado al escritorio
      p.dir = 'up';
      p.frame = 0;
      p.sitting = true;
      this.keys.clear();
      this.lockUntil = performance.now() + 500;
      setTimeout(then, 420);
    },
    standUp() {
      this.player.sitting = false;
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
      if (!this.paused() && !(this.lockUntil > performance.now())) {
        if (this.keys.has('arrowleft') || this.keys.has('a')) dx -= 1;
        if (this.keys.has('arrowright') || this.keys.has('d')) dx += 1;
        if (this.keys.has('arrowup') || this.keys.has('w')) dy -= 1;
        if (this.keys.has('arrowdown') || this.keys.has('s')) dy += 1;
      }
      p.moving = dx !== 0 || dy !== 0;
      if (p.moving && p.sitting) p.sitting = false; // te levantás al caminar
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
      ctx.fillStyle = '#1a1712';
      ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
      ctx.setTransform(v.dpr * v.scale, 0, 0, v.dpr * v.scale, v.dpr * v.ox, v.dpr * v.oy);
      ctx.imageSmoothingEnabled = false;

      const markers = this.getMarkers ? this.getMarkers() : {};
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) this.drawTile(x, y, markers);
      this.drawLight();

      // Personajes ordenados por profundidad.
      const actors = this.npcs.map((n) => ({ y: n.y, draw: () => this.drawNpc(n) }));
      const p = this.player;
      for (const c of CHAIRS) {
        const cx = c.tx * T + 16;
        const cy = c.ty * T + (c.mine ? 20 : 26);
        if (c.mine && p.sitting) continue;
        actors.push({ y: cy - 0.5, draw: () => this.drawChair(cx, cy, null) });
      }
      actors.push({
        y: p.y,
        draw: () => {
          const ch = AA.State.CHARACTERS.player;
          if (p.sitting) this.drawChair(p.x, p.y, () => AA.Sprites.drawChar(ctx, p.x, p.y, ch, 'up', 0, { sitting: true }));
          else AA.Sprites.drawChar(ctx, p.x, p.y, ch, p.dir, p.frame);
        },
      });
      actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());

      // Marcadores "!"
      const bounce = Math.sin(this.t * 5) * 2;
      const pc = SPOTS.find((s) => s.id === 'computer');
      const wb = SPOTS.find((s) => s.id === 'whiteboard');
      if (markers.computer) this.drawMarker((pc.x + pc.w / 2) * T, pc.y * T - 14 + bounce, '#ffd23f');
      for (const n of this.npcs) if (markers[n.id]) this.drawMarker(n.x, n.y - 46 + bounce, '#ffd23f');
      if (markers.whiteboard) this.drawMarker((wb.x + wb.w / 2) * T, wb.y * T - 8 + bounce, '#7cf29a');

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
      const text = (canUse ? 'E · ' : '') + AA.L(s.label);
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
      const drawIt = () => AA.Sprites.drawChar(ctx, n.x, n.y, c, dir, 0, { sitting: n.sitting });
      if (n.sitting && MAP[n.ty][n.tx] !== 'h') this.drawChair(n.x, n.y, drawIt);
      else {
        drawIt();
        if (n.sitting && dir === 'up') {
          // respaldo de la silla del comedor, delante de quien está sentado de espaldas
          const col = ['#e07a5f', '#f2cc8f', '#81b29a', '#3d5a80'][(n.tx + n.ty) % 4];
          ctx.fillStyle = AA.Sprites.shade(col, -35);
          ctx.fillRect(n.x - 8, n.y - 8, 16, 6);
        }
      }
      if (n.id === 'leo') {
        // Leo siempre tiene un café en la mano.
        const hx = n.x + (dir === 'left' ? -12 : 8);
        ctx.fillStyle = '#f7f1e3';
        ctx.fillRect(hx, n.y - 13, 5, 6);
        ctx.fillStyle = '#7a4a2a';
        ctx.fillRect(hx, n.y - 13, 5, 1);
        if (Math.sin(this.t * 2) > -0.3) {
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.fillRect(hx + 1, n.y - 17 - ((this.t * 6) % 3), 1, 2);
          ctx.fillRect(hx + 3, n.y - 19 + ((this.t * 6) % 3), 1, 2);
        }
      }
    },

    // Silla de oficina vista desde atrás (la persona mira al escritorio). sit: dibuja a quien está sentado.
    drawChair(x, y, sit) {
      const ctx = this.ctx;
      const R = (dx, dy, w, h, col) => {
        ctx.fillStyle = col;
        ctx.fillRect(x + dx, y + dy, w, h);
      };
      // base con rueditas y asiento
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(x, y - 1, 10, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      R(-9, -3, 4, 2, '#2b2e3a');
      R(5, -3, 4, 2, '#2b2e3a');
      R(-2, -3, 4, 2, '#2b2e3a');
      R(-1, -7, 2, 5, '#3a3d4a');
      R(-9, -17, 18, 10, '#55678f');
      R(-9, -17, 18, 2, '#6a7ca3');
      if (sit) sit();
      // respaldo (adelante de la espalda)
      R(-8, -14, 16, 11, '#3d4c6e');
      R(-8, -14, 16, 2, '#51628a');
      R(-10, -12, 2, 6, '#2b2e3a');
      R(8, -12, 2, 6, '#2b2e3a');
    },

    zone(x, y) {
      if (x <= 8) return 'kitchen';
      if (x >= 20 && y <= 5) return 'boss';
      return 'office';
    },
    isRug(x, y) {
      const ch = MAP[y] && MAP[y][x];
      return ch === '_' || ((ch === 'X' || ch === 'S') && x >= 20);
    },

    drawFloor(x, y) {
      const ctx = this.ctx;
      const px = x * T;
      const py = y * T;
      const R = (dx, dy, w, h, col) => {
        ctx.fillStyle = col;
        ctx.fillRect(px + dx, py + dy, w, h);
      };
      const z = this.zone(x, y);
      if (z === 'kitchen') {
        // tablones de madera clara
        R(0, 0, T, T, '#d9ad78');
        for (let i = 0; i < 4; i++) {
          if ((i + x + y) % 3 === 0) R(0, i * 8, T, 8, '#d2a46f');
          R(0, i * 8 + 7, T, 1, '#b98a57');
          const seam = ((x * 7 + y * 3 + i * 11) % 4) * 8;
          R(seam, i * 8, 1, 7, '#c4955f');
        }
      } else if (z === 'boss') {
        R(0, 0, T, T, '#b4855a');
        for (let i = 0; i < 4; i++) {
          if ((i + x) % 2 === 0) R(0, i * 8, T, 8, '#ad7f54');
          R(0, i * 8 + 7, T, 1, '#94693f');
          R(((x * 5 + i * 13) % 4) * 8, i * 8, 1, 7, '#9c7148');
        }
      } else {
        // alfombra de oficina suave
        R(0, 0, T, T, (x + y) % 2 ? '#c9d1dd' : '#c4ccd9');
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(px, py, T, 1);
        ctx.fillRect(px, py, 1, T);
      }
      if (this.isRug(x, y)) {
        const up = this.isRug(x, y - 1);
        const down = this.isRug(x, y + 1);
        const left = this.isRug(x - 1, y);
        const right = this.isRug(x + 1, y);
        R(left ? 0 : 3, up ? 0 : 3, T - (left ? 0 : 3) - (right ? 0 : 3), T - (up ? 0 : 3) - (down ? 0 : 3), '#3f9b8f');
        if (!up) R(left ? 0 : 3, 3, T - (left ? 0 : 3) - (right ? 0 : 3), 3, '#e8c872');
        if (!down) R(left ? 0 : 3, T - 6, T - (left ? 0 : 3) - (right ? 0 : 3), 3, '#e8c872');
        if (!left) R(3, up ? 0 : 3, 3, T - (up ? 0 : 3) - (down ? 0 : 3), '#e8c872');
        if (!right) R(T - 6, up ? 0 : 3, 3, T - (up ? 0 : 3) - (down ? 0 : 3), '#e8c872');
        if ((x + y) % 2 === 0) R(14, 14, 4, 4, '#5bb5a8');
      }
    },

    // Luz que entra por las ventanas.
    drawLight() {
      const ctx = this.ctx;
      ctx.fillStyle = 'rgba(255,240,200,0.1)';
      for (const wx of WINDOWS) {
        const px = wx * T;
        ctx.beginPath();
        ctx.moveTo(px + 4, T);
        ctx.lineTo(px + 28, T);
        ctx.lineTo(px + 40, T * 3);
        ctx.lineTo(px + 8, T * 3);
        ctx.closePath();
        ctx.fill();
      }
    },

    drawPlant(px, py, big, seed) {
      const ctx = this.ctx;
      const R = (dx, dy, w, h, col) => {
        ctx.fillStyle = col;
        ctx.fillRect(px + dx, py + dy, w, h);
      };
      const blob = (cx, cy, r, col) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(px + cx, py + cy, r, 0, Math.PI * 2);
        ctx.fill();
      };
      // sombra
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(px + 16, py + 29, 11, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      const pot = ['#d9734e', '#e9e3d5', '#6c8ebf'][seed % 3];
      if (big) {
        R(9, 18, 14, 11, pot);
        R(8, 17, 16, 3, AA.Sprites.shade(pot, -25));
        R(10, 27, 12, 2, AA.Sprites.shade(pot, -40));
        // hojas que sobresalen hacia arriba
        const sway = Math.sin(this.t * 1.3 + seed) * 0.8;
        blob(16 + sway, 6, 9, '#2f8f5b');
        blob(9 + sway, 0, 6, '#3aa76a');
        blob(23 + sway, -1, 6, '#3aa76a');
        blob(16 + sway, -8, 7, '#48bb78');
        blob(11 + sway, 10, 6, '#2f8f5b');
        blob(21 + sway, 10, 6, '#2f8f5b');
        blob(14 + sway, -4, 3, '#68d391');
        blob(21 + sway, 3, 2.5, '#68d391');
      } else {
        R(11, 20, 10, 9, pot);
        R(10, 19, 12, 2, AA.Sprites.shade(pot, -25));
        blob(16, 14, 6, '#3aa76a');
        blob(12, 11, 4, '#48bb78');
        blob(20, 11, 4, '#48bb78');
        blob(16, 8, 3, '#68d391');
      }
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
      const at = (xx, yy) => (MAP[yy] && MAP[yy][xx]) || '#';
      const isWall = (c) => c === '#' || c === '=';
      const counter = () => {
        R(0, -4, T, 12, '#efe6d6');
        R(0, -4, T, 2, '#fbf6ec');
        R(0, 8, T, 20, '#7fa7a0');
        R(0, 26, T, 2, '#5d827c');
        R(15, 10, 2, 16, '#6a938c');
        R(11, 16, 2, 4, '#e8c872');
        R(19, 16, 2, 4, '#e8c872');
      };

      if (!isWall(ch)) this.drawFloor(x, y);
      switch (ch) {
        case '#': {
          const interior = x > 0 && x < COLS - 1 && y > 0 && y < ROWS - 1 && !isWall(at(x - 1, y)) && !isWall(at(x + 1, y));
          const below = at(x, y + 1);
          if (interior) {
            // tabique fino entre el comedor y la oficina
            this.drawFloor(x, y);
            R(10, 0, 12, T, '#8a7462');
            R(10, 0, 2, T, '#a08a76');
            if (!isWall(below)) {
              R(10, 14, 12, 18, '#efe3c8');
              R(10, 28, 12, 4, '#a07a55');
            }
            break;
          }
          R(0, 0, T, T, '#6b5a4c');
          R(0, 0, T, 2, '#7e6b5b');
          if (!isWall(below)) {
            // cara de la pared, color crema con zócalo
            R(0, 10, T, 22, '#efe3c8');
            R(0, 10, T, 2, '#d8c9a9');
            R(0, 27, T, 5, '#a07a55');
            R(0, 27, T, 1, '#b8916a');
            if (y === 0 && WINDOWS.has(x)) {
              R(3, 2, 26, 24, '#f7f1e3');
              R(5, 4, 22, 20, '#a9d8f5');
              R(5, 15, 22, 9, '#8cc6a5');
              R(7 + (x % 3) * 3, 13, 6, 11, '#6aa985');
              R(17, 10 + (x % 2) * 4, 7, 14, '#78b893');
              R(15, 4, 2, 20, '#f7f1e3');
              R(5, 13, 22, 1, '#f7f1e3');
              // nubecita
              R(8 + (x % 4) * 2, 6, 7, 3, '#ffffff');
              R(10 + (x % 4) * 2, 5, 4, 1, '#ffffff');
            } else if (y === 0 && x === 11) {
              // reloj
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(px + 16, py + 17, 7, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#4a4036';
              ctx.lineWidth = 1.5;
              ctx.stroke();
              const a = this.t * 0.4;
              ctx.beginPath();
              ctx.moveTo(px + 16, py + 17);
              ctx.lineTo(px + 16 + Math.cos(a) * 5, py + 17 + Math.sin(a) * 5);
              ctx.moveTo(px + 16, py + 17);
              ctx.lineTo(px + 16, py + 13);
              ctx.stroke();
            } else if (y === 0 && (x === 22 || x === 23)) {
              // cuadros en la oficina de Marta
              R(8, 12, 16, 12, '#4a4036');
              R(10, 14, 12, 8, x === 22 ? '#f2cc8f' : '#81b29a');
              R(12, 18, 3, 4, '#e07a5f');
              R(16, 16, 3, 6, '#3d5a80');
            }
          }
          break;
        }
        case 'G':
          R(13, 0, 6, T, 'rgba(170,220,255,0.45)');
          R(14, 2, 1, T - 4, 'rgba(255,255,255,0.8)');
          R(12, 0, 1, T, '#8a9bb0');
          R(19, 0, 1, T, '#8a9bb0');
          break;
        case 'g': {
          R(0, 6, T, 14, 'rgba(170,220,255,0.45)');
          R(0, 8, T, 1, 'rgba(255,255,255,0.8)');
          R(0, 5, T, 1, '#8a9bb0');
          R(0, 20, T, 3, '#8a9bb0');
          if (at(x - 1, y) !== 'g') R(12, 0, 8, 23, '#8a9bb0');
          break;
        }
        case '|':
          R(11, 0, 2, T, '#a07a55');
          R(19, 0, 2, T, '#a07a55');
          break;
        case 'D':
        case 'B': {
          const left = at(x - 1, y) !== ch;
          const wood = ch === 'B' ? '#7a4e30' : '#c8a27a';
          R(left ? 2 : 0, 6, 30, 20, wood);
          R(left ? 2 : 0, 6, 30, 2, AA.Sprites.shade(wood, 20));
          R(left ? 2 : 0, 24, 30, 4, AA.Sprites.shade(wood, -35));
          if (left) {
            const mine = SPOTS.find((s) => s.id === 'computer');
            const nico = SPOTS.find((s) => s.id === 'nico');
            const isMine = ch === 'D' && x === mine.x && y === mine.y;
            const off = ch === 'D' && x === nico.x && y === nico.y;
            const glow = isMine && markers.computer ? (Math.sin(this.t * 4) > 0 ? '#9be7ff' : '#5fc8ff') : ch === 'B' ? '#c9d6ff' : '#6fd3ff';
            R(10, 0, 20, 14, '#2b2e3a');
            R(12, 2, 16, 10, off ? '#3a3e50' : glow);
            if (!off) {
              R(14, 4, 8, 1, 'rgba(0,0,0,0.25)');
              R(14, 7, 11, 1, 'rgba(0,0,0,0.25)');
            }
            R(18, 14, 4, 3, '#2b2e3a');
            // plantita de escritorio o portalápices
            if (ch === 'D' && !off) {
              R(3, 12, 5, 5, '#e07a5f');
              R(3, 9, 5, 3, '#48bb78');
            }
          } else {
            // teclado, taza y post-its
            R(2, 12, 16, 6, '#eef0f5');
            R(3, 13, 14, 1, '#b8bfcc');
            R(22, 10, 6, 7, ch === 'B' ? '#e74c3c' : '#ffffff');
            R(23, 11, 4, 1, '#7a4a2a');
            if (ch === 'D') R(20, 19, 6, 5, (x + y) % 2 ? '#ffe066' : '#ff9fb2');
          }
          break;
        }
        case 'K':
          R(2, -6, 28, 34, '#7a4e30');
          R(2, -6, 28, 2, '#8f5f3c');
          for (let i = 0; i < 3; i++) {
            R(4, -3 + i * 10, 24, 8, '#4f3220');
            const cols = ['#e07a5f', '#3d5a80', '#f2cc8f', '#81b29a', '#9b72cf'];
            for (let j = 0; j < 5; j++) R(5 + j * 5, -2 + i * 10 + ((j + x) % 2), 4, 7 - ((j + x) % 2), cols[(j + i + x) % 5]);
          }
          break;
        case 'W': {
          const left = at(x - 1, y) !== 'W';
          const right = at(x + 1, y) !== 'W';
          R(left ? 2 : 0, -4, right ? 30 : 32, 26, '#ffffff');
          R(left ? 2 : 0, -4, right ? 30 : 32, 2, '#b7bdcc');
          R(left ? 2 : 0, 22, right ? 30 : 32, 3, '#9aa1b5');
          if (left) {
            R(6, 14, 3, 4, '#4f8cff');
            R(11, 10, 3, 8, '#4f8cff');
            R(16, 6, 3, 12, '#4f8cff');
            R(21, 2, 3, 16, '#2fbf71');
          } else if (right) {
            R(6, 0, 18, 2, '#9aa1b5');
            R(6, 5, 14, 2, '#9aa1b5');
            R(6, 10, 16, 2, '#9aa1b5');
            R(4, 14, 9, 7, '#ffe066');
            R(15, 15, 9, 6, '#ff9fb2');
          } else {
            ctx.strokeStyle = '#e5484d';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(px + 2, py + 16);
            ctx.lineTo(px + 10, py + 10);
            ctx.lineTo(px + 18, py + 12);
            ctx.lineTo(px + 28, py + 2);
            ctx.stroke();
          }
          break;
        }
        case 'S': {
          // sofá mirando hacia arriba (respaldo abajo)
          const left = at(x - 1, y) !== 'S';
          const right = at(x + 1, y) !== 'S';
          const x0 = left ? 2 : 0;
          const w = 32 - (left ? 2 : 0) - (right ? 2 : 0);
          R(x0, 4, w, 24, '#e07a5f');
          R(x0, 20, w, 8, '#c4634a');
          R(x0, 4, w, 2, '#ec9a83');
          if (left) R(2, 4, 6, 24, '#c4634a');
          if (right) R(24, 4, 6, 24, '#c4634a');
          if (!left && !right) R(0, 6, 1, 13, '#c4634a');
          // almohadón
          if (left) R(9, 8, 9, 8, '#f2cc8f');
          break;
        }
        case 'X': {
          const left = at(x - 1, y) !== 'X';
          const right = at(x + 1, y) !== 'X';
          R(left ? 3 : 0, 9, 32 - (left ? 3 : 0) - (right ? 3 : 0), 14, '#9c6b43');
          R(left ? 3 : 0, 9, 32 - (left ? 3 : 0) - (right ? 3 : 0), 2, '#b7845a');
          R(left ? 3 : 0, 21, 32 - (left ? 3 : 0) - (right ? 3 : 0), 2, '#7a4e30');
          if (left) {
            R(8, 12, 10, 7, '#3d5a80');
            R(10, 13, 10, 7, '#f2cc8f');
          } else if (right) {
            R(6, 12, 6, 7, '#ffffff');
            R(7, 13, 4, 1, '#7a4a2a');
          } else {
            R(11, 15, 10, 6, '#e9e3d5');
            ctx.fillStyle = '#48bb78';
            ctx.beginPath();
            ctx.arc(px + 16, py + 11, 5, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
        case 'T': {
          const kitchen = this.zone(x, y) === 'kitchen';
          const left = at(x - 1, y) !== 'T';
          const right = at(x + 1, y) !== 'T';
          const top = kitchen ? '#f4ead7' : '#8a6243';
          const x0 = left ? 3 : 0;
          const w = 32 - (left ? 3 : 0) - (right ? 3 : 0);
          R(x0, 2, w, 24, top);
          R(x0, 2, w, 2, AA.Sprites.shade(top, 15));
          R(x0, 24, w, 4, AA.Sprites.shade(top, -45));
          if (kitchen) {
            // mantel a cuadros, plato y taza
            for (let i = 0; i * 7 + 6 <= w; i++) for (let j = 0; j < 3; j++) if ((i + j + x) % 2 === 0) R(x0 + i * 7, 4 + j * 7, 6, 6, 'rgba(224,122,95,0.2)');
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(px + (left ? 18 : 12), py + 14, 6, 0, Math.PI * 2);
            ctx.fill();
            R(left ? 15 : 9, 12, 6, 4, left ? '#f2cc8f' : '#81b29a');
            if (right) R(22, 8, 5, 6, '#3d5a80');
          } else {
            if (left) {
              R(8, 8, 14, 9, '#3a3d4a');
              R(9, 9, 12, 7, '#9be7ff');
            } else if (right) {
              R(6, 9, 10, 13, '#ffffff');
              R(8, 12, 6, 1, '#b8bfcc');
              R(8, 15, 6, 1, '#b8bfcc');
            } else {
              R(8, 10, 16, 10, '#ffffff');
              R(10, 16, 3, 3, '#4f8cff');
              R(14, 13, 3, 6, '#4f8cff');
              R(18, 11, 3, 8, '#2fbf71');
            }
          }
          break;
        }
        case 'h': {
          const kitchen = this.zone(x, y) === 'kitchen';
          const tableBelow = at(x, y + 1) === 'T';
          const col = kitchen ? ['#e07a5f', '#f2cc8f', '#81b29a', '#3d5a80'][(x + y) % 4] : '#5b6b8c';
          R(8, 8, 16, 14, col);
          R(8, tableBelow ? 4 : 22, 16, 6, AA.Sprites.shade(col, -35));
          R(9, tableBelow ? 22 : 5, 2, 4, '#4a4036');
          R(21, tableBelow ? 22 : 5, 2, 4, '#4a4036');
          break;
        }
        case 'Q':
          counter();
          if (x % 4 === 2) {
            // frutera
            ctx.fillStyle = '#e9e3d5';
            ctx.fillRect(px + 8, py - 2, 14, 5);
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(px + 12, py - 3, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(px + 18, py - 3, 3, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // frasco de galletitas
            R(11, -7, 10, 9, 'rgba(230,240,250,0.9)');
            R(10, -9, 12, 3, '#c4634a');
            R(13, -3, 3, 3, '#b07a45');
            R(17, -4, 3, 3, '#b07a45');
          }
          break;
        case 'C':
          counter();
          R(7, -16, 18, 20, '#3a3d4a');
          R(7, -16, 18, 3, '#50546a');
          R(10, -11, 12, 6, '#1f2129');
          R(12, -9, 3, 2, (Math.sin(this.t * 3) > 0 ? '#ff6b6b' : '#e5484d'));
          R(17, -9, 3, 2, '#7cf29a');
          R(13, -3, 6, 5, '#ffffff');
          R(14, -2, 4, 1, '#7a4a2a');
          break;
        case 'k':
          counter();
          R(5, -2, 22, 9, '#b8c4d0');
          R(7, -1, 18, 6, '#8fa2b5');
          R(15, -9, 2, 8, '#9aa1b5');
          R(13, -9, 6, 2, '#9aa1b5');
          break;
        case 'M':
          counter();
          R(3, -14, 26, 16, '#e9edf2');
          R(5, -12, 16, 12, '#2b2e3a');
          R(6, -11, 6, 4, 'rgba(255,255,255,0.18)');
          R(23, -12, 4, 2, '#7cf29a');
          R(23, -8, 4, 1, '#9aa1b5');
          R(23, -6, 4, 1, '#9aa1b5');
          break;
        case 'F':
          R(3, -16, 26, 44, '#f4f6f8');
          R(3, -16, 26, 2, '#ffffff');
          R(3, 2, 26, 1, '#c5ccd6');
          R(26, -12, 2, 10, '#9aa1b5');
          R(26, 6, 2, 12, '#9aa1b5');
          R(27, 3, 2, 25, '#d5dbe3');
          // imanes y una lista
          R(7, -10, 8, 10, '#ffe066');
          R(8, -8, 6, 1, '#b8a040');
          R(8, -6, 5, 1, '#b8a040');
          R(17, -8, 4, 4, '#e07a5f');
          R(9, 8, 4, 4, '#3d5a80');
          break;
        case 'A':
          R(9, -12, 14, 14, 'rgba(120,190,255,0.85)');
          R(11, -14, 10, 3, '#5aa0e0');
          R(12, -10, 3, 9, 'rgba(255,255,255,0.5)');
          R(7, 2, 18, 26, '#f4f6f8');
          R(7, 26, 18, 2, '#c5ccd6');
          R(10, 9, 4, 3, '#5aa0e0');
          R(18, 9, 4, 3, '#e5484d');
          R(10, 16, 12, 2, '#9aa1b5');
          break;
        case 'V':
          R(2, -14, 28, 42, '#d64545');
          R(2, -14, 28, 3, '#e86a6a');
          R(5, -10, 17, 30, '#2b2e3a');
          for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) R(7 + j * 5, -8 + i * 7, 4, 5, ['#f2cc8f', '#81b29a', '#e07a5f', '#9be7ff'][(i + j) % 4]);
          R(24, -8, 4, 8, '#2b2e3a');
          R(24, 2, 4, 2, '#e8c872');
          R(5, 22, 17, 4, '#1f2129');
          break;
        case 'Y':
          R(3, 8, 26, 18, '#dde1e8');
          R(3, 8, 26, 2, '#f4f6f8');
          R(3, 24, 26, 2, '#a7aebb');
          R(8, 3, 16, 7, '#ffffff');
          R(7, 14, 18, 3, '#2b2e3a');
          R(23, 19, 3, 2, '#7cf29a');
          break;
        case 'P':
          this.drawPlant(px, py, true, x + y);
          break;
        case 'p':
          this.drawPlant(px, py, false, x + y);
          break;
        case '=':
          // La salida ocupa dos tiles: se dibuja entera desde el primero.
          if (at(x - 1, y) !== '=') {
            R(0, 0, T * 2, T, '#6b5a4c');
            R(2, 0, T * 2 - 4, 28, '#8a6243');
            R(T - 1, 0, 2, 28, '#6b5a4c');
            R(T - 16, 8, 32, 11, '#2fbf71');
            R(T - 8, 22, 3, 3, '#e8c872');
            R(T + 5, 22, 3, 3, '#e8c872');
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 7px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(AA.T('SALIDA', 'EXIT'), px + T, py + 14);
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
