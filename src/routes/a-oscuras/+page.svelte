<script lang="ts">
  import { onMount } from 'svelte';
  import Game from '$lib/oscuras/Game.svelte';

  // ?nivel=N (1-based) para saltar directamente a un nivel mientras se diseñan
  let start = $state<number | null>(null);
  onMount(() => {
    const n = Number(new URLSearchParams(location.search).get('nivel'));
    start = Number.isFinite(n) && n > 0 ? n - 1 : 0;
  });
</script>

<svelte:head>
  <title>A oscuras · Ctrl + Escape</title>
</svelte:head>

<main>
  <h1>A oscuras <small>(prototipo)</small></h1>
  <p class="tip">← → / A D moverse · Espacio / ↑ saltar · E coger o soltar farol, usar palanca · Q encender bengala · R reiniciar nivel</p>
  {#if start !== null}
    <Game {start} />
  {/if}
</main>

<style>
  main {
    max-width: 1000px;
    margin: 0 auto;
    padding: 1.5rem 1rem;
    display: grid;
    gap: 1rem;
  }
  h1 {
    margin: 0;
  }
  small {
    font-size: 0.5em;
    opacity: 0.6;
  }
  .tip {
    margin: 0;
    opacity: 0.75;
    font-size: 0.9rem;
  }
</style>
