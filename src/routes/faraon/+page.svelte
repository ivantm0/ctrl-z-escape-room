<script lang="ts">
  import { onMount } from 'svelte';
  import { formatTime } from '$lib/game.svelte';
  import { CHAPTERS, faraon, ORDER, type Chapter } from '$lib/faraon/state.svelte';
  import { setSound } from '$lib/faraon/audio';
  import Intro from '$lib/faraon/Intro.svelte';
  import FHud from '$lib/faraon/FHud.svelte';
  import Mercado from '$lib/faraon/mercado/Mercado.svelte';
  import Piramide from '$lib/faraon/piramide/Piramide.svelte';
  import Tumba from '$lib/faraon/tumba/Tumba.svelte';
  import Huida from '$lib/faraon/huida/Huida.svelte';

  let reveal = $state(false);
  let replay = $state<Chapter | null>(null);

  onMount(() => {
    faraon.load();
    document.documentElement.classList.add('theme-faraon');
    return () => {
      document.documentElement.classList.remove('theme-faraon');
      setSound(false);
    };
  });

  // Suena por defecto; el navegador lo deja en pausa hasta el primer clic o tecla del jugador
  $effect(() => {
    if (faraon.ready) setSound(faraon.sound);
  });

  const ch = $derived(faraon.s.chapter);
  const intro = $derived<Chapter | null>(
    !faraon.ready ? null : replay ? replay : !faraon.s.intro ? 'mercado' : !faraon.s.seen.includes(ch) ? ch : null
  );
  const finished = $derived(faraon.ready && faraon.chapterDone(ch));
  const hints = $derived(faraon.hintsIn(ch));
  const stars = $derived(Math.max(1, 3 - Math.ceil(hints / 3)));
  const time = $derived(faraon.chapterTime(ch));

  const END = {
    mercado: {
      title: 'La puerta de la necrópolis se abre',
      story: 'El guardia examina el sello, palidece y se aparta. Más allá de la muralla, la pirámide de Sethnakht arde bajo el sol de la tarde. El tiempo corre.',
    },
    piramide: {
      title: 'La pirámide se abre',
      story: 'La piedra del escarabajo se hunde y deja un pasadizo negro como la noche. Huele a resina, a polvo y a siglos. Allí abajo espera la tumba del faraón.',
    },
    huida: {
      title: 'Has escapado',
      story: 'Te lanzas bajo la losa justo antes de que caiga. Detrás, la pirámide ruge y se cierra para siempre. Delante, el desierto rojo del atardecer… y en tus manos, el Mapa del Oasis Perdido.',
    },
    tumba: {
      title: 'El Mapa del Oasis es tuyo',
      story: 'Lo sacas del sarcófago y el suelo responde con un rugido. Los bloques del pasadizo empiezan a bajar. La maldición era cierta: la tumba se está sellando para siempre.',
    },
  } as const;
  const TIPS: Record<Chapter, string> = {
    mercado: 'Explora el mercado: pulsa sobre los puestos y personajes para verlos de cerca.',
    piramide: 'Explora los alrededores de la pirámide: algo tiene que abrirla.',
    tumba: 'Está oscuro: mueve el ratón (o toca la pantalla) para alumbrar la cámara.',
    huida: '¡Rápido! Supera las tres pruebas antes de que la tumba se selle.',
  };
  // Al terminar el juego: tiempo y pistas de la partida entera
  const total = $derived({
    time: (faraon.s.ends.huida ?? 0) - (faraon.s.start ?? 0),
    hints: ORDER.reduce((a, c) => a + faraon.hintsIn(c), 0),
  });
  const next = $derived(ORDER[ORDER.indexOf(ch) + 1]);

  function finishIntro(chapter: Chapter) {
    if (chapter === 'mercado') faraon.begin();
    // La cuenta atrás de la huida empieza al acabar su intro
    if (chapter === 'huida' && !faraon.s.deadline && !faraon.chapterDone('huida')) faraon.startEscape();
    faraon.markSeen(chapter);
    replay = null;
  }
</script>

<svelte:head>
  <title>El Mapa del Faraón · Ctrl + Escape</title>
</svelte:head>

