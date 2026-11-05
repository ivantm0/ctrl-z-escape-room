<script lang="ts">
  import { faraon, type ItemId } from '../state.svelte';
  import { sfx } from '../audio';
  import ItemPicker from '../ItemPicker.svelte';

  // Cofre del escriba: primero la llave, después tres ruedas con animales
  const ANIMALS = [
    { g: '𓅃', name: 'halcón' },
    { g: '𓆣', name: 'escarabajo' },
    { g: '𓃠', name: 'gato' },
    { g: '𓅞', name: 'ibis' },
    { g: '𓆙', name: 'cobra' },
    { g: '𓆊', name: 'cocodrilo' },
  ];
  const CODE = [0, 1, 2];

  const solved = $derived(faraon.isDone('cofre'));
  const unlocked = $derived(faraon.s.used.includes('llave'));
  let dials = $state([3, 4, 5]);
  let message = $state('');
  let opening = $state(false);

  function pick(id: ItemId) {
    if (id === 'llave') {
      sfx('stone');
      faraon.use('llave');
      message = 'La llave gira con un chasquido. Ahora solo faltan las tres ruedas.';
    } else {
      sfx('no');
      message = id === 'ostracon' ? 'El ostracón no entra en la cerradura… aunque sus dibujos se parecen a los de las ruedas.' : 'Eso no sirve aquí.';
    }
  }

  function spin(k: number, dir: number) {
    sfx('click');
    dials[k] = (dials[k] + dir + ANIMALS.length) % ANIMALS.length;
  }

  function tryOpen() {
    if (dials.every((d, k) => d === CODE[k])) {
      sfx('ok');
      opening = true;
      message = 'Las ruedas encajan. La tapa se levanta y dentro brilla el Sello de Anubis.';
      setTimeout(() => {
        faraon.complete('cofre');
        faraon.give('sello');
      }, 1000);
    } else {
      sfx('no');
      message = 'La tapa no cede. El escriba, sin levantar la vista: «Se lee hacia donde miran».';
    }
  }
</script>

<div class="wrap">
  <p class="speech">
    {#if solved}
      El escriba ni se inmuta. «Si has sabido abrirlo, el sello es tuyo. Anubis guía a los listos.»
    {:else}
      El escriba real copia papiros sin descanso. A sus pies, un cofre de cedro con una cerradura de
      bronce y tres ruedas talladas.
    {/if}
  </p>

  <div class="chest" class:open={solved || opening}>
    <div class="lid" aria-hidden="true"></div>
    <div class="front">
      <span class="lock" class:unlocked aria-label={unlocked ? 'Cerradura abierta' : 'Cerradura cerrada'} role="img">{unlocked ? '🔓' : '🔒'}</span>
      <div class="dials" role="group" aria-label="Ruedas de la combinación">
        {#each dials as d, k}
          <div class="dial">
            <button onclick={() => spin(k, -1)} disabled={!unlocked || solved || opening} aria-label="Rueda {k + 1}: anterior">▲</button>
            <span class="g" aria-label="Rueda {k + 1}: {ANIMALS[d].name}" role="img">{ANIMALS[d].g}</span>
            <button onclick={() => spin(k, 1)} disabled={!unlocked || solved || opening} aria-label="Rueda {k + 1}: siguiente">▼</button>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <p class="msg" aria-live="polite">{message}</p>

  {#if !unlocked}
    <ItemPicker label="Usar un objeto en la cerradura" onpick={pick} />
  {:else if !solved && !opening}
    <button class="try" onclick={tryOpen}>Levantar la tapa</button>
  {/if}
</div>

<style>
  .wrap {
    display: grid;
    gap: 1.2rem;
    justify-items: center;
  }
  .speech {
    max-width: 36rem;
    font-size: 1.1rem;
    font-style: italic;
    line-height: 1.5;
  }
  .chest {
    width: min(100%, 26rem);
    perspective: 700px;
  }
  .lid {
    height: 3rem;
    border-radius: 1.4rem 1.4rem 0 0;
    background: linear-gradient(#8a5a2e, #6b4220);
    transform-origin: bottom;
    transition: transform 0.9s cubic-bezier(0.3, 1.3, 0.5, 1);
  }
  .open .lid {
    transform: rotateX(70deg);
    box-shadow: 0 -10px 40px #e9b54a;
  }
  .front {
    display: grid;
    justify-items: center;
    gap: 0.8rem;
    padding: 1rem;
    border-top: 4px solid #c99a4a;
    border-radius: 0 0 0.6rem 0.6rem;
    background: linear-gradient(#6b4220, #4a2c14);
  }
  .lock {
    font-size: 1.6rem;
  }
  .dials {
    display: flex;
    gap: 0.8rem;
  }
  .dial {
    display: grid;
    justify-items: center;
    gap: 0.2rem;
    padding: 0.3rem;
    border-radius: 0.5rem;
    background: #2a1408;
  }
  .dial button {
    width: 2.6rem;
    height: 1.8rem;
    border: 0;
    background: none;
    color: var(--accent);
  }
  .dial button:disabled {
    opacity: 0.3;
  }
  .g {
    display: grid;
    place-items: center;
    width: 3.6rem;
    height: 3.6rem;
    border: 2px solid #c99a4a;
    border-radius: 50%;
    background: #e9cf9a;
    color: #3a1a08;
    font-family: var(--font-glyph);
    font-size: 2rem;
  }
  .msg {
    min-height: 1.6em;
    max-width: 34rem;
    text-align: center;
    color: var(--muted);
  }
  .try {
    padding: 0.7rem 1.4rem;
    border: 1px solid var(--accent);
    border-radius: 999px;
    background: var(--accent);
    color: var(--accent-ink);
    font-family: var(--font-display);
    font-weight: 700;
  }
  .wrap :global(.picker) {
    width: 100%;
  }
</style>
