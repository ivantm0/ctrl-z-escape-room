<script lang="ts">
  import { MAPS2, BELLS, SONG, BOOK_GLITCHED, PORTAL, type Screen2 } from './maps2';
  import { TILE } from './art';
  import { bell, portal, sprite2, tile2 } from './art2';
  import { pixel } from './state.svelte';
  import { sfx } from './audio';
  import Console from './Console.svelte';
  import { DELTA, DIR_ES, Talk, type Dir } from './talk.svelte';

  // Mundo 2 «8 bits»: hielo que resbala, bloques de colores, campanas y el rey dormido
  const W = 20;
  const H = 18;
  const NAMES: Record<Screen2, string> = {
    patio: 'Patio del castillo',
    hielo: 'Sala de hielo',
    cristal: 'Sala de cristal',
    campanas: 'Torre de campanas',
    trono: 'Sala del trono',
  };

  const talk = new Talk();
  const say = (lines: string[], after?: () => void) => talk.say(lines, after);
  const w = $derived(pixel.s.w2);
  let lastMove = 0;
  let ringing = $state<number | null>(null);

  const at = (x: number, y: number) => {
    if (w.screen === 'trono' && w.awake && x === PORTAL[0] && y === PORTAL[1]) return 'q';
    return MAPS2[w.screen][y]?.[x] ?? '#';
  };

  function solid(x: number, y: number) {
    const ch = at(x, y);
    switch (w.screen) {
      case 'patio':
        return '#ToBG'.includes(ch);
      case 'hielo':
        return '#rX'.includes(ch);
      case 'cristal':
        if (ch === 'R') return w.red;
        if (ch === 'B') return !w.red;
        return '#sX'.includes(ch);
      case 'campanas':
        return '#1234b'.includes(ch);
      case 'trono':
        return '#KA'.includes(ch);
    }
  }

  function go(screen: Screen2, x: number, y: number, dir: Dir) {
    sfx('door');
    Object.assign(pixel.s.w2, { screen, x, y, dir });
    pixel.save();
  }

  const EXITS: Partial<Record<Screen2, Record<string, () => void>>> = {
    patio: {
      w: () => go('hielo', 18, 9, 'left'),
      e: () => go('cristal', 1, 9, 'right'),
      n: () => go('campanas', 10, 15, 'up'),
      P: () => go('trono', 10, 15, 'up'),
    },
    hielo: { e: () => go('patio', 1, 9, 'right') },
    cristal: { w: () => go('patio', 18, 9, 'left') },
    campanas: { O: () => go('patio', 3, 2, 'down') },
    trono: { O: () => go('patio', 8, 2, 'down') },
  };

  function move(dir: Dir) {
    if (talk.open || pixel.isDone('portal')) return;
    const now = performance.now();
    if (now - lastMove < 110) return;
    lastMove = now;
    pixel.s.w2.dir = dir;
    const [dx, dy] = DELTA[dir];
    let nx = w.x + dx;
    let ny = w.y + dy;
    const ch = at(nx, ny);

    const exit = EXITS[w.screen]?.[ch];
    if (exit) return exit();
    if (ch === 'q') {
      pixel.s.w2.x = nx;
      pixel.s.w2.y = ny;
      sfx('item');
      pixel.complete('portal');
      return;
    }
    if (solid(nx, ny)) return sfx('bump');

    // Sobre el hielo se resbala hasta chocar con algo
    if (w.screen === 'hielo') {
      while (at(nx, ny) === '~' && !solid(nx + dx, ny + dy) && !EXITS.hielo?.[at(nx + dx, ny + dy)]) {
        nx += dx;
        ny += dy;
      }
      if (at(nx, ny) === '~' || nx !== w.x + dx || ny !== w.y + dy) sfx('rune');
    }
    pixel.s.w2.x = nx;
    pixel.s.w2.y = ny;
    sfx('step');
    pixel.save();
  }

  /** R / ↺: vuelve a la entrada de la sala (hielo y cristal) */
  function reset() {
    if (w.screen === 'hielo') {
      go('hielo', 18, 9, 'left');
      say(['Sales del hielo y vuelves a la entrada de la sala.']);
    } else if (w.screen === 'cristal') {
      pixel.s.w2.red = true;
      go('cristal', 1, 9, 'right');
      say(['Los cristales vuelven a rojo y apareces en la entrada de la sala.']);
    }
  }

  function interact() {
    if (pixel.isDone('portal')) return;
    const [dx, dy] = DELTA[w.dir];
    const tx = w.x + dx;
    const ty = w.y + dy;
    const ch = at(tx, ty);

    if (w.screen === 'patio') {
      if (ch === 'G') return say(guardLines());
      if (ch === 'B')
        return say([
          'Un libro abierto sobre el atril: «La canción del rey».',
          `«${BOOK_GLITCHED}»`,
          '(Un glitch ha dado la vuelta a todas las letras de la página.)',
        ]);
      if (ch === 'o') return say(['Una fuente de 8 bits. El agua cae en bucle, siempre igual, siempre en el mismo píxel.']);
      if (ch === 'T') return say(['Un árbol con más colores de los que has visto en todo el mundo anterior.']);
    }

    if (w.screen === 'hielo' && ch === 'X') return takeFragment('fragHielo', 'hielo', 'FRAGMENTO HELADO');
    if (w.screen === 'cristal') {
      if (ch === 's') return toggleCrystal();
      if (ch === 'X') return takeFragment('fragCristal', 'cristal', 'FRAGMENTO DE CRISTAL');
    }

    if (w.screen === 'campanas') {
      const bi = '1234'.indexOf(ch);
      if (bi >= 0) return ring(bi);
      if (ch === 'b')
        return say(
          pixel.isDone('campanas')
            ? ['¡Qué bien suena la canción del rey! Ojalá él también la oyera.']
            : [
                '¡Saludos, viajero de otro cartucho! Soy el bardo de la torre.',
                'Solo la canción del rey hará que estas campanas suelten lo que guardan.',
                'Estaba escrita en el libro del patio… pero un glitch la ha puesto patas arriba. O mejor dicho: del revés.',
              ]
        );
    }

    if (w.screen === 'trono') {
      if (ch === 'A') return useAltar();
      if (ch === 'K') return wakeKing();
    }
  }

  function guardLines() {
    if (!pixel.isDone('corona'))
      return [
        '¡Alto! ¿Otro visitante de fuera del cartucho? Bienvenido a Bitópolis.',
        'Nuestro rey Pixelio duerme atrapado en un bucle desde hace 255 turnos.',
        'Solo despertará si recupera su corona, que se rompió en tres fragmentos.',
        'Uno está en la sala de hielo, al oeste. Otro, en la sala de cristal, al este. El último, en la torre de campanas.',
        'Si se resbala o se atasca en alguna sala, pulse R para volver a la entrada.',
      ];
    return ['¡La corona! Corre a la sala del trono, al norte.'];
  }

  function takeFragment(id: 'fragHielo' | 'fragCristal', step: 'hielo' | 'cristal', name: string) {
    if (pixel.s.items.includes(id)) return say(['El pedestal está vacío.']);
    pixel.give(id);
    pixel.complete(step);
    sfx('item');
    say([`Sobre el pedestal brilla un trozo de corona.`, `¡Has conseguido el ${name}!`]);
  }

  function toggleCrystal() {
    const willRaise = w.red ? 'B' : 'R';
    if (at(w.x, w.y) === willRaise) {
      sfx('no');
      return say(['Estás encima de un bloque que subiría. El cristal no reacciona.']);
    }
    pixel.s.w2.red = !w.red;
    pixel.save();
    sfx('rune');
  }

  function ring(i: number) {
    if (pixel.isDone('campanas')) return say([`La campana ${BELLS[i]} suena, tranquila.`]);
    ringing = i;
    setTimeout(() => (ringing = null), 300);
    sfx(['talk', 'rune', 'ok', 'item'][i] as 'talk');
    const song = [...w.song, i];
    if (SONG[song.length - 1] !== i) {
      pixel.s.w2.song = [];
      pixel.save();
      sfx('no');
      return say(['La melodía desafina y las campanas se quedan en silencio. Hay que empezar de nuevo.']);
    }
    pixel.s.w2.song = song;
    pixel.save();
    if (song.length === SONG.length) {
      pixel.give('fragCampana');
      pixel.complete('campanas');
      sfx('item');
      say(['La canción del rey resuena por toda la torre.', 'De la campana azul cae un trozo de corona.', '¡Has conseguido el FRAGMENTO SONORO!']);
    }
  }

  function useAltar() {
    if (pixel.isDone('corona')) return say(['El altar está vacío. La corona ya está entera.']);
    const frags = (['fragHielo', 'fragCristal', 'fragCampana'] as const).filter((f) => pixel.s.items.includes(f));
    if (frags.length < 3) return say([`Un altar con tres huecos con forma de trozo de corona. Tienes ${frags.length} de 3.`]);
    frags.forEach((f) => pixel.use(f));
    pixel.give('corona');
    pixel.complete('corona');
    sfx('item');
    say(['Colocas los tres fragmentos en el altar.', 'Un destello de 8 bits los funde en uno solo.', '¡Has conseguido la CORONA DE PIXELIO!']);
  }

  function wakeKing() {
    if (w.awake) return say(['Ve, viajero. El portal te llevará a la siguiente época del juego.']);
    if (!pixel.has('corona')) return say(['El rey Pixelio duerme sentado en su trono.', 'Murmura en sueños: «…continuar… sí… no… continuar…»']);
    pixel.use('corona');
    pixel.s.w2.awake = true;
    pixel.save();
    sfx('ok');
    say([
      'Colocas la corona sobre la cabeza del rey.',
      '«¡Por fin! ¡Se acabó el bucle!»',
      '«Gracias, viajero. Sé que no eres de este cartucho. Tu salida está más adelante, en épocas con más colores todavía.»',
      '«Toma el portal real. Te llevará a la siguiente era.»',
    ]);
  }

  // Dibujo
  let drawX = pixel.s.w2.x * TILE;
  let drawY = pixel.s.w2.y * TILE;
  let lastScreen = pixel.s.w2.screen;

  function tileFor(ch: string, blink: boolean) {
    const s = w.screen;
    if (s === 'patio') {
      const m: Record<string, string> = { '#': 'wall', ',': 'path', T: 'tree', F: 'flower', o: 'fountain', B: 'lectern', w: 'arch', e: 'arch', n: 'arch', P: 'door' };
      return m[ch] ? tile2(m[ch] as never) : null;
    }
    if (s === 'hielo') {
      if (ch === '#') return tile2('wall');
      if (ch === '~') return tile2('ice');
      if (ch === 'r') return tile2('rock');
      if (ch === 'e') return tile2('arch');
      if (ch === 'X') return tile2(pixel.s.items.includes('fragHielo') ? 'pedestalEmpty' : blink ? 'pedestal' : 'pedestalEmpty');
      return null;
    }
    if (s === 'cristal') {
      if (ch === '#') return tile2('wall');
      if (ch === 'R') return tile2(w.red ? 'redUp' : 'redDown');
      if (ch === 'B') return tile2(w.red ? 'blueDown' : 'blueUp');
      if (ch === 's') return tile2(w.red ? 'crystalRed' : 'crystalBlue');
      if (ch === 'w') return tile2('arch');
      if (ch === 'X') return tile2(pixel.s.items.includes('fragCristal') ? 'pedestalEmpty' : blink ? 'pedestal' : 'pedestalEmpty');
      return null;
    }
    if (s === 'campanas') {
      if (ch === '#') return tile2('wall');
      if (ch === 'O') return tile2('arch');
      const bi = '1234'.indexOf(ch);
      if (bi >= 0) return bell(bi, ringing === bi);
      return null;
    }
    if (ch === '#') return tile2('wall');
    if (ch === ',') return tile2('carpet');
    if (ch === 'O') return tile2('arch');
    if (ch === 'A') return tile2(pixel.isDone('corona') ? 'altarFull' : 'altar');
    if (ch === 'K') return tile2('throne');
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
    const base = w.screen === 'patio' ? tile2('grass') : tile2('floor');
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        g.drawImage(base, x * TILE, y * TILE);
        const img = tileFor(at(x, y), blink);
        if (img) g.drawImage(img, x * TILE, y * TILE);
      }
    }
    // Personajes
    const people: Record<string, HTMLCanvasElement> = { G: sprite2('guard'), b: sprite2('bard'), K: sprite2(w.awake ? 'kingAwake' : 'king') };
    MAPS2[w.screen].forEach((row, y) => [...row].forEach((c, x) => people[c] && g.drawImage(people[c], x * TILE, y * TILE)));

    // Leo (en el hielo se desliza más deprisa)
    const k = w.screen === 'hielo' ? 0.28 : 0.4;
    drawX += (w.x * TILE - drawX) * k;
    drawY += (w.y * TILE - drawY) * k;
    const leo = { up: 'leoUp', down: 'leoDown', left: 'leoLeft', right: 'leoRight' }[w.dir] as 'leoUp';
    g.drawImage(sprite2(leo), Math.round(drawX), Math.round(drawY));
  }

  const facing = $derived.by(() => {
    const [dx, dy] = DELTA[w.dir];
    return at(w.x + dx, w.y + dy);
  });
</script>

<Console
  {talk}
  {render}
  theme="w2"
  onmove={move}
  oninteract={interact}
  onreset={reset}
  resetLabel={w.screen === 'hielo' ? 'Volver a la entrada del hielo' : w.screen === 'cristal' ? 'Volver a la entrada del cristal' : ''}
  label="{NAMES[w.screen]}. Leo está en la casilla {w.x}, {w.y}, mirando hacia {DIR_ES[w.dir]}."
  attrs={{ screen: w.screen, x: w.x, y: w.y, dir: w.dir, facing, color: w.red ? 'rojo' : 'azul', song: w.song.length }}
/>
