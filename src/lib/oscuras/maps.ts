/**
 * Galerías de «A Oscuras · La mina de Las Ánimas». Cada galería es una pantalla de 30×20 casillas de 16 px.
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
 * *  +  cristales que laten: se encienden por turnos y solo son sólidos encendidos
 * Y  seta: al pisarla te lanza muy alto
 * w  agua: no mata a sangre, pero te devuelve al principio de la gruta
 * O  polilla de luz: va hacia la lámpara y le chupa el aceite
 * V  Ventura: te lanza dinamita; tocarle es morir; tu dinamita lo mata
 * h  minero de la cuadrilla de rescate (Parte III): patrulla con lámpara y pico; su luz quema
 * I  el cura (Parte III): quieto en el altar; su luz crece con cada vela encendida
 * p  perro de Ventura (Parte III): te huele y muerde
 * c  vela (Parte III): su luz quema; E para apagarla
 * n  ventana encendida (Parte IV): sólida; su luz quema; E la revienta
 * l  farola (Parte IV): su luz quema; E la tumba
 * f  hoguera (Parte IV): quema muchísimo si la tocas
 * v  vecino (Parte IV): si te ve, huye gritando y avisa a la Guardia Civil
 * g  guardia civil (Parte IV): dispara a ti y a los de la horda
 * M  sombra: atraviesa la roca y te persigue; huye de la lámpara y de las bengalas. Tocarla es morir
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
  /** Radio de la luz propia del jugador, en px (por defecto 42): menos = más oscuro */
  dark?: number;
  /** Velocidad de las sombras, en px por fotograma (por defecto 0.5) */
  shade?: number;
  /** Si existe, las palancas vuelven solas tras estos fotogramas (la puerta se cierra) */
  leverTime?: number;
  /** Aspecto: «grutas» = cuevas luminosas (casi sin oscuridad) */
  look?: 'grutas' | 'pueblo' | 'campo' | 'ciudad';
  /** Duración del ciclo de los cristales que laten (* y +), en fotogramas (por defecto 160) */
  pulse?: number;
  /** Escena de texto al entrar en la galería por primera vez */
  cinematic?: string[];
  /** Eco: una copia tuya repite tus pasos con este retraso, en fotogramas */
  echo?: number;
  /** Inundación: el agua sube desde la fila `from` hasta la fila `to`, a `speed` px por fotograma tras `delay` */
  flood?: { from: number; speed: number; delay?: number; to?: number };
  /** Cada cuántos fotogramas lanza Ventura un cartucho (por defecto 150) */
  ventura?: number;
  /** Parte III: humanos que hay que comer antes de poder salir */
  need?: number;
  /** Ambientación del nivel en la campaña: mina, abismo, Julián muerto o fuera de la mina */
  theme?: 'mina' | 'abismo' | 'muerto' | 'pueblo';
  /** Al salir: la falsa salida que explota (antes de caer al abismo) */
  boom?: boolean;
  /** Al entrar, la lámpara que llevaras se apaga */
  lampOut?: boolean;
};

