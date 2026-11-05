<script lang="ts">
  import { CHEST_CODE } from './maps';
  import { sfx } from './audio';

  // Candado de 4 ruedas del baúl del anciano
  let { onopen, onclose }: { onopen: () => void; onclose: () => void } = $props();

  let digits = $state([0, 0, 0, 0]);
  let wrong = $state(false);
  let dialog: HTMLDialogElement;

  $effect(() => {
    dialog.showModal();
    return () => dialog.close();
  });

  function spin(i: number, d: number) {
    sfx('step');
    digits[i] = (digits[i] + d + 10) % 10;
    wrong = false;
  }

  function tryOpen() {
    if (digits.join('') === CHEST_CODE) {
      sfx('ok');
      onopen();
    } else {
      sfx('no');
      wrong = true;
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog bind:this={dialog} aria-label="Candado del baúl" onclose={onclose} onclick={(e) => e.target === dialog && onclose()}>
  <div class="box" class:wrong>
    <p class="title">BAÚL DEL ANCIANO</p>
    <div class="wheels">
      {#each digits as d, i}
        <div class="wheel">
          <button onclick={() => spin(i, 1)} aria-label="Rueda {i + 1}: subir">▲</button>
          <span aria-label="Rueda {i + 1}: {d}" role="img">{d}</span>
          <button onclick={() => spin(i, -1)} aria-label="Rueda {i + 1}: bajar">▼</button>
        </div>
      {/each}
    </div>
    <p class="msg" aria-live="polite">{wrong ? 'NO SE ABRE.' : ''}</p>
    <div class="actions">
      <button class="open" onclick={tryOpen}>ABRIR</button>
      <button onclick={onclose}>SALIR</button>
    </div>
  </div>
</dialog>

<style>
  dialog {
    padding: 0;
    border: 0;
    background: transparent;
  }
  dialog::backdrop {
    background: rgb(29 43 26 / 0.75);
  }
  .box {
    display: grid;
    justify-items: center;
    gap: 1rem;
    padding: 1.4rem 1.6rem;
    border: 4px solid #1d2b1a;
    background: #c7d39c;
    color: #1d2b1a;
    font-family: 'Press Start 2P', monospace;
    box-shadow: 0 0 0 4px #8fa36a, 0 0 0 8px #1d2b1a;
  }
  .wrong {
    animation: shake 0.3s;
  }
  .title {
    font-size: 0.75rem;
  }
  .wheels {
    display: flex;
    gap: 0.6rem;
  }
  .wheel {
    display: grid;
    justify-items: center;
    gap: 0.3rem;
  }
  .wheel span {
    display: grid;
    place-items: center;
    width: 2.6rem;
    height: 2.6rem;
    border: 4px solid #1d2b1a;
    background: #8fa36a;
    font-size: 1.1rem;
  }
  button {
    border: 0;
    background: none;
    color: #1d2b1a;
    font-family: inherit;
    font-size: 0.75rem;
    padding: 0.3rem 0.5rem;
  }
  button:hover,
  button:focus-visible {
    background: #4f6a3d;
    color: #c7d39c;
    outline: none;
  }
  .msg {
    min-height: 1em;
    font-size: 0.7rem;
  }
  .actions {
    display: flex;
    gap: 1rem;
  }
  .open {
    border: 4px solid #1d2b1a;
  }
  @keyframes shake {
    25% {
      transform: translateX(-6px);
    }
    75% {
      transform: translateX(6px);
    }
  }
</style>
