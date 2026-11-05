<script lang="ts">
  import { onMount } from 'svelte';

  import type { Chapter } from './state.svelte';

  let { onfinish, chapter = 'mercado' }: { onfinish: () => void; chapter?: Chapter } = $props();

  const STORY: Record<Chapter, { slides: { kicker: string; text: string }[]; start: string }> = {
    mercado: { start: 'Entrar al mercado →', slides: [
    { kicker: 'Tebas · 1250 a. C.', text: 'El Nilo despierta. Las barcas bajan cargadas de trigo, lino y rumores.' },
    { kicker: 'El secreto', text: 'El faraón Sethnakht murió llevándose un secreto: el mapa del Oasis Perdido, escondido en su sarcófago.' },
    { kicker: 'La maldición', text: 'Los sacerdotes sellaron la tumba con acertijos. Cuando el sol toque el horizonte, sus puertas se cerrarán para siempre.' },
    { kicker: 'Tú', text: 'Eres un aprendiz de escriba. Nadie te toma en serio… y por eso nadie te vigila.' },
    { kicker: 'Capítulo I', text: 'Tu camino empieza donde empiezan todos los rumores: en el mercado.' },
    ] },
    piramide: { start: 'Acercarse a la pirámide →', slides: [
      { kicker: 'Capítulo II · La necrópolis', text: 'Más allá de la muralla, solo arena, viento y la pirámide de Sethnakht, inmensa y silenciosa.' },
      { kicker: 'Sin puertas', text: 'Sus caras son lisas: ninguna entrada a la vista. Los obreros dicen que solo el sol de la tarde sabe dónde está.' },
    ] },
    tumba: { start: 'Bajar a la cámara →', slides: [
      { kicker: 'Capítulo III · El descenso', text: 'Un pasadizo estrecho baja hacia el corazón de la pirámide. La luz de la entrada se apaga a cada paso.' },
      { kicker: 'La cámara del faraón', text: 'Al fondo, un sarcófago de granito. Dentro, el mapa. Pero los sacerdotes no lo dejaron al alcance de cualquiera.' },
    ] },
    huida: { start: '¡Corre! →', slides: [
      { kicker: 'Capítulo IV · La maldición', text: 'El sol toca el horizonte. Los bloques del techo empiezan a bajar y la arena se cuela por cada grieta.' },
      { kicker: 'Tres minutos', text: 'Es lo que tardará la tumba en sellarse para siempre. Cada error la cerrará más deprisa.' },
    ] },
  };
  const slides = $derived(STORY[chapter].slides);
  const DURATION = 6500;

  let i = $state(0);
  let timer: ReturnType<typeof setTimeout>;

  const schedule = () => {
    clearTimeout(timer);
    if (i < slides.length - 1) timer = setTimeout(next, DURATION);
  };
  function next() {
    if (i < slides.length - 1) {
      i += 1;
      schedule();
    }
  }

  onMount(() => {
    schedule();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (i === slides.length - 1) onfinish();
        else next();
      } else if (e.key === 'Escape') onfinish();
    };
    addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      removeEventListener('keydown', onKey);
    };
  });
</script>

