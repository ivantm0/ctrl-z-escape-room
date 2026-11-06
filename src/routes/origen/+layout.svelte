<script lang="ts">
  import DesktopOnly from '$lib/components/DesktopOnly.svelte';
  let { children } = $props();
</script>

<DesktopOnly>{@render children()}</DesktopOnly>
