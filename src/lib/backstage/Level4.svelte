<script lang="ts">
  import { onMount } from 'svelte';
  import { DEBUG, PASSWORD, DEBUG_KEY, START4, TP_START, COMMENTS } from './maps';
  import { drawText, spriteT, tileT } from './art';
  import { backstage } from './state.svelte';
  import { TILE } from '$lib/pixel/art';
  import { sfx } from '$lib/pixel/audio';
  import Console from '$lib/pixel/Console.svelte';
  import { DELTA, DIR_ES, Talk, type Dir } from '$lib/pixel/talk.svelte';

  // Pantalla 4 · Consola de depuración: contraseña en un teclado de suelo y un teletransporte a mano
  const W = 20;
  const H = 18;
  const talk = new Talk();
  const say = (lines: string[]) => talk.say(lines);
  const l = $derived(backstage.s.l4);
  const logged = $derived(backstage.isDone('login'));
  const hasKey = $derived(backstage.isDone('llave'));
  let lastMove = 0;
  let calm = false;
  onMount(() => (calm = matchMedia('(prefers-reduced-motion: reduce)').matches));

  const at = (x: number, y: number) => DEBUG[y]?.[x] ?? '#';
  const KEYS = 'ELOBUGD';
  const PADS: Record<string, string> = { a: 'X-', b: 'X+', c: 'Y-', d: 'Y+', e: 'GO' };

  function solid(x: number, y: number) {
    const ch = at(x, y);
    if (ch === 'X') return !hasKey;
    return ch === '#' || ch === 'T';
  }

  function move(dir: Dir) {
    if (talk.open || backstage.isDone('depurar')) return;
    const now = performance.now();
    if (now - lastMove < 110) return;
    lastMove = now;
    backstage.s.l4.dir = dir;
    const [dx, dy] = DELTA[dir];
    const nx = l.x + dx;
    const ny = l.y + dy;
    if (at(nx, ny) === 'X' && hasKey) {
      Object.assign(backstage.s.l4, { x: nx, y: ny });
      sfx('door');
      backstage.complete('depurar');
      return;
    }
    if (solid(nx, ny)) return sfx('bump');
    Object.assign(backstage.s.l4, { x: nx, y: ny });
    sfx('step');
    takeKey();
    backstage.save();
  }

  function takeKey() {
    if (hasKey || l.x !== DEBUG_KEY[0] || l.y !== DEBUG_KEY[1]) return;
    backstage.complete('llave');
    setTimeout(() => {
      sfx('item');
      say(['Dentro del cofre de pruebas hay una llave que pone «DEBUG_KEY».', 'La puerta de la derecha del cofre se desbloquea.']);
    }, 150);
  }

  function reset() {
    if (hasKey) return;
    Object.assign(backstage.s.l4, { ...START4, dir: 'up', buffer: '' });
    backstage.save();
    sfx('door');
    say(['REINICIO: vuelves al punto de inicio y se borra lo que habías escrito.']);
  }

  /** A sobre una plataforma o tecla del suelo, o mirando a algo */
  function interact() {
    if (backstage.isDone('depurar')) return;
    const here = at(l.x, l.y);
    const comment = COMMENTS[`${l.x},${l.y}`];
    if (comment) return say(comment);
    if (KEYS.includes(here)) return typeKey(here);
    if (here === '~') {
      backstage.s.l4.buffer = l.buffer.slice(0, -1);
      sfx('talk');
      return backstage.save();
    }
    if (here === '!') return enter();
    if (PADS[here]) return pad(here);

    const [dx, dy] = DELTA[l.dir];
    const ch = at(l.x + dx, l.y + dy);
    if (ch === 'T')
      return say(
        logged
          ? ['> SESIÓN INICIADA COMO DESARROLLADOR.', '> Comandos disponibles: teletransporte (plataformas X−, X+, Y−, Y+ y GO).']
          : ['> USUARIO: JUGADOR1', '> CONTRASEÑA: escríbela en el teclado del suelo (A sobre cada tecla) y pisa ENTER.']
      );
    if (ch === 'X') return say([hasKey ? 'La puerta está abierta.' : 'Puerta bloqueada. Requiere DEBUG_KEY.']);
  }

  function typeKey(k: string) {
    if (logged) return say(['Ya has iniciado sesión. El teclado no hace falta.']);
    if (l.buffer.length >= 8) return sfx('bump');
    backstage.s.l4.buffer = l.buffer + k;
    sfx('talk');
    backstage.save();
  }

  function enter() {
    if (logged) return say(['> Ya hay una sesión iniciada.']);
    if (l.buffer === PASSWORD) {
      backstage.s.l4.buffer = '';
      backstage.complete('login');
      sfx('ok');
      return say(['> CONTRASEÑA CORRECTA. SESIÓN INICIADA.', '> Plataformas de teletransporte activadas.']);
    }
    backstage.s.l4.buffer = '';
    backstage.save();
    sfx('no');
    say(['> CONTRASEÑA INCORRECTA. Se borra lo escrito.']);
  }

  function pad(p: string) {
    if (!logged) {
      sfx('no');
      return say(['> ACCESO DENEGADO. Inicia sesión en el terminal.']);
    }
    const [tx, ty] = l.tp;
    if (p === 'a') backstage.s.l4.tp = [(tx + W - 1) % W, ty];
    if (p === 'b') backstage.s.l4.tp = [(tx + 1) % W, ty];
    if (p === 'c') backstage.s.l4.tp = [tx, (ty + H - 1) % H];
    if (p === 'd') backstage.s.l4.tp = [tx, (ty + 1) % H];
    if (p !== 'e') {
      sfx('talk');
      return backstage.save();
    }
    // Ejecutar el salto: si el destino es muro, el juego se cuelga
    if (solid(tx, ty) || 'X'.includes(at(tx, ty))) {
      Object.assign(backstage.s.l4, { ...START4, dir: 'up' });
      backstage.save();
      sfx('crack');
      return say([`> TELETRANSPORTE A (${tx}, ${ty})…`, '> SEGMENTATION FAULT (core dumped).', 'Todo parpadea y vuelves al punto de inicio.']);
    }
    Object.assign(backstage.s.l4, { x: tx, y: ty, dir: 'down' });
    sfx('door');
    backstage.save();
    if (tx === DEBUG_KEY[0] && ty === DEBUG_KEY[1]) takeKey();
  }

  // Dibujo
  let drawX = backstage.s.l4.x * TILE;
  let drawY = backstage.s.l4.y * TILE;

  function render(g: CanvasRenderingContext2D, t: number) {
    // Si Leo se teletransporta, el dibujo salta (sin deslizarse por media pantalla)
    if (Math.abs(l.x * TILE - drawX) + Math.abs(l.y * TILE - drawY) > 3 * TILE) {
      drawX = l.x * TILE;
      drawY = l.y * TILE;
    }
    const blink = Math.floor(t / 500) % 2 === 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        g.drawImage(tileT('floor'), x * TILE, y * TILE);
        const ch = at(x, y);
        if (ch === '#') g.drawImage(tileT('wall'), x * TILE, y * TILE);
        else if (ch === 'T') g.drawImage(tileT('terminal'), x * TILE, y * TILE);
        else if (ch === '/') g.drawImage(tileT('comment'), x * TILE, y * TILE);
        else if (ch === 'X') g.drawImage(tileT(hasKey ? 'exitOpen' : 'exitShut'), x * TILE, y * TILE);
        else if (KEYS.includes(ch) || ch === '~' || ch === '!') {
          g.drawImage(tileT('pad'), x * TILE, y * TILE);
          drawText(g, ch === '~' ? '<' : ch === '!' ? 'OK' : ch, x * TILE + (ch === '!' ? 1 : 3), y * TILE + 2, '#00ff66');
        } else if (PADS[ch]) {
          g.drawImage(tileT(logged ? 'pad' : 'padOff'), x * TILE, y * TILE);
          drawText(g, PADS[ch], x * TILE + 1, y * TILE + 2, logged ? '#ffcc00' : '#0f4a22');
        }
      }
    }
    if (!hasKey) g.drawImage(tileT('chest'), DEBUG_KEY[0] * TILE, DEBUG_KEY[1] * TILE);

    // Cabecera de la consola
    g.fillStyle = '#000c04';
    g.fillRect(0, 0, 160, 16);
    drawText(g, 'DEBUG V0.99  USUARIO: JUGADOR1', 2, 2, '#00ff66');
    drawText(g, logged ? 'SESION INICIADA' : `CLAVE: ${l.buffer}${blink ? '_' : ''}`, 2, 9, logged ? '#66ffaa' : '#ffcc00');

    // Destino del teletransporte
    drawText(g, logged ? `X=${l.tp[0]} Y=${l.tp[1]}` : 'BLOQUEADO', 56, 66, logged ? '#ffcc00' : '#ff4444');
    if (logged && !hasKey && blink && !calm) {
      const [tx, ty] = l.tp;
      g.strokeStyle = '#ffcc00';
      g.strokeRect(tx * TILE + 0.5, ty * TILE + 0.5, TILE - 1, TILE - 1);
    }
    drawText(g, 'TECLADO', 2, 97, '#00aa44');
    if (!hasKey) drawText(g, 'R: REINICIAR', 108, 138, '#00aa44');

    drawX += (l.x * TILE - drawX) * 0.4;
    drawY += (l.y * TILE - drawY) * 0.4;
    const leo = { up: 'leoUp', down: 'leoDown', left: 'leoLeft', right: 'leoRight' }[l.dir] as 'leoUp';
    g.drawImage(spriteT(leo), Math.round(drawX), Math.round(drawY));

    // Líneas de barrido de monitor
    if (!calm) {
      g.fillStyle = 'rgba(0, 0, 0, 0.18)';
      for (let y = 0; y < 144; y += 2) g.fillRect(0, y, 160, 1);
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
  theme="b4"
  onmove={move}
  oninteract={interact}
  onreset={reset}
  resetLabel={hasKey ? '' : 'Volver al inicio'}
  label="Consola de depuración{logged ? ', sesión iniciada' : ''}. Leo está en la casilla {l.x}, {l.y}, mirando hacia {DIR_ES[l.dir]}. Destino del teletransporte: {l.tp[0]}, {l.tp[1]}."
  attrs={{
    screen: 'depuracion',
    x: l.x,
    y: l.y,
    dir: l.dir,
    facing,
    here: at(l.x, l.y),
    buffer: l.buffer,
    tp: l.tp.join(','),
    logged: logged ? 'si' : 'no',
  }}
/>
