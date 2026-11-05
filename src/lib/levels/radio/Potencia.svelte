<script lang="ts">
  import { onMount } from 'svelte';
  import Lock from '$lib/components/Lock.svelte';
  import type { LevelProps } from '..';

  let { onsolve }: LevelProps = $props();

  // A plena potencia = navegador en pantalla completa (API o F11)
  let full = $state(false);
  const check = () => {
    full = !!document.fullscreenElement || matchMedia('(display-mode: fullscreen)').matches;
  };

  onMount(() => {
    check();
    document.addEventListener('fullscreenchange', check);
    addEventListener('resize', check);
    return () => {
      document.removeEventListener('fullscreenchange', check);
      removeEventListener('resize', check);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  });

  const max = () => document.documentElement.requestFullscreen?.().catch(() => {});
</script>

<div class="scene">
  <p class="lead">La emisora llega, pero débil. La aguja tiembla en la zona roja.</p>

  <div class="panel" class:full>
    <div class="screen" aria-live="polite">
      {#if full}
        <p class="big">EMISIÓN A PLENA POTENCIA</p>
        <p>La última clave de la Radio Pirata es: <strong>ECO</strong></p>
      {:else}
        <p class="big warn">SEÑAL DÉBIL</p>
        <p>La emisora necesita toda la pantalla para transmitir.</p>
      {/if}
    </div>
    <div class="gauge" aria-hidden="true">
      <span class="needle" style="transform: rotate({full ? 60 : -55}deg)"></span>
    </div>
    <button class="max" onclick={max} title="Potencia máxima">MAX</button>
  </div>

  <Lock answer="RUNP" label="Clave final de la emisora" {onsolve} />
</div>

<style>
  .scene { display: grid; gap: 1.8rem; justify-items: start; }
  .lead { font-size: 1.1rem; line-height: 1.5; color: var(--muted); }
  .panel {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 1.5rem;
    align-items: center;
    width: min(100%, 44rem);
    padding: 1.6rem;
    border-radius: 1rem;
    background: linear-gradient(160deg, #5a3320, #2b170d);
  }
  .screen {
    padding: 1.2rem;
    border-radius: 0.5rem;
    background: #0d0705;
    line-height: 1.5;
  }
  .big { font-family: var(--font-display); font-size: 1.5rem; color: var(--accent); }
  .warn { color: #b5543a; animation: flicker 1.3s steps(2) infinite; }
  .full .screen { box-shadow: 0 0 30px rgb(255 106 61 / 0.4); }
  strong { color: var(--accent); letter-spacing: 0.2em; }
  .gauge {
    position: relative;
    width: 6rem;
    height: 3.2rem;
    overflow: hidden;
    border-radius: 6rem 6rem 0 0;
    background: conic-gradient(from -90deg at 50% 100%, #b5543a 0 60deg, #e9d9bd 60deg 180deg);
  }
  .needle {
    position: absolute;
    left: calc(50% - 1px);
    bottom: 0;
    width: 2px;
    height: 2.8rem;
    background: #1a0d07;
    transform-origin: bottom;
    transition: transform 0.8s cubic-bezier(0.3, 1.6, 0.5, 1);
  }
  .max {
    position: absolute;
    right: 0.8rem;
    bottom: 0.6rem;
    padding: 0.15rem 0.4rem;
    border: 1px solid #7a4a32;
    border-radius: 3px;
    background: #2b170d;
    color: #c4a88a;
    font-size: 0.6rem;
    letter-spacing: 0.15em;
  }
  @keyframes flicker { 50% { opacity: 0.4; } }
  @media (prefers-reduced-motion: reduce) { .warn { animation: none; } }
</style>
