<script lang="ts">
  import Lock from '$lib/components/Lock.svelte';
  import type { LevelProps } from '..';

  let { onsolve }: LevelProps = $props();

  let copied = $state(false);

  // Lo que se ve no es lo que se copia: el portapapeles recibe otra cosa
  function oncopy(e: ClipboardEvent) {
    e.preventDefault();
    e.clipboardData?.setData('text/plain', 'ESPEJO');
    copied = true;
  }
</script>

<div class="scene">
  <p class="voice">&gt; Hola. Sé que estás ahí, al otro lado del cristal.</p>
  <p class="voice">&gt; Antes de dejarte pasar, escribe mi nombre.</p>

  <p class="machine-name" {oncopy} data-text="MÁQUINA">MÁQUINA</p>

  {#if copied}
    <p class="voice whisper">&gt; Ahora llevas un trozo de mí contigo.</p>
  {/if}

  <Lock
    answer="RVNQRUpP"
    label="Mi nombre"
    {onsolve}
    taunts={{
      MAQUINA: 'Eso es lo que ves. No lo que soy. No lo escribas: llévatelo.',
      LAMAQUINA: 'Eso es lo que ves. No lo que soy. No lo escribas: llévatelo.',
    }}
  />
</div>

<style>
  .scene { display: grid; gap: 1.2rem; justify-items: start; }
  .voice { font-size: 1.05rem; color: var(--muted); }
  .whisper { color: var(--accent); }
  .machine-name {
    position: relative;
    margin: 1.5rem 0;
    font-family: var(--font-display);
    font-size: clamp(3rem, 13vw, 9rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1;
    user-select: text;
  }
  /* Glitch: dos copias desplazadas en magenta y cian */
  .machine-name::before,
  .machine-name::after {
    content: attr(data-text);
    position: absolute;
    inset: 0;
    pointer-events: none;
    user-select: none;
  }
  .machine-name::before { color: #ff2bd6; animation: glitch 2.4s steps(1) infinite; clip-path: inset(0 0 55% 0); }
  .machine-name::after { color: #22e6ff; animation: glitch 1.9s steps(1) infinite reverse; clip-path: inset(60% 0 0 0); }
  @keyframes glitch {
    0%, 86% { transform: none; opacity: 0; }
    88% { transform: translate(-6px, 2px); opacity: 1; }
    92% { transform: translate(5px, -2px); opacity: 1; }
    96% { transform: translate(-2px, 0); opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) { .machine-name::before, .machine-name::after { animation: none; } }
</style>
