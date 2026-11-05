<script lang="ts">
  import { onMount } from 'svelte';
  import { MAPS, FILES, FILE_IDS, START1, type FileId } from './maps';
  import { drawText, spriteB, tileB } from './art';
  import { backstage, freshFiles } from './state.svelte';
  import { TILE } from '$lib/pixel/art';
  import { sfx } from '$lib/pixel/audio';
  import Console from '$lib/pixel/Console.svelte';
  import { DELTA, DIR_ES, Talk, type Dir } from '$lib/pixel/talk.svelte';

  // Pantalla 1 · Carga infinita: la barra se queda en el 99 % porque faltan tres archivos
  const W = 20;
  const H = 18;
  const MAP = MAPS.carga;
  const talk = new Talk();
  const say = (lines: string[]) => talk.say(lines);
  const l = $derived(backstage.s.l1);
  const placed = $derived(backstage.isDone('archivos'));
  let lastMove = 0;
  let calm = false;
  onMount(() => (calm = matchMedia('(prefers-reduced-motion: reduce)').matches));

  const at = (x: number, y: number) => MAP[y]?.[x] ?? '#';
  const fileAt = (x: number, y: number) => FILE_IDS.find((id) => l.files[id][0] === x && l.files[id][1] === y);

  function solid(x: number, y: number) {
    const ch = at(x, y);
    if (ch === 'P') return !placed;
    if (ch === 'X') return !placed;
    return '#bcN'.includes(ch);
  }

  function move(dir: Dir) {
    if (talk.open || backstage.isDone('carga')) return;
    const now = performance.now();
    if (now - lastMove < 110) return;
    lastMove = now;
    backstage.s.l1.dir = dir;
    const [dx, dy] = DELTA[dir];
    const nx = l.x + dx;
    const ny = l.y + dy;

    if (at(nx, ny) === 'X' && placed) {
      Object.assign(backstage.s.l1, { x: nx, y: ny });
      sfx('item');
      backstage.complete('carga');
      return;
    }

    const f = fileAt(nx, ny);
    if (f) {
      const bx = nx + dx;
      const by = ny + dy;
      if (placed || solid(bx, by) || at(bx, by) === 'P' || fileAt(bx, by)) return sfx('bump');
      backstage.s.l1.files[f] = [bx, by];
      Object.assign(backstage.s.l1, { x: nx, y: ny });
      sfx('push');
      checkFiles();
      if (!placed && stuck(f)) {
        setTimeout(() => say(['¡Uy! Ese archivo se ha quedado atascado en una esquina.', 'Pulsa R (o el botón ↺) para recolocar los archivos y volver a empezar.']), 120);
      }
      backstage.save();
      return;
    }

    if (solid(nx, ny)) return sfx('bump');
    Object.assign(backstage.s.l1, { x: nx, y: ny });
    sfx('step');
    backstage.save();
  }

  /** Un archivo arrinconado fuera de su hueco ya no se puede mover */
  function stuck(id: FileId) {
    const [x, y] = l.files[id];
    if (FILES[id].slot[0] === x && FILES[id].slot[1] === y) return false;
    const block = (a: number, b: number) => solid(a, b) || at(a, b) === 'P';
    return (block(x - 1, y) || block(x + 1, y)) && (block(x, y - 1) || block(x, y + 1));
  }

  function checkFiles() {
    const ok = FILE_IDS.every((id) => FILES[id].slot[0] === l.files[id][0] && FILES[id].slot[1] === l.files[id][1]);
    if (!ok || placed) return;
    backstage.complete('archivos');
    setTimeout(() => {
      sfx('ok');
      say(['Texturas… OK. Sonido… OK. Mapa… OK.', 'La barra de carga salta al 100 % y la compuerta del registro se abre con un pitido.']);
    }, 150);
  }

  function reset() {
    if (placed) return;
    Object.assign(backstage.s.l1, { ...START1, dir: 'up', files: freshFiles() });
    backstage.save();
    sfx('door');
    say(['Los archivos vuelven a su sitio y tú, al principio del registro.']);
  }

  function interact() {
    if (backstage.isDone('carga')) return;
    const [dx, dy] = DELTA[l.dir];
    const tx = l.x + dx;
    const ty = l.y + dy;
    const ch = at(tx, ty);
    const f = fileAt(tx, ty);
    if (f) return say([`Un archivo perdido: «${FILES[f].name}». Pesa más de lo que parece.`]);
    if (ch === 'N') return say(wheelLines());
    if (ch === 'c')
      return say(
        tx < 10
          ? ['CONSEJO DE CARGA: cada archivo solo encaja en el hueco de su color.']
          : ['CONSEJO DE CARGA: un archivo arrinconado ya no sale de la esquina. Si te atascas, pulsa R.']
      );
    if (ch === 'b') return say([placed ? 'La barra brilla al 100 %.' : 'La barra marca 99 %. Lleva así… ¿horas? ¿años?']);
    if (ch === 'X') return say([placed ? 'La salida está abierta.' : 'Una puerta cerrada al final de la barra. Solo se abre al 100 %.']);
    if (ch === 'P') return say([placed ? 'La compuerta está abierta.' : 'La compuerta del registro. No se abre hasta que la carga termine.']);
    if ('tsm'.includes(ch)) return say([`Un hueco vacío en el registro con el borde ${{ t: 'amarillo', s: 'verde', m: 'rojo' }[ch]}.`]);
  }

  function wheelLines() {
    if (placed) return ['¡100 %! ¡Por fin dejo de girar! Corre a la salida, al final de la barra.'];
    return [
      '¡Hola, hola! Soy la Ruedecita. Giro cada vez que algo carga… y llevo girando muchísimo.',
      'Tu partida no termina de cargar: faltan tres archivos, texturas, sonido y mapa. Se han caído por el registro.',
      'Empújalos hasta sus huecos de arriba, cada uno al de su color. Y lee los consejos de carga: no los pongo de adorno.',
      'Ah, y si un archivo se atasca, pulsa R (o el botón ↺): todo vuelve a empezar. Reiniciar no es rendirse.',
    ];
  }

  // Dibujo
  let drawX = backstage.s.l1.x * TILE;
  let drawY = backstage.s.l1.y * TILE;
  const DEAD: [number, number][] = [[4, 4], [15, 3], [7, 12], [13, 10], [9, 5]];

  function tileFor(ch: string, x: number, t: number) {
    if (ch === '#' || ch === 'N') return tileB('wall');
    if (ch === 'b') {
      // 13 casillas llenas y la última a medias (parpadea): el famoso 99 %
      if (placed || x < 15) return tileB('barFull');
      return Math.floor(t / 500) % 2 ? tileB('barFull') : tileB('barEmpty');
    }
    if (ch === 'X') return tileB(placed ? 'exitOpen' : 'exitShut');
    if (ch === 'P') return tileB(placed ? 'gateOpen' : 'gate');
    if (ch === 'c') return tileB('sign');
    if (ch === 't') return tileB('slotT');
    if (ch === 's') return tileB('slotS');
    if (ch === 'm') return tileB('slotM');
    return null;
  }

  function render(g: CanvasRenderingContext2D, t: number) {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        g.drawImage(tileB('floor'), x * TILE, y * TILE);
        const img = tileFor(at(x, y), x, t);
        if (img) g.drawImage(img, x * TILE, y * TILE);
      }
    }
    // Cartel de arriba: «CARGANDO…» y el porcentaje
    g.fillStyle = '#00006a';
    g.fillRect(16, 6, 128, 9);
    const dots = '...'.slice(0, Math.floor(t / 400) % 4);
    drawText(g, placed ? 'CARGA COMPLETA' : 'CARGANDO' + dots, 18, 8, '#ffffff');
    drawText(g, placed ? '100%' : '99%', placed ? 126 : 130, 8, placed ? '#55ff55' : '#ffff55');

    // Píxeles muertos que parpadean
    if (!calm)
      DEAD.forEach(([x, y], k) => {
        if (Math.floor(t / 300 + k) % 3 === 0) g.drawImage(tileB('dead'), x * TILE, y * TILE);
      });

    // Archivos y la Ruedecita
    const COLORS: Record<FileId, string> = { T: '#aa5500', S: '#00aa00', M: '#aa0000' };
    for (const id of FILE_IDS) {
      const [x, y] = l.files[id];
      g.drawImage(tileB(id === 'T' ? 'fileT' : id === 'S' ? 'fileS' : 'fileM'), x * TILE, y * TILE);
      drawText(g, id, x * TILE + 3, y * TILE + 2, COLORS[id]);
    }
    if (!placed) {
      g.fillStyle = '#00006a';
      g.fillRect(100, 131, 56, 9);
      drawText(g, 'R: REINICIAR', 102, 133, '#55ffff');
    }
    const spin = calm || placed ? 0 : Math.floor(t / 250) % 2;
    g.drawImage(spriteB(spin ? 'wheelB' : 'wheelA'), 11 * TILE, 15 * TILE);

    drawX += (l.x * TILE - drawX) * 0.4;
    drawY += (l.y * TILE - drawY) * 0.4;
    const leo = { up: 'leoUp', down: 'leoDown', left: 'leoLeft', right: 'leoRight' }[l.dir] as 'leoUp';
    g.drawImage(spriteB(leo), Math.round(drawX), Math.round(drawY));

    // Fallo de vídeo: una franja desplazada de vez en cuando
    if (!calm && !placed && Math.floor(t / 120) % 23 === 0) {
      const band = (Math.floor(t / 2760) * 41) % 130;
      g.drawImage(g.canvas, 0, band, 160, 6, 3, band, 160, 6);
    }
  }

  const facing = $derived.by(() => {
    const [dx, dy] = DELTA[l.dir];
    return fileAt(l.x + dx, l.y + dy) ?? at(l.x + dx, l.y + dy);
  });
</script>

<Console
  {talk}
  {render}
  theme="b1"
  onmove={move}
  oninteract={interact}
  onreset={reset}
  resetLabel={placed ? '' : 'Recolocar los archivos'}
  label="Pantalla de carga{placed ? ' (al 100 %)' : ' (al 99 %)'}. Leo está en la casilla {l.x}, {l.y}, mirando hacia {DIR_ES[l.dir]}."
  attrs={{
    screen: 'carga',
    x: l.x,
    y: l.y,
    dir: l.dir,
    facing,
    files: FILE_IDS.map((id) => l.files[id].join(',')).join(' '),
    loaded: placed ? 'si' : 'no',
  }}
/>
