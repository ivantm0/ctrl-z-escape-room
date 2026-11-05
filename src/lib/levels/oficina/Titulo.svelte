<script lang="ts">
  import { onMount } from 'svelte';
  import Lock from '$lib/components/Lock.svelte';
  import type { LevelProps } from '..';

  let { onsolve }: LevelProps = $props();

  const word = ['P', 'E', 'S', 'T', 'A', 'Ñ', 'A'];

  onMount(() => {
    // El título de la pestaña deletrea la clave, una letra cada vez
    const original = document.title;
    const frames = [...word.map((l, i) => `[${i + 1}/${word.length}] ${l}`), '· · ·'];
    let i = 0;
    const id = setInterval(() => {
      document.title = frames[i % frames.length];
      i += 1;
    }, 1100);
    return () => {
      clearInterval(id);
      document.title = original;
    };
  });
</script>

<div class="scene">
  <div class="arrows" aria-hidden="true">
    <span>↑</span><span>↑</span><span>↑</span>
  </div>

  <aside class="postit">
    <p>La siguiente clave la apunté arriba.</p>
    <p>Más arriba.</p>
    <p><strong>Más arriba todavía.</strong></p>
  </aside>

  <p class="screen">
    &gt; ARCHIVO BLOQUEADO: nominas_1992.dat<br />
    &gt; Introduzca la clave de 7 letras.
  </p>

  <Lock answer="UEVTVEFOQQ==" label="Clave del archivo" {onsolve} />
</div>

<style>
  .scene {
    display: grid;
    gap: 2rem;
    justify-items: start;
  }
  .arrows {
    display: flex;
    gap: 2.5rem;
    font-size: 2.2rem;
    color: var(--accent);
  }
  .arrows span {
    animation: up 1.6s ease-in-out infinite;
  }
  .arrows span:nth-child(2) { animation-delay: 0.2s; }
  .arrows span:nth-child(3) { animation-delay: 0.4s; }
  .postit {
    padding: 1.2rem 1.2rem 1.4rem;
    background: #f3e27a;
    color: #2b2610;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 1.15rem;
    font-style: italic;
    line-height: 1.4;
    text-shadow: none;
    box-shadow: 0 12px 24px rgb(0 0 0 / 0.5);
    transform: rotate(-2deg);
  }
  .screen {
    line-height: 1.4;
  }
  @keyframes up {
    50% { transform: translateY(-10px); opacity: 0.5; }
  }
  @media (prefers-reduced-motion: reduce) {
    .arrows span { animation: none; }
  }
</style>
