<script lang="ts">
  import { formatTime, game } from '$lib/game.svelte';
  import { rooms, type Room } from '$lib/rooms';

  let { room }: { room: Room } = $props();

  const progress = $derived(game.get(room.id));
  const hints = $derived(game.hintsUsed(room.id));
  const time = $derived(formatTime((progress.end ?? 0) - (progress.start ?? 0)));
  // Tres estrellas sin pistas; cada solución vista resta una
  const stars = $derived(Math.max(1, 3 - Math.ceil(hints / 3)));
  const next = $derived(rooms[rooms.indexOf(room) + 1]);
  const allDone = $derived(rooms.every((r) => game.isDone(r.id)));
</script>

<section class="finale">
  <p class="kicker">Sala {room.n} superada</p>
  <h1>Has escapado de<br />{room.name}</h1>
  {#if allDone}
    <p class="ending">
      Las seis salas, superadas. Has usado la consola, la pestaña, la ventana, el tema, el historial,
      el portapapeles y hasta la impresora. El navegador ya no tiene secretos para ti.
    </p>
  {/if}

  <div class="stars" aria-label="{stars} de 3 estrellas">
    {#each [0, 1, 2] as i}
      <span class:on={i < stars} style="animation-delay: {0.3 + i * 0.15}s">★</span>
    {/each}
  </div>

  <dl>
    <div><dt>Tiempo</dt><dd>{time}</dd></div>
    <div><dt>Pistas</dt><dd>{hints}</dd></div>
    <div>
      <dt>Objetos</dt>
      <dd>{#each room.levels as l}<span title={l.item.name}>{l.item.glyph}</span>{/each}</dd>
    </div>
  </dl>

  <div class="actions">
    {#if next?.ready}
      <a class="primary" href="/sala/{next.id}">Siguiente sala: {next.name} →</a>
    {/if}
    <a href="/origen">Volver al vestíbulo</a>
    <button onclick={() => { game.reset(room.id); game.enter(room.id); }}>Repetir sala</button>
  </div>
</section>

<style>
  .finale {
    display: grid;
    justify-items: center;
    gap: 2rem;
    min-height: 100dvh;
    align-content: center;
    padding: 3rem 1.25rem;
    text-align: center;
  }
  .kicker {
    font-size: 0.8em;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--accent);
  }
  h1 {
    font-family: var(--font-display);
    font-size: clamp(2.6rem, 8vw, 5.5rem);
    font-weight: 700;
    line-height: 0.95;
  }
  .ending {
    max-width: 34rem;
    line-height: 1.6;
    color: var(--muted);
  }
  .stars {
    display: flex;
    gap: 0.6rem;
    font-size: 2.6rem;
    color: var(--line);
  }
  .stars .on {
    color: var(--accent);
    animation: star 0.5s both;
  }
  dl {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1px;
    margin: 0;
    border: 1px solid var(--line);
    background: var(--line);
  }
  dl div {
    min-width: 8rem;
    padding: 1rem 1.4rem;
    background: var(--bg);
  }
  dt {
    font-size: 0.7em;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--muted);
  }
  dd {
    margin: 0.3rem 0 0;
    font-size: 1.6em;
    font-variant-numeric: tabular-nums;
    color: var(--accent);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
  }
  .actions a,
  .actions button {
    padding: 0.8rem 1.3rem;
    border: 1px solid var(--line);
    background: none;
    font-size: 0.85em;
    letter-spacing: 0.08em;
    text-decoration: none;
    text-transform: uppercase;
  }
  .actions a:hover,
  .actions button:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
  .actions .primary {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--accent-ink);
  }
  .actions .primary:hover {
    color: var(--accent-ink);
  }
  @keyframes star {
    from { opacity: 0; transform: scale(0.3) rotate(-40deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    .stars .on { animation: none; }
  }
</style>
