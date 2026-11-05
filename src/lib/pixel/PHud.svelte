<script lang="ts">
  import { onMount } from 'svelte';
  import { formatTime } from '$lib/game.svelte';
  import { HINTS, ITEMS, pixel, type ItemId } from './state.svelte';
  import { setSound, sfx } from './audio';

  let now = $state(Date.now());
  let hintsOpen = $state(false);
  let selected = $state<ItemId | null>(null);

  onMount(() => {
    const id = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(id);
  });

  const step = $derived(pixel.current);
  const shown = $derived(step ? (pixel.s.hints[step] ?? 0) : 0);
  const labels = ['Pista', 'Pista clara', 'Solución'];
  const slots = $derived((Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].world === pixel.s.world));
  const range = $derived(pixel.timeRange);
</script>

<header class="hud" class:w2={pixel.s.world === 2} class:w3={pixel.s.world === 3} class:w4={pixel.s.world === 4}>
  <a href="/" aria-label="Volver a los escape rooms">←<span class="wide">&nbsp;Escape rooms</span></a>
  <p class="title"><span class="wide">FUERA DE JUEGO ·&nbsp;</span>MUNDO {pixel.s.world}</p>
  <div class="tools">
    <span class="time" aria-label="Tiempo">{formatTime((range.to ?? now) - (range.from ?? now))}</span>
    <button
      aria-pressed={pixel.sound}
      aria-label={pixel.sound ? 'Silenciar' : 'Activar sonido'}
      onclick={() => {
        pixel.toggleSound();
        setSound(pixel.sound);
        sfx('talk');
      }}>{pixel.sound ? '♪' : '×'}</button>
    <button aria-expanded={hintsOpen} aria-label="Pistas" onclick={() => (hintsOpen = !hintsOpen)}>?</button>
  </div>
</header>

