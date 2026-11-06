<script lang="ts">
  import { onMount } from 'svelte';
  import { formatTime } from '$lib/game.svelte';
  import { setSound } from '$lib/pixel/audio';
  import Intro from '$lib/pixel/Intro.svelte';
  import { pixel } from '$lib/pixel/state.svelte';
  import BHud from '$lib/backstage/BHud.svelte';
  import Level1 from '$lib/backstage/Level1.svelte';
  import Level2 from '$lib/backstage/Level2.svelte';
  import Level3 from '$lib/backstage/Level3.svelte';
  import Level4 from '$lib/backstage/Level4.svelte';
  import Level5 from '$lib/backstage/Level5.svelte';
  import Level6 from '$lib/backstage/Level6.svelte';
  import { backstage, LEVEL_NAMES, LEVELS_READY } from '$lib/backstage/state.svelte';

  let replay = $state(false);

  onMount(() => {
    backstage.load();
    pixel.load();
    document.documentElement.classList.add('theme-pixel');
    return () => {
      document.documentElement.classList.remove('theme-pixel');
      setSound(false);
    };
  });

  // Suena por defecto; el navegador lo deja en pausa hasta el primer gesto
  $effect(() => {
    if (backstage.ready) setSound(backstage.sound);
  });

  const level = $derived(backstage.s.level);
  const finished = $derived(backstage.ready && backstage.levelDone(level));
  const hints = $derived(backstage.hintsIn(level));
  const stars = $derived(Math.max(1, 3 - Math.ceil(hints / 3)));
  const range = $derived(backstage.timeRange);
</script>

<svelte:head>
  <title>Entre Bastidores · Ctrl + Escape</title>
</svelte:head>

