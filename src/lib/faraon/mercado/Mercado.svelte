<script lang="ts">
  import { faraon } from '../state.svelte';
  import Scene, { type Spot } from '../Scene.svelte';
  import Estela from './Estela.svelte';
  import Balanza from './Balanza.svelte';
  import Vasijas from './Vasijas.svelte';
  import Cofre from './Cofre.svelte';
  import Guardia from './Guardia.svelte';
  import Gato from './Gato.svelte';

  let { reveal = false }: { reveal?: boolean } = $props();

  const spots: Spot[] = $derived([
    { id: 'especias', label: 'Puesto de especias', title: 'El mercader de especias', x: 60, y: 330, w: 420, h: 400, view: Balanza, done: faraon.isDone('balanza'), tagBelow: true },
    { id: 'estela', label: 'Estela de piedra', title: 'La estela del pozo', x: 690, y: 405, w: 100, h: 215, view: Estela },
    { id: 'alfarero', label: 'Puesto del alfarero', title: 'Las vasijas del alfarero', x: 490, y: 640, w: 390, h: 190, view: Vasijas, done: faraon.isDone('vasijas') },
    { id: 'escriba', label: 'Escriba real', title: 'El escriba real', x: 905, y: 420, w: 280, h: 320, view: Cofre, done: faraon.isDone('cofre') },
    { id: 'gato', label: 'Gato sagrado', title: 'Un gato sagrado', x: 1188, y: 296, w: 90, h: 72, view: Gato, tagBelow: true },
    { id: 'guardia', label: 'Guardia de la necrópolis', title: 'La puerta de la necrópolis', x: 1236, y: 470, w: 250, h: 300, view: Guardia },
  ]);

  const gateOpen = $derived(faraon.isDone('puerta'));
</script>

