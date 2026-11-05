<script lang="ts">
  import { faraon } from '../state.svelte';
  import { sfx } from '../audio';

  // La llave está en la 4.ª: no en los extremos, no en la más alta, a la derecha de la del ojo sin tocarla
  const JARS = [
    { glyph: '𓋹', name: 'ankh', h: 0.72, color: '#b5643a' },
    { glyph: '𓂀', name: 'ojo', h: 0.86, color: '#a3552f' },
    { glyph: '𓆄', name: 'pluma', h: 1, color: '#c07547' },
    { glyph: '𓆸', name: 'loto', h: 0.72, color: '#9c4c2a' },
    { glyph: '𓆣', name: 'escarabajo', h: 0.86, color: '#b86a3c' },
  ];
  const KEY = 3;

  const solved = $derived(faraon.isDone('vasijas'));
  let shaking = $state<number | null>(null);
  let message = $state('');

  function look(i: number) {
    if (solved) return;
    if (i === KEY) {
      sfx('ok');
      message = 'Al inclinar la vasija del loto, algo metálico tintinea en el fondo: ¡una llave de bronce!';
      faraon.complete('vasijas');
      faraon.give('llave');
    } else {
      sfx('no');
      shaking = i;
      setTimeout(() => (shaking = null), 500);
      message = `En la vasija del ${JARS[i].name} solo hay arena. El alfarero chasquea la lengua.`;
    }
  }
</script>

<div class="wrap">
  <blockquote>
    «Escondí mi llave en una de mis vasijas, para que ningún ladrón la encuentre.
    <strong>No está en los extremos</strong>, porque ahí miran todos.
    <strong>Tampoco en la más alta</strong>, que es la que más se rompe.
    Está <strong>a la derecha de la vasija del ojo</strong>, pero no pegada a ella.»
  </blockquote>

  <div class="jars" role="group" aria-label="Vasijas del alfarero">
    {#each JARS as jar, i}
      <button class="jar" class:shake={shaking === i} class:found={solved && i === KEY} onclick={() => look(i)} aria-label="Mirar dentro de la vasija del {jar.name}" style="--h: {jar.h}; --c: {jar.color}">
        <svg viewBox="0 0 100 140" aria-hidden="true">
          <g style="transform: scaleY(var(--h)); transform-origin: 50px 140px">
            <path d="M34 10 h32 v10 q26 14 26 56 q0 50 -42 62 q-42 -12 -42 -62 q0 -42 26 -56z" fill="var(--c)" />
            <path d="M14 70 q36 10 72 0" stroke="#3a1a08" stroke-width="2" fill="none" opacity="0.5" />
          </g>
        </svg>
        <span class="glyph">{jar.glyph}</span>
      </button>
    {/each}
  </div>

  <p class="msg" aria-live="polite">{solved && !message ? 'Ya tienes la llave de bronce del alfarero.' : message}</p>
</div>

<style>
  .wrap {
    display: grid;
    gap: 1.4rem;
  }
  blockquote {
    margin: 0;
    padding: 1rem 1.2rem;
    border-left: 3px solid var(--accent);
    background: rgb(0 0 0 / 0.2);
    font-size: 1.1rem;
    font-style: italic;
    line-height: 1.6;
  }
  strong {
    color: var(--accent);
    font-weight: 500;
  }
  .jars {
    display: flex;
    justify-content: center;
    align-items: end;
    gap: clamp(0.4rem, 2vw, 1.2rem);
    padding-bottom: 0.6rem;
    border-bottom: 6px solid #6b4220;
  }
  .jar {
    position: relative;
    display: grid;
    justify-items: center;
    width: clamp(3.6rem, 13vw, 6.5rem);
    padding: 0;
    border: 0;
    background: none;
    transition: transform 0.3s;
  }
  .jar:hover {
    transform: translateY(-6px);
  }
  .jar svg {
    width: 100%;
  }
  .glyph {
    position: absolute;
    bottom: 32%;
    font-family: var(--font-glyph);
    font-size: clamp(1.1rem, 3vw, 1.7rem);
    color: #f6e7c9;
  }
  .shake {
    animation: shake 0.45s;
  }
  .found {
    filter: drop-shadow(0 0 14px #e9b54a);
  }
  .msg {
    min-height: 1.6em;
    text-align: center;
    color: var(--muted);
  }
  @keyframes shake {
    25% { transform: rotate(-8deg); }
    50% { transform: rotate(6deg); }
    75% { transform: rotate(-3deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    .shake { animation: none; }
  }
</style>
