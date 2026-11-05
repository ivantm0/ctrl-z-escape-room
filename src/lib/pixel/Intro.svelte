<script lang="ts">
  import { onMount } from 'svelte';

  // Intro: la habitación de Leo, la consola, el cartucho sin nombre y el «salto» dentro del juego
  type Slide = { scene: string; text: string };
  let { onfinish, world = 1 }: { onfinish: () => void; world?: 1 | 2 | 3 | 4 } = $props();

  const WORLD1: Slide[] = [
    { scene: 'room', text: 'Son las 3:07 de la madrugada. Leo debería estar durmiendo.' },
    { scene: 'console', text: 'En el desván ha encontrado una consola portátil y un cartucho sin etiqueta. Nadie sabe de qué juego es.' },
    { scene: 'press', text: 'La pantalla se enciende sola: «JUGADOR 1, ¿QUIERES ENTRAR?». Leo pulsa START sin pensarlo.' },
    { scene: 'glitch', text: 'Los píxeles se le pegan a los dedos, luego a los brazos… y la habitación desaparece.' },
    { scene: 'world', text: 'Leo está DENTRO del juego. Si quiere volver a casa, tendrá que encontrar la salida de cada mundo.' },
  ];
  const WORLD2: Slide[] = [
    { scene: 'burst', text: 'Al cruzar la Puerta del Cartucho, el verde estalla en colores: rojo, azul, amarillo… ¡dieciséis a la vez!' },
    { scene: 'castle', text: 'MUNDO 2 · 8 BITS. Leo aparece en el patio del castillo de Bitópolis. Algo no va bien: todo se repite, como en bucle.' },
  ];
  const WORLD3: Slide[] = [
    { scene: 'portal3', text: 'El portal del rey escupe a Leo en una ciudad llena de engranajes. Los píxeles son más pequeños y los colores, más suaves.' },
    { scene: 'clock', text: 'MUNDO 3 · 16 BITS. En Ciudad Engranaje el reloj de la torre se ha parado… y con él, el tiempo.' },
  ];
  const WORLD4: Slide[] = [
    { scene: 'tear', text: 'El portal de la torre se rompe a mitad de viaje. Leo cae por un hueco entre los píxeles, donde los colores no casan.' },
    { scene: 'error', text: 'MUNDO 4 · GLITCH. El juego se está rompiendo. Las paredes mienten, los reflejos desobedecen… y alguien escribe con ceros en vez de oes.' },
  ];
  const slides = $derived(world === 1 ? WORLD1 : world === 2 ? WORLD2 : world === 3 ? WORLD3 : WORLD4);

  let i = $state(0);
  let typed = $state('');
  let timer: ReturnType<typeof setInterval>;

  // Texto que aparece letra a letra, como en un juego antiguo
  function type() {
    clearInterval(timer);
    typed = '';
    const text = slides[i].text;
    let n = 0;
    timer = setInterval(() => {
      n += 1;
      typed = text.slice(0, n);
      if (n >= text.length) clearInterval(timer);
    }, 28);
  }

  function next() {
    if (typed.length < slides[i].text.length) {
      clearInterval(timer);
      typed = slides[i].text;
      return;
    }
    if (i < slides.length - 1) {
      i += 1;
      type();
    } else onfinish();
  }

  onMount(() => {
    type();
    const onKey = (e: KeyboardEvent) => {
      if ([' ', 'Enter', 'ArrowRight', 'z'].includes(e.key)) {
        e.preventDefault();
        next();
      } else if (e.key === 'Escape') onfinish();
    };
    addEventListener('keydown', onKey);
    return () => {
      clearInterval(timer);
      removeEventListener('keydown', onKey);
    };
  });
</script>

