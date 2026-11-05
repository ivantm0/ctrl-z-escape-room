<script lang="ts">
  import { onMount } from 'svelte';
  import { faraon, ESCAPE_MS, PENALTY_MS } from '../state.svelte';
  import { sfx } from '../audio';
  import Palancas from './Palancas.svelte';
  import Losas from './Losas.svelte';
  import Rueda from './Rueda.svelte';

  // La huida: tres pruebas seguidas contra una cuenta atrás real
  const STAGES = [
    { id: 'palancas', title: 'El techo que baja', view: Palancas },
    { id: 'losas', title: 'El suelo que se hunde', view: Losas },
    { id: 'rueda', title: 'La losa de salida', view: Rueda },
  ] as const;

  let now = $state(Date.now());
  let jolting = $state(false);

  onMount(() => {
    const id = setInterval(() => (now = Date.now()), 250);
    return () => clearInterval(id);
  });

  const stage = $derived(STAGES.findIndex((s) => !faraon.isDone(s.id)));
  const escaped = $derived(stage === -1);
  const deadline = $derived(faraon.s.deadline);
  const left = $derived(deadline ? Math.max(0, deadline - now) : ESCAPE_MS);
  const sealed = $derived(!!deadline && left === 0 && !escaped);
  const urgent = $derived(left < 30_000);
  const clock = $derived(`${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, '0')}`);

  function penalty() {
    faraon.penalize();
    // Temblor sin volver a montar la prueba (conserva su mensaje)
    jolting = false;
    requestAnimationFrame(() => (jolting = true));
    setTimeout(() => (jolting = false), 550);
  }

  $effect(() => {
    if (sealed) sfx('stone');
  });

  const Stage = $derived(stage >= 0 ? STAGES[stage].view : null);
</script>

<div class="escape" class:urgent class:jolt={jolting}>
  <!-- Arena cayendo del techo -->
  <div class="sand" aria-hidden="true">
    {#each Array(14) as _, k}<span style="left: {4 + k * 7}%; animation-delay: {(k * 0.37) % 1.4}s; animation-duration: {0.9 + (k % 4) * 0.25}s"></span>{/each}
  </div>

  <header class="clock">
    <p class="label">La tumba se sella en</p>
    <p class="time" role="timer" aria-label="Tiempo restante {clock}">{clock}</p>
    <ol class="stages" aria-label="Pruebas">
      {#each STAGES as s, k}
        <li class:done={faraon.isDone(s.id)} class:current={k === stage}>{s.title}</li>
      {/each}
    </ol>
  </header>

  {#if !deadline && !escaped}
    <div class="ready">
      <p>La tumba tiembla. Tienes {ESCAPE_MS / 60000} minutos; cada error resta {PENALTY_MS / 1000} segundos.</p>
      <button class="act" onclick={() => faraon.startEscape()}>¡Empezar la huida!</button>
    </div>
  {:else if Stage && !sealed}
    {#key stage}
      <section class="card" aria-labelledby="stage-title">
        <h2 id="stage-title">{STAGES[stage].title}</h2>
        <Stage onpenalty={penalty} />
      </section>
    {/key}
  {/if}

  {#if sealed}
    <section class="sealed" aria-labelledby="sealed-title">
      <p class="kicker">Demasiado tarde</p>
      <h2 id="sealed-title">La tumba se ha sellado</h2>
      <p>
        El último bloque cae con un estruendo y la oscuridad lo cubre todo… Pero esto es un juego: aún
        tienes el mapa y la memoria de lo que has visto.
      </p>
      <button class="act" onclick={() => { faraon.failEscape(); faraon.startEscape(); }}>Intentarlo de nuevo</button>
    </section>
  {/if}
</div>

<style>
  .escape {
    position: relative;
    display: grid;
    gap: 1.4rem;
    max-width: 52rem;
    margin: 0 auto;
    padding: 0 1rem;
  }
  .sand {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .sand span {
    position: absolute;
    top: 0;
    width: 2px;
    height: 30vh;
    background: linear-gradient(transparent, rgb(217 163 94 / 0.5));
    animation: fall linear infinite;
  }
  .clock {
    position: relative;
    z-index: 1;
    display: grid;
    justify-items: center;
    gap: 0.3rem;
  }
  .label {
    font-family: var(--font-display);
    font-size: 0.8rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .time {
    font-family: var(--font-display);
    font-size: clamp(3rem, 12vw, 5rem);
    font-weight: 900;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--accent);
    text-shadow: 0 0 30px rgb(233 181 74 / 0.4);
  }
  .urgent .time {
    color: #ff5d3a;
    animation: pulse 0.8s ease-in-out infinite;
  }
  .stages {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    margin: 0.4rem 0 0;
    padding: 0;
    list-style: none;
  }
  .stages li {
    padding: 0.3rem 0.8rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    font-size: 0.85rem;
    color: var(--muted);
  }
  .stages li.current {
    border-color: var(--accent);
    color: var(--fg);
  }
  .stages li.done {
    color: var(--accent);
    text-decoration: line-through;
  }
  .card,
  .ready,
  .sealed {
    position: relative;
    z-index: 1;
    display: grid;
    justify-items: center;
    gap: 1rem;
    padding: clamp(1rem, 3vw, 1.8rem);
    border: 1px solid var(--line);
    border-radius: 0.8rem;
    background: rgb(42 27 15 / 0.92);
    text-align: center;
  }
  .card h2,
  .sealed h2 {
    font-family: var(--font-display);
    font-size: clamp(1.4rem, 4vw, 2rem);
    color: var(--accent);
  }
  .jolt {
    animation: jolt 0.5s;
  }
  .sealed {
    border-color: #ff5d3a;
  }
  .kicker {
    font-family: var(--font-display);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #ff8a6a;
  }
  .sealed p:not(.kicker),
  .ready p {
    max-width: 34rem;
    line-height: 1.6;
  }
  .act {
    padding: 0.8rem 1.6rem;
    border: 1px solid var(--accent);
    border-radius: 999px;
    background: var(--accent);
    color: var(--accent-ink);
    font-family: var(--font-display);
    font-weight: 700;
  }
  @keyframes fall {
    from {
      transform: translateY(-30vh);
    }
    to {
      transform: translateY(110vh);
    }
  }
  @keyframes pulse {
    50% {
      transform: scale(1.06);
    }
  }
  @keyframes jolt {
    20% {
      transform: translate(-8px, 4px);
    }
    40% {
      transform: translate(7px, -3px);
    }
    60% {
      transform: translate(-4px, 2px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .sand span,
    .urgent .time,
    .jolt {
      animation: none;
    }
  }
</style>
