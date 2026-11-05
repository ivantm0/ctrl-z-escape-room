<script lang="ts">
  import { onMount } from 'svelte';
  import Lock from '$lib/components/Lock.svelte';
  import type { LevelProps } from '..';

  let { onsolve }: LevelProps = $props();

  let printed = $state(false);
  onMount(() => {
    const mark = () => (printed = true);
    addEventListener('beforeprint', mark);
    return () => removeEventListener('beforeprint', mark);
  });
</script>

<div class="scene">
  <div class="screen">
    <p class="err">ERROR 0x0P · FORMATO NO COMPATIBLE</p>
    <p>&gt; Mis planos no se pueden mostrar en una pantalla.</p>
    <p>&gt; Esta parte de mí solo se entiende <strong>en papel</strong>.</p>
    {#if printed}
      <p class="ack">&gt; ¿Lo has visto? Entonces ya sabes de qué estoy hecha.</p>
    {/if}
  </div>

  <!-- Solo existe en la vista de impresión -->
  <section class="blueprint" aria-hidden="true">
    <p class="title">PLANO Nº 6 · PIEZA CENTRAL</p>
    <svg viewBox="0 0 200 200" width="260" height="260">
      <g fill="none" stroke="#000" stroke-width="2">
        <circle cx="100" cy="100" r="60" />
        <circle cx="100" cy="100" r="18" />
        {#each Array(12) as _, i}
          <rect x="92" y="28" width="16" height="16" transform="rotate({i * 30} 100 100)" />
        {/each}
      </g>
    </svg>
    <p class="code">ENGRANAJE</p>
  </section>

  <Lock answer="RU5HUkFOQUpF" label="Pieza del plano" {onsolve} />
</div>

<style>
  .scene { display: grid; gap: 1.6rem; justify-items: start; }
  .screen {
    display: grid;
    gap: 0.6rem;
    width: min(100%, 40rem);
    padding: 1.5rem;
    border: 1px solid var(--accent);
    background: repeating-linear-gradient(0deg, #0c0c0c 0 2px, #050505 2px 4px);
    line-height: 1.5;
  }
  .err { color: var(--accent); letter-spacing: 0.1em; animation: blink 1s steps(2) infinite; }
  .ack { color: var(--accent); }
  strong { color: var(--fg); text-decoration: underline wavy var(--accent); }
  .blueprint { display: none; }

  @media print {
    .screen, .scene :global(.lock) { display: none; }
    .blueprint {
      display: grid;
      justify-items: center;
      gap: 1rem;
      padding: 2rem;
      border: 2px solid #000;
      color: #000;
      font-family: 'IBM Plex Mono', monospace;
    }
    .code { font-size: 3rem; font-weight: 700; letter-spacing: 0.2em; }
  }
  @keyframes blink { 50% { opacity: 0.4; } }
  @media (prefers-reduced-motion: reduce) { .err { animation: none; } }
</style>