<section class="intro scene-{slides[i].scene}" aria-label="Introducción de la historia">
  <div class="art" aria-hidden="true">
    {#if slides[i].scene === 'room'}
      <div class="window"><span class="moon"></span></div>
      <div class="bed"></div>
      <div class="kid"></div>
      <div class="glow"></div>
    {:else if slides[i].scene === 'console' || slides[i].scene === 'press'}
      <div class="console">
        <div class="lcd">
          {#if slides[i].scene === 'press'}
            <p class="blink">JUGADOR 1</p>
            <p>¿QUIERES ENTRAR?</p>
            <p class="start">▶ START</p>
          {:else}
            <p class="dim">· · ·</p>
          {/if}
        </div>
        <div class="controls"><span class="dp"></span><span class="ab"></span></div>
      </div>
    {:else if slides[i].scene === 'glitch'}
      <div class="glitch">
        {#each Array(60) as _, k}<span style="--k: {k}; left: {(k * 7) % 100}%; top: {(k * 13) % 100}%"></span>{/each}
      </div>
    {:else if slides[i].scene === 'burst'}
      <div class="burst">
        {#each Array(48) as _, k}<span style="--k: {k}; left: {(k * 37) % 100}%; top: {(k * 53) % 100}%; background: {['#d82800', '#0058f8', '#f8b800', '#00a844', '#9878f8', '#6cd8fc'][k % 6]}"></span>{/each}
      </div>
    {:else if slides[i].scene === 'portal3'}
      <div class="portal3">
        {#each Array(6) as _, k}<span style="--k: {k}"></span>{/each}
      </div>
    {:else if slides[i].scene === 'clock'}
      <div class="clockscene">
        <div class="ctower"><div class="cface"><i class="hand h1"></i><i class="hand h2"></i></div></div>
        {#each Array(5) as _, k}<span class="gear" style="--k: {k}">⚙</span>{/each}
      </div>
    {:else if slides[i].scene === 'tear'}
      <div class="tear">
        {#each Array(14) as _, k}<span style="--k: {k}; top: {k * 7}%"></span>{/each}
      </div>
    {:else if slides[i].scene === 'error'}
      <div class="errorscene">
        <p class="bsod">FATAL ERROR 0x0D</p>
        <p class="bsod small">MEMORIA CORRUPTA · PULSA CUALQUIER TECLA… O NO</p>
      </div>
    {:else if slides[i].scene === 'castle'}
      <div class="castle">
        <div class="tower t1"></div><div class="tower t2"></div><div class="keep"></div><div class="gate"></div>
        <div class="flag"></div>
      </div>
    {:else}
      <div class="world">
        <div class="hero"></div>
      </div>
    {/if}
  </div>

  <div class="box">
    <p aria-live="polite">{typed}</p>
    <div class="row">
      <span class="dots" aria-hidden="true">{#each slides as _, k}<i class:on={k <= i}></i>{/each}</span>
      <button onclick={next}>{i === slides.length - 1 && typed === slides[i].text ? 'EMPEZAR ▶' : 'SIGUIENTE ▶'}</button>
      <button class="skip" onclick={onfinish}>SALTAR</button>
    </div>
  </div>
</section>

<style>
  .intro {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: grid;
    grid-template-rows: 1fr auto;
    background: #10141a;
    color: #c7d39c;
    font-family: 'Press Start 2P', monospace;
  }
  .art {
    position: relative;
    display: grid;
    place-items: center;
    overflow: hidden;
    image-rendering: pixelated;
  }
  /* Habitación a oscuras con la luz de la consola */
  .window {
    position: absolute;
    top: 14%;
    right: 18%;
    width: 7rem;
    height: 7rem;
    border: 0.6rem solid #2a2f45;
    background: #1b2440;
  }
  .moon {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 1.6rem;
    height: 1.6rem;
    background: #e8e4c9;
    box-shadow: -0.4rem 0 0 #1b2440 inset;
  }
  .bed {
    position: absolute;
    bottom: 18%;
    left: 20%;
    width: 16rem;
    height: 4rem;
    background: #3a3f5c;
    box-shadow: 0 1rem 0 #262a3d;
  }
  .kid {
    position: absolute;
    bottom: calc(18% + 4rem);
    left: calc(20% + 5rem);
    width: 3rem;
    height: 3rem;
    background: #5a3e2b;
    box-shadow: 0 3rem 0 #3f6ba8;
  }
  .glow {
    position: absolute;
    bottom: calc(18% + 3.5rem);
    left: calc(20% + 8.5rem);
    width: 2rem;
    height: 1.4rem;
    background: #9bbc0f;
    box-shadow: 0 0 60px 30px rgb(155 188 15 / 0.35);
    animation: flicker 0.15s steps(2) infinite;
  }
  /* La consola portátil */
  .console {
    display: grid;
    gap: 1.2rem;
    padding: 1.4rem 1.4rem 2.4rem;
    /* Consola inventada: carcasa turquesa con franja naranja */
    border-radius: 2.4rem 2.4rem 1rem 1rem;
    background: linear-gradient(#2f8f8a 0 70%, #e2773f 70% 74%, #2f8f8a 74%);
    box-shadow: inset -0.4rem -0.4rem 0 #23706c;
    animation: zoom 6s ease-out both;
  }
  .lcd {
    display: grid;
    place-content: center;
    gap: 0.8rem;
    width: min(70vw, 18rem);
    aspect-ratio: 10 / 9;
    border: 1rem solid #1d2b2a;
    border-radius: 0.4rem;
    background: #c7d39c;
    color: #1d2b1a;
    font-size: 0.6rem;
    text-align: center;
  }
  .start {
    animation: blink 0.8s steps(1) infinite;
  }
  .dim {
    color: #8bac0f;
  }
  .controls {
    display: flex;
    justify-content: space-between;
    padding: 0 1rem;
  }
  .dp {
    width: 3rem;
    height: 3rem;
    background:
      radial-gradient(circle, #1d2b2a 1.3rem, transparent 1.35rem);
  }
  .ab {
    width: 3.6rem;
    height: 1.6rem;
    background: radial-gradient(circle at 25% 50%, #f2c94c 0.7rem, transparent 0.75rem), radial-gradient(circle at 75% 50%, #f2c94c 0.7rem, transparent 0.75rem);
  }
  /* Píxeles que se despegan */
  .glitch {
    position: absolute;
    inset: 0;
    background: #c7d39c;
  }
  .glitch span {
    position: absolute;
    width: 2rem;
    height: 2rem;
    background: #1d2b1a;
    animation: scatter 1.4s calc(var(--k) * 0.03s) ease-in infinite alternate;
  }
  /* El mundo verde */
  .world {
    position: absolute;
    inset: 0;
    background:
      repeating-linear-gradient(90deg, transparent 0 2rem, rgb(15 56 15 / 0.08) 2rem 2.1rem),
      repeating-linear-gradient(0deg, transparent 0 2rem, rgb(15 56 15 / 0.08) 2rem 2.1rem),
      #c7d39c;
  }
  .hero {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 4rem;
    height: 4rem;
    background: #1d2b1a;
    box-shadow: inset 0 1rem 0 #4f6a3d, inset 0 -1.4rem 0 #8fa36a;
    transform: translate(-50%, -50%);
    animation: drop 1s steps(6) both;
  }
  /* Mundo 2: estallido de color y castillo de 8 bits */
  .burst {
    position: absolute;
    inset: 0;
    background: #000;
  }
  .burst span {
    position: absolute;
    width: 1.6rem;
    height: 1.6rem;
    animation: pop 1.2s calc(var(--k) * 0.04s) steps(4) both infinite alternate;
  }
  .castle {
    position: absolute;
    inset: 0;
    background: linear-gradient(#0058f8 0 65%, #00a844 65%);
  }
  .castle div {
    position: absolute;
    bottom: 35%;
    background: repeating-linear-gradient(0deg, #bcbcbc 0 1.2rem, #7c7c7c 1.2rem 1.4rem);
  }
  .tower {
    width: 5rem;
    height: 16rem;
  }
  .t1 {
    left: calc(50% - 15rem);
  }
  .t2 {
    left: calc(50% + 10rem);
  }
  .keep {
    left: calc(50% - 10rem);
    width: 20rem;
    height: 11rem;
  }
  .castle .gate {
    left: calc(50% - 2rem);
    width: 4rem;
    height: 5rem;
    background: #503000;
  }
  .castle .flag {
    left: calc(50% - 13rem);
    bottom: calc(35% + 16rem);
    width: 3rem;
    height: 1.8rem;
    background: #d82800;
    animation: wave 0.6s steps(2) infinite;
  }
  @keyframes pop {
    from {
      transform: scale(0);
    }
  }
  @keyframes wave {
    50% {
      transform: skewY(8deg);
    }
  }
  /* Mundo 3: anillos de portal y torre del reloj parada */
  .portal3 {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: #141420;
  }
  .portal3 span {
    position: absolute;
    width: calc(4rem + var(--k) * 3rem);
    aspect-ratio: 1;
    border: 0.5rem solid #c44ca4;
    border-color: #c44ca4 #3c7cd8 #f4c840 #86d4f4;
    animation: spin calc(2s + var(--k) * 0.6s) linear infinite;
  }
  .clockscene {
    position: absolute;
    inset: 0;
    background: linear-gradient(#4e3a78 0 60%, #8c8070 60%);
  }
  .ctower {
    position: absolute;
    left: 50%;
    bottom: 40%;
    width: 9rem;
    height: 20rem;
    background: repeating-linear-gradient(0deg, #c8bca8 0 1.4rem, #8c8070 1.4rem 1.6rem);
    transform: translateX(-50%);
  }
  .cface {
    position: absolute;
    top: 2rem;
    left: 1rem;
    width: 7rem;
    height: 7rem;
    border: 0.5rem solid #f4c840;
    border-radius: 50%;
    background: #f8f4ec;
  }
  .hand {
    position: absolute;
    left: 50%;
    bottom: 50%;
    width: 0.4rem;
    background: #141420;
    transform-origin: bottom;
  }
  .h1 {
    height: 2.4rem;
    transform: rotate(-60deg);
  }
  .h2 {
    height: 3rem;
    transform: rotate(90deg);
  }
  .gear {
    position: absolute;
    bottom: calc(10% + var(--k) * 6%);
    left: calc(10% + var(--k) * 18%);
    font-size: 3rem;
    color: #f4c840;
    opacity: 0.6;
  }
  /* Mundo 4: franjas que se desgarran y pantalla de error */
  .tear {
    position: absolute;
    inset: 0;
    background: #08060e;
  }
  .tear span {
    position: absolute;
    left: 0;
    width: 100%;
    height: 7%;
    background: linear-gradient(90deg, #ff2a6d, #05d9e8 40%, #39ff14 60%, #2a2340);
    opacity: 0.8;
    animation: shear calc(0.4s + var(--k) * 0.07s) steps(3) infinite alternate;
  }
  .errorscene {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    gap: 1.4rem;
    background: #3c7cd8;
    color: #f0f0ff;
    text-align: center;
  }
  .bsod {
    font-size: clamp(1rem, 4vw, 2rem);
    animation: blink 1.2s steps(1) infinite;
  }
  .bsod.small {
    font-size: 0.6rem;
    animation: none;
  }
  @keyframes shear {
    to {
      transform: translateX(calc((var(--k) - 7) * 2rem));
    }
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .box {
    display: grid;
    gap: 1rem;
    margin: 0 auto 1.5rem;
    width: min(46rem, calc(100% - 2rem));
    padding: 1.2rem 1.4rem;
    border: 4px solid #c7d39c;
    background: #10141a;
    font-size: clamp(0.6rem, 2vw, 0.8rem);
    line-height: 1.9;
  }
  .box p {
    min-height: 3.8em;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 1rem;
  }
  .dots {
    display: flex;
    gap: 0.3rem;
    margin-right: auto;
  }
  .dots i {
    width: 0.8rem;
    height: 0.8rem;
    background: #3a4452;
  }
  .dots i.on {
    background: #9bbc0f;
  }
  .row button {
    padding: 0.6rem 0.9rem;
    border: 3px solid #c7d39c;
    background: none;
    color: #c7d39c;
    font-family: inherit;
    font-size: 0.65rem;
  }
  .row .skip {
    border-color: transparent;
    color: #7a8496;
  }
  @keyframes flicker {
    to {
      opacity: 0.75;
    }
  }
  @keyframes zoom {
    from {
      transform: scale(0.75);
    }
  }
  @keyframes blink {
    50% {
      opacity: 0;
    }
  }
  @keyframes scatter {
    to {
      transform: translate(calc((var(--k) - 30) * 0.4rem), -6rem) scale(0.4);
      opacity: 0;
    }
  }
  @keyframes drop {
    from {
      transform: translate(-50%, -400%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .glow,
    .console,
    .start,
    .glitch span,
    .burst span,
    .portal3 span,
    .tear span,
    .bsod,
    .castle .flag,
    .hero {
      animation: none;
    }
  }
</style>
