<script lang="ts">
  import Lock from '$lib/components/Lock.svelte';
  import type { LevelProps } from '..';

  let { onsolve }: LevelProps = $props();
</script>

<div class="scene">
  <p class="lead">
    Un frasco en la mesa de trabajo. Alguien arrancó la etiqueta, pero el frasco todavía «sabe» lo
    que contiene.
  </p>

  <div class="bench">
    <div class="jar" aria-label="Frasco sin etiqueta" role="img">
      <span class="lid"></span>
      <span class="liquid"></span>
      <span class="scar"></span>
      <!-- La etiqueta sigue en el DOM: solo se ve desde el inspector -->
      <p class="label" hidden data-contenido="ISÓTOPO">Contenido: ISÓTOPO · manipular con cuidado</p>
    </div>
    <ul class="notes">
      <li>Registro 12/03 — Contenido inestable.</li>
      <li>Registro 14/03 — Etiqueta retirada <em>de la vista</em>, no del frasco.</li>
      <li>Registro 15/03 — Si necesitas saberlo, <strong>inspecciona</strong> el frasco.</li>
    </ul>
  </div>

  <Lock answer="SVNPVE9QTw==" label="¿Qué contiene el frasco?" {onsolve} />
</div>

<style>
  .scene { display: grid; gap: 1.8rem; justify-items: start; }
  .lead { max-width: 40rem; font-size: 1.15rem; line-height: 1.5; color: var(--muted); }
  .bench { display: flex; flex-wrap: wrap; gap: 3rem; align-items: end; }
  .jar {
    position: relative;
    width: 9rem;
    height: 12rem;
    border: 3px solid #9fb9b2;
    border-radius: 1rem 1rem 2rem 2rem;
    background: rgb(255 255 255 / 0.5);
    overflow: hidden;
  }
  .lid {
    position: absolute;
    inset: -3px -3px auto;
    height: 1.4rem;
    background: #0f2a26;
  }
  .liquid {
    position: absolute;
    inset: auto 0 0;
    height: 55%;
    background: linear-gradient(#3fe0b8, #00806a);
    animation: glow 3s ease-in-out infinite alternate;
  }
  .scar {
    position: absolute;
    top: 35%;
    left: 15%;
    width: 70%;
    height: 2.4rem;
    border: 1px dashed #9fb9b2;
    background: repeating-linear-gradient(90deg, rgb(255 255 255 / 0.7) 0 6px, transparent 6px 9px);
  }
  .notes {
    display: grid;
    gap: 0.6rem;
    margin: 0;
    padding: 1.2rem 1.4rem;
    list-style: none;
    border-left: 3px solid var(--accent);
    background: var(--surface);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.85rem;
  }
  @keyframes glow { to { filter: brightness(1.2) saturate(1.3); } }
  @media (prefers-reduced-motion: reduce) { .liquid { animation: none; } }
</style>
