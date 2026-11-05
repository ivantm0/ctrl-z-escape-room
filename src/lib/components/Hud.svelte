<script lang="ts">
  import { onMount } from 'svelte';
  import { formatTime, game } from '$lib/game.svelte';
  import type { Room } from '$lib/rooms';

  let { room }: { room: Room } = $props();

  const progress = $derived(game.get(room.id));
  const level = $derived(room.levels[progress.level]);
  const shown = $derived(progress.hints[progress.level] ?? 0);
  const items = $derived(room.levels.slice(0, progress.level).map((l) => l.item));

  let now = $state(Date.now());
  let open = $state(false);

  onMount(() => {
    const id = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(id);
  });

  const hintLabels = ['Pista', 'Pista clara', 'Solución'];
</script>

<header class="hud">
  <a class="back" href="/" aria-label="Volver al vestíbulo">←<span class="wide">&nbsp;Vestíbulo</span></a>
  <div class="title">
    <span class="n">{room.n}</span>
    <span class="name">{room.name}</span>
  </div>
  <div class="meta">
    <span aria-label="Nivel {progress.level + 1} de {room.levels.length}">
      {#each room.levels as _, i}
        <span class="dot" class:done={i < progress.level} class:current={i === progress.level}></span>
      {/each}
    </span>
    <span class="time" aria-label="Tiempo">{formatTime(now - (progress.start ?? now))}</span>
    <button class="hint-btn" aria-label="Pistas" aria-expanded={open} aria-controls="hints" onclick={() => (open = !open)}>
      ?<span class="wide">&nbsp;Pistas</span>
    </button>
  </div>
</header>

{#if open && level}
  <aside id="hints" class="hints" aria-label="Pistas">
    <p class="level">Nivel {progress.level + 1} · {level.title}</p>
    <ol>
      {#each level.hints.slice(0, shown) as hint, i}
        <li><span>{hintLabels[i]}</span>{hint}</li>
      {/each}
    </ol>
    {#if shown < 3}
      <button onclick={() => game.hint(room.id, progress.level)}>
        Ver {hintLabels[shown].toLowerCase()}
      </button>
    {/if}
  </aside>
{/if}

<footer class="inventory" aria-label="Inventario">
  {#each room.levels as _, i}
    {@const item = items[i]}
    <span class="slot" class:filled={item} title={item?.name ?? 'Vacío'}>
      {#if item}<span aria-hidden="true">{item.glyph}</span><span class="sr-only">{item.name}</span>{/if}
    </span>
  {/each}
</footer>

<style>
  .hud {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.9rem clamp(1rem, 4vw, 2.5rem);
    border-bottom: 1px solid var(--line);
    background: color-mix(in srgb, var(--bg) 85%, transparent);
    backdrop-filter: blur(8px);
    font-size: 0.8rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  :global(.theme-oficina) .hud {
    font-size: 1.15rem;
  }
  .back {
    text-decoration: none;
    color: var(--muted);
  }
  .back:hover {
    color: var(--accent);
  }
  .title {
    display: flex;
    gap: 0.6rem;
  }
  .n {
    color: var(--accent);
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 1.2rem;
  }
  .dot {
    display: inline-block;
    width: 0.55rem;
    height: 0.55rem;
    margin-left: 0.3rem;
    border: 1px solid var(--muted);
    border-radius: 50%;
  }
  .dot.done {
    background: var(--accent);
    border-color: var(--accent);
  }
  .dot.current {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent);
  }
  .time {
    font-variant-numeric: tabular-nums;
  }
  .hint-btn {
    padding: 0.4rem 0.8rem;
    border: 1px solid var(--line);
    background: none;
    text-transform: uppercase;
    letter-spacing: inherit;
  }
  .hint-btn:hover,
  .hint-btn[aria-expanded='true'] {
    border-color: var(--accent);
    color: var(--accent);
  }
  .hints {
    position: fixed;
    z-index: 20;
    top: 4.2rem;
    right: clamp(1rem, 4vw, 2.5rem);
    width: min(24rem, calc(100vw - 2rem));
    padding: 1.2rem;
    border: 1px solid var(--accent);
    background: var(--surface);
    box-shadow: 0 20px 60px rgb(0 0 0 / 0.5);
    animation: drop 0.25s ease-out;
  }
  .level {
    font-size: 0.75em;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
  }
  ol {
    display: grid;
    gap: 0.8rem;
    margin: 1rem 0;
    padding: 0;
    list-style: none;
    line-height: 1.45;
  }
  li span {
    display: block;
    font-size: 0.7em;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .hints button {
    width: 100%;
    padding: 0.6rem;
    border: 1px dashed var(--accent);
    background: none;
    color: var(--accent);
  }
  .inventory {
    position: fixed;
    z-index: 10;
    bottom: 1rem;
    right: clamp(1rem, 4vw, 2.5rem);
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 1px solid var(--line);
    background: color-mix(in srgb, var(--surface) 90%, transparent);
    backdrop-filter: blur(8px);

  }
  .slot {
    display: grid;
    place-items: center;
    width: 2.6rem;
    height: 2.6rem;
    border: 1px dashed var(--line);
    font-size: 1.3rem;
    color: var(--accent);
  }
  .slot.filled {
    border-style: solid;
    border-color: var(--accent);
    animation: pop 0.4s ease-out;
  }
  @keyframes drop {
    from { opacity: 0; transform: translateY(-8px); }
  }
  @keyframes pop {
    50% { transform: scale(1.2); }
  }
  @media (max-width: 640px) {
    .title .name,
    .meta > span:first-child,
    .wide {
      display: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .hints, .slot.filled { animation: none; }
  }
</style>
