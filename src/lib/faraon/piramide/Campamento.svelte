<script lang="ts">
  import { faraon, type ItemId } from '../state.svelte';
  import { sfx } from '../audio';
  import PapiroTexto from './PapiroTexto.svelte';

  // Dos cosas que recoger en la tienda de los obreros
  const take = (id: ItemId) => {
    sfx('ok');
    faraon.give(id);
    if (faraon.s.items.includes('cepillo') && faraon.s.items.includes('papiro')) faraon.complete('campamento');
  };
  const hasBrush = $derived(faraon.s.items.includes('cepillo'));
  const hasPapyrus = $derived(faraon.s.items.includes('papiro'));
</script>

<div class="wrap">
  <p class="lead">
    La tienda de los obreros está vacía: se han ido antes de que caiga el sol. Huele a cebolla, sudor y
    cuerda. Junto a las esteras hay una cesta.
  </p>

  <div class="basket">
    {#if !hasBrush}
      <button class="pick" onclick={() => take('cepillo')}>
        <span class="g" aria-hidden="true">𓆰</span>
        <span>Coger el cepillo de palma</span>
      </button>
    {:else}
      <p class="got">✓ Cepillo de palma en el inventario</p>
    {/if}

    {#if !hasPapyrus}
      <button class="pick" onclick={() => take('papiro')}>
        <span class="g" aria-hidden="true">𓏛</span>
        <span>Coger el papiro roto</span>
      </button>
    {:else}
      <p class="got">✓ Papiro roto en el inventario</p>
    {/if}
  </div>

  {#if hasPapyrus}
    <section aria-label="Papiro roto">
      <PapiroTexto />
    </section>
  {/if}
</div>

<style>
  .wrap {
    display: grid;
    gap: 1.2rem;
  }
  .lead {
    font-size: 1.1rem;
    font-style: italic;
    line-height: 1.6;
  }
  .basket {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    padding: 1.2rem;
    border-radius: 50% 50% 1rem 1rem / 20% 20% 1rem 1rem;
    background: repeating-linear-gradient(45deg, #9a6a34 0 8px, #82552a 8px 16px);
  }
  .pick {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.7rem 1rem;
    border: 1px solid var(--accent);
    border-radius: 0.5rem;
    background: rgb(26 16 9 / 0.85);
  }
  .pick:hover {
    background: var(--accent);
    color: var(--accent-ink);
  }
  .g {
    font-family: var(--font-glyph);
    font-size: 1.6rem;
  }
  .got {
    padding: 0.7rem 1rem;
    border-radius: 0.5rem;
    background: rgb(26 16 9 / 0.6);
    color: var(--accent);
  }
</style>
