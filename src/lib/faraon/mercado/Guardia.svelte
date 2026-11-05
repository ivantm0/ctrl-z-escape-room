<script lang="ts">
  import { faraon, type ItemId } from '../state.svelte';
  import { sfx } from '../audio';
  import ItemPicker from '../ItemPicker.svelte';

  let message = $state('');

  function pick(id: ItemId) {
    if (id === 'sello') {
      sfx('stone');
      faraon.use('sello');
      faraon.complete('puerta');
    } else {
      sfx('no');
      message = id === 'llave' ? '«¿Una llave? Esto es una puerta de la necrópolis, no la despensa de tu madre.»' : '«No me interesan tus cacharros.»';
    }
  }
</script>

<div class="wrap">
  <p class="speech">
    «Alto. Detrás de esta puerta empieza la necrópolis del faraón. Nadie la cruza sin el
    <strong>sello de Anubis</strong> del escriba real.»
  </p>
  <p class="msg" aria-live="polite">{message}</p>
  <ItemPicker label="Entregar un objeto al guardia" onpick={pick} />
</div>

<style>
  .wrap {
    display: grid;
    gap: 1rem;
  }
  .speech {
    font-size: 1.15rem;
    font-style: italic;
    line-height: 1.5;
  }
  strong {
    color: var(--accent);
    font-weight: 500;
  }
  .msg {
    min-height: 1.4em;
    color: var(--muted);
  }
</style>
