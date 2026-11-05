<script lang="ts">
  import { faraon, ITEMS, type ItemId } from './state.svelte';

  // Los objetos que llevas, para usarlos dentro de un primer plano
  let { onpick, label = 'Usar un objeto' }: { onpick: (id: ItemId) => void; label?: string } = $props();

  // Solo los objetos de este capítulo
  const held = $derived((Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].chapter === faraon.s.chapter && faraon.has(id)));
</script>

<div class="picker" role="group" aria-label={label}>
  <p>{label}</p>
  {#if held.length}
    <div class="items">
      {#each held as id}
        <button onclick={() => onpick(id)}>
          <span class="glyph" aria-hidden="true">{ITEMS[id].glyph}</span>
          {ITEMS[id].name}
        </button>
      {/each}
    </div>
  {:else}
    <p class="empty">No llevas nada que puedas usar aquí.</p>
  {/if}
</div>

<style>
  .picker {
    display: grid;
    gap: 0.6rem;
    padding-top: 1rem;
    border-top: 1px dashed var(--line);
  }
  p {
    font-size: 0.8rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .items {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.9rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: rgb(0 0 0 / 0.25);
  }
  button:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
  .glyph {
    font-family: var(--font-glyph);
    font-size: 1.3rem;
  }
  .empty {
    text-transform: none;
    letter-spacing: 0;
    font-style: italic;
  }
</style>
