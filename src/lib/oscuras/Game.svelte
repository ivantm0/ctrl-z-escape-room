<script lang="ts">
  import { onMount } from 'svelte';
  import { TILE, COLS, ROWS, type Level, type PlatformDef, type SpikesDef } from './maps';
  import { campaign } from './campaign';

  let {
    start = 0,
    onwin,
    onlevel,
    levels = campaign,
  }: {
    start?: number;
    onwin?: () => void;
    /** Se llama al entrar en cada nivel (para guardar el progreso) */
    onlevel?: (i: number) => void;
    /** Niveles del juego (por defecto, la campaña completa de 100) */
    levels?: Level[];
  } = $props();

  // Ambientación del nivel actual (cada nivel la trae en `theme`):
  /** Abismo: roca rojiza y algo más de luz */
  let ABYSS = $state(false);
  /** Julián está muerto: la luz le quema, ve en la oscuridad y tiene que comer */
  let DEAD = $state(false);
  /** Fuera de la mina (pueblo, comarca y ciudad), de noche */
  let OUT = $state(false);
  const look = () => levels[levelIdx]?.look;
  /** Grutas luminosas (galerías 21–25): hongos y cristales que dan luz propia */
  const grotto = () => levels[levelIdx]?.look === 'grutas';
  let GROTTO = $state(false);

  const W = COLS * TILE;
  const H = ROWS * TILE;

  // Física (unidades: px y fotogramas a 60 Hz)
  const GRAV = 0.35;
  const MAX_FALL = 6;
  const RUN = 1.6;
  const ACCEL = 0.25;
  const JUMP_V = 5.2;
  const COYOTE = 6;
  const BUFFER = 6;
  const PW = 10;
  const PH = 14;
  /** Aceite del farol: 30 s llevándolo; en los últimos 5 s la luz se va apagando */
  const FUEL = 30 * 60;
  const FADE = 5 * 60;

  type Body = { x: number; y: number; w: number; h: number; vx: number; vy: number; ground: boolean };
  /** fuel: aceite que le queda a un farol soltado (los del mapa vienen llenos) */
  type Item = { kind: 'L' | 'F' | 'T' | 'G' | 'D'; x: number; y: number; fuel?: number };
  /** Hueco: minero muerto que camina. No ve, pero oye: si haces ruido cerca, va a por ti */
  /** stuck/lastX: para que en la Parte IV la horda no se quede atascada detrás de una casa */
  type Hollow = Body & { dir: number; alert: number; target: number; stuck?: number; lastX?: number };
  /** Araña de cristal: cuelga del techo y se deja caer cuando pasas debajo */
  type Spider = { x: number; y: number; ay: number; vy: number; state: 'hang' | 'warn' | 'drop' | 'gone'; timer: number };
  /** Dinamita encendida */
  /** vx/vy: dinamita lanzada por Ventura, en vuelo hasta que toca roca */
  type Bomb = { x: number; y: number; fuse: number; vx?: number; vy?: number; own?: boolean };
  /** Polilla de luz: vuela hacia la lámpara y le chupa el aceite */
  type Moth = { x: number; y: number; hx: number; hy: number; phase: number };
  /** Humano: «h» de la cuadrilla de rescate (patrulla con lámpara y pico) o «I» el cura (quieto, rezando) */
  /** «v» vecino (huye gritando y avisa a la Guardia Civil) · «g» guardia civil (dispara) */
  type Human = Body & { kind: 'h' | 'I' | 'v' | 'g'; dir: number; alert: number; cool: number; target: number; eaten: number };
  type Bullet = { x: number; y: number; vx: number; life: number };
  /** Perro del capataz: te huele aunque no te vea */
  type Dog = Body & { dir: number; cool: number; eaten: number };
  /** Ventura, el capataz: apostado en un sitio, te lanza dinamita */
  type Foreman = { x: number; y: number; cool: number; seen: boolean };
  type Corpse = { tx: number; ty: number; note: string; flip: boolean };
  /** Sombra: atraviesa la roca, persigue al jugador y huye de la luz fuerte */
  type Shade = { x: number; y: number; sx: number; sy: number; fleeing: boolean; phase: number };
  /** hold: fotogramas que lleva activo su interruptor (para el retardo) */
  type Plat = Body & { def: PlatformDef; s: number; len: number; hold?: number };
  /** timer: fotogramas que le quedan a una palanca con temporizador antes de volver sola */
  type Switch = { kind: 'plate' | 'lever'; tx: number; ty: number; w: number; on: boolean; timer?: number };
  /** Segundos que le quedan a la puerta abierta por palanca (para el marcador) */
  let doorTime = $state(0);
  const TIMER_KEY = 'oscuras-palanca-vista';

  let canvas: HTMLCanvasElement;
  let levelIdx = $state(0);
  let flares = $state(0);
  let carrying = $state(false);
  let fuel = $state(0);
  /** Aviso que explica el farol la primera vez que se coge (se recuerda en este navegador) */
  let hint = $state('');
  let hintTime = 0;
  const HINT_KEY = 'oscuras-farol-visto';
  let flareTime = $state(0);
  /** Cartuchos de dinamita que llevas */
  let dynamite = $state(0);
  let hasPick = $state(false);
  let gold = $state(0);
  /** Cartel con el título del nivel al entrar */
  let banner = $state<{ n: number; name: string; line: string } | null>(null);
  let bannerTime = 0;
  let deaths = $state(0);
  let done = $state(false);

  let grid: string[] = [];
  let player: Body;
  let boxes: Body[] = [];
  let plats: Plat[] = [];
  let spikes: SpikesDef[] = [];
  let switches: Switch[] = [];
  let items: Item[] = [];
  let corpses: Corpse[] = [];
  let hollows: Hollow[] = [];
  let spiders: Spider[] = [];
  let bombs: Bomb[] = [];
  let moths: Moth[] = [];
  let humans: Human[] = [];
  let bullets: Bullet[] = [];
  /** Parte IV: por dónde ha pasado Julián (la horda le sigue por ahí) */
  let path: { x: number; y: number }[] = [];
  /** Muertos recientes que se levantarán para unirse a la horda */
  let risen: { x: number; y: number; at: number }[] = [];
  /** Parte IV: tamaño de la horda (los cuarenta más los que se van levantando) */
  let horde = $state(40);
  let dogs: Dog[] = [];
  /** Parte III: carne (vida) y hambre, de 0 a 100 */
  let flesh = $state(100);
  let hunger = $state(100);
  /** Humanos comidos en esta galería (algunas salidas exigen un mínimo) */
  let eaten = $state(0);
  /** Comiendo: fotogramas que quedan; el jugador no se mueve */
  let feeding = 0;
  let feedVictim: { x: number; y: number } | null = null;
  /** Para avisar del hambre en la salida sin repetirlo a cada fotograma */
  let exitNag = 0;
  /** Se está quemando (para el destello rojo) */
  let burning = 0;
  let foremen: Foreman[] = [];
  /** Tu recorrido en esta galería, para el eco que te sigue */
  let trail: { x: number; y: number; f: number }[] = [];
  /** Altura del agua que sube (px desde arriba); Infinity si no hay inundación */
  let floodY = Infinity;
  /** Suelos que se derrumban: casilla → fotogramas que lleva pisada */
  const crumbling = new Map<string, number>();
  /** Destello de una explosión (fotogramas) */
  let flash = 0;

  // ---------- Escenas ----------
  /** «luz»: al entrar en las grutas · «boom»: la falsa salida de la galería 25 */
  let cine = $state<{ kind: 'luz' | 'boom'; lines: string[] } | null>(null);
  /** Fotogramas desde que empezó la escena (para revelar las líneas y la luz) */
  let cineT = $state(0);
  /** Explosión final en curso (fotogramas que quedan) */
  let blast = $state(0);
  const cineSeen = new Set<number>();
  const LINE_FRAMES = 140;
  const cineShown = $derived(cine ? Math.min(cine.lines.length, Math.floor(cineT / LINE_FRAMES) + 1) : 0);
  const cineReady = $derived(!!cine && cineShown === cine.lines.length && cineT > (cine.lines.length - 1) * LINE_FRAMES + 60);

  /** Explosión: destello blanco que se apaga a negro en un segundo y luego se queda en negro */
  function blastStyle() {
    const k = Math.max(0, Math.min(1, (blast - 90) / 60));
    const o = Math.min(1, (150 - blast) / 6 + 0.35);
    return `background: rgb(${255 * k} ${250 * k} ${230 * k}); opacity: ${o}`;
  }

  function startCine(kind: 'luz' | 'boom', lines: string[]) {
    cine = { kind, lines };
    cineT = 0;
    keys.clear();
  }

  function advanceCine() {
    if (!cine) return;
    // Primero muestra todo el texto; luego cierra la escena
    if (!cineReady) {
      cineT = (cine.lines.length - 1) * LINE_FRAMES + 61;
      return;
    }
    if (cine.kind === 'boom') {
      cine = null;
      blast = 150;
      return;
    }
    cine = null;
  }

  const BOOM_LINES = [
    'Arriba hay luz. Luz de verdad, blanca, de día. Se oyen pájaros.',
    'La jaula del montacargas te espera, con la cuerda tensa hacia el cielo. Entras. Sube.',
    'A medio camino, una silueta se asoma al borde del pozo. Lleva el casco del capataz.',
    '«Mejor uno que el pueblo entero», dice Ventura. Y enciende la mecha.',
  ];
  let shades: Shade[] = [];
  const SHADE_W = 10;
  const SHADE_H = 13;
  /** Aviso la primera vez que una sombra se acerca (se recuerda en este navegador) */
  const SHADE_KEY = 'oscuras-sombra-vista';
  /** Escalera: trepando (sin gravedad) */
  let climbing = false;
  /** El jugador está sobre o dentro de una escalera (las flechas arriba trepan en vez de saltar) */
  let nearLadder = false;
  /** Último sentido en que miraba el jugador: 1 derecha, -1 izquierda (para el pico) */
  let facing = 1;
  let spawn = { x: 0, y: 0 };
  let coyote = 0;
  let buffer = 0;
  /** Reloj de la pantalla: se pone a 0 al cargarla, así los ciclos son reproducibles */
  let t = 0;
  let crushed = false;
  let sneaking = false;
  /** Lanzado por una seta: el salto no se corta al soltar la tecla */
  let bouncing = false;
  const taken = new Set<string>();
  const keys = new Set<string>();

  // Lo que llevabas al entrar en la pantalla: al morir o pulsar R vuelves a ese estado
  let checkpoint = { carrying: false, fuel: 0, flares: 0, hasPick: false, gold: 0, dynamite: 0, hunger: 100, horde: 40, taken: [] as string[] };

  // ---------- Carga ----------

  const pathLen = (p: [number, number][]) =>
    p.slice(1).reduce((acc, q, i) => acc + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]) * TILE, 0);

  /** Posición en px a una fracción s ∈ [0,1] del recorrido */
  function pathAt(def: PlatformDef, s: number) {
    const total = pathLen(def.path);
    let d = s * total;
    for (let i = 1; i < def.path.length; i++) {
      const [ax, ay] = def.path[i - 1];
      const [bx, by] = def.path[i];
      const seg = Math.hypot(bx - ax, by - ay) * TILE;
      if (d <= seg || i === def.path.length - 1) {
        const k = seg ? Math.min(1, d / seg) : 0;
        return { x: (def.x + ax + (bx - ax) * k) * TILE, y: (def.y + ay + (by - ay) * k) * TILE };
      }
      d -= seg;
    }
    return { x: def.x * TILE, y: def.y * TILE };
  }

  /** enter=true al llegar a una pantalla nueva; false al reiniciar la actual */
  function load(i: number, enter = false) {
    const theme = levels[i].theme ?? 'mina';
    ABYSS = theme === 'abismo';
    DEAD = theme === 'muerto' || theme === 'pueblo';
    OUT = theme === 'pueblo';
    if (enter) {
      // Algunas galerías te apagan la lámpara al entrar
      if (levels[i].lampOut) {
        carrying = false;
        fuel = 0;
      }
      checkpoint = { carrying, fuel, flares, hasPick, gold, dynamite, hunger, horde, taken: [...taken] };
      onlevel?.(i);
      stains = [];
      banner = { n: i + 1, name: levels[i].name, line: levels[i].line };
      bannerTime = 4 * 60;
    } else {
      carrying = checkpoint.carrying;
      fuel = checkpoint.fuel;
      flares = checkpoint.flares;
      dynamite = checkpoint.dynamite;
      hasPick = checkpoint.hasPick;
      hunger = checkpoint.hunger;
      horde = checkpoint.horde;
      gold = checkpoint.gold;
      taken.clear();
      checkpoint.taken.forEach((k) => taken.add(k));
    }
    flareTime = 0;
    t = 0;
    levelIdx = i;
    const lvl = levels[i];
    GROTTO = lvl.look === 'grutas';
    bouncing = false;
    // Escena al entrar en una galería (solo la primera vez en esta partida)
    if (enter && lvl.cinematic && !cineSeen.has(i)) {
      cineSeen.add(i);
      startCine('luz', lvl.cinematic);
    }
    grid = lvl.grid.map((r) => r.replace(/[PBLFK_TGCMUADOVhIpvg]/g, '.'));
    bullets = [];
    risen = [];
    path = [];
    humans = [];
    dogs = [];
    eaten = 0;
    feeding = 0;
    feedVictim = null;
    flesh = 100;
    // Muerto: rompe la roca con las manos y no puede llevar lámpara
    if (DEAD) {
      hasPick = true;
      carrying = false;
    }
    moths = [];
    foremen = [];
    trail = [];
    floodY = lvl.flood ? lvl.flood.from * TILE : Infinity;
    hollows = [];
    spiders = [];
    bombs = [];
    crumbling.clear();
    shades = [];
    boxes = [];
    items = [];
    corpses = [];
    switches = [];
    climbing = false;
    debris = [];
    let noteIdx = 0;
    lvl.grid.forEach((row, y) =>
      [...row].forEach((c, x) => {
        if (c === 'P') spawn = { x: x * TILE + (TILE - PW) / 2, y: y * TILE + TILE - PH };
        if (c === 'B') boxes.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE, vx: 0, vy: 0, ground: false });
        if ((c === 'L' || c === 'F' || c === 'T' || c === 'G') && !taken.has(`${i}:${x}:${y}`))
          items.push({ kind: c, x: x * TILE, y: y * TILE });
        if (c === 'h' || c === 'I' || c === 'v' || c === 'g')
          humans.push({ kind: c, x: x * TILE + 3, y: y * TILE + TILE - 14, w: 10, h: 14, vx: 0, vy: 0, ground: false, dir: x % 2 ? 1 : -1, alert: 0, cool: 0, target: 0, eaten: 0 });
        if (c === 'p') dogs.push({ x: x * TILE + 2, y: y * TILE + TILE - 9, w: 12, h: 9, vx: 0, vy: 0, ground: false, dir: -1, cool: 0, eaten: 0 });
        if (c === 'O') moths.push({ x: x * TILE + 8, y: y * TILE + 8, hx: x * TILE + 8, hy: y * TILE + 8, phase: x * 3 + y });
        if (c === 'V') foremen.push({ x: x * TILE + 2, y: y * TILE, cool: 120, seen: false });
        if (c === 'U') hollows.push({ x: x * TILE + 3, y: y * TILE + TILE - 14, w: 10, h: 14, vx: 0, vy: 0, ground: false, dir: x % 2 ? 1 : -1, alert: 0, target: 0 });
        if (c === 'A') spiders.push({ x: x * TILE + 4, y: y * TILE + 1, ay: y * TILE, vy: 0, state: 'hang', timer: 0 });
        if (c === 'D' && !taken.has(`${i}:${x}:${y}`)) items.push({ kind: 'D', x: x * TILE, y: y * TILE });
        if (c === 'M') shades.push({ x: x * TILE + 3, y: y * TILE + 2, sx: x * TILE + 3, sy: y * TILE + 2, fleeing: false, phase: x * 7 + y });
        if (c === 'C') corpses.push({ tx: x, ty: y, note: lvl.notes?.[noteIdx++] ?? '', flip: (x + y) % 2 === 0 });
        // Varias _ seguidas forman una sola placa
        if (c === '_' && row[x - 1] === '_') switches[switches.length - 1].w++;
        else if (c === '_') switches.push({ kind: 'plate', tx: x, ty: y, w: 1, on: false });
        if (c === 'K') switches.push({ kind: 'lever', tx: x, ty: y, w: 1, on: false });
      }),
    );
    plats = [];
    spikes = [];
    for (const def of lvl.movers ?? []) {
      if (def.kind === 'spikes') spikes.push(def);
      else
        plats.push({
          def,
          s: 0,
          len: pathLen(def.path),
          x: def.x * TILE,
          y: def.y * TILE,
          w: def.w * TILE,
          h: (def.h ?? 0.375) * TILE,
          vx: 0,
          vy: 0,
          ground: true,
        });
    }
    respawn();
  }

  function respawn() {
    player = { x: spawn.x, y: spawn.y, w: PW, h: PH, vx: 0, vy: 0, ground: false };
  }

  // ---------- Tiles y luz ----------

  const tileAt = (px: number, py: number) => {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    if (ty < 0) return '#';
    if (ty >= ROWS) return '.';
    if (tx < 0 || tx >= COLS) return '.';
    return grid[ty][tx];
  };
  /** Fuentes que materializan plataformas de luz: farol (llevado o en el suelo) y bengala */
  /** Parte III: luces que queman a Julián (lámparas de los vivos, velas, lámparas en el suelo, Ventura) */
  function burnLights() {
    const list: { x: number; y: number; r: number }[] = [];
    let candles = 0;
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        if (grid[y][x] === 'c') {
          candles++;
          list.push({ x: x * TILE + 8, y: y * TILE + 6, r: 34 });
        }
    // Parte IV: ventanas encendidas, farolas y hogueras
    if (OUT)
      for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++) {
          const c = grid[y][x];
          if (c === 'n') list.push({ x: x * TILE + 8, y: y * TILE + 8, r: 40 });
          else if (c === 'l') list.push({ x: x * TILE + 8, y: y * TILE + 3, r: 62 });
          else if (c === 'f') list.push({ x: x * TILE + 8, y: y * TILE + 8, r: 48 + Math.sin(t / 5 + x) * 4 });
        }
    for (const h of humans) {
      if (h.eaten) continue;
      const r =
        h.kind === 'I'
          ? 46 + candles * 10
          : h.kind === 'v'
            ? h.alert > 0
              ? 30
              : 36
            : h.kind === 'g'
              ? h.alert > 0
                ? 66
                : 50
              : h.alert > 0
                ? 76
                : 54;
      list.push({ x: h.x + (h.kind === 'I' ? 5 : h.dir > 0 ? 11 : -1), y: h.y + 5, r });
    }
    for (const it of items) if (it.kind === 'L') list.push({ x: it.x + 8, y: it.y + 8, r: 60 });
    for (const f of foremen) list.push({ x: f.x + 6, y: f.y + 2, r: 56 });
    return list;
  }

  function strongLights() {
    const list: { x: number; y: number; r: number }[] = DEAD ? burnLights() : [];
    if (carrying) list.push({ x: player.x + player.w / 2, y: player.y + player.h / 2, r: lanternR() });
    if (!DEAD) for (const it of items) if (it.kind === 'L') list.push({ x: it.x + 8, y: it.y + 8, r: 72 });
    if (flareTime > 0) list.push({ x: player.x + player.w / 2, y: player.y, r: 170 * Math.min(1, flareTime / 60) });
    return list;
  }
  /** Una casilla de luz es sólida si su centro está dentro del 75 % del radio de una luz fuerte */
  function lit(tx: number, ty: number) {
    const cx = tx * TILE + TILE / 2;
    const cy = ty * TILE + TILE / 2;
    return strongLights().some((s) => Math.hypot(s.x - cx, s.y - cy) < s.r * 0.75);
  }
  /** Las vetas de luz, mientras están iluminadas, son tan sólidas como un muro (también desde abajo).
   *  X es roca agrietada: sólida hasta que la rompes con el pico */
  const solidTile = (px: number, py: number) => {
    const c = tileAt(px, py);
    return (
      c === '#' ||
      c === 'X' ||
      c === 'W' ||
      c === 'R' ||
      c === '%' ||
      c === 'Y' ||
      c === 'n' ||
      ((c === '*' || c === '+') && pulseOn(c)) ||
      (c === '=' && lit(Math.floor(px / TILE), Math.floor(py / TILE)))
    );
  };
  const ladderAt = (px: number, py: number) => tileAt(px, py) === 'H';

  /** Cristales que laten: * y + se encienden por turnos y solo son sólidos encendidos.
   *  Cada uno pasa el 62 % del ciclo encendido, así que hay un momento en que lo están los dos */
  const pulsePeriod = () => levels[levelIdx].pulse ?? 160;
  const pulseT = (c: string) => (t + (c === '*' ? 0 : pulsePeriod() / 2)) % pulsePeriod();
  const pulseOn = (c: string) => pulseT(c) < pulsePeriod() * 0.62;
  /** El peldaño de arriba de una escalera sostiene al caer encima (salvo si trepas o pulsas abajo) */
  let passLadderTop = false;
  const ladderTop = (px: number, py: number, prevBottom: number) => {
    if (passLadderTop || !ladderAt(px, py)) return false;
    const ty = Math.floor(py / TILE);
    return !ladderAt(px, py - TILE) && prevBottom <= ty * TILE + 0.01;
  };

  /** Luz propia del jugador (lo que ve sin lámpara): cada galería puede ser más oscura */
  const ownLight = () => levels[levelIdx].dark ?? (grotto() ? 110 : ABYSS ? 52 : 42);

  /** Radio del farol que llevas: se encoge al quedarse sin aceite */
  const lanternR = () => 80 * Math.min(1, fuel / FADE);

  // ---------- Colisiones ----------

  // Margen para que errores de coma flotante no cuenten como solapamiento
  const EPS = 0.01;
  const overlap = (a: Body, b: Body) =>
    a.x < b.x + b.w - EPS && a.x + a.w > b.x + EPS && a.y < b.y + b.h - EPS && a.y + a.h > b.y + EPS;

  /** sy > 0 si el cuerpo baja en este paso (para apoyarse en lo alto de las escaleras) */
  function hitsWorld(b: Body, others: Body[], sy = 0) {
    for (const px of [b.x + EPS, b.x + b.w - EPS]) {
      for (const py of [b.y + EPS, b.y + b.h / 2, b.y + b.h - EPS]) if (solidTile(px, py)) return true;
      if (sy > 0 && ladderTop(px, b.y + b.h - EPS, b.y + b.h - sy)) return true;
    }
    return others.some((o) => o !== b && overlap(b, o));
  }

  /** Mueve en un eje por pasos de ≤1 px; devuelve true si chocó */
  function move(b: Body, dx: number, dy: number, others: Body[], push = false): boolean {
    // Si ya estaba solapado con algo, se ignora para poder salir y no quedarse pegado
    const free = others.filter((o) => o !== b && !overlap(b, o));
    const steps = Math.ceil(Math.abs(dx) + Math.abs(dy));
    const sx = dx / (steps || 1);
    const sy = dy / (steps || 1);
    for (let i = 0; i < steps; i++) {
      const px = b.x;
      const py = b.y;
      b.x += sx;
      b.y += sy;
      if (hitsWorld(b, free, sy)) {
        if (push && sx !== 0) {
          const box = boxes.find((o) => free.includes(o) && overlap(b, o));
          // Solo se empuja una caja apoyada y que esté a nuestra altura (no encima ni debajo)
          const level = box && b.y + b.h > box.y + 4 && b.y < box.y + box.h - 4;
          // Tras empujar, volver a comprobar: puede que además toquemos un muro
          if (box && level && box.ground && !move(box, sx, 0, [...boxes, ...plats]) && !hitsWorld(b, free)) continue;
        }
        b.x = px;
        b.y = py;
        return true;
      }
    }
    return false;
  }

  function fall(b: Body, others: Body[]) {
    b.vy = Math.min(MAX_FALL, b.vy + GRAV);
    const hit = move(b, 0, b.vy, others);
    b.ground = hit && b.vy > 0;
    if (hit) {
      // Apurar el contacto: sin esto un cuerpo puede quedarse hasta 1 px separado del suelo
      const dir = Math.sign(b.vy);
      for (let i = 0; i < 20 && dir && !move(b, 0, dir * 0.05, others); i++);
      b.vy = 0;
    }
  }

  // ---------- Elementos móviles ----------

  const active = (i: number | undefined) => i !== undefined && !!switches[i]?.on;

  function updateSwitches() {
    let left = 0;
    for (const sw of switches) {
      // Palancas con temporizador: vuelven solas a su sitio y la puerta se cierra
      if (sw.kind === 'lever' && sw.timer) {
        if (--sw.timer === 0) sw.on = false;
        left = Math.max(left, sw.timer);
      }
      if (sw.kind !== 'plate') continue;
      const zone: Body = { x: sw.tx * TILE + 1, y: sw.ty * TILE + 10, w: sw.w * TILE - 2, h: 6, vx: 0, vy: 0, ground: false };
      sw.on = [player, ...boxes].some((b) => overlap(b, zone));
    }
    const secs = Math.ceil(left / 60);
    if (secs !== doorTime) doorTime = secs;
  }

  /** Fracción del recorrido para una plataforma en bucle: ida, pausa, vuelta, pausa */
  function loopS(def: PlatformDef, len: number) {
    const T = len / def.speed;
    const wait = def.wait ?? 0;
    const cycle = 2 * (T + wait);
    const m = (((t + (def.phase ?? 0)) % cycle) + cycle) % cycle;
    if (m < wait) return 0;
    if (m < wait + T) return (m - wait) / T;
    if (m < 2 * wait + T) return 1;
    return 1 - (m - 2 * wait - T) / T;
  }

  // Pasajero: apoyado encima y con el centro sobre la plataforma (si solo roza el borde
  // desde suelo firme, no se lo lleva)
  const onTop = (b: Body, p: Body) => {
    const cx = b.x + b.w / 2;
    return Math.abs(b.y + b.h - p.y) < 1.5 && cx >= p.x && cx <= p.x + p.w && b.vy >= 0;
  };

  function updatePlats() {
    for (const p of plats) {
      if (p.def.trigger === undefined) p.s = loopS(p.def, p.len);
      else {
        // Con retardo, espera un poco tras activarse (para que dé tiempo a subirse)
        p.hold = active(p.def.trigger) ? (p.hold ?? 0) + 1 : 0;
        const target = p.hold > (p.def.delay ?? 0) ? 1 : 0;
        const stepS = p.def.speed / (p.len || 1);
        p.s += Math.sign(target - p.s) * Math.min(stepS, Math.abs(target - p.s));
      }
      const pos = pathAt(p.def, p.s);
      const dx = pos.x - p.x;
      const dy = pos.y - p.y;
      if (!dx && !dy) continue;
      const bodies = [player, ...boxes];
      const riders = bodies.filter((b) => onTop(b, p));
      const othersFor = (b: Body) => [player, ...boxes, ...plats].filter((o) => o !== b && o !== p);
      // Los pasajeros se mueven con la plataforma (primero ellos, para no solaparse)
      for (const r of riders) {
        move(r, dx, 0, othersFor(r));
        move(r, 0, dy, othersFor(r));
      }
      p.x = pos.x;
      p.y = pos.y;
      // Si choca con alguien que no iba encima: si sube desde abajo lo recoge;
      // si no, lo empuja, y si no hay sitio lo aplasta
      for (const b of bodies) {
        if (riders.includes(b) || !overlap(b, p)) continue;
        let blocked = false;
        // Si va hacia arriba (acaba de saltar) no se le recoge: se le deja despegar
        if (b.vy < 0 && b.y + b.h - p.y < 8) continue;
        if (dy < 0 && b.y + b.h - p.y < 8) {
          b.y = p.y - b.h;
          b.vy = 0;
        } else if (dx !== 0) blocked = move(b, dx, 0, othersFor(b));
        else if (dy > 0) blocked = move(b, 0, dy, othersFor(b));
        if (blocked && b === player) crushed = true;
      }
    }
  }

  /** Estado de unos pinchos móviles en este instante */
  function spikeState(s: SpikesDef): 'down' | 'warn' | 'up' {
    const m = (t + (s.phase ?? 0)) % s.period;
    if (m < s.period - s.up - s.warn) return 'down';
    if (m < s.period - s.up) return 'warn';
    return 'up';
  }

  // ---------- Sombras ----------

  function updateShades() {
    // Al entrar o reaparecer, un respiro antes de que empiecen a moverse
    if (t < 90) return;
    const speed = levels[levelIdx].shade ?? 0.5;
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    for (const sh of shades) {
      const cx = sh.x + SHADE_W / 2;
      const cy = sh.y + SHADE_H / 2;
      // ¿Le da una luz fuerte (lámpara, bengala)? Entonces huye de ella
      let fx = 0;
      let fy = 0;
      for (const l of strongLights()) {
        const d = Math.hypot(cx - l.x, cy - l.y);
        if (d < l.r * 0.95 && d > 0.01) {
          fx += (cx - l.x) / d;
          fy += (cy - l.y) / d;
        }
      }
      sh.fleeing = fx !== 0 || fy !== 0;
      let dx: number;
      let dy: number;
      let v: number;
      if (sh.fleeing) {
        dx = fx;
        dy = fy;
        v = 1.3;
      } else {
        dx = px - cx;
        dy = py - cy;
        v = speed;
      }
      const len = Math.hypot(dx, dy) || 1;
      // Un leve vaivén para que no avance en línea recta
      const wob = Math.sin((t + sh.phase * 13) / 20) * 0.35;
      sh.x += (dx / len) * v + (-dy / len) * wob;
      sh.y += (dy / len) * v + (dx / len) * wob;
      sh.x = Math.max(-8, Math.min(W - 2, sh.x));
      sh.y = Math.max(-8, Math.min(H - 2, sh.y));
      // Tocarla es morir (salvo en la Parte III: ahora las sombras son de los tuyos)
      const hit: Body = { x: sh.x + 2, y: sh.y + 2, w: SHADE_W - 4, h: SHADE_H - 4, vx: 0, vy: 0, ground: false };
      if (!DEAD && overlap(player, hit)) crushed = true;
      if (!shadeWarned && Math.hypot(px - cx, py - cy) < 110) warnShade();
    }
  }

  let shadeWarned = false;
  function warnShade() {
    shadeWarned = true;
    try {
      if (localStorage.getItem(SHADE_KEY) === '1') return;
      localStorage.setItem(SHADE_KEY, '1');
    } catch {}
    showHint('Algo se mueve en la oscuridad y atraviesa la roca. No soporta la luz de la lámpara ni de las bengalas.', 7);
  }

  // ---------- Parte II: huecos, arañas, dinamita, grisú, suelos podridos ----------

  /** Avisos que solo salen la primera vez (se recuerdan en este navegador) */
  function firstTime(key: string, text: string, seconds = 7) {
    try {
      if (localStorage.getItem(key) === '1') return;
      localStorage.setItem(key, '1');
    } catch {}
    showHint(text, seconds);
  }

  /** El ruido despierta a los huecos que estén cerca (y, en la Parte III, a los vivos) */
  function makeNoise() {
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    for (const h of humans)
      if (!h.eaten && h.kind === 'h' && Math.hypot(h.x + 5 - px, h.y + 7 - py) < 6 * TILE) {
        h.alert = 150;
        h.target = px;
      }
    for (const h of hollows)
      if (Math.hypot(h.x + h.w / 2 - px, h.y + h.h / 2 - py) < 7 * TILE) {
        h.alert = 150;
        h.target = px;
      }
  }

  function updateCrumbling() {
    // Las tablas que estás pisando empiezan a crujir; al rato se hunden
    if (player.ground) {
      const fy = Math.floor((player.y + player.h + 2) / TILE);
      for (const fx of [Math.floor((player.x + 1) / TILE), Math.floor((player.x + player.w - 1) / TILE)])
        if (grid[fy]?.[fx] === '%' && !crumbling.has(`${fx}:${fy}`)) {
          crumbling.set(`${fx}:${fy}`, 1);
          firstTime('oscuras-tablas', 'Las tablas están podridas. No te quedes quieto encima.', 5);
        }
    }
    for (const [k, n] of crumbling) {
      if (n >= 40) continue;
      crumbling.set(k, n + 1);
      if (n + 1 === 40) {
        const [x, y] = k.split(':').map(Number);
        grid[y] = grid[y].slice(0, x) + '.' + grid[y].slice(x + 1);
        spray(x * TILE + 8, y * TILE + 3, 10);
      }
    }
  }

  function spray(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++)
      debris.push({ x, y, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 2.5, r: 1 + Math.random() * 1.5, life: 30 + Math.random() * 20 });
  }

  function updateHollows() {
    const px = player.x + player.w / 2;
    for (const h of hollows) {
      if (h.alert > 0) h.alert--;
      const chasing = h.alert > 0;
      if (chasing) h.dir = Math.sign(h.target - (h.x + h.w / 2)) || h.dir;
      const v = chasing ? (OUT ? 1.3 : 1.05) : 0.35;
      // ¿Hay pared o vacío delante? Patrullando se da la vuelta; persiguiendo se queda esperando
      const front = h.dir > 0 ? h.x + h.w + 1 : h.x - 1;
      const wall = solidTile(front, h.y + h.h / 2);
      const hole = !solidTile(front, h.y + h.h + 2) && tileAt(front, h.y + h.h + 2) !== 'H';
      if ((wall || hole) && h.ground) {
        if (!chasing) h.dir = -h.dir;
      } else if (!(chasing && Math.abs(h.target - (h.x + h.w / 2)) < 2)) move(h, h.dir * v, 0, [...boxes, ...plats]);
      fall(h, [...boxes, ...plats]);
      if (h.y > H) h.x = -999;
      const hit: Body = { x: h.x + 2, y: h.y + 2, w: h.w - 4, h: h.h - 2, vx: 0, vy: 0, ground: false };
      // En la Parte III los cuarenta te siguen: ya no te atacan
      if (DEAD) {
        h.alert = Math.abs(h.x - player.x) > 2 * TILE ? 30 : 0;
        h.target = px;
        // Parte IV: si se queda atascado lejos de ti, aparece en la oscuridad por donde pasaste
        if (OUT) {
          h.stuck = Math.abs((h.lastX ?? h.x) - h.x) < 0.2 ? (h.stuck ?? 0) + 1 : 0;
          h.lastX = h.x;
          if ((h.stuck ?? 0) > 120 && Math.hypot(h.x - player.x, h.y - player.y) > 4 * TILE && path.length > 60) {
            const p = path[Math.max(0, path.length - 45 - Math.floor(Math.random() * 30))];
            h.x = p.x;
            h.y = p.y;
            h.vy = 0;
            h.stuck = 0;
          }
        }
        // Parte IV: si hay un vivo cerca en su misma altura, va a por él
        if (OUT) {
          let best = 7 * TILE;
          for (const v of humans)
            if (!v.eaten && Math.abs(v.y - h.y) < 12 && Math.abs(v.x - h.x) < best) {
              best = Math.abs(v.x - h.x);
              h.target = v.x + 5;
              h.alert = 30;
            }
        }
        // Parte IV: los de la horda muerden a los vivos que alcanzan, y esos se levantan
        if (OUT)
          for (const v of humans)
            if (!v.eaten && overlap(hit, v)) {
              // 2 = lo ha mordido la horda (desaparece ya; se levantará luego)
              v.eaten = 2;
              eaten++;
              horde++;
              stains.push({ x: v.x + 5, y: v.y + v.h, r: 6 }, { x: v.x + 1, y: v.y + v.h, r: 3 });
              for (let i = 0; i < 18; i++)
                drops.push({ x: v.x + 5, y: v.y + 6, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 3, r: 1 + Math.random() * 1.5 });
              risen.push({ x: v.x, y: v.y, at: t + 90 });
              firstTime('oscuras-horda', 'La horda también come. Cada vivo que cae se levanta a los pocos segundos y se une a vosotros.', 6);
            }
        continue;
      }
      if (overlap(player, hit)) crushed = true;
      if (Math.abs(h.x + h.w / 2 - px) < 6 * TILE && Math.abs(h.y - player.y) < 3 * TILE)
        firstTime(
          'oscuras-huecos',
          'Un hueco: un minero muerto que todavía camina. No ve, pero oye. Mantén Mayús (o el botón de sigilo) para andar sin hacer ruido.',
          8,
        );
    }
    hollows = hollows.filter((h) => h.x !== -999);
    humans = humans.filter((v) => v.eaten !== 2);
  }

  function updateSpiders() {
    const px = player.x + player.w / 2;
    for (const sp of spiders) {
      if (sp.state === 'hang') {
        // Pasas por debajo: un destello en el hilo y se suelta
        if (Math.abs(px - (sp.x + 4)) < 12 && player.y > sp.y && player.y - sp.y < 10 * TILE) {
          sp.state = 'warn';
          sp.timer = 16;
        }
      } else if (sp.state === 'warn') {
        if (--sp.timer <= 0) sp.state = 'drop';
      } else if (sp.state === 'drop') {
        sp.vy = Math.min(7, sp.vy + 0.5);
        sp.y += sp.vy;
        if (solidTile(sp.x + 4, sp.y + 8) || sp.y > H) {
          sp.state = 'gone';
          spray(sp.x + 4, sp.y + 6, 12);
        }
        const hit: Body = { x: sp.x, y: sp.y, w: 8, h: 7, vx: 0, vy: 0, ground: false };
        if (overlap(player, hit)) crushed = true;
      }
    }
  }

  function updateBombs() {
    for (const b of bombs) {
      // Cartucho lanzado: bota, rebota en techo y paredes y rueda por el suelo hasta pararse
      if (b.vx !== undefined && b.vy !== undefined) {
        b.vy = Math.min(5, b.vy + 0.25);
        if (solidTile(b.x + b.vx + Math.sign(b.vx) * 3, b.y)) b.vx = -b.vx * 0.3;
        else b.x += b.vx;
        let floor = false;
        if (b.vy < 0 && solidTile(b.x, b.y + b.vy - 3)) b.vy = 0.5;
        else if (b.vy > 0 && solidTile(b.x, b.y + b.vy + 3)) {
          b.vy = 0;
          floor = true;
        } else b.y += b.vy;
        if (floor) {
          b.vx -= Math.sign(b.vx) * Math.min(Math.abs(b.vx), 0.12);
          if (Math.abs(b.vx) < 0.05) {
            b.vx = undefined;
            b.vy = undefined;
          }
        }
      }
      if (--b.fuse > 0) continue;
      // ¡Boom! Rompe roca agrietada, roca reforzada y tablas; mata lo que pille cerca
      flash = 12;
      flashAt = { x: b.x, y: b.y };
      for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++) {
          const c = grid[y][x];
          // También revienta los cristales muertos (el corazón del filón madre está hecho de ellos)
          if ((c === 'W' || c === 'X' || c === '%' || c === 'R') && Math.hypot(x * TILE + 8 - b.x, y * TILE + 8 - b.y) < 2.6 * TILE) {
            grid[y] = grid[y].slice(0, x) + '.' + grid[y].slice(x + 1);
            spray(x * TILE + 8, y * TILE + 8, 8);
          }
        }
      for (const h of hollows)
        if (Math.hypot(h.x + 5 - b.x, h.y + 7 - b.y) < 3 * TILE) {
          stains.push({ x: h.x + 5, y: h.y + h.h, r: 4 });
          h.x = -999;
        }
      hollows = hollows.filter((h) => h.x !== -999);
      for (const sp of spiders) if (sp.state !== 'gone' && Math.hypot(sp.x + 4 - b.x, sp.y - b.y) < 3 * TILE) sp.state = 'gone';
      moths = moths.filter((m) => Math.hypot(m.x - b.x, m.y - b.y) > 3 * TILE);
      // A Ventura solo le mata tu dinamita, no la suya
      for (const f of foremen)
        if (!b.own && Math.hypot(f.x + 6 - b.x, f.y + 8 - b.y) < 2.6 * TILE) {
          f.x = -999;
          stains.push({ x: b.x, y: b.y, r: 6 });
          showHint('Ventura no vuelve a levantarse. Su lámpara rueda por el suelo y se apaga.', 6);
        }
      foremen = foremen.filter((f) => f.x !== -999);
      if (Math.hypot(player.x + player.w / 2 - b.x, player.y + player.h / 2 - b.y) < 2.2 * TILE) crushed = true;
      // La explosión hace mucho ruido
      for (const h of hollows) {
        h.alert = 200;
        h.target = b.x;
      }
    }
    bombs = bombs.filter((b) => b.fuse > 0);
  }

  /** Grisú: una llama dentro de la nube (lámpara o bengala) lo hace estallar */
  function updateGas() {
    const cx = player.x + player.w / 2;
    const inGas = tileAt(cx, player.y + player.h / 2) === '~';
    const nearGas = [-2, -1, 1, 2].some((d) => tileAt(cx + d * TILE, player.y + player.h / 2) === '~');
    if (nearGas)
      firstTime('oscuras-grisu', 'Huele a manzanas podridas: grisú. Ninguna llama ahí dentro. Suelta la lámpara (E) antes de entrar.', 7);
    if (inGas && (carrying || flareTime > 0)) {
      flash = 16;
      flashAt = { x: cx, y: player.y };
      crushed = true;
    }
  }

  // ---------- Polillas, eco, inundación y Ventura ----------

  function updateMoths() {
    const lightsNow = strongLights();
    for (const m of moths) {
      // Van a la luz fuerte más cercana (la lámpara, una bengala o una lámpara soltada en el suelo)
      let target: { x: number; y: number } | null = null;
      let best = 9 * TILE;
      for (const l of lightsNow) {
        const d = Math.hypot(l.x - m.x, l.y - m.y);
        if (d < best) {
          best = d;
          target = l;
        }
      }
      const tx = target ? target.x : m.hx + Math.sin((t + m.phase * 20) / 50) * 24;
      const ty = target ? target.y : m.hy + Math.cos((t + m.phase * 20) / 37) * 12;
      const dx = tx - m.x;
      const dy = ty - m.y;
      const d = Math.hypot(dx, dy) || 1;
      const v = target ? 1.05 : 0.5;
      m.x += (dx / d) * v + Math.sin((t + m.phase * 11) / 6) * 0.6;
      m.y += (dy / d) * v + Math.cos((t + m.phase * 7) / 5) * 0.6;
      // Pegadas a tu lámpara, se beben el aceite
      if (carrying && Math.hypot(m.x - (player.x + player.w / 2), m.y - (player.y + player.h / 2)) < 12) {
        fuel = Math.max(1, fuel - 2);
        firstTime(
          'oscuras-polillas',
          'Polillas de luz: se beben el aceite de la lámpara. Suelta la lámpara (E) para que vayan a ella… y recógela después.',
          7,
        );
      }
    }
  }

  function updateEcho() {
    const delay = levels[levelIdx].echo;
    if (!delay) return;
    trail.push({ x: player.x, y: player.y, f: facing });
    if (trail.length <= delay) return;
    if (trail.length === delay + 1)
      firstTime('oscuras-eco', 'Algo repite tus pasos unos segundos por detrás. Tiene tu forma. No dejes que te alcance.', 6);
    const e = trail[trail.length - 1 - delay];
    const hit: Body = { x: e.x + 3, y: e.y + 3, w: player.w - 6, h: player.h - 5, vx: 0, vy: 0, ground: false };
    if (overlap(player, hit)) crushed = true;
  }

  function updateFlood() {
    const f = levels[levelIdx].flood;
    if (!f) return;
    if (t > (f.delay ?? 120)) floodY = Math.max((f.to ?? 0) * TILE, floodY - f.speed);
    if (t === (f.delay ?? 120)) firstTime('oscuras-inundacion', 'El agua está subiendo. Arriba. Rápido.', 4);
  }

  function updateForemen() {
    const period = levels[levelIdx].ventura ?? 150;
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    for (const f of foremen) {
      const d = Math.hypot(px - (f.x + 6), py - (f.y + 8));
      if (!f.seen && d < 12 * TILE) {
        f.seen = true;
        firstTime('oscuras-ventura', 'Ventura. El capataz. Te ha visto, y lleva un saco lleno de dinamita.', 6);
      }
      // Tocarle es morir: te empuja al vacío (a un muerto no: a un muerto le basta con comérselo)
      const hit: Body = { x: f.x, y: f.y, w: 12, h: 16, vx: 0, vy: 0, ground: false };
      if (!DEAD && overlap(player, hit)) crushed = true;
      // Solo lanza si estás más o menos a su altura (desde su balcón hasta 5 casillas por debajo)
      const dy = py - (f.y + 8);
      if (--f.cool > 0 || Math.abs(px - (f.x + 6)) > 13 * TILE || dy < -2 * TILE || dy > 5 * TILE) continue;
      f.cool = period;
      // Tiro bajo y rasante (los pasillos son estrechos): sube un poco y cae hacia donde estás
      // El cartucho cae desde el borde de su balcón, ya dentro del pasillo
      const ox = f.x + 6 + Math.sign(px - (f.x + 6)) * 10;
      const oy = f.y + 20;
      // Vuela un rato (cayendo del balcón) y luego rueda frenando a 0,12 px/f²:
      // distancia = vx·t_aire + vx²/0,24 → se despeja vx para que se pare donde estás
      const dist = Math.abs(px - ox);
      const fallH = Math.max(0, player.y + player.h - oy);
      const tAir = (-1.2 + Math.sqrt(1.44 + 2 * 0.25 * fallH)) / 0.25 + 9.6;
      const k = 1 / 0.24;
      const speed = (-tAir + Math.sqrt(tAir * tAir + 4 * k * dist)) / (2 * k);
      const vx = Math.sign(px - ox) * Math.min(4.2, speed);
      bombs.push({ x: ox, y: oy, fuse: 110, vx, vy: -1.2, own: true });
    }
  }

  // ---------- Parte III: carne, hambre, luz que quema, vivos y perros ----------

  const EAT_LINES = [
    'Le muerdes el cuello. La sangre sale caliente, a borbotones. Hacía días que nada estaba caliente.',
    'Le abres el pecho con las manos. Comes deprisa, sin masticar, con la cara metida en él.',
    'Grita poco. Luego deja de gritar. Tú no dejas de comer.',
    'Le arrancas el brazo por el hombro y lo roes hasta el hueso. El hambre se calla un momento.',
    'Te mira mientras le comes la cara. Reconoces sus ojos. Era el hijo del panadero.',
    'Le hundes los dientes en la tripa y tiras. Lo que sale huele a hogar.',
  ];
  let eatLine = 0;
  const EAT_LINES_OUT = [
    'La tiras al suelo de la calle y le muerdes la nuca. Sus vecinos miran desde las ventanas y no bajan.',
    'Le abres el vientre contra la puerta de su casa. Dentro, alguien llora y echa el cerrojo.',
    'Le comes la lengua para que deje de gritar. Funciona.',
    'Le arrancas la mandíbula de un tirón. Los de la horda se acercan a por el resto.',
    'Sus tripas humean en el frío de la noche. Comes hasta que dejan de humear.',
    'Te suplica por sus hijos. Sabe a miedo. El miedo sabe dulce.',
  ];

  function hurt(n: number) {
    flesh = Math.max(0, flesh - n);
    if (flesh <= 0) crushed = true;
  }

  function updateDead() {
    if (!DEAD) return;
    // Hambre: se vacía en un minuto; sin hambre llena, la carne se pudre
    hunger = Math.max(0, hunger - 0.028);
    if (hunger <= 0) {
      hurt(0.15);
      firstTime('oscuras-hambre', 'El hambre te está pudriendo por dentro. Come. Lo que sea. A quien sea.', 6);
    }
    // La luz quema; la oscuridad cura
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    let dmg = 0;
    for (const l of burnLights()) {
      const d = Math.hypot(l.x - px, l.y - py);
      const r = l.r * 0.85;
      if (d < r) dmg += 0.15 + 0.55 * (1 - d / r);
    }
    if (dmg > 0) {
      burning = 8;
      hurt(dmg);
      firstTime('oscuras-luz-quema', 'La luz te quema la piel muerta. En la oscuridad te recompones.', 6);
    } else {
      if (burning > 0) burning--;
      flesh = Math.min(100, flesh + 0.12);
    }
    if (OUT && tileAt(px, py) === 'f') {
      hurt(3);
      firstTime('oscuras-hogueras', 'Hogueras. Los vivos han aprendido que el fuego os para. No las cruces.', 5);
    }
    updateHumans();
    updateDogs();
    updateBullets();
    // Los muertos se levantan
    for (const r of risen)
      if (t >= r.at) {
        hollows.push({ x: r.x, y: r.y, w: 10, h: 14, vx: 0, vy: 0, ground: false, dir: 1, alert: 30, target: px });
        r.at = Infinity;
      }
    risen = risen.filter((r) => r.at !== Infinity);
  }

  /** Balas de la Guardia Civil: hieren a Julián y matan a los de la horda */
  function updateBullets() {
    // Recordar el camino de Julián (solo donde pisa suelo)
    if (OUT && player.ground && t % 4 === 0) {
      path.push({ x: player.x, y: player.y });
      if (path.length > 400) path.shift();
    }
    for (const b of bullets) {
      b.x += b.vx;
      b.life--;
      if (solidTile(b.x, b.y)) b.life = 0;
      const hit: Body = { x: b.x - 2, y: b.y - 1, w: 4, h: 2, vx: 0, vy: 0, ground: false };
      if (b.life > 0 && overlap(player, hit)) {
        hurt(26);
        player.vx = Math.sign(b.vx) * 2;
        b.life = 0;
      }
      for (const f of hollows)
        if (b.life > 0 && overlap(f, hit)) {
          stains.push({ x: f.x + 5, y: f.y + f.h, r: 4 });
          f.x = -999;
          horde = Math.max(0, horde - 1);
          b.life = 0;
        }
    }
    hollows = hollows.filter((f) => f.x !== -999);
    bullets = bullets.filter((b) => b.life > 0);
  }

  /** Un vivo grita: toda la Guardia Civil de la galería sabe dónde estás */
  function scream(px: number) {
    for (const o of humans)
      if (o.kind === 'g' && !o.eaten) {
        o.alert = 240;
        o.target = px;
      }
    firstTime('oscuras-gritos', 'Los vecinos huyen gritando y avisan a la Guardia Civil. Cázalos antes de que griten… o que los cace la horda.', 7);
  }

  function updateHumans() {
    const px = player.x + player.w / 2;
    for (const h of humans) {
      if (h.eaten) continue;
      if (h.cool > 0) h.cool--;
      if (h.alert > 0) h.alert--;
      const cx = h.x + h.w / 2;
      const dx = px - cx;
      const sameFloor = Math.abs(player.y - h.y) < 12;
      // Te ve si estás dentro de su luz y delante de él; te oye si corres cerca
      const light = h.kind === 'I' ? 90 : h.alert > 0 ? 76 : 54;
      if (sameFloor && Math.abs(dx) < light * 0.9 && (Math.sign(dx) === h.dir || h.kind === 'I')) {
        if (h.alert === 0) firstTime('oscuras-vivos', 'Un vivo. Te ha visto: levanta la lámpara y el pico. Acércate por detrás, sin ruido, y come.', 7);
        h.alert = 180;
        h.target = px;
      }
      if (h.kind === 'v') {
        // Vecino: si te ve, grita y huye
        const sees = sameFloor && Math.abs(dx) < 7 * TILE && Math.sign(dx) === h.dir;
        if (sees && h.alert === 0) scream(px);
        if (sees) h.alert = 200;
        const fleeing = h.alert > 0;
        if (fleeing) h.dir = -Math.sign(dx) || h.dir;
        const front = h.dir > 0 ? h.x + h.w + 1 : h.x - 1;
        const blocked = solidTile(front, h.y + h.h / 2) || (!solidTile(front, h.y + h.h + 2) && tileAt(front, h.y + h.h + 2) !== 'H');
        if (blocked && h.ground) {
          if (!fleeing) h.dir = -h.dir;
        } else move(h, h.dir * (fleeing ? 1.15 : 0.35), 0, [...boxes, ...plats]);
        fall(h, [...boxes, ...plats]);
        continue;
      }
      if (h.kind === 'g') {
        // Guardia civil: patrulla; si te ve (o le avisan), se planta y dispara
        const sees = sameFloor && Math.abs(dx) < 9 * TILE && Math.sign(dx) === h.dir;
        if (sees) {
          if (h.alert === 0)
            firstTime('oscuras-guardia', 'La Guardia Civil. Disparan a matar, a ti y a los tuyos. Ponte a cubierto o rodéalos.', 6);
          h.alert = 200;
          h.target = px;
        }
        if (h.alert > 0) {
          h.dir = Math.sign(h.target - cx) || h.dir;
          if (h.cool === 0 && sameFloor) {
            bullets.push({ x: cx + h.dir * 7, y: h.y + 6, vx: h.dir * 4.5, life: 140 });
            h.cool = 75;
            flash = 3;
            flashAt = { x: cx + h.dir * 8, y: h.y + 6 };
          }
        } else {
          const front = h.dir > 0 ? h.x + h.w + 1 : h.x - 1;
          const blocked = solidTile(front, h.y + h.h / 2) || (!solidTile(front, h.y + h.h + 2) && tileAt(front, h.y + h.h + 2) !== 'H');
          if (blocked && h.ground) h.dir = -h.dir;
          else move(h, h.dir * 0.35, 0, [...boxes, ...plats]);
        }
        fall(h, [...boxes, ...plats]);
        continue;
      }
      if (h.kind === 'I') {
        // El cura no se mueve del altar: reza y te rocía de luz
        if (sameFloor && Math.abs(dx) < 16 && h.cool === 0) {
          hurt(25);
          h.cool = 60;
        }
        continue;
      }
      const chasing = h.alert > 0;
      if (chasing) h.dir = Math.sign(h.target - cx) || h.dir;
      const v = chasing ? 0.9 : 0.4;
      const front = h.dir > 0 ? h.x + h.w + 1 : h.x - 1;
      const wall = solidTile(front, h.y + h.h / 2);
      const hole = !solidTile(front, h.y + h.h + 2) && tileAt(front, h.y + h.h + 2) !== 'H';
      if ((wall || hole) && h.ground) {
        if (!chasing) h.dir = -h.dir;
      } else if (!(chasing && Math.abs(h.target - cx) < 14)) move(h, h.dir * v, 0, [...boxes, ...plats]);
      fall(h, [...boxes, ...plats]);
      if (chasing) h.target = px;
      // Golpe de pico si estás a su lado y de cara
      if (sameFloor && Math.abs(dx) < 16 && Math.sign(dx) === h.dir && h.cool === 0) {
        hurt(30);
        h.cool = 50;
        player.vx = Math.sign(dx) * 3;
      }
    }
  }

  function updateDogs() {
    const px = player.x + player.w / 2;
    for (const d of dogs) {
      if (d.eaten) continue;
      if (d.cool > 0) d.cool--;
      const cx = d.x + d.w / 2;
      const smell = Math.hypot(px - cx, player.y - d.y) < 9 * TILE;
      if (smell) {
        d.dir = Math.sign(px - cx) || d.dir;
        firstTime('oscuras-perros', 'Los perros de Ventura. Te huelen aunque estés a oscuras. Muerden… y también se comen.', 6);
      }
      const front = d.dir > 0 ? d.x + d.w + 1 : d.x - 1;
      const wall = solidTile(front, d.y + d.h / 2);
      const hole = !solidTile(front, d.y + d.h + 2) && tileAt(front, d.y + d.h + 2) !== 'H';
      if (!((wall || hole) && d.ground) && !(smell && Math.abs(px - cx) < 6)) move(d, d.dir * (smell ? 1.25 : 0.5), 0, [...boxes, ...plats]);
      else if (!smell) d.dir = -d.dir;
      fall(d, [...boxes, ...plats]);
      if (overlap(player, d) && d.cool === 0) {
        hurt(20);
        d.cool = 45;
        player.vx = -d.dir * 2.5;
      }
    }
  }

  /** ¿A quién te puedes comer ahora mismo? */
  function preyNear(): { kind: 'h' | 'p' | 'v'; ref: Human | Dog | Foreman } | null {
    const px = player.x + player.w / 2;
    for (const h of humans) if (!h.eaten && Math.abs(h.x + h.w / 2 - px) < 17 && Math.abs(h.y - player.y) < 12) return { kind: 'h', ref: h };
    for (const d of dogs) if (!d.eaten && Math.abs(d.x + d.w / 2 - px) < 17 && Math.abs(d.y + d.h - (player.y + player.h)) < 10) return { kind: 'p', ref: d };
    for (const f of foremen) if (Math.abs(f.x + 6 - px) < 18 && Math.abs(f.y - player.y) < 14) return { kind: 'v', ref: f };
    return null;
  }

  function eat() {
    const prey = preyNear();
    if (!prey) return false;
    const r = prey.ref;
    feeding = prey.kind === 'p' ? 35 : 70;
    feedVictim = { x: r.x + 6, y: r.y + 8 };
    player.vx = 0;
    if (prey.kind === 'p') {
      (r as Dog).eaten = 1;
      hunger = Math.min(100, hunger + 25);
      flesh = Math.min(100, flesh + 10);
      showHint('Le partes el lomo al perro y le comes las tripas todavía calientes.', 4);
    } else {
      if (prey.kind === 'h') {
        const h = r as Human;
        h.eaten = 1;
        // Su lámpara cae al suelo y sigue encendida
        if (h.kind === 'h') items.push({ kind: 'L', x: Math.round(h.x - 3), y: Math.round(h.y + h.h - TILE) });
        if (OUT) {
          horde++;
          risen.push({ x: h.x, y: h.y, at: t + 160 });
        }
        showHint(
          h.kind === 'I'
            ? 'Le arrancas al cura la estola y la garganta. Sus rezos acaban en un gorgoteo.'
            : h.kind === 'g'
              ? 'Le arrancas el tricornio y después la cara. El fusil se dispara solo contra el suelo.'
              : (OUT ? EAT_LINES_OUT : EAT_LINES)[eatLine++ % (OUT ? EAT_LINES_OUT : EAT_LINES).length],
          5,
        );
      } else {
        foremen = foremen.filter((f) => f !== r);
        showHint('Ventura no grita. Te mira mientras le muerdes y susurra: «Lo sabía». Sabe a tabaco y a pólvora.', 7);
      }
      eaten++;
      hunger = Math.min(100, hunger + 60);
      flesh = Math.min(100, flesh + 30);
    }
    return true;
  }

  function updateFeeding() {
    feeding--;
    const v = feedVictim!;
    // Sangre a chorros y trozos
    if (feeding % 3 === 0)
      for (let i = 0; i < 4; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        const sp = 1 + Math.random() * 2.5;
        drops.push({ x: v.x, y: v.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 1 + Math.random() * 1.8 });
      }
    if (feeding % 12 === 0) debris.push({ x: v.x, y: v.y, vx: (Math.random() - 0.5) * 2.5, vy: -Math.random() * 2, r: 2.5, life: 40 });
    // Las gotas caen y manchan el suelo, como en una muerte
    for (const d of drops) {
      d.vy = Math.min(MAX_FALL, d.vy + GRAV * 0.8);
      const nx = d.x + d.vx;
      const ny = d.y + d.vy;
      if (solidTile(nx, ny)) {
        if (stains.length < 600) stains.push({ x: nx, y: ny, r: d.r + Math.random() });
        d.r = 0;
        continue;
      }
      d.x = nx;
      d.y = ny;
    }
    drops = drops.filter((d) => d.r > 0 && d.y < H + 10);
    if (feeding === 0) {
      stains.push({ x: v.x, y: v.y + 6, r: 7 }, { x: v.x - 5, y: v.y + 7, r: 4 }, { x: v.x + 6, y: v.y + 7, r: 5 });
      humans = humans.filter((h) => !h.eaten);
      dogs = dogs.filter((d) => !d.eaten);
      feedVictim = null;
    }
  }

  function plantDynamite() {
    if (dynamite <= 0 || !player.ground || dying) return;
    dynamite--;
    bombs.push({ x: player.x + player.w / 2, y: player.y + player.h - 4, fuse: 120 });
  }

  // ---------- Bucle ----------

  // ---------- Muerte y sangre ----------

  type Drop = { x: number; y: number; vx: number; vy: number; r: number };
  /** Esquirlas de roca al picar */
  let debris: (Drop & { life: number })[] = [];
  /** Gotas en el aire durante la animación de muerte */
  let drops: Drop[] = [];
  /** Manchas pegadas al escenario: se quedan en el nivel hasta que lo superas */
  let stains: { x: number; y: number; r: number }[] = [];
  /** Fotogramas que quedan de animación de muerte (el nivel se reinicia al llegar a 0) */
  let dying = 0;
  const DEATH_FRAMES = 50;

  function die(water = false) {
    if (dying) return;
    deaths++;
    dying = DEATH_FRAMES;
    if (water) {
      spray(player.x + player.w / 2, player.y + player.h, 16);
      return;
    }
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    for (let i = 0; i < 36; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 0.8 + Math.random() * 2.6;
      drops.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, r: 1 + Math.random() * 1.5 });
    }
    // Charco bajo el cuerpo
    stains.push({ x: cx, y: player.y + player.h - 1, r: 4 });
  }

  function updateDeath() {
    for (const d of drops) {
      d.vy = Math.min(MAX_FALL, d.vy + GRAV * 0.8);
      const nx = d.x + d.vx;
      const ny = d.y + d.vy;
      // Al tocar un muro o el suelo, la gota se queda pegada como mancha
      if (solidTile(nx, ny) || tileAt(nx, ny) === '^') {
        if (stains.length < 400) stains.push({ x: nx, y: ny, r: d.r + Math.random() });
        d.r = 0;
        continue;
      }
      d.x = nx;
      d.y = ny;
    }
    drops = drops.filter((d) => d.r > 0 && d.y < H + 10);
    if (--dying === 0) {
      drops = [];
      load(levelIdx);
    }
  }

  function step() {
    if (done) return;
    if (cine) {
      cineT++;
      return;
    }
    if (blast > 0) {
      // Explosión: la pantalla tiembla, se queda en blanco y luego en negro
      if (--blast === 0) {
        if (levelIdx + 1 < levels.length) load(levelIdx + 1, true);
        else {
          done = true;
          onwin?.();
        }
      }
      return;
    }
    if (dying) return updateDeath();
    t++;
    if (feeding > 0) {
      updateFeeding();
      return;
    }
    updateSwitches();
    crushed = false;
    updatePlats();
    updateShades();
    if (crushed) return die();

    const left = keys.has('ArrowLeft') || keys.has('a');
    const right = keys.has('ArrowRight') || keys.has('d');
    const upKey = keys.has('ArrowUp') || keys.has('w');
    const downKey = keys.has('ArrowDown') || keys.has('s');
    // Con Mayús se anda despacio y sin hacer ruido
    // (solo en el suelo: en el aire se avanza normal, para poder saltar por encima de un hueco)
    sneaking = keys.has('Shift');
    const speed = sneaking && player.ground ? RUN * 0.65 : RUN;
    const target = (right ? speed : 0) - (left ? speed : 0);
    player.vx += Math.sign(target - player.vx) * Math.min(ACCEL, Math.abs(target - player.vx));
    if (right) facing = 1;
    else if (left) facing = -1;

    for (const b of boxes) fall(b, [player, ...boxes, ...plats]);

    // Escaleras: arriba/abajo para trepar, Espacio para saltar fuera
    const cx = player.x + player.w / 2;
    const inLadder = ladderAt(cx, player.y + player.h / 2) || ladderAt(cx, player.y + player.h - 1);
    const onLadderTop = ladderAt(cx, player.y + player.h + 1);
    nearLadder = inLadder || onLadderTop;
    if (!climbing && ((inLadder && upKey) || (nearLadder && downKey))) {
      climbing = true;
      player.vy = 0;
      // Centrar en la escalera
      player.x = Math.floor(cx / TILE) * TILE + (TILE - PW) / 2;
    }
    if (climbing && !nearLadder) climbing = false;

    const solids = [...boxes, ...plats];
    if (climbing) {
      passLadderTop = true;
      move(player, player.vx * 0.4, 0, solids);
      const vy = upKey ? -1.3 : downKey ? 1.3 : 0;
      move(player, 0, vy, solids);
      passLadderTop = false;
      player.vy = 0;
      player.ground = false;
      coyote = COYOTE;
      // Al asomar por arriba deja de trepar y se apoya en el último peldaño
      if (!ladderAt(cx, player.y + player.h - 1) && !ladderAt(cx, player.y + player.h / 2)) climbing = false;
    } else {
      if (move(player, player.vx, 0, solids, true)) player.vx = 0;
      const wasGround = player.ground;
      const fallSpeed = player.vy;
      passLadderTop = downKey;
      fall(player, solids);
      // Aterrizar de un salto también hace ruido
      if (!wasGround && player.ground && fallSpeed > 3) makeNoise();
      // Seta: al pisarla te lanza muy alto
      if (player.ground && tileAt(player.x + player.w / 2, player.y + player.h + 2) === 'Y') {
        player.vy = -8.2;
        player.ground = false;
        coyote = 0;
        bouncing = true;
        spray(player.x + player.w / 2, player.y + player.h, 6);
        firstTime('oscuras-setas', 'Las setas te lanzan hacia arriba. Muévete en el aire para caer donde quieras.', 5);
      }
      passLadderTop = false;
      if (player.ground) coyote = COYOTE;
      else if (wasGround || coyote > 0) coyote--;
    }

    if (buffer > 0) {
      buffer--;
      if (coyote > 0) {
        climbing = false;
        player.vy = -JUMP_V;
        coyote = 0;
        buffer = 0;
        player.ground = false;
      }
    }
    // Salto variable: soltar pronto corta la subida
    if (player.vy >= 0) bouncing = false;
    if (!jumpHeld() && player.vy < -2 && !bouncing) player.vy = -2;

    if (flareTime > 0) flareTime--;
    if (flash > 0) flash--;
    // Correr hace ruido
    if (player.ground && Math.abs(player.vx) > 1.2) makeNoise();
    updateCrumbling();
    updateHollows();
    updateSpiders();
    updateBombs();
    updateGas();
    updateMoths();
    updateEcho();
    updateFlood();
    updateForemen();
    updateDead();
    if (crushed) return die();
    // Agua: no te mata a sangre, pero la corriente te arrastra al principio de la gruta
    if (tileAt(player.x + player.w / 2, player.y + player.h - 3) === 'w') return die(true);
    if (player.y + player.h - 4 > floodY) return die(true);
    if (hintTime > 0 && --hintTime === 0) hint = '';
    if (bannerTime > 0 && --bannerTime === 0) banner = null;
    for (const d of debris) {
      d.vy += GRAV * 0.6;
      d.x += d.vx;
      d.y += d.vy;
      d.life--;
    }
    debris = debris.filter((d) => d.life > 0);

    // Pepitas de oro: se recogen al tocarlas
    for (const it of items)
      if (it.kind === 'G' && Math.abs(it.x + 8 - cx) < 10 && Math.abs(it.y + 10 - (player.y + player.h / 2)) < 12) {
        gold++;
        markTaken(it);
        it.x = -999;
      }
    items = items.filter((it) => it.x !== -999);
    if (carrying && --fuel <= 0) carrying = false;

    // Pinchos fijos, pinchos móviles o vacío
    const feet = player.y + player.h - 1;
    if (tileAt(player.x + 2, feet) === '^' || tileAt(player.x + player.w - 2, feet) === '^' || player.y > H) return die();
    for (const s of spikes) {
      if (spikeState(s) !== 'up') continue;
      const zone: Body = { x: s.x * TILE + 2, y: s.y * TILE + 6, w: s.w * TILE - 4, h: 10, vx: 0, vy: 0, ground: false };
      if (overlap(player, zone)) return die();
    }

    // Salida: casilla S (en cualquier punto del mapa)
    if (exitNag > 0) exitNag--;
    const need = levels[levelIdx].need ?? 0;
    if (tileAt(player.x + player.w / 2, player.y + player.h / 2) === 'S' && DEAD && eaten < need) {
      if (exitNag === 0) showHint(`Tienes demasiada hambre para seguir. Come primero (${eaten}/${need}).`, 3);
      exitNag = 200;
    } else if (tileAt(player.x + player.w / 2, player.y + player.h / 2) === 'S') {
      if (levels[levelIdx].boom) {
        // La falsa salida: arriba hay cielo… y Ventura con la mecha
        player.x = Math.max(0, Math.min(W - player.w, player.x - 4));
        startCine('boom', BOOM_LINES);
      } else if (levelIdx + 1 < levels.length) {
        load(levelIdx + 1, true);
      } else if (!done) {
        done = true;
        onwin?.();
      }
    }
    player.x = Math.max(0, Math.min(W - player.w, player.x));
  }

  const jumpHeld = () => keys.has(' ') || (!climbing && !nearLadder && (keys.has('ArrowUp') || keys.has('w')));

  function interact() {
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    if (DEAD) {
      if (eat()) return;
      // Apagar una vela de un manotazo
      for (const [ox, oy] of [[0, 0], [-1, 0], [1, 0]]) {
        const tx = Math.floor(cx / TILE) + ox;
        const ty = Math.floor(cy / TILE) + oy;
        if (grid[ty]?.[tx] === 'c') {
          grid[ty] = grid[ty].slice(0, tx) + '.' + grid[ty].slice(tx + 1);
          spray(tx * TILE + 8, ty * TILE + 6, 5);
          return;
        }
      }
      // Parte IV: reventar una ventana encendida o una farola
      if (OUT) {
        const front = facing > 0 ? player.x + player.w + 3 : player.x - 3;
        for (const [qx, qy] of [
          [front, player.y + 3],
          [front, player.y + player.h - 3],
          [cx, cy],
          [player.x - 3, cy],
          [player.x + player.w + 3, cy],
        ]) {
          const c = tileAt(qx, qy);
          if (c !== 'n' && c !== 'l') continue;
          const tx = Math.floor(qx / TILE);
          const ty = Math.floor(qy / TILE);
          grid[ty] = grid[ty].slice(0, tx) + (c === 'n' ? '#' : '.') + grid[ty].slice(tx + 1);
          spray(tx * TILE + 8, ty * TILE + 6, 12);
          return;
        }
      }
      // Reventar una lámpara caída
      const lamp = items.find((it) => it.kind === 'L' && Math.abs(it.x + 8 - cx) < 16 && Math.abs(it.y + 8 - cy) < 16);
      if (lamp) {
        items = items.filter((i) => i !== lamp);
        spray(lamp.x + 8, lamp.y + 10, 10);
        return;
      }
    }
    const lever = switches.find(
      (s) => s.kind === 'lever' && Math.abs(s.tx * TILE + 8 - cx) < 14 && Math.abs(s.ty * TILE + 8 - cy) < 16,
    );
    if (lever) {
      const time = levels[levelIdx].leverTime;
      if (time) {
        // Con temporizador: tirar la (re)activa y empieza la cuenta atrás
        lever.on = true;
        lever.timer = time;
        let seen = false;
        try {
          seen = localStorage.getItem(TIMER_KEY) === '1';
          localStorage.setItem(TIMER_KEY, '1');
        } catch {}
        if (!seen) showHint('La palanca vuelve sola a su sitio. Cuando lo haga, la puerta se cerrará. Corre.', 5);
      } else lever.on = !lever.on;
      return;
    }
    const near = items.find((it) => it.kind !== 'G' && Math.abs(it.x + 8 - cx) < 14 && Math.abs(it.y + 8 - cy) < 16);
    if (near) {
      items = items.filter((i) => i !== near);
      if (near.kind === 'F') flares++;
      else if (near.kind === 'D') {
        dynamite++;
        firstTime('oscuras-dinamita', 'Dinamita. Pulsa F (o TNT) para encender una mecha a tus pies… y aléjate.', 6);
      } else if (near.kind === 'T') {
        hasPick = true;
        showHint('Un pico de minero. Pulsa E mirando a la roca agrietada para abrirte paso.');
      } else {
        // Si ya llevabas uno, lo cambias: el viejo se queda en el suelo con su aceite
        if (carrying) items.push({ kind: 'L', x: near.x, y: near.y, fuel });
        carrying = true;
        fuel = near.fuel ?? FUEL;
        explainLantern();
      }
      markTaken(near);
      return;
    }
    const body = nearCorpse();
    if (body) {
      if (body.note) showHint(body.note, 8);
      return;
    }
    if (hasPick && breakRock()) return;
    if (carrying) {
      carrying = false;
      items.push({ kind: 'L', x: Math.round(player.x + player.w / 2 - 8), y: player.y + player.h - TILE, fuel });
    }
  }

  /** Recordar que un objeto del mapa ya se cogió (para no reponerlo al reiniciar desde el checkpoint) */
  function markTaken(it: Item) {
    if (it.x % TILE || it.y % TILE) return;
    const x = it.x / TILE;
    const y = it.y / TILE;
    if (levels[levelIdx].grid[y]?.[x] === it.kind) taken.add(`${levelIdx}:${x}:${y}`);
  }

  function nearCorpse() {
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    return corpses.find((c) => Math.abs(c.tx * TILE + 8 - cx) < 16 && Math.abs(c.ty * TILE + 8 - cy) < 14);
  }

  /** Rompe la roca agrietada que tengas delante (o debajo de los pies) */
  function breakRock() {
    // Primero lo que tienes delante, luego debajo y por último detrás
    const front = facing > 0 ? player.x + player.w + 3 : player.x - 3;
    const back = facing > 0 ? player.x - 3 : player.x + player.w + 3;
    const spots = [
      [front, player.y + 3],
      [front, player.y + player.h - 3],
      [player.x + player.w / 2, player.y + player.h + 3],
      [back, player.y + 3],
      [back, player.y + player.h - 3],
    ];
    for (const [px, py] of spots) {
      if (tileAt(px, py) !== 'X') continue;
      const tx = Math.floor(px / TILE);
      const ty = Math.floor(py / TILE);
      grid[ty] = grid[ty].slice(0, tx) + '.' + grid[ty].slice(tx + 1);
      for (let i = 0; i < 14; i++)
        debris.push({
          x: tx * TILE + 8,
          y: ty * TILE + 8,
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 2.5,
          r: 1 + Math.random() * 1.5,
          life: 30 + Math.random() * 20,
        });
      return true;
    }
    return false;
  }

  function showHint(text: string, seconds = 6) {
    hint = text;
    hintTime = seconds * 60;
  }

  function explainLantern() {
    let seen = false;
    try {
      seen = localStorage.getItem(HINT_KEY) === '1';
      localStorage.setItem(HINT_KEY, '1');
    } catch {}
    if (seen) return;
    showHint('La lámpara despierta las vetas de mineral: mientras te alumbra, las vetas azules se vuelven sólidas. Pero el aceite se acaba.', 7);
  }

  // ---------- Render ----------
  let light: HTMLCanvasElement;

  function lights() {
    const flicker = Math.sin(t / 7) * 1.5 + Math.sin(t / 3.1) * 0.8;
    const list: { x: number; y: number; r: number }[] = [
      { x: player.x + player.w / 2, y: player.y + player.h / 2, r: (carrying ? Math.max(ownLight(), lanternR()) : ownLight()) + flicker },
    ];
    for (const it of items) if (it.kind === 'L') list.push({ x: it.x + 8, y: it.y + 8, r: 72 + flicker });
    for (const p of plats) if (p.def.light) list.push({ x: p.x + p.w / 2, y: p.y, r: 40 + flicker });
    if (flareTime > 0) list.push({ x: player.x + player.w / 2, y: player.y, r: 170 * Math.min(1, flareTime / 60) });
    // Las salidas dejan pasar un poco de claridad; los cristales muertos dan una luz roja
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        if (grid[y][x] === 'S') list.push({ x: x * TILE + 8, y: y * TILE + 8, r: (GROTTO ? 44 : 22) + flicker * 0.5 });
        else if (grid[y][x] === 'R') list.push({ x: x * TILE + 8, y: y * TILE + 8, r: 30 + Math.sin(t / 25 + x) * 3 });
        else if (grid[y][x] === 'Y') list.push({ x: x * TILE + 8, y: y * TILE - 4, r: 34 });
        else if ((grid[y][x] === '*' || grid[y][x] === '+') && pulseOn(grid[y][x])) list.push({ x: x * TILE + 8, y: y * TILE + 3, r: 26 });
      }
    for (const b of bombs) list.push({ x: b.x, y: b.y, r: 14 + (b.fuse % 10) });
    for (const f of foremen) list.push({ x: f.x + 6, y: f.y + 2, r: 46 + flicker });
    if (flash > 0) list.push({ x: flashAt.x, y: flashAt.y, r: 40 + flash * 14 });
    return list;
  }

  let flashAt = { x: 0, y: 0 };

  /** Ruido determinista por casilla, para variar la roca sin parpadeos */
  const hash = (x: number, y: number) => {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };

  function drawSpikes(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, height: number, color: string) {
    ctx.fillStyle = color;
    for (let k = 0; k < w / 4; k++) {
      ctx.beginPath();
      ctx.moveTo(x + k * 4, y + TILE);
      ctx.lineTo(x + k * 4 + 2, y + TILE - height);
      ctx.lineTo(x + k * 4 + 4, y + TILE);
      ctx.fill();
    }
  }

  function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number, cracked: boolean) {
    const h = hash(x, y);
    const X = x * TILE;
    const Y = y * TILE;
    ctx.fillStyle = cracked
      ? '#5a4a3c'
      : OUT
        ? look() === 'ciudad'
          ? h < 0.33
            ? '#3a2826'
            : h < 0.66
              ? '#33221f'
              : '#40302c'
          : look() === 'campo'
            ? h < 0.33
              ? '#2e2a22'
              : h < 0.66
                ? '#29251e'
                : '#332e25'
            : h < 0.33
              ? '#3b3631'
              : h < 0.66
                ? '#36312c'
                : '#403a34'
        : GROTTO
        ? h < 0.33
          ? '#14323a'
          : h < 0.66
            ? '#112b33'
            : '#183a42'
        : ABYSS
        ? h < 0.33
          ? '#311a19'
          : h < 0.66
            ? '#2a1616'
            : '#371e1b'
        : h < 0.33
          ? '#3a2f28'
          : h < 0.66
            ? '#342a24'
            : '#3f332b';
    ctx.fillRect(X, Y, TILE, TILE);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(X + ((h * 13) | 0) % 12, Y + ((h * 29) | 0) % 12, 3, 2);
    ctx.fillRect(X + ((h * 53) | 0) % 13, Y + ((h * 71) | 0) % 13, 2, 2);
    // Borde de tierra donde la roca da a un hueco por arriba
    const above = y > 0 ? grid[y - 1][x] : '#';
    if (above !== '#' && above !== 'X' && above !== 'W' && above !== 'R') {
      ctx.fillStyle = OUT ? (look() === 'campo' ? '#34502c' : look() === 'ciudad' ? '#4a4a52' : '#6a4630') : GROTTO ? '#2f6b5e' : ABYSS ? '#55271f' : '#5b4733';
      ctx.fillRect(X, Y, TILE, 2);
      // En las grutas crecen hongos luminosos sobre la roca
      if (GROTTO && h > 0.55) {
        ctx.fillStyle = h > 0.8 ? '#8ff7d8' : '#b98cf5';
        ctx.fillRect(X + ((h * 37) | 0) % 13, Y - 2, 2, 2);
        ctx.fillRect(X + ((h * 61) | 0) % 13, Y - 1, 1, 1);
      }
    }
    if (cracked) {
      ctx.strokeStyle = '#c9b29a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(X + 3, Y + 2);
      ctx.lineTo(X + 7, Y + 7);
      ctx.lineTo(X + 5, Y + 12);
      ctx.moveTo(X + 7, Y + 7);
      ctx.lineTo(X + 13, Y + 9);
      ctx.stroke();
    } else if (h > 0.93) {
      // Pequeña veta de carbón brillante
      ctx.fillStyle = '#1b1715';
      ctx.fillRect(X + 4, Y + 9, 7, 2);
    }
  }

  /** Parte IV: cielo de noche sin luna, estrellas y la silueta del horizonte */
  function drawSky(ctx: CanvasRenderingContext2D) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#05070f');
    sky.addColorStop(1, look() === 'ciudad' ? '#1c1418' : '#111829');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    for (let k = 0; k < 70; k++) {
      const sx = hash(k, 3) * W;
      const sy = hash(k, 9) * H * 0.6;
      ctx.fillStyle = `rgba(220,225,255,${0.25 + 0.35 * hash(k, 21) * (0.6 + 0.4 * Math.sin(t / 30 + k))})`;
      ctx.fillRect(sx, sy, 1, 1);
    }
    if (look() === 'ciudad') {
      // Perfil de la ciudad, con alguna ventana encendida a lo lejos
      for (let k = 0; k < 18; k++) {
        const bx = k * 28 - 6;
        const bh = 60 + hash(k, 5) * 120;
        ctx.fillStyle = '#0b0a10';
        ctx.fillRect(bx, H - bh, 24, bh);
        for (let w = 0; w < 6; w++)
          if (hash(k, w + 30) > 0.72) {
            ctx.fillStyle = 'rgba(255,210,120,0.35)';
            ctx.fillRect(bx + 4 + (w % 3) * 6, H - bh + 10 + Math.floor(w / 3) * 14, 3, 4);
          }
      }
    } else {
      // Montañas y, en la comarca, árboles
      ctx.fillStyle = '#0b0f19';
      ctx.beginPath();
      ctx.moveTo(0, H * 0.7);
      for (let x = 0; x <= W; x += 20) ctx.lineTo(x, H * 0.55 + Math.sin(x / 60) * 22 + hash(x, 2) * 14);
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.fill();
      if (look() === 'campo')
        for (let k = 0; k < 14; k++) {
          const tx = hash(k, 41) * W;
          ctx.fillStyle = '#080b10';
          ctx.beginPath();
          ctx.moveTo(tx, H * 0.62);
          ctx.lineTo(tx - 8, H * 0.75);
          ctx.lineTo(tx + 8, H * 0.75);
          ctx.fill();
        }
    }
  }

  /** Ventana encendida (sólida: forma parte de la fachada) */
  function drawWindow(ctx: CanvasRenderingContext2D, x: number, y: number) {
    drawRock(ctx, x, y, false);
    const X = x * TILE;
    const Y = y * TILE;
    ctx.fillStyle = '#2a1d14';
    ctx.fillRect(X + 3, Y + 3, 10, 10);
    ctx.fillStyle = '#ffd36a';
    ctx.fillRect(X + 4, Y + 4, 8, 8);
    ctx.fillStyle = '#2a1d14';
    ctx.fillRect(X + 7, Y + 4, 2, 8);
    ctx.fillRect(X + 4, Y + 7, 8, 2);
  }

  function drawStreetLamp(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const X = x * TILE;
    const Y = y * TILE;
    ctx.fillStyle = '#2a2a30';
    ctx.fillRect(X + 7, Y + 4, 2, 12);
    ctx.fillStyle = '#ffe9a8';
    ctx.fillRect(X + 5, Y, 6, 4);
  }

  function drawFire(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const X = x * TILE;
    const Y = y * TILE;
    ctx.fillStyle = '#4a2a14';
    ctx.fillRect(X + 2, Y + 13, 12, 3);
    for (let k = 0; k < 4; k++) {
      const hgt = 6 + ((t * 3 + k * 7 + x * 5) % 7);
      ctx.fillStyle = k % 2 ? '#ff8a2a' : '#ffd36a';
      ctx.fillRect(X + 2 + k * 3, Y + 13 - hgt, 3, hgt);
    }
  }

  /** Roca reforzada con flejes de hierro: solo la abre la dinamita */
  function drawIronRock(ctx: CanvasRenderingContext2D, x: number, y: number) {
    drawRock(ctx, x, y, false);
    ctx.fillStyle = '#5c5f66';
    ctx.fillRect(x * TILE, y * TILE + 4, TILE, 2);
    ctx.fillRect(x * TILE, y * TILE + 11, TILE, 2);
    ctx.fillStyle = '#8b8f98';
    ctx.fillRect(x * TILE + 3, y * TILE + 4, 1, 1);
    ctx.fillRect(x * TILE + 12, y * TILE + 11, 1, 1);
  }

  /** Cristal muerto: roca con una esquirla roja que aún brilla un poco */
  function drawRedCrystal(ctx: CanvasRenderingContext2D, x: number, y: number) {
    drawRock(ctx, x, y, false);
    const X = x * TILE;
    const Y = y * TILE;
    ctx.fillStyle = '#7a1414';
    ctx.beginPath();
    ctx.moveTo(X + 4, Y + 14);
    ctx.lineTo(X + 7, Y + 3);
    ctx.lineTo(X + 10, Y + 14);
    ctx.fill();
    ctx.fillStyle = '#e04a3a';
    ctx.fillRect(X + 7, Y + 6, 1, 5);
  }

  function drawPulse(ctx: CanvasRenderingContext2D, x: number, y: number, c: string) {
    const X = x * TILE;
    const Y = y * TILE;
    const on = pulseOn(c);
    const left = pulsePeriod() * 0.62 - pulseT(c);
    // Parpadea poco antes de apagarse
    const warn = on && left < 30 && t % 8 < 4;
    const tint = c === '*' ? '126,240,224' : '190,150,250';
    if (on && !warn) {
      ctx.fillStyle = `rgba(${tint},0.95)`;
      ctx.fillRect(X, Y, TILE, 6);
      ctx.fillStyle = `rgba(${tint},0.3)`;
      ctx.fillRect(X, Y + 6, TILE, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(X + 3, Y + 1, 4, 1);
    } else {
      ctx.strokeStyle = `rgba(${tint},${warn ? 0.7 : 0.25})`;
      ctx.strokeRect(X + 0.5, Y + 0.5, TILE - 1, 5);
    }
  }

  function drawMushroom(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const X = x * TILE;
    const Y = y * TILE;
    drawRock(ctx, x, y, false);
    ctx.fillStyle = '#d9cfe8';
    ctx.fillRect(X + 6, Y - 4, 4, 5);
    ctx.fillStyle = '#d86bd0';
    ctx.beginPath();
    ctx.ellipse(X + 8, Y - 5, 8, 4, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#ffd6fb';
    ctx.fillRect(X + 4, Y - 7, 2, 1);
    ctx.fillRect(X + 10, Y - 6, 2, 1);
  }

  /** Agua quieta: refleja la gruta… y a veces algo que no está en la orilla */
  function drawWater(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const X = x * TILE;
    const Y = y * TILE;
    const surface = y === 0 || grid[y - 1][x] !== 'w';
    ctx.fillStyle = 'rgba(40,110,140,0.55)';
    ctx.fillRect(X, Y + (surface ? 4 : 0), TILE, TILE - (surface ? 4 : 0));
    if (surface) {
      ctx.fillStyle = `rgba(170,240,255,${0.35 + 0.2 * Math.sin(t / 20 + x)})`;
      ctx.fillRect(X, Y + 4, TILE, 1);
    }
    // Siluetas bajo el agua
    if (!surface && hash(x, y) > 0.82) {
      ctx.fillStyle = 'rgba(5,20,25,0.7)';
      ctx.fillRect(X + 5, Y + 2, 5, 11);
      ctx.fillRect(X + 4, Y, 7, 4);
    }
  }

  /** Suelo de tablas podridas: se hunde poco después de pisarlo */
  function drawPlanks(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const X = x * TILE;
    const Y = y * TILE;
    const k = crumbling.get(`${x}:${y}`) ?? 0;
    const shake = k ? Math.sin(k * 1.7) * 1 : 0;
    ctx.fillStyle = '#5a3a22';
    ctx.fillRect(X + shake, Y, TILE, 5);
    ctx.fillStyle = '#3a2414';
    ctx.fillRect(X + 5 + shake, Y, 1, 5);
    ctx.fillRect(X + 11 + shake, Y, 1, 5);
    ctx.fillStyle = '#7a5530';
    ctx.fillRect(X + shake, Y, TILE, 1);
  }

  function drawLadder(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const X = x * TILE;
    const Y = y * TILE;
    ctx.fillStyle = '#7a5530';
    ctx.fillRect(X + 3, Y, 2, TILE);
    ctx.fillRect(X + 11, Y, 2, TILE);
    ctx.fillStyle = '#9b7040';
    ctx.fillRect(X + 3, Y + 3, 10, 2);
    ctx.fillRect(X + 3, Y + 11, 10, 2);
  }

  function drawCart(ctx: CanvasRenderingContext2D, b: Body) {
    const x = Math.round(b.x);
    const y = Math.round(b.y);
    ctx.fillStyle = '#5b4a3a';
    ctx.beginPath();
    ctx.moveTo(x, y + 3);
    ctx.lineTo(x + 16, y + 3);
    ctx.lineTo(x + 14, y + 12);
    ctx.lineTo(x + 2, y + 12);
    ctx.fill();
    ctx.fillStyle = '#8a7560';
    ctx.fillRect(x, y + 3, 16, 2);
    // Carga de carbón
    ctx.fillStyle = '#211c19';
    ctx.fillRect(x + 3, y + 1, 10, 3);
    ctx.fillStyle = '#1a1614';
    ctx.beginPath();
    ctx.arc(x + 4.5, y + 13.5, 2.5, 0, Math.PI * 2);
    ctx.arc(x + 11.5, y + 13.5, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCorpse(ctx: CanvasRenderingContext2D, c: Corpse) {
    const X = c.tx * TILE;
    const Y = c.ty * TILE;
    ctx.save();
    if (c.flip) {
      ctx.translate(X * 2 + TILE, 0);
      ctx.scale(-1, 1);
    }
    // Cuerpo tendido con el mono azul de minero y el casco caído
    ctx.fillStyle = '#2f3a4a';
    ctx.fillRect(X + 1, Y + 12, 10, 4);
    ctx.fillStyle = '#c8b9a6';
    ctx.fillRect(X + 11, Y + 12, 3, 3);
    ctx.fillStyle = '#7c6a2a';
    ctx.fillRect(X + 13, Y + 10, 3, 2);
    ctx.fillStyle = '#5a1a18';
    ctx.fillRect(X + 4, Y + 15, 8, 1);
    ctx.restore();
  }

  function drawItem(ctx: CanvasRenderingContext2D, it: Item) {
    const x = it.x;
    const y = it.y;
    if (it.kind === 'L') {
      // Lámpara de minero
      ctx.fillStyle = '#6a6a6a';
      ctx.fillRect(x + 5, y + 4, 6, 2);
      ctx.fillStyle = '#ffcf6b';
      ctx.fillRect(x + 5, y + 6, 6, 7);
      ctx.fillStyle = '#6a6a6a';
      ctx.fillRect(x + 4, y + 13, 8, 2);
    } else if (it.kind === 'F') {
      ctx.fillStyle = '#ff6b5a';
      ctx.fillRect(x + 6, y + 4, 4, 11);
      ctx.fillStyle = '#ffd1c9';
      ctx.fillRect(x + 6, y + 4, 4, 2);
    } else if (it.kind === 'D') {
      // Cartucho de dinamita
      ctx.fillStyle = '#b3141c';
      ctx.fillRect(x + 5, y + 7, 6, 8);
      ctx.fillStyle = '#e8dcc6';
      ctx.fillRect(x + 5, y + 10, 6, 1);
      ctx.strokeStyle = '#c9b29a';
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 7);
      ctx.quadraticCurveTo(x + 10, y + 4, x + 12, y + 4);
      ctx.stroke();
    } else if (it.kind === 'T') {
      // Pico
      ctx.strokeStyle = '#8b5e34';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 15);
      ctx.lineTo(x + 11, y + 5);
      ctx.stroke();
      ctx.strokeStyle = '#b8b3c8';
      ctx.beginPath();
      ctx.moveTo(x + 6, y + 3);
      ctx.quadraticCurveTo(x + 11, y + 4, x + 15, y + 9);
      ctx.stroke();
      ctx.lineWidth = 1;
    } else {
      // Pepita de oro
      ctx.fillStyle = '#c99a2e';
      ctx.fillRect(x + 5, y + 11, 6, 4);
      ctx.fillStyle = '#ffd96a';
      ctx.fillRect(x + 6, y + 11, 3, 2);
    }
  }

  function drawPlayer(ctx: CanvasRenderingContext2D) {
    const x = Math.round(player.x);
    const y = Math.round(player.y);
    if (DEAD) return drawZombie(ctx, x, y);
    // Mono de trabajo
    ctx.fillStyle = '#3b4f6b';
    ctx.fillRect(x, y + 6, player.w, player.h - 6);
    // Cara
    ctx.fillStyle = '#e6c9a8';
    ctx.fillRect(x + 1, y + 2, 8, 5);
    // Casco
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(x, y, player.w, 3);
    ctx.fillRect(x + (facing > 0 ? 6 : 0), y + 2, 4, 1);
    ctx.fillStyle = '#14121c';
    ctx.fillRect(x + (facing > 0 ? 6 : 2), y + 4, 2, 2);
    if (climbing) {
      ctx.fillStyle = '#3b4f6b';
      ctx.fillRect(x - 1, y + 5, 2, 4);
      ctx.fillRect(x + player.w - 1, y + 5, 2, 4);
    }
    if (carrying) {
      ctx.fillStyle = '#ffcf6b';
      ctx.fillRect(facing > 0 ? x + player.w : x - 4, y + 6, 4, 6);
    }
    if (hasPick) {
      ctx.fillStyle = '#8b5e34';
      ctx.fillRect(facing > 0 ? x - 2 : x + player.w, y + 4, 2, 8);
    }
  }

  /** Julián muerto: piel gris verdosa, venas de cristal rojo, ropa rota */
  function drawZombie(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const crouch = feeding > 0 ? 4 : 0;
    ctx.fillStyle = '#2c3646';
    ctx.fillRect(x, y + 6 + crouch, player.w, player.h - 6 - crouch);
    ctx.fillStyle = '#1a1f28';
    ctx.fillRect(x + 2, y + 9 + crouch, 2, 3);
    ctx.fillRect(x + 6, y + 11 + crouch, 3, 2);
    ctx.fillStyle = '#8fa08a';
    ctx.fillRect(x + 1, y + 1 + crouch, 8, 6);
    ctx.fillStyle = '#e04a3a';
    ctx.fillRect(x + (facing > 0 ? 6 : 2), y + 3 + crouch, 2, 1);
    ctx.fillRect(x + 3, y + 7 + crouch, 1, 4);
    ctx.fillRect(x + 7, y + 8 + crouch, 1, 3);
    if (feeding > 0) {
      ctx.fillStyle = '#9b111a';
      ctx.fillRect(x + (facing > 0 ? 6 : 1), y + 5 + crouch, 4, 2);
    }
    if (climbing) {
      ctx.fillStyle = '#8fa08a';
      ctx.fillRect(x - 1, y + 5, 2, 4);
      ctx.fillRect(x + player.w - 1, y + 5, 2, 4);
    }
  }

  function drawHuman(ctx: CanvasRenderingContext2D, h: Human) {
    const x = Math.round(h.x);
    const y = Math.round(h.y);
    if (h.kind === 'v') {
      // Vecino en camisa de dormir, con una vela
      ctx.fillStyle = (Math.round(h.x / 7) + Math.round(h.y)) % 2 ? '#d8cfc0' : '#a8b4c8';
      ctx.fillRect(x, y + 5, 10, 9);
      ctx.fillStyle = '#e6c9a8';
      ctx.fillRect(x + 2, y, 6, 6);
      ctx.fillStyle = '#3a2a20';
      ctx.fillRect(x + 2, y, 6, 2);
      ctx.fillStyle = '#14121c';
      ctx.fillRect(x + (h.dir > 0 ? 5 : 3), y + 3, h.alert > 0 ? 2 : 1, h.alert > 0 ? 2 : 1);
      ctx.fillStyle = '#ffd36a';
      ctx.fillRect(h.dir > 0 ? x + 10 : x - 2, y + 5, 2, 3);
      return;
    }
    if (h.kind === 'g') {
      // Guardia civil: tricornio, capa verde oscuro y fusil
      ctx.fillStyle = '#2c3a2a';
      ctx.fillRect(x, y + 5, 10, 9);
      ctx.fillStyle = '#e6c9a8';
      ctx.fillRect(x + 2, y + 2, 6, 4);
      ctx.fillStyle = '#0d0d0d';
      ctx.fillRect(x, y, 10, 3);
      ctx.fillRect(x + (h.dir > 0 ? 7 : 0), y - 1, 3, 2);
      ctx.fillStyle = '#5a3a22';
      ctx.fillRect(h.dir > 0 ? x + 6 : x - 6, y + 6, 10, 2);
      ctx.fillStyle = '#ffcf6b';
      ctx.fillRect(h.dir > 0 ? x - 2 : x + 10, y + 7, 2, 4);
      return;
    }
    if (h.kind === 'I') {
      // El cura: sotana negra, alzacuellos blanco y un crucifijo
      ctx.fillStyle = '#15131a';
      ctx.fillRect(x, y + 4, 10, 10);
      ctx.fillStyle = '#e6c9a8';
      ctx.fillRect(x + 2, y, 6, 5);
      ctx.fillStyle = '#f2f2f2';
      ctx.fillRect(x + 2, y + 4, 6, 1);
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(x + 4, y + 6, 2, 5);
      ctx.fillRect(x + 3, y + 7, 4, 1);
      return;
    }
    // Minero de la cuadrilla de rescate: casco con lámpara y un pico
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(x, y + 6, 10, 8);
    ctx.fillStyle = '#e6c9a8';
    ctx.fillRect(x + 1, y + 2, 8, 5);
    ctx.fillStyle = h.alert > 0 ? '#d23a2a' : '#c9a227';
    ctx.fillRect(x, y, 10, 3);
    ctx.fillStyle = '#14121c';
    ctx.fillRect(x + (h.dir > 0 ? 6 : 2), y + 4, 2, 1);
    ctx.fillStyle = '#ffcf6b';
    ctx.fillRect(h.dir > 0 ? x + 10 : x - 3, y + 6, 3, 5);
    ctx.fillStyle = '#8b5e34';
    ctx.fillRect(h.dir > 0 ? x - 2 : x + 10, y + 3, 2, 9);
  }

  function drawDog(ctx: CanvasRenderingContext2D, d: Dog) {
    const x = Math.round(d.x);
    const y = Math.round(d.y);
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(x + 1, y + 2, 10, 4);
    ctx.fillRect(d.dir > 0 ? x + 9 : x - 1, y, 4, 4);
    ctx.fillRect(x + 2, y + 6, 2, 3);
    ctx.fillRect(x + 8, y + 6, 2, 3);
    ctx.fillStyle = '#e8e2d0';
    ctx.fillRect(d.dir > 0 ? x + 12 : x - 1, y + 3, 1, 1);
  }

  /** Cartel de [E] sobre lo que se puede usar ahora mismo */
  function prompt(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = 'rgba(20,16,12,0.85)';
    ctx.fillRect(x - 5, y - 8, 10, 8);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('E', x, y - 2);
  }

  function interactionSpot(): [number, number] | null {
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    if (DEAD) {
      const prey = preyNear();
      if (prey) return [prey.ref.x + 6, prey.ref.y - 2];
      const tx = Math.floor(cx / TILE);
      const ty = Math.floor(cy / TILE);
      for (const ox of [0, -1, 1]) if (grid[ty]?.[tx + ox] === 'c') return [(tx + ox) * TILE + 8, ty * TILE];
      const lamp = items.find((it) => it.kind === 'L' && Math.abs(it.x + 8 - cx) < 16 && Math.abs(it.y + 8 - cy) < 16);
      if (lamp) return [lamp.x + 8, lamp.y + 2];
      if (OUT) {
        const front = facing > 0 ? player.x + player.w + 3 : player.x - 3;
        for (const [qx, qy] of [
          [front, player.y + 3],
          [front, player.y + player.h - 3],
          [cx, cy],
          [player.x - 3, cy],
          [player.x + player.w + 3, cy],
        ]) {
          const c = tileAt(qx, qy);
          if (c === 'n' || c === 'l') return [Math.floor(qx / TILE) * TILE + 8, Math.floor(qy / TILE) * TILE];
        }
      }
    }
    const lever = switches.find((s) => s.kind === 'lever' && Math.abs(s.tx * TILE + 8 - cx) < 14 && Math.abs(s.ty * TILE + 8 - cy) < 16);
    if (lever) return [lever.tx * TILE + 8, lever.ty * TILE];
    const it = items.find((i) => i.kind !== 'G' && Math.abs(i.x + 8 - cx) < 14 && Math.abs(i.y + 8 - cy) < 16);
    if (it) return [it.x + 8, it.y + 2];
    const c = nearCorpse();
    if (c?.note) return [c.tx * TILE + 8, c.ty * TILE + 8];
    if (hasPick) {
      const front = facing > 0 ? player.x + player.w + 3 : player.x - 3;
      const back = facing > 0 ? player.x - 3 : player.x + player.w + 3;
      for (const [px, py] of [
        [front, player.y + 3],
        [front, player.y + player.h - 3],
        [cx, player.y + player.h + 3],
        [back, player.y + 3],
        [back, player.y + player.h - 3],
      ])
        if (tileAt(px, py) === 'X') return [Math.floor(px / TILE) * TILE + 8, Math.floor(py / TILE) * TILE];
    }
    return null;
  }

  function draw() {
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = GROTTO ? '#06161b' : ABYSS ? '#150909' : '#120e0c';
    ctx.fillRect(0, 0, W, H);

    if (OUT) {
      drawSky(ctx);
    } else if (GROTTO) {
      // Grutas: sin entibado; motas de luz flotando en el aire
      for (let k = 0; k < 40; k++) {
        const hx = hash(k, 7);
        const hy = hash(k, 13);
        ctx.fillStyle = `rgba(150,250,220,${0.15 + 0.15 * Math.sin(t / 40 + k)})`;
        ctx.fillRect((hx * W + t * 0.1 * (hy - 0.5)) % W, (hy * H - t * 0.05 + H) % H, 1, 1);
      }
    } else {
      // Entibado de fondo: postes de madera cada pocas columnas
      ctx.fillStyle = ABYSS ? '#211010' : '#1d1612';
      for (let x = 3; x < COLS; x += 7) ctx.fillRect(x * TILE + 6, 0, 4, H);
    }

    // Plataformas antes que los muros: así los puentes escondidos quedan tapados
    for (const p of plats) {
      ctx.fillStyle = '#6b4c2e';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = '#9b7348';
      ctx.fillRect(p.x, p.y, p.w, 2);
      ctx.fillStyle = '#4a3420';
      for (let k = TILE; k < p.w; k += TILE) ctx.fillRect(p.x + k - 1, p.y, 1, p.h);
      if (p.h > TILE) {
        // Puerta de madera con refuerzos
        ctx.fillStyle = '#4a3420';
        for (let k = 4; k < p.h; k += 10) ctx.fillRect(p.x, p.y + k, p.w, 2);
      }
      if (p.def.light) {
        ctx.fillStyle = '#ffe9a8';
        ctx.fillRect(p.x + p.w / 2 - 1, p.y - 3, 2, 3);
      }
    }

    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const c = grid[y][x];
        if (c === '#' || c === 'X') drawRock(ctx, x, y, c === 'X');
        else if (c === 'W') drawIronRock(ctx, x, y);
        else if (c === 'n') drawWindow(ctx, x, y);
        else if (c === 'l') drawStreetLamp(ctx, x, y);
        else if (c === 'f') drawFire(ctx, x, y);
        else if (c === 'R') drawRedCrystal(ctx, x, y);
        else if (c === '%') drawPlanks(ctx, x, y);
        else if (c === '*' || c === '+') drawPulse(ctx, x, y, c);
        else if (c === 'Y') drawMushroom(ctx, x, y);
        else if (c === 'w') drawWater(ctx, x, y);
        else if (c === 'H') drawLadder(ctx, x, y);
        else if (c === 'S') {
          // Boca de la galería: marco de madera y corriente de aire
          ctx.fillStyle = '#6b4c2e';
          ctx.fillRect(x * TILE, y * TILE, 2, TILE);
          ctx.fillRect(x * TILE + TILE - 2, y * TILE, 2, TILE);
          ctx.fillStyle = 'rgba(190,220,255,0.10)';
          ctx.fillRect(x * TILE + 2, y * TILE, TILE - 4, TILE);
        } else if (c === '=') {
          // Veta de mineral: sólida e iluminada con luz fuerte; si no, un brillo fantasma
          if (lit(x, y)) {
            ctx.fillStyle = '#6fd6e8';
            ctx.fillRect(x * TILE, y * TILE, TILE, 5);
            ctx.fillStyle = 'rgba(111,214,232,0.25)';
            ctx.fillRect(x * TILE, y * TILE + 5, TILE, 3);
          } else {
            ctx.strokeStyle = 'rgba(111,214,232,0.35)';
            ctx.setLineDash([2, 3]);
            ctx.strokeRect(x * TILE + 0.5, y * TILE + 0.5, TILE - 1, 4);
            ctx.setLineDash([]);
          }
        } else if (c === '^') {
          drawSpikes(ctx, x * TILE, y * TILE, TILE, 10, '#a8a29a');
        }
      }

    // Barrenas: asoman en el aviso, salen del todo después
    for (const s of spikes) {
      const st = spikeState(s);
      if (st === 'down') {
        ctx.fillStyle = '#2a211b';
        ctx.fillRect(s.x * TILE, s.y * TILE + TILE - 2, s.w * TILE, 2);
      } else drawSpikes(ctx, s.x * TILE, s.y * TILE, s.w * TILE, st === 'up' ? 10 : 3, '#a8a29a');
    }

    for (const c of corpses) drawCorpse(ctx, c);
    for (const b of boxes) drawCart(ctx, b);
    for (const sw of switches) {
      ctx.fillStyle = '#4a3c30';
      if (sw.kind === 'plate') ctx.fillRect(sw.tx * TILE + 1, sw.ty * TILE + (sw.on ? 14 : 12), sw.w * TILE - 2, sw.on ? 2 : 4);
      else {
        ctx.fillRect(sw.tx * TILE + 5, sw.ty * TILE + 12, 6, 4);
        ctx.strokeStyle = '#8a7a68';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sw.tx * TILE + 8, sw.ty * TILE + 13);
        ctx.lineTo(sw.tx * TILE + (sw.on ? 13 : 3), sw.ty * TILE + 5);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    }
    for (const it of items) drawItem(ctx, it);
    // Sangre: manchas de muertes anteriores en este nivel y gotas en vuelo
    for (const st of stains) {
      ctx.fillStyle = '#6e0f14';
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#b3141c';
    for (const d of drops) ctx.fillRect(d.x - d.r / 2, d.y - d.r / 2, d.r, d.r);
    ctx.fillStyle = '#8a7560';
    for (const d of debris) ctx.fillRect(d.x, d.y, d.r, d.r);

    // Vivos, perros y velas (Parte III)
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        if (grid[y][x] === 'c') {
          ctx.fillStyle = '#ece4d0';
          ctx.fillRect(x * TILE + 6, y * TILE + 9, 4, 7);
          ctx.fillStyle = t % 10 < 5 ? '#ffd36a' : '#ffb347';
          ctx.fillRect(x * TILE + 7, y * TILE + 6, 2, 3);
        }
    for (const h of humans) drawHuman(ctx, h);
    ctx.fillStyle = '#ffe9a8';
    for (const b of bullets) ctx.fillRect(Math.round(b.x) - 2, Math.round(b.y), 4, 1);
    for (const d of dogs) drawDog(ctx, d);

    if (!dying) drawPlayer(ctx);

    // Huecos: mineros encorvados, grises, con las cuencas vacías
    for (const h of hollows) {
      const x = Math.round(h.x);
      const y = Math.round(h.y);
      ctx.fillStyle = '#4a5560';
      ctx.fillRect(x + 1, y + 4, 8, h.h - 4);
      ctx.fillStyle = '#8d9aa3';
      ctx.fillRect(x + (h.dir > 0 ? 3 : 1), y, 6, 5);
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(x + (h.dir > 0 ? 6 : 2), y + 2, 2, 2);
      ctx.fillStyle = '#4a5560';
      ctx.fillRect(x + (h.dir > 0 ? 8 : -1), y + 6, 3, 2);
    }
    // Arañas de cristal y su hilo
    for (const sp of spiders) {
      if (sp.state === 'gone') continue;
      ctx.strokeStyle = sp.state === 'warn' ? 'rgba(220,250,255,0.9)' : 'rgba(170,220,230,0.35)';
      ctx.beginPath();
      ctx.moveTo(sp.x + 4, sp.ay);
      ctx.lineTo(sp.x + 4, sp.y);
      ctx.stroke();
      ctx.fillStyle = '#9fe3ec';
      ctx.fillRect(sp.x + 1, sp.y, 6, 5);
      ctx.fillStyle = '#d9fbff';
      ctx.fillRect(sp.x + 3, sp.y + 1, 2, 2);
      ctx.fillStyle = '#6fbac4';
      for (const k of [0, 2, 4]) {
        ctx.fillRect(sp.x - 1, sp.y + k, 2, 1);
        ctx.fillRect(sp.x + 7, sp.y + k, 2, 1);
      }
    }
    // Dinamita encendida
    for (const b of bombs) {
      ctx.fillStyle = '#b3141c';
      ctx.fillRect(b.x - 2, b.y - 4, 4, 8);
    }
    // Ventura: alto, con el casco de capataz y un saco al hombro
    for (const f of foremen) {
      const x = Math.round(f.x);
      const y = Math.round(f.y);
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(x + 1, y + 4, 10, 12);
      ctx.fillStyle = '#d8c8b0';
      ctx.fillRect(x + 3, y + 1, 6, 4);
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(x + 1, y - 1, 10, 3);
      ctx.fillStyle = '#6b4c2e';
      ctx.fillRect(x + 9, y + 5, 4, 6);
      // La tabla de su balcón
      ctx.fillStyle = '#5a3a22';
      ctx.fillRect(x - 6, y + 16, 24, 3);
    }
    // El eco: tu misma silueta, oscura y medio transparente
    const echo = levels[levelIdx].echo;
    if (echo && trail.length > echo) {
      const e = trail[trail.length - 1 - echo];
      ctx.fillStyle = 'rgba(60,10,14,0.85)';
      ctx.fillRect(Math.round(e.x), Math.round(e.y), player.w, player.h);
      ctx.fillStyle = 'rgba(120,20,26,0.9)';
      ctx.fillRect(Math.round(e.x), Math.round(e.y), player.w, 3);
    }
    // Agua que sube
    if (floodY < H) {
      ctx.fillStyle = 'rgba(30,60,80,0.6)';
      ctx.fillRect(0, floodY, W, H - floodY);
      ctx.fillStyle = 'rgba(150,200,220,0.55)';
      ctx.fillRect(0, floodY, W, 1);
    }

    // Sombras: un hueco negro con forma de hombre, que solo se distingue a la luz
    for (const sh of shades) {
      const x = sh.x;
      const y = sh.y;
      ctx.fillStyle = 'rgba(0,0,0,0.92)';
      ctx.beginPath();
      ctx.ellipse(x + SHADE_W / 2, y + 4, 4, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, y + SHADE_H + 2);
      ctx.lineTo(x + 2, y + 6);
      ctx.lineTo(x + SHADE_W - 2, y + 6);
      ctx.lineTo(x + SHADE_W, y + SHADE_H + 2);
      ctx.fill();
    }

    if (DEAD) {
      // Julián ve en la oscuridad (todo rojizo); la luz le deslumbra y le quema
      ctx.fillStyle = 'rgba(70,0,6,0.32)';
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const s of burnLights()) {
        const gl = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
        gl.addColorStop(0, 'rgba(255,245,220,0.55)');
        gl.addColorStop(1, 'rgba(255,245,220,0)');
        ctx.fillStyle = gl;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      if (burning > 0) {
        ctx.fillStyle = `rgba(255,120,80,${0.04 * burning})`;
        ctx.fillRect(0, 0, W, H);
      }
    }

    // Máscara de oscuridad
    const l = light.getContext('2d')!;
    l.globalCompositeOperation = 'source-over';
    l.fillStyle = GROTTO ? 'rgba(0,8,10,0.38)' : ABYSS ? 'rgba(0,0,0,0.93)' : 'rgba(0,0,0,0.97)';
    l.clearRect(0, 0, W, H);
    l.fillRect(0, 0, W, H);
    l.globalCompositeOperation = 'destination-out';
    for (const s of lights()) {
      const g = l.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(0.55, 'rgba(0,0,0,0.85)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      l.fillStyle = g;
      l.beginPath();
      l.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      l.fill();
    }
    if (!DEAD) ctx.drawImage(light, 0, 0);

    // Señales que se ven a través de la oscuridad: aviso de barrenas, interruptores, brillo del oro
    for (const s of spikes)
      if (spikeState(s) === 'warn' && t % 8 < 5) {
        ctx.fillStyle = 'rgba(255,90,80,0.8)';
        for (let k = 0; k < s.w * 2; k++) ctx.fillRect(s.x * TILE + k * 8 + 3, s.y * TILE + TILE - 3, 2, 2);
      }
    for (const sw of switches) {
      // Con temporizador, el piloto parpadea cada vez más deprisa según se acaba el tiempo
      if (sw.timer && sw.timer < 180 && t % (sw.timer < 60 ? 6 : 14) < 3) continue;
      ctx.fillStyle = sw.on ? 'rgba(120,230,140,0.9)' : 'rgba(230,110,90,0.7)';
      ctx.fillRect(sw.tx * TILE + (sw.w * TILE) / 2 - 1, sw.ty * TILE + (sw.kind === 'plate' ? 10 : 2), 2, 2);
    }
    // Grisú: una neblina verdosa que se ve aunque esté oscuro
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        if (grid[y][x] === '~') {
          ctx.fillStyle = `rgba(150,190,90,${0.1 + 0.05 * Math.sin(t / 30 + x + y)})`;
          ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        }
    // Mecha chisporroteando
    for (const b of bombs)
      if (t % 4 < 2) {
        ctx.fillStyle = '#ffd36a';
        ctx.fillRect(b.x - 1 + ((t * 7) % 3) - 1, b.y - 6, 2, 2);
      }
    // Polillas: polvo de luz que se ve en la oscuridad
    for (const m of moths) {
      const flap = (t + m.phase) % 6 < 3;
      ctx.fillStyle = 'rgba(240,230,190,0.85)';
      ctx.fillRect(Math.round(m.x) - (flap ? 2 : 1), Math.round(m.y) - 1, flap ? 4 : 2, 2);
      ctx.fillStyle = 'rgba(255,250,210,0.35)';
      ctx.fillRect(Math.round(m.x) - 1, Math.round(m.y) + 2, 1, 1);
    }
    // El eco se adivina en la oscuridad por sus ojos
    if (echo && trail.length > echo) {
      const e = trail[trail.length - 1 - echo];
      ctx.fillStyle = 'rgba(255,70,60,0.7)';
      ctx.fillRect(Math.round(e.x) + (e.f > 0 ? 6 : 2), Math.round(e.y) + 4, 2, 1);
    }
    // La lámpara de Ventura
    for (const f of foremen) {
      ctx.fillStyle = 'rgba(255,200,120,0.9)';
      ctx.fillRect(Math.round(f.x) + 5, Math.round(f.y), 2, 2);
    }
    // Línea del agua que sube, visible aunque esté oscuro
    if (floodY < H) {
      ctx.fillStyle = 'rgba(150,200,220,0.5)';
      ctx.fillRect(0, floodY, W, 1);
    }
    // Huecos alertados: un «!» apagado sobre la cabeza
    for (const h of hollows)
      if (h.alert > 0 && t % 20 < 14) {
        ctx.fillStyle = 'rgba(200,80,70,0.85)';
        ctx.fillRect(Math.round(h.x) + 4, Math.round(h.y) - 7, 2, 4);
        ctx.fillRect(Math.round(h.x) + 4, Math.round(h.y) - 2, 2, 1);
      }
    // Arañas colgando: un brillo débil de vez en cuando
    for (const sp of spiders)
      if (sp.state === 'hang' && (t + sp.x * 5) % 160 < 8) {
        ctx.fillStyle = 'rgba(200,250,255,0.7)';
        ctx.fillRect(sp.x + 3, sp.y + 1, 2, 2);
      }
    // Destello de explosión
    if (flash > 0) {
      ctx.fillStyle = `rgba(255,230,180,${flash / 30})`;
      ctx.fillRect(0, 0, W, H);
    }
    // Los ojos de las sombras se ven siempre, aunque no veas nada más
    for (const sh of shades) {
      const blink = (t + sh.phase * 31) % 200 < 6;
      if (blink) continue;
      ctx.fillStyle = sh.fleeing ? 'rgba(160,40,40,0.5)' : 'rgba(255,60,50,0.95)';
      ctx.fillRect(Math.round(sh.x) + 2, Math.round(sh.y) + 3, 2, 1);
      ctx.fillRect(Math.round(sh.x) + 6, Math.round(sh.y) + 3, 2, 1);
    }
    for (const it of items)
      if (it.kind === 'G' && (t + it.x * 3) % 140 < 6) {
        ctx.fillStyle = 'rgba(255,230,140,0.9)';
        ctx.fillRect(it.x + 7, it.y + 10, 2, 2);
      }
    if (!dying) {
      const spot = interactionSpot();
      if (spot) prompt(ctx, spot[0], spot[1]);
    }
  }

  onMount(() => {
    light = document.createElement('canvas');
    light.width = W;
    light.height = H;
    load(Math.max(0, Math.min(levels.length - 1, start)), true);

    const down = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      // Durante una escena, E / Espacio / Intro avanzan el texto
      if (cine) {
        if ((k === 'e' || k === ' ' || k === 'Enter') && !e.repeat) {
          e.preventDefault();
          advanceCine();
        }
        return;
      }
      if (blast > 0) return;
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) e.preventDefault();
      if (!keys.has(k)) {
        // Arriba salta, salvo en una escalera (ahí trepa); Espacio salta siempre
        if (k === ' ' || ((k === 'ArrowUp' || k === 'w') && !nearLadder)) buffer = BUFFER;
        if (k === 'e') interact();
        if (k === 'q' && flares > 0 && flareTime === 0) {
          flares--;
          flareTime = 360;
        }
        if (k === 'r' && !dying) load(levelIdx);
        if (k === 'f') plantDynamite();
      }
      keys.add(k);
    };
    const up = (e: KeyboardEvent) => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    const blur = () => keys.clear();
    addEventListener('keydown', down);
    addEventListener('keyup', up);
    addEventListener('blur', blur);

    // Paso fijo a 60 Hz con acumulador
    let last = performance.now();
    let acc = 0;
    let raf = 0;
    const frame = (now: number) => {
      acc = Math.min(acc + (now - last), 250);
      last = now;
      while (acc >= 1000 / 60) {
        step();
        acc -= 1000 / 60;
      }
      draw();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // Gancho de pruebas: avanzar la simulación de forma determinista
    if (import.meta.env.DEV)
      (window as any).__oscuras = {
        down: (key: string) => down(new KeyboardEvent('keydown', { key })),
        up: (key: string) => keys.delete(key),
        run: (n: number) => {
          for (let i = 0; i < n; i++) step();
          draw();
        },
        load: (i: number) => load(i, true),
        /** Coloca al jugador en la casilla (cx, cy), de pie */
        tp: (cx: number, cy: number) => {
          player.x = cx * TILE + (TILE - PW) / 2;
          player.y = cy * TILE + TILE - PH;
          player.vx = player.vy = 0;
        },
        give: (what: { pick?: boolean; lamp?: boolean; dynamite?: number }) => {
          if (what.pick) hasPick = true;
          if (what.dynamite) dynamite += what.dynamite;
          if (what.lamp) {
            carrying = true;
            fuel = FUEL;
          }
        },
        tile: (cx: number, cy: number) => grid[cy][cx],
        get: () => ({
          player: { ...player },
          boxes: boxes.map((b) => ({ ...b })),
          plats: plats.map((p) => ({ x: p.x, y: p.y, s: p.s })),
          switches: switches.map((s) => s.on),
          screen: levelIdx,
          deaths,
          carrying,
          fuel,
          hasPick,
          gold,
          climbing,
          shades: shades.map((sh) => ({ x: sh.x, y: sh.y, fleeing: sh.fleeing })),
          hollows: hollows.map((h) => ({ x: h.x, y: h.y, alert: h.alert })),
          spiders: spiders.map((sp) => ({ x: sp.x, y: sp.y, state: sp.state })),
          dynamite,
          flesh,
          hunger,
          eaten,
          humans: humans.map((h) => ({ x: h.x, y: h.y, alert: h.alert, kind: h.kind, dir: h.dir })),
          horde,
          followers: hollows.length,
          bullets: bullets.length,
          dogs: dogs.map((d) => ({ x: d.x, y: d.y })),
          foremen: foremen.map((f) => ({ x: f.x, y: f.y, cool: f.cool })),
          bombs: bombs.map((b) => ({ x: b.x, y: b.y, fuse: b.fuse, flying: b.vx !== undefined })),
          flares,
          t,
        }),
      };

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('keydown', down);
      removeEventListener('keyup', up);
      removeEventListener('blur', blur);
    };
  });
</script>

<div class="wrap">
  <div class="screen">
    <canvas bind:this={canvas} width={W} height={H} aria-label="Nivel {levelIdx + 1} de {levels.length}, a oscuras"></canvas>
    {#if cine}
      <div
        class="cine {cine.kind}"
        style="--r: {cine.kind === 'luz' ? Math.min(140, cineT / 2.2) : 0}%"
        role="dialog"
        aria-label="Escena"
      >
        <div class="lines" aria-live="polite">
          {#each cine.lines.slice(0, cineShown) as line, i (i)}
            <p>{line}</p>
          {/each}
        </div>
        <button type="button" class="next" class:ready={cineReady} onclick={advanceCine}>
          {cineReady ? 'Continuar ▸' : 'Saltar ▸'}
        </button>
      </div>
    {:else if blast > 0}
      <div class="blast" style={blastStyle()} aria-hidden="true"></div>
    {:else if banner}
      <div class="banner" role="status">
        <p class="bn">{OUT ? 'Noche' : DEAD ? 'Subida' : ABYSS ? 'Abismo' : 'Galería'} {banner.n}</p>
        <p class="bt">{banner.name}</p>
        <p class="bl">{banner.line}</p>
      </div>
    {:else if hint}
      <p class="hint" role="status">{hint}</p>
    {/if}
  </div>
  <p class="status" aria-live="polite">
    {OUT ? 'Noche' : DEAD ? 'Subida' : ABYSS ? 'Abismo' : 'Galería'} {levelIdx + 1}/{levels.length} · {levels[levelIdx].name} · Oro: {gold} ·
    {#if DEAD}Carne: {Math.ceil(flesh)} · Hambre: {Math.ceil(hunger)}{OUT ? ` · Horda: ${horde}` : ''}{levels[levelIdx].need ? ` · Comidos: ${eaten}/${levels[levelIdx].need}` : ''}{:else}{carrying ? `Lámpara ${Math.ceil(fuel / 60)} s` : 'Sin lámpara'}{hasPick ? ' · Pico' : ''}{/if}{dynamite ? ` · Dinamita: ${dynamite}` : ''}{flares ? ` · Bengalas: ${flares}` : ''}{flareTime > 0 ? ' (ardiendo)' : ''}{doorTime ? ` · Puerta: ${doorTime} s` : ''} · Caídas: {deaths}
  </p>
  {#if done}
    <div class="win">
      <p>Al amanecer, las campanas de la catedral dejan de sonar. Nadie las vuelve a tocar.</p>
      <p>
        El canto sale de la boca de Julián y de miles de bocas más. Se oye en los trenes, en los puertos, en las radios
        que nadie apaga. Cada ciudad que lo escucha se queda a oscuras.
      </p>
      <p>En pocas semanas no queda una ventana encendida en el mundo. No hacen falta: los muertos ven en la oscuridad.</p>
      <p>
        Muy abajo, en una galería de la mina de Las Ánimas, una nota escrita con carbón espera a que alguien la lea:
        <strong>«No subas»</strong>.
      </p>
      <p>Ya no queda nadie para leerla. Por fin, todos han bajado.</p>
      <p class="fin">FIN</p>
    </div>
  {/if}
</div>

<style>
  .wrap {
    display: grid;
    gap: 0.75rem;
    justify-items: center;
  }
  .screen {
    position: relative;
    width: min(100%, 960px);
  }
  /* Escenas: texto sobre la pantalla del juego */
  .cine {
    position: absolute;
    inset: 0;
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 1rem;
    padding: 1.5rem;
    color: #f0e2c8;
    font-family: ui-monospace, monospace;
    text-align: center;
  }
  /* «luz»: la oscuridad se abre desde el centro, como unos ojos que se acostumbran */
  .cine.luz {
    background: radial-gradient(circle at 50% 55%, transparent var(--r), rgb(0 0 0 / 0.92) calc(var(--r) + 12%));
  }
  .cine.boom {
    background: linear-gradient(rgb(255 255 240 / 0.12), rgb(0 0 0 / 0.78));
  }
  .lines {
    display: grid;
    gap: 0.6rem;
    max-width: 36rem;
    padding: 0.9rem 1.2rem;
    background: rgb(4 10 12 / 0.72);
    border-radius: 4px;
  }
  .lines p {
    margin: 0;
    font-size: clamp(0.75rem, 1.6vw, 1rem);
    line-height: 1.5;
    text-shadow: 0 1px 6px #000;
    animation: line-in 1.2s ease-out;
  }
  .next {
    padding: 0.35rem 0.9rem;
    font: inherit;
    font-size: 0.8rem;
    color: #f0e2c8;
    background: rgb(0 0 0 / 0.45);
    border: 1px solid rgb(240 226 200 / 0.35);
    border-radius: 3px;
    cursor: pointer;
    opacity: 0.6;
  }
  .next.ready {
    opacity: 1;
    border-color: #c9a227;
  }
  @keyframes line-in {
    from {
      opacity: 0;
      transform: translateY(0.3rem);
    }
  }
  /* Explosión: destello blanco que se apaga a negro, con la pantalla temblando */
  .blast {
    position: absolute;
    inset: 0;
    animation: shake 0.12s steps(2) infinite;
  }
  @keyframes shake {
    50% {
      transform: translate(3px, -2px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .lines p,
    .blast {
      animation: none;
    }
  }
  .win strong {
    color: #ff6b5a;
  }
  .banner {
    position: absolute;
    left: 50%;
    top: 1rem;
    transform: translateX(-50%);
    margin: 0;
    padding: 0.5rem 1.1rem;
    text-align: center;
    color: #f0e2c8;
    font-family: ui-monospace, monospace;
    background: rgba(18, 12, 8, 0.82);
    border-top: 1px solid #c9a227;
    border-bottom: 1px solid #c9a227;
    animation: hint-in 0.6s ease-out;
    pointer-events: none;
  }
  .banner p {
    margin: 0;
  }
  .bn {
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #c9a227;
  }
  .bt {
    font-size: 1.15rem;
    font-weight: 700;
  }
  .bl {
    font-size: 0.8rem;
    opacity: 0.8;
    font-style: italic;
  }
  .hint {
    position: absolute;
    left: 50%;
    top: 1rem;
    transform: translateX(-50%);
    width: min(90%, 36rem);
    margin: 0;
    padding: 0.6rem 0.9rem;
    border: 1px solid #c9a227;
    border-radius: 4px;
    background: rgba(18, 12, 8, 0.9);
    color: #f0e2c8;
    font-family: ui-monospace, monospace;
    font-size: 0.85rem;
    line-height: 1.4;
    text-align: center;
    animation: hint-in 0.4s ease-out;
  }
  @keyframes hint-in {
    from {
      opacity: 0;
      transform: translate(-50%, -0.4rem);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .hint {
      animation: none;
    }
  }
  canvas {
    display: block;
    width: 100%;
    image-rendering: pixelated;
    background: #000;
    border-radius: 4px;
  }
  .status,
  .win {
    font-family: ui-monospace, monospace;
    font-size: 0.9rem;
    margin: 0;
  }
  .win {
    max-width: 40rem;
    display: grid;
    gap: 0.6rem;
    padding: 1.2rem 1.4rem;
    color: #e8dcc6;
    background: #0d0909;
    border-left: 3px solid #8a1c1c;
    line-height: 1.6;
  }
  .win p {
    margin: 0;
  }
  .fin {
    letter-spacing: 0.4em;
    color: #8a1c1c;
    font-weight: 700;
  }
</style>
