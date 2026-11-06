<script lang="ts">
  import { onMount } from 'svelte';
  import { MEMORY, PADS6, SAVE_GOAL, START6, BYTES, corruptAt, type FieldId } from './maps';
  import { drawText, spriteG } from './art';
  import { backstage } from './state.svelte';
  import { TILE } from '$lib/pixel/art';
  import { sfx } from '$lib/pixel/audio';
  import Console from '$lib/pixel/Console.svelte';
  import { DELTA, DIR_ES, Talk, type Dir } from '$lib/pixel/talk.svelte';

  // Pantalla 6 · Memoria de guardado: reconstruir la partida antes de que la corrupción se lo coma todo
  const W = 20;
  const H = 18;
  const talk = new Talk();
  const say = (lines: string[], after?: () => void) => talk.say(lines, after);
  const l = $derived(backstage.s.l6);
  const saved = $derived(backstage.isDone('guardar'));
  const FIELDS: FieldId[] = ['jugador', 'mundo', 'hora'];
  /** Casillas que se marcan en rosa justo antes de corromperse */
  const CORRUPT_WARN = 2;
  let lastMove = 0;
  let calm = false;
  onMount(() => (calm = matchMedia('(prefers-reduced-motion: reduce)').matches));

  const at = (x: number, y: number) => MEMORY[y]?.[x] ?? '#';
  const solid = (x: number, y: number) => '#M'.includes(at(x, y));
  const corrupted = (x: number, y: number) => !saved && l.turns >= corruptAt(x, y);
  const allRight = () => FIELDS.every((f) => l.sel[f] === SAVE_GOAL[f]);

  /** «datos» solo cuenta mientras los tres datos estén bien (las pistas dependen de ello) */
  function syncData() {
    if (allRight()) backstage.complete('datos');
    else backstage.s.done = backstage.s.done.filter((d) => d !== 'datos');
  }

  function restart(lines: string[]) {
    Object.assign(backstage.s.l6, { ...START6, dir: 'up', turns: 0, sel: { jugador: '', mundo: '', hora: '' } });
    syncData();
    backstage.save();
    sfx('crack');
    say([...lines, 'La memoria se reinicia y la corrupción vuelve a su rincón. (R también reinicia.)']);
  }

  function move(dir: Dir) {
    if (talk.open || saved) return;
    const now = performance.now();
    if (now - lastMove < 110) return;
    lastMove = now;
    backstage.s.l6.dir = dir;
    const [dx, dy] = DELTA[dir];
    let nx = l.x + dx;
    let ny = l.y + dy;
    if (solid(nx, ny)) {
      nx = l.x;
      ny = l.y;
      sfx('bump');
    } else sfx('step');

    const turns = l.turns + 1;
    if (turns >= corruptAt(nx, ny)) return restart(['La corrupción te alcanza: tus píxeles se convierten en ruido.']);
    Object.assign(backstage.s.l6, { x: nx, y: ny, turns });

    const pad = PADS6[at(nx, ny)];
    if (pad) {
      backstage.s.l6.sel[pad.field] = pad.value;
      sfx('rune');
      syncData();
    }
    if (at(nx, ny) === 'S') saveGame();
    backstage.save();
  }

  function saveGame() {
    if (!allRight()) {
      sfx('no');
      return say(['GUARDAR… ERROR: hay datos vacíos o incorrectos. La partida no se puede guardar así.']);
    }
    backstage.complete('datos');
    sfx('ok');
    say(
      [
        'GUARDANDO… NO APAGUES LA CONSOLA.',
        'JUGADOR: LEO · MUNDO: 4 · HORA: 3:08 … PARTIDA GUARDADA.',
        'La corrupción se detiene. Los colores se ordenan. Y la pantalla, por fin, se apaga.',
      ],
      () => backstage.complete('guardar')
    );
  }

  function reset() {
    if (saved) return;
    Object.assign(backstage.s.l6, { ...START6, dir: 'up', turns: 0, sel: { jugador: '', mundo: '', hora: '' } });
    syncData();
    backstage.save();
    sfx('door');
    say(['REINICIO DE MEMORIA: vuelves al principio y la corrupción, a su rincón.']);
  }

  function interact() {
    if (saved) return;
    const [dx, dy] = DELTA[l.dir];
    const tx = l.x + dx;
    const ty = l.y + dy;
    const byte = BYTES[`${tx},${ty}`] ?? BYTES[`${l.x},${l.y}`];
    if (byte) return say(byte);
    if (at(tx, ty) === 'M')
      return say([
        'La ranura 3: la partida de Leo, corrupta. Faltan JUGADOR, MUNDO y HORA.',
        'Pisa las plataformas para elegir cada dato y luego pisa GUARDAR. Leer no gasta tiempo; caminar, sí.',
      ]);
    const pad = PADS6[at(l.x, l.y)];
    if (pad) return say([`Has elegido ${pad.field.toUpperCase()}: ${pad.value}.`]);
  }

  // Dibujo
  let drawX = backstage.s.l6.x * TILE;
  let drawY = backstage.s.l6.y * TILE;
  const PALETTE = ['#0000aa', '#ff4fa0', '#3ee0d0', '#00ff66', '#e8d5b0', '#ffd23f', '#c792ea'];

  function render(g: CanvasRenderingContext2D, t: number) {
    if (Math.abs(l.x * TILE - drawX) + Math.abs(l.y * TILE - drawY) > 3 * TILE) {
      drawX = l.x * TILE;
      drawY = l.y * TILE;
    }
    const f = Math.floor(t / 120);
    g.fillStyle = '#0b0718';
    g.fillRect(0, 0, 160, 144);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const ch = at(x, y);
        const px = x * TILE;
        const py = y * TILE;
        if (ch === '#') {
          // Muros hechos de trozos de las pantallas anteriores
          g.fillStyle = PALETTE[(x * 3 + y * 5) % PALETTE.length];
          g.fillRect(px, py, TILE, TILE);
          g.fillStyle = '#05030c';
          g.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
        } else if (ch !== 'M') {
          g.fillStyle = (x + y) % 2 ? '#0b0718' : '#120c26';
          g.fillRect(px, py, TILE, TILE);
          if (PADS6[ch]) {
            const p = PADS6[ch];
            const chosen = l.sel[p.field] === p.value;
            g.fillStyle = chosen ? '#ffd23f' : '#3ee0d0';
            g.fillRect(px + 1, py + 1, 6, 6);
            g.fillStyle = '#0b0718';
            g.fillRect(px + 2, py + 2, 4, 4);
            // Las horas solo enseñan los minutos («3:» va en el título)
            const label = p.field === 'hora' ? p.value.slice(2) : p.value;
            const w = label.length * 4 - 1;
            drawText(g, label, px + 4 - Math.floor(w / 2), py - 6, chosen ? '#ffd23f' : '#8a8f9c');
          } else if (ch === '?') {
            drawText(g, '?', px + 2, py + 1, Math.floor(t / 300) % 2 ? '#c792ea' : '#ff4fa0');
          } else if (ch === 'S') {
            g.fillStyle = '#00ff66';
            g.fillRect(px, py, TILE, TILE);
            g.fillStyle = '#05030c';
            g.fillRect(px + 1, py + 1, 6, 6);
            drawText(g, 'S', px + 2, py + 2, '#00ff66');
          }
        }
        // La corrupción: ruido de colores que avanza
        if (corrupted(x, y) && ch !== 'M') {
          g.fillStyle = PALETTE[(x * 5 + y * 3 + (x * y) % 4 + (calm ? 0 : f)) % PALETTE.length];
          g.fillRect(px, py, TILE, TILE);
          g.fillStyle = '#000000';
          g.fillRect(px + ((x + f) % 4) * 2, py + ((y + f) % 4) * 2, 2, 2);
        } else if (!saved && l.turns + CORRUPT_WARN >= corruptAt(x, y) && ch !== 'M' && ch !== '#') {
          g.fillStyle = 'rgba(255, 79, 160, 0.3)';
          g.fillRect(px, py, TILE, TILE);
        }
      }
    }

    // Monitor con la ranura 3
    g.fillStyle = '#05030c';
    g.fillRect(16, 16, 128, 24);
    g.strokeStyle = saved ? '#00ff66' : '#ff4fa0';
    g.strokeRect(16.5, 16.5, 127, 23);
    drawText(g, saved ? 'RANURA 3 - GUARDADA' : 'RANURA 3 - CORRUPTA', 20, 19, saved ? '#00ff66' : '#ff4fa0');
    drawText(g, `JUGADOR: ${l.sel.jugador || '???'}  MUNDO: ${l.sel.mundo || '?'}`, 20, 26, '#ffffff');
    drawText(g, `HORA: ${l.sel.hora || '?:??'}`, 20, 33, '#ffffff');
    drawText(g, 'GUARDAR', 106, 98, '#00ff66');
    drawText(g, 'HORA 3:', 24, 89, '#8a8f9c');

    drawX += (l.x * TILE - drawX) * 0.4;
    drawY += (l.y * TILE - drawY) * 0.4;
    const leo = { up: 'leoUp', down: 'leoDown', left: 'leoLeft', right: 'leoRight' }[l.dir] as 'leoUp';
    g.drawImage(spriteG(leo), Math.round(drawX), Math.round(drawY));

    if (!saved) drawText(g, 'R: REINICIAR', 108, 138, '#3ee0d0');
    // Desgarros de pantalla
    if (!calm && !saved && f % 13 === 0) {
      const band = (Math.floor(t / 1560) * 43) % 130;
      g.drawImage(g.canvas, 0, band, 160, 8, (f % 2 ? 5 : -5), band, 160, 8);
    }
  }

  const facing = $derived.by(() => {
    const [dx, dy] = DELTA[l.dir];
    return at(l.x + dx, l.y + dy);
  });
</script>

<Console
  {talk}
  {render}
  theme="b6"
  onmove={move}
  oninteract={interact}
  onreset={reset}
  resetLabel={saved ? '' : 'Reiniciar la memoria'}
  label="Memoria de guardado. Jugador {l.sel.jugador || 'vacío'}, mundo {l.sel.mundo || 'vacío'}, hora {l.sel.hora || 'vacía'}. Leo está en la casilla {l.x}, {l.y}, mirando hacia {DIR_ES[l.dir]}. Pasos dados: {l.turns}."
  attrs={{
    screen: 'memoria',
    x: l.x,
    y: l.y,
    dir: l.dir,
    facing,
    turns: l.turns,
    sel: `${l.sel.jugador}|${l.sel.mundo}|${l.sel.hora}`,
  }}
/>
