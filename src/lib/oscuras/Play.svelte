<script lang="ts">
  /**
   * Página de «A Oscuras»: introducción, continuar, ayuda de controles (según la etapa en la
   * que estés) y controles táctiles (solo en móvil). Los 100 niveles son una sola campaña.
   */
  import { onMount } from 'svelte';
  import Game from './Game.svelte';
  import TouchPad from './TouchPad.svelte';
  import { campaign } from './campaign';
  import { oscuras } from './progress.svelte';
  import { device } from '$lib/device.svelte';

  let start = $state(0);
  let playing = $state(false);
  let ready = $state(false);
  /** Con ?nivel=N (1–100, para diseñar) se salta la introducción y no se guarda el progreso */
  let testing = $state(false);
  /** Nivel en el que estás ahora (para la ayuda de controles) */
  let current = $state(0);

  const theme = $derived(campaign[current]?.theme ?? 'mina');
  const dead = $derived(theme === 'muerto' || theme === 'pueblo');

  onMount(() => {
    // Móvil o tableta: se añaden controles en pantalla (en escritorio no cambia nada)
    device.load();
    oscuras.load();
    const n = Number(new URLSearchParams(location.search).get('nivel'));
    if (Number.isFinite(n) && n > 0) {
      testing = true;
      start = current = Math.min(n, campaign.length) - 1;
      playing = true;
    }
    ready = true;
  });

  function begin(from: number) {
    start = current = from;
    playing = true;
  }
</script>

<main>
  <h1>A Oscuras <small>La mina de Las Ánimas</small></h1>

  {#if !ready}
    <p class="tip">Cargando…</p>
  {:else if !playing}
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
      <p class="warn">Contiene sangre, cadáveres, canibalismo explícito y escenas de terror.</p>
      <div class="actions">
        {#if oscuras.s.level > 0}
          <button type="button" onclick={() => begin(oscuras.s.level)}>Continuar · nivel {oscuras.s.level + 1}</button>
          <button type="button" class="secondary" onclick={() => begin(0)}>Empezar de nuevo</button>
        {:else}
          <button type="button" onclick={() => begin(0)}>Abrir los ojos</button>
        {/if}
      </div>
    </section>
  {:else}
    {#if dead}
      <p class="tip keys">
        ← → / A D moverse · Espacio saltar · ↑ ↓ trepar · E comer, apagar velas, reventar lámparas{theme === 'pueblo'
          ? ', ventanas y farolas'
          : ''}, romper roca, leer · F dinamita · Mayús andar en silencio · R reiniciar
      </p>
      <p class="tip touch">◀ ▶ moverse · ⤒ saltar · ▲ ▼ trepar · E comer / usar · TNT dinamita · 🤫 sigilo · ↺ reiniciar</p>
    {:else}
      <p class="tip keys">
        ← → / A D moverse · Espacio saltar (↑ también, salvo en escaleras) · ↑ ↓ trepar · E usar (lámpara, pico, palanca,
        leer) · Q bengala{theme === 'abismo' ? ' · F dinamita · Mayús andar en silencio' : ''} · R reiniciar
      </p>
      <p class="tip touch">
        ◀ ▶ moverse · ⤒ saltar · ▲ ▼ trepar · E usar · Q bengala{theme === 'abismo' ? ' · TNT dinamita · 🤫 sigilo' : ''} · ↺ reiniciar
      </p>
    {/if}
    <Game
      {start}
      levels={campaign}
      onlevel={(i) => {
        current = i;
        if (!testing) oscuras.reach(i);
      }}
      onwin={() => !testing && oscuras.finish()}
    />
    {#if device.touch}
      <TouchPad extra />
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
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-top: 0.4rem;
  }
  button {
    justify-self: start;
    padding: 0.6rem 1.2rem;
    font: inherit;
    font-weight: 700;
    color: #120e0c;
    background: #c9a227;
    border: 0;
    border-radius: 3px;
    cursor: pointer;
    text-decoration: none;
  }
  button.secondary {
    color: #e8dcc6;
    background: transparent;
    box-shadow: inset 0 0 0 1px rgb(232 220 198 / 0.4);
  }
  button:hover {
    filter: brightness(1.12);
  }
  button:focus-visible {
    outline: 2px solid #f0e2c8;
    outline-offset: 3px;
  }
</style>
