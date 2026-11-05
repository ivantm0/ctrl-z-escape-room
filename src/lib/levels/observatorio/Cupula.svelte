<script lang="ts">
  import { onMount } from 'svelte';
  import Lock from '$lib/components/Lock.svelte';
  import type { LevelProps } from '..';

  let { onsolve }: LevelProps = $props();

  // El cielo de la cúpula sigue el tema del sistema: de día no hay estrellas
  let night = $state(false);
  onMount(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    night = mq.matches;
    const update = (e: MediaQueryListEvent) => (night = e.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  });

  // Dígitos dibujados como constelaciones, con los segmentos de un display de 7 segmentos
  const P = { a: [0, 0], b: [60, 0], c: [0, 60], d: [60, 60], e: [0, 120], f: [60, 120] } as const;
  type Pt = keyof typeof P;
  const SEG: Record<string, [Pt, Pt]> = {
    top: ['a', 'b'], ul: ['a', 'c'], ur: ['b', 'd'], mid: ['c', 'd'], ll: ['c', 'e'], lr: ['d', 'f'], bot: ['e', 'f'],
  };
  const DIGITS: string[][] = [
    ['ul', 'ur', 'mid', 'lr'],
    ['top', 'ul', 'ur', 'll', 'lr', 'bot'],
    ['top', 'ur', 'lr'],
  ];
  const constellation = DIGITS.map((segs, i) => {
    const ox = 190 + i * 110;
    const oy = 95;
    const lines = segs.map((s) => SEG[s].map((p) => [P[p][0] + ox, P[p][1] + oy]));
    const pts = new Map<string, number[]>();
    for (const line of lines) for (const [x, y] of line) pts.set(`${x},${y}`, [x, y]);
    return { lines, stars: [...pts.values()] };
  });

  // Estrellas de fondo con una semilla fija: siempre el mismo cielo
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const field = Array.from({ length: 90 }, () => ({ x: rnd() * 640, y: rnd() * 300, r: rnd() * 1.3 + 0.3, d: rnd() * 4 }));
</script>

<div class="scene">
  <p class="lead">
    La cúpula se abre al cielo. Dicen que su cielo y <em>el tuyo</em> son el mismo.
  </p>

  <figure class="dome" class:night>
    <svg viewBox="0 0 640 330" role="img" aria-label={night ? 'Cielo nocturno con una constelación' : 'Cielo de día, sin estrellas'}>
      <defs>
        <clipPath id="dome-clip"><path d="M20 330 V200 A300 200 0 0 1 620 200 V330 Z" /></clipPath>
        <linearGradient id="day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fb3e6" /><stop offset="1" stop-color="#cfe9f7" /></linearGradient>
        <linearGradient id="nightsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050816" /><stop offset="1" stop-color="#18234d" /></linearGradient>
      </defs>
      <g clip-path="url(#dome-clip)">
        {#if night}
          <rect width="640" height="330" fill="url(#nightsky)" />
          {#each field as s}
            <circle cx={s.x} cy={s.y} r={s.r} fill="#efe6d2" class="twinkle" style="animation-delay:{s.d}s" />
          {/each}
          {#each constellation as c}
            {#each c.lines as [[x1, y1], [x2, y2]]}
              <line {x1} {y1} {x2} {y2} stroke="#e0b46a" stroke-opacity="0.45" stroke-width="1.2" class="draw" />
            {/each}
            {#each c.stars as [x, y]}
              <circle cx={x} cy={y} r="3.4" fill="#fff6dc" class="bright" />
            {/each}
          {/each}
        {:else}
          <rect width="640" height="330" fill="url(#day)" />
          <circle cx="470" cy="110" r="38" fill="#fff3c4" />
          <g fill="#fff" opacity="0.9" class="clouds">
            <ellipse cx="170" cy="150" rx="70" ry="22" /><ellipse cx="215" cy="135" rx="45" ry="26" />
            <ellipse cx="380" cy="230" rx="90" ry="20" /><ellipse cx="420" cy="215" rx="50" ry="24" />
          </g>
          <text x="320" y="300" text-anchor="middle" fill="#29496b" font-family="IBM Plex Mono, monospace" font-size="14">
            Es de día. Desde aquí no se ve ni una estrella.
          </text>
        {/if}
      </g>
      <path d="M20 330 V200 A300 200 0 0 1 620 200 V330" fill="none" stroke="#e0b46a" stroke-width="3" />
      <line x1="0" y1="329" x2="640" y2="329" stroke="#e0b46a" stroke-width="3" />
    </svg>
    <figcaption>Cúpula · {night ? 'noche' : 'día'}</figcaption>
  </figure>

  <Lock answer="NDA3" label="Combinación del armario de mapas (3 cifras)" {onsolve} />
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
  .dome {
    width: 100%;
    max-width: 52rem;
    margin: 0;
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
  figcaption {
    margin-top: 0.6rem;
    font-size: 0.75rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .twinkle {
    animation: twinkle 4s ease-in-out infinite;
  }
  .bright {
    filter: drop-shadow(0 0 4px #ffe8a8);
  }
  .draw {
    stroke-dasharray: 60;
    animation: draw 2s ease-out both;
  }
  .clouds {
    animation: drift 12s ease-in-out infinite alternate;
  }
  @keyframes twinkle {
    50% { opacity: 0.3; }
  }
  @keyframes draw {
    from { stroke-dashoffset: 60; }
  }
  @keyframes drift {
    to { transform: translateX(20px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .twinkle, .draw, .clouds { animation: none; }
  }
</style>
