<!-- Estela informativa: enseña los números y el sentido de lectura de los jeroglíficos -->
<div class="stela">
  <p class="carved">𓋹 𓂀 𓋹</p>
  <h3>Enseñanzas del escriba Amenemope</h3>

  <section>
    <h4>Para contar</h4>
    <dl>
      <div><dt>𓏺</dt><dd>uno</dd></div>
      <div><dt>𓎆</dt><dd>diez</dd></div>
      <div><dt>𓍢</dt><dd>cien</dd></div>
    </dl>
    <p class="example">Así, <span class="g">𓎆𓎆𓏺𓏺</span> son veintidós.</p>
  </section>

  <section>
    <h4>Para leer</h4>
    <p>
      «Los signos se leen <strong>hacia donde miran</strong> los animales. Si el halcón mira a la
      izquierda, empieza por la izquierda. Si mira a la derecha, empieza por la derecha.»
    </p>
    <p class="example">
      <span class="g">𓅃</span> mira a la izquierda → se lee así →
    </p>
  </section>
</div>

<style>
  .stela {
    display: grid;
    gap: 1.4rem;
    padding: clamp(1.2rem, 3vw, 2rem);
    border-radius: 50% 50% 0.6rem 0.6rem / 12% 12% 0.6rem 0.6rem;
    background:
      repeating-linear-gradient(170deg, rgb(255 255 255 / 0.04) 0 3px, transparent 3px 9px),
      linear-gradient(#8f8574, #6e6455);
    color: #1d150c;
    text-align: center;
    box-shadow: inset 0 0 40px rgb(0 0 0 / 0.35);
  }
  .carved,
  dt,
  .g {
    font-family: var(--font-glyph);
  }
  .carved {
    font-size: 2rem;
    color: #3a2a14;
  }
  h3 {
    font-family: var(--font-display);
    font-size: 1.3rem;
  }
  h4 {
    margin: 0 0 0.6rem;
    font-family: var(--font-display);
    font-size: 0.9rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #3a2a14;
  }
  dl {
    display: flex;
    justify-content: center;
    gap: clamp(1rem, 5vw, 3rem);
    margin: 0;
  }
  dt {
    font-size: 4.5rem;
    line-height: 1.2;
  }
  dd {
    margin: 0;
    font-style: italic;
  }
  section p {
    max-width: 32rem;
    margin: 0 auto;
    line-height: 1.5;
  }
  .example {
    margin-top: 0.6rem !important;
  }
  .g {
    font-size: 2.4em;
    vertical-align: middle;
  }
</style>
