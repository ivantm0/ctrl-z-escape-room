<script lang="ts">
  import { onMount } from 'svelte';
  import type { LevelProps } from '..';

  let { onsolve }: LevelProps = $props();

  // La salida es el nombre del juego: Ctrl + Escape. Vale a la vez o seguidas
  // (en Windows, Ctrl+Esc a la vez abre el menú Inicio).
  let lastCtrl = 0;
  let message = $state('> Ya no quedan candados. Solo una salida.');
  let done = $state(false);
  let pressed = $state<string | null>(null);

  function press(key: string, ctrl = false) {
    if (done) return;
    pressed = key;
    setTimeout(() => (pressed = null), 150);
    if (key === 'Control') {
      lastCtrl = Date.now();
      message = '> Bien. ¿Y ahora?';
    } else if (key === 'Escape' && (ctrl || Date.now() - lastCtrl < 2000)) {
      done = true;
      message = '> Ctrl + Escape. Siempre estuvo en el nombre.';
      setTimeout(onsolve, 1600);
    } else if (key === 'Escape') {
      message = '> Escape, a secas, no basta. Te falta control.';
    } else {
      message = `> «${key}» no es la salida.`;
    }
  }

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest?.('input, textarea')) return;
      press(e.key === 'Esc' ? 'Escape' : e.key, e.ctrlKey);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  const rows = [
    ['Escape', 'F1', 'F2', 'F3', 'F4', 'F5'],
    ['Tab', 'Q', 'W', 'E', 'R', 'T'],
    ['Control', 'Alt', 'Shift', 'Meta', ' '],
  ];
  const label = (k: string) => ({ Escape: 'Esc', Control: 'Ctrl', Meta: 'Win', ' ': 'Espacio', Shift: 'Mayús' })[k] ?? k;
</script>

<div class="scene" class:done>
  <p class="voice" aria-live="polite">{message}</p>

  <div class="keyboard" role="group" aria-label="Teclado de la máquina">
    {#each rows as row}
      <div class="row">
        {#each row as k}
          <button
            class="key"
            class:wide={k === ' ' || k === 'Control'}
            class:down={pressed === k}
            onclick={() => press(k)}
          >{label(k)}</button>
        {/each}
      </div>
    {/each}
  </div>

  {#if done}
    <div class="exit" aria-hidden="true">EXIT</div>
  {/if}
</div>

<style>
  .scene { display: grid; gap: 2rem; justify-items: start; }
  .voice { font-size: 1.15rem; min-height: 1.6em; color: var(--accent); }
  .keyboard {
    display: grid;
    gap: 0.5rem;
    padding: 1rem;
    border: 1px solid var(--line);
    background: #080808;
    transform: perspective(900px) rotateX(18deg);
  }
  .row { display: flex; gap: 0.5rem; }
  .key {
    min-width: 3.4rem;
    height: 3.2rem;
    padding: 0 0.6rem;
    border: 1px solid #333;
    border-radius: 0.4rem;
    background: linear-gradient(#1c1c1c, #111);
    box-shadow: 0 4px 0 #000;
    font-size: 0.85rem;
    transition: transform 80ms, box-shadow 80ms;
  }
  .key:nth-child(3n) { transform: rotate(-2deg); }
  .key.wide { min-width: 6rem; }
  .key.down, .key:active { transform: translateY(3px); box-shadow: 0 1px 0 #000; border-color: var(--accent); color: var(--accent); }
  .exit {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: grid;
    place-items: center;
    background: #fff;
    color: #000;
    font-family: var(--font-display);
    font-size: 20vw;
    font-weight: 800;
    animation: flash 1.6s ease-in forwards;
  }
  @keyframes flash {
    0% { opacity: 0; }
    15% { opacity: 1; }
    100% { opacity: 1; letter-spacing: 0.4em; }
  }
  @media (max-width: 560px) {
    .key { min-width: 2.6rem; height: 2.8rem; font-size: 0.75rem; }
    .key.wide { min-width: 4.4rem; }
  }
  @media (prefers-reduced-motion: reduce) { .exit { animation: none; } }
</style>
