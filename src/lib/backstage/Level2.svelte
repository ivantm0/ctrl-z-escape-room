<script lang="ts">
  import { onMount } from 'svelte';
  import { MENU, LETTERS, LETTER_IDS, LOGO, START2, CURSOR_START, underLogo, cursorStep, type LetterId } from './maps';
  import { drawText, spriteM, tileM } from './art';
  import { backstage } from './state.svelte';
  import { TILE } from '$lib/pixel/art';
  import { sfx } from '$lib/pixel/audio';
  import Console from '$lib/pixel/Console.svelte';
  import { DELTA, DIR_ES, Talk, type Dir } from '$lib/pixel/talk.svelte';

  // Pantalla 2 · Menú principal roto: al logo le faltan letras y el cursor del ratón te persigue
  const W = 20;
  const H = 18;
  const talk = new Talk();
  const say = (lines: string[]) => talk.say(lines);
  const l = $derived(backstage.s.l2);
  const fixed = $derived(backstage.isDone('letras'));
  let lastMove = 0;
  let calm = false;
  onMount(() => (calm = matchMedia('(prefers-reduced-motion: reduce)').matches));

  const at = (x: number, y: number) => MENU[y]?.[x] ?? '#';
  const free = (x: number, y: number) => at(x, y) === '.';
  const same = (a: [number, number], b: [number, number]) => a[0] === b[0] && a[1] === b[1];
  const onFloor = (id: LetterId) => !l.carry.includes(id) && !l.bank.includes(id);

  /** Vuelta al principio: Leo, el cursor y las letras que llevaba (las colocadas se quedan) */
  function restart() {
    Object.assign(backstage.s.l2, { ...START2, dir: 'up', cursor: [...CURSOR_START], carry: [] });
    backstage.save();
  }

  function caught() {
    restart();
    sfx('no');
    say(['¡CLIC! El cursor te selecciona… y el menú te devuelve al principio.', 'Las letras que llevabas vuelven a caerse donde estaban.']);
  }

  function move(dir: Dir) {
    if (talk.open || backstage.isDone('opciones')) return;
    const now = performance.now();
    if (now - lastMove < 110) return;
    lastMove = now;
    backstage.s.l2.dir = dir;
    const [dx, dy] = DELTA[dir];
    let n: [number, number] = [l.x + dx, l.y + dy];
    if (!free(...n)) {
      n = [l.x, l.y];
      sfx('bump');
    } else sfx('step');

    if (fixed) {
      Object.assign(backstage.s.l2, { x: n[0], y: n[1] });
      return backstage.save();
    }

    // Leo se mueve (o choca) y el cursor responde con un paso
    if (same(n, l.cursor)) return caught();
    Object.assign(backstage.s.l2, { x: n[0], y: n[1] });
    for (const id of LETTER_IDS) {
      if (onFloor(id) && same(LETTERS[id].pos, n)) {
        backstage.s.l2.carry.push(id);
        sfx('item');
      }
    }
    if (underLogo(...n) && l.carry.length) {
      backstage.s.l2.bank.push(...l.carry);
      backstage.s.l2.carry = [];
      sfx('rune');
      if (l.bank.length === LETTER_IDS.length) return fixLogo();
    }
    backstage.s.l2.cursor = cursorStep(l.cursor, n, free);
    if (same(l.cursor, n)) return caught();
    backstage.save();
  }

  function fixLogo() {
    backstage.complete('letras');
    sfx('ok');
    say([
      'La última letra encaja: FUERA DE JUEGO.',
      'El cursor se queda quieto, parpadea… y se pone a hacer como que no ha pasado nada.',
      'El botón OPCIONES se enciende.',
    ]);
  }

  function reset() {
    if (fixed) return;
    restart();
    sfx('door');
    say(['Vuelves al principio. El cursor también. Las letras que llevabas, a su sitio.']);
  }

  function interact() {
    if (backstage.isDone('opciones')) return;
    const [dx, dy] = DELTA[l.dir];
    const ch = at(l.x + dx, l.y + dy);
    if (ch === 'J') return say(['JUGAR está tachado con rotulador rojo.', 'No hay partida que jugar: para eso habrá que llegar a la memoria de guardado.']);
    if (ch === 'C') return say(['CRÉDITOS: «Disponible al final del juego». Qué original.']);
    if (ch === 'S') {
      restart();
      sfx('door');
      return say(['¿SALIR? Pulsas el botón… y el menú te devuelve al principio. No hay salida tan fácil.']);
    }
    if (ch === 'O') {
      if (!fixed) return say(['OPCIONES está gris. Sin el logo completo, el menú no responde a nada.']);
      sfx('door');
      backstage.complete('opciones');
      return;
    }
    if (ch === 'L') {
      const missing = LETTER_IDS.filter((id) => !l.bank.includes(id));
      return say(
        missing.length
          ? [`El logo del juego: «${LOGO}». Le faltan ${missing.length === 1 ? 'una letra' : `${missing.length} letras`}.`, 'Si pasas justo por debajo con las letras, vuelan a su sitio.']
          : ['FUERA DE JUEGO. El logo vuelve a estar entero.']
      );
    }
    if (ch === '#') return say(['Un trozo de interfaz roto. Los píxeles del borde se descuelgan.']);
  }

  // Dibujo
  let drawX = backstage.s.l2.x * TILE;
  let drawY = backstage.s.l2.y * TILE;
  let curX = backstage.s.l2.cursor[0] * TILE;
  let curY = backstage.s.l2.cursor[1] * TILE;

  const BUTTONS: { ch: string; label: string; row: number }[] = [
    { ch: 'J', label: 'JUGAR', row: 6 },
    { ch: 'O', label: 'OPCIONES', row: 9 },
    { ch: 'C', label: 'CREDITOS', row: 12 },
    { ch: 'S', label: 'SALIR', row: 15 },
  ];

  function render(g: CanvasRenderingContext2D, t: number) {
    const blink = Math.floor(t / 400) % 2 === 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        g.drawImage(tileM('floor'), x * TILE, y * TILE);
        if (at(x, y) === '#') g.drawImage(tileM((x * 7 + y * 3) % 5 === 0 ? 'wallCrack' : 'wall'), x * TILE, y * TILE);
      }
    }

    // Logo con huecos que parpadean
    g.fillStyle = '#120a24';
    g.fillRect(24, 8, 112, 24);
    g.fillStyle = '#ff4fa0';
    g.fillRect(24, 30, 112, 2);
    [...LOGO].forEach((ch, i) => {
      const id = LETTER_IDS.find((k) => LETTERS[k].index === i);
      const x = 25 + i * 8;
      if (id && !l.bank.includes(id)) {
        if (blink || calm) {
          g.fillStyle = (i + Math.floor(t / 150)) % 2 ? '#ff4fa0' : '#3ee0d0';
          g.fillRect(x, 15, 6, 10);
        }
        return;
      }
      drawText(g, ch, x, 15, id ? '#6cff6c' : '#ffd23f', 2);
    });

    // Botones del menú
    for (const b of BUTTONS) {
      const y = b.row * TILE;
      const color = b.ch === 'J' ? '#7a7a9a' : b.ch === 'O' ? (fixed ? (blink ? '#3ee0d0' : '#6cff6c') : '#7a7a9a') : b.ch === 'C' ? '#b48cff' : '#ff4fa0';
      g.fillStyle = '#000000';
      g.fillRect(48, y, 64, 8);
      g.fillStyle = color;
      g.fillRect(49, y + 1, 62, 6);
      const w = b.label.length * 4 - 1;
      drawText(g, b.label, 48 + Math.floor((64 - w) / 2), y + 2, '#120a24');
      if (b.ch === 'J') {
        g.fillStyle = '#ff5555';
        g.fillRect(56, y + 4, 48, 1);
      }
    }

    // Letras caídas
    for (const id of LETTER_IDS) {
      if (!onFloor(id)) continue;
      const [x, y] = LETTERS[id].pos;
      g.drawImage(tileM('letter'), x * TILE, y * TILE);
      drawText(g, id, x * TILE + 3, y * TILE + 2, '#120a24');
    }

    // Barra de abajo: letras y recordatorio de R
    g.fillStyle = '#120a24';
    g.fillRect(0, 137, 160, 7);
    drawText(g, 'LETRAS', 4, 138, '#b48cff');
    LETTER_IDS.forEach((id, i) => {
      const c = l.bank.includes(id) ? '#6cff6c' : l.carry.includes(id) ? '#ffd23f' : '#4a4a6a';
      drawText(g, id, 32 + i * 6, 138, c);
    });
    if (!fixed) drawText(g, 'R: REINICIAR', 108, 138, '#3ee0d0');

    drawX += (l.x * TILE - drawX) * 0.4;
    drawY += (l.y * TILE - drawY) * 0.4;
    const leo = { up: 'leoUp', down: 'leoDown', left: 'leoLeft', right: 'leoRight' }[l.dir] as 'leoUp';
    g.drawImage(spriteM(leo), Math.round(drawX), Math.round(drawY));

    // El cursor: se pone rosa cuando está a un paso
    curX += (l.cursor[0] * TILE - curX) * 0.35;
    curY += (l.cursor[1] * TILE - curY) * 0.35;
    const near = Math.abs(l.cursor[0] - l.x) + Math.abs(l.cursor[1] - l.y) <= 2;
    g.drawImage(spriteM(!fixed && near && blink ? 'cursorClick' : 'cursor'), Math.round(curX), Math.round(curY));

    if (!calm && !fixed && Math.floor(t / 120) % 29 === 0) {
      const band = (Math.floor(t / 3480) * 53) % 128;
      g.drawImage(g.canvas, 0, band, 160, 5, -3, band, 160, 5);
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
  theme="b2"
  onmove={move}
  oninteract={interact}
  onreset={reset}
  resetLabel={fixed ? '' : 'Volver al principio'}
  label="Menú principal{fixed ? ' (logo reparado)' : ''}. Leo está en la casilla {l.x}, {l.y}, mirando hacia {DIR_ES[l.dir]}. El cursor está en {l.cursor[0]}, {l.cursor[1]}."
  attrs={{
    screen: 'menu',
    x: l.x,
    y: l.y,
    dir: l.dir,
    facing,
    cursor: l.cursor.join(','),
    carry: l.carry.join(''),
    bank: l.bank.join(''),
    fixed: fixed ? 'si' : 'no',
  }}
/>
