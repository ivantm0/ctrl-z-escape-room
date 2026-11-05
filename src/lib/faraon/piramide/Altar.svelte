<script lang="ts">
  import { faraon } from '../state.svelte';
  import { sfx } from '../audio';

  // Cada dios recibe una ofrenda; las reglas están en el papiro del campamento
  const OFFERINGS = ['Pan', 'Cerveza', 'Disco de oro', 'Cálamo', 'Natrón', 'Flor de loto'];
  const GODS = [
    { name: 'Ra', glyph: '𓇳', want: 2, color: '#e9b54a' },
    { name: 'Thot', glyph: '𓅞', want: 3, color: '#7fb2d9' },
    { name: 'Anubis', glyph: '𓃢', want: 4, color: '#c9c2b5' },
  ];

  const solved = $derived(faraon.isDone('ofrendas'));
  let choice = $state([0, 0, 0]);
  let message = $state('');
  let glowing = $state<boolean[]>([false, false, false]);

  function cycle(k: number, dir: number) {
    sfx('click');
    choice[k] = (choice[k] + dir + OFFERINGS.length) % OFFERINGS.length;
  }

  function present() {
    const ok = GODS.map((g, k) => choice[k] === g.want);
    glowing = ok;
    const n = ok.filter(Boolean).length;
    if (n === GODS.length) {
      sfx('ok');
      message = 'Los ojos de las tres estatuas se encienden. Un cajón de piedra se abre bajo el altar: dentro brilla un espejo de bronce.';
      faraon.complete('ofrendas');
      faraon.give('espejo');
    } else {
      sfx('no');
      message =
        n === 0
          ? 'Ninguna estatua reacciona. El viento se lleva las ofrendas.'
          : `${n === 1 ? 'Solo un dios parece' : 'Dos dioses parecen'} satisfecho${n === 1 ? '' : 's'}. El otro sigue esperando.`;
    }
  }
</script>

<div class="wrap">
  <p class="lead">
    Tres estatuas vigilan un altar de granito: Ra con su disco solar, Thot con cabeza de ibis y Anubis
    con cabeza de chacal. A sus pies, un cesto con ofrendas.
  </p>

  <div class="gods">
    {#each GODS as god, k}
      <div class="god" class:lit={solved || glowing[k]} style="--c: {god.color}">
        <span class="statue" aria-hidden="true">{god.glyph}</span>
        <p class="name">{god.name}</p>
        <div class="offer" role="group" aria-label="Ofrenda para {god.name}">
          <button onclick={() => cycle(k, -1)} disabled={solved} aria-label="{god.name}: ofrenda anterior">‹</button>
          <span class="item" role="status" aria-label="Ofrenda para {god.name}: {solved ? OFFERINGS[god.want] : OFFERINGS[choice[k]]}">
            {solved ? OFFERINGS[god.want] : OFFERINGS[choice[k]]}
          </span>
          <button onclick={() => cycle(k, 1)} disabled={solved} aria-label="{god.name}: ofrenda siguiente">›</button>
        </div>
      </div>
    {/each}
  </div>

  <p class="msg" aria-live="polite">{solved && !message ? 'Las ofrendas ya fueron aceptadas.' : message}</p>

  {#if !solved}
    <button class="present" onclick={present}>Presentar las ofrendas</button>
  {/if}
</div>

<style>
  .wrap {
    display: grid;
    gap: 1.2rem;
    justify-items: center;
  }
  .lead {
    max-width: 38rem;
    font-size: 1.1rem;
    font-style: italic;
    line-height: 1.6;
  }
  .gods {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: clamp(0.5rem, 2vw, 1.2rem);
    width: 100%;
  }
  .god {
    display: grid;
    justify-items: center;
    gap: 0.5rem;
    padding: 1rem 0.5rem;
    border-radius: 0.6rem;
    background: linear-gradient(#4a3a2a, #2e2318);
  }
  .statue {
    font-family: var(--font-glyph);
    font-size: clamp(2.6rem, 9vw, 4rem);
    color: #8c7c66;
    transition: color 0.5s, filter 0.5s;
  }
  .lit .statue {
    color: var(--c);
    filter: drop-shadow(0 0 14px var(--c));
  }
  .name {
    font-family: var(--font-display);
    font-weight: 700;
  }
  .offer {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    width: 100%;
  }
  .offer button {
    width: 2rem;
    height: 2.4rem;
    border: 0;
    background: none;
    color: var(--accent);
    font-size: 1.4rem;
  }
  .offer button:disabled {
    opacity: 0.3;
  }
  .item {
    flex: 1;
    padding: 0.4rem 0.2rem;
    border: 1px solid var(--line);
    border-radius: 0.4rem;
    font-size: clamp(0.75rem, 2.2vw, 0.95rem);
    text-align: center;
  }
  .msg {
    min-height: 1.6em;
    max-width: 36rem;
    text-align: center;
    color: var(--muted);
  }
  .present {
    padding: 0.75rem 1.4rem;
    border: 1px solid var(--accent);
    border-radius: 999px;
    background: var(--accent);
    color: var(--accent-ink);
    font-family: var(--font-display);
    font-weight: 700;
  }
</style>
