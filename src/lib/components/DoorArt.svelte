<script lang="ts">
  // Ilustración de cada sala para su puerta del vestíbulo. Usa el color de la puerta (--glow).
  let { id }: { id: string } = $props();
</script>

<svg class="art art-{id}" viewBox="0 0 200 140" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  {#if id === 'oficina'}
    <!-- Monitor CRT con texto y cursor -->
    <rect x="45" y="18" width="110" height="82" rx="10" />
    <rect x="55" y="28" width="90" height="60" rx="6" fill="currentColor" fill-opacity="0.08" />
    <path d="M63 40h40M63 50h58M63 60h30" stroke-width="3" opacity="0.7" />
    <rect class="blink" x="97" y="55" width="8" height="10" fill="currentColor" stroke="none" />
    <path d="M85 100l-8 18h46l-8-18M65 122h70" />
  {:else if id === 'observatorio'}
    <!-- Cúpula con la ranura abierta, telescopio y estrellas -->
    <path d="M40 120V88a60 52 0 0 1 120 0v32z" />
    <path d="M92 37v51h16V37" fill="currentColor" fill-opacity="0.1" />
    <path d="M100 70l26-30" stroke-width="4" />
    <path d="M30 120h140" />
    <circle cx="156" cy="26" r="9" />
    <circle cx="160" cy="23" r="8" fill="var(--door-bg, #161412)" stroke="none" />
    {#each [[34, 30], [62, 18], [138, 52], [176, 70], [24, 62]] as [x, y], i}
      <path class="twinkle" style="animation-delay: {i * 0.4}s" d="M{x} {y - 4}v8M{x - 4} {y}h8" stroke-width="1.6" />
    {/each}
  {:else if id === 'radio'}
    <!-- Radio de válvulas emitiendo ondas -->
    <rect x="48" y="48" width="104" height="70" rx="12" />
    <path d="M100 48L82 24" />
    <circle cx="80" cy="22" r="3" fill="currentColor" />
    <rect x="60" y="60" width="50" height="46" rx="6" fill="currentColor" fill-opacity="0.08" />
    {#each [68, 76, 84, 92, 100] as y}<path d="M66 {y}h38" stroke-width="1.4" opacity="0.6" />{/each}
    <circle cx="132" cy="72" r="9" />
    <path d="M132 72l5-5" />
    <circle cx="132" cy="98" r="6" />
    {#each [0, 1, 2] as i}
      <path class="wave" style="animation-delay: {i * 0.35}s" d="M{158 + i * 9} {56 - i * 6}a{20 + i * 9} {20 + i * 9} 0 0 1 0 {32 + i * 12}" stroke-width="1.6" />
    {/each}
  {:else if id === 'laboratorio'}
    <!-- Matraz burbujeando y tubo de ensayo -->
    <path d="M84 20h32M90 20v34l-30 52a8 8 0 0 0 7 12h66a8 8 0 0 0 7-12l-30-52V20" />
    <path d="M70 92h60l13 22H57z" fill="currentColor" fill-opacity="0.2" stroke="none" />
    {#each [[92, 86], [104, 98], [112, 82]] as [x, y], i}
      <circle class="bubble" style="animation-delay: {i * 0.5}s" cx={x} cy={y} r="3.5" />
    {/each}
    <path d="M150 52v54a7 7 0 0 0 14 0V52M146 52h22" />
    <path d="M150 84h14v22a7 7 0 0 1-14 0z" fill="currentColor" fill-opacity="0.2" stroke="none" />
  {:else if id === 'archivo'}
    <!-- Estantería con libros y una ficha -->
    <path d="M30 120h140M30 70h140" stroke-width="3" />
    {#each [[38, 30, 12], [52, 38, 10], [64, 26, 14], [80, 34, 9], [91, 30, 12], [106, 40, 10]] as [x, top, w]}
      <rect x={x} y={top} width={w} height={70 - top} rx="1.5" />
    {/each}
    <rect x="120" y="44" width="11" height="26" rx="1.5" transform="rotate(16 125 70)" />
    {#each [[40, 80, 14], [56, 86, 10], [68, 78, 12], [82, 84, 16], [100, 90, 9]] as [x, top, w]}
      <rect x={x} y={top} width={w} height={120 - top} rx="1.5" />
    {/each}
    <g class="card">
      <rect x="124" y="84" width="40" height="28" rx="2" fill="currentColor" fill-opacity="0.1" />
      <path d="M130 92h28M130 99h20M130 106h24" stroke-width="1.4" />
    </g>
  {:else if id === 'maquina'}
    <!-- Engranaje con fallo de señal -->
    <g class="gear">
      <circle cx="100" cy="70" r="30" />
      <circle cx="100" cy="70" r="10" />
      {#each Array(8) as _, i}
        <rect x="94" y="30" width="12" height="12" rx="2" transform="rotate({i * 45} 100 70)" />
      {/each}
    </g>
    <path class="glitch" d="M30 52h40M140 62h34M24 88h28M150 96h22" stroke-width="4" />
    <path d="M44 120h112" stroke-dasharray="4 6" />
  {/if}
</svg>

<style>
  .art {
    width: 100%;
    max-height: 9rem;
    color: var(--glow, var(--muted));
    filter: drop-shadow(0 0 10px color-mix(in srgb, var(--glow, transparent) 35%, transparent));
    transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .blink { animation: blink 1s steps(1) infinite; }
  .twinkle { animation: twinkle 2.4s ease-in-out infinite; }
  .wave { animation: wave 1.6s ease-out infinite; }
  .bubble { animation: bubble 1.8s ease-in infinite; }
  .gear { transform-origin: 100px 70px; animation: spin 12s linear infinite; }
  .glitch { animation: glitch 2.2s steps(1) infinite; }
  .card { transform-origin: 144px 98px; transform: rotate(-6deg); }

  @keyframes blink { 50% { opacity: 0; } }
  @keyframes twinkle { 50% { opacity: 0.2; } }
  @keyframes wave { from { opacity: 1; } to { opacity: 0; transform: translateX(6px); } }
  @keyframes bubble { to { transform: translateY(-36px); opacity: 0; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes glitch {
    0%, 80% { opacity: 0; }
    82% { opacity: 1; transform: translateX(-6px); }
    90% { opacity: 1; transform: translateX(8px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .blink, .twinkle, .wave, .bubble, .gear, .glitch { animation: none; }
  }
</style>
