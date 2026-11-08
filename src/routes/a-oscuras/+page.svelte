<script lang="ts">
  import { onMount } from 'svelte';
  import Game from '$lib/oscuras/Game.svelte';
  import TouchPad from '$lib/oscuras/TouchPad.svelte';
  import { device } from '$lib/device.svelte';

  // ?nivel=N (1-based) para saltar directamente a una galería mientras se diseñan
  let start = $state<number | null>(null);
  let intro = $state(true);
  onMount(() => {
    // Móvil o tableta: se añaden controles en pantalla (en escritorio no cambia nada)
    device.load();
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
  <h1>A Oscuras <small>La mina de Las Ánimas</small></h1>

  {#if intro}
    <section class="intro">
      <p class="date">Mina de Las Ánimas · 14 de marzo de 1923</p>
      <p>
        Los viejos del pueblo decían que la mina no se llamaba así por la capilla. Decían que, en las galerías más
        hondas, algo canta. Y que quien lo oye, baja.
      </p>
      <p>
        A las seis y diez de la mañana, una explosión derrumba la galería principal con cuarenta hombres dentro. En el
        pueblo dirán que fue el grisú.
      </p>
      <p>
        Tú eres Julián, el aprendiz. Tienes catorce años. Cuando abres los ojos solo hay polvo y una oscuridad tan
        espesa que casi se puede tocar. Y, muy abajo, algo que respira.
      </p>
      <p class="warn">Contiene sangre, cadáveres y escenas de terror.</p>
      <button type="button" onclick={() => (intro = false)}>Abrir los ojos</button>
    </section>
  {:else}
    <p class="tip keys">
      ← → / A D moverse · Espacio saltar (↑ también, salvo en escaleras) · ↑ ↓ trepar · E usar (lámpara, pico, palanca,
      leer) · Q bengala · R reiniciar galería
    </p>
    <p class="tip touch">◀ ▶ moverse · ⤒ saltar · ▲ ▼ trepar · E usar · Q bengala · ↺ reiniciar</p>
    {#if start !== null}
      <Game {start} />
    {/if}
    {#if device.touch}
      <TouchPad />
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
  .tip.touch {
    display: none;
  }
  /* Solo móvil y tableta (mismo criterio que $lib/device): en escritorio nada de esto aplica */
  @media (hover: none) and (pointer: coarse) {
    .tip.keys {
      display: none;
    }
    .tip.touch {
      display: block;
    }
    main {
      /* Hueco para los controles fijos de abajo */
      padding-bottom: 13rem;
      user-select: none;
      -webkit-user-select: none;
    }
    /* La mina no puede ser más alta que la pantalla menos los textos */
    main :global(.screen) {
      width: min(100%, calc((100dvh - 7rem) * 1.5));
    }
    /* Carteles y avisos más compactos para no tapar la mina */
    main :global(.banner) {
      top: 0.4rem;
      padding: 0.3rem 0.7rem;
      max-width: 92%;
    }
    main :global(.banner .bt) {
      font-size: 0.9rem;
    }
    main :global(.banner .bl),
    main :global(.hint) {
      font-size: 0.68rem;
    }
    main :global(.hint) {
      top: 0.4rem;
      padding: 0.4rem 0.6rem;
      width: 94%;
    }
  }
  /* Móvil en horizontal: se quita lo accesorio para que la mina ocupe la pantalla */
  @media (hover: none) and (pointer: coarse) and (orientation: landscape) and (max-height: 500px) {
    main {
      padding: 0.25rem 0.5rem;
      gap: 0.25rem;
    }
    h1,
    .tip {
      display: none;
    }
    main :global(.screen) {
      width: min(100%, calc((100dvh - 2.2rem) * 1.5));
    }
    main :global(.status) {
      font-size: 0.7rem;
    }
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
  .warn {
    font-size: 0.8rem;
    opacity: 0.65;
    font-style: italic;
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
