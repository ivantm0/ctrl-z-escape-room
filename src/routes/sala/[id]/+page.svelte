<script lang="ts">
  import { untrack } from 'svelte';
  import { game } from '$lib/game.svelte';
  import { getRoom } from '$lib/rooms';
  import { levels } from '$lib/levels';
  import Hud from '$lib/components/Hud.svelte';
  import Finale from '$lib/components/Finale.svelte';

  let { data } = $props();

  const room = $derived(getRoom(data.id)!);
  const locked = $derived(!!room.requires && !game.isDone(room.requires));
  const progress = $derived(game.get(room.id));
  const Level = $derived(levels[room.id][progress.level]);

  // Al entrar (y al cambiar de sala) arranca el cronómetro de esta sala
  $effect(() => {
    const id = room.id;
    if (game.ready && !locked) untrack(() => game.enter(id));
  });

  // El tema de la sala también pinta el fondo de la página entera
  $effect(() => {
    document.documentElement.classList.add(`theme-${room.id}`);
    return () => document.documentElement.classList.remove(`theme-${room.id}`);
  });
</script>

<svelte:head>
  <title>{room.name} · Ctrl + Escape</title>
</svelte:head>

<div class="room theme-{room.id}">
  {#if !game.ready}
    <p class="center">Cargando…</p>
  {:else if locked}
    <div class="center">
      <p class="kicker">Sala {room.n} · cerrada</p>
      <h1>La puerta no cede.</h1>
      <p>Primero tendrás que escapar de la sala anterior.</p>
      <a href="/">← Volver al vestíbulo</a>
    </div>
  {:else if !Level}
    <Finale {room} />
  {:else}
    <Hud {room} />
    <main>
      {#key `${room.id}-${progress.level}`}
        <div class="level">
          <p class="kicker">Nivel {progress.level + 1} de {room.levels.length}</p>
          <h1>{room.levels[progress.level].title}</h1>
          <Level onsolve={() => game.solve(room.id, room.levels.length)} />
        </div>
      {/key}
    </main>
  {/if}
</div>

<style>
  .room {
    position: relative;
    min-height: 100dvh;
    background: var(--bg);
    color: var(--fg);
    font-family: var(--font-ui);
  }
  /* Líneas de un monitor CRT por encima de toda la oficina */
  .theme-oficina::after {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 30;
    pointer-events: none;
    background: repeating-linear-gradient(to bottom, rgb(0 0 0 / 0.22) 0 1px, transparent 1px 3px);
    mix-blend-mode: multiply;
  }
  .theme-oficina {
    text-shadow: 0 0 6px rgb(57 255 122 / 0.35);
  }
  main {
    padding: clamp(2rem, 6vw, 4rem) clamp(1.25rem, 4vw, 2.5rem) 7rem;
  }
  .level {
    display: grid;
    gap: 1.2rem;
    max-width: 64rem;
    margin: 0 auto;
    animation: enter 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  /* Las escenas nunca pueden ser más anchas que la pantalla */
  .level :global(.scene) {
    grid-template-columns: minmax(0, 1fr);
  }
  .kicker {
    font-size: 0.8em;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent);
  }
  h1 {
    margin-bottom: 1rem;
    font-family: var(--font-display);
    font-size: clamp(2.4rem, 6vw, 4.2rem);
    font-weight: 700;
    line-height: 1;
  }
  .center {
    display: grid;
    gap: 1rem;
    min-height: 100dvh;
    place-content: center;
    padding: 2rem;
    text-align: center;
  }
  @keyframes enter {
    from { opacity: 0; transform: translateY(16px); filter: blur(4px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .level { animation: none; }
  }
</style>
