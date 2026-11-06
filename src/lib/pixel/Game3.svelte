<script lang="ts">
  import { MAPS3, MIRRORS, WAREHOUSE, STATUES, STATUE_NAMES, PORTAL3, traceBeam, type Screen3 } from './maps3';
  import { TILE } from './art';
  import { portal } from './art2';
  import { sprite3, statue, tile3 } from './art3';
  import { pixel } from './state.svelte';
  import { sfx } from './audio';
  import Console from './Console.svelte';
  import { DELTA, DIR_ES, Talk, type Dir } from './talk.svelte';

  // Mundo 3 «16 bits»: día y noche, rayos y espejos, cajas pesadas y estatuas que miran
  const W = 20;
  const H = 18;
  const NAMES: Record<Screen3, string> = {
    plaza: 'Plaza de Ciudad Engranaje',
    espejos: 'Laboratorio de espejos',
    almacen: 'Almacén',
    reloj: 'Torre del reloj',
  };

  const talk = new Talk();
  const say = (lines: string[], after?: () => void) => talk.say(lines, after);
  const w = $derived(pixel.s.w3);
  let lastMove = 0;

  // Cajas del almacén: si ya se resolvió, quedan sobre las marcas
  const freshBoxes = () => (pixel.s.w3.boxesDone ? WAREHOUSE.goals : WAREHOUSE.boxes).map((b) => [...b] as [number, number]);
  let boxes = $state<[number, number][]>(freshBoxes());

  const beam = $derived(traceBeam(w.mirrors));

  const at = (x: number, y: number) => {
    if (w.screen === 'reloj' && w.running && x === PORTAL3[0] && y === PORTAL3[1]) return 'q';
    return MAPS3[w.screen][y]?.[x] ?? '#';
  };
  const mirrorAt = (x: number, y: number) => (w.screen === 'espejos' ? MIRRORS.pos.findIndex(([mx, my]) => mx === x && my === y) : -1);
  const boxAt = (x: number, y: number) => (w.screen === 'almacen' ? boxes.findIndex(([bx, by]) => bx === x && by === y) : -1);

  function solid(x: number, y: number) {
    const ch = at(x, y);
    switch (w.screen) {
      case 'plaza':
        return '#TLbFZNugcf'.includes(ch);
      case 'espejos':
        return '#EXo'.includes(ch) || mirrorAt(x, y) >= 0;
      case 'almacen':
        return ch === '#';
      case 'reloj':
        return '#G'.includes(ch);
    }
  }

  function go(screen: Screen3, x: number, y: number, dir: Dir) {
    sfx('door');
    Object.assign(pixel.s.w3, { screen, x, y, dir });
    if (screen === 'almacen') boxes = freshBoxes();
    pixel.save();
  }

  const EXITS: Record<Screen3, Record<string, () => void>> = {
    plaza: {
      M: () => go('espejos', 10, 14, 'up'),
      W: () => go('almacen', 9, 12, 'up'),
      C: () => go('reloj', 10, 14, 'up'),
    },
    espejos: { O: () => go('plaza', 1, 5, 'right') },
    almacen: { O: () => go('plaza', 18, 5, 'left') },
    reloj: { O: () => go('plaza', 9, 2, 'down') },
  };

  function move(dir: Dir) {
    if (talk.open || pixel.isDone('tiempo')) return;
    const now = performance.now();
    if (now - lastMove < 110) return;
    lastMove = now;
    pixel.s.w3.dir = dir;
    const [dx, dy] = DELTA[dir];
    const nx = w.x + dx;
    const ny = w.y + dy;
    const ch = at(nx, ny);

    const exit = EXITS[w.screen][ch];
    if (exit) return exit();
    if (ch === 'q') {
      pixel.s.w3.x = nx;
      pixel.s.w3.y = ny;
      sfx('item');
      pixel.complete('tiempo');
      return;
    }

    // Empujar cajas en el almacén
    const bi = boxAt(nx, ny);
    if (bi >= 0) {
      const bx = nx + dx;
      const by = ny + dy;
      const toEntry = bx === WAREHOUSE.entry[0] && by === WAREHOUSE.entry[1];
      if (w.boxesDone || solid(bx, by) || boxAt(bx, by) >= 0 || at(bx, by) === 'O' || toEntry) return sfx('bump');
      boxes[bi] = [bx, by];
      sfx('push');
      pixel.s.w3.x = nx;
      pixel.s.w3.y = ny;
      checkBoxes();
      pixel.save();
      return;
    }

    if (solid(nx, ny)) return sfx('bump');
    pixel.s.w3.x = nx;
    pixel.s.w3.y = ny;
    sfx('step');
    pixel.save();
  }

  function checkBoxes() {
    const ok = WAREHOUSE.goals.every(([gx, gy]) => boxes.some(([bx, by]) => bx === gx && by === gy));
    if (!ok || pixel.s.w3.boxesDone) return;
    pixel.s.w3.boxesDone = true;
    pixel.give('engAlmacen');
    pixel.complete('almacen');
    pixel.save();
    setTimeout(() => {
      sfx('item');
      say(['Las cinco marcas se iluminan bajo las cajas.', 'Una trampilla se abre en el suelo: dentro hay un engranaje.', '¡Has conseguido el ENGRANAJE DE BRONCE!']);
    }, 150);
  }

  /** R / ↺: espejos a su posición inicial, o cajas a su sitio y Leo a la entrada */
  function reset() {
    if (w.screen === 'espejos' && !pixel.isDone('espejos')) {
      pixel.s.w3.mirrors = [...MIRRORS.initial];
      pixel.save();
      sfx('door');
      say(['Los espejos giran solos y vuelven a como estaban.']);
    } else if (w.screen === 'almacen' && !w.boxesDone) {
      boxes = freshBoxes();
      Object.assign(pixel.s.w3, { x: 9, y: 12, dir: 'up' });
      pixel.save();
      sfx('door');
      say(['Las cajas vuelven a su sitio y tú, a la entrada.']);
    }
  }

  function interact() {
    if (pixel.isDone('tiempo')) return;
    const [dx, dy] = DELTA[w.dir];
    const tx = w.x + dx;
    const ty = w.y + dy;
    const ch = at(tx, ty);

    if (w.screen === 'plaza') {
      if (ch === 'Z') return toggleNight();
      if (ch === 'N') return say(inventorLines());
      if ((STATUES as readonly string[]).includes(ch)) return touchStatue(ch);
      if (ch === 'F')
        return say(
          pixel.isDone('estatuas')
            ? ['La fuente ha dejado de girar sobre sí misma. Ya no guarda nada.']
            : ['Una fuente con un mecanismo de engranajes en el fondo. Está atascada.', w.night ? 'De noche, el agua refleja los ojos de las estatuas.' : 'De día el agua solo refleja el cielo.']
        );
      if (ch === 'L') return say([w.night ? 'La farola ilumina la plaza con una luz cálida.' : 'Una farola apagada. Se encenderá cuando anochezca.']);
      if (ch === 'b') return say(['Un banco. Desde aquí se ven las cuatro estatuas de la plaza.']);
      if (ch === 'T') return say(['Un árbol con hojas de dos tonos de verde. ¡Qué lujo, en 16 bits!']);
    }

    if (w.screen === 'espejos') {
      const mi = mirrorAt(tx, ty);
      if (mi >= 0) return rotateMirror(mi);
      if (ch === 'E') return say(['El emisor dispara un rayo de luz sin parar.']);
      if (ch === 'X') return say([beam.hit ? 'El receptor brilla: le llega el rayo.' : 'Un receptor dorado. Espera la luz.']);
    }

    if (w.screen === 'reloj' && ch === 'G') return useMachine();
  }

  function toggleNight() {
    pixel.s.w3.night = !w.night;
    pixel.save();
    sfx('rune');
    say([w.night ? 'Giras la aguja del reloj de sol… y cae la noche sobre Ciudad Engranaje.' : 'Giras la aguja otra vez: amanece de golpe.']);
  }

  function inventorLines() {
    if (w.night) return ['Zzz… engranajes… zzz… el búho siempre es el primero en despertar… zzz…'];
    if (!pixel.isDone('reloj'))
      return [
        '¡Un viajero de otro cartucho! Soy la inventora de Ciudad Engranaje.',
        'El reloj de la torre se paró y con él, el tiempo. Le faltan tres engranajes.',
        'Uno está en mi laboratorio de espejos. Otro, enterrado en el almacén. El tercero lo guardan las estatuas de la plaza.',
        'Y si necesitas que se haga de noche, gira el reloj de sol. Algunas cosas solo se ven a oscuras.',
      ];
    return ['¡El reloj vuelve a sonar! Corre a la torre antes de que se cierre el portal.'];
  }

  function touchStatue(id: string) {
    if (pixel.isDone('estatuas')) return say([`La estatua del ${STATUE_NAMES[id]} parece sonreír.`]);
    const next = [...w.statues, id];
    if (STATUES[next.length - 1] !== id) {
      pixel.s.w3.statues = [];
      pixel.save();
      sfx('no');
      return say([`Tocas la estatua del ${STATUE_NAMES[id]}… y todas vuelven a su posición con un chasquido.`]);
    }
    pixel.s.w3.statues = next;
    sfx('rune');
    if (next.length === STATUES.length) {
      pixel.give('engEstatuas');
      pixel.complete('estatuas');
      sfx('item');
      say(['Las cuatro estatuas giran la cabeza hacia la fuente.', 'Del fondo del agua sube un engranaje reluciente.', '¡Has conseguido el ENGRANAJE DE PLATA!']);
    } else say([`La estatua del ${STATUE_NAMES[id]} hace «clic».`]);
    pixel.save();
  }

  function rotateMirror(i: number) {
    if (pixel.isDone('espejos')) return say(['El espejo está fijo: el rayo ya llega al receptor.']);
    pixel.s.w3.mirrors[i] = w.mirrors[i] === '/' ? '\\' : '/';
    sfx('rune');
    if (traceBeam(pixel.s.w3.mirrors).hit) {
      pixel.give('engEspejos');
      pixel.complete('espejos');
      sfx('item');
      say(['El rayo llega al receptor dorado. ¡Zumbido!', 'Del receptor cae un engranaje transparente.', '¡Has conseguido el ENGRANAJE DE CRISTAL!']);
    }
    pixel.save();
  }

  function useMachine() {
    if (w.running) return say(['La máquina gira con un tic-tac perfecto.']);
    const gears = (['engEspejos', 'engAlmacen', 'engEstatuas'] as const).filter((g) => pixel.s.items.includes(g));
    if (gears.length < 3) return say([`La máquina del reloj tiene tres ejes vacíos. Tienes ${gears.length} de 3 engranajes.`]);
    gears.forEach((g) => pixel.use(g));
    pixel.s.w3.running = true;
    pixel.complete('reloj');
    pixel.save();
    sfx('ok');
    say([
      'Encajas los tres engranajes. TIC… TAC… TIC… TAC…',
      'Por toda la ciudad, las cosas vuelven a moverse.',
      'En el centro de la torre se abre un portal que zumbea como una consola nueva.',
    ]);
  }

  // Dibujo
  let drawX = pixel.s.w3.x * TILE;
  let drawY = pixel.s.w3.y * TILE;
  let lastScreen = pixel.s.w3.screen;

  function tileFor(ch: string, blink: boolean, t: number) {
    const s = w.screen;
    if (s === 'plaza') {
      const m: Record<string, string> = { '#': 'building', ',': 'paseo', T: 'tree', b: 'bench', F: 'fountain', Z: 'sundial', C: 'doorTower', M: 'doorLab', W: 'doorWare' };
      if (ch === 'L') return tile3(w.night ? 'lampNight' : 'lampDay');
      if ((STATUES as readonly string[]).includes(ch)) {
        // De noche los ojos brillan uno tras otro en el orden secreto (con una pausa)
        const step = Math.floor(t / 650) % (STATUES.length + 1);
        return statue(ch, w.night && STATUES[step] === ch);
      }
      return m[ch] ? tile3(m[ch] as never) : null;
    }
    if (s === 'espejos') {
      if (ch === '#') return tile3('labWall');
      if (ch === 'o') return tile3('column');
      if (ch === 'E') return tile3('emitter');
      if (ch === 'X') return tile3(beam.hit ? 'receiverOn' : 'receiver');
      if (ch === 'O') return tile3('exit');
      return null;
    }
    if (s === 'almacen') {
      if (ch === '#') return tile3('wareWall');
      if (ch === 'O') return tile3('exit');
      return null;
    }
    if (ch === '#') return tile3('wareWall');
    if (ch === 'G') return tile3(w.running ? 'machineOn' : 'machine');
    if (ch === 'O') return tile3('exit');
    if (ch === 'q') return portal(blink ? 0 : 1);
    return null;
  }

  function render(g: CanvasRenderingContext2D, t: number) {
    if (w.screen !== lastScreen) {
      drawX = w.x * TILE;
      drawY = w.y * TILE;
      lastScreen = w.screen;
    }
    const blink = Math.floor(t / 400) % 2 === 0;
    const base = { plaza: 'cobble', espejos: 'lab', almacen: 'planks', reloj: 'stone' }[w.screen] as 'cobble';
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        g.drawImage(tile3(base), x * TILE, y * TILE);
        const img = tileFor(at(x, y), blink, t);
        if (img) g.drawImage(img, x * TILE, y * TILE);
      }
    }

    if (w.screen === 'espejos') {
      MIRRORS.pos.forEach(([x, y], i) => g.drawImage(tile3(w.mirrors[i] === '/' ? 'mirrorA' : 'mirrorB'), x * TILE, y * TILE));
      // El rayo, de casilla en casilla
      g.save();
      g.strokeStyle = blink ? '#ff6a4a' : '#ff9a6a';
      g.lineWidth = 2;
      g.shadowColor = '#ff6a4a';
      g.shadowBlur = 6;
      g.beginPath();
      beam.path.forEach(([x, y], i) => (i ? g.lineTo(x * TILE + 4, y * TILE + 4) : g.moveTo(x * TILE + 4, y * TILE + 4)));
      g.stroke();
      g.restore();
    }
    if (w.screen === 'almacen') {
      for (const [x, y] of WAREHOUSE.goals) g.drawImage(tile3('goal'), x * TILE, y * TILE);
      for (const [x, y] of boxes) g.drawImage(tile3('crate'), x * TILE, y * TILE);
    }
    if (w.screen === 'plaza') {
      MAPS3.plaza.forEach((row, y) => [...row].forEach((c, x) => c === 'N' && g.drawImage(sprite3(w.night ? 'inventorSleep' : 'inventor'), x * TILE, y * TILE)));
    }

    drawX += (w.x * TILE - drawX) * 0.4;
    drawY += (w.y * TILE - drawY) * 0.4;
    const leo = { up: 'leoUp', down: 'leoDown', left: 'leoLeft', right: 'leoRight' }[w.dir] as 'leoUp';
    g.drawImage(sprite3(leo), Math.round(drawX), Math.round(drawY));

    // Noche en la plaza: todo azulado, con el halo de las farolas
    if (w.screen === 'plaza' && w.night) {
      g.save();
      g.fillStyle = 'rgba(16, 24, 72, 0.6)';
      g.fillRect(0, 0, W * TILE, H * TILE);
      g.globalCompositeOperation = 'lighter';
      MAPS3.plaza.forEach((row, y) =>
        [...row].forEach((c, x) => {
          if (c !== 'L') return;
          const grad = g.createRadialGradient(x * TILE + 4, y * TILE + 2, 1, x * TILE + 4, y * TILE + 2, 18);
          grad.addColorStop(0, 'rgba(244, 200, 64, 0.45)');
          grad.addColorStop(1, 'rgba(244, 200, 64, 0)');
          g.fillStyle = grad;
          g.fillRect(x * TILE - 16, y * TILE - 16, 40, 40);
        })
      );
      // Los ojos encendidos se ven por encima de la oscuridad
      g.globalCompositeOperation = 'source-over';
      MAPS3.plaza.forEach((row, y) =>
        [...row].forEach((c, x) => {
          if (!(STATUES as readonly string[]).includes(c)) return;
          const step = Math.floor(t / 650) % (STATUES.length + 1);
          if (STATUES[step] === c) g.drawImage(statue(c, true), x * TILE, y * TILE);
        })
      );
      g.restore();
    }
  }

  const facing = $derived.by(() => {
    const [dx, dy] = DELTA[w.dir];
    return at(w.x + dx, w.y + dy);
  });
</script>

<Console
  {talk}
  {render}
  theme="w3"
  onmove={move}
  oninteract={interact}
  onreset={reset}
  resetLabel={w.screen === 'espejos' && !pixel.isDone('espejos') ? 'Reiniciar los espejos' : w.screen === 'almacen' && !w.boxesDone ? 'Recolocar las cajas' : ''}
  label="{NAMES[w.screen]}{w.night && w.screen === 'plaza' ? ' (de noche)' : ''}. Leo está en la casilla {w.x}, {w.y}, mirando hacia {DIR_ES[w.dir]}."
  attrs={{
    screen: w.screen,
    x: w.x,
    y: w.y,
    dir: w.dir,
    facing,
    night: w.night ? 'si' : 'no',
    beam: beam.hit ? 'receptor' : 'no',
    mirrors: w.mirrors.join(''),
    boxes: boxes.map((b) => b.join(',')).join(' '),
    statues: w.statues.length,
  }}
/>
