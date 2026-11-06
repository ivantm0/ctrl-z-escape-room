/**
 * Niveles de «A oscuras». Cada uno es una pantalla de 20×12 tiles de 16 px.
 *
 * Tiles (estáticos):
 * #  muro            .  vacío             ^  pinchos fijos
 * =  plataforma de luz: solo existe dentro del halo del farol o de una bengala, y
 *    mientras está iluminada es sólida por todos lados (también desde abajo)
 * P  inicio          B  caja              L  farol (E para coger/soltar)
 * F  bengala (Q)     S  salida (decorativo: se sale por el borde derecho)
 * _  placa de presión (activa mientras hay jugador o caja encima). Se pone en un
 *    hueco del suelo de 2 casillas: la caja cae dentro y ya no se sale
 * K  palanca (E para alternar)
 *
 * Elementos móviles (`movers`), en coordenadas de tile (se admiten decimales):
 * - platform: sólida, transporta a quien esté encima. Sin `trigger` va y viene
 *   por `path` en bucle; con `trigger` avanza hacia el final mientras el
 *   interruptor nº `trigger` (orden de lectura de _ y K) esté activo y vuelve si no.
 *   Sirve también para puentes que emergen y puertas que se levantan (h > 1).
 * - spikes: pinchos que salen y se esconden en ciclo; brillan antes de salir.
 */
export const TILE = 16;
export const COLS = 20;
export const ROWS = 12;

export type PlatformDef = {
  kind: 'platform';
  x: number;
  y: number;
  w: number;
  /** Alto en tiles (por defecto 0.375 = 6 px) */
  h?: number;
  /** Puntos relativos a (x, y); el primero suele ser [0, 0] */
  path: [number, number][];
  /** px por fotograma */
  speed: number;
  /** Fotogramas de pausa en cada extremo (solo en bucle) */
  wait?: number;
  /** Desfase en fotogramas (solo en bucle) */
  phase?: number;
  trigger?: number;
  /** Lleva una lucecita propia */
  light?: boolean;
};

export type SpikesDef = {
  kind: 'spikes';
  x: number;
  y: number;
  w: number;
  /** Duración del ciclo completo, en fotogramas */
  period: number;
  /** Fotogramas fuera */
  up: number;
  /** Fotogramas de aviso antes de salir */
  warn: number;
  phase?: number;
};

export type MoverDef = PlatformDef | SpikesDef;

export type Level = { name: string; grid: string[]; movers?: MoverDef[] };

const open = '#..................#';
const exitRow = '#..................S';

