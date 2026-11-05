<script lang="ts">
  import { onMount } from 'svelte';
  import { formatTime } from '$lib/game.svelte';
  import { CHAPTERS, faraon, HINTS, ITEMS, type ItemId } from './state.svelte';
  import Papiro from './piramide/PapiroTexto.svelte';
  import { setSound, sfx } from './audio';

  let { reveal = $bindable(false) }: { reveal?: boolean } = $props();

  const ch = $derived(faraon.s.chapter);
  const chapter = $derived(`${CHAPTERS[ch].n} · ${CHAPTERS[ch].name}`);
  const time = $derived(faraon.chapterTime(ch));

  let now = $state(Date.now());
  let hintsOpen = $state(false);

  onMount(() => {
    const id = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(id);
  });

  const step = $derived(faraon.current);
  const shown = $derived(step ? (faraon.s.hints[step] ?? 0) : 0);
  const hintLabels = ['Pista', 'Pista clara', 'Solución'];
  // Huecos del inventario: los objetos de este capítulo
  const slots = $derived((Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].chapter === ch));
  const items = $derived(slots.filter((id) => faraon.s.items.includes(id)));
  const selected = $derived(faraon.selected);

  const pick = (id: ItemId) => {
    sfx('click');
    faraon.selected = faraon.selected === id ? null : id;
  };
</script>

<header class="hud">
  <a class="back" href="/" aria-label="Volver a los escape rooms">←<span class="wide">&nbsp;Escape rooms</span></a>
  <p class="title"><span class="wide">El Mapa del Faraón ·&nbsp;</span>{chapter}</p>
  <div class="tools">
    <span class="time" aria-label="Tiempo">{formatTime((time.to ?? now) - (time.from ?? now))}</span>
    <button aria-pressed={reveal} onclick={() => (reveal = !reveal)} title="Resaltar objetos" aria-label="Resaltar objetos">◎</button>
    <button aria-pressed={faraon.sound} onclick={() => {
      faraon.toggleSound();
      // Dentro del clic: el navegador solo deja arrancar el audio tras un gesto
      setSound(faraon.sound);
      sfx('click');
    }} aria-label={faraon.sound ? 'Silenciar' : 'Activar sonido'}>
      {faraon.sound ? '🔊' : '🔈'}
    </button>
    <button aria-expanded={hintsOpen} aria-label="Pistas" onclick={() => (hintsOpen = !hintsOpen)}>?<span class="wide">&nbsp;Pistas</span></button>
  </div>
</header>

