<script lang="ts">
  import { faraon } from '../state.svelte';
  import Scene, { type Spot } from '../Scene.svelte';
  import Campamento from './Campamento.svelte';
  import Losa from './Losa.svelte';
  import Altar from './Altar.svelte';
  import Espejo from './Espejo.svelte';
  import Cara from './Cara.svelte';

  let { reveal = false }: { reveal?: boolean } = $props();

  const spots: Spot[] = $derived([
    { id: 'campamento', label: 'Tienda de los obreros', title: 'El campamento de los obreros', x: 40, y: 450, w: 340, h: 300, view: Campamento, done: faraon.isDone('campamento') },
    { id: 'losa', label: 'Arena removida', title: 'Algo bajo la arena', x: 420, y: 720, w: 260, h: 120, view: Losa, done: faraon.isDone('losa') },
    { id: 'espejo', label: 'Poste de bronce', title: 'El poste del espejo', x: 760, y: 470, w: 100, h: 300, view: Espejo, done: faraon.isDone('espejo') },
    { id: 'cara', label: 'Cara de la pirámide', title: 'La cara de la pirámide', x: 930, y: 260, w: 260, h: 330, view: Cara },
    { id: 'altar', label: 'Altar de los dioses', title: 'El altar de los tres dioses', x: 1220, y: 560, w: 340, h: 260, view: Altar, done: faraon.isDone('ofrendas') },
  ]);

  const beam = $derived(faraon.isDone('espejo'));
  const open = $derived(faraon.isDone('entrada'));
  const mirror = $derived(faraon.s.used.includes('espejo'));
</script>