{#if hintsOpen}
  <aside class="panel hints" class:w2={pixel.s.world === 2} class:w3={pixel.s.world === 3} class:w4={pixel.s.world === 4} aria-label="Pistas">
    {#if step}
      <ol>
        {#each HINTS[step].slice(0, shown) as h, i}<li><span>{labels[i]}</span>{h}</li>{/each}
      </ol>
      {#if shown < 3}<button onclick={() => pixel.hint(step)}>VER {labels[shown].toUpperCase()}</button>{/if}
    {:else}
      <p>Ya no necesitas pistas.</p>
    {/if}
  </aside>
{/if}

<footer class="inventory" class:w2={pixel.s.world === 2} class:w3={pixel.s.world === 3} class:w4={pixel.s.world === 4} aria-label="Inventario">
  {#each slots as id}
    {#if pixel.s.items.includes(id)}
      <button class="slot" class:used={pixel.s.used.includes(id)} aria-pressed={selected === id} onclick={() => (selected = selected === id ? null : id)}>
        <span aria-hidden="true">{ITEMS[id].glyph}</span><span class="sr-only">{ITEMS[id].name}</span>
      </button>
    {:else}
      <span class="slot empty" aria-hidden="true"></span>
    {/if}
  {/each}
</footer>

{#if selected}
  <aside class="panel detail" class:w2={pixel.s.world === 2} class:w3={pixel.s.world === 3} class:w4={pixel.s.world === 4} aria-label="Objeto">
    <p class="name">{ITEMS[selected].name.toUpperCase()}</p>
    <p>{ITEMS[selected].desc}</p>
  </aside>
{/if}

<style>
  .hud {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.7rem clamp(1rem, 3vw, 2rem);
    border-bottom: 4px solid #1d2b1a;
    background: #8fa36a;
    color: #1d2b1a;
    font-family: 'Press Start 2P', monospace;
    font-size: 0.65rem;
  }
  .hud a {
    color: inherit;
    text-decoration: none;
  }
  .tools {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .tools button {
    width: 2.2rem;
    height: 2.2rem;
    border: 3px solid #1d2b1a;
    background: #c7d39c;
    color: #1d2b1a;
    font-family: inherit;
  }
  .tools [aria-expanded='true'] {
    background: #1d2b1a;
    color: #c7d39c;
  }
  .panel {
    position: fixed;
    z-index: 20;
    width: min(24rem, calc(100vw - 2rem));
    padding: 1rem;
    border: 4px solid #1d2b1a;
    background: #c7d39c;
    color: #1d2b1a;
    font-family: 'Press Start 2P', monospace;
    font-size: 0.6rem;
    line-height: 1.8;
    box-shadow: 0 0 0 4px #8fa36a;
  }
  .hints {
    top: 4rem;
    right: 1rem;
  }
  ol {
    display: grid;
    gap: 0.8rem;
    margin: 0 0 0.8rem;
    padding: 0;
    list-style: none;
  }
  li span {
    display: block;
    color: #4f6a3d;
  }
  .panel button {
    width: 100%;
    padding: 0.5rem;
    border: 3px solid #1d2b1a;
    background: none;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
  }
  .inventory {
    position: fixed;
    z-index: 10;
    right: 1rem;
    bottom: 1rem;
    display: flex;
    gap: 0.4rem;
    padding: 0.4rem;
    border: 4px solid #1d2b1a;
    background: #8fa36a;
  }
  .slot {
    display: grid;
    place-items: center;
    width: 2.6rem;
    height: 2.6rem;
    border: 3px solid #1d2b1a;
    background: #c7d39c;
    font-size: 1.2rem;
  }
  .slot.empty {
    border-style: dashed;
    opacity: 0.6;
  }
  .slot.used {
    opacity: 0.4;
  }
  .slot[aria-pressed='true'] {
    background: #4f6a3d;
  }
  .detail {
    right: 1rem;
    bottom: 5.5rem;
  }
  .name {
    color: #4f6a3d;
  }
  /* Mundo 2: azul noche, blanco y amarillo de 8 bits */
  .hud.w2 {
    border-color: #0b0b2a;
    background: #3a2c5a;
    color: #fcfcfc;
  }
  .hud.w2 .tools button {
    border-color: #f8b800;
    background: #0b0b2a;
    color: #f8b800;
  }
  .hud.w2 .tools [aria-expanded='true'] {
    background: #f8b800;
    color: #0b0b2a;
  }
  .panel.w2 {
    border-color: #fcfcfc;
    background: #0b0b2a;
    color: #fcfcfc;
    box-shadow: 0 0 0 4px #0058f8;
  }
  .panel.w2 li span,
  .panel.w2 .name {
    color: #f8b800;
  }
  .inventory.w2 {
    border-color: #0b0b2a;
    background: #3a2c5a;
  }
  .inventory.w2 .slot {
    border-color: #f8b800;
    background: #0b0b2a;
    color: #fcfcfc;
  }
  /* Mundo 3: madera, violeta y oro */
  .hud.w3 {
    border-color: #3c2214;
    background: #6a3c24;
    color: #f8f4ec;
  }
  .hud.w3 .tools button {
    border-color: #f4c840;
    background: #4e3a78;
    color: #f4c840;
  }
  .hud.w3 .tools [aria-expanded='true'] {
    background: #f4c840;
    color: #4e3a78;
  }
  .panel.w3 {
    border-color: #f4c840;
    background: #4e3a78;
    color: #f8f4ec;
    box-shadow: 0 0 0 4px #a86c3c;
  }
  .panel.w3 li span,
  .panel.w3 .name {
    color: #f4c840;
  }
  .inventory.w3 {
    border-color: #3c2214;
    background: #6a3c24;
  }
  .inventory.w3 .slot {
    border-color: #f4c840;
    background: #4e3a78;
    color: #f8f4ec;
  }
  /* Mundo 4: negro, cian y magenta */
  .hud.w4 {
    border-color: #ff2a6d;
    background: #08060e;
    color: #05d9e8;
  }
  .hud.w4 .tools button {
    border-color: #05d9e8;
    background: #2a2340;
    color: #05d9e8;
  }
  .hud.w4 .tools [aria-expanded='true'] {
    background: #05d9e8;
    color: #08060e;
  }
  .panel.w4 {
    border-color: #05d9e8;
    background: #08060e;
    color: #f0f0ff;
    box-shadow: 0 0 0 4px #ff2a6d;
  }
  .panel.w4 li span,
  .panel.w4 .name {
    color: #39ff14;
  }
  .inventory.w4 {
    border-color: #ff2a6d;
    background: #08060e;
  }
  .inventory.w4 .slot {
    border-color: #05d9e8;
    background: #2a2340;
    color: #f0f0ff;
  }
  @media (max-width: 640px) {
    .wide {
      display: none;
    }
  }
</style>
