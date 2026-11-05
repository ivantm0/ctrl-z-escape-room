// Mapas del mundo 3 «16 bits»: Ciudad Engranaje (20 × 18 casillas)
//
// Plaza:    # edificios  . adoquín  , paseo  T árbol  L farola  b banco  FF fuente  Z reloj de sol (día/noche)
//           N inventor   estatuas: u búho  g rana  c gato  f zorro
//           C torre del reloj   M laboratorio de espejos   W almacén
// Espejos:  E emisor del rayo  X receptor  o columna (bloquea el rayo)  O salida  (espejos aparte, en MIRRORS)
// Almacén:  . suelo  # muro  O salida  (cajas y marcas aparte, en WAREHOUSE)
// Reloj:    G máquina del reloj  O salida  (el portal aparece en PORTAL3)
//
// Espejos y almacén se generaron y comprobaron automáticamente:
// espejos = 64 combinaciones, solo 4 válidas y todas usan al menos 4 espejos;
// almacén = 3 cajas, 12 empujes y 25 pasos como mínimo (búsqueda en anchura).

export type Screen3 = 'plaza' | 'espejos' | 'almacen' | 'reloj';

export const MAPS3: Record<Screen3, string[]> = {
  plaza: [
    '####################',
    '#########CC#########',
    '#........,,........#',
    '#.L..u...,,...g..L.#',
    '#........,,........#',
    'M,,,,,,,,,,,,,,,,,,W',
    '#........,,........#',
    '#.L..c...FF...f..L.#',
    '#........,,........#',
    '#..T.....,,.....T..#',
    '#........,,........#',
    '#....N...,,...Z....#',
    '#........,,........#',
    '#..b.....,,.....b..#',
    '#........,,........#',
    '#........,,........#',
    '#........,,........#',
    '####################',
  ],
  espejos: [
    '####################',
    '####################',
    '####################',
    '##................##',
    '##o.....o.........##',
    '##.......o........##',
    '##................##',
    '##....o...........##',
    '#E................##',
    '##................##',
    '##..o.......o.o.o.##',
    '##................##',
    '##.......o........##',
    '##................X#',
    '##.o..............##',
    '##########O#########',
    '####################',
    '####################',
  ],
  almacen: [
    '####################',
    '####################',
    '####################',
    '####################',
    '####################',
    '######........######',
    '######........######',
    '######........######',
    '######.#.#....######',
    '######...#.##.######',
    '######......#.######',
    '######..#.....######',
    '#########.##########',
    '#########O##########',
    '####################',
    '####################',
    '####################',
    '####################',
  ],
  reloj: [
    '####################',
    '####################',
    '####################',
    '######........######',
    '######...GG...######',
    '######........######',
    '######........######',
    '######........######',
    '######........######',
    '######........######',
    '######........######',
    '######........######',
    '######........######',
    '######........######',
    '######........######',
    '##########O#########',
    '####################',
    '####################',
  ],
};

/** Espejos del laboratorio: posición y orientación inicial ('/' o '\') */
export const MIRRORS = {
  pos: [[10, 11], [17, 8], [17, 3], [11, 13], [11, 3], [9, 4]] as [number, number][],
  initial: ['\\', '\\', '/', '/', '\\', '\\'],
};

/** Almacén: cajas y marcas */
export const WAREHOUSE = {
  boxes: [[10, 10], [12, 6], [10, 9]] as [number, number][],
  goals: [[7, 10], [8, 5], [9, 6]] as [number, number][],
};

/** Estatuas: orden en que brillan sus ojos de noche */
export const STATUES = ['u', 'g', 'c', 'f'] as const;
export const STATUE_NAMES: Record<string, string> = { u: 'búho', g: 'rana', c: 'gato', f: 'zorro' };

export const PORTAL3 = [10, 9] as const;

type Dir = 'U' | 'D' | 'L' | 'R';
const STEP: Record<Dir, [number, number]> = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
const REFLECT: Record<string, Record<Dir, Dir>> = {
  '/': { R: 'U', U: 'R', L: 'D', D: 'L' },
  '\\': { R: 'D', D: 'R', L: 'U', U: 'L' },
};

/** Recorrido del rayo desde el emisor: casillas que atraviesa y si llega al receptor */
export function traceBeam(states: string[]) {
  const map = MAPS3.espejos;
  let x = 1;
  let y = 8;
  let d: Dir = 'R';
  const path: [number, number][] = [[x, y]];
  const seen = new Set<string>();
  for (let n = 0; n < 400; n++) {
    x += STEP[d][0];
    y += STEP[d][1];
    const c = map[y]?.[x] ?? '#';
    path.push([x, y]);
    if (c === 'X') return { path, hit: true };
    if (c !== '.') return { path, hit: false };
    const mi = MIRRORS.pos.findIndex(([mx, my]) => mx === x && my === y);
    if (mi >= 0) d = REFLECT[states[mi]][d];
    const k = `${x},${y},${d}`;
    if (seen.has(k)) return { path, hit: false };
    seen.add(k);
  }
  return { path, hit: false };
}
