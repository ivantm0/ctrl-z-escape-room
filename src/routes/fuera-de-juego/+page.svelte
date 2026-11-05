<script lang="ts">
  import { onMount } from 'svelte';
  import { formatTime } from '$lib/game.svelte';
  import { pixel } from '$lib/pixel/state.svelte';
  import { setSound } from '$lib/pixel/audio';
  import Intro from '$lib/pixel/Intro.svelte';
  import PHud from '$lib/pixel/PHud.svelte';
  import Game from '$lib/pixel/Game.svelte';
  import Game2 from '$lib/pixel/Game2.svelte';
  import Game3 from '$lib/pixel/Game3.svelte';
  import Game4 from '$lib/pixel/Game4.svelte';

  let replay = $state(false);

  onMount(() => {
    pixel.load();
    document.documentElement.classList.add('theme-pixel');
    return () => {
      document.documentElement.classList.remove('theme-pixel');
      setSound(false);
    };
  });

  // Suena por defecto; el navegador lo deja en pausa hasta el primer gesto
  $effect(() => {
    if (pixel.ready) setSound(pixel.sound);
  });

  const world = $derived(pixel.s.world);
  const finished = $derived(pixel.ready && pixel.isDone(world === 1 ? 'puerta' : world === 2 ? 'portal' : world === 3 ? 'tiempo' : 'salida'));
  const hints = $derived(pixel.hintsIn(world));
  const stars = $derived(Math.max(1, 3 - Math.ceil(hints / 3)));
  const range = $derived(pixel.timeRange);
</script>

<svelte:head>
  <title>Fuera de Juego · Ctrl + Escape</title>
</svelte:head>

