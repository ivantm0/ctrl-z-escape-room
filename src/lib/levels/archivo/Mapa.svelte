<script lang="ts">
  import { onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import Lock from '$lib/components/Lock.svelte';
  import type { LevelProps } from '..';

  let { onsolve }: LevelProps = $props();

  // Cada pestaña abierta en este nivel es un «lector». Se encuentran con BroadcastChannel.
  const WORD = 'LABERINTO';
  const peers = new SvelteSet<string>();
  const joined = $derived(peers.size > 0);

  onMount(() => {
    if (!('BroadcastChannel' in window)) return;
    const me = crypto.randomUUID();
    const ch = new BroadcastChannel('ctrl-escape:archivo');
    ch.onmessage = ({ data }) => {
      if (data.from === me) return;
      if (data.type === 'hola') {
        peers.add(data.from);
        ch.postMessage({ type: 'aqui', from: me });
      } else if (data.type === 'aqui') peers.add(data.from);
      else if (data.type === 'adios') peers.delete(data.from);
    };
    ch.postMessage({ type: 'hola', from: me });
    const bye = () => ch.postMessage({ type: 'adios', from: me });
    addEventListener('pagehide', bye);
    return () => {
      bye();
      removeEventListener('pagehide', bye);
      ch.close();
    };
  });
</script>

<div class="scene">
  <p class="lead">
    El mapa del archivo está partido por la mitad. «Hacen falta dos lectores para leerlo», dice una
    nota. Aquí solo estás tú… ¿o no?
  </p>

  <div class="map" class:joined>
    <svg viewBox="0 0 300 120" aria-hidden="true">
      <path d="M20 100 H80 V40 H140 V90 H200 V20 H280" fill="none" stroke="#8e2b17" stroke-width="3" stroke-dasharray="6 6" />
    </svg>
    <p class="word" aria-live="polite">
      {#each WORD as l, i}
        <span class:missing={!joined && i % 2 === 1}>{!joined && i % 2 === 1 ? '_' : l}</span>
      {/each}
    </p>
    <span class="tear" aria-hidden="true"></span>
  </div>

  <p class="readers">Lectores en el archivo: <strong>{peers.size + 1}</strong></p>

  <Lock answer="TEFCRVJJTlRP" label="¿Qué dice el mapa completo?" {onsolve} />
</div>

<style>
  .scene { display: grid; gap: 1.6rem; justify-items: start; }
  .lead { max-width: 42rem; font-size: 1.25rem; line-height: 1.5; font-style: italic; color: var(--muted); }
  .map {
    position: relative;
    width: min(100%, 36rem);
    padding: 1.5rem;
    background: #f3e4bf;
    box-shadow: 0 10px 30px rgb(51 35 15 / 0.25);
    clip-path: polygon(0 0, 55% 0, 50% 20%, 56% 45%, 49% 70%, 54% 100%, 0 100%);
    transition: clip-path 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .map.joined { clip-path: polygon(0 0, 100% 0, 100% 20%, 100% 45%, 100% 70%, 100% 100%, 0 100%); }
  svg { width: 100%; }
  .word { display: flex; justify-content: space-between; font-size: clamp(1.4rem, 5vw, 2.2rem); letter-spacing: 0.1em; }
  .missing { color: rgb(51 35 15 / 0.3); }
  .readers { font-size: 1rem; }
  strong { color: var(--accent); }
</style>
