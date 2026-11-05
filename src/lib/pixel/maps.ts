// Mapas del mundo 1 «Monocromo»: 20 × 18 casillas de 8 px (pantalla de 160 × 144)
//
// Leyenda
//   #  roca (muro)         .  suelo            ,  camino           T  árbol
//   W  agua               q  agua con pez      F  flor             o  pozo
//   H  tejado             h  pared de casa     d  puerta cerrada   D  puerta del anciano
//   f  valla              S  baldosa (cajas)   K  cobertizo        Q  cartel
//   c  entrada de la cueva                     E  Puerta del Cartucho
//   N  niña               m  gato              @  inicio
//   — casa —  v ventana   b cama   B mesa con diario   X baúl   A anciano   O salida
//   — cueva — u runa      R roca rompible      Z muro sellado   L pedestal de la llave   s inscripción

export type ScreenId = 'pueblo' | 'casa' | 'cueva';

export const MAPS: Record<ScreenId, string[]> = {
  pueblo: [
    '####################',
    '#######EE#########c#',
    '#.HHH..,,.....HHH..#',
    '#.hdh..,,..T..hdh..#',
    '#......,,..........#',
    '#.T..F.,,..F..o..m.#',
    '#......,,,,,,,,,,,,#',
    '#.HHH..,......WWW..#',
    '#.hDh..,..F...WqW..#',
    '#......,......WWq..#',
    '#..F...,...F.N.....#',
    '#fffff.ffff..T.HHH.#',
    '#f.......Kf.Q..hdh.#',
    '#f........f..,.....#',
    '#f........f..,@....#',
    '#f........f..,.....#',
    '#ffffffffff..,.....#',
    '####################',
  ],
  casa: [
    '####################',
    '####################',
    '####################',
    '###vv####vv####vv###',
    '###..b......A....###',
    '###..b...........###',
    '###..............###',
    '###...BB.....X...###',
    '###..............###',
    '###..............###',
    '#########O##########',
    '####################',
    '####################',
    '####################',
    '####################',
    '####################',
    '####################',
    '####################',
  ],
  cueva: [
    '####################',
    '##########L#########',
    '##########Z#########',
    '######.........#####',
    '######..u.u.u..#####',
    '######.........#####',
    '######..u.u.u..#####',
    '######.........#####',
    '######..u.u.u..#####',
    '######.........#####',
    '##########.#########',
    '##########R#########',
    '##########R#########',
    '######.........#####',
    '######.s.......#####',
    '######.........#####',
    '######.........#####',
    '##########O#########',
  ],
};

/** Huecos del jardín (fuera de la valla) para que los muros cuadren */
export const GARDEN = { crates: [[4, 13], [4, 14]] as [number, number][], plates: [[6, 13], [6, 15]] as [number, number][] };

/** Runas de la cueva: cuadrícula 3 × 3 */
export const RUNES = {
  cols: [8, 10, 12],
  rows: [4, 6, 8],
};

/** Estado inicial de las runas: todas encendidas y luego «pulsadas» 0, 4 y 8 (resoluble en 3) */
export function initialRunes(): boolean[] {
  const r = Array(9).fill(true);
  for (const i of [0, 4, 8]) toggleRune(r, i);
  return r;
}

export function toggleRune(r: boolean[], i: number) {
  const x = i % 3;
  const y = Math.floor(i / 3);
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < 3 && ny >= 0 && ny < 3) r[ny * 3 + nx] = !r[ny * 3 + nx];
  }
}

/** Código del baúl: árboles, peces, flores y casas del pueblo */
export const CHEST_CODE = (() => {
  const count = (ch: string) => MAPS.pueblo.join('').split(ch).length - 1;
  const houses = (MAPS.pueblo.join('').match(/[dD]/g) ?? []).length;
  return `${count('T')}${count('q')}${count('F')}${houses}`;
})();
