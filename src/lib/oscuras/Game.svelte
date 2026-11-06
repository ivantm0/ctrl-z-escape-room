<script lang="ts">
  import { onMount } from 'svelte';
  import { TILE, COLS, ROWS, levels, type PlatformDef, type SpikesDef } from './maps';

  let { start = 0, onwin }: { start?: number; onwin?: () => void } = $props();

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
  /** Aceite del farol: 45 s llevándolo; en los últimos 5 s la luz se va apagando */
  const FUEL = 30 * 60;
  const FADE = 5 * 60;

  type Body = { x: number; y: number; w: number; h: number; vx: number; vy: number; ground: boolean };
  /** fuel: aceite que le queda a un farol soltado (los del mapa vienen llenos) */
  type Item = { kind: 'L' | 'F'; x: number; y: number; fuel?: number };
  type Plat = Body & { def: PlatformDef; s: number; len: number };
  type Switch = { kind: 'plate' | 'lever'; tx: number; ty: number; w: number; on: boolean };

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
  let deaths = $state(0);
  let done = $state(false);

  let grid: string[] = [];
  let player: Body;
  let boxes: Body[] = [];
  let plats: Plat[] = [];
  let spikes: SpikesDef[] = [];
  let switches: Switch[] = [];
  let items: Item[] = [];
  let spawn = { x: 0, y: 0 };
  let coyote = 0;
  let buffer = 0;
  /** Reloj de la pantalla: se pone a 0 al cargarla, así los ciclos son reproducibles */
  let t = 0;
  let crushed = false;
  const taken = new Set<string>();
  const keys = new Set<string>();

  // Lo que llevabas al entrar en la pantalla: al morir o pulsar R vuelves a ese estado
  let checkpoint = { carrying: false, fuel: 0, flares: 0, taken: [] as string[] };

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
    if (enter) {
      checkpoint = { carrying, fuel, flares, taken: [...taken] };
      stains = [];
    } else {
      carrying = checkpoint.carrying;
      fuel = checkpoint.fuel;
      flares = checkpoint.flares;
      taken.clear();
      checkpoint.taken.forEach((k) => taken.add(k));
    }
    flareTime = 0;
    t = 0;
    levelIdx = i;
    const lvl = levels[i];
    grid = lvl.grid.map((r) => r.replace(/[PBLFK_]/g, '.'));
    boxes = [];
    items = [];
    switches = [];
    lvl.grid.forEach((row, y) =>
      [...row].forEach((c, x) => {
        if (c === 'P') spawn = { x: x * TILE + (TILE - PW) / 2, y: y * TILE + TILE - PH };
        if (c === 'B') boxes.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE, vx: 0, vy: 0, ground: false });
        if ((c === 'L' || c === 'F') && !taken.has(`${i}:${x}:${y}`)) items.push({ kind: c, x: x * TILE, y: y * TILE });
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
  function strongLights() {
    const list: { x: number; y: number; r: number }[] = [];
    if (carrying) list.push({ x: player.x + player.w / 2, y: player.y + player.h / 2, r: lanternR() });
    for (const it of items) if (it.kind === 'L') list.push({ x: it.x + 8, y: it.y + 8, r: 72 });
    if (flareTime > 0) list.push({ x: player.x + player.w / 2, y: player.y, r: 170 * Math.min(1, flareTime / 60) });
    return list;
  }
  /** Una casilla de luz es sólida si su centro está dentro del 75 % del radio de una luz fuerte */
  function lit(tx: number, ty: number) {
    const cx = tx * TILE + TILE / 2;
    const cy = ty * TILE + TILE / 2;
    return strongLights().some((s) => Math.hypot(s.x - cx, s.y - cy) < s.r * 0.75);
  }
  /** Las plataformas de luz, mientras están iluminadas, son tan sólidas como un muro (también desde abajo) */
  const solidTile = (px: number, py: number) => {
    const c = tileAt(px, py);
    return c === '#' || (c === '=' && lit(Math.floor(px / TILE), Math.floor(py / TILE)));
  };

  /** Radio del farol que llevas: se encoge al quedarse sin aceite */
  const lanternR = () => 80 * Math.min(1, fuel / FADE);

  // ---------- Colisiones ----------

  // Margen para que errores de coma flotante no cuenten como solapamiento
  const EPS = 0.01;
  const overlap = (a: Body, b: Body) =>
    a.x < b.x + b.w - EPS && a.x + a.w > b.x + EPS && a.y < b.y + b.h - EPS && a.y + a.h > b.y + EPS;

  function hitsWorld(b: Body, others: Body[]) {
    for (const px of [b.x + EPS, b.x + b.w - EPS])
      for (const py of [b.y + EPS, b.y + b.h / 2, b.y + b.h - EPS]) if (solidTile(px, py)) return true;
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
      if (hitsWorld(b, free)) {
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
    for (const sw of switches) {
      if (sw.kind !== 'plate') continue;
      const zone: Body = { x: sw.tx * TILE + 1, y: sw.ty * TILE + 10, w: sw.w * TILE - 2, h: 6, vx: 0, vy: 0, ground: false };
      sw.on = [player, ...boxes].some((b) => overlap(b, zone));
    }
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
        const target = active(p.def.trigger) ? 1 : 0;
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

  // ---------- Bucle ----------

  // ---------- Muerte y sangre ----------

  type Drop = { x: number; y: number; vx: number; vy: number; r: number };
  /** Gotas en el aire durante la animación de muerte */
  let drops: Drop[] = [];
  /** Manchas pegadas al escenario: se quedan en el nivel hasta que lo superas */
  let stains: { x: number; y: number; r: number }[] = [];
  /** Fotogramas que quedan de animación de muerte (el nivel se reinicia al llegar a 0) */
  let dying = 0;
  const DEATH_FRAMES = 50;

  function die() {
    if (dying) return;
    deaths++;
    dying = DEATH_FRAMES;
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
    if (dying) return updateDeath();
    t++;
    updateSwitches();
    crushed = false;
    updatePlats();
    if (crushed) return die();

    const left = keys.has('ArrowLeft') || keys.has('a');
    const right = keys.has('ArrowRight') || keys.has('d');
    const target = (right ? RUN : 0) - (left ? RUN : 0);
    player.vx += Math.sign(target - player.vx) * Math.min(ACCEL, Math.abs(target - player.vx));

    for (const b of boxes) fall(b, [player, ...boxes, ...plats]);

    const solids = [...boxes, ...plats];
    if (move(player, player.vx, 0, solids, true)) player.vx = 0;
    const wasGround = player.ground;
    fall(player, solids);
    if (player.ground) coyote = COYOTE;
    else if (wasGround || coyote > 0) coyote--;

    if (buffer > 0) {
      buffer--;
      if (coyote > 0) {
        player.vy = -JUMP_V;
        coyote = 0;
        buffer = 0;
        player.ground = false;
      }
    }
    // Salto variable: soltar pronto corta la subida
    if (!jumpHeld() && player.vy < -2) player.vy = -2;

    if (flareTime > 0) flareTime--;
    if (hintTime > 0 && --hintTime === 0) hint = '';
    if (carrying && --fuel <= 0) carrying = false;

    // Pinchos fijos, pinchos móviles o vacío
    const feet = player.y + player.h - 1;
    if (tileAt(player.x + 2, feet) === '^' || tileAt(player.x + player.w - 2, feet) === '^' || player.y > H) return die();
    for (const s of spikes) {
      if (spikeState(s) !== 'up') continue;
      const zone: Body = { x: s.x * TILE + 2, y: s.y * TILE + 6, w: s.w * TILE - 4, h: 10, vx: 0, vy: 0, ground: false };
      if (overlap(player, zone)) return die();
    }

    // Salida por la derecha
    if (player.x + player.w > W) {
      if (levelIdx + 1 < levels.length) {
        load(levelIdx + 1, true);
      } else if (!done) {
        done = true;
        onwin?.();
      }
    }
    if (player.x < 0) player.x = 0;
  }

  const jumpHeld = () => keys.has(' ') || keys.has('ArrowUp') || keys.has('w');

  function interact() {
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    const lever = switches.find(
      (s) => s.kind === 'lever' && Math.abs(s.tx * TILE + 8 - cx) < 14 && Math.abs(s.ty * TILE + 8 - cy) < 16,
    );
    if (lever) {
      lever.on = !lever.on;
      return;
    }
    const near = items.find((it) => Math.abs(it.x + 8 - cx) < 14 && Math.abs(it.y + 8 - cy) < 16);
    if (near) {
      items = items.filter((i) => i !== near);
      if (near.kind === 'F') flares++;
      else {
        // Si ya llevabas uno, lo cambias: el viejo se queda en el suelo con su aceite
        if (carrying) items.push({ kind: 'L', x: near.x, y: near.y, fuel });
        carrying = true;
        fuel = near.fuel ?? FUEL;
        explainLantern();
      }
      // Recordar la posición original si viene del mapa
      const src = levels[levelIdx].grid;
      for (let y = 0; y < ROWS; y++) {
        const x = src[y].indexOf(near.kind);
        if (x >= 0 && x * TILE === near.x && y * TILE === near.y) taken.add(`${levelIdx}:${x}:${y}`);
      }
    } else if (carrying) {
      carrying = false;
      items.push({ kind: 'L', x: Math.round(player.x + player.w / 2 - 8), y: player.y + player.h - TILE, fuel });
    }
  }

  function explainLantern() {
    let seen = false;
    try {
      seen = localStorage.getItem(HINT_KEY) === '1';
      localStorage.setItem(HINT_KEY, '1');
    } catch {}
    if (seen) return;
    hint = 'El farol da forma a la luz: mientras te alumbra, las plataformas azules se vuelven sólidas. Pero se gasta.';
    hintTime = 7 * 60;
  }

  // ---------- Render ----------
  let light: HTMLCanvasElement;

  function lights() {
    const flicker = Math.sin(t / 7) * 1.5 + Math.sin(t / 3.1) * 0.8;
    const list: { x: number; y: number; r: number }[] = [
      { x: player.x + player.w / 2, y: player.y + player.h / 2, r: (carrying ? Math.max(42, lanternR()) : 42) + flicker },
    ];
    for (const it of items) if (it.kind === 'L') list.push({ x: it.x + 8, y: it.y + 8, r: 72 + flicker });
    for (const p of plats) if (p.def.light) list.push({ x: p.x + p.w / 2, y: p.y, r: 40 + flicker });
    if (flareTime > 0) list.push({ x: player.x + player.w / 2, y: player.y, r: 170 * Math.min(1, flareTime / 60) });
    return list;
  }

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

  function draw() {
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#14121c';
    ctx.fillRect(0, 0, W, H);

    // Plataformas antes que los muros: así los puentes escondidos quedan tapados
    for (const p of plats) {
      ctx.fillStyle = '#6b7a99';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = '#a9b8d6';
      ctx.fillRect(p.x, p.y, p.w, 2);
      if (p.def.light) {
        ctx.fillStyle = '#ffe9a8';
        ctx.fillRect(p.x + p.w / 2 - 1, p.y + 2, 2, 2);
      }
    }

    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const c = grid[y][x];
        if (c === '#') {
          ctx.fillStyle = (x + y) % 2 ? '#3b3550' : '#352f48';
          ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        } else if (c === '=') {
          // Sólida e iluminada con luz fuerte; si no, apenas un contorno fantasma
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
          drawSpikes(ctx, x * TILE, y * TILE, TILE, 10, '#b8b3c8');
        }
      }

    // Pinchos móviles: asoman en el aviso, salen del todo después
    for (const s of spikes) {
      const st = spikeState(s);
      if (st === 'down') {
        ctx.fillStyle = '#2a2638';
        ctx.fillRect(s.x * TILE, s.y * TILE + TILE - 2, s.w * TILE, 2);
      } else drawSpikes(ctx, s.x * TILE, s.y * TILE, s.w * TILE, st === 'up' ? 10 : 3, '#b8b3c8');
    }

    for (const b of boxes) {
      ctx.fillStyle = '#8a6a3f';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#5a4428';
      ctx.strokeRect(b.x + 1.5, b.y + 1.5, b.w - 3, b.h - 3);
    }
    for (const sw of switches) {
      ctx.fillStyle = '#4a4560';
      if (sw.kind === 'plate') ctx.fillRect(sw.tx * TILE + 1, sw.ty * TILE + (sw.on ? 14 : 12), sw.w * TILE - 2, sw.on ? 2 : 4);
      else {
        ctx.fillRect(sw.tx * TILE + 5, sw.ty * TILE + 12, 6, 4);
        ctx.strokeStyle = '#8a84a3';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sw.tx * TILE + 8, sw.ty * TILE + 13);
        ctx.lineTo(sw.tx * TILE + (sw.on ? 13 : 3), sw.ty * TILE + 5);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    }
    for (const it of items) {
      ctx.fillStyle = it.kind === 'L' ? '#ffcf6b' : '#ff6b5a';
      if (it.kind === 'L') ctx.fillRect(it.x + 5, it.y + 6, 6, 9);
      else ctx.fillRect(it.x + 6, it.y + 4, 4, 11);
    }
    // Sangre: manchas de muertes anteriores en este nivel y gotas en vuelo
    for (const st of stains) {
      ctx.fillStyle = '#6e0f14';
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#b3141c';
    for (const d of drops) ctx.fillRect(d.x - d.r / 2, d.y - d.r / 2, d.r, d.r);

    if (!dying) {
      ctx.fillStyle = '#e8e4f4';
      ctx.fillRect(Math.round(player.x), Math.round(player.y), player.w, player.h);
      ctx.fillStyle = '#14121c';
      const eye = player.vx < -0.1 ? 2 : player.vx > 0.1 ? 6 : 4;
      ctx.fillRect(Math.round(player.x) + eye, Math.round(player.y) + 4, 2, 2);
      if (carrying) {
        ctx.fillStyle = '#ffcf6b';
        ctx.fillRect(Math.round(player.x) + player.w, Math.round(player.y) + 5, 4, 6);
      }
    }

    // Máscara de oscuridad
    const l = light.getContext('2d')!;
    l.globalCompositeOperation = 'source-over';
    l.fillStyle = 'rgba(0,0,0,0.97)';
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
    ctx.drawImage(light, 0, 0);

    // Señales que se ven a través de la oscuridad: aviso de pinchos e interruptores
    for (const s of spikes)
      if (spikeState(s) === 'warn' && t % 8 < 5) {
        ctx.fillStyle = 'rgba(255,90,80,0.8)';
        for (let k = 0; k < s.w * 2; k++) ctx.fillRect(s.x * TILE + k * 8 + 3, s.y * TILE + TILE - 3, 2, 2);
      }
    for (const sw of switches) {
      ctx.fillStyle = sw.on ? 'rgba(120,230,140,0.9)' : 'rgba(230,110,90,0.7)';
      ctx.fillRect(sw.tx * TILE + (sw.w * TILE) / 2 - 1, sw.ty * TILE + (sw.kind === 'plate' ? 10 : 2), 2, 2);
    }
  }

  onMount(() => {
    light = document.createElement('canvas');
    light.width = W;
    light.height = H;
    load(Math.max(0, Math.min(levels.length - 1, start)), true);

    const down = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) e.preventDefault();
      if (!keys.has(k)) {
        if (k === ' ' || k === 'ArrowUp' || k === 'w') buffer = BUFFER;
        if (k === 'e') interact();
        if (k === 'q' && flares > 0 && flareTime === 0) {
          flares--;
          flareTime = 360;
        }
        if (k === 'r' && !dying) load(levelIdx);
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
        get: () => ({
          player: { ...player },
          boxes: boxes.map((b) => ({ ...b })),
          plats: plats.map((p) => ({ x: p.x, y: p.y, s: p.s })),
          switches: switches.map((s) => s.on),
          screen: levelIdx,
          deaths,
          carrying,
          fuel,
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
    {#if hint}
      <p class="hint" role="status">{hint}</p>
    {/if}
  </div>
  <p class="status" aria-live="polite">
    Nivel {levelIdx + 1}/{levels.length} · {levels[levelIdx].name} · Bengalas: {flares}{flareTime > 0 ? ' (ardiendo)' : ''} ·
    {carrying ? `Farol ${Math.ceil(fuel / 60)} s` : 'Sin farol'} · Caídas: {deaths}
  </p>
  {#if done}
    <p class="win">La oscuridad continúa… (de momento no hay más niveles)</p>
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
  .hint {
    position: absolute;
    left: 50%;
    top: 1rem;
    transform: translateX(-50%);
    width: min(90%, 36rem);
    margin: 0;
    padding: 0.6rem 0.9rem;
    border: 1px solid #6fd6e8;
    border-radius: 4px;
    background: rgba(10, 20, 28, 0.88);
    color: #d6f6fb;
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
    color: #ffcf6b;
  }
</style>
