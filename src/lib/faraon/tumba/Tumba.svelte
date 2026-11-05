<script lang="ts">
  import { faraon } from '../state.svelte';
  import Scene, { type Spot } from '../Scene.svelte';
  import Antorcha from './Antorcha.svelte';
  import Fresco from './Fresco.svelte';
  import Pesaje from './Pesaje.svelte';
  import Inscripcion from './Inscripcion.svelte';
  import Canopos from './Canopos.svelte';
  import Sarcofago from './Sarcofago.svelte';

  let { reveal = false }: { reveal?: boolean } = $props();

  const spots: Spot[] = $derived([
    { id: 'antorcha', label: 'Soporte de la entrada', title: 'La antorcha de la entrada', x: 40, y: 260, w: 150, h: 260, view: Antorcha, done: faraon.isDone('antorcha') },
    { id: 'fresco', label: 'Gran fresco', title: 'El Juicio de Osiris', x: 220, y: 150, w: 420, h: 300, view: Fresco, done: faraon.isDone('fresco') },
    { id: 'pesaje', label: 'Estatua de Anubis', title: 'La balanza de Anubis', x: 250, y: 500, w: 260, h: 340, view: Pesaje, done: faraon.isDone('pesaje') },
    { id: 'sarcofago', label: 'Sarcófago', title: 'El sarcófago del faraón', x: 640, y: 480, w: 360, h: 300, view: Sarcofago },
    { id: 'pilar', label: 'Inscripción del pilar', title: 'La inscripción del pilar', x: 1080, y: 160, w: 130, h: 520, view: Inscripcion },
    { id: 'canopos', label: 'Vasos canopos', title: 'Los vasos canopos', x: 1250, y: 520, w: 320, h: 260, view: Canopos, done: faraon.isDone('canopos') },
  ]);

  // Sin antorcha solo se ve un círculo pequeño; con ella, mucho más
  const light = $derived(faraon.isDone('antorcha') ? 26 : 9);
  const open = $derived(faraon.isDone('sarcofago'));
</script>

<Scene {spots} {reveal} {light} closed={open}>
  {#snippet art()}
    <svg viewBox="0 0 1600 900" aria-hidden="true">
      <defs>
        <linearGradient id="t-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3a1e" /><stop offset="1" stop-color="#3a2410" /></linearGradient>
        <linearGradient id="t-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3018" /><stop offset="1" stop-color="#24150a" /></linearGradient>
        <pattern id="t-stars" width="80" height="60" patternUnits="userSpaceOnUse">
          <rect width="80" height="60" fill="#1d2f6b" /><text x="20" y="34" font-size="22" fill="#e9b54a">✶</text><text x="60" y="56" font-size="14" fill="#e9b54a">✶</text>
        </pattern>
      </defs>

      <!-- Techo estrellado, muros y suelo -->
      <rect width="1600" height="120" fill="url(#t-stars)" />
      <rect y="120" width="1600" height="560" fill="url(#t-wall)" />
      {#each Array(9) as _, k}<path d="M0 {170 + k * 60} H1600" stroke="#2e1c0c" stroke-width="2" opacity="0.5" />{/each}
      <path d="M0 680 H1600 V900 H0Z" fill="url(#t-floor)" />
      <path d="M0 120 H1600" stroke="#c99a4a" stroke-width="6" />

      <!-- Entrada con el soporte de la antorcha -->
      <path d="M50 680 V330 H180 V680" fill="#120a05" />
      <rect x="100" y="380" width="20" height="60" fill="#6b4220" />
      {#if faraon.s.items.includes('antorcha')}
        <path d="M95 380 h30" stroke="#6b4220" stroke-width="6" />
      {:else}
        <rect x="104" y="320" width="12" height="70" fill="#8a5a2e" /><ellipse cx="110" cy="318" rx="10" ry="8" fill="#3a2410" />
      {/if}

      <!-- Gran fresco del juicio (desordenado hasta resolverlo) -->
      <rect x="230" y="160" width="400" height="280" fill="#d9b886" />
      <rect x="230" y="160" width="400" height="280" fill="none" stroke="#1d3f8a" stroke-width="8" />
      {#each faraon.isDone('fresco') ? ['𓃢', '𓄣', '𓅞', '𓀭'] : ['𓅞', '𓀭', '𓃢', '𓄣'] as g, k}
        <text x={280 + k * 100} y="330" text-anchor="middle" font-family="Noto Sans Egyptian Hieroglyphs" font-size="64" fill="#5a2c10">{g}</text>
      {/each}
      {#if faraon.isDone('fresco')}
        <rect x="560" y="400" width="50" height="30" fill="#120a05" />
      {/if}

      <!-- Estatua de Anubis con la balanza -->
      <g>
        <rect x="300" y="760" width="160" height="40" fill="#2a1a0e" />
        <path d="M340 760 V600 q40 -30 80 0 V760Z" fill="#141414" />
        <text x="380" y="600" text-anchor="middle" font-family="Noto Sans Egyptian Hieroglyphs" font-size="80" fill="#141414">𓃢</text>
        <path d="M420 640 H490 M455 640 V560" stroke="#c99a4a" stroke-width="4" />
        <path d="M420 560 h70" stroke="#c99a4a" stroke-width="4" transform={faraon.isDone('pesaje') ? '' : 'rotate(12 455 560)'} />
        <circle cx="425" cy={faraon.isDone('pesaje') ? 580 : 568} r="9" fill="#b8352a" />
      </g>

      <!-- Sarcófago -->
      <g>
        <rect x="660" y="620" width="320" height="140" rx="10" fill="#3d3d3d" />
        <path d="M660 620 q160 -60 320 0" fill={faraon.isDone('sarcofago') ? 'none' : '#555'} stroke="#777" stroke-width="3" transform={faraon.isDone('sarcofago') ? 'translate(60 -40)' : ''} />
        <text x="820" y="700" text-anchor="middle" font-family="Noto Sans Egyptian Hieroglyphs" font-size="38" fill="#c99a4a">𓋹 𓆣 𓋹</text>
      </g>

      <!-- Pilar con inscripción -->
      <rect x="1090" y="120" width="110" height="560" fill="#6b4a2a" />
      <g font-family="Noto Sans Egyptian Hieroglyphs" font-size="34" fill="#2a1a0e" text-anchor="middle">
        {#each ['𓀀', '𓃻', '𓃥', '𓅃', '𓇳', '𓈖', '𓊪'] as g, k}<text x="1145" y={200 + k * 66}>{g}</text>{/each}
      </g>

      <!-- Vasos canopos en su repisa -->
      <rect x="1260" y="720" width="300" height="24" fill="#2a1a0e" />
      {#each faraon.isDone('canopos') ? ['𓃻', '𓃥', '𓀀', '𓅃'] : ['𓅃', '𓀀', '𓃻', '𓃥'] as g, k}
        <path d="M{1290 + k * 72} 720 q-20 -40 0 -110 h32 q20 70 0 110z" fill="#d9c9a3" />
        <text x={1306 + k * 72} y="612" text-anchor="middle" font-family="Noto Sans Egyptian Hieroglyphs" font-size="30" fill="#3a2410">{g}</text>
      {/each}
    </svg>
  {/snippet}
</Scene>
