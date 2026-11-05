// Mapas del mundo 2 «8 bits»: el castillo de Bitópolis (20 × 18 casillas)
//
// Patio:      # muralla  . césped  , camino  T árbol  F flor  o fuente  B atril con el libro
//             G guardia  n torre de campanas  P sala del trono  w sala de hielo  e sala de cristal
// Hielo:      ~ hielo (resbala)  r roca  X pedestal del fragmento  . suelo  e salida
// Cristal:    R bloque rojo  B bloque azul (levantados según el color activo)  s cristal  X pedestal  w salida
// Campanas:   1 azul  2 roja  3 verde  4 amarilla  b bardo  O salida
// Trono:      K rey  A altar  , alfombra  q portal (aparece al despertar al rey)  O salida
//
// Hielo y cristal se generaron y comprobaron con una búsqueda en anchura:
// hielo = 13 deslizamientos como mínimo; cristal = 31 pasos con 5 cambios de color.

export type Screen2 = 'patio' | 'hielo' | 'cristal' | 'campanas' | 'trono';

export const MAPS2: Record<Screen2, string[]> = {
  patio: [
    '####################',
    '###n####PP##########',
    '#..,....,,.......T.#',
    '#..,....,,.........#',
    '#..,,,,,,,,,,,..B..#',
    '#.T.....,,.........#',
    '#.......,,....G....#',
    '#......o,,.........#',
    '#.......,,.........#',
    'w,,,,,,,,,,,,,,,,,,e',
    '#.......,,.........#',
    '#..F....,,....F....#',
    '#.......,,.........#',
    '#....T..,,......T..#',
    '#.......,,.........#',
    '#.......,,.........#',
    '#..................#',
    '####################',
  ],
  hielo: [
    '####################',
    '####################',
    '##~~r~~r~~~~~~~r~###',
    '##r~~~r~~~~~~~~~~###',
    '##~~~~~~~~~~~~~~~###',
    '##~~~~~~~~~~~~~~~###',
    '##~X~~~~~~~~~~~~~###',
    '##r~~~~~~~~~~~~~~###',
    '##~~~~~~r~~~~~~~~###',
    '##~~~~~~~~~~~~~~~..e',
    '##~~~~~~~~~~~~~~r###',
    '##r~~~~~~~~~rr~~~###',
    '##~~~~~~~~r~~~~~~###',
    '##~~~~~~~~~~~~~~~###',
    '##r~~~~~~~~~~~~~~###',
    '##~~~~~~~~~~~~~~~###',
    '####################',
    '####################',
  ],
  cristal: [
    '####################',
    '####################',
    '####################',
    '###.#B..###..###.###',
    '###.R.##B.#..RX#B###',
    '###B..#..BB..#.B.###',
    '###...#.#B...RB.####',
    '###.B..##B#R.RR..###',
    '###s.BR.R.s...RR.###',
    'w...R#B.#R.B#.R..###',
    '###.BR.##..##...R###',
    '###.BR...###..B#.###',
    '###BR.B.#......#.###',
    '###..#B.B..B..#..###',
    '###s#.#..B.RR#..####',
    '####################',
    '####################',
    '####################',
  ],
  campanas: [
    '####################',
    '####################',
    '####################',
    '####################',
    '#####..........#####',
    '#####.1.2.3.4..#####',
    '#####..........#####',
    '#####..........#####',
    '#####..........#####',
    '#####..........#####',
    '#####........b.#####',
    '#####..........#####',
    '#####..........#####',
    '#####..........#####',
    '#####..........#####',
    '#####..........#####',
    '##########O#########',
    '####################',
  ],
  trono: [
    '####################',
    '####################',
    '#####..........#####',
    '#####....,K,...#####',
    '#####....,,,...#####',
    '#####....,,,...#####',
    '#####....,A,...#####',
    '#####....,,,...#####',
    '#####....,,,...#####',
    '#####....,,,...#####',
    '#####....,,,...#####',
    '#####....,,,...#####',
    '#####....,,,...#####',
    '#####....,,,...#####',
    '#####....,,,...#####',
    '#####....,,,...#####',
    '##########O#########',
    '####################',
  ],
};

/** Campanas: color de cada una y la canción del rey */
export const BELLS = ['azul', 'roja', 'verde', 'amarilla'] as const;
export const SONG = [0, 1, 3, 2, 0]; // azul, roja, amarilla, verde, azul

/** El libro del patio: un glitch lo ha escrito al revés */
export const BOOK = 'La canción del rey: azul, roja, amarilla, verde y otra vez azul.';
export const BOOK_GLITCHED = [...BOOK].reverse().join('');

/** Dónde aparece el portal cuando despierta el rey */
export const PORTAL = [13, 3] as const;