{#if hintsOpen}
  <aside class="hints" aria-label="Pistas">
    {#if step}
      <ol>
        {#each HINTS[step].slice(0, shown) as h, i}
          <li><span>{hintLabels[i]}</span>{h}</li>
        {/each}
      </ol>
      {#if shown < 3}
        <button onclick={() => faraon.hint(step)}>Ver {hintLabels[shown].toLowerCase()}</button>
      {/if}
    {:else}
      <p>Ya no necesitas pistas aquí.</p>
    {/if}
  </aside>
{/if}

{#if slots.length}
<footer class="inventory" aria-label="Inventario">
  {#each slots as _, i}
    {@const id = items[i]}
    {#if id}
      <button
        class="slot"
        class:used={faraon.s.used.includes(id)}
        aria-pressed={selected === id}
        onclick={() => pick(id)}
        title={ITEMS[id].name}
      >
        <span aria-hidden="true">{ITEMS[id].glyph}</span><span class="sr-only">{ITEMS[id].name}</span>
      </button>
    {:else}
      <span class="slot empty" aria-hidden="true"></span>
    {/if}
  {/each}
</footer>
{/if}

{#if selected}
  <aside class="detail" aria-label="Objeto seleccionado">
    <button class="x" onclick={() => (faraon.selected = null)} aria-label="Cerrar objeto">✕</button>
    <p class="name">{ITEMS[selected].name}</p>
    <p>{ITEMS[selected].desc}</p>
    {#if selected === 'ostracon'}
      <!-- Los animales miran a la derecha: se lee de derecha a izquierda -->
      <div class="ostracon" aria-label="Dibujo del ostracón: un gato, un escarabajo y un halcón, mirando a la derecha">
        {#each ['𓃠', '𓆣', '𓅃'] as g}<span>{g}</span>{/each}
      </div>
    {/if}
    {#if selected === 'papiro'}
      <Papiro />
    {/if}
    {#if faraon.s.used.includes(selected)}<p class="note">Ya lo has usado.</p>{/if}
  </aside>
{/if}

<style>
  .hud {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.7rem clamp(1rem, 3vw, 2rem);
    border-bottom: 1px solid var(--line);
    background: rgb(26 16 9 / 0.88);
    backdrop-filter: blur(8px);
  }
  .back {
    color: var(--muted);
    text-decoration: none;
    font-size: 0.9rem;
  }
  .title {
    font-family: var(--font-display);
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--accent);
    text-align: center;
  }
  .tools {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .time {
    margin-right: 0.4rem;
    font-variant-numeric: tabular-nums;
  }
  .tools button {
    min-width: 2.4rem;
    height: 2.4rem;
    padding: 0 0.7rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: none;
  }
  .tools button:hover,
  .tools [aria-pressed='true'],
  .tools [aria-expanded='true'] {
    border-color: var(--accent);
    color: var(--accent);
  }
  .hints,
  .detail {
    position: fixed;
    z-index: 20;
    width: min(24rem, calc(100vw - 2rem));
    padding: 1.2rem;
    border: 1px solid var(--accent);
    border-radius: 0.6rem;
    background: var(--surface);
    box-shadow: 0 20px 60px rgb(0 0 0 / 0.5);
    line-height: 1.5;
  }
  .hints {
    top: 4rem;
    right: clamp(1rem, 3vw, 2rem);
  }
  ol {
    display: grid;
    gap: 0.8rem;
    margin: 0 0 1rem;
    padding: 0;
    list-style: none;
  }
  li span {
    display: block;
    font-size: 0.7rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .hints > button {
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
    left: 50%;
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 1px solid var(--line);
    border-radius: 0.6rem;
    background: rgb(42 27 15 / 0.92);
    transform: translateX(-50%);
  }
  .slot {
    display: grid;
    place-items: center;
    width: 3.2rem;
    height: 3.2rem;
    border: 1px solid var(--accent);
    border-radius: 0.4rem;
    background: rgb(0 0 0 / 0.3);
    font-family: var(--font-glyph);
    font-size: 1.7rem;
    color: var(--accent);
    animation: pop 0.4s ease-out;
  }
  .slot.empty {
    border-style: dashed;
    border-color: var(--line);
    animation: none;
  }
  .slot.used {
    opacity: 0.4;
  }
  .slot[aria-pressed='true'] {
    background: var(--accent);
    color: var(--accent-ink);
  }
  .detail {
    bottom: 5.5rem;
    left: 50%;
    transform: translateX(-50%);
  }
  .detail .name {
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--accent);
  }
  .x {
    position: absolute;
    top: 0.6rem;
    right: 0.6rem;
    border: 0;
    background: none;
  }
  .ostracon {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 0.8rem;
    padding: 1rem;
    border-radius: 40% 55% 45% 60%;
    background: #d9a873;
    color: #3a1a08;
    font-family: var(--font-glyph);
    font-size: 2.6rem;
  }
  /* Volteados: miran a la derecha */
  .ostracon span {
    display: inline-block;
    transform: scaleX(-1);
  }
  .note {
    margin-top: 0.5rem;
    font-style: italic;
    color: var(--muted);
  }
  @keyframes pop {
    50% {
      transform: scale(1.2);
    }
  }
  @media (max-width: 700px) {
    .wide {
      display: none;
    }
  }
</style>
