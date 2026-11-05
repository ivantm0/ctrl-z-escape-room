// Mapas del mundo 4 «Glitch»: el juego se rompe (20 × 18 casillas)
//
// Vestíbulo: # muro  . suelo  K núcleo  E pantalla de error  X el Error (personaje)
//            G sala del gemelo (oeste)  N sala sin colisiones (este)  B sala de memoria (norte)
// Gemelo:    P placa de Leo  Q placa del clon  O salida. El clon se mueve en espejo (izquierda ↔ derecha).
// Noclip:    f muro falso (se ve muro, se atraviesa)  i muro invisible (se ve suelo, no se pasa)
//            D datos  T terminal de depuración  O salida
// Memoria:   s interruptores  S pantalla  O salida
//
// Gemelo y noclip se generaron y comprobaron automáticamente (búsqueda en anchura):
// gemelo = 42 movimientos como mínimo; noclip = sin camino «a la vista», 34 pasos y 8 muros falsos.

export type Screen4 = 'vestibulo' | 'gemelo' | 'noclip' | 'memoria';

export const MAPS4: Record<Screen4, string[]> = {
  vestibulo: [
    '####################',
    '#########BB#########',
    '#..................#',
    '#..E...........X...#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#........KK........#',
    'G........KK........N',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '####################',
  ],
  gemelo: [
    '####################',
    '####################',
    '####################',
    '##..#....##.......##',
    '###....#.##.......##',
    '##.......###......##',
    '##P.#....##.....#.##',
    '##.....#.##Q......##',
    '##...#...##.......##',
    '##...#...##....#..##',
    '##.....#.##....#..##',
    '##.....#.###..#...##',
    '##....#..##.##....##',
    '##...#...##.....#.##',
    '##..#.#.###.###...##',
    '##.#....#####.#...##',
    '####O###############',
    '####################',
  ],
  noclip: [
    '####################',
    '####################',
    '####################',
    '##...#.#f.D.f.....##',
    '###.#f.###f...#..i##',
    '##i.#..i.#.#..#...##',
    '####i...#.##f....i##',
    '#####..####i.#.#####',
    '##.i.......f.i#...##',
    '##.###f.f.#.#.....##',
    '####f#.i####.#i.i.##',
    '##.#.....#.#i..f..##',
    '###..#.ff.#.f....###',
    '##f...#.i..f##.#i.##',
    '##f...#####i.f....##',
    '##..f.#.#i...ii..###',
    '##########OT########',
    '####################',
  ],
  memoria: [
    '####################',
    '####################',
    '####################',
    '######SSSSSSSS######',
    '######........######',
    '######.s.s.s.s######',
    '######........######',
    '######........######',
    '######........######',
    '######........######',
    '######........######',
    '##########O#########',
    '####################',
    '####################',
    '####################',
    '####################',
    '####################',
    '####################',
  ],
};

/** Inicio del gemelo: Leo a la izquierda, el clon reflejado a la derecha */
export const TWIN_START = { leo: [4, 15] as [number, number], clone: [15, 15] as [number, number] };

/** Interruptores de la memoria (de izquierda a derecha, del bit más alto al más bajo) */
export const SWITCHES: [number, number][] = [[7, 5], [9, 5], [11, 5], [13, 5]];
/** Código del error del vestíbulo: 0x0D = 1101 */
export const ERROR_CODE = 0x0d;

/** El glitch de la memoria: cada interruptor cambia su bit y todos los de su derecha */
export function flipSwitch(bits: boolean[], i: number) {
  return bits.map((b, k) => (k >= i ? !b : b));
}
export const bitsValue = (bits: boolean[]) => bits.reduce((v, b) => v * 2 + (b ? 1 : 0), 0);

export const PORTAL4 = [10, 11] as const;
