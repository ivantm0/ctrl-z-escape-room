<script lang="ts">
  import { onMount } from 'svelte';
  import { CREDITS, CREDITS_ODD, CREDITS_VIEW, START5, creditsOffset } from './maps';
  import { drawText, spriteS } from './art';
  import { backstage } from './state.svelte';
  import { TILE } from '$lib/pixel/art';
  import { sfx } from '$lib/pixel/audio';
  import Console from '$lib/pixel/Console.svelte';
  import { DELTA, DIR_ES, Talk, type Dir } from '$lib/pixel/talk.svelte';

  // Pantalla 5 · Créditos: los nombres suben y Leo tiene que ir saltando de línea en línea
  const talk = new Talk();
  const say = (lines: string[]) => talk.say(lines);
  const l = $derived(backstage.s.l5);
  const offset = $derived(creditsOffset(l.turns));
  const found = $derived(backstage.isDone('nombre'));
  const LAST = CREDITS.length - 1;
  let lastMove = 0;
  let calm = false;
  onMount(() => (calm = matchMedia('(prefers-reduced-motion: reduce)').matches));

  const cell = (x: number, y: number) => CREDITS[y]?.[x] ?? ' ';
  const isOdd = (x: number, y: number) => y === CREDITS_ODD.row && x >= CREDITS_ODD.from && x <= CREDITS_ODD.to;

  function restart(lines: string[]) {
    Object.assign(backstage.s.l5, { ...START5, dir: 'down', turns: 0 });
    backstage.save();
    sfx('no');
    say([...lines, 'Los créditos vuelven a empezar desde arriba. (R también los reinicia.)']);
  }

  function move(dir: Dir) {
    if (talk.open || backstage.isDone('fin')) return;
    const now = performance.now();
    if (now - lastMove < 110) return;
    lastMove = now;
    backstage.s.l5.dir = dir;
    const [dx, dy] = DELTA[dir];
    let nx = l.x + dx;
    let ny = l.y + dy;

    // Contra el marco o por debajo de la pantalla: Leo no se mueve, pero el tiempo corre
    if (nx < 1 || nx > 18 || ny > offset + CREDITS_VIEW - 1) {
      nx = l.x;
      ny = l.y;
      sfx('bump');
    } else if (ny < 0 || cell(nx, ny) === ' ') {
      return restart(['Pisas el hueco entre dos nombres… y caes fuera de los créditos.']);
    } else sfx('step');

    const turns = l.turns + 1;
    if (ny < creditsOffset(turns)) return restart(['Los créditos siguen subiendo y te sacan por arriba de la pantalla.']);
    Object.assign(backstage.s.l5, { x: nx, y: ny, turns });

    if (isOdd(nx, ny) && !found) {
      backstage.complete('nombre');
      sfx('item');
      say(['Un momento… «TU». Los créditos te nombran a ti, el jugador, entre los que hicieron el juego.', 'Tú no has programado nada. Alguien lo ha escrito ahí a propósito… y parpadea como un dato a medio guardar.']);
    }
    if (ny === LAST) {
      if (found) {
        sfx('ok');
        backstage.complete('fin');
      } else {
        say(['«GRACIAS POR JUGAR». Los créditos se han acabado… pero falta algo: un nombre que no debería estar ahí.', 'Pulsa R para verlos otra vez.']);
      }
    }
    backstage.save();
  }

  function reset() {
    if (backstage.isDone('fin')) return;
    Object.assign(backstage.s.l5, { ...START5, dir: 'down', turns: 0 });
    backstage.save();
    sfx('door');
    say(['Rebobinas los créditos hasta el principio.']);
  }

  function interact() {
    if (backstage.isDone('fin')) return;
    const [dx, dy] = DELTA[l.dir];
    const tx = l.x + dx;
    const ty = l.y + dy;
    if (isOdd(tx, ty) || isOdd(l.x, l.y)) return say(['«TU». ¿Qué haces tú en los créditos?']);
    say([
      'Los créditos suben un renglón cada dos pasos. Solo puedes pisar letras: entre nombre y nombre no hay suelo.',
      'Si te quedas arriba del todo, te sacan de la pantalla. Chocar con el borde también cuenta como un paso.',
    ]);
  }

  // Dibujo
  let drawOff = creditsOffset(backstage.s.l5.turns) * TILE;
  let drawX = backstage.s.l5.x * TILE;
  let drawY = backstage.s.l5.y * TILE;

  function render(g: CanvasRenderingContext2D, t: number) {
    const target = offset * TILE;
    if (Math.abs(target - drawOff) > 4 * TILE) drawOff = target;
    drawOff += (target - drawOff) * 0.2;
    if (Math.abs(l.y * TILE - drawY) > 4 * TILE) drawY = l.y * TILE;
    const off = Math.round(drawOff);

    g.fillStyle = '#2b1d12';
    g.fillRect(0, 0, 160, 144);
    const first = Math.max(0, Math.floor(off / TILE) - 1);
    for (let y = first; y < Math.min(CREDITS.length, first + CREDITS_VIEW + 2); y++) {
      for (let x = 0; x < 20; x++) {
        const ch = cell(x, y);
        if (ch === ' ') continue;
        const px = x * TILE;
        const py = y * TILE - off;
        g.fillStyle = '#e8d5b0';
        g.fillRect(px, py, TILE, TILE - 1);
        if (ch === '_') continue;
        // «TU» no debería estar ahí: parpadea de vez en cuando
        const odd = isOdd(x, y) && !calm && Math.floor(t / 180) % 7 === 0;
        drawText(g, ch, px + 2, py + 1, odd ? '#9c4a2a' : '#3d2a1a');
      }
    }

    // Zona de peligro: el renglón de arriba
    if (l.y === offset && !backstage.isDone('fin')) {
      g.fillStyle = Math.floor(t / 250) % 2 ? 'rgba(156, 74, 42, 0.45)' : 'rgba(156, 74, 42, 0.2)';
      g.fillRect(0, 0, 160, TILE);
    }

    drawX += (l.x * TILE - drawX) * 0.4;
    drawY += (l.y * TILE - drawY) * 0.4;
    const leo = { up: 'leoUp', down: 'leoDown', left: 'leoLeft', right: 'leoRight' }[l.dir] as 'leoUp';
    g.drawImage(spriteS(leo), Math.round(drawX), Math.round(drawY) - off);

    // Grano y rayas de película
    if (!calm) {
      g.fillStyle = 'rgba(18, 12, 6, 0.5)';
      for (let k = 0; k < 14; k++) {
        const s = Math.floor(t / 90) * 31 + k * 97;
        g.fillRect(s % 160, (s * 7) % 144, 1, 1);
      }
      if (Math.floor(t / 300) % 5 === 0) g.fillRect((Math.floor(t / 300) * 53) % 160, 0, 1, 144);
    }
    const grad = g.createRadialGradient(80, 72, 50, 80, 72, 110);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(18,12,6,0.55)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 160, 144);
  }
</script>

<Console
  {talk}
  {render}
  theme="b5"
  onmove={move}
  oninteract={interact}
  onreset={reset}
  resetLabel={backstage.isDone('fin') ? '' : 'Rebobinar los créditos'}
  label="Créditos. Leo está en el renglón {l.y} de {LAST}, columna {l.x}, mirando hacia {DIR_ES[l.dir]}. La pantalla muestra los renglones {offset} a {offset + CREDITS_VIEW - 1}."
  attrs={{ screen: 'creditos', x: l.x, y: l.y, dir: l.dir, offset, turns: l.turns, found: found ? 'si' : 'no' }}
/>