<div class="pixel">
  {#if !pixel.ready}
    <p class="loading">CARGANDO…</p>
  {:else if !pixel.s.intro || (replay && world === 1)}
    <Intro onfinish={() => { pixel.begin(); replay = false; }} />
  {:else if world === 2 && (!pixel.s.intro2 || replay)}
    <Intro world={2} onfinish={() => { pixel.s.intro2 = true; pixel.save(); replay = false; }} />
  {:else if world === 3 && (!pixel.s.intro3 || replay)}
    <Intro world={3} onfinish={() => { pixel.s.intro3 = true; pixel.save(); replay = false; }} />
  {:else if world === 4 && (!pixel.s.intro4 || replay)}
    <Intro world={4} onfinish={() => { pixel.s.intro4 = true; pixel.save(); replay = false; }} />
  {:else}
    <PHud />
    <main>
      <h1 class="sr-only">Fuera de Juego, mundo {world}: {['Monocromo', '8 bits', '16 bits', 'Glitch'][world - 1]}</h1>
      <p class="tip keys">Muévete con las flechas o WASD · A / Espacio para interactuar · R para reiniciar {world === 1 ? 'cajas o runas' : world === 2 || world === 4 ? 'la sala' : 'espejos o cajas'}</p>
      <p class="tip touch">Cruceta para moverte · A para interactuar · ↺ reinicia {world === 1 ? 'cajas o runas' : world === 2 || world === 4 ? 'la sala' : 'espejos o cajas'}</p>
      {#if world === 1}
        {#key pixel.s.start}
          <Game />
        {/key}
      {:else if world === 2}
        <Game2 />
      {:else if world === 3}
        <Game3 />
      {:else}
        <Game4 />
      {/if}
    </main>

    {#if finished}
      <section class="end" aria-labelledby="end-title">
        <p class="kicker">{world === 4 ? 'JUEGO COMPLETADO' : `MUNDO ${world} SUPERADO`}</p>
        {#if world === 1}
          <h2 id="end-title">¡LEO CRUZA LA PUERTA!</h2>
          <p class="story">
            Al otro lado de la Puerta del Cartucho, el verde se rompe en colores: cuatro, ocho, dieciséis…
            El juego acaba de cambiar de época. Y la salida sigue muy lejos.
          </p>
        {:else if world === 4}
          <h2 id="end-title">¡LEO VUELVE A CASA!</h2>
          <p class="story">
            Un fogonazo blanco. Leo abre los ojos en su habitación, con la consola caliente entre las manos.
            El reloj marca las 3:08. En la pantalla, un último mensaje: «GRACIAS POR JUGAR, JUGADOR 1».
          </p>
        {:else if world === 3}
          <h2 id="end-title">¡EL TIEMPO VUELVE A CORRER!</h2>
          <p class="story">
            El portal de la torre del reloj se traga a Leo con un TIC-TAC enorme. Pero esta vez algo va mal:
            los píxeles se tuercen, los colores se descuadran… El juego empieza a romperse.
          </p>
        {:else}
          <h2 id="end-title">¡EL REY HA DESPERTADO!</h2>
          <p class="story">
            El portal real absorbe a Leo entre destellos. Los píxeles se hacen más pequeños, los colores
            se multiplican… y empieza a sonar algo parecido a música de verdad.
          </p>
        {/if}
        <p class="stars" aria-label="{stars} de 3 estrellas">{#each [0, 1, 2] as k}<span class:on={k < stars}>★</span>{/each}</p>
        <dl>
          <div><dt>TIEMPO</dt><dd>{formatTime((range.to ?? 0) - (range.from ?? 0))}</dd></div>
          <div><dt>PISTAS</dt><dd>{hints}</dd></div>
        </dl>
        <div class="actions">
          {#if world === 1}
            <button class="primary" onclick={() => pixel.goWorld(2)}>CONTINUAR: MUNDO 2 ▶</button>
          {:else if world === 2}
            <button class="primary" onclick={() => pixel.goWorld(3)}>CONTINUAR: MUNDO 3 ▶</button>
            <button onclick={() => pixel.resetWorld2()}>REPETIR EL MUNDO 2</button>
          {:else if world === 3}
            <button class="primary" onclick={() => pixel.goWorld(4)}>CONTINUAR: MUNDO 4 ▶</button>
            <button onclick={() => pixel.resetWorld3()}>REPETIR EL MUNDO 3</button>
          {:else}
            <a class="primary" href="/">VOLVER A LOS ESCAPE ROOMS</a>
            <button onclick={() => pixel.resetWorld4()}>REPETIR EL MUNDO 4</button>
          {/if}
          <button onclick={() => (replay = true)}>VER LA INTRO</button>
          <button onclick={() => pixel.reset()}>EMPEZAR DE CERO</button>
        </div>
        {#if world > 1}
          <button class="back" onclick={() => pixel.goWorld((world - 1) as 1 | 2 | 3)}>◀ VOLVER AL MUNDO {world - 1}</button>
        {/if}
      </section>
    {/if}
  {/if}
</div>

<style>
  .pixel {
    min-height: 100dvh;
    background: #10141a;
    color: #c7d39c;
  }
  .loading {
    display: grid;
    min-height: 100dvh;
    place-items: center;
    font-family: 'Press Start 2P', monospace;
  }
  main {
    padding: 1rem 1rem 6rem;
  }
  .tip {
    margin: 0 auto 1rem;
    max-width: 44rem;
    font-family: 'Press Start 2P', monospace;
    font-size: 0.55rem;
    line-height: 1.8;
    text-align: center;
    color: #8fa36a;
  }
  .touch {
    display: none;
  }
  @media (pointer: coarse) {
    .keys {
      display: none;
    }
    .touch {
      display: block;
    }
  }
  .end {
    position: fixed;
    inset: 0;
    z-index: 30;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 1.2rem;
    padding: 2rem 1.25rem;
    overflow: auto;
    background: rgb(16 20 26 / 0.96);
    font-family: 'Press Start 2P', monospace;
    text-align: center;
  }
  .kicker {
    font-size: 0.7rem;
    color: #8fa36a;
  }
  h2 {
    font-size: clamp(1.1rem, 4vw, 1.8rem);
    line-height: 1.4;
    color: #9bbc0f;
  }
  .story {
    max-width: 36rem;
    font-size: 0.65rem;
    line-height: 2;
  }
  .stars {
    font-size: 1.6rem;
    color: #3a4452;
  }
  .stars .on {
    color: #9bbc0f;
  }
  dl {
    display: flex;
    gap: 4px;
    margin: 0;
  }
  dl div {
    padding: 0.8rem 1.2rem;
    border: 4px solid #c7d39c;
  }
  dt {
    font-size: 0.55rem;
    color: #8fa36a;
  }
  dd {
    margin: 0.4rem 0 0;
    font-size: 1rem;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.7rem;
  }
  .actions a,
  .actions button {
    padding: 0.8rem 1rem;
    border: 4px solid #c7d39c;
    background: none;
    color: #c7d39c;
    font-family: inherit;
    font-size: 0.6rem;
    text-decoration: none;
  }
  .back {
    border: 0;
    background: none;
    color: #8fa36a;
    font-family: inherit;
    font-size: 0.55rem;
    text-decoration: underline;
  }
  .actions .primary {
    background: #9bbc0f;
    border-color: #9bbc0f;
    color: #0f380f;
  }
</style>
