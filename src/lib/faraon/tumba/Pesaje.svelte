<script lang="ts">
  import { faraon, type ItemId } from '../state.svelte';
  import { sfx } from '../audio';
  import ItemPicker from '../ItemPicker.svelte';

  // El corazón se pesa contra la Pluma de Maat
  const solved = $derived(faraon.isDone('pesaje'));
  let message = $state('');

  function pick(id: ItemId) {
    if (id === 'pluma') {
      sfx('ok');
      faraon.use('pluma');
      faraon.complete('pesaje');
      faraon.give('corazon');
      message = 'La balanza se equilibra: el corazón es tan ligero como la verdad. La estatua abre la mano y deja caer un escarabajo de piedra verde.';
    } else if (id === 'antorcha') {
      sfx('no');
      message = 'Acercas la llama. El corazón ni se inmuta: no es eso lo que se pesa aquí.';
    } else {
      sfx('no');
      message = 'La balanza no reacciona.';
    }
  }
</script>

<div class="wrap">
  <p class="lead">
    Una estatua de Anubis, negra como la noche, sostiene una balanza dorada. En un plato hay un
    corazón de cerámica roja. El otro plato está vacío… y la balanza, caída hacia el corazón.
  </p>

  <svg viewBox="0 0 300 180" role="img" aria-label="Balanza de Anubis {solved ? 'equilibrada' : 'inclinada hacia el corazón'}">
    <path d="M150 30 V170 M110 170 H190" stroke="#c99a4a" stroke-width="5" />
    <g class="beam" style="transform: rotate({solved ? 0 : -12}deg); transform-origin: 150px 40px">
      <path d="M50 40 H250" stroke="#c99a4a" stroke-width="5" />
      <g style="transform: rotate({solved ? 0 : 12}deg); transform-origin: 60px 40px">
        <path d="M60 40 L40 100 M60 40 L80 100" stroke="#c99a4a" stroke-width="2" />
        <path d="M30 100 h60 q-6 12 -30 12 q-24 0 -30 -12z" fill="#c99a4a" />
        <path d="M60 98 c-14 -10 -14 -22 -4 -22 c4 0 4 4 4 4 c0 0 0 -4 4 -4 c10 0 10 12 -4 22z" fill="#b8352a" />
      </g>
      <g style="transform: rotate({solved ? 0 : 12}deg); transform-origin: 240px 40px">
        <path d="M240 40 L220 100 M240 40 L260 100" stroke="#c99a4a" stroke-width="2" />
        <path d="M210 100 h60 q-6 12 -30 12 q-24 0 -30 -12z" fill="#c99a4a" />
        {#if solved}<text x="240" y="98" text-anchor="middle" font-family="Noto Sans Egyptian Hieroglyphs" font-size="30" fill="#f6e7c9">𓆄</text>{/if}
      </g>
    </g>
  </svg>

  <p class="msg" aria-live="polite">{message || (solved ? 'El corazón y la pluma pesan lo mismo.' : '')}</p>

  {#if !solved}
    <ItemPicker label="Poner un objeto en el plato vacío" onpick={pick} />
  {/if}
</div>

<style>
  .wrap {
    display: grid;
    gap: 1rem;
    justify-items: center;
  }
  .lead {
    max-width: 38rem;
    font-size: 1.1rem;
    font-style: italic;
    line-height: 1.6;
  }
  svg {
    width: min(100%, 24rem);
  }
  .beam,
  .beam g {
    transition: transform 1s cubic-bezier(0.3, 1.4, 0.5, 1);
  }
  .msg {
    min-height: 1.6em;
    max-width: 36rem;
    text-align: center;
    color: var(--muted);
  }
  .wrap :global(.picker) {
    width: 100%;
  }
</style>
