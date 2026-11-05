<script lang="ts">
  import { faraon } from '../state.svelte';
  import { sfx } from '../audio';

  // Cuatro paneles del Juicio de Osiris: hay que ordenarlos intercambiándolos
  const PANELS = [
    { id: 'guia', glyph: '𓃢', title: 'Anubis guía al difunto' },
    { id: 'balanza', glyph: '𓄣', title: 'El corazón en la balanza' },
    { id: 'escriba', glyph: '𓅞', title: 'Thot escribe el veredicto' },
    { id: 'rey', glyph: '𓀭', title: 'Osiris en su trono' },
  ];
  const solved = $derived(faraon.isDone('fresco'));
  // Orden inicial desordenado
  let order = $state([2, 3, 0, 1]);
  let picked = $state<number | null>(null);
  let message = $state('');

  function touch(slot: number) {
    if (solved) return;
    sfx('click');
    if (picked === null) {
      picked = slot;
      return;
    }
    if (picked !== slot) {
      [order[picked], order[slot]] = [order[slot], order[picked]];
    }
    picked = null;
    if (order.every((p, k) => p === k)) {
      sfx('stone');
      message = 'Al colocar el último panel, una piedra del zócalo se desliza: en el hueco descansa una pluma blanca.';
      faraon.complete('fresco');
      faraon.give('pluma');
    }
  }

  const shown = $derived(solved ? [0, 1, 2, 3] : order);
</script>

<div class="wrap">
  <p class="caption">
    Inscripción del marco: <em>«Primero, <strong>el guía</strong>. Después, <strong>la balanza</strong>.
    Luego, <strong>el escriba</strong>. Y al final, <strong>el rey</strong> que recibe a los justos.»</em>
  </p>

  <div class="fresco" role="group" aria-label="Paneles del fresco">
    {#each shown as p, slot}
      <button
        class="panel"
        class:picked={picked === slot}
        disabled={solved}
        onclick={() => touch(slot)}
        aria-label="Panel {slot + 1}: {PANELS[p].title}{picked === slot ? ' (seleccionado)' : ''}"
      >
        <span class="g" aria-hidden="true">{PANELS[p].glyph}</span>
        <span class="t">{PANELS[p].title}</span>
      </button>
    {/each}
  </div>

  <p class="msg" aria-live="polite">
    {message || (solved ? 'El fresco ya está en orden.' : picked !== null ? 'Elige otro panel para intercambiarlos.' : 'Toca dos paneles para intercambiarlos.')}
  </p>
</div>

<style>
  .wrap {
    display: grid;
    gap: 1.2rem;
  }
  .caption {
    font-size: 1.05rem;
    line-height: 1.6;
  }
  strong {
    color: var(--accent);
    font-weight: 500;
  }
  .fresco {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
    padding: 6px;
    border-radius: 0.4rem;
    background: #1d3f8a;
  }
  .panel {
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 0.6rem;
    min-height: 11rem;
    padding: 0.8rem 0.4rem;
    border: 3px solid transparent;
    background: linear-gradient(#e2c693, #c9a66a);
    color: #3a1a08;
    transition: transform 0.2s, border-color 0.2s;
  }
  .panel:not(:disabled):hover {
    transform: translateY(-3px);
  }
  .panel.picked {
    border-color: var(--accent);
    transform: translateY(-6px);
    box-shadow: 0 10px 30px rgb(233 181 74 / 0.4);
  }
  .g {
    font-family: var(--font-glyph);
    font-size: clamp(2.4rem, 7vw, 3.6rem);
  }
  .t {
    font-size: clamp(0.72rem, 2vw, 0.9rem);
    line-height: 1.3;
    text-align: center;
  }
  .msg {
    min-height: 1.6em;
    text-align: center;
    color: var(--muted);
  }
</style>
