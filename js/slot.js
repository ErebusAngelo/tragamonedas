// Slot machine logic: 3 reels, stop by touch/click; win if all show win.png
(function() {
  const IMG_DIR = 'assets/gamescreen/';
  const BASE_IMAGES = [
    '1.png','2.png','3.png','4.png','5.png','6.png','7.png','8.png','9.png','10.png','11.png','12.png','13.png','win.png'
  ];
  // Modo debug: evita volver automáticamente a index
  const DEBUG_NO_REDIRECT = true;

  // Utilidad: mezcla aleatoria (Fisher–Yates)
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Reglas de distribución: garantizar aparición de 'win' y evitar repeticiones contiguas
  const NON_WIN = BASE_IMAGES.filter(n => n !== 'win.png');
  const WIN_MAX_GAP = 10;   // Garantizar al menos un 'win' cada 10 tiles
  const BLOCK_COUNT = 10;   // Cantidad de bloques para alargar el track y hacer el loop menos frecuente

  function buildBlock(prevName) {
    const block = [];
    let pool = shuffle(NON_WIN);
    let poolIdx = 0;
    // Evitar que 'win' quede pegado al anterior si el anterior es 'win'
    let winIndex = Math.floor(Math.random() * (WIN_MAX_GAP - 2)) + 1; // en 1..WIN_MAX_GAP-2
    if (prevName === 'win.png') winIndex = Math.max(1, winIndex);

    for (let pos = 0; pos < WIN_MAX_GAP; pos++) {
      if (pos === winIndex) {
        // Colocar win.png con restricción de no repetir contiguo
        if (prevName === 'win.png') {
          // moverlo una posición adelante si fuera repetido
          winIndex = Math.min(WIN_MAX_GAP - 2, winIndex + 1);
        }
        block.push('win.png');
        prevName = 'win.png';
      } else {
        // tomar siguiente imagen no-win que no repita con la anterior
        while (poolIdx < pool.length && pool[poolIdx] === prevName) poolIdx++;
        if (poolIdx >= pool.length) {
          pool = shuffle(NON_WIN);
          poolIdx = 0;
          while (poolIdx < pool.length && pool[poolIdx] === prevName) poolIdx++;
        }
        const name = pool[poolIdx++];
        block.push(name);
        prevName = name;
      }
    }
    return { block, last: prevName };
  }

  const reels = Array.from(document.querySelectorAll('.reel'));
  if (reels.length !== 3) return;

  // Fallback de altura desde CSS root (solo px). Se medirá por elemento real.
  const cssTileHFallback = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tile-height')) || 260;

  function createTrack(reelEl) {
    const track = reelEl.querySelector('.reel-track');
    track.innerHTML = '';
    let prev = null;
    for (let b = 0; b < BLOCK_COUNT; b++) {
      const { block, last } = buildBlock(prev);
      for (const name of block) {
        // Evitar repetir contiguo entre bloques
        if (name === prev) {
          // buscar alternativa dentro del bloque actual
          const alt = NON_WIN.find(n => n !== prev) || name;
          const chosen = alt !== prev ? alt : name;
          const imgAlt = chosen.replace('.png','');
          const img1 = new Image();
          img1.src = IMG_DIR + chosen;
          img1.className = 'tile';
          img1.alt = imgAlt;
          track.appendChild(img1);
          prev = chosen;
          continue;
        }
        const img = new Image();
        img.src = IMG_DIR + name;
        img.className = 'tile';
        img.alt = name.replace('.png','');
        track.appendChild(img);
        prev = name;
      }
      prev = last;
    }
    return track;
  }

  function makeReel(reelEl) {
    const track = createTrack(reelEl);
    const totalTiles = track.children.length;
    // Medir altura real del tile en píxeles para que el encaje sea exacto
    const sampleTile = track.querySelector('.tile');
    let tileH = sampleTile?.getBoundingClientRect().height || 0;
    if (!tileH || !isFinite(tileH) || tileH <= 0) {
      tileH = parseFloat(getComputedStyle(sampleTile).height) || cssTileHFallback;
    }
    const trackH = totalTiles * tileH;
    const reelH = reelEl.clientHeight;
    const center = reelH / 2;

    const state = {
      pos: Math.random() * trackH,           // position within track
      speed: 500 + Math.random() * 220,      // px/s
      running: true,
      stopping: false,
      stopped: false,
      win: false,
      targetPos: null,
      targetIndex: null
    };

    function render() {
      const modRange = Math.max(1, trackH - reelH);
      const y = - (state.pos % modRange);
      track.style.transform = `translate3d(0, ${y}px, 0)`;
    }

    function update(dt) {
      if (state.running) {
        state.pos += state.speed * dt;
      }
      if (state.stopping) {
        state.speed -= 1200 * dt; // decelerate suavizada
        if (state.speed <= 40) {
          state.speed = 0;
          state.running = false;
          state.stopping = false;
          state.stopped = true;
        }
      }
      render();
    }

    function computeTargetFromCurrent() {
      const half = tileH / 2;
      const k = Math.round((state.pos + center - half) / tileH);
      let target = (k + 0.5) * tileH - center;
      while (target < state.pos) target += tileH; // asegurar objetivo hacia adelante
      state.targetPos = target;
      state.targetIndex = k;
    }

    function onPointerDown(e) {
      // Ignorar si ya está frenando o detenido
      if (!state.stopped && !state.stopping) {
        computeTargetFromCurrent();
        state.stopping = true;
      }
    }
    reelEl.addEventListener('pointerdown', onPointerDown);

    return { track, state, reelEl, tileH, trackH, reelH, center };
  }

  const reelObjs = reels.map(makeReel);

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    for (const ro of reelObjs) ro.update?.(dt);
    requestAnimationFrame(frame);
  }
  // Attach update methods on returned objects
  reelObjs.forEach(ro => ro.update = (dt) => {
    const { state, track, reelEl } = ro;
    // The update logic is enclosed in makeReel; rebind here
    // We'll recalc inside closure referencing ro functions
  });
  // Reconstruct update to use the functions declared inside makeReel
  // Simpler: recreate via direct reference after creation
  // Overwrite objects with correct update methods
  for (let i = 0; i < reelObjs.length; i++) {
    const ro = reelObjs[i];
    const track = ro.track;
    const reelEl = ro.reelEl;
    const totalTiles = track.children.length;
    // Usar exactamente las medidas calculadas en makeReel para evitar desajustes
    const tileH = ro.tileH;
    const trackH = ro.trackH;
    const reelH = ro.reelH;
    const center = ro.center;
    const state = ro.state;

    function render() {
      const modRange = Math.max(1, trackH - reelH);
      const y = - (state.pos % modRange);
      track.style.transform = `translate3d(0, ${y}px, 0)`;
    }
    function finalizeStop() {
      state.speed = 0;
      state.running = false;
      state.stopping = false;
      state.stopped = true;
      // determinar si es win leyendo el tile del centro real
      const half = tileH / 2;
      const k = Math.round((state.pos + center - half) / tileH);
      const idx = ((k % totalTiles) + totalTiles) % totalTiles;
      const tileEl = track.children[idx];
      const alt = tileEl?.alt || '';
      state.win = alt.toLowerCase() === 'win';
      checkAllStopped();
    }
    function checkAllStopped() {
      const allStopped = reelObjs.every(r => r.state.stopped);
      if (allStopped) {
        // En modo debug no redirigimos automáticamente
        if (!DEBUG_NO_REDIRECT) {
          setTimeout(() => { window.location.href = 'index.html'; }, 2500);
        } else {
          console.debug('Debug: todos los rodillos detenidos. Sin redirección.');
        }
      }
    }
    ro.render = render;
    ro.update = (dt) => {
      if (state.running) { state.pos += state.speed * dt; }
      if (state.stopping) {
        // reducción de velocidad y aproximación al objetivo
        const decel = 1200 * dt;
        state.speed = Math.max(40, state.speed - decel);
        const nextPos = state.pos + state.speed * dt;
        if (state.targetPos != null && nextPos >= state.targetPos - 2) {
          state.pos = state.targetPos;
          finalizeStop();
        } else {
          state.pos = nextPos;
        }
      }
      render();
    };
  }

  requestAnimationFrame(frame);

  // Reinicio automático no requerido; se vuelve a index al finalizar
})();