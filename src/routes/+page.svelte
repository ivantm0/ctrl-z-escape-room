<script lang="ts">
  import { onMount } from 'svelte';
  import { game } from '$lib/game.svelte';
  import { rooms } from '$lib/rooms';
  import { faraon } from '$lib/faraon/state.svelte';
  import { pixel } from '$lib/pixel/state.svelte';
  import { MAPS } from '$lib/pixel/maps';
  import { backstage } from '$lib/backstage/state.svelte';
  import { device } from '$lib/device.svelte';

  // Miniatura del pueblo del mundo 1: cada casilla, un píxel de su tono
  const SHADE: Record<string, number> = { '#': 3, T: 2, H: 3, h: 1, d: 3, D: 3, W: 1, q: 1, f: 2, ',': 1, o: 2, K: 3, E: 3, c: 3, Q: 2, F: 1, N: 3, m: 3, '@': 3 };
  const village = MAPS.pueblo.flatMap((row) => [...row].map((ch) => SHADE[ch] ?? 0));
  import DoorArt from '$lib/components/DoorArt.svelte';
  import ChainLock from '$lib/components/ChainLock.svelte';

  onMount(() => {
    faraon.load();
    pixel.load();
    backstage.load();
    device.load();
  });
  // El Origen necesita ordenador; la parte 2 de Fuera de Juego, haber terminado la parte 1
  const origenLocked = $derived(device.touch);
  const bastidoresLocked = $derived(!pixel.ready || !pixel.s.end4);
  const backstageStatus = $derived(
    !backstage.ready || !backstage.s.intro ? 'Nuevo' : backstage.levelDone(6) ? 'Completado: partida guardada' : backstage.levelDone(5) && backstage.s.level === 5 ? 'Pantallas 1 a 5 superadas' : backstage.levelDone(4) && backstage.s.level === 4 ? 'Pantallas 1 a 4 superadas' : backstage.levelDone(3) && backstage.s.level === 3 ? 'Pantallas 1, 2 y 3 superadas' : backstage.levelDone(2) && backstage.s.level === 2 ? 'Pantallas 1 y 2 superadas' : `En curso · pantalla ${backstage.s.level}`
  );
  const pixelStatus = $derived(
    !pixel.ready || !pixel.s.intro ? 'Nuevo' : pixel.s.end4 ? 'Juego completado' : pixel.s.end3 ? 'Mundos 1, 2 y 3 superados' : `En curso · mundo ${pixel.s.world}`
  );

  const origenDone = $derived(rooms.filter((r) => game.isDone(r.id)).length);
  const glows: Record<string, string> = {
    oficina: '#39ff7a',
    observatorio: '#e0b46a',
    radio: '#ff6a3d',
    laboratorio: '#3fe0b8',
    archivo: '#d4a960',
    maquina: '#ff2bd6',
  };
  const faraonStatus = $derived(
    !faraon.ready || !faraon.s.intro
      ? 'Nuevo'
      : faraon.chapterDone('huida')
        ? 'Completado: has escapado con el mapa'
        : faraon.chapterDone('tumba')
          ? 'En curso · capítulo IV, la huida'
        : faraon.chapterDone('piramide')
          ? 'En curso · capítulo III, la tumba'
        : faraon.chapterDone('mercado')
          ? 'En curso · capítulo II, la pirámide'
          : 'En curso · capítulo I, el mercado'
  );
</script>

<svelte:head>
  <title>Ctrl + Escape · Escape rooms en tu navegador</title>
</svelte:head>

