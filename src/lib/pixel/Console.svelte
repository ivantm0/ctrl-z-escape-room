<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import type { Dir, Talk } from './talk.svelte';

  // La «consola» común a todos los mundos: pantalla, caja de diálogo, cruceta, botón A y teclado.
  // Cada mundo aporta su lógica (mover, interactuar, reiniciar) y su forma de dibujar.
  let {
    talk,
    render,
    onmove,
    oninteract,
    onreset,
    resetLabel = '',
    blocked = false,
    label,
    attrs = {},
    theme = 'w1',
    children,
  }: {
    talk: Talk;
    render: (g: CanvasRenderingContext2D, t: number) => void;
    onmove: (d: Dir) => void;
    oninteract: () => void;
    onreset?: () => void;
    /** Texto del botón ↺ (vacío = sin botón) */
    resetLabel?: string;
    /** Un modal propio del mundo está abierto: el teclado no mueve a Leo */
    blocked?: boolean;
    label: string;
    attrs?: Record<string, string | number>;
    theme?: 'w1' | 'w2' | 'w3' | 'w4';
    children?: Snippet;
  } = $props();

  let canvas: HTMLCanvasElement;
  let frame = 0;

  const KEYS: Record<string, Dir> = { arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
  function onKey(e: KeyboardEvent) {
    if (blocked || (e.target as HTMLElement).closest?.('dialog, input, textarea')) return;
    const dir = KEYS[e.key.toLowerCase()];
    if (dir) {
      e.preventDefault();
      if (talk.open) return;
      onmove(dir);
    } else if ([' ', 'Enter', 'z', 'Z', 'e', 'E'].includes(e.key)) {
      e.preventDefault();
      if (talk.open) talk.advance();
      else oninteract();
    } else if ((e.key === 'r' || e.key === 'R') && !talk.open) {
      onreset?.();
    }
  }

  let hold: ReturnType<typeof setInterval> | undefined;
  function press(dir: Dir) {
    if (talk.open) return;
    onmove(dir);
    clearInterval(hold);
    hold = setInterval(() => !talk.open && onmove(dir), 140);
  }
  const release = () => clearInterval(hold);

  onMount(() => {
    addEventListener('keydown', onKey);
    const loop = (t: number) => {
      const g = canvas.getContext('2d')!;
      g.imageSmoothingEnabled = false;
      render(g, t);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      removeEventListener('keydown', onKey);
      cancelAnimationFrame(frame);
      clearInterval(hold);
    };
  });

  const DIRS: [Dir, string, string][] = [['up', '▲', 'arriba'], ['left', '◀', 'izquierda'], ['right', '▶', 'derecha'], ['down', '▼', 'abajo']];
</script>

<div class="game {theme}">
  <div class="screen">
    <canvas bind:this={canvas} width="160" height="144" aria-label={label} {...Object.fromEntries(Object.entries(attrs).map(([k, v]) => [`data-${k}`, v]))}></canvas>

    {#if talk.open}
      <div class="dialog" role="dialog" aria-label="Diálogo" aria-live="polite">
        <p>{talk.line}</p>
        <button class="next" onclick={() => talk.advance()} aria-label="Continuar diálogo">▼</button>
      </div>
    {/if}
  </div>

  <div class="pad" aria-label="Controles">
    <div class="dpad">
      {#each DIRS as [d, symbol, name]}
        <button
          class="d-{d}"
          aria-label="Mover {name}"
          onpointerdown={(e) => {
            e.preventDefault();
            press(d);
          }}
          onpointerup={release}
          onpointerleave={release}
          onpointercancel={release}
        >{symbol}</button>
      {/each}
    </div>
    <div class="buttons">
      {#if resetLabel}
        <button class="small" onclick={() => !talk.open && onreset?.()} aria-label={resetLabel}>↺</button>
      {/if}
      <button class="a" onclick={() => (talk.open ? talk.advance() : oninteract())} aria-label="Botón A: interactuar">A</button>
    </div>
  </div>
</div>

{@render children?.()}

<style>
  .game {
    --body: #2a2f36;
    --edge: #1a1d22;
    --paper: #c7d39c;
    --ink: #1d2b1a;
    --key: #c7d39c;
    display: grid;
    justify-items: center;
    gap: 1rem;
  }
  .game.w2 {
    --body: #3a2c5a;
    --edge: #221836;
    --paper: #fcfcfc;
    --ink: #0b0b2a;
    --key: #f8b800;
  }
  .game.w3 {
    --body: #6a3c24;
    --edge: #3c2214;
    --paper: #f8f4ec;
    --ink: #4e3a78;
    --key: #f4c840;
  }
  .game.w4 {
    --body: #2a2340;
    --edge: #08060e;
    --paper: #08060e;
    --ink: #05d9e8;
    --key: #ff2a6d;
  }
  .screen {
    position: relative;
    width: min(100%, calc((100dvh - 12rem) * 160 / 144), 40rem);
    padding: 10px;
    border-radius: 0.6rem 0.6rem 2.4rem 0.6rem;
    background: var(--body);
    box-shadow: inset 0 0 0 3px var(--edge), 0 20px 50px rgb(0 0 0 / 0.5);
  }
  canvas {
    display: block;
    width: 100%;
    aspect-ratio: 160 / 144;
    image-rendering: pixelated;
    background: #000;
  }
  .dialog {
    position: absolute;
    left: 10px;
    right: 10px;
    bottom: 10px;
    min-height: 26%;
    padding: 0.8rem 2.4rem 0.8rem 0.9rem;
    border: 4px solid var(--ink);
    background: var(--paper);
    color: var(--ink);
    font-family: 'Press Start 2P', monospace;
    font-size: clamp(0.55rem, 1.9vw, 0.8rem);
    line-height: 1.7;
  }
  .w2 .dialog {
    border-color: #fcfcfc;
    background: #0b0b2a;
    color: #fcfcfc;
    box-shadow: inset 0 0 0 3px #0058f8;
  }
  .w3 .dialog {
    border-color: #f4c840;
    background: #4e3a78;
    color: #f8f4ec;
    box-shadow: inset 0 0 0 3px #a86c3c;
  }
  .w4 .dialog {
    border-color: #05d9e8;
    background: #08060e;
    color: #f0f0ff;
    box-shadow: inset 0 0 0 3px #ff2a6d;
  }
  .next {
    position: absolute;
    right: 0.5rem;
    bottom: 0.4rem;
    border: 0;
    background: none;
    color: inherit;
    font-size: 0.8rem;
    animation: bob 0.8s steps(2) infinite;
  }
  .pad {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: min(100%, 26rem);
  }
  .dpad {
    display: grid;
    grid-template-areas: '. u .' 'l . r' '. d .';
    grid-template-columns: repeat(3, 3rem);
    grid-template-rows: repeat(3, 3rem);
  }
  .dpad button,
  .buttons button {
    border: 0;
    background: var(--body);
    color: var(--key);
    font-size: 1rem;
    touch-action: none;
    user-select: none;
  }
  .dpad button:active,
  .buttons button:active {
    filter: brightness(1.4);
  }
  .d-up {
    grid-area: u;
    border-radius: 0.4rem 0.4rem 0 0;
  }
  .d-down {
    grid-area: d;
    border-radius: 0 0 0.4rem 0.4rem;
  }
  .d-left {
    grid-area: l;
    border-radius: 0.4rem 0 0 0.4rem;
  }
  .d-right {
    grid-area: r;
    border-radius: 0 0.4rem 0.4rem 0;
  }
  .buttons {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .buttons .a {
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background: #8b1e3f;
    color: #fff;
    font-family: 'Press Start 2P', monospace;
  }
  .buttons .small {
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 50%;
  }
  @keyframes bob {
    50% {
      transform: translateY(3px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .next {
      animation: none;
    }
  }
</style>
