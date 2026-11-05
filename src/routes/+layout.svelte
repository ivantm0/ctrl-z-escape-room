<script lang="ts">
  import { onMount } from 'svelte';
  import { onNavigate } from '$app/navigation';
  import { game } from '$lib/game.svelte';
  import '../app.css';

  let { children } = $props();

  onMount(() => game.load());

  // Transición entre pantallas con la View Transitions API (si el navegador la tiene)
  onNavigate((navigation) => {
    if (!document.startViewTransition) return;
    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
</script>

{@render children()}
