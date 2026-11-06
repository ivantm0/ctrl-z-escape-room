<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { device } from '$lib/device.svelte';

  // El Origen se juega con todo el navegador (consola, ventanas, pestañas…): en móvil, bloqueado
  let { children }: { children: Snippet } = $props();
  onMount(() => device.load());
</script>

{#if device.touch}
  <main class="block">
    <div class="card">
      <p class="icon" aria-hidden="true">🖥</p>
      <p class="kicker">Escape room 1 · El Origen</p>
      <h1>Solo en ordenador</h1>
      <p>
        Las pistas de El Origen están en la consola, las pestañas, el tamaño de la ventana y el
        portapapeles. Abre esta página en un ordenador con teclado y ratón para jugar.
      </p>
      <a href="/">← Volver a los escape rooms</a>
    </div>
  </main>
{:else}
  {@render children()}
{/if}

<style>
  .block {
    display: grid;
    min-height: 100dvh;
    place-items: center;
    padding: 1.5rem;
  }
  .card {
    display: grid;
    gap: 1rem;
    max-width: 28rem;
    padding: 2rem 1.5rem;
    border: 1px solid var(--line, #333);
    border-radius: 1rem;
    text-align: center;
  }
  .icon {
    font-size: 2.6rem;
  }
  .kicker {
    font-size: 0.7rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent, #ffb347);
  }
  h1 {
    font-size: 1.6rem;
  }
  a {
    color: var(--accent, #ffb347);
  }
</style>