<Scene {spots} {reveal} closed={open}>
  {#snippet art()}
    <svg viewBox="0 0 1600 900" aria-hidden="true">
      <defs>
        <linearGradient id="p-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#4a2238" /><stop offset="0.5" stop-color="#d4643a" /><stop offset="1" stop-color="#f6bd6c" />
        </linearGradient>
        <linearGradient id="p-sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#e6ac64" /><stop offset="1" stop-color="#b8763a" />
        </linearGradient>
        <radialGradient id="p-sun"><stop offset="0" stop-color="#fff1c2" /><stop offset="1" stop-color="#ffb15c" stop-opacity="0" /></radialGradient>
        <linearGradient id="p-beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff4c8" stop-opacity="0.2" /><stop offset="1" stop-color="#fff4c8" /></linearGradient>
      </defs>

      <!-- Cielo y sol bajo, a la izquierda -->
      <rect width="1600" height="900" fill="url(#p-sky)" />
      <circle cx="260" cy="300" r="220" fill="url(#p-sun)" />
      <circle cx="260" cy="300" r="64" fill="#fff0c4" />
      {#each [[520, 160], [600, 190], [1380, 140]] as [x, y]}<path d="M{x} {y} q12 -8 24 0 q12 -8 24 0" stroke="#2a1408" stroke-width="3" fill="none" class="bird" opacity="0.5" />{/each}

      <!-- Pirámides lejanas y la gran pirámide -->
      <path d="M1340 620 L1460 470 L1580 620Z" fill="#c67a45" opacity="0.7" />
      <path d="M560 640 L1060 90 L1560 640Z" fill="#c98a4c" />
      <path d="M1060 90 L1560 640 H1130Z" fill="#9a5a2c" />
      {#each Array(12) as _, k}<path d="M{1060 - (k + 1) * 41.6} {90 + (k + 1) * 45.8} H{1060 + (k + 1) * 41.6}" stroke="#a96d38" stroke-width="2" opacity="0.5" />{/each}
      <g font-family="Noto Sans Egyptian Hieroglyphs" font-size="40" fill="#5a2c10" text-anchor="middle">
        <text x="1060" y="330">𓂀</text><text x="1060" y="420">𓋹</text><text x="1060" y="510" class:glowing={beam}>𓆣</text>
      </g>
      {#if open}
        <path d="M1025 470 h70 v80 h-70z" fill="#1a0d06" />
        <path d="M1025 470 h70 v80 h-70z" fill="none" stroke="#ffe2a0" stroke-width="3" />
      {:else if beam}
        <path d="M1025 470 h70 v80 h-70z" fill="none" stroke="#ffe2a0" stroke-width="3" stroke-dasharray="8 6" class="glowing" />
      {/if}

      <!-- Suelo -->
      <path d="M0 640 Q400 610 800 640 T1600 630 V900 H0Z" fill="url(#p-sand)" />
      <path class="drift" d="M200 860 q40 -16 80 0 M700 870 q50 -18 100 0 M1180 860 q40 -14 80 0" stroke="#c98544" stroke-width="5" fill="none" />

      <!-- Campamento de los obreros -->
      <g>
        <path d="M60 740 L210 470 L360 740Z" fill="#e8d6b0" />
        <path d="M210 470 L360 740 H250Z" fill="#cdb98e" />
        <path d="M180 740 L210 600 L240 740Z" fill="#3a2410" />
        <path d="M210 470 V440" stroke="#6b3e1c" stroke-width="6" />
        <ellipse cx="320" cy="760" rx="36" ry="14" fill="#82552a" /><path d="M286 760 q34 -40 68 0" fill="#9a6a34" />
        <path d="M300 740 l14 -36 M318 738 l6 -34" stroke="#b58a4a" stroke-width="4" />
        <circle cx="110" cy="770" r="16" fill="#3a2410" opacity="0.7" /><path d="M96 770 q14 -30 28 0" fill="#e9763a" class="glowing" />
      </g>

      <!-- Losa asomando bajo la arena -->
      <g>
        <path d="M440 800 q120 -70 220 -10 q10 30 -20 40 q-100 10 -200 0z" fill="#d9a35e" />
        {#if faraon.isDone('losa')}
          <rect x="470" y="760" width="170" height="60" rx="4" fill="#8f8574" />
          <text x="555" y="800" text-anchor="middle" font-family="Noto Sans Egyptian Hieroglyphs" font-size="24" fill="#2a1d0c">𓇳 𓋴 𓆣</text>
        {:else}
          <path d="M600 772 l40 -6 l6 22 l-40 4z" fill="#8f8574" />
        {/if}
      </g>

      <!-- Poste de bronce con (o sin) espejo, y el rayo de sol -->
      <path d="M810 780 V520" stroke="#7a5a2a" stroke-width="10" />
      {#if mirror}
        <ellipse cx="810" cy="510" rx="30" ry="34" fill="#e9b54a" stroke="#a87a2a" stroke-width="4" />
      {:else}
        <circle cx="810" cy="510" r="24" fill="none" stroke="#7a5a2a" stroke-width="6" />
      {/if}
      {#if beam}
        <path d="M300 320 L810 510" stroke="#fff4c8" stroke-width="5" opacity="0.35" />
        <path d="M810 510 L1060 498" stroke="url(#p-beam)" stroke-width="7" class="glowing" />
      {/if}

      <!-- Altar con Ra, Thot y Anubis -->
      <g>
        <rect x="1240" y="720" width="300" height="80" fill="#6e6455" /><rect x="1230" y="710" width="320" height="16" fill="#8f8574" />
        {#each [[1290, '𓇳'], [1390, '𓅞'], [1490, '𓃢']] as [x, g]}
          <rect x={+x - 30} y="610" width="60" height="100" rx="6" fill="#4a3a2a" />
          <text x={x} y="660" text-anchor="middle" font-family="Noto Sans Egyptian Hieroglyphs" font-size="44" fill={faraon.isDone('ofrendas') ? '#ffe2a0' : '#8c7c66'} class:glowing={faraon.isDone('ofrendas')}>{g}</text>
        {/each}
      </g>
    </svg>
  {/snippet}
</Scene>

<style>
  :global(.glowing) {
    filter: drop-shadow(0 0 10px #ffd98a);
    animation: glowing 1.8s ease-in-out infinite alternate;
  }
  @keyframes glowing {
    to {
      opacity: 0.7;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    :global(.glowing) {
      animation: none;
    }
  }
</style>
