<script lang="ts">
  /**
   * Controles táctiles de «A Oscuras». Solo se montan en móvil/tableta.
   * No tocan el motor: simulan las mismas teclas que el teclado (keydown mientras
   * se mantiene pulsado el botón, keyup al soltarlo), y Game.svelte las escucha en window.
   */
  import { onDestroy } from 'svelte';

  type Btn = { key: string; label: string; name: string; cls: string };

  const MOVE: Btn[] = [
    { key: 'ArrowUp', label: '▲', name: 'Arriba (trepar)', cls: 'up' },
    { key: 'ArrowLeft', label: '◀', name: 'Izquierda', cls: 'left' },
    { key: 'ArrowRight', label: '▶', name: 'Derecha', cls: 'right' },
    { key: 'ArrowDown', label: '▼', name: 'Abajo (bajar escaleras)', cls: 'down' },
  ];
  const ACTIONS: Btn[] = [
    { key: 'r', label: '↺', name: 'Reiniciar galería', cls: 'small reset' },
    { key: 'q', label: 'Q', name: 'Encender bengala', cls: 'small flare' },
    { key: 'e', label: 'E', name: 'Usar: lámpara, pico, palanca, leer', cls: 'use' },
    { key: ' ', label: '⤒', name: 'Saltar', cls: 'jump' },
  ];

  // Teclas mantenidas por cada dedo (pointerId), para soltar la correcta aunque se pulsen varias a la vez
  const held = new Map<number, string>();

  const send = (type: 'keydown' | 'keyup', key: string) => dispatchEvent(new KeyboardEvent(type, { key }));

  function down(e: PointerEvent, key: string) {
    e.preventDefault();
    // Que el botón siga recibiendo el dedo aunque se deslice un poco fuera
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    const prev = held.get(e.pointerId);
    if (prev) send('keyup', prev);
    held.set(e.pointerId, key);
    send('keydown', key);
    navigator.vibrate?.(8);
  }

  function up(e: PointerEvent) {
    const key = held.get(e.pointerId);
    if (!key) return;
    held.delete(e.pointerId);
    send('keyup', key);
  }

  onDestroy(() => {
    for (const key of held.values()) send('keyup', key);
    held.clear();
  });
</script>

{#snippet button(b: Btn)}
  <button
    type="button"
    class={b.cls}
    aria-label={b.name}
    onpointerdown={(e) => down(e, b.key)}
    onpointerup={up}
    onpointercancel={up}
    onlostpointercapture={up}
    oncontextmenu={(e) => e.preventDefault()}>{b.label}</button
  >
{/snippet}

<div class="touchpad" aria-label="Controles táctiles">
  <div class="dpad">
    {#each MOVE as b (b.key)}{@render button(b)}{/each}
  </div>
  <div class="actions">
    {#each ACTIONS as b (b.key)}{@render button(b)}{/each}
  </div>
</div>

<style>
  .touchpad {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 20;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 0.75rem max(1rem, env(safe-area-inset-right)) max(0.9rem, env(safe-area-inset-bottom))
      max(1rem, env(safe-area-inset-left));
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }
  button {
    pointer-events: auto;
    touch-action: none;
    border: 1px solid rgb(201 162 39 / 0.45);
    background: rgb(18 12 8 / 0.62);
    color: #f0e2c8;
    font: 700 1.1rem/1 ui-monospace, monospace;
    -webkit-tap-highlight-color: transparent;
  }
  button:active {
    background: rgb(201 162 39 / 0.55);
    color: #120e0c;
  }
  .dpad {
    display: grid;
    grid-template-areas: '. u .' 'l . r' '. d .';
    grid-template-columns: repeat(3, 3.4rem);
    grid-template-rows: repeat(3, 3.4rem);
  }
  .up {
    grid-area: u;
    border-radius: 0.5rem 0.5rem 0 0;
  }
  .down {
    grid-area: d;
    border-radius: 0 0 0.5rem 0.5rem;
  }
  .left {
    grid-area: l;
    border-radius: 0.5rem 0 0 0.5rem;
  }
  .right {
    grid-area: r;
    border-radius: 0 0.5rem 0.5rem 0;
  }
  .actions {
    display: grid;
    grid-template-areas: 'r q' 'e j';
    grid-template-columns: 4.2rem 4.6rem;
    gap: 0.6rem;
    align-items: end;
    justify-items: center;
  }
  .reset {
    grid-area: r;
  }
  .flare {
    grid-area: q;
  }
  .use {
    grid-area: e;
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
  }
  .jump {
    grid-area: j;
    width: 4.6rem;
    height: 4.6rem;
    border-radius: 50%;
    background: rgb(138 28 28 / 0.75);
    font-size: 1.5rem;
  }
  .small {
    width: 2.8rem;
    height: 2.8rem;
    border-radius: 50%;
    font-size: 0.95rem;
  }
  /* Apaisado y con poca altura: botones algo más pequeños para no tapar la mina */
  @media (orientation: landscape) and (max-height: 500px) {
    .dpad {
      grid-template-columns: repeat(3, 2.9rem);
      grid-template-rows: repeat(3, 2.9rem);
    }
    .use {
      width: 3.4rem;
      height: 3.4rem;
    }
    .jump {
      width: 3.9rem;
      height: 3.9rem;
    }
  }
</style>
