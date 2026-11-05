<script lang="ts">
  import Lock from '$lib/components/Lock.svelte';
  import type { LevelProps } from '..';

  let { onsolve }: LevelProps = $props();
</script>

<div class="scene">
  <p>&gt; Último archivo antes de la puerta. Parece que alguien lo vació.</p>

  <article class="window" aria-label="Documento confidencial">
    <header>
      <span>CONFIDENCIAL.TXT</span>
      <span aria-hidden="true">_ □ ×</span>
    </header>
    <!-- El texto es del mismo color que el papel: solo se ve al seleccionarlo -->
    <div class="paper">
      <p class="ink">(documento vacío)</p>
      <p class="invisible">Si estás leyendo esto, has visto lo que nadie ve.</p>
      <p class="invisible">La puerta de la oficina se abre con una palabra:</p>
      <p class="invisible big">SUBRAYADO</p>
      <p class="invisible">Bórralo después de leerlo.</p>
    </div>
  </article>

  <Lock answer="U1VCUkFZQURP" label="Palabra de la puerta" {onsolve} />
</div>

<style>
  .scene {
    display: grid;
    gap: 1.8rem;
  }
  .window {
    max-width: 40rem;
    border: 2px solid var(--accent);
    background: var(--surface);
    box-shadow: 8px 8px 0 rgb(57 255 122 / 0.15);
  }
  header {
    display: flex;
    justify-content: space-between;
    padding: 0.3rem 0.8rem;
    background: var(--accent);
    color: var(--accent-ink);
    text-shadow: none;
  }
  .paper {
    padding: 1.6rem;
    min-height: 16rem;
    background: #e9eee6;
    text-shadow: none;
    line-height: 1.5;
  }
  .ink {
    color: #8a958a;
    margin-bottom: 1rem;
  }
  .invisible {
    color: #e9eee6;
  }
  .invisible::selection {
    background: #0b120c;
    color: #39ff7a;
  }
  .big {
    margin: 0.6rem 0;
    font-size: clamp(1.4em, 6vw, 2.2em);
    letter-spacing: 0.15em;
    overflow-wrap: anywhere;
  }
</style>