<div class="page">
  {#if !backstage.ready || !pixel.ready}
    <p class="loading">CARGANDO…</p>
  {:else if !pixel.s.end4}
    <main class="locked">
      <p class="lock" aria-hidden="true">🔒</p>
      <h1>PARTE 2 BLOQUEADA</h1>
      <p>
        Entre Bastidores continúa la historia de Leo justo donde acaba Fuera de Juego. Termina antes los
        cuatro mundos de la parte 1 para desbloquearla.
      </p>
      <a class="primary" href="/fuera-de-juego">JUGAR A FUERA DE JUEGO ▶</a>
      <a href="/">← VOLVER A LOS ESCAPE ROOMS</a>
    </main>
  {:else if !backstage.s.intro || replay}
    <Intro world="bastidores" onfinish={() => { backstage.begin(); replay = false; }} />
  {:else}
    <BHud />
    <main>
      <h1 class="sr-only">Fuera de Juego 2: Entre Bastidores, pantalla {level}: {LEVEL_NAMES[level]}</h1>
      <p class="tip keys">Muévete con las flechas o WASD · A / Espacio para interactuar · R para {level === 1 ? 'recolocar los archivos' : level === 2 ? 'volver al principio' : level === 3 ? 'restablecer los ajustes' : level === 4 ? 'volver al inicio' : level === 5 ? 'rebobinar los créditos' : 'reiniciar la memoria'}</p>
      <p class="tip touch">Cruceta para moverte · A para interactuar · ↺ {level === 1 ? 'recoloca los archivos' : level === 2 ? 'vuelve al principio' : level === 3 ? 'restablece los ajustes' : level === 4 ? 'vuelve al inicio' : level === 5 ? 'rebobina los créditos' : 'reinicia la memoria'}</p>
      {#if level === 1}
        <Level1 />
      {:else if level === 2}
        <Level2 />
      {:else if level === 3}
        <Level3 />
      {:else if level === 4}
        <Level4 />
      {:else if level === 5}
        <Level5 />
      {:else}
        <Level6 />
      {/if}
    </main>

    {#if finished}
      <section class="end" aria-labelledby="end-title">
        <p class="kicker">{level === 6 ? 'JUEGO COMPLETADO' : `PANTALLA ${level} SUPERADA`}</p>
        {#if level === 1}
          <h2 id="end-title">¡CARGA COMPLETA!</h2>
          <p class="story">
            La barra llega al 100 % y la pantalla se funde a negro… pero en vez de la partida de Leo aparece
            un menú principal con las letras descolgadas. «JUGAR» está tachado.
          </p>
        {:else if level === 6}
          <h2 id="end-title">¡PARTIDA GUARDADA!</h2>
          <p class="story">
            Leo abre los ojos. Es de día, la consola está apagada sobre la mesilla y, al encenderla, el menú
            ya no tiene letras caídas: «CONTINUAR · RANURA 3 · LEO». Esta vez decide no pulsarlo. Por ahora.
          </p>
        {:else if level === 5}
          <h2 id="end-title">¡FIN… O NO!</h2>
          <p class="story">
            Tras «GRACIAS POR JUGAR» no se apaga la pantalla: aparecen tres ranuras de partida, todas
            corruptas. Y una de ellas lleva tu nombre. Es la memoria de guardado.
          </p>
        {:else if level === 4}
          <h2 id="end-title">¡DEPURACIÓN SUPERADA!</h2>
          <p class="story">
            La puerta del cofre da a una pantalla en sepia. Una música lenta empieza a sonar y, desde abajo,
            sube una lista de nombres que no se acaba nunca: los créditos del juego.
          </p>
        {:else if level === 3}
          <h2 id="end-title">¡AJUSTES GUARDADOS!</h2>
          <p class="story">
            Al otro lado de la puerta no hay nada dibujado: solo un cursor que parpadea sobre fondo negro y
            líneas de texto verde. Leo ha llegado a la consola de depuración del juego.
          </p>
        {:else}
          <h2 id="end-title">¡MENÚ REPARADO!</h2>
          <p class="story">
            Leo pulsa OPCIONES y el suelo se convierte en una lista de ajustes: brillo, volumen, idioma,
            subtítulos… Todos con valores que no deberían existir.
          </p>
        {/if}
        <p class="stars" aria-label="{stars} de 3 estrellas">{#each [0, 1, 2] as k}<span class:on={k < stars}>★</span>{/each}</p>
        <dl>
          <div><dt>TIEMPO</dt><dd>{formatTime((range.to ?? 0) - (range.from ?? 0))}</dd></div>
          <div><dt>PISTAS</dt><dd>{hints}</dd></div>
        </dl>
        <div class="actions">
          {#if level < LEVELS_READY}
            <button class="primary" onclick={() => backstage.goLevel((level + 1) as 2 | 3 | 4 | 5 | 6)}>CONTINUAR: PANTALLA {level + 1} ▶</button>
          {:else}
            <a class="primary" href="/">VOLVER A LOS ESCAPE ROOMS</a>
          {/if}
          <button onclick={() => (level === 1 ? backstage.resetLevel1() : level === 2 ? backstage.resetLevel2() : level === 3 ? backstage.resetLevel3() : level === 4 ? backstage.resetLevel4() : level === 5 ? backstage.resetLevel5() : backstage.resetLevel6())}>REPETIR LA PANTALLA {level}</button>
          <button onclick={() => (replay = true)}>VER LA INTRO</button>
          <button onclick={() => backstage.reset()}>EMPEZAR DE CERO</button>
        </div>
        {#if level > 1}
          <button class="back" onclick={() => backstage.goLevel((level - 1) as 1 | 2 | 3 | 4 | 5)}>◀ VOLVER A LA PANTALLA {level - 1}</button>
        {/if}
      </section>
    {/if}
  {/if}
</div>

<style>
  .page {
    min-height: 100dvh;
    background: #00002a;
    color: #ffffff;
  }
  .locked {
    display: grid;
    min-height: 100dvh;
    place-content: center;
    justify-items: center;
    gap: 1.2rem;
    padding: 2rem 1.25rem;
    font-family: 'Press Start 2P', monospace;
    text-align: center;
  }
  .locked .lock {
    font-size: 2.4rem;
  }
  .locked h1 {
    font-size: clamp(1rem, 4vw, 1.6rem);
    color: #ffff55;
  }
  .locked p {
    max-width: 34rem;
    font-size: 0.65rem;
    line-height: 2;
  }
  .locked a {
    color: #55ffff;
    font-size: 0.6rem;
  }
  .locked .primary {
    padding: 0.8rem 1rem;
    background: #ffff55;
    color: #00006a;
    text-decoration: none;
  }
  .loading {
    display: grid;
    min-height: 100dvh;
    place-items: center;
    font-family: 'Press Start 2P', monospace;
  }
  main {
    padding: 1rem 1rem 3rem;
  }
  .tip {
    margin: 0 auto 1rem;
    max-width: 44rem;
    font-family: 'Press Start 2P', monospace;
    font-size: 0.55rem;
    line-height: 1.8;
    text-align: center;
    color: #55ffff;
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
    background: rgb(0 0 42 / 0.96);
    font-family: 'Press Start 2P', monospace;
    text-align: center;
  }
  .kicker {
    font-size: 0.7rem;
    color: #55ffff;
  }
  h2 {
    font-size: clamp(1.1rem, 4vw, 1.8rem);
    line-height: 1.4;
    color: #ffff55;
  }
  .story {
    max-width: 36rem;
    font-size: 0.65rem;
    line-height: 2;
  }
  .stars {
    font-size: 1.6rem;
    color: #333366;
  }
  .stars .on {
    color: #ffff55;
  }
  dl {
    display: flex;
    gap: 4px;
    margin: 0;
  }
  dl div {
    padding: 0.8rem 1.2rem;
    border: 4px solid #ffffff;
  }
  dt {
    font-size: 0.55rem;
    color: #55ffff;
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
    border: 4px solid #ffffff;
    background: none;
    color: #ffffff;
    font-family: inherit;
    font-size: 0.6rem;
    text-decoration: none;
  }
  .back {
    border: 0;
    background: none;
    color: #55ffff;
    font-family: inherit;
    font-size: 0.55rem;
    text-decoration: underline;
  }
  .actions .primary {
    background: #ffff55;
    border-color: #ffff55;
    color: #00006a;
  }
</style>
