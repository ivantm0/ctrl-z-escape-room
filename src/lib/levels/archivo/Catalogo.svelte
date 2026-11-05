<script lang="ts">
  import { onMount } from 'svelte';
  import Lock from '$lib/components/Lock.svelte';
  import type { LevelProps } from '..';

  let { onsolve }: LevelProps = $props();

  // La posición en el archivo vive en el #hash de la URL: #s<sección>-e<estante>
  let pos = $state({ s: 1, e: 1 });
  const found = $derived(pos.s === 7 && pos.e === 3);

  const read = () => {
    const m = location.hash.match(/^#s(\d+)-e(\d+)$/i);
    if (m) pos = { s: +m[1], e: +m[2] };
  };

  onMount(() => {
    // API nativa (no la de SvelteKit): conserva su estado y solo añade el #hash
    if (!location.hash) history.replaceState(history.state, '', '#s1-e1');
    read();
    // SvelteKit gestiona la navegación por hash: se comprueba la URL periódicamente
    const id = setInterval(read, 250);
    return () => {
      clearInterval(id);
      history.replaceState(history.state, '', location.pathname);
    };
  });

  // Lomos de libros inventados según la posición, siempre los mismos para cada estante
  const titles = ['Anales', 'Crónica', 'Tratado', 'Compendio', 'Memorias', 'Códice', 'Glosario', 'Herbario', 'Atlas'];
  const books = $derived.by(() => {
    let seed = pos.s * 31 + pos.e * 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    return Array.from({ length: 9 }, () => ({
      title: `${titles[Math.floor(rnd() * titles.length)]} ${['I', 'II', 'III', 'IV', 'V'][Math.floor(rnd() * 5)]}`,
      h: 70 + rnd() * 30,
      hue: 10 + rnd() * 30,
    }));
  });
</script>

<div class="scene">
  <p class="lead">
    El archivo tiene miles de estantes y ninguna escalera. Pero en la mesa hay una ficha del catálogo.
  </p>

  <div class="layout">
    <article class="card" aria-label="Ficha del catálogo">
      <p class="ref">Ficha nº 0703</p>
      <h2>Tratado de las puertas que no se abren</h2>
      <p>Ubicación: <strong>Sección 7, Estante 3</strong></p>
      <p class="small">Los pasillos de este archivo se recorren desde la dirección.</p>
    </article>

    <div class="shelf-wrap">
      <p class="where" aria-live="polite">Estás en: Sección {pos.s}, Estante {pos.e}</p>
      <div class="shelf">
        {#if found}
          <div class="book found" style="height: 100%">PERGAMINO</div>
        {/if}
        {#each books.slice(found ? 1 : 0) as b}
          <div class="book" style="height: {b.h}%; background: hsl({b.hue} 45% 28%)">{b.title}</div>
        {/each}
      </div>
    </div>
  </div>

  <Lock answer="UEVSR0FNSU5P" label="Título del libro encontrado" {onsolve} />
</div>

<style>
  .scene { display: grid; gap: 1.8rem; justify-items: start; }
  .lead { max-width: 42rem; font-size: 1.25rem; line-height: 1.5; font-style: italic; color: var(--muted); }
  .layout { display: flex; flex-wrap: wrap; gap: 2.5rem; align-items: start; }
  .card {
    width: min(100%, 20rem);
    padding: 1.4rem;
    border: 1px solid var(--line);
    background: #fbf5e6;
    box-shadow: 4px 6px 0 rgb(51 35 15 / 0.12);
    transform: rotate(-1deg);
    line-height: 1.4;
  }
  .ref { font-size: 0.8rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); }
  h2 { margin: 0.4rem 0 0.8rem; font-size: 1.4rem; font-weight: 400; }
  .small { margin-top: 0.8rem; font-size: 0.9rem; font-style: italic; color: var(--muted); }
  .shelf-wrap { flex: 1; min-width: min(100%, 22rem); }
  .where { margin-bottom: 0.6rem; font-size: 0.95rem; color: var(--muted); }
  .shelf {
    display: flex;
    align-items: end;
    gap: 4px;
    height: 13rem;
    padding: 0 0.6rem;
    border-bottom: 10px solid #5b3d1e;
    overflow: hidden;
  }
  .book {
    flex: 1;
    min-width: 1.6rem;
    padding: 0.5rem 0;
    color: #e9d9b5;
    font-size: 0.75rem;
    writing-mode: vertical-rl;
    text-align: center;
    border-radius: 2px 2px 0 0;
  }
  .found {
    background: #8e2b17;
    color: #fff3d6;
    font-size: 1rem;
    letter-spacing: 0.2em;
    box-shadow: 0 0 24px rgb(142 43 23 / 0.6);
    animation: pull 0.8s ease-out;
  }
  @keyframes pull { from { transform: translateY(20%); } }
</style>
