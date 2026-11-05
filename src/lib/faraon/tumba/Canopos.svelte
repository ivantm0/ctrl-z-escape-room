<script lang="ts">
  import { faraon } from '../state.svelte';
  import { sfx } from '../audio';

  // Los cuatro vasos se colocan alrededor de una rosa de los vientos
  const JARS = [
    { glyph: '𓃻', name: 'babuino' },
    { glyph: '𓃥', name: 'chacal' },
    { glyph: '𓀀', name: 'humano' },
    { glyph: '𓅃', name: 'halcón' },
  ];
  const DIRS = ['Norte', 'Este', 'Sur', 'Oeste'];
  const solved = $derived(faraon.isDone('canopos'));
  // order[direction] = jar; correcto: babuino N, chacal E, humano S, halcón O
  let order = $state([3, 2, 1, 0]);
  let picked = $state<number | null>(null);
  let message = $state('');

  function touch(d: number) {
    if (solved) return;
    sfx('click');
    if (picked === null) picked = d;
    else {
      if (picked !== d) [order[picked], order[d]] = [order[d], order[picked]];
      picked = null;
    }
  }

  function seal() {
    if (order.every((j, d) => j === d)) {
      sfx('stone');
      message = 'Los cuatro vasos encajan en su sitio con un chasquido. Desde el sarcófago llega el ruido de un cerrojo que se abre.';
      faraon.complete('canopos');
    } else {
      sfx('no');
      const right = order.filter((j, d) => j === d).length;
      message = `La repisa tiembla y nada más. ${right ? `Solo ${right === 1 ? 'un guardián está' : `${right} guardianes están`} en su sitio.` : 'Ningún guardián está en su sitio.'}`;
    }
  }

  const shown = $derived(solved ? [0, 1, 2, 3] : order);
</script>

<div class="wrap">
  <p class="lead">
    Cuatro vasos canopos con tapas en forma de cabeza descansan alrededor de una rosa de los vientos
    tallada en la repisa. Alguien los ha cambiado de sitio.
  </p>

  <div class="compass" role="group" aria-label="Rosa de los vientos con los vasos">
    <span class="rose" aria-hidden="true">✦</span>
    {#each DIRS as dir, d}
      <button
        class="jar jar-{d}"
        class:picked={picked === d}
        disabled={solved}
        onclick={() => touch(d)}
        aria-label="{dir}: vaso del {JARS[shown[d]].name}{picked === d ? ' (seleccionado)' : ''}"
      >
        <span class="dir" aria-hidden="true">{dir}</span>
        <span class="g" aria-hidden="true">{JARS[shown[d]].glyph}</span>
      </button>
    {/each}
  </div>

  <p class="msg" aria-live="polite">{message || (solved ? 'Los guardianes ya están en su sitio.' : 'Toca dos vasos para intercambiarlos.')}</p>

  {#if !solved}
    <button class="seal" onclick={seal}>Sellar los vasos</button>
  {/if}
</div>

<style>
  .wrap {
    display: grid;
    gap: 1.2rem;
    justify-items: center;
  }
  .lead {
    max-width: 38rem;
    font-size: 1.1rem;
    font-style: italic;
    line-height: 1.6;
  }
  .compass {
    position: relative;
    display: grid;
    grid-template-areas: '. n .' 'o r e' '. s .';
    grid-template-columns: repeat(3, minmax(0, 6.5rem));
    gap: 0.4rem;
    place-items: center;
  }
  .rose {
    grid-area: r;
    font-size: 3rem;
    color: var(--accent);
  }
  .jar-0 { grid-area: n; }
  .jar-1 { grid-area: e; }
  .jar-2 { grid-area: s; }
  .jar-3 { grid-area: o; }
  .jar {
    display: grid;
    justify-items: center;
    gap: 0.2rem;
    width: 100%;
    padding: 0.5rem 0.2rem 0.8rem;
    border: 3px solid transparent;
    border-radius: 2.5rem 2.5rem 1rem 1rem;
    background: linear-gradient(#e6d6b0, #c9b48a);
    color: #3a2410;
    transition: transform 0.2s, border-color 0.2s;
  }
  .jar.picked {
    border-color: var(--accent);
    transform: translateY(-5px);
    box-shadow: 0 10px 24px rgb(233 181 74 / 0.45);
  }
  .dir {
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .g {
    font-family: var(--font-glyph);
    font-size: 2.4rem;
  }
  .msg {
    min-height: 1.6em;
    max-width: 36rem;
    text-align: center;
    color: var(--muted);
  }
  .seal {
    padding: 0.75rem 1.4rem;
    border: 1px solid var(--accent);
    border-radius: 999px;
    background: var(--accent);
    color: var(--accent-ink);
    font-family: var(--font-display);
    font-weight: 700;
  }
</style>
