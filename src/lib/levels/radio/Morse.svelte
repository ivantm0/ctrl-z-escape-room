<script lang="ts">
  import { onMount } from 'svelte';
  import Lock from '$lib/components/Lock.svelte';
  import type { LevelProps } from '..';

  let { onsolve }: LevelProps = $props();

  const CODE: Record<string, string> = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--',
    N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  };
  const WORD = 'FARO';
  const UNIT = 260;

  // Secuencia de encendidos/apagados en unidades: punto 1, raya 3, hueco entre letras 3, entre repeticiones 7
  const steps: [boolean, number][] = [];
  for (const letter of WORD) {
    for (const s of CODE[letter]) steps.push([true, s === '.' ? 1 : 3], [false, 1]);
    steps.push([false, 2]);
  }
  steps.push([false, 5]);

  let lit = $state(false);
  let sound = $state(false);
  let ctx: AudioContext | null = null;
  let gain: GainNode | null = null;

  function toggleSound() {
    sound = !sound;
    if (!ctx) {
      ctx = new AudioContext();
      const osc = ctx.createOscillator();
      osc.frequency.value = 640;
      gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
    }
  }

  onMount(() => {
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const [on, units] = steps[i % steps.length];
      lit = on;
      if (gain && ctx) gain.gain.setTargetAtTime(on && sound ? 0.12 : 0, ctx.currentTime, 0.005);
      i += 1;
      timer = setTimeout(tick, units * UNIT);
    };
    tick();
    return () => {
      clearTimeout(timer);
      ctx?.close();
    };
  });
</script>

<div class="scene">
  <p class="lead">El estudio está a oscuras. Solo una bombilla, que no deja de parpadear.</p>

  <div class="studio">
    <div class="bulb" class:lit aria-hidden="true">
      <span class="wire"></span>
      <span class="glass"></span>
    </div>

    <aside class="chart" aria-label="Tabla de código morse">
      <h2>Código internacional</h2>
      <dl>
        {#each Object.entries(CODE) as [l, c]}
          <div><dt>{l}</dt><dd>{c.replaceAll('.', '•').replaceAll('-', '—')}</dd></div>
        {/each}
      </dl>
    </aside>
  </div>

  <button class="sound" aria-pressed={sound} onclick={toggleSound}>{sound ? '🔊 Sonido activado' : '🔈 Activar sonido'}</button>

  <Lock answer="RkFSTw==" label="Palabra transmitida" {onsolve} />
</div>

<style>
  .scene { display: grid; gap: 1.8rem; justify-items: start; }
  .lead { font-size: 1.1rem; line-height: 1.5; color: var(--muted); }
  .studio { display: flex; flex-wrap: wrap; gap: 3rem; align-items: start; }
  .bulb { display: grid; justify-items: center; }
  .wire { width: 2px; height: 4rem; background: #4a3a30; }
  .glass {
    width: 5.5rem;
    height: 5.5rem;
    border-radius: 50% 50% 45% 45%;
    background: radial-gradient(circle at 40% 35%, #4a3a30, #20140e);
    border: 2px solid #4a3a30;
    transition: background 60ms, box-shadow 60ms;
  }
  .lit .glass {
    background: radial-gradient(circle at 40% 35%, #fff4d6, #ffb347 60%, #ff6a3d);
    box-shadow: 0 0 40px 12px rgb(255 179 71 / 0.55), 0 0 140px 40px rgb(255 106 61 / 0.25);
  }
  .chart {
    padding: 1.2rem 1.4rem;
    background: #e9d9bd;
    color: #2a1a10;
    transform: rotate(-1.5deg);
    box-shadow: 0 14px 30px rgb(0 0 0 / 0.45);
  }
  h2 { margin: 0 0 0.8rem; font-family: var(--font-display); font-size: 1rem; font-weight: 400; }
  dl { display: grid; grid-template-columns: repeat(4, auto); gap: 0.25rem 1.2rem; margin: 0; font-size: 0.85rem; }
  dl div { display: flex; gap: 0.5rem; }
  dt { font-weight: 700; }
  dd { margin: 0; letter-spacing: 0.08em; }
  .sound {
    padding: 0.6rem 1.1rem;
    border: 1px solid var(--line);
    background: none;
    font-size: 0.85rem;
  }
  .sound[aria-pressed='true'] { border-color: var(--accent); color: var(--accent); }
  @media (max-width: 520px) { dl { grid-template-columns: repeat(3, auto); } }
</style>
