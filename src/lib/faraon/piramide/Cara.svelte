<script lang="ts">
  import { faraon } from '../state.svelte';
  import { sfx } from '../audio';

  const marked = $derived(faraon.isDone('espejo'));
  let pushing = $state(false);
  let message = $state('');

  function push() {
    if (!marked) {
      sfx('no');
      message = 'Empujas con todas tus fuerzas. La pirámide, como es lógico, no se mueve.';
      return;
    }
    sfx('stone');
    pushing = true;
    setTimeout(() => faraon.complete('entrada'), 1400);
  }
</script>

<div class="wrap">
  <p class="lead">
    {#if marked}
      Donde tocó la luz, una de las piedras ha quedado rodeada por una fina línea de polvo dorado.
    {:else}
      Bloques de piedra perfectamente encajados. Tallados en ellos, tres símbolos: un ojo, un ankh y un
      escarabajo. Ni una rendija.
    {/if}
  </p>

  <div class="wall" aria-hidden="true">
    {#each Array(24) as _, i}
      <span class="block" class:target={i === 15} class:marked={marked && i === 15} class:pushing={pushing && i === 15}>
        {#if i === 3}𓂀{:else if i === 9}𓋹{:else if i === 15}𓆣{/if}
      </span>
    {/each}
  </div>

  <p class="msg" aria-live="polite">{pushing ? 'La piedra se hunde con un rugido. Un aire frío y antiguo sale de la oscuridad.' : message}</p>

  {#if !pushing}
    <button class="push" onclick={push}>
      {marked ? 'Empujar la piedra del escarabajo' : 'Empujar la pared'}
    </button>
  {/if}
</div>

<style>
  .wrap {
    display: grid;
    gap: 1.2rem;
    justify-items: center;
  }
  .lead {
    max-width: 38rem;
    font-size: 1.1rem;
    font-style: italic;
    line-height: 1.6;
  }
  .wall {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 4px;
    width: min(100%, 30rem);
    padding: 4px;
    background: #6b3e1c;
    perspective: 600px;
  }
  .block {
    display: grid;
    place-items: center;
    aspect-ratio: 3 / 2;
    background: linear-gradient(135deg, #d29a60, #b97a45);
    color: #5a2c10;
    font-family: var(--font-glyph);
    font-size: clamp(1.2rem, 4vw, 1.9rem);
    transition: transform 1.2s cubic-bezier(0.5, 0, 0.7, 1), background 0.6s, box-shadow 0.6s;
  }
  .marked {
    box-shadow: inset 0 0 0 2px #ffe2a0, 0 0 18px #ffcf6b;
    color: #fff4c8;
  }
  .pushing {
    transform: translateZ(-120px);
    background: #1a0d06;
    box-shadow: none;
  }
  .msg {
    min-height: 1.6em;
    max-width: 34rem;
    text-align: center;
    color: var(--muted);
  }
  .push {
    padding: 0.75rem 1.4rem;
    border: 1px solid var(--accent);
    border-radius: 999px;
    background: var(--accent);
    color: var(--accent-ink);
    font-family: var(--font-display);
    font-weight: 700;
  }
</style>