<div class="faraon">
  {#if !faraon.ready}
    <p class="loading">Cargando…</p>
  {:else if intro}
    {#key intro}
      <Intro chapter={intro} onfinish={() => finishIntro(intro)} />
    {/key}
  {:else}
    <FHud bind:reveal />
    <main>
      <h1 class="sr-only">Capítulo {CHAPTERS[ch].n}: {CHAPTERS[ch].name.toLowerCase()}</h1>
      <p class="tip">
        {TIPS[ch]}
        {#if ch !== 'huida'}◎ resalta lo que se puede tocar.<span class="swipe"> Desliza para recorrer la escena.</span>{/if}
      </p>
      {#if ch === 'mercado'}
        <Mercado {reveal} />
      {:else if ch === 'piramide'}
        <Piramide {reveal} />
      {:else if ch === 'tumba'}
        <Tumba {reveal} />
      {:else}
        <Huida />
      {/if}
    </main>

    {#if finished}
      <section class="end" aria-labelledby="end-title">
        <p class="kicker">Fin del capítulo {CHAPTERS[ch].n}</p>
        <h2 id="end-title">{END[ch].title}</h2>
        <p class="story">{END[ch].story}</p>
        <div class="stars" aria-label="{stars} de 3 estrellas">
          {#each [0, 1, 2] as k}<span class:on={k < stars}>★</span>{/each}
        </div>
        <dl>
          <div><dt>Tiempo</dt><dd>{formatTime((time.to ?? 0) - (time.from ?? 0))}</dd></div>
          <div><dt>Pistas</dt><dd>{hints}</dd></div>
          {#if ch === 'huida'}
            <div><dt>Intentos</dt><dd>{faraon.s.fails + 1}</dd></div>
          {/if}
        </dl>
        {#if ch === 'huida'}
          <div class="credits">
            <p class="kicker">Fin de El Mapa del Faraón</p>
            <p>Partida completa: <strong>{formatTime(total.time)}</strong> y <strong>{total.hints}</strong> pistas en cuatro capítulos.</p>
            <p class="small">Un escape room de Ctrl + Escape. Ilustraciones en SVG, sonido sintetizado y jeroglíficos de verdad.</p>
          </div>
        {/if}
        <div class="actions">
          {#if next}
            <button class="primary" onclick={() => faraon.goTo(next)}>Continuar: {CHAPTERS[next].name.toLowerCase()} →</button>
          {:else}
            <a class="primary" href="/">Volver a los escape rooms</a>
            <button onclick={() => { faraon.reset(); }}>Jugar desde el principio</button>
          {/if}
          <button onclick={() => { faraon.resetChapter(ch); if (ch === 'huida') faraon.startEscape(); }}>Repetir el capítulo</button>
          <button onclick={() => (replay = ch)}>Ver la intro</button>
        </div>
        {#if ORDER.indexOf(ch) > 0}
          {@const prev = ORDER[ORDER.indexOf(ch) - 1]}
          <button class="back" onclick={() => faraon.goTo(prev)}>← Volver a {CHAPTERS[prev].name.toLowerCase()}</button>
        {/if}
      </section>
    {/if}
  {/if}
</div>

<style>
  .faraon {
    min-height: 100dvh;
    background:
      radial-gradient(ellipse at top, rgb(233 181 74 / 0.08), transparent 60%),
      var(--bg);
    color: var(--fg);
    font-family: var(--font-ui);
  }
  .loading {
    display: grid;
    min-height: 100dvh;
    place-items: center;
  }
  main {
    padding: 1rem 0 6rem;
  }
  .tip {
    max-width: 50rem;
    margin: 0 auto 0.8rem;
    padding: 0 1rem;
    text-align: center;
    font-style: italic;
    color: var(--muted);
  }
  .swipe {
    display: none;
  }
  @media (max-width: 56rem) {
    .swipe {
      display: inline;
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
    background:
      radial-gradient(circle at 50% 30%, rgb(233 181 74 / 0.2), transparent 65%),
      rgb(13 8 4 / 0.97);
    text-align: center;
    animation: fade 1s ease-out;
  }
  .kicker {
    font-family: var(--font-display);
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--accent);
  }
  h2 {
    max-width: 40rem;
    font-family: var(--font-display);
    font-size: clamp(2rem, 6vw, 3.6rem);
    line-height: 1.05;
  }
  .story {
    max-width: 36rem;
    font-size: 1.15rem;
    line-height: 1.6;
  }
  .stars {
    display: flex;
    gap: 0.5rem;
    font-size: 2.4rem;
    color: var(--line);
  }
  .stars .on {
    color: var(--accent);
  }
  dl {
    display: flex;
    gap: 1px;
    margin: 0;
    border: 1px solid var(--line);
    background: var(--line);
  }
  dl div {
    min-width: 8rem;
    padding: 0.9rem 1.2rem;
    background: var(--bg);
  }
  dt {
    font-size: 0.75rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--muted);
  }
  dd {
    margin: 0.2rem 0 0;
    font-size: 1.5rem;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
  }
  .credits {
    display: grid;
    gap: 0.4rem;
    max-width: 34rem;
    padding: 1rem 1.4rem;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }
  .credits strong {
    color: var(--accent);
  }
  .credits .small {
    font-size: 0.9rem;
    color: var(--muted);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.7rem;
  }
  .actions a,
  .actions button {
    padding: 0.75rem 1.3rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: none;
    font-family: var(--font-display);
    text-decoration: none;
  }
  .actions .primary {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--accent-ink);
    font-weight: 700;
  }
  .back {
    border: 0;
    background: none;
    color: var(--muted);
    text-decoration: underline;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
</style>