export const levels: Level[] = [
  // 1 · El derrumbe
  {
    name: 'El derrumbe',
    line: 'Algo se ha derrumbado. Algo, en la oscuridad, sigue respirando.',
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
      '«No fue el grisú. Oí la mecha. Ventura cerró la galería con nosotros dentro. Y luego empezó el canto.» — Ramiro',
    ],
  },
  // 2 · La lámpara de Tomás
  {
    name: 'La lámpara de Tomás',
    line: 'Tomás nunca dejaba que su lámpara se apagara. Ahora sabes por qué.',
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
      '«Ha vuelto a pasar por aquí. No hace ruido al andar, pero se le oye respirar justo detrás de la oreja.»',
      '«Tomás. Tiene la lámpara encendida en la mano y los ojos abiertos. No hay ni un rasguño en su cuerpo.»',
    ],
  },
  // 3 · El pico
  {
    name: 'El pico',
    line: 'La roca cede si sabes dónde golpear. Lo que hay detrás no siempre quiere salir.',
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
      '«Dicen que el grisú huele a manzanas podridas. Esto huele a otra cosa. A iglesia cerrada.»',
      '«Antonio. Escarbó la roca hasta dejarse las uñas. Escribió con sangre: NO ESTÁ MUERTO EL QUE CANTA.»',
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
      '«Saltó. Juraba que algo le agarraba del tobillo desde el fondo del foso.»',
    ],
  },
  // 5 · Las barrenas
  {
    name: 'Las barrenas',
    line: 'Las perforadoras se encendieron solas tras la explosión.',
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
      '«Las barrenas llevan el ritmo de algo. Como un corazón muy grande y muy lento.»',
    ],
  },
  // 6 · La báscula
  {
    name: 'La báscula',
    line: 'Aquí se pesaba el mineral. Ahora pesa otra cosa.',
    leverTime: 840,
    grid: [
      '##############################',
      '##############################',
      '#............................#',
      '#...........................S#',
      '#......................G....S#',
      '###H##########################',
      '###H##########################',
      '###H##########################',
      '#..H.........................#',
      '#..H.........................#',
      '#..H..G.................B.K..#',
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
      '«La báscula marca peso cuando no hay nada encima. Mucho peso.» — J.',
    ],
  },
  // 7 · El montacargas
  {
    name: 'El montacargas',
    line: 'Alguien tiene que tirar de la palanca. Alguien que no seas tú.',
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
      '«Si subes, no mires la cuerda del montacargas. No está atada a nada.» — J.',
    ],
  },
  // 8 · El filón
  {
    name: 'El filón',
    line: 'Oro. Tanto oro. Y nadie vivo para llevárselo.',
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
      '«El filón madre está más abajo. Lo oímos cantar. Cantaba con nuestras voces.»',
      '«Llevaba los bolsillos llenos de pepitas. También la boca.»',
    ],
  },
  // 9 · El pozo de ventilación
  {
    name: 'El pozo de ventilación',
    line: 'Si sopla aire, hay salida. Si respira, no.',
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
      '«Sopla aire de arriba. No es aire. Es algo que respira desde la boca de la mina.» — J.',
    ],
  },
  // 10 · La galería sellada
  {
    name: 'La galería sellada',
    line: 'La galería está sellada. Desde fuera.',
    leverTime: 780,
    grid: [
      '##############################',
      '##############################',
      '#............................#',
      '#...........................S#',
      '#..................C....G...S#',
      '##H#######......##############',
      '##H#######^^^^^^##############',
      '#.H..........................#',
      '#.H..........................#',
      '#.H.G..K................L....#',
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
      '«Ventura selló la mina por fuera, a propósito. “Mejor cuarenta que el pueblo entero”, dijo.»',
      '«La compuerta sube el puente con peso. Usad la vagoneta. Y no os quedéis quietos mucho rato.»',
    ],
  },
  // 11 · Los pozos viejos
  {
    name: 'Los pozos viejos',
    line: 'La única salida es hacia abajo. Por donde vino el canto.',
    dark: 40,
    grid: [
      '##############################',
      '##############################',
      '#............................#',
      '#................##..........#',
      '#.PL..........C..##...G......#',
      '##########..##############..##',
      '##########^^##############..##',
      '##########################..##',
      '#............................#',
      '#.......................M....#',
      '#....G.......................#',
      '##..####.===.######..#########',
      '##..####^^^^^######^^#########',
      '##..##########################',
      '#............................#',
      '#...........................S#',
      '#..............C............S#',
      '####################..########',
      '####################^^########',
      '##############################',
    ],
    movers: [
      { kind: 'spikes', x: 12, y: 16, w: 3, period: 150, up: 50, warn: 30 },
    ],
    notes: [
      '«Bajamos a buscar a los que faltaban. Volvimos menos. Siempre volvemos menos.»',
      '«Le vi la cara a la sombra. Era la cara de mi hermano. Mi hermano murió en el 19.» — J.',
    ],
  },
  // 12 · La capilla
  {
    name: 'La capilla',
    line: 'Los viejos decían que la mina no se llamaba así por la capilla del pueblo.',
    dark: 38,
    leverTime: 480,
    grid: [
      '##############################',
      '##############################',
      '#............................#',
      '#............................#',
      '#.P.................G........#',
      '############..#############H##',
      '############^^#############H##',
      '#.......#.....#.....#........#',
      '#.......#.....#.....#...M....#',
      '#............................#',
      '#...K.....##C.L.##...........#',
      '##H###########################',
      '##H###########################',
      '##H###########################',
      '#............................#',
      '#.....M.....................S#',
      '#........................G..S#',
      '#######.====.#################',
      '#######^^^^^^#################',
      '##############################',
    ],
    movers: [
      { kind: 'platform', x: 18, y: 14, w: 1, h: 3, path: [[0, 0], [0, -3]], speed: 1, trigger: 0 },
      { kind: 'spikes', x: 22, y: 16, w: 3, period: 140, up: 50, warn: 28 },
    ],
    notes: [
      '«Hay una capilla aquí abajo. Más vieja que la mina. Más vieja que el pueblo. El altar está mirando hacia abajo.»',
    ],
  },
  // 13 · El osario
  {
    name: 'El osario',
    line: 'Aquí abajo ya había muertos antes de que llegáramos.',
    dark: 36,
    grid: [
      '##############################',
      '##############################',
      '#.........X..................#',
      '#.........X....M.............#',
      '#.P.T..C..X..G...............#',
      '################..#######X####',
      '################^^#######.####',
      '#########################.####',
      '#............................#',
      '#............................#',
      '#......G..............L.C....#',
      '####X##########..#############',
      '####.##########^^#############',
      '####.#########################',
      '#..............X.............#',
      '#..............X......M.....S#',
      '#..............X..G......C..S#',
      '####################..########',
      '####################^^########',
      '##############################',
    ],
    movers: [
      { kind: 'spikes', x: 19, y: 10, w: 3, period: 130, up: 50, warn: 25 },
      { kind: 'spikes', x: 10, y: 10, w: 3, period: 130, up: 50, warn: 25, phase: 65 },
      { kind: 'spikes', x: 8, y: 16, w: 4, period: 130, up: 50, warn: 25 },
    ],
    notes: [
      '«Huesos. Cientos. Con cascos de cuero, de antes de la Compañía. Todos con la cabeza hacia la misma pared.»',
      '«Si te sigue, no corras hacia la oscuridad. Corre hacia la luz. Siempre hacia la luz.» — J.',
      '«No es una sombra. Es un agujero con forma de hombre.»',
    ],
  },
  // 14 · Los murmullos
  {
    name: 'Los murmullos',
    line: 'Las voces dicen tu nombre. Lo dicen bien.',
    dark: 34,
    grid: [
      '##############################',
      '##############################',
      '#.......................######',
      '#...............M.......######',
      '#.PC.L..................######',
      '#########...............######',
      '#########...............######',
      '#########.==............######',
      '#########.......G.......######',
      '#########......==.......######',
      '#########............L..######',
      '#...................##..######',
      '#.......................######',
      '#...............==......######',
      '#...M...................######',
      '#S..........==.....M....######',
      '#S.G....................######',
      '#########^^^^^^^^^^^^^^^######',
      '##############################',
      '##############################',
    ],
    notes: [
      '«Contestad solo si os llaman por el apodo. El nombre de verdad lo sabe cualquiera.» — J.',
    ],
  },
  // 15 · La galería romana
  {
    name: 'La galería romana',
    line: 'Alguien excavó esto hace dos mil años. Y lo tapió por dentro.',
    dark: 34,
    grid: [
      '##############################',
      '##############################',
      '#............................#',
      '#.............M..............#',
      '#.P..B..................C..G.#',
      '#########__#########..########',
      '####################..########',
      '####################..########',
      '#............................#',
      '#.........M..................#',
      '#.................G.....L....#',
      '##H##.............############',
      '##H##^^^^^^^^^^^^^############',
      '##H###########################',
      '#............................#',
      '#...........................S#',
      '#...C.....B.................S#',
      '##############__##.......#####',
      '##################^^^^^^^#####',
      '##############################',
    ],
    movers: [
      { kind: 'platform', x: 20, y: 5, w: 2, h: 1.0625, path: [[0, 0], [2, 0]], speed: 0.5, trigger: 0 },
      { kind: 'platform', x: 6, y: 11, w: 2, path: [[0, 0], [10, 0]], speed: 0.7, wait: 40 },
      { kind: 'platform', x: 18, y: 19, w: 7, path: [[0, 0], [0, -2]], speed: 0.5, trigger: 1 },
      { kind: 'spikes', x: 26, y: 16, w: 2, period: 120, up: 45, warn: 25 },
    ],
    notes: [
      '«En la pared hay letras latinas raspadas. Una palabra se repite: CANIT. “Canta”.»',
      '«La trampilla de arriba solo se abre con peso. Él también pesa. Cuidado con dónde lo dejas pisar.» — J.',
    ],
  },
  // 16 · El que canta
  {
    name: 'El que canta',
    line: 'Por fin lo oyes de cerca. Tiene tu voz.',
    dark: 30,
    shade: 0.6,
    grid: [
      '##############################',
      '##############################',
      '#######......................#',
      '#######...M...............M..#',
      '#######.........C.....L....P.#',
      '#######........###############',
      '#######........###############',
      '#######........###############',
      '#######........###############',
      '#######........###############',
      '#######........###############',
      '#..............###############',
      '#..............###############',
      '#..............###############',
      '#........G.....###############',
      '#S.M....===....###############',
      '#S..CG.........###############',
      '#######^^^^^^^^###############',
      '##############################',
      '##############################',
    ],
    movers: [
      { kind: 'platform', x: 12, y: 5, w: 2, path: [[0, 0], [0, 10]], speed: 0.6, wait: 60, light: true },
      { kind: 'spikes', x: 18, y: 4, w: 3, period: 130, up: 45, warn: 25 },
    ],
    notes: [
      '«Aquí está. No tiene forma. Es el filón. Canta para que bajemos, y bajamos. Ventura lo sabía. Por eso cerró.» — J.',
      '«Ya he estado aquí. Reconozco mi letra en las notas. No recuerdo haberlas escrito.»',
    ],
  },
  // 17 · Sin luz
  {
    name: 'Sin luz',
    line: 'Tu lámpara se apagó sola al pasar junto a él. Solo quedan bengalas.',
    dark: 24,
    lampOut: true,
    grid: [
      '##############################',
      '##############################',
      '#............................#',
      '#S......M....................#',
      '#S........G............F.....#',
      '##############.===.########H##',
      '##############^^^^^########H##',
      '###########################H##',
      '#..........................H.#',
      '#...................M......H.#',
      '#....F..................G..H.#',
      '##H#######.===.###############',
      '##H#######^^^^^###############',
      '##H###########################',
      '#.H..........................#',
      '#.H.......M..................#',
      '#.H...G.......C..........F.P.#',
      '##################.===.#######',
      '##################^^^^^#######',
      '##############################',
    ],
    movers: [
      { kind: 'spikes', x: 19, y: 10, w: 3, period: 140, up: 50, warn: 28 },
    ],
    notes: [
      '«Cuando no veas nada, cuenta sus pasos. Da siete y se para. Da siete y se para.» — J.',
    ],
  },
  // 18 · La cuerda
  {
    name: 'La cuerda',
    line: 'Arriba. Siempre arriba. No mires abajo: algo sube detrás.',
    dark: 30,
    shade: 0.6,
    grid: [
      '##############################',
      '##############################',
      '##############################',
      '#H....................M.....S#',
      '#H............G.............S#',
      '#H############################',
      '#H############################',
      '#H############################',
      '#H############################',
      '#H..M........................#',
      '#H.G.....................C...#',
      '######..........###########H##',
      '######^^^^^^^^^^###########H##',
      '###########################H##',
      '###########################H##',
      '#.......................M..H.#',
      '#.P..C......L..........G...H.#',
      '##############################',
      '##############################',
      '##############################',
    ],
    movers: [
      { kind: 'spikes', x: 8, y: 16, w: 3, period: 130, up: 50, warn: 25 },
      { kind: 'spikes', x: 17, y: 16, w: 3, period: 130, up: 50, warn: 25, phase: 65 },
      { kind: 'platform', x: 6, y: 11, w: 2, path: [[0, 0], [8, 0]], speed: 0.7, wait: 40, light: true },
      { kind: 'spikes', x: 20, y: 10, w: 3, period: 120, up: 45, warn: 25 },
      { kind: 'spikes', x: 9, y: 4, w: 3, period: 120, up: 45, warn: 25 },
      { kind: 'spikes', x: 17, y: 4, w: 3, period: 120, up: 45, warn: 25, phase: 60 },
    ],
    notes: [
      '«La cuerda del montacargas baja hasta el filón. Algo tira de ella desde abajo, despacio, cada noche.»',
      '«No te pares en las escaleras. Ahí es donde te alcanza.» — J.',
    ],
  },
  // 19 · Las Ánimas
  {
    name: 'Las Ánimas',
    line: 'Cuarenta hombres bajaron. Cuarenta sombras suben contigo.',
    dark: 28,
    shade: 0.62,
    leverTime: 840,
    grid: [
      '##############################',
      '##############################',
      '#............................#',
      '#..............M............S#',
      '#....K............C.....G...S#',
      '##H#######........############',
      '##H#######^^^^^^^^############',
      '##H###########################',
      '#.H..........................#',
      '#.H...M.................M....#',
      '#.H........C..........G..L...#',
      '#############.==..==.######H##',
      '#############^^^^^^^^######H##',
      '###########################H##',
      '#.......X..................H.#',
      '#.......X...........M......H.#',
      '#.P.TC..X..B.G.............H.#',
      '###############__#.......#####',
      '##################^^^^^^^#####',
      '##############################',
    ],
    movers: [
      { kind: 'platform', x: 26, y: 2, w: 1, h: 3, path: [[0, 0], [0, -3]], speed: 1, trigger: 0 },
      { kind: 'platform', x: 18, y: 19, w: 7, path: [[0, 0], [0, -2]], speed: 0.5, trigger: 1 },
      { kind: 'spikes', x: 7, y: 10, w: 3, period: 120, up: 45, warn: 25 },
      { kind: 'platform', x: 10, y: 5, w: 2, path: [[0, 0], [6, 0]], speed: 0.7, wait: 40, light: true },
      { kind: 'spikes', x: 21, y: 4, w: 3, period: 120, up: 45, warn: 25, phase: 60 },
    ],
    notes: [
      '«Ventura. El capataz. Bajó a sellar el filón con dinamita y el filón lo selló a él.»',
      '«Las sombras no son el monstruo. Son los que bajaron. Te siguen porque eres el único que sabe subir.»',
      '«Si llegas arriba, no mires el nombre de la lápida.» — J.',
    ],
  },
  // 20 · La boca
  {
    name: 'La boca',
    line: 'Arriba se ve el cielo. Abajo, todo lo que viene detrás.',
    dark: 26,
    shade: 0.72,
    grid: [
      '##############################',
      '###........................###',
      '###.S......................###',
      '###.S....G...G..........M..###',
      '###########.===..L.........###',
      '###.............###........###',
      '###........................###',
      '###.................===....###',
      '###..M.....................###',
      '###.........M...###........###',
      '###........................###',
      '###.................===....###',
      '###........................###',
      '###.............###..........#',
      '###.......M...........C......#',
      '###.................####.....#',
      '###^^^^^^^^^^^^^^^.......LFP.#',
      '##############################',
      '##############################',
      '##############################',
    ],
    movers: [
      { kind: 'spikes', x: 16, y: 12, w: 3, period: 130, up: 40, warn: 25, phase: 65 },
      { kind: 'spikes', x: 16, y: 8, w: 3, period: 130, up: 40, warn: 25 },
      { kind: 'spikes', x: 6, y: 3, w: 2, period: 120, up: 40, warn: 25 },
    ],
    notes: [
      '«Si lees esto, ya has subido antes. Y has vuelto a bajar. No subas, Julián.» — J.',
    ],
  },
  // 21 · La grieta
  {
    name: 'La grieta',
    line: 'Al otro lado de la roca, algo brilla.',
    look: 'grutas',
    cinematic: [
      'Una grieta en la roca. Al otro lado, algo brilla.',
      'Por primera vez en días, Julián ve sus propias manos. Están negras de carbón. Y tiemblan.',
      'Hongos, cristales, agua quieta. Todo da luz: una luz fría que no calienta.',
      'Las sombras no te siguen hasta aquí. Eso debería tranquilizarte.',
    ],
    grid: [
      '##############################',
      '#............................#',
      '#........S...................#',
      '#........S...G...............#',
      '#........#########...........#',
      '#............................#',
      '#..................***.......#',
      '#........................C...#',
      '#......................####..#',
      '#............................#',
      '#..................+++.......#',
      '#...............G............#',
      '#..............###...........#',
      '#............................#',
      '#.........****...............#',
      '#............................#',
      '#.....###....................#',
      '#.P.......wwwwwwwwwwww.......#',
      '##############################',
      '##############################',
    ],
    notes: [
      '«Expedición Ferrer, 1880. Encontramos la salida. El agua refleja el cielo. Mañana subimos.»',
    ],
  },
  // 22 · El bosque de setas
  {
    name: 'El bosque de setas',
    line: 'Las setas son blandas y calientes. Como si respiraran.',
    look: 'grutas',
    grid: [
      '##############################',
      '#...........................S#',
      '#.....................G.....S#',
      '#................#############',
      '#............................#',
      '#............................#',
      '#............................#',
      '#............G...............#',
      '#...........###Y.............#',
      '#............................#',
      '#............................#',
      '#............................#',
      '#.......CG...................#',
      '#......###Y..................#',
      '#............................#',
      '#............................#',
      '#............................#',
      '#.P.....^^^^^^^^^^^^^^^^^^^^.#',
      '#####Y########################',
      '##############################',
    ],
    notes: [
      '«Ferrer, 1880. Las setas nos subieron hasta la segunda sala. Rodríguez dice que de noche se mueven.»',
    ],
  },
  // 23 · Cristales que laten
  {
    name: 'Cristales que laten',
    line: 'La luz va y viene, como una respiración muy lenta.',
    look: 'grutas',
    pulse: 150,
    grid: [
      '##############################',
      '#............................#',
      '#............................#',
      '#..........................S.#',
      '#................G.........S.#',
      '#....#######+++***+++#######.#',
      '#............................#',
      '#............................#',
      '#............................#',
      '#.........G............C.....#',
      '###Y##***+++***+++#####......#',
      '#............................#',
      '#.......................##...#',
      '#............................#',
      '#............................#',
      '#............................#',
      '#P.............G.............#',
      '#####***+++***+++***+++####Y##',
      '#####^^^^^^^^^^^^^^^^^^#######',
      '##############################',
    ],
    notes: [
      '«Los cristales laten al mismo ritmo que algo que está debajo. Ferrer dice que es el agua. No es el agua.»',
    ],
  },
  // 24 · El lago quieto
  {
    name: 'El lago quieto',
    line: 'El agua refleja la gruta entera. Y a ti. Y a alguien a tu lado.',
    look: 'grutas',
    pulse: 140,
    grid: [
      '##############################',
      '#............................#',
      '#S...........................#',
      '#S.G.........................#',
      '######.......................#',
      '#.......C...............G.C..#',
      '#......####.+++.***.########H#',
      '#...........................H#',
      '#...........................H#',
      '#.............G.............H#',
      '#............###............H#',
      '#...........................H#',
      '#...........................H#',
      '#...........................H#',
      '#P..........................H#',
      '###ww##w**w++wYw##w**w++w#w###',
      '###wwwwwwwwwwwwwwwwwwwwwwww###',
      '###wwwwwwwwwwwwwwwwwwwwwwww###',
      '##############################',
      '##############################',
    ],
    notes: [
      '«Ferrer. Se quedó mirando el agua toda la noche. Decía que en el reflejo éramos cuarenta y uno.»',
      '«No mires el lago. El de la orilla de enfrente no es tu reflejo. Ya no.» — J.',
    ],
  },
  // 25 · La luz de arriba
  {
    name: 'La luz de arriba',
    line: 'Allí arriba, por fin, luz de día. De verdad.',
    look: 'grutas',
    pulse: 140,
    grid: [
      '##############################',
      '#.............S..............#',
      '#...........G.S..............#',
      '#...........#####H#..........#',
      '#................H...........#',
      '#................H...........#',
      '#................H...........#',
      '#..G.............H...........#',
      '#.###..+++.***.###...........#',
      '#............................#',
      '#............................#',
      '#............................#',
      '#....................CG......#',
      '#.....Y###..........####.....#',
      '#............................#',
      '#............................#',
      '#............................#',
      '#wwwwwwwww....P.....wwwwwwwww#',
      '###########Y######Y###########',
      '##############################',
    ],
    notes: [
      '«Aquí acaba el diario de Ferrer. La última línea está escrita con otra letra: la tuya.» — J.',
    ],
  },
];
