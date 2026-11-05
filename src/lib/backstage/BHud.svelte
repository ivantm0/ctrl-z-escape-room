<script lang="ts">
  import { onMount } from 'svelte';
  import { formatTime } from '$lib/game.svelte';
  import { setSound, sfx } from '$lib/pixel/audio';
  import { HINTS, LEVEL_NAMES, backstage } from './state.svelte';

  let now = $state(Date.now());
  let hintsOpen = $state(false);
  onMount(() => {
    const id = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(id);
  });

  const step = $derived(backstage.current);
  const shown = $derived(step ? (backstage.s.hints[step] ?? 0) : 0);
  const labels = ['Pista', 'Pista clara', 'Solución'];
  const range = $derived(backstage.timeRange);
</script>

<header class="hud l{backstage.s.level}">
  <a href="/" aria-label="Volver a los escape rooms">←<span class="wide">&nbsp;Escape rooms</span></a>
  <p class="title"><span class="wide">PANTALLA {backstage.s.level} ·&nbsp;</span>{LEVEL_NAMES[backstage.s.level].toUpperCase()}</p>
  <div class="tools">
    <span class="time" aria-label="Tiempo">{formatTime((range.to ?? now) - (range.from ?? now))}</span>
    <button
      aria-pressed={backstage.sound}
      aria-label={backstage.sound ? 'Silenciar' : 'Activar sonido'}
      onclick={() => {
        backstage.toggleSound();
        setSound(backstage.sound);
        sfx('talk');
      }}>{backstage.sound ? '♪' : '×'}</button>
    <button aria-expanded={hintsOpen} aria-label="Pistas" onclick={() => (hintsOpen = !hintsOpen)}>?</button>
  </div>
</header>

{#if hintsOpen}
  <aside class="panel" aria-label="Pistas">
    {#if step}
      <ol>
        {#each HINTS[step].slice(0, shown) as h, i}<li><span>{labels[i]}</span>{h}</li>{/each}
      </ol>
      {#if shown < 3}<button onclick={() => backstage.hint(step)}>VER {labels[shown].toUpperCase()}</button>{/if}
    {:else}
      <p>Ya no necesitas pistas.</p>
    {/if}
  </aside>
{/if}

<style>
  /* Pantalla 1: BIOS azul con letras blancas y amarillas */
  .hud {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.7rem clamp(1rem, 3vw, 2rem);
    border-bottom: 4px solid #55ffff;
    background: #0000aa;
    color: #ffffff;
    font-family: 'Press Start 2P', monospace;
    font-size: 0.65rem;
  }
  .hud a {
    color: inherit;
    text-decoration: none;
  }
  .title {
    color: #ffff55;
  }
  .tools {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .tools button {
    width: 2.2rem;
    height: 2.2rem;
    border: 3px solid #55ffff;
    background: #00006a;
    color: #ffffff;
    font-family: inherit;
  }
  .tools [aria-expanded='true'] {
    background: #55ffff;
    color: #00006a;
  }
  .panel {
    position: fixed;
    z-index: 20;
    top: 4rem;
    right: 1rem;
    width: min(24rem, calc(100vw - 2rem));
    padding: 1rem;
    border: 4px solid #ffffff;
    background: #0000aa;
    color: #ffffff;
    font-family: 'Press Start 2P', monospace;
    font-size: 0.6rem;
    line-height: 1.8;
    box-shadow: 0 0 0 4px #00006a;
  }
  ol {
    display: grid;
    gap: 0.8rem;
    margin: 0 0 0.8rem;
    padding: 0;
    list-style: none;
  }
  li span {
    display: block;
    color: #ffff55;
  }
  .panel button {
    width: 100%;
    padding: 0.5rem;
    border: 3px solid #ffffff;
    background: none;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
  }
  /* Pantalla 2: menú rosa y turquesa */
  .hud.l2 {
    border-color: #ff4fa0;
    background: #2d1b5a;
  }
  .hud.l2 .title {
    color: #3ee0d0;
  }
  .hud.l2 .tools button {
    border-color: #ff4fa0;
    background: #120a24;
  }
  /* Pantalla 3: gris de ajustes */
  .hud.l3 {
    border-color: #ffd23f;
    background: #3a3d45;
  }
  .hud.l3 .tools button {
    border-color: #ffd23f;
    background: #1e2026;
  }
  /* Pantalla 4: terminal verde */
  .hud.l4 {
    border-color: #00ff66;
    background: #000c04;
  }
  .hud.l4 .title {
    color: #00ff66;
  }
  .hud.l4 .tools button {
    border-color: #00ff66;
    background: #06240f;
  }
  /* Pantalla 5: sepia */
  .hud.l5 {
    border-color: #c9a66b;
    background: #3d2a1a;
    color: #f3e6c8;
  }
  .hud.l5 .title {
    color: #c9a66b;
  }
  .hud.l5 .tools button {
    border-color: #c9a66b;
    background: #2b1d12;
  }
  /* Pantalla 6: glitch total */
  .hud.l6 {
    border-color: #ff4fa0;
    background: #0b0718;
    color: #ffffff;
  }
  .hud.l6 .title {
    color: #3ee0d0;
  }
  .hud.l6 .tools button {
    border-color: #3ee0d0;
    background: #1d1438;
  }
  @media (max-width: 640px) {
    .wide {
      display: none;
    }
  }
</style>
