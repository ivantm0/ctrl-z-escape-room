<script lang="ts">
  import { onMount } from 'svelte';
  import { MAPS4, TWIN_START, SWITCHES, ERROR_CODE, PORTAL4, flipSwitch, bitsValue, type Screen4 } from './maps4';
  import { TILE } from './art';
  import { drawText, sprite4, tile4 } from './art4';
  import { pixel } from './state.svelte';
  import { sfx } from './audio';
  import Console from './Console.svelte';
  import { DELTA, DIR_ES, Talk, type Dir } from './talk.svelte';

  // Mundo 4 «Glitch»: un reflejo que va al revés, paredes que mienten y una memoria rota
  const W = 20;
  const H = 18;
  const NAMES: Record<Screen4, string> = {
    vestibulo: 'Vestíbulo corrupto',
    gemelo: 'Sala del gemelo',
    noclip: 'Sala sin colisiones',
    memoria: 'Memoria corrupta',
  };
  const CODE = ['datGemelo', 'datNoclip', 'datMemoria'] as const;

  const talk = new Talk();
  const say = (lines: string[], after?: () => void) => talk.say(lines, after);
  const w = $derived(pixel.s.w4);
  let lastMove = 0;
  let calm = false;

  onMount(() => {
    calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const value = $derived(bitsValue(w.bits));
  const hex = (n: number) => '0x' + n.toString(16).toUpperCase().padStart(2, '0');

  const at = (x: number, y: number) => {
    if (w.screen === 'vestibulo' && w.fixed && x === PORTAL4[0] && y === PORTAL4[1]) return 'q';
    if (w.screen === 'noclip' && pixel.isDone('noclip') && MAPS4.noclip[y]?.[x] === 'D') return '.';
    return MAPS4[w.screen][y]?.[x] ?? '#';
  };

  function solid(x: number, y: number) {
    const ch = at(x, y);
    switch (w.screen) {
      case 'vestibulo':
        return '#KEX'.includes(ch);
      case 'gemelo':
        return ch === '#';
      case 'noclip':
        return '#iT'.includes(ch);
      case 'memoria':
        return '#sS'.includes(ch);
    }
  }

  function go(screen: Screen4, x: number, y: number, dir: Dir) {
    sfx('door');
    Object.assign(pixel.s.w4, { screen, x, y, dir, debug: false });
    if (screen === 'gemelo') pixel.s.w4.clone = [...TWIN_START.clone];
    pixel.save();
  }

  const EXITS: Record<Screen4, Record<string, () => void>> = {
    vestibulo: {
      G: () => go('gemelo', ...TWIN_START.leo, 'up'),
      N: () => go('noclip', 10, 15, 'up'),
      B: () => go('memoria', 10, 10, 'up'),
    },
    gemelo: { O: () => go('vestibulo', 1, 8, 'right') },
    noclip: { O: () => go('vestibulo', 18, 8, 'left') },
    memoria: { O: () => go('vestibulo', 9, 2, 'down') },
  };

  function move(dir: Dir) {
    if (talk.open || pixel.isDone('salida')) return;
    const now = performance.now();
    if (now - lastMove < 110) return;
    lastMove = now;
    pixel.s.w4.dir = dir;
    if (w.screen === 'noclip' && w.debug) {
      sfx('no');
      return say(['MODO DEPURACIÓN: el juego está congelado. Apaga el terminal para moverte.']);
    }
    const [dx, dy] = DELTA[dir];
    const nx = w.x + dx;
    const ny = w.y + dy;
    const ch = at(nx, ny);

    const exit = EXITS[w.screen][ch];
    if (exit) return exit();
    if (ch === 'q') {
      pixel.s.w4.x = nx;
      pixel.s.w4.y = ny;
      sfx('item');
      pixel.complete('salida');
      return;
    }

    // El clon se mueve a la vez, en espejo; cada uno choca con sus propios muros
    let cloneMoved = false;
    if (w.screen === 'gemelo' && !pixel.isDone('gemelo')) {
      const [cx, cy] = w.clone;
      const tx = cx - dx;
      const ty = cy + dy;
      if (MAPS4.gemelo[ty]?.[tx] !== '#' && MAPS4.gemelo[ty]?.[tx] !== undefined) {
        pixel.s.w4.clone = [tx, ty];
        cloneMoved = true;
      }
    }

    if (solid(nx, ny)) {
      sfx(cloneMoved ? 'step' : 'bump');
      if (cloneMoved) checkTwin();
      return pixel.save();
    }
    pixel.s.w4.x = nx;
    pixel.s.w4.y = ny;
    sfx('step');
    if (w.screen === 'gemelo') checkTwin();
    if (w.screen === 'noclip' && ch === 'D') grabData();
    pixel.save();
  }

  function checkTwin() {
    if (pixel.isDone('gemelo')) return;
    const onP = MAPS4.gemelo[w.y][w.x] === 'P';
    const [cx, cy] = w.clone;
    if (!onP || MAPS4.gemelo[cy][cx] !== 'Q') return;
    pixel.give('datGemelo');
    pixel.complete('gemelo');
    setTimeout(() => {
      sfx('item');
      say(['Tú y tu reflejo pisáis las dos placas a la vez.', 'El clon te guiña un ojo… y se deshace en píxeles.', '¡Has conseguido el FRAGMENTO DE CÓDIGO A!']);
    }, 150);
  }

  function grabData() {
    pixel.give('datNoclip');
    pixel.complete('noclip');
    setTimeout(() => {
      sfx('item');
      say(['Atraviesas la última pared falsa y encuentras un bloque de datos flotando.', '¡Has conseguido el FRAGMENTO DE CÓDIGO B!']);
    }, 150);
  }

  /** R / ↺: según la sala, vuelve a la entrada o apaga los interruptores */
  function reset() {
    if (w.screen === 'gemelo' && !pixel.isDone('gemelo')) {
      Object.assign(pixel.s.w4, { x: TWIN_START.leo[0], y: TWIN_START.leo[1], dir: 'up', clone: [...TWIN_START.clone] });
      sfx('door');
      say(['Tú y tu reflejo volvéis a la entrada.']);
    } else if (w.screen === 'noclip' && !pixel.isDone('noclip')) {
      Object.assign(pixel.s.w4, { x: 10, y: 15, dir: 'up', debug: false });
      sfx('door');
      say(['El juego te devuelve a la entrada de la sala.']);
    } else if (w.screen === 'memoria' && !pixel.isDone('memoria')) {
      pixel.s.w4.bits = [false, false, false, false];
      sfx('door');
      say(['Los cuatro interruptores se apagan con un chasquido.']);
    }
    pixel.save();
  }

  function interact() {
    if (pixel.isDone('salida')) return;
    const [dx, dy] = DELTA[w.dir];
    const tx = w.x + dx;
    const ty = w.y + dy;
    const ch = at(tx, ty);

    if (w.screen === 'vestibulo') {
      if (ch === 'E') return say(['La pantalla parpadea en rojo:', '«FATAL ERROR 0x0D — MEMORIA CORRUPTA»']);
      if (ch === 'X') return say(errorLines());
      if (ch === 'K') return useCore();
    }
    if (w.screen === 'noclip' && ch === 'T') return toggleDebug();
    if (w.screen === 'memoria') {
      const si = SWITCHES.findIndex(([sx, sy]) => sx === tx && sy === ty);
      if (si >= 0) return flip(si);
      if (ch === 'S') return say([`La pantalla muestra: ${hex(value)}.`]);
    }
    if (w.screen === 'gemelo' && ch === '#' && tx >= 9 && tx <= 10) return say(['Al otro lado del cristal, tu reflejo te imita… casi siempre.']);
  }

  function errorLines() {
    if (w.fixed) return ['G-R-A-C-I-A-S. El núcleo vuelve a funcionar.', 'La salida está bajo el núcleo. Vuelve a casa, JUGADOR 1.'];
    return [
      'H0LA, JUG4D0R 1. S0Y EL ERR0R. N0 S0Y MAL0: S0Y L0 QUE QUEDA CUAND0 UN JUEG0 SE R0MPE.',
      'EL NÚCLE0 PERDIÓ TRES FRAGMENT0S DE CÓDIG0. SIN ELL0S N0 HAY SALIDA.',
      'UN0 L0 TIENE TU REFLEJ0 (0ESTE). OTR0 ESTÁ TRAS PAREDES QUE MIENTEN (ESTE). EL ÚLTIM0, EN LA MEMORIA (N0RTE).',
      'Y SI TE PIERDES… APRIETA R. A VECES REINICIAR ES LA ÚNICA F0RMA DE ARREGLAR ALG0.',
    ];
  }

  function toggleDebug() {
    pixel.s.w4.debug = !w.debug;
    pixel.save();
    sfx('rune');
    say([
      w.debug
        ? 'MODO DEPURACIÓN ACTIVADO. Verde: muros que se pueden atravesar. Rojo: muros invisibles. El juego se congela mientras miras.'
        : 'Modo depuración desactivado. Ya puedes moverte… si recuerdas el camino.',
    ]);
  }

  function flip(i: number) {
    if (pixel.isDone('memoria')) return say(['Los interruptores están bloqueados: la memoria ya está reparada.']);
    pixel.s.w4.bits = flipSwitch(w.bits, i);
    sfx('rune');
    if (bitsValue(pixel.s.w4.bits) === ERROR_CODE) {
      pixel.give('datMemoria');
      pixel.complete('memoria');
      sfx('item');
      say(['La pantalla muestra 0x0D y deja de parpadear.', 'De la memoria sale un fragmento de ceros y unos.', '¡Has conseguido el FRAGMENTO DE CÓDIGO C!']);
    }
    pixel.save();
  }

  function useCore() {
    if (w.fixed) return say(['El núcleo zumba, verde y estable.']);
    const got = CODE.filter((c) => pixel.s.items.includes(c));
    if (got.length < 3) return say([`El núcleo tiene tres ranuras vacías. Tienes ${got.length} de 3 fragmentos de código.`]);
    got.forEach((c) => pixel.use(c));
    pixel.s.w4.fixed = true;
    pixel.complete('nucleo');
    pixel.save();
    sfx('ok');
    say([
      'Encajas los tres fragmentos. COMPILANDO… 33%… 66%… 100%.',
      'Los colores vuelven a su sitio. El ruido se apaga.',
      'Bajo el núcleo se abre un portal. Al otro lado se oye… ¿el despertador de Leo?',
    ]);
  }

  // Dibujo
  let drawX = pixel.s.w4.x * TILE;
  let drawY = pixel.s.w4.y * TILE;
  let lastScreen = pixel.s.w4.screen;

  function tileFor(ch: string, t: number) {
    const blink = Math.floor(t / 400) % 2 === 0;
    if (ch === '#' || ch === 'f') return tile4('wall');
    if ('GNBO'.includes(ch)) return tile4(ch === 'O' ? 'exit' : 'door');
    if (ch === 'K') return tile4(w.fixed ? 'coreOn' : 'core');
    if (ch === 'E') return tile4('errScreen');
    if (ch === 'P') return tile4('plateP');
    if (ch === 'Q') return tile4('plateQ');
    if (ch === 'D') return tile4('data');
    if (ch === 'T') return tile4('terminal');
    if (ch === 'S') return tile4('screen');
    if (ch === 'q') return tile4(blink ? 'portal' : 'portalB');
    return null;
  }

  function render(g: CanvasRenderingContext2D, t: number) {
    if (w.screen !== lastScreen) {
      drawX = w.x * TILE;
      drawY = w.y * TILE;
      lastScreen = w.screen;
    }
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        g.drawImage(tile4('floor'), x * TILE, y * TILE);
        const img = tileFor(at(x, y), t);
        if (img) g.drawImage(img, x * TILE, y * TILE);
      }
    }

    if (w.screen === 'memoria') {
      SWITCHES.forEach(([x, y], i) => g.drawImage(tile4(w.bits[i] ? 'switchOn' : 'switchOff'), x * TILE, y * TILE));
      drawText(g, hex(value), 72, 26, pixel.isDone('memoria') ? '#39ff14' : '#ff2a6d');
    }
    if (w.screen === 'noclip' && w.debug) {
      MAPS4.noclip.forEach((row, y) =>
        [...row].forEach((c, x) => {
          if (c === 'i') g.drawImage(tile4('debugSolid'), x * TILE, y * TILE);
          if (c === 'f') g.drawImage(tile4('debugFree'), x * TILE, y * TILE);
        })
      );
    }
    if (w.screen === 'vestibulo') {
      MAPS4.vestibulo.forEach((row, y) => [...row].forEach((c, x) => c === 'X' && g.drawImage(sprite4('error'), x * TILE + (w.fixed || calm ? 0 : Math.round(Math.sin(t / 90 + x)) ), y * TILE)));
      // Ruido: casillas que se corrompen un instante (desaparece al reparar el núcleo)
      if (!w.fixed) {
        const f = Math.floor(t / 180);
        for (let k = 0; k < 6; k++) {
          const nx = (f * 7 + k * 13) % W;
          const ny = (f * 11 + k * 5) % H;
          g.drawImage(tile4(k % 2 ? 'noiseA' : 'noiseB'), nx * TILE, ny * TILE);
        }
      }
    }
    if (w.screen === 'gemelo' && !pixel.isDone('gemelo')) {
      g.globalAlpha = 0.85;
      g.drawImage(sprite4('cloneDown'), w.clone[0] * TILE, w.clone[1] * TILE);
      g.globalAlpha = 1;
    }

    drawX += (w.x * TILE - drawX) * 0.4;
    drawY += (w.y * TILE - drawY) * 0.4;
    const leo = { up: 'leoUp', down: 'leoDown', left: 'leoLeft', right: 'leoRight' }[w.dir] as 'leoUp';
    g.drawImage(sprite4(leo), Math.round(drawX), Math.round(drawY));

    // Glitch de pantalla: una franja que se desplaza de vez en cuando
    if (!calm && !w.fixed && Math.floor(t / 130) % 17 === 0) {
      const band = (Math.floor(t / 2210) * 37) % 128;
      g.drawImage(g.canvas, 0, band, 160, 10, (Math.floor(t / 2210) % 2 ? 4 : -4), band, 160, 10);
    }
  }

  const facing = $derived.by(() => {
    const [dx, dy] = DELTA[w.dir];
    return at(w.x + dx, w.y + dy);
  });

  const resetLabel = $derived(
    w.screen === 'gemelo' && !pixel.isDone('gemelo')
      ? 'Volver a la entrada con el reflejo'
      : w.screen === 'noclip' && !pixel.isDone('noclip')
        ? 'Volver a la entrada'
        : w.screen === 'memoria' && !pixel.isDone('memoria')
          ? 'Apagar los interruptores'
          : ''
  );
</script>

<Console
  {talk}
  {render}
  theme="w4"
  onmove={move}
  oninteract={interact}
  onreset={reset}
  {resetLabel}
  label="{NAMES[w.screen]}{w.debug ? ' (modo depuración)' : ''}. Leo está en la casilla {w.x}, {w.y}, mirando hacia {DIR_ES[w.dir]}."
  attrs={{
    screen: w.screen,
    x: w.x,
    y: w.y,
    dir: w.dir,
    facing,
    clone: w.clone.join(','),
    bits: w.bits.map((b) => (b ? 1 : 0)).join(''),
    debug: w.debug ? 'si' : 'no',
    fixed: w.fixed ? 'si' : 'no',
  }}
/>