export const levels: Level[] = [
  // 1 · Caja para subir un muro
  {
    name: 'Primeros pasos',
    grid: [
      '####################',
      open,
      open,
      open,
      open,
      '#.............######',
      '#.........##.......S',
      '#.........##.......S',
      '#P.....B..##.......S',
      '##############^^####',
      '####################',
      '####################',
    ],
  },
  // 2 · Farol + plataformas de luz
  {
    name: 'La luz que pisa',
    grid: [
      '####################',
      open,
      open,
      open,
      '#.......F..........#',
      '#......===.........S',
      '#..L.......#.......S',
      '####.......#=====..S',
      'P......B...#.....###',
      '############^^^^^###',
      '####################',
      '####################',
    ],
  },
  // 3 · Primera plataforma móvil y primer ascensor
  {
    name: 'Ascensor',
    grid: [
      '####################',
      exitRow,
      exitRow,
      exitRow,
      '#...............####',
      '#...............####',
      '#...............####',
      '#...............####',
      'P...............####',
      '######.......#######',
      '######^^^^^^^#######',
      '####################',
    ],
    movers: [
      { kind: 'platform', x: 6, y: 9, w: 2, path: [[0, 0], [5, 0]], speed: 0.6, wait: 60, light: true },
      { kind: 'platform', x: 14, y: 8.625, w: 2, path: [[0, 0], [0, -5]], speed: 0.5, wait: 90, light: true },
    ],
  },
  // 4 · Pinchos que suben y bajan, en un pasillo sin espacio para saltarlos
  {
    name: 'Dientes',
    grid: [
      '####################',
      '####################',
      '####################',
      '####################',
      '####################',
      '####################',
      '####################',
      exitRow,
      'P..................S',
      '####################',
      '####################',
      '####################',
    ],
    movers: [
      { kind: 'spikes', x: 3, y: 8, w: 4, period: 150, up: 60, warn: 30, phase: 0 },
      { kind: 'spikes', x: 9, y: 8, w: 4, period: 150, up: 60, warn: 30, phase: 50 },
      { kind: 'spikes', x: 15, y: 8, w: 3, period: 150, up: 60, warn: 30, phase: 100 },
    ],
  },
  // 5 · Placa de presión: una caja la mantiene pulsada y el puente emerge
  {
    name: 'Peso muerto',
    grid: [
      '####################',
      open,
      open,
      open,
      open,
      open,
      exitRow,
      exitRow,
      '#P.B...............S',
      '#####__#.......#####',
      '########^^^^^^^#####',
      '####################',
    ],
    movers: [{ kind: 'platform', x: 8, y: 11, w: 7, path: [[0, 0], [0, -2]], speed: 0.5, trigger: 0 }],
  },
  // 6 · Palanca que pone en marcha un ascensor + pinchos arriba
  {
    name: 'La palanca',
    grid: [
      '####################',
      exitRow,
      exitRow,
      exitRow,
      '#.......############',
      '#.......############',
      '#.......############',
      '#.......############',
      'PF...K..############',
      '####################',
      '####################',
      '####################',
    ],
    movers: [
      { kind: 'platform', x: 6, y: 8.625, w: 2, path: [[0, 0], [0, -5]], speed: 0.4, trigger: 0 },
      { kind: 'spikes', x: 10, y: 3, w: 3, period: 160, up: 50, warn: 30, phase: 0 },
      { kind: 'spikes', x: 15, y: 3, w: 3, period: 160, up: 50, warn: 30, phase: 80 },
    ],
  },
  // 7 · Cruzar con el farol en una plataforma móvil y subir por luz
  {
    name: 'Faro a la deriva',
    grid: [
      '####################',
      exitRow,
      exitRow,
      '#...............===#',
      open,
      '#...........===....#',
      open,
      '#...............===#',
      'P.L................#',
      '#####..........#####',
      '#####^^^^^^^^^^#####',
      '####################',
    ],
    movers: [{ kind: 'platform', x: 5, y: 9, w: 2, path: [[0, 0], [8, 0]], speed: 0.7, wait: 40 }],
  },
  // 8 · Llevar la caja en la plataforma hasta la placa que abre la puerta
  {
    name: 'Engranajes',
    grid: [
      '####################',
      open,
      open,
      open,
      open,
      open,
      exitRow,
      exitRow,
      'P..B...............S',
      '######......#__#####',
      '######^^^^^^########',
      '####################',
    ],
    movers: [
      { kind: 'platform', x: 6, y: 9, w: 2, path: [[0, 0], [4, 0]], speed: 0.6, wait: 60, light: true },
      { kind: 'spikes', x: 15, y: 8, w: 2, period: 120, up: 50, warn: 30 },
      // Puerta
      { kind: 'platform', x: 18, y: 6, w: 1, h: 3, path: [[0, 0], [0, -3]], speed: 1, trigger: 0 },
    ],
  },
  // 9 · Ascensor, plataformas de luz y pinchos con tiempo
  {
    name: 'Contrarreloj',
    grid: [
      '####################',
      exitRow,
      exitRow,
      '##..#===####===#####',
      open,
      open,
      open,
      open,
      '#.........L.......P#',
      '####################',
      '####################',
      '####################',
    ],
    movers: [
      { kind: 'platform', x: 2, y: 8.625, w: 2, path: [[0, 0], [0, -6]], speed: 0.6, wait: 90 },
      { kind: 'spikes', x: 8, y: 2, w: 4, period: 130, up: 60, warn: 30 },
    ],
  },
  // 10 · Todo a la vez
  {
    name: 'Maquinaria',
    grid: [
      '####################',
      open,
      open,
      open,
      open,
      open,
      exitRow,
      exitRow,
      'PF...............K.S',
      '####.....##.....####',
      '####^^^^^##^^^^^####',
      '####################',
    ],
    movers: [
      // Ciclo de 340 fotogramas: A espera al final justo cuando B espera al principio,
      // y los pinchos del pilar bajan en ese momento la primera vez (luego se desfasan)
      { kind: 'platform', x: 4, y: 9, w: 2, path: [[0, 0], [3, 0]], speed: 0.6, wait: 90 },
      { kind: 'spikes', x: 9, y: 8, w: 2, period: 160, up: 40, warn: 30, phase: 150 },
      { kind: 'platform', x: 11, y: 9, w: 2, path: [[0, 0], [3, 0]], speed: 0.6, wait: 90, phase: 170, light: true },
      // Puerta
      { kind: 'platform', x: 18, y: 6, w: 1, h: 3, path: [[0, 0], [0, -3]], speed: 1, trigger: 0 },
    ],
  },
];