<section class="intro" aria-roledescription="cinemática" aria-label="Introducción de la historia">
  {#key i}
    <div class="frame">
      <svg class="art" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {#if chapter === 'huida'}
          <!-- La cámara temblando, con arena cayendo -->
          <rect width="1600" height="900" fill="#140a05" />
          <path d="M520 900 L700 300 H900 L1080 900Z" fill="#2a1a0e" />
          <rect x="560" y={i === 0 ? 120 : 220} width="480" height="120" fill="#4a3018" class="drop" />
          {#each [600, 720, 880, 1000, 780] as x, k}<rect x={x} y="0" width="4" height="900" fill="#d9a35e" opacity="0.5" class="sand" style="animation-delay: {k * 0.3}s" />{/each}
          {#if i === 1}<text x="800" y="620" text-anchor="middle" font-family="Cinzel" font-size="160" fill="#e9b54a" class="glow">3:00</text>{/if}
        {:else if chapter === 'tumba'}
          <!-- Pasadizo oscuro que baja hacia la cámara -->
          <rect width="1600" height="900" fill="#0b0604" />
          <path d="M520 900 L700 300 H900 L1080 900Z" fill="#2a1a0e" />
          <path d="M700 300 H900 L860 420 H740Z" fill="#120a05" />
          {#each [0, 1, 2, 3] as k}<path d="M{600 + k * 30} {800 - k * 130} H{1000 - k * 30}" stroke="#3a2614" stroke-width="3" />{/each}
          {#if i === 1}
            <rect x="690" y="330" width="220" height="70" rx="20" fill="#5a4a3a" />
            <text x="800" y="375" text-anchor="middle" font-family="Noto Sans Egyptian Hieroglyphs" font-size="34" fill="#e9b54a" class="glow">𓆣</text>
          {/if}
          <circle cx="800" cy="620" r="320" fill="url(#t-torch)" />
          <defs><radialGradient id="t-torch"><stop offset="0" stop-color="#ffb347" stop-opacity="0.35" /><stop offset="1" stop-color="#ffb347" stop-opacity="0" /></radialGradient></defs>
        {:else if chapter === 'piramide'}
          <!-- La pirámide en el desierto, cada vez más cerca -->
          <defs><linearGradient id="p{i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2238" /><stop offset="0.6" stop-color="#e2773f" /><stop offset="1" stop-color="#f6bd6c" /></linearGradient></defs>
          <rect width="1600" height="900" fill="url(#p{i})" />
          <circle cx="1250" cy="430" r="80" fill="#ffd98a" class="sinking" />
          <g transform="translate(800 720) scale({i === 0 ? 0.7 : 1.15}) translate(-800 -720)">
            <path d="M330 720 L800 150 L1270 720Z" fill="#c27a3e" />
            <path d="M800 150 L1270 720 H880Z" fill="#8d4f25" />
            {#if i === 1}
              <g font-family="Noto Sans Egyptian Hieroglyphs" font-size="54" fill="#5a2c10" text-anchor="middle" opacity="0.7"><text x="800" y="420">𓂀</text><text x="800" y="500">𓋹</text><text x="800" y="580">𓆣</text></g>
            {/if}
          </g>
          <path d="M0 720 Q400 690 800 720 T1600 710 V900 H0Z" fill="#e0a05c" />
          <path class="drift" d="M100 800 q40 -20 80 0 M260 830 q40 -20 80 0" stroke="#c98544" stroke-width="6" fill="none" />
        {:else if i === 0}
          <!-- El Nilo al amanecer -->
          <defs><linearGradient id="i0" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b1d4f" /><stop offset="0.6" stop-color="#e2774a" /><stop offset="1" stop-color="#f7c27a" /></linearGradient></defs>
          <rect width="1600" height="900" fill="url(#i0)" />
          <circle cx="800" cy="560" r="120" fill="#ffd98a" opacity="0.9" />
          <rect y="560" width="1600" height="340" fill="#1f4a6b" />
          <path d="M0 560 H1600" stroke="#ffd98a" stroke-width="4" opacity="0.6" />
          {#each [0, 1, 2, 3, 4] as k}<path d="M{620 + k * 30} {600 + k * 40} h{360 - k * 60}" stroke="#ffd98a" stroke-width="6" opacity={0.5 - k * 0.08} />{/each}
          <path class="drift" d="M300 640 q120 30 240 0 l-30 30 h-180z M420 640 v-120 l70 100z" fill="#1a0d06" />
          <g fill="#1a0d06">{#each [100, 1350, 1480] as x}<path d="M{x} 560 v-200" stroke="#1a0d06" stroke-width="12" /><path d="M{x} 360 q-80 -20 -130 30 q70 -20 130 -30 q-40 -70 -120 -60 q80 10 120 60 q60 -70 140 -40 q-90 0 -140 40 q90 -10 130 50 q-60 -40 -130 -50z" />{/each}</g>
        {:else if i === 1}
          <!-- La pirámide del faraón -->
          <defs><linearGradient id="i1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b2a1a" /><stop offset="1" stop-color="#f2a65a" /></linearGradient></defs>
          <rect width="1600" height="900" fill="url(#i1)" />
          <circle cx="1180" cy="260" r="90" fill="#ffe2a0" />
          <path d="M380 760 L800 220 L1220 760Z" fill="#c27a3e" />
          <path d="M800 220 L1220 760 H900Z" fill="#8d4f25" />
          <path d="M760 760 v-90 h80 v90" fill="#2a1408" />
          <path d="M0 760 Q400 720 800 760 T1600 750 V900 H0Z" fill="#e0a05c" />
          <text x="800" y="600" text-anchor="middle" font-family="Noto Sans Egyptian Hieroglyphs" font-size="70" fill="#ffe2a0" class="glow">𓂀</text>
        {:else if i === 2}
          <!-- La puerta sellada y el sol cayendo -->
          <defs><linearGradient id="i2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#160c08" /><stop offset="1" stop-color="#4a2412" /></linearGradient></defs>
          <rect width="1600" height="900" fill="url(#i2)" />
          <path d="M560 900 V260 H1040 V900" fill="#6e4424" />
          <path d="M620 900 V320 H980 V900" fill="#2a160a" />
          <g font-family="Noto Sans Egyptian Hieroglyphs" font-size="64" fill="#e9b54a" text-anchor="middle" class="glow">
            <text x="800" y="460">𓋹 𓂀 𓆣</text><text x="800" y="580">𓅃 𓃠 𓆙</text><text x="800" y="700">𓇳 𓊽 𓏞</text>
          </g>
          <circle class="sinking" cx="1360" cy="700" r="70" fill="#ff8a3d" />
          <rect y="760" width="1600" height="140" fill="#1a0d06" />
        {:else if i === 3}
          <!-- El escriba: papiro y cálamo -->
          <rect width="1600" height="900" fill="#2a1b0f" />
          <rect x="420" y="220" width="760" height="460" rx="12" fill="#e9cf9a" />
          <rect x="390" y="200" width="60" height="500" rx="30" fill="#c9a66a" />
          <rect x="1150" y="200" width="60" height="500" rx="30" fill="#c9a66a" />
          <g font-family="Noto Sans Egyptian Hieroglyphs" font-size="54" fill="#5a2c10">
            <text x="520" y="330">𓀀 𓏞 𓂋 𓈖</text><text x="520" y="420">𓇋 𓅓 𓃀 𓊪</text><text x="520" y="510" class="write">𓆣 𓋹 𓂀</text>
          </g>
          <path d="M980 640 L1180 360" stroke="#7a4a20" stroke-width="10" stroke-linecap="round" />
          <path d="M970 655 l14 -24" stroke="#1a0d06" stroke-width="10" stroke-linecap="round" />
        {:else}
          <!-- El mercado al atardecer -->
          <defs><linearGradient id="i4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b1d4a" /><stop offset="0.6" stop-color="#e07a3e" /><stop offset="1" stop-color="#f7c27a" /></linearGradient></defs>
          <rect width="1600" height="900" fill="url(#i4)" />
          <path d="M1100 600 L1260 420 L1420 600Z" fill="#a8562b" opacity="0.7" />
          <g fill="#2a1408">
            <path d="M0 900 V560 h260 l40 -60 h220 l40 60 h300 V900Z" />
            <path d="M860 900 V600 l120 -70 l120 70 h500 V900Z" />
            {#each [120, 380, 640] as x}<path d="M{x} 560 l60 -50 l60 50z" fill="#c0392b" />{/each}
          </g>
          {#each [200, 520, 980, 1300] as x, k}<circle cx={x} cy={640} r="10" fill="#ffcf6b" class="lamp" style="animation-delay: {k * 0.3}s" />{/each}
        {/if}
      </svg>
      <div class="text">
        <p class="kicker">{slides[i].kicker}</p>
        <p class="line">{slides[i].text}</p>
      </div>
    </div>
  {/key}

  <div class="controls">
    <ol class="dots" aria-label="Progreso de la introducción">
      {#each slides as _, k}<li class:on={k <= i} aria-current={k === i ? 'step' : undefined}></li>{/each}
    </ol>
    {#if i < slides.length - 1}
      <button class="next" onclick={next}>Continuar</button>
      <button class="skip" onclick={onfinish}>Saltar intro</button>
    {:else}
      <button class="next start" onclick={onfinish}>{STORY[chapter].start}</button>
    {/if}
  </div>
</section>

<style>
  .intro {
    position: fixed;
    inset: 0;
    z-index: 50;
    overflow: hidden;
    background: #0d0804;
  }
  .frame {
    position: absolute;
    inset: 0;
    animation: fadein 1s ease-out;
  }
  .art {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    /* Movimiento de cámara lento (efecto Ken Burns) */
    animation: camera 7s ease-out both;
  }
  .text {
    position: absolute;
    left: 50%;
    bottom: 22%;
    width: min(46rem, calc(100% - 2.5rem));
    padding: 1.4rem 1.8rem;
    border-left: 3px solid var(--accent);
    background: linear-gradient(90deg, rgb(13 8 4 / 0.85), rgb(13 8 4 / 0.55));
    transform: translateX(-50%);
  }
  .kicker {
    font-family: var(--font-display);
    font-size: 0.9rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--accent);
    animation: rise 0.8s 0.3s both;
  }
  .line {
    margin-top: 0.6rem;
    font-size: clamp(1.25rem, 2.6vw, 1.8rem);
    line-height: 1.4;
    animation: rise 1s 0.7s both;
  }
  .controls {
    position: absolute;
    left: 50%;
    bottom: 6%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    width: calc(100% - 2rem);
    transform: translateX(-50%);
  }
  .dots {
    display: flex;
    gap: 0.4rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .dots li {
    width: 1.8rem;
    height: 3px;
    background: rgb(246 231 201 / 0.25);
  }
  .dots li.on {
    background: var(--accent);
  }
  .controls button {
    padding: 0.7rem 1.4rem;
    border: 1px solid var(--accent);
    border-radius: 999px;
    background: rgb(13 8 4 / 0.6);
    font-family: var(--font-display);
    letter-spacing: 0.08em;
  }
  .controls .start {
    background: var(--accent);
    color: var(--accent-ink);
    font-weight: 700;
  }
  .controls .skip {
    border-color: transparent;
    color: var(--muted);
  }
  :global(.glow) {
    filter: drop-shadow(0 0 18px #ffcf6b);
    animation: pulse 2.4s ease-in-out infinite;
  }
  :global(.sinking) {
    animation: sink 7s ease-in both;
  }
  :global(.drift) {
    animation: drift 7s ease-in-out both;
  }
  :global(.drop) {
    animation: drop 6s ease-in both;
  }
  :global(.sand) {
    animation: sand 1.2s linear infinite;
  }
  :global(.lamp) {
    animation: pulse 1.6s ease-in-out infinite;
  }
  @keyframes drop {
    to {
      transform: translateY(120px);
    }
  }
  @keyframes sand {
    from {
      transform: translateY(-100%);
    }
    to {
      transform: translateY(0);
    }
  }
  @keyframes camera {
    from {
      transform: scale(1.12) translateX(2%);
    }
    to {
      transform: scale(1) translateX(0);
    }
  }
  @keyframes fadein {
    from {
      opacity: 0;
    }
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(14px);
    }
  }
  @keyframes pulse {
    50% {
      opacity: 0.55;
    }
  }
  @keyframes sink {
    to {
      transform: translateY(80px);
    }
  }
  @keyframes drift {
    to {
      transform: translateX(160px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .art,
    .frame,
    .kicker,
    .line,
    :global(.glow),
    :global(.sinking),
    :global(.drift),
    :global(.drop) {
    animation: drop 6s ease-in both;
  }
  :global(.sand) {
    animation: sand 1.2s linear infinite;
  }
  :global(.lamp) {
      animation: none;
    }
  }
</style>
