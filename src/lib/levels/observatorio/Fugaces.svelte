<script lang="ts">
  import { onMount } from 'svelte';
  import Lock from '$lib/components/Lock.svelte';
  import type { LevelProps } from '..';

  let { onsolve }: LevelProps = $props();

  // Cada vez que vuelves a la pestaña, ha pasado una estrella fugaz nueva
  const sightings = [
    { letter: 'L', name: 'Leónidas' },
    { letter: 'I', name: 'Íridas' },
    { letter: 'R', name: 'Ráfaga del norte' },
    { letter: 'A', name: 'Acuáridas' },
  ];
  let seen = $state(0);
  let flash = $state(0);

  onMount(() => {
    let wasHidden = false;
    const onChange = () => {
      if (document.visibilityState === 'hidden') wasHidden = true;
      else if (wasHidden) {
        wasHidden = false;
        if (seen < sightings.length) {
          seen += 1;
          flash += 1;
        }
      }
    };
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  });
</script>

<div class="scene">
  <p class="lead">
    Las estrellas fugaces son tímidas: solo cruzan el cielo cuando nadie las mira.
  </p>

  <div class="sky" aria-hidden="true">
    {#key flash}
      {#if flash > 0}<span class="streak"></span>{/if}
    {/key}
  </div>

  <section class="log" aria-label="Registro de avistamientos">
    <h2>Registro de avistamientos</h2>
    <ol>
      {#each sightings as s, i}
        <li class:seen={i < seen}>
          {#if i < seen}
            <span class="initial">{s.letter}</span><span>{s.name}</span>
          {:else}
            <span class="initial">?</span><span>Sin avistar</span>
          {/if}
        </li>
      {/each}
    </ol>
    <p class="note" aria-live="polite">
      {seen === 0
        ? 'Llevas un rato mirando y no ha pasado ninguna.'
        : seen < sightings.length
          ? `${seen} de ${sightings.length}. ¿Y si vuelves a mirar hacia otro lado?`
          : 'El registro está completo. Las iniciales dicen algo.'}
    </p>
  </section>

  <Lock answer="TElSQQ==" label="Constelación del registro" {onsolve} />
</div>

<style>
  .scene {
    display: grid;
    gap: 1.8rem;
    justify-items: start;
  }
  .lead {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-style: italic;
  }
  .sky {
    position: relative;
    width: 100%;
    max-width: 52rem;
    height: 9rem;
    overflow: hidden;
    border: 1px solid var(--line);
    background:
      radial-gradient(1px 1px at 12% 30%, #fff, transparent),
      radial-gradient(1px 1px at 40% 70%, #fff, transparent),
      radial-gradient(1.5px 1.5px at 68% 20%, #fff, transparent),
      radial-gradient(1px 1px at 85% 60%, #fff, transparent),
      linear-gradient(#050816, #18234d);
  }
  .streak {
    position: absolute;
    top: 15%;
    left: 70%;
    width: 9rem;
    height: 2px;
    background: linear-gradient(90deg, transparent, #fff6dc);
    transform: rotate(-20deg);
    animation: fall 1.4s ease-out forwards;
  }
  .log {
    width: min(100%, 26rem);
  }
  h2 {
    margin: 0 0 0.8rem;
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--muted);
  }
  ol {
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--line);
  }
  li {
    display: flex;
    gap: 1rem;
    align-items: baseline;
    padding: 0.6rem 0;
    border-bottom: 1px solid var(--line);
    color: var(--muted);
  }
  li.seen {
    color: var(--fg);
    animation: in 0.6s ease-out;
  }
  .initial {
    width: 1.5rem;
    font-family: var(--font-display);
    font-size: 1.6rem;
    font-weight: 700;
  }
  li.seen .initial {
    color: var(--accent);
  }
  .note {
    margin-top: 0.8rem;
    font-size: 0.85rem;
    color: var(--muted);
  }
  @keyframes fall {
    from { opacity: 0; transform: translate(0, 0) rotate(-20deg); }
    20% { opacity: 1; }
    to { opacity: 0; transform: translate(-28rem, 10rem) rotate(-20deg); }
  }
  @keyframes in {
    from { opacity: 0; transform: translateX(-8px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .streak, li.seen { animation: none; }
  }
</style>
