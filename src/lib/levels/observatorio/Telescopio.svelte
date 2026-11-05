<script lang="ts">
  import { onMount } from 'svelte';
  import Lock from '$lib/components/Lock.svelte';
  import type { LevelProps } from '..';

  let { onsolve }: LevelProps = $props();

  let w = $state(1);
  let h = $state(1);
  let touch = $state(false);
  onMount(() => (touch = matchMedia('(pointer: coarse)').matches));

  // El ocular es redondo: enfoca cuando la ventana es casi cuadrada.
  // En móvil (sin ventanas que redimensionar) enfoca al girarlo en horizontal.
  const blur = $derived.by(() => {
    if (touch) return w > h ? 0 : 14;
    const off = Math.abs(w / h - 1);
    return Math.min(14, Math.max(0, (off - 0.08) * 26));
  });
  const focus = $derived(Math.round((1 - blur / 14) * 100));
</script>

<svelte:window bind:innerWidth={w} bind:innerHeight={h} />

<div class="scene">
  <p class="lead">El viejo telescopio apunta a un planeta. Pero el ocular no enfoca… o eso parece.</p>

  <div class="eyepiece" class:sharp={blur === 0}>
    <div class="view" style="filter: blur({blur}px)">
      <svg viewBox="0 0 200 120" aria-hidden="true">
        <ellipse cx="100" cy="60" rx="78" ry="16" fill="none" stroke="#e0b46a" stroke-width="3" transform="rotate(-14 100 60)" />
        <circle cx="100" cy="60" r="30" fill="#d9b37a" />
        <path d="M100 30 A30 30 0 0 1 130 60 H70 A30 30 0 0 1 100 30" fill="#c69a5c" opacity="0.6" />
      </svg>
      <p class="label">SATURNO</p>
    </div>
  </div>

  <div class="meter" role="meter" aria-label="Enfoque" aria-valuemin="0" aria-valuemax="100" aria-valuenow={focus}>
    <span>Enfoque</span>
    <div class="bar"><div style="width: {focus}%"></div></div>
    <span class="value">{focus}%</span>
  </div>

  <Lock answer="U0FUVVJOTw==" label="¿Qué planeta ves?" {onsolve} />
</div>

<style>
  .scene {
    display: grid;
    gap: 1.8rem;
    justify-items: start;
  }
  .lead {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-style: italic;
  }
  .eyepiece {
    display: grid;
    place-items: center;
    width: min(22rem, 80vw);
    aspect-ratio: 1;
    border: 10px solid #2a2418;
    border-radius: 50%;
    outline: 2px solid var(--accent);
    background: radial-gradient(circle, #10183a, #03050d 75%);
    box-shadow: inset 0 0 40px #000, 0 0 60px rgb(224 180 106 / 0.12);
    overflow: hidden;
    transition: box-shadow 0.4s;
  }
  .eyepiece.sharp {
    box-shadow: inset 0 0 40px #000, 0 0 80px rgb(224 180 106 / 0.45);
  }
  .view {
    display: grid;
    justify-items: center;
    gap: 0.6rem;
    width: 70%;
    transition: filter 0.25s;
  }
  .label {
    font-family: var(--font-display);
    font-size: 1.6rem;
    letter-spacing: 0.3em;
    color: var(--fg);
  }
  .meter {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .bar {
    width: 10rem;
    height: 4px;
    background: var(--line);
  }
  .bar div {
    height: 100%;
    background: var(--accent);
    transition: width 0.25s;
  }
  .value {
    min-width: 3ch;
    color: var(--fg);
    font-variant-numeric: tabular-nums;
  }
</style>