<Scene {spots} {reveal} closed={gateOpen}>
  {#snippet art()}
    <svg viewBox="0 0 1600 900" aria-hidden="true">
    <defs>
      <linearGradient id="m-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3a1f4d" /><stop offset="0.45" stop-color="#c8573a" /><stop offset="0.8" stop-color="#f2a65a" /><stop offset="1" stop-color="#f7cf8a" />
      </linearGradient>
      <linearGradient id="m-sand" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e2a862" /><stop offset="1" stop-color="#b9783c" />
      </linearGradient>
      <pattern id="m-awning" width="40" height="80" patternUnits="userSpaceOnUse">
        <rect width="20" height="80" fill="#b8352a" /><rect x="20" width="20" height="80" fill="#f1e2c0" />
      </pattern>
      <radialGradient id="m-sun"><stop offset="0" stop-color="#fff1c2" /><stop offset="1" stop-color="#ffb15c" stop-opacity="0" /></radialGradient>
    </defs>

    <!-- Cielo, sol y pirámides lejanas -->
    <rect width="1600" height="900" fill="url(#m-sky)" />
    <circle cx="1400" cy="390" r="190" fill="url(#m-sun)" />
    <circle cx="1400" cy="390" r="56" fill="#fff0c4" />
    <path d="M1290 560 L1400 430 L1510 560Z" fill="#b8693a" />
    <path d="M1400 430 L1510 560 H1440Z" fill="#8f4a25" />
    <path d="M1180 560 L1250 480 L1320 560Z" fill="#c67a45" opacity="0.85" />
    <g fill="#2a1408" opacity="0.5">
      {#each [[140, 300], [230, 330], [980, 280]] as [x, y]}<path d="M{x} {y} q12 -8 24 0 q12 -8 24 0" stroke="#2a1408" stroke-width="3" fill="none" class="bird" />{/each}
    </g>

    <!-- Casas de adobe al fondo -->
    <g fill="#c98a52">
      <rect x="0" y="420" width="220" height="180" /><rect x="200" y="380" width="160" height="220" fill="#b97a45" />
      <rect x="560" y="440" width="260" height="160" fill="#d29a60" /><rect x="820" y="400" width="190" height="200" fill="#bf8048" />
      <rect x="1000" y="450" width="200" height="150" />
    </g>
    <g fill="#5a2f14">
      {#each [[60, 470], [140, 470], [250, 430], [300, 500], [620, 480], [700, 480], [880, 450], [940, 520], [1060, 490]] as [x, y]}<rect x={x} y={y} width="26" height="34" rx="13" />{/each}
    </g>

    <!-- Palmeras -->
    {#each [[520, 600, 1], [1140, 610, 0.85]] as [x, y, s]}
      <g transform="translate({x} {y}) scale({s})" class="palm">
        <path d="M0 0 q-10 -120 10 -240" stroke="#6b3e1c" stroke-width="16" fill="none" />
        <g fill="#3f6b2a"><path d="M10 -240 q-90 -20 -150 40 q80 -30 150 -40z" /><path d="M10 -240 q90 -30 150 30 q-80 -30 -150 -30z" /><path d="M10 -240 q-40 -90 -130 -90 q80 20 130 90z" /><path d="M10 -240 q50 -90 140 -70 q-90 0 -140 70z" /></g>
      </g>
    {/each}

    <!-- Suelo -->
    <path d="M0 590 Q400 570 800 590 T1600 585 V900 H0Z" fill="url(#m-sand)" />

    <!-- Muralla y puerta de la necrópolis -->
    <rect x="1190" y="380" width="410" height="400" fill="#d6a36a" />
    <g fill="#c08a52">{#each Array(10) as _, k}<rect x={1190 + k * 42} y="360" width="28" height="30" />{/each}</g>
    <path d="M1340 780 V520 q65 -60 130 0 V780Z" fill={gateOpen ? '#f7cf8a' : '#5a3214'} />
    {#if gateOpen}
      <path d="M1360 780 L1405 610 L1450 780Z" fill="#b8693a" />
    {:else}
      <g stroke="#3a1f0c" stroke-width="4"><path d="M1405 500 V780" /><path d="M1350 600 h110 M1350 690 h110" /></g>
    {/if}
    <text x="1405" y="455" text-anchor="middle" font-family="Noto Sans Egyptian Hieroglyphs" font-size="34" fill="#5a2f14">𓃢 𓋹 𓃢</text>

    <!-- Guardia con lanza -->
    <g transform="translate(1268 500)">
      <path d="M30 -10 V270" stroke="#4a2c14" stroke-width="5" /><path d="M24 -10 l6 -26 l6 26z" fill="#9aa4a8" />
      <circle cx="0" cy="30" r="22" fill="#8a5130" /><path d="M-22 22 q22 -30 44 0 v14 h-44z" fill="#1d3f8a" />
      <path d="M-26 60 h52 l8 110 h-68z" fill="#8a5130" /><path d="M-30 120 h60 l10 60 h-80z" fill="#f1e2c0" />
      <path d="M-16 180 v90 M14 180 v90" stroke="#8a5130" stroke-width="12" />
    </g>

    <!-- Gato sagrado sobre la muralla, mirando a la derecha -->
    <g transform="translate(1200 330)" fill="#2a1408">
      <ellipse cx="34" cy="24" rx="26" ry="14" /><circle cx="62" cy="10" r="12" /><path d="M56 0 l3 -12 l6 10z M66 0 l5 -12 l4 12z" />
      <path d="M10 26 q-20 -4 -12 -28" stroke="#2a1408" stroke-width="5" fill="none" class="tail" />
      <circle cx="66" cy="9" r="2.4" fill="#f2c94c" />
    </g>

    <!-- Estela y pozo -->
    <path d="M700 610 V445 q40 -40 80 0 V610Z" fill="#8f8574" />
    <g font-family="Noto Sans Egyptian Hieroglyphs" font-size="20" fill="#3a2a14" text-anchor="middle">
      <text x="740" y="480">𓏺 𓎆 𓍢</text><text x="740" y="520">𓅃 →</text><text x="740" y="560">𓋹 𓂀</text>
    </g>
    <ellipse cx="840" cy="612" rx="58" ry="16" fill="#6e6455" /><rect x="782" y="580" width="116" height="34" fill="#8f8574" />
    <ellipse cx="840" cy="580" rx="58" ry="14" fill="#2a1d10" />

    <!-- Puesto de especias con toldo y balanza -->
    <g>
      <path d="M70 720 V380 M460 720 V380" stroke="#6b3e1c" stroke-width="10" />
      <path d="M40 330 H490 L470 400 H60Z" fill="url(#m-awning)" />
      <path d="M60 400 q35 22 70 0 q35 22 70 0 q35 22 70 0 q35 22 70 0 q35 22 70 0 q35 22 70 0" fill="#b8352a" />
      <!-- Mercader -->
      <circle cx="210" cy="510" r="30" fill="#8a5130" /><path d="M180 500 q30 -46 60 0z" fill="#f1e2c0" />
      <path d="M170 545 h80 l10 70 h-100z" fill="#f1e2c0" />
      <rect x="60" y="600" width="420" height="120" fill="#8d5a2b" /><rect x="60" y="600" width="420" height="14" fill="#a8703a" />
      {#each [[110, '#d9a400'], [175, '#b8352a'], [240, '#7a8b2a'], [300, '#c86a1e']] as [x, c]}
        <path d="M{+x - 30} 600 q30 -54 60 0z" fill={String(c)} />
      {/each}
      <!-- Balanza -->
      <path d="M400 600 V520" stroke="#c99a4a" stroke-width="5" /><path d="M350 525 h100" stroke="#c99a4a" stroke-width="5" />
      <path d="M350 525 l-16 40 h32z M450 525 l-16 46 h32z" fill="none" stroke="#c99a4a" stroke-width="2" />
      <path d="M334 565 h32 M434 571 h32" stroke="#c99a4a" stroke-width="5" />
      <path d="M338 562 q12 -26 24 0z" fill="#b5803e" />
    </g>

    <!-- Puesto del alfarero -->
    <path d="M480 820 L500 700 H880 L900 820Z" fill="#a0672f" opacity="0.6" />
    {#each [[540, 0.72, '#b5643a'], [612, 0.86, '#a3552f'], [684, 1, '#c07547'], [756, 0.72, '#9c4c2a'], [828, 0.86, '#b86a3c']] as [x, s, c]}
      <g transform="translate({+x - 30} {800 - 120 * +s}) scale({0.6} {0.86 * +s})">
        <path d="M34 10 h32 v10 q26 14 26 56 q0 50 -42 62 q-42 -12 -42 -62 q0 -42 26 -56z" fill={String(c)} />
      </g>
    {/each}

    <!-- Escriba bajo su toldo con el cofre -->
    <g>
      <path d="M915 740 V450 M1175 740 V450" stroke="#6b3e1c" stroke-width="8" />
      <path d="M900 420 H1190 L1175 470 H915Z" fill="#1d3f8a" />
      <path d="M915 470 q32 18 65 0 q32 18 65 0 q32 18 65 0 q32 18 65 0" fill="#1d3f8a" />
      <circle cx="1010" cy="575" r="26" fill="#8a5130" /><path d="M984 566 q26 -38 52 0 v16 h-52z" fill="#1a1a1a" />
      <path d="M975 605 h70 l20 90 h-110z" fill="#f1e2c0" />
      <rect x="1030" y="640" width="70" height="44" fill="#e9cf9a" transform="rotate(-8 1060 660)" />
      <path d="M1080 630 l20 -36" stroke="#6b3e1c" stroke-width="4" />
      <rect x="1080" y="690" width="96" height="56" rx="6" fill="#6b4220" /><path d="M1080 702 q48 -36 96 0" fill="#8a5a2e" />
      <rect x="1120" y="712" width="16" height="16" rx="2" fill="#c99a4a" />
    </g>
    </svg>
  {/snippet}
</Scene>
