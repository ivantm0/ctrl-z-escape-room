<script lang="ts">
  import { onMount } from 'svelte';
  import { formatTime, game } from '$lib/game.svelte';
  import { rooms, type Room } from '$lib/rooms';
  import DoorArt from '$lib/components/DoorArt.svelte';

  onMount(() => {
    // La primera pista del juego ya está aquí, para quien curiosee
    console.log(
      '%c👀 ¿Curioseando la consola? Buena costumbre. Vuelve aquí a menudo.',
      'font: 500 13px "IBM Plex Mono", monospace; color: #ffb347'
    );
  });

  const status = (room: Room) => {
    if (!room.ready) return 'soon';
    if (game.isDone(room.id)) return 'done';
    if (room.requires && !game.isDone(room.requires)) return 'locked';
    return game.get(room.id).start ? 'playing' : 'open';
  };

  const doneCount = $derived(rooms.filter((r) => game.isDone(r.id)).length);
</script>

<svelte:head>
  <title>Ctrl + Escape · Salas de escape en tu navegador</title>
</svelte:head>

<main>
  <header>
    <p class="kicker">Salas de escape en el navegador</p>
    <h1>
      <span class="key">Ctrl</span><span class="plus">+</span><span class="key wide">Escape</span>
    </h1>
    <p class="lead">
      Aquí la pista nunca está en la pantalla. Está en la consola, en la pestaña, en el tamaño de tu
      ventana o en el tema de tu sistema. Usa todo el navegador.
    </p>
    {#if game.ready}
      <p class="progress">{doneCount} / {rooms.length} salas superadas</p>
    {/if}
  </header>

  <ol class="corridor">
    {#each rooms as room, i}
      {@const s = status(room)}
      {@const progress = game.get(room.id)}
      <li style="--i: {i}">
        {#if s === 'open' || s === 'playing' || s === 'done'}
          <a class="door {s} door-{room.id}" href="/sala/{room.id}">
            {@render door(room, s, progress.end != null && progress.start != null ? formatTime(progress.end - progress.start) : '', progress.level)}
          </a>
        {:else}
          <div class="door {s}" aria-disabled="true">
            {@render door(room, s, '', 0)}
          </div>
        {/if}
      </li>
    {/each}
  </ol>

  <footer>
    <p>Ventana amplia y auriculares recomendados. Tu progreso se guarda en este navegador.</p>
    {#if game.ready && Object.keys(game.rooms).length}
      <button onclick={() => confirm('¿Borrar todo el progreso?') && game.reset()}>Reiniciar progreso</button>
    {/if}
  </footer>
</main>

{#snippet door(room: Room, s: string, time: string, level: number)}
  <span class="n">{room.n}</span>
  <span class="knob" aria-hidden="true"></span>
  <span class="art-wrap"><DoorArt id={room.id} /></span>
  <span class="body">
    <span class="name">{room.name}</span>
    <span class="tagline">{room.tagline}</span>
    <span class="tags">{room.tags.join(' · ')}</span>
  </span>
  <span class="state">
    {#if s === 'done'}✓ Superada · {time}
    {:else if s === 'playing'}En curso · nivel {level + 1}/{room.levels.length}
    {:else if s === 'open'}Entrar →
    {:else if s === 'locked'}🔒 Supera la sala anterior
    {:else}Próximamente{/if}
  </span>
  <span class="light" aria-hidden="true"></span>
{/snippet}

<style>
  main {
    max-width: 82rem;
    margin: 0 auto;
    padding: clamp(3rem, 8vw, 6rem) clamp(1rem, 4vw, 2.5rem) 3rem;
  }
  header {
    display: grid;
    gap: 1.5rem;
    max-width: 46rem;
  }
  .kicker {
    font-size: 0.75rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--accent);
  }
  h1 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4em;
    font-family: var(--font-display);
    font-size: clamp(2.2rem, 7vw, 4.6rem);
    font-weight: 800;
    letter-spacing: -0.03em;
  }
  /* Teclas de verdad: se hunden al pasar el ratón */
  .key {
    padding: 0.12em 0.4em 0.18em;
    border: 1px solid rgb(241 235 226 / 0.2);
    border-radius: 0.22em;
    background: linear-gradient(#1f1c19, #141210);
    box-shadow: 0 0.1em 0 #2c2722, 0 0.14em 0 #000, 0 0.4em 1em rgb(0 0 0 / 0.5);
    transition: transform 0.12s, box-shadow 0.12s;
  }
  .key.wide {
    color: var(--accent);
  }
  .key:hover {
    transform: translateY(0.08em);
    box-shadow: 0 0.02em 0 #2c2722, 0 0.05em 0 #000;
  }
  .plus {
    color: var(--muted);
    font-weight: 500;
  }
  .lead {
    font-size: 1.05rem;
    line-height: 1.6;
    color: var(--muted);
  }
  .progress {
    font-size: 0.8rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .corridor {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
    gap: 1.25rem;
    margin: clamp(3rem, 7vw, 5rem) 0 0;
    padding: 0;
    list-style: none;
  }
  /* Todas las puertas de una fila con la misma altura */
  li {
    display: grid;
    animation: rise 0.7s calc(var(--i) * 70ms) both cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .door {
    position: relative;
    display: grid;
    grid-template-rows: auto 1fr auto auto;
    gap: 1rem;
    min-height: 26rem;
    padding: 1.4rem 1.4rem 1.6rem;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 0.5rem 0.5rem 0 0;
    background: linear-gradient(180deg, #1b1815, #110f0d);
    color: var(--fg);
    text-decoration: none;
    transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.35s;
  }
  /* Cada puerta deja ver la luz de su sala por debajo */
  .door-oficina { --glow: #39ff7a; }
  .door-observatorio { --glow: #e0b46a; }
  .door-radio { --glow: #ff6a3d; }
  .door-laboratorio { --glow: #3fe0b8; }
  .door-archivo { --glow: #d4a960; }
  .door-maquina { --glow: #ff2bd6; }
  .light {
    position: absolute;
    inset: auto 0 0;
    height: 45%;
    background: radial-gradient(60% 100% at 50% 100%, color-mix(in srgb, var(--glow, var(--accent)) 35%, transparent), transparent);
    opacity: 0.35;
    transition: opacity 0.35s;
    pointer-events: none;
  }
  a.door:hover,
  a.door:focus-visible {
    border-color: var(--glow, var(--accent));
    transform: translateY(-6px);
  }
  a.door:hover .light,
  a.door:focus-visible .light {
    opacity: 1;
  }
  .art-wrap {
    display: grid;
    place-items: center;
    height: 8.5rem;
    padding: 0 1.2rem;
    opacity: 0.85;
    transition: opacity 0.35s, transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  a.door:hover .art-wrap,
  a.door:focus-visible .art-wrap {
    opacity: 1;
    transform: scale(1.06);
  }
  /* Salas cerradas: la ilustración se ve apagada, como tras un cristal */
  .locked .art-wrap {
    opacity: 0.25;
    filter: grayscale(1) blur(1px);
  }
  .n {
    font-family: var(--font-display);
    font-size: 3.2rem;
    font-weight: 800;
    line-height: 1;
    color: var(--glow, var(--muted));
  }
  .knob {
    position: absolute;
    top: 55%;
    right: 1.1rem;
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 50%;
    background: var(--glow, #4a443d);
    box-shadow: 0 0 12px var(--glow, transparent);
  }
  .body {
    display: grid;
    align-content: end;
    gap: 0.5rem;
  }
  .name {
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 500;
  }
  .tagline {
    font-size: 0.85rem;
    line-height: 1.5;
    color: var(--muted);
  }
  .tags {
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--glow, var(--muted));
  }
  .state {
    position: relative;
    z-index: 1;
    padding-top: 1rem;
    border-top: 1px solid var(--line);
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .done .state {
    color: var(--glow);
  }
  .soon,
  .locked {
    background: repeating-linear-gradient(135deg, #12100e 0 12px, #0f0d0c 12px 24px);
  }
  .soon .n,
  .soon .name,
  .soon .tagline,
  .soon .tags {
    opacity: 0.55;
  }
  footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 3rem;
    font-size: 0.8rem;
    color: var(--muted);
  }
  footer button {
    padding: 0;
    border: 0;
    background: none;
    color: var(--muted);
    text-decoration: underline;
  }
  @keyframes rise {
    from { opacity: 0; transform: translateY(30px); }
  }
  @media (prefers-reduced-motion: reduce) {
    li { animation: none; }
    .door { transition: none; }
  }
</style>
