<script lang="ts" module>
  import type { Component } from 'svelte';

  /** Zona clicable en coordenadas de la ilustración (1600 × 900) */
  export type Spot = {
    id: string;
    label: string;
    title: string;
    x: number;
    y: number;
    w: number;
    h: number;
    view: Component;
    done?: boolean;
    /** Posición de la etiqueta flotante */
    tagBelow?: boolean;
  };
</script>

<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { sfx } from './audio';
  import Closeup from './Closeup.svelte';

  // Escena ilustrada con zonas que se abren en primer plano
  let {
    spots,
    art,
    reveal = false,
    closed = false,
    light = 0,
  }: {
    spots: Spot[];
    art: Snippet;
    reveal?: boolean;
    closed?: boolean;
    /** Escena a oscuras: radio de la luz (en % del ancho) que sigue al puntero. 0 = sin oscuridad */
    light?: number;
  } = $props();

  // Posición de la luz, en % de la escena
  let lx = $state(50);
  let ly = $state(55);
  function moveLight(e: PointerEvent) {
    if (!light) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    lx = ((e.clientX - r.left) / r.width) * 100;
    ly = ((e.clientY - r.top) / r.height) * 100;
  }

  let open = $state<{ spot: Spot; origin: { x: number; y: number } } | null>(null);
  let viewport: HTMLDivElement;

  function inspect(spot: Spot, e: MouseEvent) {
    sfx('click');
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    open = { spot, origin: { x: r.left + r.width / 2, y: r.top + r.height / 2 } };
  }

  // Al terminar el capítulo se cierra cualquier primer plano
  $effect(() => {
    if (closed) open = null;
  });

  onMount(() => {
    // En pantallas estrechas la escena se desplaza: se empieza centrada
    viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;
  });

  const pct = (v: number, total: number) => `${(v / total) * 100}%`;
</script>

<div class="viewport" bind:this={viewport}>
  <div class="scene" class:reveal role="presentation" onpointermove={moveLight} onpointerdown={moveLight}>
    <!-- La ilustración la aporta cada escena como un <svg> de 1600 × 900 -->
    <div class="art">{@render art()}</div>
    {#if light}
      <!-- Oscuridad: solo se ve lo que alumbra la luz -->
      <div class="dark" aria-hidden="true" style="--lx: {lx}%; --ly: {ly}%; --r: {light}"></div>
    {/if}

    {#each spots as spot}
      <button
        class="spot"
        class:done={spot.done}
        class:below={spot.tagBelow}
        style="left: {pct(spot.x, 1600)}; top: {pct(spot.y, 900)}; width: {pct(spot.w, 1600)}; height: {pct(spot.h, 900)}"
        aria-label={spot.label}
        onclick={(e) => inspect(spot, e)}
      >
        <span class="tag">{spot.label}</span>
      </button>
    {/each}
  </div>
</div>

{#if open}
  {@const View = open.spot.view}
  <Closeup title={open.spot.title} origin={open.origin} onclose={() => (open = null)}>
    <View />
  </Closeup>
{/if}

<style>
  .viewport {
    width: 100%;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: thin;
  }
  .scene {
    position: relative;
    width: max(100%, 56rem);
    max-width: calc((100dvh - 8.5rem) * 16 / 9);
    min-width: 56rem;
    margin: 0 auto;
    aspect-ratio: 16 / 9;
  }
  @media (max-width: 56rem) {
    .scene {
      max-width: none;
    }
  }
  .art,
  .art :global(svg) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .dark {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(
      /* Elipse que en 16:9 se ve como un círculo */
      ellipse calc(var(--r) * 1%) calc(var(--r) * 1.778%) at var(--lx) var(--ly),
      rgb(255 170 80 / 0.06) 0,
      rgb(10 5 2 / 0.55) 55%,
      rgb(6 3 1 / 0.97) 100%
    );
    transition: background 0.05s;
  }
  .spot {
    position: absolute;
    z-index: 1;
    padding: 0;
    border: 2px solid transparent;
    border-radius: 0.6rem;
    background: transparent;
    cursor: zoom-in;
    transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
  }
  .spot:hover,
  .spot:focus-visible,
  .reveal .spot {
    border-color: rgb(233 181 74 / 0.85);
    background: rgb(233 181 74 / 0.08);
    box-shadow: 0 0 30px rgb(233 181 74 / 0.35);
  }
  .spot.done {
    border-style: dashed;
  }
  .tag {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 6px);
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    background: rgb(26 16 9 / 0.9);
    color: var(--accent);
    font-family: var(--font-display);
    font-size: 0.8rem;
    white-space: nowrap;
    opacity: 0;
    transform: translate(-50%, 4px);
    transition: opacity 0.2s, transform 0.2s;
    pointer-events: none;
  }
  .below .tag {
    bottom: auto;
    top: calc(100% + 6px);
  }
  .spot:hover .tag,
  .spot:focus-visible .tag,
  .reveal .tag {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  :global(.bird) {
    animation: fly 14s linear infinite;
  }
  :global(.palm) {
    animation: sway 5s ease-in-out infinite alternate;
  }
  :global(.tail) {
    transform-origin: 10px 26px;
    animation: tail 2.5s ease-in-out infinite alternate;
  }
  @keyframes fly {
    to {
      transform: translateX(260px);
    }
  }
  @keyframes sway {
    to {
      rotate: 1.5deg;
    }
  }
  @keyframes tail {
    to {
      transform: rotate(18deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    :global(.bird),
    :global(.palm),
    :global(.tail) {
      animation: none;
    }
  }
</style>
