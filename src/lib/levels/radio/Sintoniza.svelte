<script lang="ts">
  import { onMount } from 'svelte';
  import Lock from '$lib/components/Lock.svelte';
  import type { LevelProps } from '..';

  let { onsolve }: LevelProps = $props();

  const TARGET = 98.6;
  const MESSAGE = 'Aquí Radio Pirata. La contraseña de hoy es antena. Repito: antena.';

  let freq = $state(91.2);
  let on = $state(false);
  let captions = $state(false);

  // Intensidad de la señal: máxima en la frecuencia buena
  const signal = $derived(Math.max(0, 1 - Math.abs(freq - TARGET) / 4));
  const tuned = $derived(Math.abs(freq - TARGET) < 0.15);

  let ctx: AudioContext | null = null;
  let noise: GainNode | null = null;
  let speaking: ReturnType<typeof setInterval> | undefined;

  function powerOn() {
    on = true;
    // Ruido blanco sintetizado con Web Audio: baja a medida que sintonizas
    ctx = new AudioContext();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    noise = ctx.createGain();
    noise.gain.value = 0.08;
    src.connect(noise).connect(ctx.destination);
    src.start();
  }

  function speak() {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(MESSAGE);
    u.lang = 'es-ES';
    u.rate = 0.9;
    u.pitch = 0.7;
    speechSynthesis.speak(u);
  }

  $effect(() => {
    if (noise && ctx) noise.gain.setTargetAtTime(on ? 0.08 * (1 - signal) + 0.005 : 0, ctx.currentTime, 0.05);
  });

  // Sintonizada y encendida: la emisora repite el mensaje
  $effect(() => {
    clearInterval(speaking);
    if (on && tuned) {
      speak();
      speaking = setInterval(speak, 7000);
    } else if ('speechSynthesis' in window) speechSynthesis.cancel();
  });

  onMount(() => () => {
    clearInterval(speaking);
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    ctx?.close();
  });

  const bars = 12;
</script>

<div class="scene">
  <p class="lead">Una radio vieja en una mesa. Alguien emite desde algún punto del dial.</p>

  <div class="radio" class:on>
    <div class="display">
      <span class="freq">{freq.toFixed(1)}</span><span class="unit">MHz</span>
      <div class="meter" role="meter" aria-label="Intensidad de la señal" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(signal * 100)}>
        {#each Array(bars) as _, i}
          <span class:lit={on && i < Math.round(signal * bars)}></span>
        {/each}
      </div>
      <p class="caption" aria-live="polite">
        {#if captions && on}
          {tuned ? `«${MESSAGE}»` : '[ruido de estática]'}
        {/if}
      </p>
    </div>

    <label class="dial">
      <span class="sr-only">Dial de frecuencia</span>
      <input type="range" min="87.5" max="108" step="0.1" bind:value={freq} disabled={!on} />
      <span class="scale" aria-hidden="true"><span>88</span><span>92</span><span>96</span><span>100</span><span>104</span><span>108</span></span>
    </label>

    <div class="controls">
      <button class="power" onclick={() => (on ? ((on = false), ctx?.suspend()) : ctx ? ((on = true), ctx.resume()) : powerOn())} aria-pressed={on}>
        {on ? 'Apagar' : 'Encender'}
      </button>
      <button class="cc" aria-pressed={captions} onclick={() => (captions = !captions)} title="Subtítulos">CC</button>
    </div>
  </div>

  <Lock answer="QU5URU5B" label="Contraseña de la emisora" {onsolve} />
</div>

<style>
  .scene { display: grid; gap: 1.8rem; justify-items: start; }
  .lead { font-size: 1.1rem; line-height: 1.5; color: var(--muted); }
  .radio {
    display: grid;
    gap: 1.4rem;
    width: min(100%, 40rem);
    padding: 1.6rem;
    border-radius: 1.2rem;
    background: linear-gradient(160deg, #5a3320, #2b170d);
    box-shadow: inset 0 2px 0 rgb(255 255 255 / 0.12), 0 30px 60px rgb(0 0 0 / 0.5);
  }
  .display {
    padding: 1.2rem;
    border-radius: 0.6rem;
    background: #0d0705;
    box-shadow: inset 0 0 30px #000;
    min-height: 10rem;
  }
  .freq {
    font-family: var(--font-display);
    font-size: 3rem;
    color: #5a2a1a;
    transition: color 0.3s, text-shadow 0.3s;
  }
  .on .freq { color: var(--accent); text-shadow: 0 0 18px rgb(255 106 61 / 0.6); }
  .unit { margin-left: 0.5rem; color: var(--muted); font-size: 0.9rem; }
  .meter { display: flex; gap: 4px; margin-top: 0.8rem; }
  .meter span { width: 14px; height: 10px; background: #3a1d12; }
  .meter span.lit { background: var(--accent); box-shadow: 0 0 6px var(--accent); }
  .caption { margin-top: 0.9rem; min-height: 1.4em; font-size: 0.95rem; color: var(--fg); }
  .dial { display: grid; gap: 0.3rem; }
  input[type='range'] { width: 100%; accent-color: var(--accent); }
  .scale { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--muted); }
  .controls { display: flex; gap: 0.8rem; }
  .controls button {
    padding: 0.6rem 1.2rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: #1a0d07;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 0.8rem;
  }
  .controls [aria-pressed='true'] { border-color: var(--accent); color: var(--accent); }
</style>
