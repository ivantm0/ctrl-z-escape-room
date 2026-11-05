<script lang="ts">
  import { faraon, type ItemId } from '../state.svelte';
  import { sfx } from '../audio';
  import ItemPicker from '../ItemPicker.svelte';

  // El espejo refleja el sol hacia la cara de la pirámide.
  // Geometría en el SVG (600 × 340): sol arriba a la izquierda, espejo abajo, pirámide a la derecha.
  const SUN = { x: 70, y: 40 };
  const MIRROR = { x: 190, y: 290 };
  const FACE_X = 470;
  const SYMBOLS = [
    { id: 'ojo', name: 'el ojo', glyph: '𓂀', y: 120 },
    { id: 'ankh', name: 'el ankh', glyph: '𓋹', y: 180 },
    { id: 'escarabajo', name: 'el escarabajo', glyph: '𓆣', y: 240 },
  ];

  const mounted = $derived(faraon.s.used.includes('espejo'));
  const solved = $derived(faraon.isDone('espejo'));
  let angle = $state(50);
  let message = $state('');

  // Rayo reflejado: r = d − 2(d·n)n, con n la normal del espejo
  const beam = $derived.by(() => {
    const a = ((solved ? 62 : angle) * Math.PI) / 180;
    const n = { x: Math.cos(a), y: -Math.sin(a) };
    const len = Math.hypot(MIRROR.x - SUN.x, MIRROR.y - SUN.y);
    const d = { x: (MIRROR.x - SUN.x) / len, y: (MIRROR.y - SUN.y) / len };
    const dot = d.x * n.x + d.y * n.y;
    const r = { x: d.x - 2 * dot * n.x, y: d.y - 2 * dot * n.y };
    if (r.x <= 0.05) return { x: MIRROR.x + r.x * 200, y: MIRROR.y + r.y * 200, hit: null };
    const t = (FACE_X - MIRROR.x) / r.x;
    const y = MIRROR.y + t * r.y;
    const hit = SYMBOLS.find((s) => Math.abs(s.y - y) < 16) ?? null;
    return { x: FACE_X, y, hit };
  });
  const surface = $derived.by(() => {
    const a = ((solved ? 62 : angle) * Math.PI) / 180;
    const t = { x: Math.sin(a) * 34, y: Math.cos(a) * 34 };
    return { x1: MIRROR.x - t.x, y1: MIRROR.y - t.y, x2: MIRROR.x + t.x, y2: MIRROR.y + t.y };
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => {
    if (!mounted || solved) return;
    clearTimeout(timer);
    const hit = beam.hit;
    if (hit?.id === 'escarabajo') {
      message = 'La luz se posa sobre el escarabajo… y la piedra empieza a vibrar.';
      timer = setTimeout(() => {
        sfx('stone');
        faraon.complete('espejo');
      }, 1200);
    } else if (hit) {
      message = `La luz ilumina ${hit.name}. No ocurre nada.`;
    } else {
      message = '';
    }
    return () => clearTimeout(timer);
  });

  function pick(id: ItemId) {
    if (id === 'espejo') {
      sfx('stone');
      faraon.use('espejo');
    } else {
      sfx('no');
      message = 'Eso no encaja en el soporte del poste.';
    }
  }
</script>

<div class="wrap">
  <p class="lead">
    {#if solved}
      El rayo de sol sigue clavado en el escarabajo. En la cara de la pirámide se ha marcado el contorno
      de una piedra.
    {:else if mounted}
      El espejo gira sobre su eje. El sol de la tarde rebota en él como un segundo sol.
    {:else}
      Un poste de bronce clavado en la arena, frente a la pirámide. En lo alto, un soporte redondo vacío.
    {/if}
  </p>

  <svg viewBox="0 0 600 340" role="img" aria-label="Rayo de sol reflejado por el espejo hacia la pirámide{beam.hit && mounted ? `: ilumina ${beam.hit.name}` : ''}">
    <defs>
      <linearGradient id="e-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a2a3a" /><stop offset="1" stop-color="#f0a35a" /></linearGradient>
    </defs>
    <rect width="600" height="340" fill="url(#e-sky)" />
    <circle cx={SUN.x} cy={SUN.y} r="26" fill="#ffe2a0" />
    <path d="M330 340 L470 60 L610 340Z" fill="#c27a3e" />
    <path d="M470 60 L610 340 H500Z" fill="#8d4f25" />
    {#each SYMBOLS as s}
      <text x={FACE_X} y={s.y + 10} text-anchor="middle" font-family="Noto Sans Egyptian Hieroglyphs" font-size="28" fill={mounted && beam.hit?.id === s.id ? '#fff4c8' : '#5a2c10'} class:lit={mounted && beam.hit?.id === s.id}>{s.glyph}</text>
    {/each}
    {#if solved}
      <rect x={FACE_X - 26} y="214" width="52" height="56" fill="none" stroke="#fff4c8" stroke-width="2" stroke-dasharray="5 4" />
    {/if}
    <rect y="310" width="600" height="30" fill="#d99c58" />
    <path d="M{MIRROR.x} 340 V{MIRROR.y}" stroke="#7a5a2a" stroke-width="6" />
    {#if mounted}
      <line x1={SUN.x} y1={SUN.y} x2={MIRROR.x} y2={MIRROR.y} stroke="#fff1c2" stroke-width="3" opacity="0.5" />
      <line x1={MIRROR.x} y1={MIRROR.y} x2={beam.x} y2={beam.y} stroke="#fff1c2" stroke-width="4" class="ray" />
      <line {...surface} stroke="#e9b54a" stroke-width="7" stroke-linecap="round" />
    {:else}
      <circle cx={MIRROR.x} cy={MIRROR.y} r="14" fill="none" stroke="#7a5a2a" stroke-width="4" />
    {/if}
  </svg>

  {#if mounted && !solved}
    <label class="control">
      <span>Inclinación del espejo: {angle}°</span>
      <input type="range" min="40" max="85" step="0.5" bind:value={angle} />
    </label>
    <div class="nudge">
      <button onclick={() => (angle = Math.max(40, angle - 0.5))} aria-label="Inclinar menos">−</button>
      <button onclick={() => (angle = Math.min(85, angle + 0.5))} aria-label="Inclinar más">+</button>
    </div>
  {/if}

  <p class="msg" aria-live="polite">{message}</p>

  {#if !mounted}
    <ItemPicker label="Colocar un objeto en el soporte" onpick={pick} />
  {/if}
</div>

<style>
  .wrap {
    display: grid;
    gap: 1rem;
  }
  .lead {
    font-size: 1.1rem;
    font-style: italic;
    line-height: 1.6;
  }
  svg {
    width: 100%;
    border-radius: 0.5rem;
  }
  .ray {
    filter: drop-shadow(0 0 6px #ffd98a);
  }
  .lit {
    filter: drop-shadow(0 0 10px #ffe9a8);
  }
  .control {
    display: grid;
    gap: 0.4rem;
  }
  input[type='range'] {
    width: 100%;
    accent-color: var(--accent);
  }
  .nudge {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }
  .nudge button {
    width: 3rem;
    height: 2.4rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: none;
    font-size: 1.2rem;
  }
  .msg {
    min-height: 1.6em;
    color: var(--muted);
  }
</style>
