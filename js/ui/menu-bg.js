/*
 * Analyst Adventure — Fondo animado del menú: un "tablero de analítica" que se mueve solo
 * (gráficos de barras y líneas, torta, KPIs, dispersión y fórmulas flotando).
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});

  const COLORS = ['#4f8cff', '#2fbf71', '#ffd23f', '#ff6f9c', '#b26cf0', '#0ea5b7'];
  const FORMULAS = ['=SUMA(B2:B90)', '=PROMEDIO(D:D)', '=CONTAR.SI(B:B;"Norte")', '=SI(C2>=D2;"Sí";"No")', '=BUSCARV(A2;Tabla;3;FALSO)', '=MAX(F2:F13)', '=SUMAR.SI($B$2:$B$50;H2;$E$2:$E$50)', '=NOMPROPIO(ESPACIOS(A2))', '=SUM(C2:E2)', '=COUNTIFS(B:B,"South",D:D,"Delayed")', '=AVERAGE(B2:B31)', '=ROUND(C2*21%,2)', '=XLOOKUP(A2,Ids,Names)', 'Δ +12.4%', 'R² = 0.87', 'n = 1,248', 'σ = 3.21'];

  const MenuBg = {
    canvas: null,
    ctx: null,
    running: false,
    t: 0,

    init(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      const rnd = (a, b) => a + Math.random() * (b - a);
      this.bars = Array.from({ length: 9 }, () => ({ h: rnd(0.2, 0.9), target: rnd(0.2, 0.95) }));
      this.line = Array.from({ length: 48 }, (_, i) => 0.5 + Math.sin(i / 4) * 0.2 + rnd(-0.08, 0.08));
      this.line2 = Array.from({ length: 48 }, (_, i) => 0.45 + Math.cos(i / 6) * 0.15 + rnd(-0.05, 0.05));
      this.dots = Array.from({ length: 36 }, () => ({ x: rnd(0, 1), y: 0, vx: rnd(-0.01, 0.01), vy: rnd(-0.01, 0.01), c: COLORS[Math.floor(rnd(0, 4))] }));
      this.dots.forEach((d) => (d.y = Math.min(0.95, Math.max(0.05, d.x * 0.8 + rnd(-0.2, 0.2)))));
      this.floaters = Array.from({ length: 16 }, () => this.newFloater(true));
      this.kpis = [
        { label: { es: 'Ventas', en: 'Sales' }, value: 48213, fmt: (v) => '$' + Math.round(v).toLocaleString('en-US'), delta: '+12.4%', c: '#2fbf71' },
        { label: { es: 'Clientes', en: 'Customers' }, value: 1248, fmt: (v) => Math.round(v).toLocaleString('en-US'), delta: '+3.1%', c: '#4f8cff' },
        { label: { es: 'Demoras', en: 'Delays' }, value: 7.2, fmt: (v) => v.toFixed(1) + '%', delta: '−1.8%', c: '#ff6f9c' },
      ];
      this.lineTimer = 0;
    },
    newFloater(anywhere) {
      return {
        text: FORMULAS[Math.floor(Math.random() * FORMULAS.length)],
        x: Math.random(),
        y: anywhere ? Math.random() : 1.05,
        v: 0.012 + Math.random() * 0.02,
        a: 0.08 + Math.random() * 0.14,
        size: 11 + Math.random() * 6,
      };
    },

    start() {
      if (this.running) return;
      this.running = true;
      let last = performance.now();
      const loop = (now) => {
        if (!this.running) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        this.update(dt);
        this.draw();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    },
    stop() {
      this.running = false;
    },

    update(dt) {
      this.t += dt;
      for (const b of this.bars) {
        b.h += (b.target - b.h) * dt * 1.5;
        if (Math.abs(b.target - b.h) < 0.01) b.target = 0.15 + Math.random() * 0.8;
      }
      this.lineTimer += dt;
      if (this.lineTimer > 0.35) {
        this.lineTimer = 0;
        const lastV = this.line[this.line.length - 1];
        this.line.shift();
        this.line.push(Math.min(0.92, Math.max(0.08, lastV + (Math.random() - 0.47) * 0.12)));
        const last2 = this.line2[this.line2.length - 1];
        this.line2.shift();
        this.line2.push(Math.min(0.9, Math.max(0.1, last2 + (Math.random() - 0.5) * 0.08)));
      }
      for (const d of this.dots) {
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        if (d.x < 0.03 || d.x > 0.97) d.vx *= -1;
        if (d.y < 0.05 || d.y > 0.95) d.vy *= -1;
      }
      for (let i = 0; i < this.floaters.length; i++) {
        const f = this.floaters[i];
        f.y -= f.v * dt;
        if (f.y < -0.05) this.floaters[i] = this.newFloater(false);
      }
      for (const k of this.kpis) k.value *= 1 + (Math.random() - 0.48) * dt * 0.02;
    },

    // Panel translúcido con título.
    panel(x, y, w, h, title) {
      const c = this.ctx;
      c.fillStyle = 'rgba(28, 31, 48, 0.55)';
      c.strokeStyle = 'rgba(120, 140, 200, 0.18)';
      c.lineWidth = 1;
      c.beginPath();
      c.roundRect(x, y, w, h, 10);
      c.fill();
      c.stroke();
      if (title) {
        c.fillStyle = 'rgba(200, 210, 240, 0.45)';
        c.font = '600 11px Inter, system-ui, sans-serif';
        c.fillText(title, x + 12, y + 18);
      }
    },

    draw() {
      const cv = this.canvas;
      const dpr = window.devicePixelRatio || 1;
      const W = cv.clientWidth;
      const H = cv.clientHeight;
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(H * dpr);
      }
      const c = this.ctx;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = c.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#0b0d16');
      g.addColorStop(1, '#151a2e');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);

      // Grilla de planilla que se desplaza lentamente.
      const cw = 96;
      const ch = 26;
      const ox = (this.t * 12) % cw;
      const oy = (this.t * 6) % ch;
      c.strokeStyle = 'rgba(79, 140, 255, 0.07)';
      c.lineWidth = 1;
      c.beginPath();
      for (let x = -ox; x < W; x += cw) {
        c.moveTo(x + 0.5, 0);
        c.lineTo(x + 0.5, H);
      }
      for (let y = -oy; y < H; y += ch) {
        c.moveTo(0, y + 0.5);
        c.lineTo(W, y + 0.5);
      }
      c.stroke();

      // Fórmulas flotando hacia arriba.
      for (const f of this.floaters) {
        c.fillStyle = `rgba(158, 194, 255, ${f.a})`;
        c.font = `${f.size}px 'JetBrains Mono', monospace`;
        c.fillText(f.text, f.x * W - 60, f.y * H);
      }

      const s = Math.min(1, W / 1400, H / 900);
      const pw = 300 * s + 40;
      const ph = 160 * s + 30;
      const pad = 28;
      // La franja superior queda libre para el título.
      const topY = Math.max(150, H * 0.19);
      const bottomY = H - ph - pad - 20;
      // Barras (abajo a la izquierda)
      {
        const x = pad;
        const y = bottomY;
        this.panel(x, y, pw, ph, AA.T('Ventas por región', 'Sales by region'));
        const n = this.bars.length;
        const bw = (pw - 40) / n;
        this.bars.forEach((b, i) => {
          const bh = b.h * (ph - 48);
          c.fillStyle = COLORS[i % 3] + 'bb';
          c.fillRect(x + 20 + i * bw + 3, y + ph - 14 - bh, bw - 6, bh);
        });
      }
      // Líneas (arriba a la derecha)
      {
        const x = W - pw - pad;
        const y = topY;
        this.panel(x, y, pw, ph, AA.T('Tráfico web · últimos días', 'Web traffic · last days'));
        const drawLine = (arr, color) => {
          c.strokeStyle = color;
          c.lineWidth = 2;
          c.beginPath();
          arr.forEach((v, i) => {
            const px = x + 14 + (i / (arr.length - 1)) * (pw - 28);
            const py = y + 30 + (1 - v) * (ph - 44);
            if (i) c.lineTo(px, py);
            else c.moveTo(px, py);
          });
          c.stroke();
        };
        drawLine(this.line2, 'rgba(178, 108, 240, 0.7)');
        drawLine(this.line, 'rgba(47, 191, 113, 0.9)');
      }
      // Torta (abajo a la derecha)
      {
        const x = W - pw - pad;
        const y = bottomY;
        this.panel(x, y, pw, ph, AA.T('Estado de envíos', 'Shipment status'));
        const cx = x + pw / 2;
        const cy = y + ph / 2 + 10;
        const r = Math.min(pw, ph) / 2 - 26;
        const parts = [0.58, 0.24, 0.12, 0.06];
        let a = this.t * 0.15;
        parts.forEach((p, i) => {
          c.fillStyle = COLORS[i] + 'cc';
          c.beginPath();
          c.moveTo(cx, cy);
          c.arc(cx, cy, r, a, a + p * Math.PI * 2);
          c.fill();
          a += p * Math.PI * 2;
        });
        c.fillStyle = '#151a2e';
        c.beginPath();
        c.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
        c.fill();
      }
      // Dispersión (arriba a la izquierda)
      {
        const x = pad;
        const y = topY;
        this.panel(x, y, pw, ph, AA.T('Precio vs. unidades', 'Price vs. units'));
        for (const d of this.dots) {
          c.fillStyle = d.c + 'cc';
          c.beginPath();
          c.arc(x + 14 + d.x * (pw - 28), y + 28 + (1 - d.y) * (ph - 40), 3, 0, Math.PI * 2);
          c.fill();
        }
        c.strokeStyle = 'rgba(255, 210, 63, 0.5)';
        c.setLineDash([5, 5]);
        c.beginPath();
        c.moveTo(x + 14, y + ph - 14);
        c.lineTo(x + pw - 14, y + 34);
        c.stroke();
        c.setLineDash([]);
      }
      // KPIs entre los paneles de arriba y los de abajo (si hay lugar).
      const gapTop = topY + ph + 14;
      const kh = 58;
      const room = Math.floor((bottomY - 14 - gapTop + 12) / (kh + 12));
      const slots = [];
      for (let i = 0; i < Math.min(2, room); i++) slots.push({ x: pad, y: gapTop + i * (kh + 12) });
      if (room > 0) slots.push({ x: W - (170 * s + 30) - pad, y: gapTop + Math.max(0, room - 1) * (kh + 12) * 0.5 });
      slots.forEach((pos, i) => {
        const k = this.kpis[i];
        const kw = 170 * s + 30;
        this.panel(pos.x, pos.y, kw, kh, AA.L(k.label));
        c.fillStyle = 'rgba(232, 234, 242, 0.75)';
        c.font = '700 19px Inter, system-ui, sans-serif';
        c.fillText(k.fmt(k.value), pos.x + 12, pos.y + 44);
        c.fillStyle = k.c;
        c.font = '600 11px Inter, system-ui, sans-serif';
        c.fillText(k.delta, pos.x + kw - 52, pos.y + 18);
      });
    },
  };

  AA.MenuBg = MenuBg;
})();
