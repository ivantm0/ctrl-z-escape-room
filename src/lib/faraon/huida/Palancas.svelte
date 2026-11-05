<script lang="ts">
  import { faraon } from '../state.svelte';
  import { sfx } from '../audio';

  // Simon: las placas del techo se encienden en orden; hay que repetirlo en las palancas
  let { onpenalty }: { onpenalty: () => void } = $props();

  const PLATES = [
    { glyph: '𓇳', name: 'sol' },
    { glyph: '𓅞', name: 'ibis' },
    { glyph: '𓃢', name: 'chacal' },
    { glyph: '𓆣', name: 'escarabajo' },
  ];
  const LENGTH = 5;
  const makeSequence = () => Array.from({ length: LENGTH }, () => Math.floor(Math.random() * PLATES.length));

  let sequence = $state(makeSequence());
  let lit = $state<number | null>(null);
  let playing = $state(false);
  let seen = $state(false);
  let input = $state<number[]>([]);
  let announce = $state('');
  let message = $state('');

  async function play() {
    playing = true;
    input = [];
    message = '';
    announce = `Se iluminan: ${sequence.map((p) => PLATES[p].name).join(', ')}.`;
    for (const p of sequence) {
      lit = p;
      sfx('click');
      await new Promise((r) => setTimeout(r, 550));
      lit = null;
      await new Promise((r) => setTimeout(r, 200));
    }
    playing = false;
    seen = true;
  }

  function pull(p: number) {
    if (playing || !seen) return;
    sfx('stone');
    input = [...input, p];
    const k = input.length - 1;
    if (input[k] !== sequence[k]) {
      sfx('no');
      onpenalty();
      message = '¡Palanca equivocada! El techo da un tirón hacia abajo. Mira la secuencia otra vez.';
      sequence = makeSequence();
      seen = false;
      input = [];
      return;
    }
    if (input.length === sequence.length) {
      sfx('ok');
      message = 'Los bloques del techo se detienen con un crujido. ¡Adelante!';
      setTimeout(() => faraon.complete('palancas'), 700);
    }
  }
</script>

<div class="stage">
  <p class="lead">
    Los bloques del techo bajan hacia ti. Arriba, cuatro placas de bronce; en la pared, cuatro palancas
    con los mismos símbolos.
  </p>

  <div class="ceiling" aria-hidden="true">
    {#each PLATES as plate, p}
      <span class="plate" class:lit={lit === p}>{plate.glyph}</span>
    {/each}
  </div>
  <p class="sr-only" aria-live="polite">{announce}</p>

  <div class="progress" aria-label="Palancas acertadas: {input.length} de {LENGTH}">
    {#each Array(LENGTH) as _, k}<span class:on={k < input.length}></span>{/each}
  </div>

  <div class="levers" role="group" aria-label="Palancas">
    {#each PLATES as plate, p}
      <button class="lever" disabled={playing || !seen} onclick={() => pull(p)} aria-label="Palanca del {plate.name}">
        <span class="g" aria-hidden="true">{plate.glyph}</span>
        <span class="handle" aria-hidden="true"></span>
      </button>
    {/each}
  </div>

  <p class="msg" aria-live="polite">{message}</p>

  {#if !seen || playing}
    <button class="act" onclick={play} disabled={playing}>{playing ? 'Mirando…' : 'Ver la secuencia'}</button>
  {/if}
</div>

<style>
  .stage {
    display: grid;
    gap: 1.2rem;
    justify-items: center;
  }
  .lead {
    max-width: 40rem;
    font-size: 1.1rem;
    font-style: italic;
    line-height: 1.6;
    text-align: center;
  }
  .ceiling {
    display: flex;
    gap: clamp(0.6rem, 3vw, 1.4rem);
    padding: 1rem 1.4rem;
    border-bottom: 6px solid #2a1a0e;
    background: #4a3018;
  }
  .plate {
    display: grid;
    place-items: center;
    width: clamp(3.4rem, 12vw, 4.6rem);
    aspect-ratio: 1;
    border-radius: 0.4rem;
    background: #6b4a2a;
    color: #2a1a0e;
    font-family: var(--font-glyph);
    font-size: clamp(1.8rem, 6vw, 2.6rem);
    transition: background 0.15s, box-shadow 0.15s, color 0.15s;
  }
  .plate.lit {
    background: #ffd98a;
    color: #5a2c10;
    box-shadow: 0 0 30px #ffcf6b;
  }
  .progress {
    display: flex;
    gap: 0.4rem;
  }
  .progress span {
    width: 1.6rem;
    height: 0.4rem;
    background: var(--line);
  }
  .progress span.on {
    background: var(--accent);
  }
  .levers {
    display: flex;
    gap: clamp(0.6rem, 3vw, 1.4rem);
  }
  .lever {
    display: grid;
    justify-items: center;
    gap: 0.4rem;
    width: clamp(3.4rem, 12vw, 4.6rem);
    padding: 0.6rem 0;
    border: 1px solid var(--line);
    border-radius: 0.5rem;
    background: rgb(0 0 0 / 0.3);
  }
  .lever:not(:disabled):hover {
    border-color: var(--accent);
  }
  .lever:not(:disabled):active .handle {
    transform: rotate(40deg);
  }
  .lever:disabled {
    opacity: 0.45;
  }
  .g {
    font-family: var(--font-glyph);
    font-size: 1.6rem;
    color: var(--accent);
  }
  .handle {
    width: 0.4rem;
    height: 2.2rem;
    border-radius: 0.2rem;
    background: linear-gradient(#c99a4a, #6b4220);
    transform-origin: bottom;
    transform: rotate(-30deg);
    transition: transform 0.15s;
  }
  .msg {
    min-height: 1.6em;
    max-width: 36rem;
    text-align: center;
    color: var(--muted);
  }
  .act {
    padding: 0.75rem 1.4rem;
    border: 1px solid var(--accent);
    border-radius: 999px;
    background: var(--accent);
    color: var(--accent-ink);
    font-family: var(--font-display);
    font-weight: 700;
  }
</style>
