/**
 * Niveles de «A Oscuras · La mina». Cada galería es una pantalla de 30×20 casillas de 16 px.
 *
 * Generado desde el diseño con comprobador de rutas (todas las salidas y pepitas alcanzables).
 *
 * Casillas:
 * #  roca            .  hueco             ^  pinchos fijos
 * X  roca agrietada: se rompe con el pico (E mirando hacia ella, o hacia abajo)
 * =  veta de mineral: solo existe dentro del halo de la lámpara o de una bengala, y
 *    mientras está iluminada es sólida por todos lados
 * H  escalera de madera (arriba/abajo para trepar; el último peldaño sostiene)
 * P  inicio          S  salida de la galería (se cruza para pasar a la siguiente)
 * B  vagoneta        L  lámpara (E para coger/soltar/cambiar)
 * F  bengala (Q)     T  pico                G  pepita de oro (se coge al tocarla)
 * C  cadáver de minero: E para leer lo que dejó (texto en `notes`, por orden de lectura)
 * _  placa de presión (activa con jugador o vagoneta encima). Va en un hueco del suelo
 *    de 2 casillas: la vagoneta cae dentro y ya no se sale
 * K  palanca (E para alternar)
 *
 * Elementos móviles (`movers`), en coordenadas de casilla (se admiten decimales):
 * - platform: sólida, transporta a quien esté encima. Sin `trigger` va y viene
 *   por `path` en bucle; con `trigger` avanza hacia el final mientras el
 *   interruptor nº `trigger` (orden de lectura de _ y K) esté activo y vuelve si no.
 *   Sirve también para puentes que emergen y puertas que se levantan (h > 1).
 * - spikes: barrenas que salen y se esconden en ciclo; parpadean en rojo antes de salir.
 */
export const TILE = 16;
export const COLS = 30;
export const ROWS = 20;

