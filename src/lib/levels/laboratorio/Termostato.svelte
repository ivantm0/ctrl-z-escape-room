<script lang="ts">
  import { onMount } from 'svelte';
  import Lock from '$lib/components/Lock.svelte';
  import type { LevelProps } from '..';

  let { onsolve }: LevelProps = $props();

  const KEY = 'laboratorio:temperatura';
  let temp = $state(20);

  onMount(() => {
    // El termostato vive en el localStorage: se cambia desde las herramientas de desarrollador
    try {
      if (localStorage.getItem(KEY) === null) localStorage.setItem(KEY, '20');
    } catch {}
    const read = () => {
      try {
        const v = parseFloat(localStorage.getItem(KEY) ?? '20');
        temp = Number.isFinite(v) ? v : 20;
      } catch {}
    };
    read();
    const id = setInterval(read, 500);
    return () => clearInterval(id);
  });

  const boiling = $derived(temp >= 100);
</script>

<div class="scene">
  <p class="lead">
    El último experimento exige llevar el líquido a ebullición. El termostato del laboratorio está
    bloqueado… desde aquí.
  </p>

  <div class="setup">
    <div class="beaker" class:boiling>
      <span class="liquid" style="--t: {Math.min(temp, 100) / 100}"></span>
      {#if boiling}
        {#each [0, 1, 2, 3, 4, 5] as i}<span class="bubble" style="--i: {i}"></span>{/each}
        <span class="steam" aria-live="polite">EBULLICIÓN</span>
      {/if}
    </div>

    <div class="panel">
      <p class="temp" role="status" aria-label="Temperatura">{temp.toFixed(0)} °C</p>
      <p class="target">Objetivo: 100 °C</p>
      <p class="sensor">Sensor conectado a: <code>almacenamiento local</code></p>
      <p class="locked">🔒 Control manual bloqueado</p>
    </div>
  </div>

  <Lock answer="RUJVTExJQ0lPTg==" label="¿Qué palabra dibuja el vapor?" {onsolve} />
</div>

<style>
  .scene { display: grid; gap: 1.8rem; justify-items: start; }
  .lead { max-width: 42rem; font-size: 1.15rem; line-height: 1.5; color: var(--muted); }
  .setup { display: flex; flex-wrap: wrap; gap: 3rem; align-items: end; }
  .beaker {
    position: relative;
    width: 10rem;
    height: 12rem;
    border: 3px solid #9fb9b2;
    border-top: 0;
    border-radius: 0 0 1.2rem 1.2rem;
    background: rgb(255 255 255 / 0.5);
  }
  .liquid {
    position: absolute;
    inset: auto 0 0;
    height: 60%;
    border-radius: 0 0 1rem 1rem;
    background: color-mix(in srgb, #ff5d3a calc(var(--t) * 100%), #3fb8e0);
    transition: background 0.6s;
  }
  .bubble {
    position: absolute;
    bottom: 10%;
    left: calc(12% + var(--i) * 14%);
    width: 0.7rem;
    height: 0.7rem;
    border: 2px solid rgb(255 255 255 / 0.8);
    border-radius: 50%;
    animation: rise 1.4s calc(var(--i) * 0.2s) ease-in infinite;
  }
  .steam {
    position: absolute;
    bottom: 100%;
    left: 50%;
    padding-bottom: 1rem;
    font-weight: 700;
    font-size: 1.4rem;
    letter-spacing: 0.15em;
    color: var(--accent);
    transform: translateX(-50%);
    animation: steam 1.2s ease-out;
  }
  .panel {
    display: grid;
    gap: 0.4rem;
    padding: 1.2rem 1.4rem;
    border: 1px solid var(--line);
    background: var(--surface);
  }
  .temp { font-size: 3rem; font-weight: 700; font-variant-numeric: tabular-nums; }
  .boiling ~ .panel .temp, .target { color: var(--muted); }
  .sensor, .locked { font-size: 0.85rem; color: var(--muted); }
  code { font-family: 'IBM Plex Mono', monospace; color: var(--fg); }
  @keyframes rise { to { transform: translateY(-6rem); opacity: 0; } }
  @keyframes steam { from { opacity: 0; transform: translate(-50%, 1rem); filter: blur(6px); } }
  @media (prefers-reduced-motion: reduce) { .bubble, .steam { animation: none; } }
</style>
