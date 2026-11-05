<script lang="ts">
  import { onMount } from 'svelte';
  import { OPTIONS, SETTINGS, RAIL_X, OPTIONS_START, OPTIONS_GOAL, START3, scramble } from './maps';
  import { drawText, spriteO, tileO } from './art';
  import { backstage } from './state.svelte';
  import { TILE } from '$lib/pixel/art';
  import { sfx } from '$lib/pixel/audio';
  import Console from '$lib/pixel/Console.svelte';
  import { DELTA, DIR_ES, Talk, type Dir } from '$lib/pixel/talk.svelte';

  // Pantalla 3 · Opciones: cada ajuste cambia la sala, y solo una configuración deja seguir
  const W = 20;
  const H = 18;
  const talk = new Talk();
  const l = $derived(backstage.s.l3);
  const applied = $derived(backstage.isDone('ajustes'));
  const [bright, volume, lang, subs] = $derived(l.vals);
  /** En idioma «???» todos los textos salen en símbolos… salvo lo que ya estaba escrito en «???» */
  const say = (lines: string[], raw = false) => talk.say(raw || lang === 0 ? lines : lines.map(scramble));
  let lastMove = 0;
  let calm = false;
  onMount(() => (calm = matchMedia('(prefers-reduced-motion: reduce)').matches));

  const at = (x: number, y: number) => OPTIONS[y]?.[x] ?? '#';
  /** Índice del ajuste cuyo tirador está en esa casilla */
  const handleAt = (x: number, y: number) => SETTINGS.findIndex((s, i) => s.row === y && RAIL_X + l.vals[i] === x);

  function solid(x: number, y: number) {
    const ch = at(x, y);
    if (ch === 'X') return !applied;
    return '#lAZK'.includes(ch);
  }

  function move(dir: Dir) {
    if (talk.open || backstage.isDone('consola')) return;
    const now = performance.now();
    if (now - lastMove < 110) return;
    lastMove = now;
    backstage.s.l3.dir = dir;
    const [dx, dy] = DELTA[dir];
    const nx = l.x + dx;
    const ny = l.y + dy;

    if (at(nx, ny) === 'X' && applied) {
      Object.assign(backstage.s.l3, { x: nx, y: ny });
      sfx('door');
      backstage.complete('consola');
      return;
    }

    // Tiradores: solo se mueven a lo largo de su carril
    const h = handleAt(nx, ny);
    if (h >= 0) {
      const next = l.vals[h] + dx;
      if (applied || dy !== 0 || next < 0 || next >= SETTINGS[h].values.length) return sfx('bump');
      backstage.s.l3.vals[h] = next;
      Object.assign(backstage.s.l3, { x: nx, y: ny });
      sfx('push');
      backstage.save();
      return;
    }

    if (solid(nx, ny)) return sfx('bump');
    Object.assign(backstage.s.l3, { x: nx, y: ny });
    sfx('step');
    backstage.save();
  }

  function reset() {
    if (applied) return;
    Object.assign(backstage.s.l3, { ...START3, dir: 'up', vals: [...OPTIONS_START] });
    backstage.save();
    sfx('door');
    talk.say(['RESTABLECER AJUSTES: todo vuelve a los valores de fábrica… y tú, a la entrada.']);
  }

  function interact() {
    if (backstage.isDone('consola')) return;
    const [dx, dy] = DELTA[l.dir];
    const tx = l.x + dx;
    const ty = l.y + dy;
    const ch = at(tx, ty);
    const h = handleAt(tx, ty);
    if (h >= 0) return say([`El tirador de ${SETTINGS[h].label}. Empújalo a izquierda o derecha.`]);
    if (ch === 'l') {
      const s = SETTINGS.find((s) => s.row === ty)!;
      return say([`Ajuste: ${s.label}.`]);
    }
    if (ch === 'A') return say(speakerLines());
    if (ch === 'Z')
      return lang === 1
        ? say(['Ahora el cartel se lee perfectamente: «BRILLO DE LA PARTIDA: 1».'], true)
        : say(['Un cartel escrito con símbolos rarísimos: ' + scramble('brillo de la partida uno') + '.', 'No es ningún idioma que conozcas… todavía.'], true);
    if (ch === 'K') return apply();
    if (ch === 'X') return say([applied ? 'La puerta está abierta.' : 'Una puerta cerrada. Se abre al aplicar los ajustes correctos.']);
  }

  function speakerLines() {
    if (volume === 0) return ['El altavoz está en silencio. Volumen 0.'];
    if (volume === 4) return ['¡¡KRRRRZZZZ!! Está tan alto que solo se oye distorsión.'];
    if (!subs) return ['BZZZ… FSSHH… mmmh… Suena como una voz, pero no se entiende. Si hubiera subtítulos…'];
    return [
      '[SUBTÍTULOS] Psst… El cartel del fondo no está roto: está en el idioma que nadie entiende.',
      '[SUBTÍTULOS] Y si subes el brillo del todo, verás lo que escribieron en el suelo.',
    ];
  }

  function apply() {
    if (applied) return say(['Los ajustes ya están guardados.'], true);
    const ok = l.vals.every((v, i) => v === OPTIONS_GOAL[i]);
    if (!ok) {
      sfx('no');
      return say(['APLICAR… «Ajustes rechazados. El juego no quiere arrancar con esta configuración».']);
    }
    backstage.complete('ajustes');
    sfx('ok');
    say(['APLICAR… AJUSTES GUARDADOS.', 'En la pared de la derecha, junto al cartel, se abre una puerta con un chasquido.'], true);
  }

  // Dibujo
  let drawX = backstage.s.l3.x * TILE;
  let drawY = backstage.s.l3.y * TILE;

  function render(g: CanvasRenderingContext2D, t: number) {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        g.drawImage(tileO('floor'), x * TILE, y * TILE);
        const ch = at(x, y);
        const name = ch === '#' ? 'wall' : ch === 'l' ? 'panel' : ch === '=' ? 'rail' : ch === 'A' ? 'speaker' : ch === 'Z' ? 'sign' : ch === 'K' ? 'apply' : ch === 'X' ? (applied ? 'exitOpen' : 'exitShut') : null;
        if (name) g.drawImage(tileO(name as 'wall'), x * TILE, y * TILE);
      }
    }
    drawText(g, lang === 1 ? scramble('opciones').replace(/./g, '?') : 'OPCIONES', 64, 5, '#e0e3ea');
    drawText(g, 'APLICAR', 84, 130, '#6cff6c');

    // Carriles: nombre, tirador y valor
    SETTINGS.forEach((s, i) => {
      const y = s.row * TILE;
      drawText(g, lang === 1 ? '?'.repeat(s.label.length) : s.label, 10, y + 2, '#8a8f9c');
      g.drawImage(tileO('handle'), (RAIL_X + l.vals[i]) * TILE, y);
      drawText(g, s.values[l.vals[i]], 112, y + 2, '#ffd23f');
    });

    // Lo que solo se ve con el brillo al máximo
    if (bright === 4) {
      drawText(g, 'VOLUMEN: CUENTA LOS ALTAVOCES', 22, 21, '#ff9a3c');
    }

    // Ondas del altavoz si suena
    if (volume > 0 && !calm) {
      const k = Math.floor(t / 200) % 3;
      g.fillStyle = volume === 4 ? '#ff5555' : '#4fc3f7';
      for (const [ax, ay] of [[1, 2], [18, 2], [18, 15]]) g.fillRect(ax * TILE + 3 - k, ay * TILE + 9 + k, 2 + 2 * k, 1);
    }

    drawX += (l.x * TILE - drawX) * 0.4;
    drawY += (l.y * TILE - drawY) * 0.4;
    const leo = { up: 'leoUp', down: 'leoDown', left: 'leoLeft', right: 'leoRight' }[l.dir] as 'leoUp';
    g.drawImage(spriteO(leo), Math.round(drawX), Math.round(drawY));

    // El brillo afecta a toda la pantalla: de casi negro a quemado
    const veil = [0.86, 0.55, 0.3, 0.08, 0][bright];
    if (veil) {
      g.fillStyle = `rgba(0, 0, 0, ${veil})`;
      g.fillRect(0, 0, 160, 144);
    }
    if (bright === 4) {
      g.fillStyle = 'rgba(255, 255, 255, 0.28)';
      g.fillRect(0, 0, 160, 144);
    }
    if (!applied) drawText(g, 'R: RESTABLECER', 100, 138, '#4fc3f7');

    if (!calm && !applied && Math.floor(t / 140) % 31 === 0) {
      const band = (Math.floor(t / 4340) * 37) % 128;
      g.drawImage(g.canvas, 0, band, 160, 4, 2, band, 160, 4);
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
  theme="b3"
  onmove={move}
  oninteract={interact}
  onreset={reset}
  resetLabel={applied ? '' : 'Restablecer los ajustes'}
  label="Opciones. Brillo {SETTINGS[0].values[bright]}, volumen {SETTINGS[1].values[volume]}, idioma {SETTINGS[2].values[lang]}, subtítulos {SETTINGS[3].values[subs]}. Leo está en la casilla {l.x}, {l.y}, mirando hacia {DIR_ES[l.dir]}."
  attrs={{
    screen: 'opciones',
    x: l.x,
    y: l.y,
    dir: l.dir,
    facing,
    vals: l.vals.join(''),
    applied: applied ? 'si' : 'no',
  }}
/>
