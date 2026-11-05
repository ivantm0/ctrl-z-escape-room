<script lang="ts">
  import type { Snippet } from 'svelte';

  // Primer plano: el objeto clicado crece desde su posición en la escena
  let {
    title,
    origin,
    onclose,
    children,
  }: { title: string; origin: { x: number; y: number }; onclose: () => void; children: Snippet } = $props();

  let dialog: HTMLDialogElement;

  $effect(() => {
    dialog.showModal();
    return () => dialog.close();
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
  bind:this={dialog}
  aria-label={title}
  style="--ox: {origin.x}px; --oy: {origin.y}px"
  onclose={onclose}
  onclick={(e) => e.target === dialog && onclose()}
>
  <div class="panel">
    <header>
      <h2>{title}</h2>
      <button class="close" onclick={onclose} aria-label="Cerrar">✕</button>
    </header>
    <div class="body">{@render children()}</div>
  </div>
</dialog>

<style>
  dialog {
    width: min(56rem, calc(100vw - 1.5rem));
    max-height: calc(100dvh - 1.5rem);
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--fg);
    overflow: visible;
  }
  dialog::backdrop {
    background: rgb(10 6 2 / 0.72);
    backdrop-filter: blur(3px);
    animation: fade 0.3s ease-out;
  }
  .panel {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    max-height: calc(100dvh - 1.5rem);
    border: 2px solid var(--accent);
    border-radius: 0.8rem;
    background:
      radial-gradient(circle at 30% 0%, rgb(233 181 74 / 0.12), transparent 60%),
      var(--surface);
    box-shadow: 0 40px 100px rgb(0 0 0 / 0.6);
    animation: grow 0.45s cubic-bezier(0.2, 0.9, 0.25, 1.05);
    /* Crece desde el punto de la escena donde se clicó */
    transform-origin: calc(var(--ox) - (100vw - 100%) / 2) calc(var(--oy) - (100dvh - 100%) / 2);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.4rem;
    border-bottom: 1px solid var(--line);
  }
  h2 {
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--accent);
  }
  .close {
    width: 2.4rem;
    height: 2.4rem;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: none;
  }
  .close:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
  .body {
    padding: clamp(1rem, 3vw, 1.8rem);
    overflow: auto;
  }
  @keyframes grow {
    from {
      opacity: 0;
      transform: scale(0.15);
    }
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .panel,
    dialog::backdrop {
      animation: none;
    }
  }
</style>
