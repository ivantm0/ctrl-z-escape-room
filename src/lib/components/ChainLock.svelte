<script lang="ts">
  // Candado gigante con dos cadenas cruzadas que tapa una tarjeta bloqueada
  let { label, reason }: { label: string; reason: string } = $props();

  // Eslabones a lo largo de una diagonal (coordenadas del viewBox 0–400 × 0–300)
  const links = (x1: number, y1: number, x2: number, y2: number, n: number) =>
    Array.from({ length: n }, (_, i) => {
      const t = (i + 0.5) / n;
      return { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t, odd: i % 2 === 1 };
    });
  const angleA = (Math.atan2(340, 440) * 180) / Math.PI;
  const chainA = links(-20, -20, 420, 320, 15);
  const chainB = links(420, -20, -20, 320, 15);
</script>

<div class="lock" role="img" aria-label="Bloqueado: {reason}">
  <span class="sr-only">{reason}</span>
  <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e9edf2" />
        <stop offset="0.5" stop-color="#9aa3ad" />
        <stop offset="1" stop-color="#5c646e" />
      </linearGradient>
      <linearGradient id="brass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ffe08a" />
        <stop offset="0.55" stop-color="#e0a83a" />
        <stop offset="1" stop-color="#9a6a18" />
      </linearGradient>
    </defs>

    <!-- Cadenas en aspa -->
    {#each [{ chain: chainA, angle: angleA }, { chain: chainB, angle: -angleA }] as c}
      {#each c.chain as l}
        <g transform="translate({l.x} {l.y}) rotate({c.angle})">
          {#if l.odd}
            <rect x="-17" y="-5" width="34" height="10" rx="5" fill="none" stroke="#2a2f36" stroke-width="9" />
            <rect x="-17" y="-5" width="34" height="10" rx="5" fill="none" stroke="url(#steel)" stroke-width="6" />
          {:else}
            <rect x="-18" y="-10" width="36" height="20" rx="10" fill="none" stroke="#2a2f36" stroke-width="9" />
            <rect x="-18" y="-10" width="36" height="20" rx="10" fill="none" stroke="url(#steel)" stroke-width="6" />
          {/if}
        </g>
      {/each}
    {/each}

    <!-- El candado -->
    <g class="padlock" transform="translate(200 158)">
      <path d="M-34 -18 V-48 a34 34 0 0 1 68 0 V-18" fill="none" stroke="#2a2f36" stroke-width="20" />
      <path d="M-34 -18 V-48 a34 34 0 0 1 68 0 V-18" fill="none" stroke="url(#steel)" stroke-width="13" />
      <rect x="-58" y="-22" width="116" height="92" rx="14" fill="#2a2f36" />
      <rect x="-54" y="-18" width="108" height="84" rx="11" fill="url(#brass)" />
      <circle cx="0" cy="14" r="11" fill="#3a2a0c" />
      <path d="M-5 18 h10 l4 26 h-18 z" fill="#3a2a0c" />
    </g>
  </svg>
  <p class="tag" aria-hidden="true">{label}</p>
</div>

<style>
  .lock {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: grid;
    place-items: end center;
    padding-bottom: 6%;
    background: rgb(10 10 12 / 0.55);
    pointer-events: none;
  }
  svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 10px 18px rgb(0 0 0 / 0.6));
  }
  .padlock {
    animation: rattle 4s ease-in-out infinite;
    transform-box: fill-box;
  }
  .tag {
    position: relative;
    padding: 0.5rem 0.9rem;
    border: 2px solid #2a2f36;
    border-radius: 0.4rem;
    background: #ffe08a;
    color: #2a1d05;
    font-family: 'Press Start 2P', monospace;
    font-size: clamp(0.5rem, 1.6vw, 0.65rem);
    letter-spacing: 0.04em;
    text-align: center;
    box-shadow: 0 6px 14px rgb(0 0 0 / 0.5);
  }
  @keyframes rattle {
    0%,
    86%,
    100% {
      rotate: 0deg;
    }
    89% {
      rotate: -4deg;
    }
    92% {
      rotate: 4deg;
    }
    95% {
      rotate: -2deg;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .padlock {
      animation: none;
    }
  }
</style>
