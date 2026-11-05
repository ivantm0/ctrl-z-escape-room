<script lang="ts">
  import { faraon, type ItemId } from '../state.svelte';
  import { sfx } from '../audio';
  import ItemPicker from '../ItemPicker.svelte';

  // Losa enterrada: se barre la arena con el cepillo (arrastrando o con el botón)
  const W = 560;
  const H = 260;
  const solved = $derived(faraon.isDone('losa'));
  const brushing = $derived(faraon.s.used.includes('cepillo'));

  let canvas = $state<HTMLCanvasElement>();
  let ctx: CanvasRenderingContext2D | null = null;
  let cleared = $state(0);
  let message = $state('');
  let strokes = 0;

  // Capa de arena con granos, dibujada una vez
  $effect(() => {
    if (!canvas || solved) return;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#d9a35e';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#c48a48' : '#ebbe7e';
      ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    }
  });

  function sweep(x: number, y: number, r = 30) {
    if (!ctx) return;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    if (++strokes % 8 === 0) measure();
  }

  // Proporción de arena retirada, muestreando la capa
  function measure() {
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, W, H).data;
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 4 * 37) {
      total++;
      if (data[i] < 40) clear++;
    }
    cleared = clear / total;
    if (cleared > 0.6 && !solved) {
      sfx('stone');
      faraon.complete('losa');
    }
  }

  let down = false;
  const point = (e: PointerEvent) => {
    const r = canvas!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  };

  // Alternativa sin arrastrar: cada pulsación barre una franja
  let band = 0;
  function sweepButton() {
    sfx('click');
    const y = (band % 5) * (H / 5) + H / 10;
    for (let x = 0; x <= W; x += 24) sweep(x, y, 34);
    band++;
    measure();
  }

  function pick(id: ItemId) {
    if (id === 'cepillo') {
      sfx('click');
      faraon.use('cepillo');
    } else {
      sfx('no');
      message = 'Con eso solo conseguirías llenarlo todo de arena.';
    }
  }
</script>

<div class="wrap">
  <p class="lead">
    {#if solved}
      La losa queda limpia. Sus jeroglíficos, gastados por el viento, aún se leen:
    {:else}
      Una esquina de piedra tallada asoma bajo la arena, justo delante de la pirámide.
    {/if}
  </p>

  <div class="slab" style="aspect-ratio: {W} / {H}">
    <div class="carving">
      <p class="g" aria-hidden="true">𓇳 → 𓋴 → 𓆣</p>
      <p class="text">«Cuando el sol de la tarde, devuelto por el bronce, toque al <strong>escarabajo</strong>, la piedra cederá.»</p>
    </div>
    {#if !solved}
      <canvas
        bind:this={canvas}
        width={W}
        height={H}
        class:active={brushing}
        aria-label="Arena sobre la losa"
        onpointerdown={(e) => {
          if (!brushing) return;
          down = true;
          canvas!.setPointerCapture(e.pointerId);
          sweep(...(point(e) as [number, number]));
        }}
        onpointermove={(e) => down && sweep(...(point(e) as [number, number]))}
        onpointerup={() => {
          down = false;
          measure();
        }}
      ></canvas>
    {/if}
  </div>

  {#if !solved}
    {#if brushing}
      <div class="row">
        <p class="progress" aria-live="polite">Arena retirada: {Math.round(cleared * 100)}%</p>
        <button class="sweep" onclick={sweepButton}>Barrer</button>
      </div>
      <p class="tip">Arrastra sobre la arena para barrerla.</p>
    {:else}
      <p class="msg" aria-live="polite">{message || 'Con las manos solo apartas un puñado. Necesitas algo para barrer.'}</p>
      <ItemPicker label="Usar un objeto en la arena" onpick={pick} />
    {/if}
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
  .slab {
    position: relative;
    width: min(100%, 35rem);
    margin: 0 auto;
    overflow: hidden;
    border-radius: 0.4rem;
    background: linear-gradient(#9b9080, #7a705f);
    box-shadow: inset 0 0 30px rgb(0 0 0 / 0.4);
  }
  .carving {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    gap: 0.6rem;
    padding: 1.2rem;
    color: #2a1d0c;
    text-align: center;
  }
  .carving .g {
    font-family: var(--font-glyph);
    font-size: clamp(1.6rem, 5vw, 2.4rem);
  }
  .text {
    font-size: clamp(0.95rem, 2.4vw, 1.15rem);
    line-height: 1.4;
  }
  strong {
    color: #5a1a08;
  }
  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    touch-action: none;
  }
  canvas.active {
    cursor: grab;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .progress,
  .tip,
  .msg {
    color: var(--muted);
  }
  .tip {
    font-size: 0.9rem;
    font-style: italic;
  }
  .sweep {
    padding: 0.6rem 1.2rem;
    border: 1px solid var(--accent);
    border-radius: 999px;
    background: none;
    color: var(--accent);
  }
</style>
