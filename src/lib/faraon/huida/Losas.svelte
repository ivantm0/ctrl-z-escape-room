<script lang="ts">
  import { faraon } from '../state.svelte';
  import { sfx } from '../audio';

  // Suelo que se hunde: solo aguantan las losas con el ankh (la vida)
  let { onpenalty }: { onpenalty: () => void } = $props();

  const A = '𓋹';
  // Fila 0 = la más lejana (salida); fila 3 = la más cercana (entrada)
  const GRID = [
    ['𓆙', '𓆊', A, '𓂀', '𓆙'],
    ['𓂀', A, A, '𓆊', '𓂀'],
    ['𓆊', A, '𓆙', '𓂀', '𓆊'],
    ['𓆙', A, A, A, '𓂀'],
  ];
  const NAMES: Record<string, string> = { [A]: 'ankh', '𓆙': 'cobra', '𓆊': 'cocodrilo', '𓂀': 'ojo' };
  const ROWS = GRID.length;
  const COLS = GRID[0].length;

  let pos = $state<[number, number] | null>(null);
  let crumbled = $state<string | null>(null);
  let message = $state('Entra en el suelo por la fila más cercana.');

  const reachable = (r: number, c: number) => {
    if (!pos) return r === ROWS - 1;
    const [pr, pc] = pos;
    return Math.abs(pr - r) + Math.abs(pc - c) === 1;
  };

  function step(r: number, c: number) {
    if (!reachable(r, c) || faraon.isDone('losas')) return;
    if (GRID[r][c] !== A) {
      sfx('no');
      onpenalty();
      crumbled = `${r}-${c}`;
      setTimeout(() => (crumbled = null), 700);
      pos = null;
      message = `¡La losa del ${NAMES[GRID[r][c]]} se hunde! Vuelves de un salto al principio.`;
      return;
    }
    sfx('click');
    pos = [r, c];
    message = r === 0 ? '¡Al otro lado!' : 'La losa aguanta.';
    if (r === 0) setTimeout(() => faraon.complete('losas'), 600);
  }
</script>

<div class="stage">
  <p class="lead">
    El suelo de la galería se desmorona. En cada losa hay un símbolo tallado, y en el umbral, una
    advertencia: <em>«Solo la vida sostiene tus pasos.»</em>
  </p>

  <p class="exit" aria-hidden="true">↑ Salida</p>
  <div class="floor" role="grid" aria-label="Losas del suelo">
    {#each GRID as row, r}
      <div role="row" class="row">
        {#each row as glyph, c}
          {@const here = pos?.[0] === r && pos?.[1] === c}
          <button
            role="gridcell"
            class="tile"
            class:here
            class:can={reachable(r, c)}
            class:crumble={crumbled === `${r}-${c}`}
            onclick={() => step(r, c)}
            aria-label="Losa fila {ROWS - r}, columna {c + 1}: {NAMES[glyph]}{here ? ' (estás aquí)' : ''}"
          >
            <span aria-hidden="true">{glyph}</span>
            {#if here}<span class="you" aria-hidden="true"></span>{/if}
          </button>
        {/each}
      </div>
    {/each}
  </div>
  <p class="exit" aria-hidden="true">↓ Entrada</p>

  <p class="msg" aria-live="polite">{message}</p>
</div>

<style>
  .stage {
    display: grid;
    gap: 0.8rem;
    justify-items: center;
  }
  .lead {
    max-width: 40rem;
    font-size: 1.1rem;
    font-style: italic;
    line-height: 1.6;
    text-align: center;
  }
  .exit {
    font-family: var(--font-display);
    font-size: 0.85rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .floor {
    display: grid;
    gap: 5px;
    padding: 5px;
    background: #0b0603;
    transform: perspective(800px) rotateX(18deg);
  }
  .row {
    display: grid;
    grid-template-columns: repeat(5, clamp(3rem, 14vw, 4.4rem));
    gap: 5px;
  }
  .tile {
    position: relative;
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    padding: 0;
    border: 2px solid transparent;
    background: linear-gradient(135deg, #8a6a46, #6b4e30);
    color: #2a1a0e;
    font-family: var(--font-glyph);
    font-size: clamp(1.4rem, 5vw, 2rem);
    transition: transform 0.2s, border-color 0.2s;
  }
  .tile.can:hover {
    border-color: var(--accent);
  }
  .tile.here {
    border-color: var(--accent);
    background: linear-gradient(135deg, #c99a4a, #8a6a36);
  }
  .you {
    position: absolute;
    width: 40%;
    height: 40%;
    border-radius: 50%;
    background: #ffd98a;
    box-shadow: 0 0 14px #ffcf6b;
  }
  .crumble {
    animation: crumble 0.7s ease-in forwards;
  }
  .msg {
    min-height: 1.6em;
    max-width: 36rem;
    text-align: center;
    color: var(--muted);
  }
  @keyframes crumble {
    to {
      transform: translateY(40px) scale(0.6) rotate(12deg);
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .crumble {
      animation: none;
    }
  }
</style>
