<script lang="ts">
  import { faraon } from '../state.svelte';
  import { sfx } from '../audio';

  // Coger la antorcha y encenderla a golpes de pedernal
  const HITS = 3;
  const taken = $derived(faraon.s.items.includes('antorcha'));
  const lit = $derived(faraon.isDone('antorcha'));
  let hits = $state(0);
  let spark = $state(0);

  function take() {
    sfx('click');
    faraon.give('antorcha');
  }

  function strike() {
    sfx('stone');
    hits += 1;
    spark += 1;
    if (hits >= HITS) {
      setTimeout(() => {
        sfx('ok');
        faraon.complete('antorcha');
      }, 300);
    }
  }
</script>

<div class="wrap">
  <p class="lead">
    {#if lit}
      La antorcha arde con una llama alta y anaranjada. Por fin puedes ver la cámara.
    {:else if taken}
      Tienes la antorcha en la mano. En el suelo, junto al soporte, hay un pedernal y un trozo de
      hierro.
    {:else}
      Junto a la entrada, un soporte de bronce sujeta una antorcha apagada, envuelta en lino y resina.
    {/if}
  </p>

  <div class="torch" class:lit aria-hidden="true">
    {#if lit}
      <span class="flame"></span>
    {/if}
    {#key spark}
      {#if spark && !lit}<span class="spark"></span>{/if}
    {/key}
    <span class="head"></span>
    <span class="stick"></span>
  </div>

  {#if !taken}
    <button class="act" onclick={take}>Coger la antorcha</button>
  {:else if !lit}
    <p class="hits" aria-live="polite">{hits ? `Saltan chispas… (${hits}/${HITS})` : 'La resina necesita una buena chispa.'}</p>
    <button class="act" onclick={strike}>Golpear el pedernal</button>
  {/if}
</div>

<style>
  .wrap {
    display: grid;
    gap: 1.2rem;
    justify-items: center;
  }
  .lead {
    max-width: 36rem;
    font-size: 1.1rem;
    font-style: italic;
    line-height: 1.6;
  }
  .torch {
    position: relative;
    display: grid;
    justify-items: center;
    width: 8rem;
    height: 14rem;
    padding-top: 4rem;
  }
  .stick {
    width: 1rem;
    height: 8rem;
    border-radius: 0.3rem;
    background: linear-gradient(90deg, #6b4220, #8a5a2e);
  }
  .head {
    width: 2.2rem;
    height: 2.4rem;
    border-radius: 40%;
    background: #3a2410;
  }
  .flame {
    position: absolute;
    top: 0;
    width: 3.4rem;
    height: 5rem;
    border-radius: 50% 50% 45% 45% / 65% 65% 35% 35%;
    background: radial-gradient(circle at 50% 70%, #fff3c4, #ffb347 45%, #e2552a 80%, transparent);
    filter: drop-shadow(0 0 30px #ff9a3d);
    animation: flicker 0.18s ease-in-out infinite alternate;
  }
  .spark {
    position: absolute;
    top: 3rem;
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background: radial-gradient(circle, #fff3c4, transparent 60%);
    animation: spark 0.35s ease-out forwards;
  }
  .hits {
    color: var(--muted);
  }
  .act {
    padding: 0.75rem 1.4rem;
    border: 1px solid var(--accent);
    border-radius: 999px;
    background: var(--accent);
    color: var(--accent-ink);
    font-family: var(--font-display);
    font-weight: 700;
  }
  @keyframes flicker {
    to {
      transform: scale(1.05, 0.95) skewX(3deg);
    }
  }
  @keyframes spark {
    to {
      opacity: 0;
      transform: scale(1.6);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .flame,
    .spark {
      animation: none;
    }
  }
</style>
