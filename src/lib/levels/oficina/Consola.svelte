<script lang="ts">
  import { onMount } from 'svelte';
  import Lock from '$lib/components/Lock.svelte';
  import type { LevelProps } from '..';

  let { onsolve }: LevelProps = $props();

  const boot = [
    'TERMINAL-92  v3.11',
    'Memoria ......... 640K OK',
    'Disco C: ........ OK',
    'Red ............. SIN CONEXIÓN',
    '',
    'ACCESO RESTRINGIDO. Identifíquese.',
  ];
  let lines = $state(0);

  onMount(() => {
    // La contraseña solo existe en la consola del navegador
    console.log('%cTERMINAL-92 · MODO MANTENIMIENTO', 'font: 700 15px monospace; color: #39ff7a; background: #050805; padding: 6px 10px');
    console.log('%cNota del técnico: la contraseña de hoy es FÓSFORO. No se la digas a nadie.', 'font: 13px monospace; color: #39ff7a');

    const id = setInterval(() => {
      lines += 1;
      if (lines >= boot.length) clearInterval(id);
    }, 260);
    return () => clearInterval(id);
  });
</script>

<div class="desk">
  <div class="monitor">
    <pre aria-live="off">{boot.slice(0, lines).join('\n')}<span class="cursor">█</span></pre>
    <Lock answer="Rk9TRk9STw==" label="Contraseña" {onsolve} />
  </div>

  <aside class="postit">
    <p>Nunca escribo la contraseña en la pantalla.</p>
    <p>La dejo <strong>detrás</strong>.</p>
    <p class="sign">— El técnico</p>
  </aside>
</div>

<style>
  .desk {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: 2rem;
  }
  .monitor {
    display: grid;
    gap: 1.5rem;
    min-height: 22rem;
    padding: clamp(1.2rem, 4vw, 2.2rem);
    border: 2px solid var(--line);
    border-radius: 1.2rem;
    background: radial-gradient(120% 90% at 50% 40%, #0c1a0f, #040604);
    box-shadow: inset 0 0 60px rgb(57 255 122 / 0.08), 0 0 0 10px #151815, 0 30px 80px rgb(0 0 0 / 0.6);
  }
  pre {
    margin: 0;
    font: inherit;
    font-size: 1.15em;
    line-height: 1.35;
    white-space: pre-wrap;
  }
  .cursor {
    animation: blink 1s steps(1) infinite;
  }
  .postit {
    width: 13rem;
    padding: 1.2rem 1rem 1.4rem;
    background: #f3e27a;
    color: #2b2610;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 1.05rem;
    font-style: italic;
    line-height: 1.35;
    text-shadow: none;
    box-shadow: 0 12px 24px rgb(0 0 0 / 0.5);
    transform: rotate(3deg);
  }
  .sign {
    margin-top: 0.6rem;
    text-align: right;
  }
  @keyframes blink {
    50% { opacity: 0; }
  }
  @media (max-width: 720px) {
    .desk { grid-template-columns: minmax(0, 1fr); }
    .postit { justify-self: end; margin-top: -1rem; }
  }
  @media (prefers-reduced-motion: reduce) {
    .cursor { animation: none; }
  }
</style>
