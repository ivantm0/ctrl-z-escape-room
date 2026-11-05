<!-- Detalle sin acertijo: el gato da un empujoncito sobre el sentido de lectura -->
<div class="wrap">
  <p class="cat" aria-hidden="true">𓃠</p>
  <p>
    Un gato negro, sagrado para Bastet, te observa de perfil desde lo alto de la muralla.
    <strong>Mira hacia la derecha</strong>, inmóvil, como si esperase a que alguien siguiera su mirada.
  </p>
  <p class="aside">En Egipto, hacer daño a un gato se pagaba muy caro. Mejor no molestarlo.</p>
</div>

<style>
  .wrap {
    display: grid;
    gap: 1rem;
    justify-items: center;
    text-align: center;
    line-height: 1.6;
  }
  .cat {
    font-family: var(--font-glyph);
    font-size: 5rem;
    color: var(--accent);
    transform: scaleX(-1);
  }
  strong {
    color: var(--accent);
    font-weight: 500;
  }
  .aside {
    font-size: 0.9rem;
    font-style: italic;
    color: var(--muted);
  }
</style>
