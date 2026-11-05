<script lang="ts">
  import { faraon, toHieroglyphs } from '../state.svelte';
  import { sfx } from '../audio';

  // El saco pesa 23 deben. Pesas disponibles: 1, 2, 4, 8 y 16.
  const SACK = 23;
  const WEIGHTS = [16, 8, 4, 2, 1];

  const solved = $derived(faraon.isDone('balanza'));
  let onPan = $state<number[]>([]);
  const total = $derived(onPan.reduce((a, b) => a + b, 0));
  // Inclinación de la balanza: el saco baja si las pesas no llegan
  const tilt = $derived(solved ? 0 : Math.max(-14, Math.min(14, (SACK - total) * 1.2)));
  let balanced = $state(false);

  function toggle(w: number) {
    if (solved || balanced) return;
    sfx('click');
    onPan = onPan.includes(w) ? onPan.filter((x) => x !== w) : [...onPan, w];
    if (onPan.reduce((a, b) => a + b, 0) === SACK) {
      balanced = true;
      setTimeout(() => {
        sfx('ok');
        faraon.complete('balanza');
        faraon.give('ostracon');
      }, 900);
    }
  }
</script>

<div class="wrap">
  <p class="speech">
    {#if solved}
      «¡Por Thot, qué buen ojo! Toma, este ostracón viejo es tuyo. Me lo dejó el escriba de enfrente…
      dice que lo dibujó para no olvidar algo.»
    {:else}
      «Nadie sabe pesar en este mercado. Si equilibras mi saco de comino con mis pesas, te regalo lo
      que encontré esta mañana.»
    {/if}
  </p>

  <svg class="scale" viewBox="0 0 400 230" role="img" aria-label="Balanza: saco de {SACK} deben a la izquierda, pesas a la derecha, {total === SACK || solved ? 'equilibrada' : total < SACK ? 'el saco pesa más' : 'las pesas pesan más'}">
    <rect x="190" y="40" width="20" height="170" fill="#8d5a2b" />
    <rect x="140" y="205" width="120" height="16" rx="4" fill="#6b4220" />
    <g style="transform: rotate({-tilt}deg); transform-origin: 200px 50px" class="beam">
      <rect x="40" y="44" width="320" height="10" rx="5" fill="#c99a4a" />
      <circle cx="200" cy="50" r="10" fill="#e9b54a" />
      <!-- Plato izquierdo con el saco -->
      <g style="transform: rotate({tilt}deg); transform-origin: 60px 50px">
        <path d="M60 50 L30 130 M60 50 L90 130" stroke="#c99a4a" stroke-width="2" />
        <path d="M20 130 h80 q-6 16 -40 16 q-34 0 -40 -16z" fill="#c99a4a" />
        <path d="M34 128 q-4 -40 26 -48 q30 8 26 48z" fill="#b5803e" />
        <text x="60" y="118" text-anchor="middle" font-size="26" font-family="Noto Sans Egyptian Hieroglyphs" fill="#2a1408">{toHieroglyphs(SACK)}</text>
      </g>
      <!-- Plato derecho con las pesas -->
      <g style="transform: rotate({tilt}deg); transform-origin: 340px 50px">
        <path d="M340 50 L310 130 M340 50 L370 130" stroke="#c99a4a" stroke-width="2" />
        <path d="M300 130 h80 q-6 16 -40 16 q-34 0 -40 -16z" fill="#c99a4a" />
        {#each onPan.toSorted((a, b) => b - a) as w, k}
          <rect x={312 + (k % 3) * 20} y={116 - Math.floor(k / 3) * 14} width="18" height="13" rx="2" fill="#5d6b74" />
        {/each}
      </g>
    </g>
  </svg>

  <p class="reading" aria-live="polite">
    {#if solved || balanced}
      La balanza queda perfectamente nivelada.
    {:else}
      Pesas en el plato: {total ? `${total} deben` : 'ninguna'}
    {/if}
  </p>

  <div class="weights" role="group" aria-label="Pesas de piedra">
    {#each WEIGHTS as w}
      <button aria-label="{w} deben" aria-pressed={onPan.includes(w)} disabled={solved || balanced} onclick={() => toggle(w)} style="--s: {0.7 + Math.log2(w) * 0.12}">
        <span class="stone"></span>
        <span class="num" aria-hidden="true">{toHieroglyphs(w)}</span>
      </button>
    {/each}
  </div>

  {#if !solved && !balanced && onPan.length}
    <button class="reset" onclick={() => (onPan = [])}>Quitar todas las pesas</button>
  {/if}
</div>

<style>
  .wrap {
    display: grid;
    gap: 1.2rem;
    justify-items: center;
  }
  .speech {
    max-width: 36rem;
    font-size: 1.1rem;
    font-style: italic;
    line-height: 1.5;
  }
  .scale {
    width: min(100%, 30rem);
  }
  .beam,
  .beam g {
    transition: transform 0.6s cubic-bezier(0.3, 1.5, 0.5, 1);
  }
  .reading {
    color: var(--muted);
  }
  .weights {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.8rem;
  }
  .weights button {
    display: grid;
    justify-items: center;
    gap: 0.3rem;
    min-width: 4.6rem;
    padding: 0.6rem 0.5rem;
    border: 1px solid var(--line);
    border-radius: 0.5rem;
    background: rgb(0 0 0 / 0.2);
  }
  .weights button[aria-pressed='true'] {
    border-color: var(--accent);
    background: rgb(233 181 74 / 0.15);
  }
  .stone {
    width: calc(2.6rem * var(--s));
    height: calc(1.8rem * var(--s));
    border-radius: 0.3rem 0.3rem 0.5rem 0.5rem;
    background: linear-gradient(#7d8b94, #4d5960);
  }
  .num {
    font-family: var(--font-glyph);
    font-size: 1.7rem;
    line-height: 1;
    color: var(--accent);
  }
  .reset {
    border: 0;
    background: none;
    color: var(--muted);
    text-decoration: underline;
  }
</style>
