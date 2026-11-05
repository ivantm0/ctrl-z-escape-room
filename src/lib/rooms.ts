export type Level = {
  title: string;
  /** Tres pistas, de sutil a solución */
  hints: [string, string, string];
  /** Objeto que se gana al superar el nivel */
  item: { glyph: string; name: string };
};

export type Room = {
  id: string;
  n: string;
  name: string;
  tagline: string;
  /** Mecánicas que se usan, para el vestíbulo */
  tags: string[];
  ready: boolean;
  requires?: string;
  levels: Level[];
};

export const rooms: Room[] = [
  {
    id: 'oficina',
    n: '01',
    name: 'La Oficina',
    tagline: 'Un ordenador de 1992 que no quiere dejarte salir.',
    tags: ['consola', 'pestaña', 'selección'],
    ready: true,
    levels: [
      {
        title: 'Inicio de sesión',
        hints: [
          'El técnico dice que la contraseña está «detrás de la pantalla». ¿Qué hay detrás de una página web?',
          'Abre las herramientas de desarrollador (F12 o Ctrl+Mayús+I) y mira la pestaña Consola.',
          'La contraseña es FÓSFORO.',
        ],
        item: { glyph: '⌨', name: 'Teclado mecánico' },
      },
      {
        title: 'El post-it',
        hints: [
          '«Más arriba todavía»: más arriba que la propia página.',
          'Mira el título de la pestaña del navegador. Va mostrando una letra cada vez.',
          'La clave es PESTAÑA.',
        ],
        item: { glyph: '✎', name: 'Post-it arrugado' },
      },
      {
        title: 'Documento confidencial',
        hints: [
          'Un documento en blanco no siempre está vacío.',
          'Selecciona el contenido del documento (arrastrando o con Ctrl+A).',
          'La palabra es SUBRAYADO.',
        ],
        item: { glyph: '⚿', name: 'Llave de la oficina' },
      },
    ],
  },
  {
    id: 'observatorio',
    n: '02',
    name: 'El Observatorio',
    tagline: 'Una cúpula que solo enseña el cielo a quien sabe mirar.',
    tags: ['modo oscuro', 'ventana', 'pestañas'],
    ready: true,
    requires: 'oficina',
    levels: [
      {
        title: 'La cúpula',
        hints: [
          'El cielo de la cúpula es el mismo que el de tu sistema.',
          'Cambia tu sistema operativo o tu navegador a modo oscuro.',
          'La constelación forma el número 407.',
        ],
        item: { glyph: '☾', name: 'Mapa estelar' },
      },
      {
        title: 'El telescopio',
        hints: [
          'El ocular es redondo. ¿Y tu ventana?',
          'Haz la ventana del navegador cuadrada. En móvil, gíralo en horizontal.',
          'El planeta es SATURNO.',
        ],
        item: { glyph: '◎', name: 'Lente pulida' },
      },
      {
        title: 'Estrellas fugaces',
        hints: [
          'Son tímidas: solo pasan cuando no miras.',
          'Cambia a otra pestaña o aplicación y vuelve. Varias veces.',
          'Las iniciales forman LIRA.',
        ],
        item: { glyph: '✦', name: 'Fragmento de meteorito' },
      },
    ],
  },
  {
    id: 'radio',
    n: '03',
    name: 'La Radio Pirata',
    tagline: 'Una emisora clandestina que transmite entre el ruido.',
    tags: ['sonido', 'morse', 'pantalla completa'],
    ready: true,
    requires: 'observatorio',
    levels: [
      {
        title: 'Sintoniza',
        hints: [
          'Las emisoras piratas se esconden entre el ruido. Fíjate en la intensidad de la señal.',
          'Enciende la radio, mueve el dial hasta que la señal esté al máximo (98.6 MHz) y escucha. ¿No puedes oír? Busca los subtítulos.',
          'La contraseña es ANTENA.',
        ],
        item: { glyph: '📻', name: 'Válvula de radio' },
      },
      {
        title: 'La luz del estudio',
        hints: [
          'La bombilla no parpadea por estar estropeada.',
          'Es código morse: un destello corto es un punto, uno largo una raya. Usa la tabla de la pared.',
          'La palabra es FARO.',
        ],
        item: { glyph: '💡', name: 'Bombilla de señales' },
      },
      {
        title: 'Plena potencia',
        hints: [
          'La emisora dice que necesita «toda la pantalla».',
          'Pon el navegador en pantalla completa (F11) o pulsa el botón MAX de la radio.',
          'La clave es ECO.',
        ],
        item: { glyph: '🎙', name: 'Micrófono de cinta' },
      },
    ],
  },
  {
    id: 'laboratorio',
    n: '04',
    name: 'El Laboratorio',
    tagline: 'Experimentos escondidos dentro del propio código de la página.',
    tags: ['inspector', 'zoom', 'almacenamiento'],
    ready: true,
    requires: 'radio',
    levels: [
      {
        title: 'El frasco sin etiqueta',
        hints: [
          'La etiqueta no está a la vista, pero sigue en la página.',
          'Haz clic derecho en el frasco y elige «Inspeccionar». Busca un elemento oculto.',
          'El contenido es ISÓTOPO.',
        ],
        item: { glyph: '⚗', name: 'Frasco de ensayo' },
      },
      {
        title: 'El microscopio',
        hints: [
          'La muestra es diminuta. Necesitas más aumentos.',
          'Haz zoom en la página (Ctrl + +). En móvil, pellizca para ampliar.',
          'La muestra es una CÉLULA.',
        ],
        item: { glyph: '🔬', name: 'Portaobjetos' },
      },
      {
        title: 'El termostato',
        hints: [
          'El termostato no está en el laboratorio. Está guardado en tu navegador.',
          'Abre las herramientas de desarrollador → Aplicación → Almacenamiento local y sube «laboratorio:temperatura» a 100.',
          'Al hervir aparece EBULLICIÓN.',
        ],
        item: { glyph: '🌡', name: 'Termómetro' },
      },
    ],
  },
  {
    id: 'archivo',
    n: '05',
    name: 'El Archivo Perdido',
    tagline: 'Una biblioteca infinita que recuerda por dónde has pasado.',
    tags: ['URL', 'historial', 'pestañas'],
    ready: true,
    requires: 'laboratorio',
    levels: [
      {
        title: 'El catálogo',
        hints: [
          'Los pasillos del archivo no se recorren con los pies, sino con la dirección.',
          'Mira el final de la URL (#s1-e1) y cámbialo por la sección y el estante de la ficha.',
          'En #s7-e3 está el libro PERGAMINO.',
        ],
        item: { glyph: '🗂', name: 'Ficha del catálogo' },
      },
      {
        title: 'Los pasillos',
        hints: [
          'En este archivo los libros solo se leen hacia atrás.',
          'Avanza hasta el fondo y luego vuelve con el botón Atrás del navegador.',
          'Las letras forman TOMO.',
        ],
        item: { glyph: '📜', name: 'Página arrancada' },
      },
      {
        title: 'El mapa partido',
        hints: [
          'Hace falta un segundo lector… y ese lector puedes ser tú.',
          'Abre esta misma página en otra pestaña y vuelve a esta.',
          'El mapa dice LABERINTO.',
        ],
        item: { glyph: '🗺', name: 'Mapa del archivo' },
      },
    ],
  },
  {
    id: 'maquina',
    n: '06',
    name: 'La Máquina',
    tagline: 'El final. La máquina sabe que estás jugando.',
    tags: ['portapapeles', 'impresión', 'teclado'],
    ready: true,
    requires: 'archivo',
    levels: [
      {
        title: 'Dime mi nombre',
        hints: [
          'Lo que ves no es lo que la máquina es.',
          'No escribas su nombre: cópialo y pégalo en el candado.',
          'Al copiarlo obtienes ESPEJO.',
        ],
        item: { glyph: '🪞', name: 'Espejo roto' },
      },
      {
        title: 'Solo en papel',
        hints: [
          'La máquina dice que solo se entiende en papel.',
          'Abre la vista de impresión (Ctrl + P). No hace falta imprimir.',
          'El plano dice ENGRANAJE.',
        ],
        item: { glyph: '⚙', name: 'Engranaje' },
      },
      {
        title: 'La salida',
        hints: [
          'La salida siempre estuvo en el nombre del juego.',
          'Pulsa Ctrl y después Escape (en móvil, usa el teclado de la pantalla).',
          'Ctrl + Escape.',
        ],
        item: { glyph: '⎋', name: 'Tecla Escape' },
      },
    ],
  },
];

export const getRoom = (id: string) => rooms.find((r) => r.id === id);
