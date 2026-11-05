<script lang="ts">
  import { onMount } from 'svelte';
  import Lock from '$lib/components/Lock.svelte';
  import type { LevelProps } from '..';

  let { onsolve }: LevelProps = $props();

  // Aumentos = zoom del navegador (devicePixelRatio respecto al inicial) o pellizco en móvil
  let zoom = $state(1);

  onMount(() => {
    const base = devicePixelRatio;
    const update = () => {
      zoom = Math.max(devicePixelRatio / base, visualViewport?.scale ?? 1);
    };
    addEventListener('resize', update);
    visualViewport?.addEventListener('resize', update);
    return () => {
      removeEventListener('resize', update);
      visualViewport?.removeEventListener('resize', update);
    };
  });

  const focused = $derived(zoom >= 1.5);
  const power = $derived(Math.round(zoom * 100));
</script>

<div class="scene">
  <p class="lead">En la platina hay una muestra. A estos aumentos no se distingue nada.</p>

  <div class="scope">
    <div class="lens" class:focused>
      <svg viewBox="0 0 200 200" aria-hidden="true">
        {#each [[60, 70, 26], [130, 60, 20], [110, 135, 30], [50, 140, 16]] as [x, y, r]}
          <circle cx={x} cy={y} {r} fill="none" stroke="#00806a" stroke-opacity="0.35" stroke-width="2" />
          <circle cx={x + 4} cy={y - 3} r={r / 3.5} fill="#00806a" fill-opacity="0.25" />
        {/each}
      </svg>
      <p class="sample" aria-live="polite">{focused ? 'CÉLULA' : '·'}</p>
    </div>
    <dl class="readout">
      <div><dt>Aumentos</dt><dd>{power}×</dd></div>
      <div><dt>Necesarios</dt><dd>150×</dd></div>
    </dl>
  </div>

  <Lock answer="Q0VMVUxB" label="¿Qué hay en la muestra?" {onsolve} />
</div>

<style>
  .scene { display: grid; gap: 1.8rem; justify-items: start; }
  .lead { font-size: 1.15rem; line-height: 1.5; color: var(--muted); }
  .scope { display: flex; flex-wrap: wrap; gap: 2rem; align-items: center; }
  .lens {
    position: relative;
    display: grid;
    place-items: center;
    width: min(18rem, 75vw);
    aspect-ratio: 1;
    border: 12px solid #0f2a26;
    border-radius: 50%;
    background: radial-gradient(circle, #ffffff, #d7ebe4);
    overflow: hidden;
  }
  .lens svg { position: absolute; inset: 0; filter: blur(5px); transition: filter 0.4s; }
  .lens.focused svg { filter: none; }
  .sample {
    position: relative;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 4px;
    letter-spacing: 0.1em;
    color: #0f2a26;
    transition: font-size 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .focused .sample { font-size: 1.8rem; font-weight: 700; }
  .readout { display: grid; gap: 0.8rem; margin: 0; }
  dt { font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); }
  dd { margin: 0; font-size: 1.8rem; font-variant-numeric: tabular-nums; }
</style>
