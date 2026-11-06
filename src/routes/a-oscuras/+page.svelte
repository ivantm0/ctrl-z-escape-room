<script lang="ts">
  import { onMount } from 'svelte';
  import Game from '$lib/oscuras/Game.svelte';

  // ?nivel=N (1-based) para saltar directamente a una galería mientras se diseñan
  let start = $state<number | null>(null);
  let intro = $state(true);
  onMount(() => {
    const n = Number(new URLSearchParams(location.search).get('nivel'));
    start = Number.isFinite(n) && n > 0 ? n - 1 : 0;
    // Con ?nivel= se salta la introducción
    if (n > 0) intro = false;
  });
</script>

<svelte:head>
  <title>A Oscuras · Ctrl + Escape</title>
</svelte:head>

<main>
  <h1>A Oscuras <small>La mina</small></h1>

  {#if intro}
    <section class="intro">
      <p class="date">nMina · 14 de marzo de 1923</p>
      <p>
        A las seis y diez de la mañana, una bolsa de grisú revienta en la galería principal. El techo se viene abajo
        con cuarenta hombres dentro.
      </p>
      <p>
        Tú eres Julián, el aprendiz. Tienes catorce años y es tu tercera semana bajo tierra. Cuando abres los ojos solo
        hay polvo, silencio y una oscuridad tan espesa que casi se puede tocar.
      </p>
      <p>
        El aire no va a durar siempre. Hay que subir, galería a galería, hasta la boca de la mina. Por el camino
        encontrarás lo que dejaron los que no lo consiguieron.
      </p>
      <button type="button" onclick={() => (intro = false)}>Abrir los ojos</button>
    </section>
  {:else}
    <p class="tip">
      ← → / A D moverse · Espacio saltar (↑ también, salvo en escaleras) · ↑ ↓ trepar · E usar (lámpara, pico, palanca,
      leer) · Q bengala · R reiniciar galería
    </p>
    {#if start !== null}
      <Game {start} />
    {/if}
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
    display: block;
    font-size: 0.45em;
    font-weight: 500;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #c9a227;
  }
  .tip {
    margin: 0;
    opacity: 0.75;
    font-size: 0.9rem;
  }
  .intro {
    max-width: 40rem;
    display: grid;
    gap: 0.9rem;
    padding: 1.5rem;
    background: #120e0c;
    color: #e8dcc6;
    border-left: 3px solid #c9a227;
    border-radius: 4px;
    line-height: 1.6;
  }
  .intro p {
    margin: 0;
  }
  .date {
    font-size: 0.8rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #c9a227;
  }
  button {
    justify-self: start;
    margin-top: 0.4rem;
    padding: 0.6rem 1.2rem;
    font: inherit;
    font-weight: 700;
    color: #120e0c;
    background: #c9a227;
    border: 0;
    border-radius: 3px;
    cursor: pointer;
  }
  button:hover {
    background: #e0b93a;
  }
  button:focus-visible {
    outline: 2px solid #f0e2c8;
    outline-offset: 3px;
  }
</style>
