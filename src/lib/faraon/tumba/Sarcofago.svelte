<script lang="ts">
  import { faraon, type ItemId } from '../state.svelte';
  import { sfx } from '../audio';
  import ItemPicker from '../ItemPicker.svelte';

  // Requiere los canopos en su sitio y el escarabajo del corazón en el pecho
  const unlocked = $derived(faraon.isDone('canopos'));
  const placed = $derived(faraon.s.used.includes('corazon'));
  const solved = $derived(faraon.isDone('sarcofago'));
  let message = $state('');
  let taking = $state(false);

  function pick(id: ItemId) {
    if (id !== 'corazon') {
      sfx('no');
      message = 'No encaja en el hueco del pecho.';
      return;
    }
    if (!unlocked) {
      sfx('no');
      message = 'El escarabajo encaja, pero la tapa sigue bloqueada. Algo en la cámara no está en orden.';
      return;
    }
    sfx('stone');
    faraon.use('corazon');
    message = '';
  }

  function take() {
    sfx('ok');
    taking = true;
    faraon.give('mapa');
    setTimeout(() => faraon.complete('sarcofago'), 1200);
  }
</script>

<div class="wrap">
  <p class="lead">
    {#if placed}
      La tapa de granito se desliza con un gemido de piedra. Dentro, envuelto en lino sobre la momia
      del faraón, un rollo de papiro sellado con cera azul.
    {:else}
      Un sarcófago de granito negro. En el pecho de la figura tallada del faraón hay un hueco con
      forma de escarabajo{unlocked ? '. Se oyó un cerrojo hace un momento…' : ', y en las esquinas, cuatro cerrojos de bronce.'}
    {/if}
  </p>

  <div class="sarc" class:open={placed} aria-hidden="true">
    <div class="lid"><span class="slot">{placed ? '𓆣' : ''}</span></div>
    <div class="inside">{#if placed && !taking}<span class="map"><span class="seal"></span></span>{/if}</div>
  </div>

  <p class="msg" aria-live="polite">{taking ? 'Al levantar el mapa, el suelo tiembla. Arena fina empieza a caer del techo…' : message}</p>

  {#if !placed}
    <ItemPicker label="Colocar un objeto en el hueco" onpick={pick} />
  {:else if !solved && !taking}
    <button class="take" onclick={take}>Coger el mapa</button>
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
  .sarc {
    position: relative;
    overflow: hidden;
    border-radius: 2rem 2rem 0.8rem 0.8rem;
    width: min(100%, 26rem);
    height: 9rem;
  }
  .inside,
  .lid {
    position: absolute;
    inset: 0;
    border-radius: 2rem 2rem 0.8rem 0.8rem;
  }
  .inside {
    display: grid;
    place-items: center;
    background: #1a1410;
    box-shadow: inset 0 0 30px #000;
  }
  .lid {
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #4a4a4a, #2a2a2a);
    border: 2px solid #c99a4a;
    transition: transform 1.4s cubic-bezier(0.5, 0, 0.3, 1);
  }
  .open .lid {
    transform: translate(62%, 6%) rotate(6deg);
  }
  .slot {
    display: grid;
    place-items: center;
    width: 3.4rem;
    height: 2.6rem;
    border-radius: 50%;
    background: #141414;
    color: #3fa86a;
    font-family: var(--font-glyph);
    font-size: 1.8rem;
  }
  /* Rollo de papiro sellado con cera azul */
  .map {
    position: relative;
    display: grid;
    place-items: center;
    width: 7rem;
    height: 2.2rem;
    border-radius: 1.1rem;
    background: linear-gradient(#f1dcaa, #c9a66a 60%, #a8844a);
    box-shadow: 0 0 24px rgb(233 181 74 / 0.6);
    transform: translateX(-30%);
  }
  .seal {
    width: 1.2rem;
    height: 1.2rem;
    border-radius: 50%;
    background: #2a4fa8;
  }
  .msg {
    min-height: 1.6em;
    max-width: 36rem;
    text-align: center;
    color: var(--muted);
  }
  .take {
    padding: 0.75rem 1.4rem;
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
