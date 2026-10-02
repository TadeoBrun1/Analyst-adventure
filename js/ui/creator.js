/*
 * Analyst Adventure — Creador de personaje: aspecto (hombre/mujer), piel, pelo, barba y ropa.
 * Se usa al crear una partida y desde el menú de pausa ("Cambiar aspecto").
 * Teclado: ↑/↓ cambia de fila, ←/→ elige la opción anterior/siguiente de la fila.
 */
(function () {
  'use strict';
  const AA = (globalThis.AA = globalThis.AA || {});
  const T = (es, en) => AA.T(es, en);

  const SKIN = ['#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3a1e'];
  const HAIR = ['#1b1b1b', '#3b2a20', '#6b4423', '#b7472a', '#d4a017', '#e8cf7a', '#9e9e9e', '#3f6fd8', '#e0609d', '#3fa66b'];
  const TOP = ['#4f8cff', '#e5484d', '#2fbf71', '#f5a524', '#9b59b6', '#ff7aa2', '#0ea5b7', '#f4f4f4', '#2d3436', '#8a6243'];
  const BOTTOM = ['#2b2f45', '#3d5a80', '#1f2129', '#6b6f7a', '#c8a27a', '#556b2f', '#7b2d3b'];

  const NAMES = {
    body: { m: ['Hombre', 'Man'], f: ['Mujer', 'Woman'] },
    hairStyle: {
      short: ['Corto', 'Short'],
      spiky: ['Con pinchos', 'Spiky'],
      curly: ['Rulos', 'Curly'],
      bob: ['Melena', 'Bob'],
      long: ['Largo', 'Long'],
      ponytail: ['Colita', 'Ponytail'],
      bun: ['Rodete', 'Bun'],
      bald: ['Pelado', 'Bald'],
    },
    beard: { none: ['Sin barba', 'None'], stubble: ['De 3 días', 'Stubble'], mustache: ['Bigote', 'Mustache'], goatee: ['Candado', 'Goatee'], full: ['Completa', 'Full beard'] },
    glasses: { false: ['Sin anteojos', 'No glasses'], true: ['Con anteojos', 'Glasses'] },
    top: { tee: ['Remera', 'T-shirt'], shirt: ['Camisa', 'Shirt'], hoodie: ['Buzo', 'Hoodie'], blazer: ['Saco', 'Blazer'] },
    bottom: { pants: ['Pantalón', 'Trousers'], skirt: ['Pollera', 'Skirt'] },
  };
  const DIRS = ['down', 'left', 'up', 'right'];

  const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function randomLook() {
    const body = Math.random() < 0.5 ? 'm' : 'f';
    const hair = pickOne(HAIR.slice(0, 7));
    const styles = body === 'f' ? ['bob', 'long', 'ponytail', 'bun', 'curly', 'short'] : ['short', 'spiky', 'curly', 'bob', 'bald', 'ponytail'];
    return {
      body,
      skin: pickOne(SKIN),
      hairStyle: pickOne(styles),
      hair,
      beard: body === 'f' ? 'none' : pickOne(['none', 'none', 'stubble', 'mustache', 'goatee', 'full']),
      beardColor: hair,
      glasses: Math.random() < 0.3,
      top: pickOne(AA.Sprites.TOPS),
      shirt: pickOne(TOP),
      bottom: body === 'f' && Math.random() < 0.4 ? 'skirt' : 'pants',
      pants: pickOne(BOTTOM),
    };
  }

  // host: elemento donde se dibuja. opts: { look, onChange }
  function mount(host, opts) {
    const look = Object.assign({}, AA.State.DEFAULT_LOOK, opts.look || {});
    let dir = 0;
    let manual = 0;
    let alive = true;

    const chips = (key, values) =>
      values
        .map((v) => {
          const on = String(look[key]) === String(v);
          return `<button type="button" class="cr-chip ${on ? 'on' : ''}" data-k="${key}" data-v="${v}">${AA.T(NAMES[key][v][0], NAMES[key][v][1])}</button>`;
        })
        .join('');
    const swatches = (key, colors) =>
      colors
        .map((c) => `<button type="button" class="cr-sw ${look[key] === c ? 'on' : ''}" data-k="${key}" data-v="${c}" style="--c:${c}" aria-label="${c}"></button>`)
        .join('');
    const row = (label, inner, extra) => `<div class="cr-row" ${extra || ''}><span class="cr-label">${label}</span><div class="cr-opts">${inner}</div></div>`;

    function render() {
      const man = look.body === 'm';
      host.innerHTML = `
        <div class="creator">
          <div class="cr-preview">
            <canvas class="cr-canvas"></canvas>
            <div class="cr-rot">
              <button type="button" class="btn btn-sm btn-ghost" data-rot="-1" title="${T('Girar', 'Turn')}">⟲</button>
              <button type="button" class="btn btn-sm btn-ghost" data-rot="1" title="${T('Girar', 'Turn')}">⟳</button>
            </div>
            <p class="muted small cr-help"><kbd>↑</kbd><kbd>↓</kbd> ${T('fila', 'row')} · <kbd>←</kbd><kbd>→</kbd> ${T('opción', 'option')}</p>
          </div>
          <div class="cr-form">
            ${row(T('Aspecto', 'Look'), chips('body', ['m', 'f']))}
            ${row(T('Tono de piel', 'Skin tone'), swatches('skin', SKIN))}
            ${row(T('Peinado', 'Hairstyle'), chips('hairStyle', AA.Sprites.HAIR_STYLES))}
            ${look.hairStyle !== 'bald' ? row(T('Color de pelo', 'Hair color'), swatches('hair', HAIR)) : ''}
            ${man ? row(T('Barba', 'Beard'), chips('beard', AA.Sprites.BEARDS)) : ''}
            ${man && look.beard !== 'none' ? row(T('Color de barba', 'Beard color'), swatches('beardColor', HAIR)) : ''}
            ${row(T('Anteojos', 'Glasses'), chips('glasses', [false, true]))}
            ${row(T('Parte de arriba', 'Top'), chips('top', AA.Sprites.TOPS))}
            ${row(T('Color', 'Color'), swatches('shirt', TOP))}
            ${row(T('Parte de abajo', 'Bottom'), chips('bottom', AA.Sprites.BOTTOMS))}
            ${row(T('Color', 'Color'), swatches('pants', BOTTOM))}
            <div class="cr-row cr-actions">${opts.actions || ''}<button type="button" class="btn btn-ghost" data-act="random">🎲 ${T('Al azar', 'Random')}</button></div>
          </div>
        </div>`;
      host.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => set(b.dataset.k, b.dataset.v, b)));
      host.querySelectorAll('[data-rot]').forEach((b) =>
        b.addEventListener('click', () => {
          dir = (dir + Number(b.dataset.rot) + 4) % 4;
          manual = performance.now();
          AA.Audio.play('move');
        })
      );
      host.querySelector('[data-act="random"]').addEventListener('click', () => {
        Object.assign(look, randomLook());
        AA.Audio.play('select');
        changed('[data-act="random"]');
      });
      if (opts.onRender) opts.onRender(host);
    }

    function set(key, raw, btn) {
      let v = raw;
      if (key === 'glasses') v = raw === 'true';
      if (String(look[key]) === String(v)) return;
      look[key] = v;
      if (key === 'body') {
        // Un punto de partida razonable para cada aspecto (después se puede cambiar todo).
        if (v === 'f') {
          look.beard = 'none';
          if (look.hairStyle === 'short' || look.hairStyle === 'spiky') look.hairStyle = 'long';
        } else if (look.hairStyle === 'long') look.hairStyle = 'short';
      }
      if (key === 'hair' && look.beard === 'none') look.beardColor = v;
      AA.Audio.play('move');
      changed(`[data-k="${key}"][data-v="${raw}"]`, btn);
    }

    function changed(focusSel) {
      render();
      const f = host.querySelector(focusSel);
      if (f) f.focus({ preventScroll: true });
      if (opts.onChange) opts.onChange(Object.assign({}, look));
    }

    // Teclado: filas con ↑/↓, opciones con ←/→ (se eligen al moverse, como en los juegos).
    host.addEventListener('keydown', (e) => {
      const rows = [...host.querySelectorAll('.cr-row')];
      const a = document.activeElement;
      const rowEl = a && a.closest('.cr-row');
      if (!rowEl || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const ri = rows.indexOf(rowEl);
        const next = rows[(ri + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length];
        const target = next.querySelector('.on') || next.querySelector('button');
        if (target) target.focus({ preventScroll: false });
        AA.Audio.play('move');
        return;
      }
      const btns = [...rowEl.querySelectorAll('button')];
      const bi = btns.indexOf(a);
      const nb = btns[(bi + (e.key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length];
      if (!nb) return;
      if (nb.dataset.k) nb.click();
      else {
        nb.focus();
        AA.Audio.play('move');
      }
    });

    // Vista previa: gira sola, salvo que el jugador la haya girado hace poco.
    function draw(now) {
      if (!alive || !host.isConnected) return;
      const cv = host.querySelector('.cr-canvas');
      if (cv) {
        const dpr = window.devicePixelRatio || 1;
        const w = cv.clientWidth || 180;
        const h = cv.clientHeight || 220;
        if (cv.width !== Math.round(w * dpr)) {
          cv.width = Math.round(w * dpr);
          cv.height = Math.round(h * dpr);
        }
        const ctx = cv.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, cv.width, cv.height);
        const s = (Math.min(w / 30, h / 52) * dpr) | 0 || 4;
        ctx.setTransform(s, 0, 0, s, 0, 0);
        ctx.imageSmoothingEnabled = false;
        if (now - manual > 3000) dir = Math.floor(now / 1500) % 4;
        AA.Sprites.drawChar(ctx, cv.width / s / 2, cv.height / s - 6, look, DIRS[dir], 0);
      }
      requestAnimationFrame(draw);
    }

    render();
    requestAnimationFrame(draw);
    return {
      get look() {
        return Object.assign({}, look);
      },
      focus() {
        const f = host.querySelector('.cr-row .on') || host.querySelector('.cr-row button');
        if (f) f.focus({ preventScroll: true });
      },
      destroy() {
        alive = false;
      },
    };
  }

  // Cambiar el aspecto durante la partida (menú de pausa).
  function openModal() {
    let ctl = null;
    AA.UI.modal({
      title: `👕 ${T('Cambiar aspecto', 'Change look')}`,
      wide: true,
      className: 'creator-modal',
      html: '<div class="cr-host"></div>',
      buttons: [
        { label: T('Cancelar', 'Cancel') },
        {
          label: T('Guardar', 'Save'),
          primary: true,
          action: () => {
            AA.State.setLook(ctl.look);
            AA.UI.toast(T('👕 ¡Nuevo look guardado!', '👕 New look saved!'), 'ok');
          },
        },
      ],
      onOpen: (card) => {
        ctl = mount(card.querySelector('.cr-host'), { look: AA.State.data.look || AA.State.DEFAULT_LOOK });
        setTimeout(() => ctl.focus(), 40);
      },
      onClose: () => ctl && ctl.destroy(),
    });
  }

  AA.Creator = { mount, openModal, randomLook };
})();