<main>
  <header>
    <p class="kicker">Escape rooms en el navegador</p>
    <h1>
      <span class="key">Ctrl</span><span class="plus">+</span><span class="key wide">Escape</span>
    </h1>
    <p class="lead">Elige tu aventura.</p>
  </header>

  <div class="games">
    <svelte:element
      this={origenLocked ? 'div' : 'a'}
      class="game origen"
      class:locked={origenLocked}
      href={origenLocked ? undefined : '/origen'}
      aria-disabled={origenLocked || undefined}
    >
      <div class="preview">
        {#each rooms as room}
          <span class="mini" style="--glow: {glows[room.id]}"><DoorArt id={room.id} /></span>
        {/each}
      </div>
      <div class="info">
        <p class="tag">Escape room 1</p>
        <h2>Ctrl + Escape: El Origen</h2>
        <p>
          Seis salas donde la pista nunca está en la pantalla: consola, pestañas, tema del sistema,
          portapapeles… Usa todo el navegador para escapar.
        </p>
        {#if !origenLocked}
          <p class="status">{game.ready ? `${origenDone} / ${rooms.length} salas superadas` : '6 salas'} · Entrar →</p>
        {/if}
      </div>
      {#if origenLocked}
        <ChainLock label="SOLO EN ORDENADOR" reason="Solo en ordenador: sus pistas están en la consola, las pestañas y la ventana." />
      {/if}
    </svelte:element>

    <a class="game faraon" href="/faraon">
      <div class="preview">
        <svg viewBox="0 0 400 220" aria-hidden="true">
          <defs>
            <linearGradient id="home-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#3b1d4a" /><stop offset="0.55" stop-color="#d9673a" /><stop offset="1" stop-color="#f4b860" />
            </linearGradient>
          </defs>
          <rect width="400" height="220" fill="url(#home-sky)" />
          <circle class="sun" cx="290" cy="150" r="34" fill="#ffd98a" />
          <path d="M150 170 L235 75 L320 170Z" fill="#a8562b" />
          <path d="M235 75 L320 170 H250Z" fill="#7c3a1d" />
          <path d="M40 170 L95 112 L150 170Z" fill="#b8673a" />
          <path d="M95 112 L150 170 H112Z" fill="#8a4626" />
          <path d="M0 170 Q100 158 200 170 T400 166 V220 H0Z" fill="#e3a560" />
          <path d="M0 192 Q120 180 240 194 T400 188 V220 H0Z" fill="#c98544" />
          <g fill="#2a1408">
            <path d="M350 170 v-40" stroke="#2a1408" stroke-width="4" />
            <path d="M350 130 q-20 -6 -30 6 q16 -4 30 -6 q-8 -16 -26 -14 q18 2 26 14 q14 -16 32 -10 q-20 0 -32 10 q22 -2 30 12 q-14 -10 -30 -12z" />
          </g>
        </svg>
      </div>
      <div class="info">
        <p class="tag">Escape room 2 · Nuevo</p>
        <h2>El Mapa del Faraón</h2>
        <p>
          Tebas, 1250 a. C. Un mapa escondido en un sarcófago. Explora el mercado, la pirámide y la
          tumba, resuelve sus acertijos y escapa antes de que se selle para siempre.
        </p>
        <p class="status">{faraonStatus} · Entrar →</p>
      </div>
    </a>

    <a class="game pixel" href="/fuera-de-juego">
      <div class="preview">
        <div class="lcd" aria-hidden="true">
          <div class="pgrid">
            {#each village as c}<span class="c{c}"></span>{/each}
          </div>
          <p class="press">PRESS START</p>
        </div>
      </div>
      <div class="info">
        <p class="tag">Escape room 3 · Nuevo</p>
        <h2>Fuera de Juego</h2>
        <p>
          Leo enciende una consola antigua de madrugada y el juego se lo traga. Recorre mundos en pixel
          art, habla con sus habitantes, empuja, combina y descifra para encontrar la salida.
        </p>
        <p class="status">{pixelStatus} · Entrar →</p>
      </div>
    </a>

    <svelte:element
      this={bastidoresLocked ? 'div' : 'a'}
      class="game bastidores"
      class:locked={bastidoresLocked}
      href={bastidoresLocked ? undefined : '/entre-bastidores'}
      aria-disabled={bastidoresLocked || undefined}
    >
      <div class="preview">
        <div class="bios" aria-hidden="true">
          <p>CARGANDO…</p>
          <p class="bbar"><i></i></p>
          <p class="pct">99 %</p>
        </div>
      </div>
      <div class="info">
        <p class="tag">Escape room 4 · Nuevo · Parte 2 de Fuera de Juego</p>
        <h2>Entre Bastidores</h2>
        <p>
          Leo vuelve a caer en la consola, pero esta vez detrás del juego: pantallas de carga, menús
          rotos, opciones y depuración. Seis pantallas que nadie debería ver por dentro.
        </p>
        {#if !bastidoresLocked}
          <p class="status">{backstageStatus} · Entrar →</p>
        {/if}
      </div>
      {#if bastidoresLocked}
        <ChainLock label="ACABA LA PARTE I: Fuera de Juego" reason="Termina Fuera de Juego (los 4 mundos) para desbloquearlo." />
      {/if}
    </svelte:element>
  </div>
</main>

<style>
  main {
    max-width: 82rem;
    margin: 0 auto;
    padding: clamp(3rem, 8vw, 6rem) clamp(1rem, 4vw, 2.5rem) 4rem;
  }
  header {
    display: grid;
    gap: 1.4rem;
  }
  .kicker {
    font-size: 0.75rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--accent);
  }
  h1 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4em;
    font-family: var(--font-display);
    font-size: clamp(2.2rem, 7vw, 4.6rem);
    font-weight: 800;
    letter-spacing: -0.03em;
  }
  .key {
    padding: 0.12em 0.4em 0.18em;
    border: 1px solid rgb(241 235 226 / 0.2);
    border-radius: 0.22em;
    background: linear-gradient(#1f1c19, #141210);
    box-shadow: 0 0.1em 0 #2c2722, 0 0.14em 0 #000, 0 0.4em 1em rgb(0 0 0 / 0.5);
  }
  .key.wide {
    color: var(--accent);
  }
  .plus {
    color: var(--muted);
    font-weight: 500;
  }
  .lead {
    font-size: 1.1rem;
    color: var(--muted);
  }
  .games {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 26rem), 1fr));
    gap: 1.5rem;
    margin-top: clamp(2.5rem, 6vw, 4rem);
  }
  .game {
    display: grid;
    grid-template-rows: auto 1fr;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 0.8rem;
    background: var(--surface);
    color: var(--fg);
    text-decoration: none;
    transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.4s, box-shadow 0.4s;
  }
  .game:hover,
  .game:focus-visible {
    transform: translateY(-6px);
    border-color: var(--accent);
    box-shadow: 0 30px 60px rgb(0 0 0 / 0.5);
  }
  /* Tarjetas bloqueadas: apagadas y sin efecto al pasar por encima */
  .game.locked {
    position: relative;
    cursor: not-allowed;
  }
  .game.locked:hover {
    transform: none;
    border-color: var(--line);
    box-shadow: none;
  }
  .game.locked .preview {
    filter: grayscale(1) brightness(0.55);
  }
  .preview {
    aspect-ratio: 16 / 9;
    overflow: hidden;
  }
  .origen .preview {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: var(--line);
  }
  .mini {
    display: grid;
    place-items: center;
    padding: 0.8rem;
    background: #110f0d;
  }
  .faraon .preview svg {
    display: block;
    width: 100%;
    height: 100%;
    transition: transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .faraon:hover .preview svg {
    transform: scale(1.06);
  }
  .sun {
    animation: sunset 8s ease-in-out infinite alternate;
  }
  .pixel .preview {
    display: grid;
    place-items: center;
    background: #2a2f36;
  }
  .lcd {
    position: relative;
    width: 72%;
    aspect-ratio: 160 / 144;
    width: 52%;
    border: 0.8rem solid #1a1d22;
    background: #c7d39c;
    overflow: hidden;
    image-rendering: pixelated;
  }
  .pgrid {
    display: grid;
    grid-template-columns: repeat(20, 1fr);
    grid-template-rows: repeat(18, 1fr);
    width: 100%;
    height: 100%;
  }
  .pgrid .c1 { background: #8fa36a; }
  .pgrid .c2 { background: #4f6a3d; }
  .pgrid .c3 { background: #1d2b1a; }
  .leo {
    position: absolute;
    left: 45%;
    top: 40%;
    width: 10%;
    aspect-ratio: 1;
    background: #1d2b1a;
    box-shadow: inset 0 0.35rem 0 #4f6a3d;
    animation: hop 0.8s steps(2) infinite;
  }
  .press {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 8%;
    font-family: 'Press Start 2P', monospace;
    font-size: clamp(0.45rem, 1.2vw, 0.65rem);
    text-align: center;
    width: fit-content;
    margin: 0 auto;
    padding: 0.2rem 0.4rem;
    background: #c7d39c;
    color: #1d2b1a;
    animation: blink 1s steps(1) infinite;
  }
  .bastidores .preview {
    display: grid;
    place-items: center;
    background: #00002a;
  }
  .bios {
    display: grid;
    gap: 0.6rem;
    width: 60%;
    padding: 1rem;
    border: 0.5rem solid #9a9a9a;
    background: #0000aa;
    color: #ffffff;
    font-family: 'Press Start 2P', monospace;
    font-size: clamp(0.45rem, 1.1vw, 0.6rem);
  }
  .bbar {
    height: 0.8rem;
    border: 2px solid #ffffff;
  }
  .bbar i {
    display: block;
    width: 99%;
    height: 100%;
    background: #ffff55;
  }
  .pct {
    justify-self: end;
    color: #ffff55;
    animation: blink 1s steps(1) infinite;
  }
  .bastidores h2,
  .pixel h2 {
    font-family: 'Press Start 2P', monospace;
    font-size: clamp(0.95rem, 2.2vw, 1.2rem);
    line-height: 1.5;
  }
  @keyframes hop {
    50% { transform: translateY(-15%); }
  }
  @keyframes blink {
    50% { opacity: 0; }
  }
  .info {
    display: grid;
    align-content: start;
    gap: 0.8rem;
    padding: 1.6rem;
  }
  .tag {
    font-size: 0.7rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent);
  }
  h2 {
    font-family: var(--font-display);
    font-size: clamp(1.4rem, 3vw, 1.9rem);
    font-weight: 500;
  }
  .faraon h2 {
    font-family: 'Cinzel', Georgia, serif;
    font-weight: 700;
  }
  .info p:not(.tag) {
    line-height: 1.6;
    color: var(--muted);
  }
  .info .status {
    margin-top: 0.4rem;
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--fg);
  }
  @keyframes sunset {
    to {
      transform: translateY(14px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .leo,
    .press,
    .sun {
      animation: none;
    }
  }
</style>
