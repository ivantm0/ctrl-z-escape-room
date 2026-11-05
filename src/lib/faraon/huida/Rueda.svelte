<script lang="ts">
  import { onMount } from 'svelte';
  import { faraon } from '../state.svelte';
  import { sfx } from '../audio';

  // Esta prueba no penaliza: la propia arena es el castigo
  let {}: { onpenalty?: () => void } = $props();

  // La losa de salida sube con cada vuelta de la rueda y la arena la vuelve a bajar
  const PUSH = 8;
  const DECAY_PER_S = 14;

  let lift = $state(0);
  let turns = $state(0);
  const done = $derived(faraon.isDone('rueda'));

  function crank() {
    if (done) return;
    sfx('click');
    turns += 1;
    lift = Math.min(100, lift + PUSH);
    if (lift >= 100) {
      sfx('ok');
      faraon.complete('rueda');
    }
  }

  onMount(() => {
    let last = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const dt = (now - last) / 1000;
      last = now;
      if (!faraon.isDone('rueda')) lift = Math.max(0, lift - DECAY_PER_S * dt);
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  });
</script>

<div class="stage">
  <p class="lead">
    La salida: una losa enorme atada con cuerdas a una rueda de madera. Al otro lado se ve la luz roja
    del atardecer. La arena la empuja hacia abajo sin descanso.
  </p>

  <div class="door" aria-hidden="true">
    <div class="sunset"></div>
    <div class="slab" style="transform: translateY({-lift * 0.85}%)"></div>
  </div>

  <div class="meter" role="progressbar" aria-label="Altura de la losa" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(lift)}>
    <div style="width: {lift}%"></div>
  </div>

  <button class="wheel" onclick={crank} disabled={done} aria-label="Girar la rueda">
    <span class="spokes" style="transform: rotate({turns * 40}deg)" aria-hidden="true">✺</span>
    <span>{done ? '¡Abierta!' : 'Girar la rueda'}</span>
  </button>
  <p class="tip">Pulsa muy deprisa (también con Espacio o Intro).</p>
</div>

<style>
  .stage {
    display: grid;
    gap: 1rem;
    justify-items: center;
  }
  .lead {
    max-width: 40rem;
    font-size: 1.1rem;
    font-style: italic;
    line-height: 1.6;
    text-align: center;
  }
  .door {
    position: relative;
    width: min(100%, 18rem);
    aspect-ratio: 4 / 5;
    overflow: hidden;
    border: 10px solid #3a2410;
    border-bottom: 0;
  }
  .sunset {
    position: absolute;
    inset: 0;
    background: linear-gradient(#5a2238, #e2773f 60%, #f6bd6c);
  }
  .slab {
    position: absolute;
    inset: 0;
    background:
      repeating-linear-gradient(0deg, transparent 0 38px, rgb(0 0 0 / 0.25) 38px 41px),
      linear-gradient(#7a5a3a, #5a3e24);
    transition: transform 0.08s linear;
  }
  .meter {
    width: min(100%, 18rem);
    height: 0.6rem;
    border-radius: 999px;
    background: var(--line);
    overflow: hidden;
  }
  .meter div {
    height: 100%;
    background: var(--accent);
  }
  .wheel {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.8rem 1.6rem;
    border: 2px solid var(--accent);
    border-radius: 999px;
    background: var(--accent);
    color: var(--accent-ink);
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 700;
    touch-action: manipulation;
    user-select: none;
  }
  .wheel:active {
    transform: scale(0.96);
  }
  .spokes {
    display: inline-block;
    font-size: 1.6rem;
    transition: transform 0.15s;
  }
  .tip {
    font-size: 0.9rem;
    font-style: italic;
    color: var(--muted);
  }
</style>
