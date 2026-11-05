<script lang="ts">
  import { pushState } from '$app/navigation';
  import { page } from '$app/state';
  import { SvelteSet } from 'svelte/reactivity';
  import Lock from '$lib/components/Lock.svelte';
  import type { LevelProps } from '..';

  let { onsolve }: LevelProps = $props();

  // Cada pasillo es una entrada del historial (shallow routing). Las letras solo
  // aparecen cuando vuelves a un pasillo con el botón Atrás del navegador.
  const LETTERS = ['T', 'O', 'M', 'O'];
  // Pasillo 0 = entrada; las letras están en los pasillos 1-4 y el 5 es el fondo
  const LAST = LETTERS.length + 1;

  const pasillo = $derived(page.state.pasillo ?? 0);
  const revealed = new SvelteSet<number>();
  let prev = 0;

  $effect(() => {
    const n = pasillo;
    if (n < prev && n > 0) revealed.add(n);
    prev = n;
  });

  const forward = () => pushState('', { pasillo: pasillo + 1 });
</script>

<div class="scene">
  <p class="lead">
    Un pasillo largo, y otro, y otro. El bibliotecario dejó escrito: «En este archivo, los libros solo
    se leen al volver».
  </p>

  <div class="corridor" aria-live="polite">
    {#key pasillo}
      <div class="hall">
        <p class="num">Pasillo {pasillo + 1}</p>
        {#if pasillo === LAST}
          <p class="text">El fondo del archivo. Aquí no hay nada… salvo el camino de vuelta.</p>
        {:else if revealed.has(pasillo)}
          <p class="letter">{LETTERS[pasillo - 1]}</p>
          <p class="text">Al volver, una letra brilla en el lomo de un libro.</p>
        {:else if pasillo === 0}
          <p class="text">La entrada del archivo. Los pasillos se pierden en la penumbra.</p>
        {:else}
          <p class="text">Estanterías en silencio. Nada fuera de lugar.</p>
        {/if}
      </div>
    {/key}
  </div>

  <ol class="map" aria-label="Letras encontradas">
    {#each LETTERS as l, i}
      <li class:on={revealed.has(i + 1)} class:here={i + 1 === pasillo}>{revealed.has(i + 1) ? l : '·'}</li>
    {/each}
  </ol>

  {#if pasillo < LAST}
    <button class="go" onclick={forward}>Seguir avanzando →</button>
  {/if}

  <Lock answer="VE9NTw==" label="Palabra de los pasillos" {onsolve} />
</div>

<style>
  .scene { display: grid; gap: 1.6rem; justify-items: start; }
  .lead { max-width: 42rem; font-size: 1.25rem; line-height: 1.5; font-style: italic; color: var(--muted); }
  .corridor {
    width: min(100%, 40rem);
    height: 14rem;
    perspective: 600px;
  }
  .hall {
    display: grid;
    place-content: center;
    gap: 0.6rem;
    height: 100%;
    padding: 1.5rem;
    border: 1px solid var(--line);
    background:
      repeating-linear-gradient(90deg, rgb(91 61 30 / 0.12) 0 2px, transparent 2px 46px),
      radial-gradient(ellipse at center, #fbf5e6, #e2d2ad);
    text-align: center;
    animation: walk 0.6s ease-out;
  }
  .num { font-size: 0.85rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent); }
  .letter { font-size: 4rem; line-height: 1; color: var(--accent); text-shadow: 0 0 20px rgb(142 43 23 / 0.35); }
  .text { font-style: italic; }
  .map { display: flex; gap: 0.5rem; margin: 0; padding: 0; list-style: none; }
  .map li {
    display: grid;
    place-items: center;
    width: 2.6rem;
    height: 2.6rem;
    border: 1px dashed var(--line);
    font-size: 1.4rem;
    color: var(--muted);
  }
  .map li.on { border-style: solid; border-color: var(--accent); color: var(--accent); }
  .map li.here { outline: 2px solid var(--fg); outline-offset: 2px; }
  .go {
    padding: 0.7rem 1.3rem;
    border: 1px solid var(--fg);
    background: none;
    font-size: 1rem;
  }
  .go:hover { background: var(--fg); color: var(--bg); }
  @keyframes walk { from { opacity: 0; transform: translateZ(-120px); } }
  @media (prefers-reduced-motion: reduce) { .hall { animation: none; } }
</style>