export type PlatformDef = {
  kind: 'platform';
  x: number;
  y: number;
  w: number;
  /** Alto en casillas (por defecto 0.375 = 6 px) */
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
  /** Fotogramas que espera tras activarse su interruptor antes de moverse */
  delay?: number;
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

export type Level = {
  name: string;
  /** Frase del cartel al entrar */
  line: string;
  grid: string[];
  movers?: MoverDef[];
  /** Lo que dejaron escrito los mineros caídos (una por C, en orden de lectura) */
  notes?: string[];
};

export const levels: Level[] = [
  // 1 · El derrumbe
  {
    name: 'El derrumbe',
    line: 'Todo se ha venido abajo. Arriba, en algún sitio, sigue habiendo aire.',
    grid: [
      '##############################',
      '##############################',
      '#............................#',
      '#............................#',
      '#S.........##................#',
      '#S....G....##........C.......#',
      '#################..#######H###',
      '#################^^#######H###',
      '##########################H###',
      '##########################H###',
      '##########################H###',
      '##########################H###',
      '#.........................H..#',
      '#.........................H..#',
      '#............##...........H..#',
      '#............##...........H..#',
      '#.P.....B....##.....G.....H..#',
      '##############################',
      '##############################',
      '##############################',
    ],
    notes: [
      '«Si alguien lee esto: la escalera del fondo aguanta. Subid. Yo ya no puedo con la pierna.» — Ramiro',
    ],
  },
  // 2 · La lámpara de Tomás
  {
    name: 'La lámpara de Tomás',
    line: 'Tomás nunca dejaba que su lámpara se apagara.',
    grid: [
      '##############################',
      '##############################',
      '##############################',
      '#............................#',
      '#...........................S#',
      '#.........C...........G.....S#',
      '#....##########^^#############',
      '#..............###############',
      '#.===..........###############',
      '#..............###############',
      '#.....===......###############',
      '#...........G..###############',
      '#.........===..###############',
      '#..............###############',
      '#.....===......###############',
      '#............................#',
      '#.===........................#',
      '#.......................LC.P.#',
      '###################^^#########',
      '##############################',
    ],
    notes: [
      '«Tomás. Su lámpara sigue caliente. Siempre decía que el mineral azul “contesta” a la luz.»',
      '«Las vetas aguantan mientras las alumbras. No te pares a mirar abajo.» — garabateado con carbón',
    ],
  },
  // 3 · El pico
  {
    name: 'El pico',
    line: 'La roca cede si sabes dónde golpear.',
    grid: [
      '##############################',
      '##############################',
      '#...............X............#',
      '#........X......X...........S#',
      '#........X......X...........S#',
      '##H###############..###X######',
      '##H###############^^###G######',
      '##H###########################',
      '#.H..........X...............#',
      '#.H....##....X...............#',
      '#.H....##..G.X...........C...#',
      '#####################^^####H##',
      '###########################H##',
      '###########################H##',
      '#.........X................H.#',
      '#.........X................H.#',
      '#.P..CT...X.........G......H.#',
      '################^^############',
      '##############################',
      '##############################',
    ],
    notes: [
      '«Antonio. Agarra todavía el pico. Tenía las uñas negras de escarbar.»',
      '«Dicen que el grisú no avisa. Mentira: avisa. Huele a manzanas podridas.»',
    ],
  },
  // 4 · Vía muerta
  {
    name: 'Vía muerta',
    line: 'Las plataformas siguen moviéndose. Nadie las empuja.',
    grid: [
      '##############################',
      '##############################',
      '##############################',
      '##############################',
      '##############################',
      '#............................#',
      '#S...........................#',
      '#S...G.......................#',
      '##########........#######..###',
      '##########^^^^^^^^#######..###',
      '#########################..###',
      '#########################..###',
      '#########################..###',
      '#########################..###',
      '#............................#',
      '#............................#',
      '#.P........................G.#',
      '########..............########',
      '########^^^^^^C^^^^^^^########',
      '##############################',
    ],
    movers: [
      { kind: 'platform', x: 8, y: 17, w: 2, path: [[0, 0], [5, 0]], speed: 0.6, wait: 60 },
      { kind: 'platform', x: 15, y: 17, w: 2, path: [[0, 0], [5, 0]], speed: 0.6, wait: 60, phase: 193, light: true },
      { kind: 'platform', x: 25, y: 16.625, w: 2, path: [[0, 0], [0, -9]], speed: 0.5, wait: 90, light: true },
      { kind: 'platform', x: 10, y: 8, w: 2, path: [[0, 0], [6, 0]], speed: 0.7, wait: 40 },
    ],
    notes: [
      '«Se cayó del carro intentando saltar. Las plataformas pasan cada poco; hay que esperar.»',
    ],
  },
  // 5 · Las barrenas
  {
    name: 'Las barrenas',
    line: 'Las perforadoras se pusieron en marcha solas tras la explosión.',
    grid: [
      '##############################',
      '##############################',
      '##############################',
      '##############################',
      '##############################',
      '#...........................S#',
      '#...............G...........S#',
      '#H############################',
      '#H############################',
      '#H############################',
      '#H...........................#',
      '#H............G..............#',
      '############################H#',
      '############################H#',
      '############################H#',
      '#...........................H#',
      '#P........C.................H#',
      '##############################',
      '##############################',
      '##############################',
    ],
    movers: [
      { kind: 'spikes', x: 5, y: 16, w: 4, period: 160, up: 60, warn: 30, phase: 0 },
      { kind: 'spikes', x: 12, y: 16, w: 4, period: 160, up: 60, warn: 30, phase: 50 },
      { kind: 'spikes', x: 19, y: 16, w: 4, period: 160, up: 60, warn: 30, phase: 100 },
      { kind: 'spikes', x: 22, y: 11, w: 4, period: 160, up: 60, warn: 30, phase: 0 },
      { kind: 'spikes', x: 15, y: 11, w: 4, period: 160, up: 60, warn: 30, phase: 60 },
      { kind: 'spikes', x: 8, y: 11, w: 3, period: 160, up: 60, warn: 30, phase: 120 },
      { kind: 'spikes', x: 5, y: 6, w: 3, period: 160, up: 60, warn: 30, phase: 0 },
      { kind: 'spikes', x: 11, y: 6, w: 4, period: 160, up: 60, warn: 30, phase: 40 },
      { kind: 'spikes', x: 18, y: 6, w: 4, period: 160, up: 60, warn: 30, phase: 80 },
      { kind: 'spikes', x: 24, y: 6, w: 3, period: 160, up: 60, warn: 30, phase: 120 },
    ],
    notes: [
      '«Las barrenas siguen un ritmo. Cuenta. Cuando parpadean en rojo, ya es tarde.»',
    ],
  },
  // 6 · La báscula
  {
    name: 'La báscula',
    line: 'Aquí se pesaba el mineral. Ahora el peso abre caminos.',
    grid: [
      '##############################',
      '##############################',
      '#............................#',
      '#...........................S#',
      '#...................K..G....S#',
      '###H##########################',
      '###H##########################',
      '###H##########################',
      '#..H.........................#',
      '#..H.........................#',
      '#..H..G.................B....#',
      '###############__##########H##',
      '###########################H##',
      '###########################H##',
      '#..........................H.#',
      '#..........................H.#',
      '#.P..B................C....H.#',
      '#########__#.......###########',
      '############^^^^^^^###########',
      '##############################',
    ],
    movers: [
      { kind: 'platform', x: 25, y: 2, w: 1, h: 3, path: [[0, 0], [0, -3]], speed: 1, trigger: 0 },
      { kind: 'platform', x: 8, y: 8, w: 1, h: 3, path: [[0, 0], [0, -3]], speed: 1, trigger: 1 },
      { kind: 'platform', x: 12, y: 19, w: 7, path: [[0, 0], [0, -2]], speed: 0.5, trigger: 2 },
      { kind: 'spikes', x: 13, y: 4, w: 3, period: 150, up: 50, warn: 30 },
    ],
    notes: [
      '«La báscula abre las compuertas si pesa lo de una vagoneta llena. Una persona no basta.»',
    ],
  },
  // 7 · El montacargas
  {
    name: 'El montacargas',
    line: 'Alguien tiene que tirar de la palanca.',
    grid: [
      '##############################',
      '##############################',
      '#...........................##',
      '#S..........................H#',
      '#S............G.............H#',
      '########..########..########H#',
      '########^^########^^########H#',
      '#...........................H#',
      '#......L....................H#',
      '#..########======#############',
      '#..########^^^^^^#############',
      '#............................#',
      '#.....G......................#',
      '###########################..#',
      '###########################..#',
      '#............................#',
      '#.P...................C..K...#',
      '##############################',
      '##############################',
      '##############################',
    ],
    movers: [
      { kind: 'platform', x: 27, y: 16.625, w: 2, path: [[0, 0], [0, -4]], speed: 0.4, trigger: 0, delay: 90, light: true },
      { kind: 'spikes', x: 20, y: 12, w: 3, period: 150, up: 50, warn: 30, phase: 0 },
      { kind: 'spikes', x: 13, y: 12, w: 3, period: 150, up: 50, warn: 30, phase: 70 },
      { kind: 'platform', x: 1, y: 12.625, w: 2, path: [[0, 0], [0, -4]], speed: 0.5, wait: 80 },
    ],
    notes: [
      '«El montacargas sube si alguien se queda abajo con la palanca. Nadie se quedó.»',
    ],
  },
  // 8 · El filón
  {
    name: 'El filón',
    line: 'Oro. Tanto oro. Y nadie para llevárselo.',
    grid: [
      '##############################',
      '##############################',
      '#............................#',
      '#...........................S#',
      '#....G..............C.....G.S#',
      '##H###...................#####',
      '##H###^^^^^^^^^^^^^^^^^^^#####',
      '#.H....X.....................#',
      '#.H....X.....................#',
      '#.H....X................LG...#',
      '##########XXX#.==..==..####H##',
      '##########GGG#^^^^^^^^^####H##',
      '###########################H##',
      '###########################H##',
      '###########################H##',
      '#........X.................H.#',
      '#........X.................H.#',
      '#.PCT.G..X..............G..H.#',
      '############^^^^^^^^^^^#######',
      '##############################',
    ],
    movers: [
      { kind: 'platform', x: 12, y: 18, w: 2, path: [[0, 0], [9, 0]], speed: 0.7, wait: 40, light: true },
      { kind: 'platform', x: 6, y: 5, w: 2, path: [[0, 0], [17, 0]], speed: 0.8, wait: 30 },
    ],
    notes: [
      '«Llevaba los bolsillos llenos de pepitas. Pesaban demasiado para trepar.»',
      '«El filón madre está más abajo. Mucho más abajo. Lo oímos cantar.»',
    ],
  },
  // 9 · El pozo de ventilación
  {
    name: 'El pozo de ventilación',
    line: 'Si sopla aire, hay salida.',
    grid: [
      '##############################',
      '###..........................#',
      '###..........................#',
      '###.........................S#',
      '###....G....................S#',
      '###...###.......###......#####',
      '###........G...............###',
      '###.......###.......===....###',
      '###........................###',
      '###.............###........###',
      '###........................###',
      '###.................===....###',
      '###..............F.........###',
      '###.............###..........#',
      '###..................C.......#',
      '###.................####.....#',
      '###^^^^^^^^^^^^^^^.......L.P.#',
      '##############################',
      '##############################',
      '##############################',
    ],
    movers: [
      { kind: 'spikes', x: 16, y: 8, w: 3, period: 150, up: 50, warn: 30 },
      { kind: 'spikes', x: 16, y: 12, w: 3, period: 150, up: 50, warn: 30, phase: 75 },
      { kind: 'platform', x: 19, y: 5, w: 2, path: [[0, 0], [4, 0]], speed: 0.6, wait: 50, light: true },
    ],
    notes: [
      '«Sopla aire de arriba. Huele a lluvia. Estamos cerca, Julián, estamos cerca.»',
    ],
  },
  // 10 · La galería sellada
  {
    name: 'La galería sellada',
    line: 'La última puerta. Al otro lado, voces.',
    grid: [
      '##############################',
      '##############################',
      '#............................#',
      '#...........................S#',
      '#..................C..K.G...S#',
      '##H#######......##############',
      '##H#######^^^^^^##############',
      '#.H..........................#',
      '#.H..........................#',
      '#.H.G...................L....#',
      '###==..##..........#######H###',
      '###^^^^##^^^^^^^^^^#######H###',
      '##########################H###',
      '##########################H###',
      '##########################H###',
      '#......X..................H..#',
      '#......X..................H..#',
      '#.P.T..X.B...G........C...H..#',
      '###########__#.......#########',
      '##############^^^^^^^#########',
    ],
    movers: [
      { kind: 'platform', x: 14, y: 20, w: 7, path: [[0, 0], [0, -2]], speed: 0.5, trigger: 1 },
      { kind: 'platform', x: 9, y: 10, w: 2, path: [[0, 0], [8, 0]], speed: 0.7, wait: 40 },
      { kind: 'spikes', x: 20, y: 9, w: 3, period: 150, up: 50, warn: 30 },
      { kind: 'platform', x: 26, y: 2, w: 1, h: 3, path: [[0, 0], [0, -3]], speed: 1, trigger: 0 },
      { kind: 'platform', x: 10, y: 5, w: 2, path: [[0, 0], [4, 0]], speed: 0.6, wait: 50, light: true },
    ],
    notes: [
      '«La compuerta de abajo solo baja el puente con peso. Usad la vagoneta.»',
      '«La palanca abre la galería sellada. Al otro lado se oyen voces. Pero no suben: bajan.»',
    ],
  },
];
