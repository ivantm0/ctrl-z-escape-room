<script lang="ts">
  import { MAPS, GARDEN, RUNES, initialRunes, toggleRune, type ScreenId } from './maps';
  import { TILE, floorFor, sprite, tile } from './art';
  import { pixel } from './state.svelte';
  import { sfx } from './audio';
  import CodeLock from './CodeLock.svelte';
  import Console from './Console.svelte';
  import { DELTA, DIR_ES, Talk, type Dir } from './talk.svelte';

  // Mundo 1 «Monocromo»: vista desde arriba, movimiento por casillas, empujar cajas y pulsar A
  const W = 20;
  const H = 18;
  const NAMES: Record<ScreenId, string> = { pueblo: 'Pueblo', casa: 'Casa del anciano', cueva: 'Cueva' };

  const w = $derived(pixel.s.w);

  // Cajas del jardín: si el puzle está resuelto, quedan sobre las baldosas
  let crates = $state<[number, number][]>(pixel.s.w.shedOpen ? GARDEN.plates.map((p) => [...p] as [number, number]) : GARDEN.crates.map((p) => [...p] as [number, number]));
  const talk = new Talk();
  let codeOpen = $state(false);
  let lastMove = 0;

  const at = (x: number, y: number) => MAPS[w.screen][y]?.[x] ?? '#';
  const crateAt = (x: number, y: number) => w.screen === 'pueblo' && crates.findIndex(([cx, cy]) => cx === x && cy === y);
  const runeIndex = (x: number, y: number) => {
    const c = RUNES.cols.indexOf(x);
    const r = RUNES.rows.indexOf(y);
    return c >= 0 && r >= 0 ? r * 3 + c : -1;
  };
  const rockIndex = (x: number, y: number) => (w.screen === 'cueva' && x === 10 ? [11, 12].indexOf(y) : -1);

  function solid(x: number, y: number) {
    const ch = at(x, y);
    switch (w.screen) {
      case 'pueblo':
        if (ch === 'E') return !w.gateOpen;
        return '#TWqHhdfoKQNmc'.includes(ch) && ch !== 'c';
      case 'casa':
        return '#vbBXA'.includes(ch);
      case 'cueva':
        if (ch === 'R') return !w.rocks[rockIndex(x, y)];
        if (ch === 'Z') return !w.wallOpen;
        return '#Ls'.includes(ch);
    }
  }

  const say = (lines: string[], after?: () => void) => talk.say(lines, after);

  function go(screen: ScreenId, x: number, y: number, dir: Dir) {
    sfx('door');
    Object.assign(pixel.s.w, { screen, x, y, dir });
    if (screen === 'pueblo' && !pixel.s.w.shedOpen) resetCrates(true);
    pixel.save();
  }

  function move(dir: Dir) {
    if (talk.open || codeOpen || pixel.isDone('puerta')) return;
    const now = performance.now();
    if (now - lastMove < 110) return;
    lastMove = now;
    pixel.s.w.dir = dir;
    const [dx, dy] = DELTA[dir];
    const nx = w.x + dx;
    const ny = w.y + dy;
    const ch = at(nx, ny);

    // Pasos a otras pantallas
    if (w.screen === 'pueblo' && ch === 'D') return go('casa', 9, 9, 'up');
    if (w.screen === 'pueblo' && ch === 'c') {
      if (!pixel.s.items.includes('farol')) return say(['Está oscurísimo. No ves ni tus propios píxeles.', 'Necesitas algo para alumbrar.']);
      return go('cueva', 10, 16, 'up');
    }
    if (w.screen === 'casa' && ch === 'O') return go('pueblo', 3, 9, 'down');
    if (w.screen === 'cueva' && ch === 'O') return go('pueblo', 18, 2, 'down');
    if (w.screen === 'pueblo' && ch === 'E' && w.gateOpen) {
      pixel.s.w.y = ny;
      sfx('item');
      pixel.complete('puerta');
      return;
    }

    // Empujar una caja
    const ci = crateAt(nx, ny);
    if (ci !== false && ci >= 0) {
      const bx = nx + dx;
      const by = ny + dy;
      const free = !solid(bx, by) && (crateAt(bx, by) === -1) && !'Dc'.includes(at(bx, by));
      if (!free || pixel.s.w.shedOpen) return sfx('bump');
      crates[ci] = [bx, by];
      sfx('push');
      pixel.s.w.x = nx;
      pixel.s.w.y = ny;
      checkPlates();
      pixel.save();
      return;
    }

    if (solid(nx, ny)) return sfx('bump');
    pixel.s.w.x = nx;
    pixel.s.w.y = ny;
    sfx('step');
    pixel.save();
  }

  function checkPlates() {
    const ok = GARDEN.plates.every(([px, py]) => crates.some(([cx, cy]) => cx === px && cy === py));
    if (ok && !pixel.s.w.shedOpen) {
      pixel.s.w.shedOpen = true;
      pixel.save();
      setTimeout(() => {
        sfx('ok');
        say(['¡CLIC! Las dos baldosas se hunden a la vez.', 'Se oye cómo se abre la puerta del cobertizo.']);
      }, 150);
    }
  }

  function resetCrates(silent = false) {
    if (pixel.s.w.shedOpen) return;
    const blocked = GARDEN.crates.some(([x, y]) => w.screen === 'pueblo' && w.x === x && w.y === y);
    if (blocked) return !silent && say(['Apártate primero del sitio donde estaban las cajas.']);
    crates = GARDEN.crates.map((p) => [...p] as [number, number]);
    if (!silent) sfx('door');
  }

  // Las runas vuelven a su estado inicial (mientras el muro siga cerrado)
  function resetRunes() {
    if (pixel.s.w.wallOpen) return;
    pixel.s.w.runes = initialRunes();
    pixel.save();
    sfx('door');
    say(['Las runas parpadean y vuelven a como estaban al principio.']);
  }

  /** R / ↺: recoloca lo que haya que recolocar en la pantalla actual */
  function resetPuzzle() {
    if (w.screen === 'cueva') resetRunes();
    else if (w.screen === 'pueblo') resetCrates();
  }

  function interact() {
    if (codeOpen || pixel.isDone('puerta')) return;

    // Runa bajo los pies
    if (w.screen === 'cueva') {
      const ri = runeIndex(w.x, w.y);
      if (ri >= 0 && !w.wallOpen) {
        toggleRune(pixel.s.w.runes, ri);
        sfx('rune');
        if (pixel.s.w.runes.every(Boolean)) {
          pixel.s.w.wallOpen = true;
          sfx('ok');
          say(['Las nueve runas brillan a la vez.', 'Al norte, el muro de la cámara se desmorona.']);
        }
        pixel.save();
        return;
      }
    }

    const [dx, dy] = DELTA[w.dir];
    const tx = w.x + dx;
    const ty = w.y + dy;
    const ch = at(tx, ty);

    if (w.screen === 'pueblo') {
      if (ch === 'Q') return say(['JARDÍN DEL ANCIANO', '«Pon cada caja sobre una baldosa y el cobertizo se abrirá.»', '(Si las cajas se atascan, pulsa R para recolocarlas.)']);
      if (ch === 'K') {
        if (!w.shedOpen) return say(['El cobertizo está cerrado. No tiene cerradura… solo un mecanismo bajo las baldosas.']);
        if (!pixel.s.items.includes('farol')) {
          pixel.give('farol');
          pixel.complete('cajas');
          sfx('item');
          return say(['Dentro del cobertizo hay un FAROL encendido.', '¡Has conseguido el FAROL!']);
        }
        return say(['El cobertizo está vacío.']);
      }
      if (ch === 'd') return say(['Está cerrada. Por la ventana no se ve a nadie.', 'En este pueblo solo vive el anciano… y los que se quedaron atrapados.']);
      if (ch === 'o') return say(['Un pozo. En el fondo brilla algo… No: es tu reflejo, en cuatro tonos de verde.']);
      if (ch === 'T') return say(['Un árbol. Uno de los pocos que hay en el pueblo.']);
      if (ch === 'W' || ch === 'q') return say(['El estanque. Si te fijas, algún pez asoma entre las ondas.']);
      if (ch === 'm') return say(['MIAU.', '(El gato no aparta la vista del estanque. Parece estar contando algo.)']);
      if (ch === 'N') return say(girlLines());
      if (ch === 'c') return say(['La entrada de la cueva. Dentro no se ve nada.']);
      if (ch === 'E') {
        if (w.gateOpen) return;
        if (pixel.has('llave')) {
          pixel.use('llave');
          pixel.s.w.gateOpen = true;
          pixel.save();
          sfx('item');
          return say(['Metes la LLAVE DE PÍXEL en la cerradura.', 'La Puerta del Cartucho se abre con un zumbido de 8 bits.', 'Al otro lado… colores. Muchos más de cuatro.']);
        }
        return say(['LA PUERTA DEL CARTUCHO', 'Una puerta enorme con forma de cartucho. Su cerradura parpadea como un píxel suelto.']);
      }
    }

    if (w.screen === 'casa') {
      if (ch === 'A') return say(elderLines(), () => {
        pixel.s.w.talked = true;
        pixel.save();
      });
      if (ch === 'B') return say(['El diario del anciano:', '«Mi baúl se abre con lo que veo cada mañana al salir de casa.', 'Primero cuento los ÁRBOLES, luego los PECES del estanque, después las FLORES y por último las CASAS.»']);
      if (ch === 'X') {
        if (pixel.isDone('cofre')) return say(['El baúl está vacío.']);
        codeOpen = true;
        return;
      }
      if (ch === 'b') return say(['La cama del anciano. Cruje solo de mirarla.']);
      if (ch === 'v') return say(['Por la ventana se ve el pueblo… en cuatro tonos de verde.']);
    }

    if (w.screen === 'cueva') {
      if (ch === 's') return say(['Una inscripción tallada en la roca:', '«NUEVE RUNAS DUERMEN BAJO TUS PIES.', 'CADA UNA, AL TOCARLA, CAMBIA ELLA Y CAMBIAN SUS VECINAS.', 'DESPIÉRTALAS TODAS Y EL MURO CAERÁ.»', '(Si te lías, pulsa R para devolver las runas a su estado inicial.)']);
      const ri = rockIndex(tx, ty);
      if (ch === 'R' && ri >= 0 && !w.rocks[ri]) {
        if (!pixel.s.items.includes('pico')) return say(['Una roca enorme bloquea el paso.', 'Con las manos no vas a poder. Necesitas algo para romperla.']);
        pixel.s.w.rocks[ri] = true;
        sfx('crack');
        if (pixel.s.w.rocks.every(Boolean)) pixel.complete('rocas');
        pixel.save();
        return;
      }
      if (ch === 'L') {
        if (!pixel.s.items.includes('llave')) {
          pixel.give('llave');
          pixel.complete('runas');
          sfx('item');
          return say(['Sobre el pedestal flota una llave hecha de píxeles.', '¡Has conseguido la LLAVE DE PÍXEL!']);
        }
        return say(['El pedestal está vacío.']);
      }
    }
  }

  function elderLines() {
    if (!w.talked)
      return [
        '¡Vaya! Otro jugador que se ha quedado dentro del juego.',
        'Yo llegué hace… ¿cuántos reinicios? Ya ni me acuerdo.',
        'La única salida de este mundo es la PUERTA DEL CARTUCHO, al norte del pueblo.',
        'Se abre con la LLAVE DE PÍXEL, que duerme en la cueva del noreste.',
        'Pero la cueva está a oscuras y llena de rocas. Mi farol está en el cobertizo del jardín… y mis herramientas, en mi baúl.',
        'La combinación del baúl… la apunté en mi diario. Mi memoria ya no es lo que era.',
      ];
    if (!pixel.s.items.includes('farol')) return ['El cobertizo del jardín se abre con las baldosas. Yo ya no tengo fuerzas para empujar cajas.'];
    if (!pixel.isDone('cofre')) return ['¿Has leído mi diario? Está sobre la mesa. Hay que contar cosas del pueblo.'];
    if (!pixel.isDone('rocas')) return ['Con mi pico podrás abrirte paso entre las rocas de la cueva.'];
    if (!pixel.isDone('runas')) return ['Las runas de la cueva… Cada una despierta a sus vecinas. Piénsalo antes de pisarlas todas.'];
    return ['¡La llave! Corre a la Puerta del Cartucho. Y si ves a mi yo de 16 bits, salúdalo de mi parte.'];
  }

  function girlLines() {
    if (!pixel.isDone('cofre')) return ['¡Hola! El anciano nunca se acuerda de nada. Por eso lo cuenta todo.', 'Yo también cuento: los peces del estanque, por ejemplo. ¡Algunos se esconden entre las ondas!'];
    return ['¡Has abierto el baúl del anciano! Dicen que en la cueva hay runas que se encienden solas… o que se apagan solas.'];
  }

  function openChest() {
    codeOpen = false;
    pixel.give('pico');
    pixel.complete('cofre');
    sfx('item');
    say(['El baúl se abre con un crujido.', 'Dentro, entre mantas viejas: un PICO.', '¡Has conseguido el PICO!']);
  }

  // Dibujo
  let drawX = pixel.s.w.x * TILE;
  let drawY = pixel.s.w.y * TILE;
  let lastScreen = pixel.s.w.screen;

  function render(g: CanvasRenderingContext2D, t: number) {
    const screen = w.screen;
    if (screen !== lastScreen) {
      drawX = w.x * TILE;
      drawY = w.y * TILE;
      lastScreen = screen;
    }
    const blink = Math.floor(t / 500) % 2 === 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const ch = at(x, y);
        const px = x * TILE;
        const py = y * TILE;
        g.drawImage(tile(floorFor(screen) as never), px, py);
        const t2 = tileFor(screen, ch, x, y, blink);
        if (t2) g.drawImage(t2, px, py);
      }
    }
    if (screen === 'pueblo') {
      for (const [x, y] of GARDEN.plates) g.drawImage(tile('plate'), x * TILE, y * TILE);
      for (const [x, y] of crates) g.drawImage(tile('crate'), x * TILE, y * TILE);
      drawAt(g, 'N', sprite('girl'));
      drawAt(g, 'm', sprite('cat'));
    }
    if (screen === 'casa') drawAt(g, 'A', sprite('elder'));

    // Jugador con movimiento suavizado
    drawX += (w.x * TILE - drawX) * 0.4;
    drawY += (w.y * TILE - drawY) * 0.4;
    const leo = { up: 'leoUp', down: 'leoDown', left: 'leoLeft', right: 'leoRight' }[w.dir] as 'leoUp';
    g.drawImage(sprite(leo), Math.round(drawX), Math.round(drawY));

    // La cueva solo se ve alrededor del farol
    if (screen === 'cueva') {
      const cx = drawX + 4;
      const cy = drawY + 4;
      const grad = g.createRadialGradient(cx, cy, 10, cx, cy, 36 + (blink ? 1 : 0));
      grad.addColorStop(0, 'rgba(29,43,26,0)');
      grad.addColorStop(1, 'rgba(29,43,26,0.97)');
      g.fillStyle = grad;
      g.fillRect(0, 0, W * TILE, H * TILE);
    }
  }

  function drawAt(g: CanvasRenderingContext2D, ch: string, img: HTMLCanvasElement) {
    MAPS[w.screen].forEach((row, y) => [...row].forEach((c, x) => c === ch && g.drawImage(img, x * TILE, y * TILE)));
  }

  function tileFor(screen: ScreenId, ch: string, x: number, y: number, blink: boolean): HTMLCanvasElement | null {
    if (screen === 'pueblo') {
      const m: Record<string, string> = { '#': 'rock', ',': 'path', T: 'tree', W: 'water', q: blink ? 'fish' : 'water', F: 'flower', o: 'well', H: 'roof', h: 'wall', d: 'door', D: 'door', f: 'fence', Q: 'sign', c: 'cave' };
      if (ch === 'K') return tile(w.shedOpen ? 'shedOpen' : 'shed');
      if (ch === 'E') return tile(w.gateOpen ? 'gateOpen' : 'gate');
      return m[ch] ? tile(m[ch] as never) : null;
    }
    if (screen === 'casa') {
      const m: Record<string, string> = { '#': 'inWall', v: 'window', b: 'bed', B: 'table', O: 'mat' };
      if (ch === 'X') return tile(pixel.isDone('cofre') ? 'chestOpen' : 'chest');
      return m[ch] ? tile(m[ch] as never) : null;
    }
    if (ch === '#') return tile('caveWall');
    if (ch === 'Z') return w.wallOpen ? null : tile('caveWall');
    if (ch === 'R') return w.rocks[rockIndex(x, y)] ? null : tile('boulder');
    if (ch === 'u') return tile(w.runes[runeIndex(x, y)] ? 'runeOn' : 'runeOff');
    if (ch === 's') return tile('stone');
    if (ch === 'O') return tile('path');
    if (ch === 'L') return tile(pixel.s.items.includes('llave') ? 'pedestal' : (blink ? 'key' : 'pedestal'));
    return null;
  }

  // Texto para lectores de pantalla (y para los tests): dónde estás y qué tienes delante
  const facing = $derived.by(() => {
    const [dx, dy] = DELTA[w.dir];
    return at(w.x + dx, w.y + dy);
  });
  const lit = $derived(w.runes.filter(Boolean).length);
</script>

<Console
  {talk}
  {render}
  onmove={move}
  oninteract={interact}
  onreset={resetPuzzle}
  blocked={codeOpen}
  resetLabel={w.screen === 'pueblo' && !w.shedOpen ? 'Recolocar las cajas' : w.screen === 'cueva' && !w.wallOpen ? 'Reiniciar las runas' : ''}
  label="{NAMES[w.screen]}. Leo está en la casilla {w.x}, {w.y}, mirando hacia {DIR_ES[w.dir]}."
  attrs={{ screen: w.screen, x: w.x, y: w.y, dir: w.dir, facing, runes: lit, crates: crates.map((c) => c.join(',')).join(' ') }}
>
  {#if codeOpen}
    <CodeLock onopen={openChest} onclose={() => (codeOpen = false)} />
  {/if}
</Console>
