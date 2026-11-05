<script lang="ts">
  import { normalize } from '$lib/game.svelte';

  let {
    answer,
    label = 'Introduce la clave',
    onsolve,
    taunts = {},
  }: {
    answer: string;
    label?: string;
    onsolve: () => void;
    /** Respuestas equivocadas con un mensaje propio (clave normalizada → mensaje) */
    taunts?: Record<string, string>;
  } = $props();

  let taunt = $state('');

  let value = $state('');
  let status = $state<'idle' | 'wrong' | 'ok'>('idle');

  function submit(e: SubmitEvent) {
    e.preventDefault();
    if (status === 'ok' || !value.trim()) return;
    // Las respuestas van codificadas para que no se lean de un vistazo en el código
    if (btoa(normalize(value)) === answer) {
      status = 'ok';
      setTimeout(onsolve, 900);
    } else {
      taunt = taunts[normalize(value)] ?? '';
      status = 'wrong';
      // Solo vuelve a reposo si nadie ha acertado mientras tanto
      setTimeout(() => {
        if (status === 'wrong') status = 'idle';
      }, taunt ? 2500 : 650);
    }
  }
</script>

<form class="lock" class:wrong={status === 'wrong'} class:ok={status === 'ok'} onsubmit={submit}>
  <label for="lock-input">{label}</label>
  <div class="row">
    <input
      id="lock-input"
      bind:value
      autocomplete="off"
      autocapitalize="characters"
      spellcheck="false"
      disabled={status === 'ok'}
    />
    <button type="submit" disabled={status === 'ok'}>Probar</button>
  </div>
  <p class="status" aria-live="polite">
    {status === 'wrong' ? taunt || 'Clave incorrecta' : status === 'ok' ? 'Desbloqueado' : ''}
  </p>
</form>

<style>
  .lock {
    display: grid;
    gap: 0.5rem;
    width: min(100%, 26rem);
  }
  label {
    font-size: 0.8em;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .row {
    display: flex;
    border: 1px solid var(--line);
    background: var(--surface);
    transition: border-color 0.2s;
  }
  .row:focus-within {
    border-color: var(--accent);
  }
  input {
    flex: 1;
    min-width: 0;
    padding: 0.8rem 1rem;
    border: 0;
    background: transparent;
    color: var(--fg);
    font: inherit;
    font-size: 1.1em;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    outline: none;
  }
  button {
    padding: 0 1.2rem;
    border: 0;
    background: var(--accent);
    color: var(--accent-ink);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-size: 0.85em;
  }
  .status {
    min-height: 1.4em;
    font-size: 0.85em;
    color: var(--muted);
  }
  .wrong .row {
    border-color: #ff5d5d;
    animation: shake 0.4s;
  }
  .wrong .status {
    color: #ff8a8a;
  }
  .ok .row {
    border-color: var(--accent);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 25%, transparent);
  }
  .ok .status {
    color: var(--accent);
  }
  @keyframes shake {
    25% { transform: translateX(-6px); }
    50% { transform: translateX(5px); }
    75% { transform: translateX(-3px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .wrong .row { animation: none; }
  }
</style>
