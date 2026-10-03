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
  //          P planta grande · p planta chica · R máquina arcade · Z cofre de recompensas · = salida
  const MAP = [
    '############################',
    '#FQCQkMA#KP.WWW..PKGK.BB.PK#',
    '#,,,,,,,#..........G.......#',
    '#,,,,,,,#.DD...DD..|.......#',
    '#,hh,hh,#..........G.......#',
    '#,TT,TT,#.DD...DD..Gp.....p#',
    '#,hh,hh,P..........gggggggg#',
    '#,,,,,,,,..............RZ..#',
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
    // Nico vuelve de vacaciones cuando llegás a Semi-Senior.
    { id: 'nico', tx: 10, ty: 6, dir: 'up', sitting: true, when: () => nicoBack() },
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
    {
      id: 'nico',
      x: 10,
      y: 5,
      w: 2,
      h: 1,
      get label() {
        return nicoBack() ? { es: 'Escritorio de Nico', en: "Nico's desk" } : { es: 'Escritorio vacío', en: 'Empty desk' };
      },
    },
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
    {
      id: 'arcade',
      x: 23,
      y: 7,
      w: 1,
      h: 1,
      get label() {
        return arcadeOn() ? { es: '🕹️ ARCADE', en: '🕹️ ARCADE' } : { es: 'Máquina arcade (averiada)', en: 'Arcade machine (broken)' };
      },
    },
  ];
  SPOTS.push({
    id: 'chest',
    x: 24,
    y: 7,
    w: 1,
    h: 1,
    label: { es: '🎁 Cofre de recompensas', en: '🎁 Rewards chest' },
  });
  SPOTS.push(
    { id: 'turntable', x: 26, y: 7, w: 1, h: 1, label: { es: '🎵 Tocadiscos', en: '🎵 Record player' }, when: () => decorOn('turntable') },
    { id: 'dancebtn', x: 19, y: 8, w: 1, h: 1, label: { es: '🕺 ¡A bailar! (B)', en: '🕺 Dance! (B)' }, when: () => decorOn('dancebtn') }
  );
  const START = { x: 14 * T + 16, y: 8 * T + 26 };
  const DANCE_SECS = 6.4;
  // Comentarios de quienes te ven bailar (se elige uno al azar).
  const DANCE_LINES = [
    { es: '<b>Leo</b>: ¡Esos pasos no los enseñan en la facultad!', en: "<b>Leo</b>: They don't teach those moves in college!" },
    { es: '<b>Camila</b>: ¡Trabajando y bailando se saca este país adelante!', en: '<b>Camila</b>: Working and dancing, that\'s how we move forward!' },
    { es: '<b>Tadeo</b>: No tengo idea de qué estás haciendo, ¡pero algo estás haciendo!', en: "<b>Tadeo</b>: I have no idea what you're doing, but you're doing something!" },
    { es: '<b>Jean</b>: Ese giro tiene la solidez del concreto. Respeto.', en: '<b>Jean</b>: That spin has the solidity of concrete. Respect.' },
    { es: '<b>Juan Roberto</b>: «Bailad, bailad, que la vida es breve»… o algo así.', en: '<b>Juan Roberto</b>: "Dance, dance, for life is brief"… or something like that.' },
    { es: '<b>Marta</b> (desde su oficina): Muy lindo, ¿y los informes? 😄', en: '<b>Marta</b> (from her office): Very nice, and the reports? 😄' },
  ];
  const decorOn = (id) => !!(AA.Decor && AA.Decor.on(id));
  // Mascotas (recompensas del ARCADE): pasean por la oficina y se las puede acariciar.
  const PETS = {
    cat: { speed: 42, name: { es: 'Michi', en: 'Michi' }, start: [21, 11] },
    dog: { speed: 58, name: { es: 'Firulais', en: 'Firulais' }, start: [14, 9] },
  };
  const arcadeOn = () => !!(AA.State && AA.State.data && AA.State.rankIndex() >= 1);
  const nicoBack = () => !!(AA.State && AA.State.data && AA.State.rankIndex() >= 2);
  // Sillas de oficina libres: la tuya (frente a tu computadora) y la de Nico, que está de vacaciones.
  // Las de Camila y Tadeo se dibujan junto con ellos.
  const CHAIRS = [
    { tx: 10, ty: 4, mine: true },
    { tx: 10, ty: 6, owner: 'nico' },
  ];

  const Office = {
    MAP,
    SPOTS,
    WALKABLE,
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
          when: n.when,
          label: (() => {
            const c = AA.State.CHARACTERS[n.id];
            const nick = c.short || AA.L(c.name).split(' ')[0];
            return { es: 'Hablar con ' + nick, en: 'Talk to ' + nick };
          })(),
        }))
      );

      this.activeNpcs = () => this.npcs.filter((n) => !n.when || n.when());
      this.activeSpots = () => this.spots.filter((sp) => !sp.when || sp.when());

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
      const pet = (this.pets || []).find((p) => Math.abs(p.x - x) < 14 && y > p.y - 22 && y < p.y + 4);
      if (pet) return this.petSpots().find((s) => s.id === 'pet:' + pet.kind);
      const tx = Math.floor(x / T);
      const ty = Math.floor(y / T);
      // Los personajes se dibujan más altos que su tile: también cuenta el tile de arriba.
      const npc = this.activeSpots().find((s) => s.npc && tx === s.x && (ty === s.y || ty === s.y - 1));
      if (npc) return npc;
      return this.activeSpots().find((s) => !s.npc && tx >= s.x && tx < s.x + s.w && ty >= s.y && ty < s.y + s.h) || null;
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
      if (CHAIRS.some((c) => !c.mine && c.tx === tx && c.ty === ty)) return true; // (la de Nico, vacía u ocupada)
      if (AA.Decor && AA.Decor.solidTiles().some(([x, y]) => x === tx && y === ty)) return true;
      return this.activeNpcs().some((n) => n.tx === tx && n.ty === ty);
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
      if (p.dance && (p.moving || this.t - p.dance.t0 > DANCE_SECS)) this.stopDance();
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
      this.updatePets(dt);
      // Lo más cercano con lo que se puede interactuar.
      let best = null;
      let bestD = 30;
      for (const s of this.activeSpots().concat(this.petSpots())) {
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

    // --- Baile (recompensa «Botón de baile»): breakdance con luces de colores.
    dance() {
      const p = this.player;
      if (!decorOn('dancebtn') || this.paused()) return;
      if (p.dance) return;
      p.sitting = false;
      p.dance = { t0: this.t };
      this.keys.clear();
      AA.Audio.play('select');
      AA.Audio.breakbeat(4);
      this.prevDuck = AA.Audio.duck;
      AA.Audio.setDuck(0.25);
      // Si hay alguien cerca, comenta.
      const near = this.activeNpcs().some((n) => Math.hypot(n.x - p.x, n.y - p.y) < 260);
      if (near || Math.random() < 0.5) setTimeout(() => this.player.dance && AA.UI.toast('🕺 ' + AA.L(DANCE_LINES[Math.floor(Math.random() * DANCE_LINES.length)]), 'info'), 1800);
      // los gatos y perros cercanos se acercan a mirar (y se ponen contentos)
      for (const pet of this.pets || []) if (Math.hypot(pet.x - p.x, pet.y - p.y) < 160) {
        pet.happy = 3;
        pet.state = 'idle';
        pet.path = [];
        pet.face = p.x < pet.x ? 'left' : 'right';
      }
    },
    stopDance() {
      if (!this.player.dance) return;
      this.player.dance = null;
      AA.Audio.setDuck(this.prevDuck === undefined ? 1 : this.prevDuck);
    },
    drawDancer(p, ch) {
      const ctx = this.ctx;
      const dt = this.t - p.dance.t0;
      // luces de discoteca en el piso
      const cols = ['rgba(255,79,216,0.28)', 'rgba(79,209,255,0.28)', 'rgba(255,210,63,0.28)', 'rgba(124,242,154,0.28)'];
      for (let k = 0; k < 6; k++) {
        const a = dt * 2.2 + (k * Math.PI) / 3;
        ctx.fillStyle = cols[k % cols.length];
        ctx.beginPath();
        ctx.ellipse(p.x + Math.cos(a) * 34, p.y + Math.sin(a) * 14 - 2, 9, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // bola disco que baja sobre la cabeza
      const by = p.y - 70 + Math.min(1, dt * 2) * 8;
      ctx.strokeStyle = '#9aa1b5';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, by - 30);
      ctx.lineTo(p.x, by - 6);
      ctx.stroke();
      ctx.fillStyle = '#c9ced6';
      ctx.beginPath();
      ctx.arc(p.x, by, 6, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = (i + Math.floor(dt * 8)) % 2 ? '#ffffff' : '#8f96a3';
        ctx.fillRect(p.x - 5 + (i % 3) * 3.5, by - 4 + Math.floor(i / 3) * 4, 2.5, 2.5);
      }
      // pasos: toprock → giros → headspin → molino con pose final
      const phase = Math.floor(dt / 1.6) % 4;
      const lt = dt % 1.6;
      const turn = ['down', 'right', 'up', 'left'];
      const cx = p.x;
      const cy = p.y - 18;
      ctx.save();
      if (phase === 0) {
        const step = Math.floor(lt / 0.2);
        const bounce = Math.abs(Math.sin(lt * 15)) * 3;
        ctx.translate(0, -bounce);
        AA.Sprites.drawChar(ctx, p.x + (step % 2 ? 2 : -2), p.y, ch, step % 2 ? 'left' : 'right', 1 + (step % 2));
      } else if (phase === 1) {
        AA.Sprites.drawChar(ctx, p.x, p.y, ch, turn[Math.floor(lt / 0.08) % 4], 0);
      } else if (phase === 2) {
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI + Math.sin(lt * 6) * 0.08);
        ctx.translate(-cx, -cy);
        AA.Sprites.drawChar(ctx, p.x, p.y - 6, ch, turn[Math.floor(lt / 0.1) % 4], 0);
      } else {
        const ang = lt < 1.2 ? lt * 9 : -Math.PI / 2;
        ctx.translate(cx, cy + 8);
        ctx.rotate(ang);
        ctx.translate(-cx, -(cy + 8));
        AA.Sprites.drawChar(ctx, p.x, p.y, ch, lt < 1.2 ? turn[Math.floor(lt / 0.1) % 4] : 'right', lt < 1.2 ? 0 : 2);
      }
      ctx.restore();
      // notas musicales
      ctx.font = 'bold 9px "Inter", sans-serif';
      for (let k = 0; k < 3; k++) {
        const ph = (dt * 0.7 + k / 3) % 1;
        ctx.fillStyle = `rgba(${['255,79,216', '79,209,255', '255,210,63'][k]},${1 - ph})`;
        ctx.fillText(k % 2 ? '♫' : '♪', p.x - 16 + k * 14 + Math.sin(ph * 7) * 3, p.y - 40 - ph * 22);
      }
    },

    // --- Mascotas (gato y perro): pasean, se duermen la siesta y se dejan acariciar.
    petWalkable(tx, ty) {
      if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return false;
      if (!WALKABLE.has(MAP[ty][tx])) return false;
      if (CHAIRS.some((c) => c.tx === tx && c.ty === ty)) return false;
      if (this.activeNpcs().some((n) => n.tx === tx && n.ty === ty)) return false;
      if (AA.Decor && AA.Decor.solidTiles().some(([x, y]) => x === tx && y === ty)) return false;
      return true;
    },
    // Camino más corto entre dos tiles (búsqueda en anchura).
    findPath(from, to) {
      const key = (x, y) => y * COLS + x;
      const prev = new Map([[key(from[0], from[1]), null]]);
      const queue = [from];
      while (queue.length) {
        const [x, y] = queue.shift();
        if (x === to[0] && y === to[1]) break;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx;
          const ny = y + dy;
          const k = key(nx, ny);
          if (prev.has(k) || !this.petWalkable(nx, ny)) continue;
          prev.set(k, [x, y]);
          queue.push([nx, ny]);
        }
      }
      if (!prev.has(key(to[0], to[1]))) return [];
      const path = [];
      for (let c = to; c && !(c[0] === from[0] && c[1] === from[1]); c = prev.get(key(c[0], c[1]))) path.unshift(c);
      return path;
    },
    updatePets(dt) {
      if (!this.pets) this.pets = [];
      for (const kind of Object.keys(PETS)) {
        const has = this.pets.find((p) => p.kind === kind);
        if (decorOn(kind) && !has) {
          const [tx, ty] = PETS[kind].start;
          this.pets.push({ kind, x: tx * T + 16, y: ty * T + 24, path: [], state: 'idle', timer: 1 + Math.random() * 2, face: 'right', anim: 0, hearts: 0, happy: 0 });
        } else if (!decorOn(kind) && has) this.pets = this.pets.filter((p) => p !== has);
      }
      for (const p of this.pets) {
        p.hearts = Math.max(0, p.hearts - dt);
        p.happy = Math.max(0, p.happy - dt);
        if (p.happy > 0) continue; // se queda quieto mientras lo acariciás
        if (p.state === 'walk') {
          const next = p.path[0];
          if (!next) {
            p.state = 'idle';
            p.timer = 2 + Math.random() * 5;
            continue;
          }
          const gx = next[0] * T + 16;
          const gy = next[1] * T + 24;
          const dx = gx - p.x;
          const dy = gy - p.y;
          const d = Math.hypot(dx, dy);
          const step = PETS[p.kind].speed * dt;
          if (d <= step) {
            p.x = gx;
            p.y = gy;
            p.path.shift();
          } else {
            p.x += (dx / d) * step;
            p.y += (dy / d) * step;
          }
          if (Math.abs(dx) > 0.5) p.face = dx < 0 ? 'left' : 'right';
          p.anim += dt * 8;
        } else {
          p.timer -= dt;
          if (p.timer > 0) continue;
          if (p.state === 'idle' && Math.random() < 0.3) {
            p.state = 'sleep';
            p.timer = 8 + Math.random() * 12;
            continue;
          }
          const from = [Math.floor(p.x / T), Math.floor(p.y / T)];
          let path = [];
          for (let tries = 0; tries < 12 && !path.length; tries++) {
            const to = [from[0] + Math.round((Math.random() - 0.5) * 16), from[1] + Math.round((Math.random() - 0.5) * 8)];
            if (this.petWalkable(to[0], to[1])) path = this.findPath(from, to);
          }
          p.path = path;
          p.state = path.length ? 'walk' : 'idle';
          p.timer = 1.5;
        }
      }
    },
    petSpots() {
      return (this.pets || []).map((p) => {
        const name = PETS[p.kind].name;
        return { id: 'pet:' + p.kind, x: p.x / T - 0.5, y: p.y / T - 0.8, w: 1, h: 0.8, pet: true, label: { es: `Acariciar a ${name.es}`, en: `Pet ${name.en}` } };
      });
    },
    petAnimal(id) {
      const p = (this.pets || []).find((x) => 'pet:' + x.kind === id);
      if (!p) return;
      p.happy = 2.4;
      p.hearts = 2.4;
      p.state = 'idle';
      p.path = [];
      p.timer = 2 + Math.random() * 3;
      p.face = this.player.x < p.x ? 'left' : 'right';
      AA.Audio.play(p.kind === 'cat' ? 'meow' : 'woof');
    },
    drawPet(p) {
      const ctx = this.ctx;
      const state = p.happy > 0 ? 'idle' : p.state;
      AA.Decor.paintAt(ctx, p.kind, p.x, p.y, this.t, { state, dir: p.face, frame: Math.floor(p.anim) % 2, happy: p.happy > 0 });
      if (p.hearts > 0) {
        for (let k = 0; k < 3; k++) {
          const ph = ((2.4 - p.hearts) * 0.9 + k * 0.33) % 1;
          ctx.globalAlpha = 1 - ph;
          ctx.fillStyle = '#ff4f7b';
          ctx.font = 'bold 8px "Inter", sans-serif';
          ctx.fillText('♥', p.x - 6 + k * 5 + Math.sin(ph * 6 + k) * 2, p.y - 22 - ph * 16);
          ctx.globalAlpha = 1;
        }
      }
    },

    // Rectángulo en pantalla de un personaje o un objeto (para las guías).
    rectOf(id) {
      const v = this.view();
      const cr = this.canvas.getBoundingClientRect();
      const toScreen = (x, y, w, h) => ({ left: cr.left + v.ox + x * v.scale, top: cr.top + v.oy + y * v.scale, width: w * v.scale, height: h * v.scale });
      if (id === 'player') return toScreen(this.player.x - 12, this.player.y - 42, 24, 44);
      const n = this.activeNpcs().find((x) => x.id === id);
      if (n) return toScreen(n.x - 12, n.y - 42, 24, 44);
      const sp = SPOTS.find((x) => x.id === id);
      if (sp) return toScreen(sp.x * T, sp.y * T - 6, sp.w * T, sp.h * T + 6);
      return null;
    },

    // --- Evento especial: escena de presentación frente al pizarrón
    startPresentation(cfg) {
      this.pres = Object.assign({ t0: this.t, asking: null, index: 0, correct: 0, reaction: null, reactAt: 0 }, cfg);
    },
    presentState(st) {
      if (!this.pres) return;
      if (st.reaction) this.pres.reactAt = this.t;
      Object.assign(this.pres, { reaction: null }, st);
    },
    stopPresentation() {
      this.pres = null;
    },

    drawPresentation() {
      const ctx = this.ctx;
      const P = this.pres;
      const VW = 500;
      const VH = 250;
      const el = this.t - P.t0;
      ctx.save();
      ctx.scale(WORLD_W / VW, WORLD_H / VH);
      const R = (x, y, w, h, col) => {
        ctx.fillStyle = col;
        ctx.fillRect(x, y, w, h);
      };
      // pared y piso de la sala de reuniones
      R(0, 0, VW, 100, '#efe3c8');
      R(0, 92, VW, 8, '#a07a55');
      for (let x = 0; x < VW; x += 25) for (let y = 100; y < VH; y += 25) R(x, y, 25, 25, (x / 25 + y / 25) % 2 ? '#c9d1dd' : '#c4ccd9');
      // ventana y planta
      R(24, 14, 60, 50, '#f7f1e3');
      R(28, 18, 52, 42, '#a9d8f5');
      R(28, 44, 52, 16, '#8cc6a5');
      R(53, 18, 2, 42, '#f7f1e3');
      ctx.save();
      ctx.translate(430, 62);
      ctx.scale(1.4, 1.4);
      this.drawPlant(-16, -10, true, 3);
      ctx.restore();
      // pizarrón (entra deslizándose)
      const slide = Math.min(1, el / 0.6);
      const bx = 130;
      const by = 10 - (1 - slide) * 90;
      R(bx - 4, by - 4, 228, 92, '#9aa1b5');
      R(bx, by, 220, 84, '#ffffff');
      R(bx, by + 84, 220, 5, '#b7bdcc');
      ctx.fillStyle = '#1d2130';
      ctx.font = 'bold 8px "Inter", system-ui, sans-serif';
      ctx.textBaseline = 'top';
      const title = String(P.title || '').replace(/^🎲 [^·]*· /, '');
      ctx.fillText(title.length > 46 ? title.slice(0, 45) + '…' : title, bx + 8, by + 6);
      ctx.fillStyle = '#6b7389';
      ctx.font = '6px "Inter", system-ui, sans-serif';
      ctx.fillText(P.file || '', bx + 8, by + 17);
      // gráfico de barras que "crece" (sin números: los datos los tenés que recordar vos)
      const grow = Math.min(1, Math.max(0, (el - 0.5) / 0.8));
      const bars = P.bars || [];
      const bw = 150 / Math.max(1, bars.length);
      bars.forEach((h, i) => {
        const hh = 46 * h * grow;
        R(bx + 12 + i * bw, by + 76 - hh, bw - 4, hh, i % 3 === 2 ? '#2fbf71' : '#4f8cff');
      });
      R(bx + 10, by + 76, 158, 1, '#9aa1b5');
      ctx.strokeStyle = '#e5484d';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(bx + 176, by + 70);
      ctx.lineTo(bx + 188, by + 52 - 6 * grow);
      ctx.lineTo(bx + 200, by + 58);
      ctx.lineTo(bx + 212, by + 34 - 8 * grow);
      ctx.stroke();
      // vos, al lado del pizarrón, señalando
      const p = AA.State.CHARACTERS.player;
      const px = 378;
      const py = 128;
      AA.Sprites.drawChar(ctx, px, py, p, 'down', 0);
      ctx.strokeStyle = '#3a3d4a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px - 9, py - 15);
      ctx.lineTo(px - 24, py - 30 + Math.sin(this.t * 3) * 2);
      ctx.stroke();
      // el equipo, sentado frente a vos (de espaldas a la cámara)
      const seats = [
        [150, 186],
        [205, 186],
        [260, 186],
        [315, 186],
        [178, 234],
        [233, 234],
        [288, 234],
      ];
      (P.crowd || []).forEach((id, i) => {
        const [x, y] = seats[i % seats.length];
        const asking = P.asking === id && !P.done;
        const hop = asking ? Math.abs(Math.sin(this.t * 6)) * -2 : 0;
        this.drawChair(x, y, () => AA.Sprites.drawChar(ctx, x, y + hop, AA.State.CHARACTERS[id], 'up', 0, { sitting: true }));
        if (asking) {
          // mano levantada y globito de pregunta
          R(x + 7, y - 40 + hop, 3, 10, AA.Sprites.look(AA.State.CHARACTERS[id]).skin);
          this.bubble(x + 2, y - 58 + hop, P.reaction === 'ok' && this.t - P.reactAt < 1.2 ? '✔' : P.reaction === 'bad' && this.t - P.reactAt < 1.2 ? '✖' : '?', P.reaction === 'ok' ? '#2fbf71' : P.reaction === 'bad' ? '#e5484d' : '#ffd23f');
        }
      });
      // cartel del evento y marcador
      const pop = Math.min(1, el / 0.45);
      ctx.save();
      ctx.translate(12, 108);
      ctx.scale(pop, pop);
      R(0, 0, 104, 34, 'rgba(29,33,48,0.92)');
      ctx.fillStyle = '#ffd23f';
      ctx.font = 'bold 7px "Inter", system-ui, sans-serif';
      ctx.fillText(AA.T('📣 EVENTO ESPECIAL', '📣 SPECIAL EVENT'), 7, 6);
      ctx.fillStyle = '#ffffff';
      ctx.font = '6px "Inter", system-ui, sans-serif';
      ctx.fillText(AA.T('Presentación de resultados', 'Results presentation'), 7, 16);
      ctx.fillText(`${AA.T('Aciertos', 'Correct')}: ${P.correct}/${P.total}`, 7, 25);
      ctx.restore();
      ctx.restore();
      // título que entra con zoom al principio
      if (el < 1.6) {
        const k = Math.min(1, el / 0.35);
        const a = el < 1.2 ? 1 : 1 - (el - 1.2) / 0.4;
        ctx.save();
        ctx.globalAlpha = Math.max(0, a);
        ctx.fillStyle = 'rgba(10,12,20,0.55)';
        ctx.fillRect(0, 0, WORLD_W, WORLD_H);
        ctx.translate(WORLD_W / 2, WORLD_H / 2);
        ctx.scale(0.5 + 0.5 * k + (k === 1 ? Math.sin(el * 10) * 0.02 : 0), 0.5 + 0.5 * k);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '22px "Press Start 2P", monospace';
        ctx.fillStyle = '#8b3a2b';
        ctx.fillText(AA.T('¡EVENTO ESPECIAL!', 'SPECIAL EVENT!'), 0, 4);
        ctx.fillStyle = '#ffd23f';
        ctx.fillText(AA.T('¡EVENTO ESPECIAL!', 'SPECIAL EVENT!'), 0, 0);
        ctx.font = '600 14px "Inter", system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(AA.T('Presentá tus resultados al equipo', 'Present your results to the team'), 0, 34);
        ctx.restore();
        ctx.textAlign = 'left';
      }
    },
    bubble(x, y, text, color) {
      const ctx = this.ctx;
      ctx.fillStyle = '#1d2130';
      this.roundRect(x - 9, y - 9, 18, 16, 4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 2, y + 7);
      ctx.lineTo(x + 2, y + 7);
      ctx.lineTo(x, y + 11);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.font = 'bold 10px "Inter", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y);
      ctx.textAlign = 'left';
    },

    // --- Dibujo
    draw() {
      const ctx = this.ctx;
      const v = this.view();
      ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
      ctx.fillStyle = '#1a1712';
      ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
      if (this.pres) {
        ctx.setTransform(v.dpr * v.scale, 0, 0, v.dpr * v.scale, v.dpr * v.ox, v.dpr * v.oy);
        ctx.imageSmoothingEnabled = false;
        this.drawPresentation();
        return;
      }
      ctx.setTransform(v.dpr * v.scale, 0, 0, v.dpr * v.scale, v.dpr * v.ox, v.dpr * v.oy);
      ctx.imageSmoothingEnabled = false;

      const markers = this.getMarkers ? this.getMarkers() : {};
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) this.drawTile(x, y, markers);
      this.drawLight();
      // Decoración de las paredes y sobre los muebles (recompensas del ARCADE).
      const D = AA.Decor;
      if (D) {
        if (decorOn('lights')) D.paintAt(ctx, 'lights', 0, 0, this.t, { from: T + 4, to: 27 * T - 4 });
        for (const id of ['neon', 'portrait', 'trophy', 'bonsai']) if (decorOn(id)) D.paintAt(ctx, id, D.byId(id).tile[0] * T, D.byId(id).tile[1] * T, this.t);
      }

      // Personajes ordenados por profundidad.
      const actors = this.activeNpcs().map((n) => ({ y: n.y, draw: () => this.drawNpc(n) }));
      if (D) {
        const vinyl = D.playingVinyl();
        const opts = {
          turntable: { playing: !!vinyl, color: vinyl ? AA.Audio.VINYLS[vinyl].color : null },
          dancebtn: { pressed: !!(this.player.dance && this.t - this.player.dance.t0 < 0.3) },
        };
        for (const id of ['ficus', 'aquarium', 'turntable', 'dancebtn']) {
          if (!decorOn(id)) continue;
          const [tx, ty] = D.byId(id).tile;
          actors.push({ y: ty * T + 27, draw: () => D.paintAt(ctx, id, tx * T, ty * T, this.t, opts[id]) });
        }
        for (const pet of this.pets || []) actors.push({ y: pet.y, draw: () => this.drawPet(pet) });
      }
      const p = this.player;
      for (const c of CHAIRS) {
        const cx = c.tx * T + 16;
        const cy = c.ty * T + (c.mine ? 20 : 26);
        if (c.mine && p.sitting) continue;
        if (c.owner === 'nico' && nicoBack()) continue; // Nico está sentado en su silla
        actors.push({ y: cy - 0.5, draw: () => this.drawChair(cx, cy, null, c.mine) });
      }
      actors.push({
        y: p.y,
        draw: () => {
          const ch = AA.State.CHARACTERS.player;
          if (p.sitting) this.drawChair(p.x, p.y, () => AA.Sprites.drawChar(ctx, p.x, p.y, ch, 'up', 0, { sitting: true }), true);
          else if (p.dance) this.drawDancer(p, ch);
          else AA.Sprites.drawChar(ctx, p.x, p.y, ch, p.dir, p.frame);
        },
      });
      actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());

      // Marcadores "!"
      const bounce = Math.sin(this.t * 5) * 2;
      const pc = SPOTS.find((s) => s.id === 'computer');
      const wb = SPOTS.find((s) => s.id === 'whiteboard');
      if (markers.computer) this.drawMarker((pc.x + pc.w / 2) * T, pc.y * T - 14 + bounce, '#ffd23f');
      if (markers.arcade) this.drawMarker(23 * T + 16, 7 * T - 34 + bounce, '#c084fc');
      for (const n of this.activeNpcs()) if (markers[n.id]) this.drawMarker(n.x, n.y - 46 + bounce, '#ffd23f');
      if (markers.whiteboard) this.drawMarker((wb.x + wb.w / 2) * T, wb.y * T - 8 + bounce, '#7cf29a');
      if (markers.chest) this.drawMarker(24 * T + 16, 7 * T - 6 + bounce, '#ffd23f');

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
    drawChair(x, y, sit, mine) {
      const ctx = this.ctx;
      if (mine && decorOn('gamerchair')) {
        // silla gamer (recompensa): quien se sienta se dibuja en coordenadas del mundo
        const seat = sit
          ? () => {
              ctx.save();
              ctx.translate(-x, -y);
              sit();
              ctx.restore();
            }
          : null;
        AA.Decor.paintAt(ctx, 'gamerchair', x, y, this.t, { sit: seat });
        return;
      }
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
      // Alfombra persa (recompensa): se dibuja entera, recortada a este tile.
      if (decorOn('rug')) {
        const [rx, ry, rw, rh] = AA.Decor.byId('rug').rug;
        if (x >= rx && x < rx + rw && y >= ry && y < ry + rh) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(px, py, T, T);
          ctx.clip();
          ctx.translate(rx * T, ry * T);
          AA.Decor.paintRug(ctx, rw * T, rh * T);
          ctx.restore();
        }
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
            const off = ch === 'D' && x === nico.x && y === nico.y && !nicoBack();
            const glow = isMine && markers.computer ? (Math.sin(this.t * 4) > 0 ? '#9be7ff' : '#5fc8ff') : ch === 'B' ? '#c9d6ff' : '#6fd3ff';
            if (isMine && decorOn('pcgamer')) {
              AA.Decor.paintAt(ctx, 'pcgamer', px, py, this.t, { highlight: !!markers.computer });
            } else {
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
          } else if (x === 4 && decorOn('donuts')) {
            AA.Decor.paintAt(ctx, 'donuts', px, py, this.t);
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
          if (decorOn('espresso')) {
            AA.Decor.paintAt(ctx, 'espresso', px, py, this.t);
            break;
          }
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
        case 'R': {
          // Máquina arcade contra el vidrio de la oficina de Marta, mirando a la mesa ratona.
          // Apagada (y con cinta de "fuera de servicio") si sos pasante; con luces de neón desde Junior.
          const on = arcadeOn();
          const t = this.t;
          const neon = ['#ff4fd8', '#4fd1ff', '#ffd23f', '#7cf29a'];
          const cyc = (k) => neon[(Math.floor(t * 4) + k) % neon.length];
          if (on) {
            // halo de luz en el piso y detrás
            const pulse = 0.5 + 0.5 * Math.sin(t * 3);
            const g = ctx.createRadialGradient(px + 16, py + 22, 4, px + 16, py + 22, 52);
            g.addColorStop(0, `rgba(192,132,252,${0.5 + 0.25 * pulse})`);
            g.addColorStop(0.5, `rgba(255,79,216,${0.18 + 0.1 * pulse})`);
            g.addColorStop(1, 'rgba(192,132,252,0)');
            ctx.fillStyle = g;
            ctx.fillRect(px - 38, py - 34, 108, 90);
            // rayos de luz hacia la mesa ratona
            ctx.fillStyle = `rgba(79,209,255,${0.1 + 0.08 * pulse})`;
            ctx.beginPath();
            ctx.moveTo(px + 6, py + 28);
            ctx.lineTo(px + 26, py + 28);
            ctx.lineTo(px + 44, py + 60);
            ctx.lineTo(px - 12, py + 60);
            ctx.closePath();
            ctx.fill();
          }
          // gabinete (más alto: se asoma sobre el vidrio)
          R(2, -30, 28, 58, on ? '#3b1f7a' : '#2e2440');
          R(2, -30, 4, 58, on ? '#2a1557' : '#221a30');
          R(26, -30, 4, 58, on ? '#2a1557' : '#221a30');
          // bordes de neón
          if (on) {
            R(1, -31, 2, 60, cyc(0));
            R(29, -31, 2, 60, cyc(2));
          }
          // marquesina con el cartel
          R(4, -29, 24, 9, on ? '#120a26' : '#1a1622');
          ctx.font = '800 5.5px "Inter", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          if (on) {
            ctx.shadowColor = cyc(1);
            ctx.shadowBlur = 6;
            ctx.fillStyle = cyc(1);
            ctx.fillText('ARCADE', px + 16, py - 24.5);
            ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = '#3a3448';
            ctx.fillText('ARCADE', px + 16, py - 24.5);
          }
          ctx.textAlign = 'left';
          // luces de la marquesina
          for (let i = 0; i < 6; i++) R(5 + i * 4, -20, 2, 2, on ? neon[(i + Math.floor(t * 6)) % 4] : '#3a3448');
          // pantalla
          R(5, -17, 22, 16, '#0b0c12');
          if (on) {
            const ph = Math.floor(t * 8);
            R(6, -16, 20, 14, '#0f2a3a');
            // mini juego: "naves" y una barra que rebota
            R(7 + (ph % 9) * 2, -14, 3, 2, '#ff4fd8');
            R(22 - (ph % 7) * 2, -11, 3, 2, '#ffd23f');
            R(8 + Math.abs(((ph * 2) % 32) - 16), -5, 4, 1, '#7cf29a');
            R(6, -16, 20, 1, 'rgba(255,255,255,0.18)');
            for (let y = -15; y < -2; y += 2) R(6, y, 20, 1, 'rgba(0,0,0,0.12)');
          } else {
            R(6, -16, 20, 14, '#14151c');
            ctx.strokeStyle = '#4a4f63';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px + 8, py - 15);
            ctx.lineTo(px + 15, py - 8);
            ctx.lineTo(px + 12, py - 4);
            ctx.stroke();
            if (Math.sin(t * 9) > 0.96) {
              R(20, -12, 2, 2, '#ffd23f');
              R(23, -14, 1, 1, '#fff3c4');
            }
          }
          // panel de control
          R(3, 0, 26, 9, on ? '#2a1557' : '#221a30');
          R(3, 0, 26, 2, on ? '#4a2a8f' : '#2e2440');
          R(9, 2, 2, 4, '#111');
          ctx.fillStyle = on ? '#e5484d' : '#5a2a2a';
          ctx.beginPath();
          ctx.arc(px + 10, py + 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
          R(16, 3, 3, 3, on ? '#ffd23f' : '#5a5020');
          R(21, 3, 3, 3, on ? '#4fd1ff' : '#204a55');
          R(18, 6, 3, 2, on ? '#ff4fd8' : '#4a2040');
          // base y ranura de fichas
          R(5, 10, 22, 18, on ? '#3b1f7a' : '#2e2440');
          R(13, 14, 6, 6, '#111218');
          R(15, 15, 2, 4, on ? (Math.sin(t * 5) > 0 ? '#ffd23f' : '#ff8a3d') : '#444');
          R(5, 26, 22, 2, '#1b1d2b');
          if (!on) {
            // cinta de "fuera de servicio"
            ctx.save();
            ctx.translate(px + 16, py - 6);
            ctx.rotate(-0.35);
            ctx.fillStyle = '#ffd23f';
            ctx.fillRect(-22, -3, 44, 7);
            ctx.fillStyle = '#1b1d2b';
            for (let i = -22; i < 22; i += 6) ctx.fillRect(i, -3, 3, 7);
            ctx.restore();
          }
          break;
        }
        case 'Z': {
          // Cofre de recompensas del ARCADE (brilla cuando hay algo nuevo adentro).
          const fresh = markers.chest;
          if (fresh) {
            const g = ctx.createRadialGradient(px + 16, py + 16, 2, px + 16, py + 16, 26);
            g.addColorStop(0, `rgba(255,210,63,${0.35 + 0.2 * Math.sin(this.t * 4)})`);
            g.addColorStop(1, 'rgba(255,210,63,0)');
            ctx.fillStyle = g;
            ctx.fillRect(px - 12, py - 12, 56, 56);
          }
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.beginPath();
          ctx.ellipse(px + 16, py + 28, 13, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          R(4, 12, 24, 16, '#8b5a2b');
          R(4, 12, 24, 2, '#a8703c');
          R(3, 4, 26, 10, '#9c6532');
          R(3, 4, 26, 2, '#b97d45');
          R(3, 12, 26, 2, '#6b4220');
          R(7, 4, 3, 24, '#d4a017');
          R(22, 4, 3, 24, '#d4a017');
          R(13, 10, 6, 7, '#f4c430');
          R(15, 13, 2, 3, '#6b4220');
          if (fresh && Math.sin(this.t * 6) > 0.3) {
            R(26, 1, 1, 5, '#ffffff');
            R(24, 3, 5, 1, '#ffffff');
            R(5, 0, 1, 3, '#fff3c4');
          }
          break;
        }
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
