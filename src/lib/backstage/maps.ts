// Mapas de «Entre Bastidores» (20 × 18 casillas, como la parte 1)
//
// Pantalla 1 · Carga infinita
//   # muro   . suelo   b barra de progreso   X salida (al 100 %)   P compuerta del registro
//   t s m    huecos del registro (texturas, sonido, mapa)   c consejo de carga   N la Ruedecita
//   Los archivos (cajas con tipo) van aparte, en FILES.
//
// El puzle se generó y comprobó con búsqueda en anchura: 50 pasos y 21 empujes como mínimo.

export type Screen = 'carga';

export const MAPS: Record<Screen, string[]> = {
  carga: [
    '####################',
    '####################',
    '##bbbbbbbbbbbbbbX###',
    '##...............###',
    '##...............###',
    '##...............###',
    '############P#######',
    '#######.t.....m#####',
    '#####.....s....#####',
    '#####....#.#...c####',
    '#######..#..#..#####',
    '#####.###..#...#####',
    '####c..........#####',
    '#####......#.#.#####',
    '#####.#..#...#.#####',
    '###########N########',
    '####################',
    '####################',
  ],
};

export type FileId = 'T' | 'S' | 'M';
/** Archivos que faltan: posición inicial y hueco que les corresponde */
export const FILES: Record<FileId, { start: [number, number]; slot: [number, number]; name: string }> = {
  T: { start: [6, 9], slot: [8, 7], name: 'texturas' },
  S: { start: [8, 9], slot: [10, 8], name: 'sonido' },
  M: { start: [6, 13], slot: [14, 7], name: 'mapa' },
};
export const FILE_IDS = ['T', 'S', 'M'] as const;

export const START1 = { x: 10, y: 14 };

// Pantalla 2 · Menú principal roto
//   # bloque de interfaz roto   L logo (le faltan letras)   . suelo
//   J JUGAR (tachado)   O OPCIONES   C CRÉDITOS   S SALIR
//   El cursor persigue a Leo: un paso por cada movimiento suyo, primero por el eje en que está más lejos.
//
// Comprobado con búsqueda en anchura (Leo, cursor, letras llevadas y entregadas): 102 movimientos como mínimo.
export const MENU: string[] = [
  '####################',
  '###LLLLLLLLLLLLLL###',
  '###LLLLLLLLLLLLLL###',
  '###LLLLLLLLLLLLLL###',
  '#..................#',
  '#....#..#.........##',
  '#..#..JJJJJJJJ...#.#',
  '#..###.............#',
  '###..#....#.#....###',
  '#.#...OOOOOOOO.....#',
  '#...##........##...#',
  '##.#.##..#......#..#',
  '#.....CCCCCCCC.....#',
  '#.#..#....#..#....##',
  '#......#.#...##....#',
  '#.....SSSSSSSS....##',
  '#..................#',
  '####################',
];
export type LetterId = 'U' | 'D' | 'G';
/** Letras caídas del logo «FUERA DE JUEGO» y su posición en el texto */
export const LETTERS: Record<LetterId, { pos: [number, number]; index: number }> = {
  U: { pos: [17, 9], index: 1 },
  D: { pos: [7, 11], index: 6 },
  G: { pos: [11, 7], index: 12 },
};
export const LETTER_IDS = ['U', 'D', 'G'] as const;
export const LOGO = 'FUERA DE JUEGO';
export const START2 = { x: 10, y: 16 };
export const CURSOR_START: [number, number] = [18, 4];
/** Fila bajo el logo: al pisarla, las letras que llevas vuelan a su sitio */
export const underLogo = (x: number, y: number) => y === 4 && x >= 3 && x <= 16;

/** Paso del cursor hacia Leo: primero por el eje en que está más lejos; si choca, prueba el otro */
export function cursorStep(c: [number, number], leo: [number, number], free: (x: number, y: number) => boolean): [number, number] {
  const dx = leo[0] - c[0];
  const dy = leo[1] - c[1];
  const h: [number, number] | null = dx ? [Math.sign(dx), 0] : null;
  const v: [number, number] | null = dy ? [0, Math.sign(dy)] : null;
  for (const o of Math.abs(dx) > Math.abs(dy) ? [h, v] : [v, h]) {
    if (!o) continue;
    const n: [number, number] = [c[0] + o[0], c[1] + o[1]];
    if (free(...n)) return n;
  }
  return c;
}

// Pantalla 3 · Opciones
//   l panel con el nombre del ajuste   = carril (se pisa)   A altavoz   Z cartel en «???»
//   K botón APLICAR   X salida (se abre al aplicar bien)
//   Cada carril tiene su tirador: se empuja a izquierda o derecha y su posición es el valor.
export const OPTIONS: string[] = [
  '####################',
  '####################',
  '#A................A#',
  '#..................#',
  '#llllll.=====......#',
  '#..................#',
  '#..................#',
  '#llllll.=====.....Z#',
  '#..................#',
  '#..................X',
  '#llllll.==.........#',
  '#..................#',
  '#..................#',
  '#llllll.==.........#',
  '#..................#',
  '#.................A#',
  '#.......KK.........#',
  '####################',
];
export type SettingId = 'brillo' | 'volumen' | 'idioma' | 'subtitulos';
/** Ajustes: fila del carril, número de posiciones y cómo se muestra cada valor */
export const SETTINGS: { id: SettingId; label: string; row: number; values: string[] }[] = [
  { id: 'brillo', label: 'BRILLO', row: 4, values: ['0', '1', '2', '3', '4'] },
  { id: 'volumen', label: 'VOLUMEN', row: 7, values: ['0', '1', '2', '3', '4'] },
  { id: 'idioma', label: 'IDIOMA', row: 10, values: ['ES', '???'] },
  { id: 'subtitulos', label: 'SUBTITULOS', row: 13, values: ['NO', 'SI'] },
];
export const RAIL_X = 8;
/** Valores al entrar: poca luz, volumen a tope, español y sin subtítulos */
export const OPTIONS_START = [1, 4, 0, 0];
/** La configuración que el juego acepta: brillo 1, volumen 3 (tres altavoces), idioma ??? y subtítulos */
export const OPTIONS_GOAL = [1, 3, 1, 1];
export const START3 = { x: 14, y: 15 };

/** El idioma «???»: cada letra se convierte en un símbolo */
const GLYPHS = '◆▲■●▼◇△□○▽';
export const scramble = (text: string) =>
  [...text].map((c, i) => (/[a-záéíóúñü]/i.test(c) ? GLYPHS[(c.toLowerCase().charCodeAt(0) + i) % GLYPHS.length] : c)).join('');

// Pantalla 4 · Consola de depuración
//   T terminal de inicio de sesión   / comentario del programador   k (aparte) llave en el cofre
//   Teclado del suelo: E L O B U G D (letras), ~ BORRAR, ! ENTER
//   Teletransporte: a X−   b X+   c Y−   d Y+   e EJECUTAR   X salida (se abre con la llave)
export const DEBUG: string[] = [
  '####################',
  '####################',
  '#..............#####',
  '#T.............#...#',
  '#..............#...X',
  '#..............#...#',
  '#..../.........#####',
  '#..................#',
  '#..................#',
  '#......ab.cd.e.....#',
  '#..................#',
  '#..................#',
  '#.............../..#',
  '#.E.L.O.B.U.G.D....#',
  '#..................#',
  '#../...~...!.......#',
  '#..................#',
  '####################',
];
export const PASSWORD = 'LEO';
/** El cofre de pruebas: x = 0x10, y = la mitad de x menos cinco */
export const DEBUG_KEY: [number, number] = [16, 3];
export const START4 = { x: 10, y: 16 };
export const TP_START: [number, number] = [10, 10];
export const COMMENTS: Record<string, string[]> = {
  '5,6': ['// TODO: quitar el cofre de pruebas antes de publicar.', '// Lo dejé en x = 0x10.'],
  '16,12': ['// La y del cofre: la mitad de x, menos cinco.', '// (No me juzguéis, era muy tarde.)'],
  '3,15': ['// Contraseña de desarrollador = el nombre del jugador 1.', '// Así no se me olvida.'],
};

// Pantalla 5 · Créditos
//   Los créditos suben un renglón cada dos movimientos de Leo. Solo se pisan letras (o '_'):
//   el espacio entre nombres es vacío. Si el scroll te saca por arriba o pisas un hueco, vuelven a empezar.
//   Comprobado con búsqueda en anchura: 118 movimientos como mínimo, pasando por LEO (fila 33).
export const CREDITS: string[] = [
  '   ______________   ',
  '   ___CREDITOS___   ',
  '   ______________   ',
  '  DIRECCION_  ANA_P ',
  '     ____GUION_____ ',
  '    MARC PRO        ',
  '      LUC    _ARTE_ ',
  '        SPRITE_SANZ ',
  '  ____MUSICA_____   ',
  '     _CHIP_TUNE__   ',
  '  _____SONIDO______ ',
  ' LA_RUE      PRUEBA ',
  '       EL_CURS      ',
  '  IDIOMA ???        ',
  ' DEPURACI      EL_E ',
  ' PERSO  REY_PIX     ',
  ' LA_INVEN           ',
  '    EL_A     DECORA ',
  '  _RUNAS_SA__       ',
  '   ILUMINACI        ',
  '         FAROLAS_SL ',
  '           PRODUCCI ',
  '    __NADIE___      ',
  '    __MARKETING___  ',
  '        TAMPOCO_    ',
  '      GRAC    _TI__ ',
  '     __DIRECCION___ ',
  '  __ANA_PIXEL__     ',
  '        ___GUION___ ',
  '  __MARCOS_BIT___   ',
  '     PRO       LUCI ',
  ' __ARTE__ SPRIT     ',
  '    MUSICA_         ',
  '  LEO   CHIP_TUNE   ',
  '   __SONIDO___      ',
  '   LA_RUEDE   PRU   ',
  '   EL_CURS   IDIOMA ',
  '  ___???___   DEPUR ',
  '     ___EL_ERROR___ ',
  ' ____PERSONAJES____ ',
  '       REY_P LA_INV ',
  '    EL_ANCIAN  DECO ',
  '      __RUNAS_SA___ ',
  '  ILU  FAROL PRODUC ',
  '   NADI        MARK ',
  '  ___TAMPOCO____    ',
  '  _GRACIAS_A__      ',
  '     ______TI______ ',
  '  DIRECCI      ANA  ',
  '  _GUION_      MAR  ',
  '  PROGRA  LUCIA     ',
  '   _ARTE_           ',
  '  SPR          MUSI ',
  '  ____CHIP_TUNE____ ',
  '            SONIDO_ ',
  ' LA_RUEDEC     PRUE ',
  '  EL_  __IDIOMAS___ ',
  '    ____???____     ',
  '    ____FIN_____    ',
  '    GRACIAS_POR_    ',
];
export const CREDITS_LEO = { row: 33, from: 2, to: 4 };
export const START5 = { x: 9, y: 2 };
/** Movimientos de Leo por cada renglón que suben los créditos */
export const SCROLL_EVERY = 2;
export const CREDITS_VIEW = 18;
export const creditsOffset = (turns: number) => Math.min(Math.floor(turns / SCROLL_EVERY), CREDITS.length - CREDITS_VIEW);

// Pantalla 6 · Memoria de guardado (final)
//   M monitor con la partida   ? byte suelto (pista)   S GUARDAR
//   Plataformas de datos: a ANA  b LEO  c BIT · 1 2 3 4 (mundo) · d 3:07  e 3:08  f 3:09
//   La corrupción nace en CORRUPTION y avanza una casilla (distancia Manhattan) cada CORRUPT_EVERY pasos.
//   Comprobado con búsqueda en anchura: 41 pasos como mínimo y solo 3 de margen
//   (pisar otra opción del mismo dato la sustituye, así que hay que esquivar las equivocadas).
export const MEMORY: string[] = [
  '####################',
  '####################',
  '##MMMMMMMMMMMMMMMM##',
  '##MMMMMMMMMMMMMMMM##',
  '##MMMMMMMMMMMMMMMM##',
  '#..................#',
  '#.?..............?.#',
  '#..a.b.c....1.2.3.4#',
  '#..................#',
  '#...##........##...#',
  '#...##........##...#',
  '#..................#',
  '#..................#',
  '#..d.e.f......S....#',
  '#..........?.......#',
  '#..................#',
  '#..................#',
  '####################',
];
export type FieldId = 'jugador' | 'mundo' | 'hora';
export const PADS6: Record<string, { field: FieldId; value: string }> = {
  a: { field: 'jugador', value: 'ANA' },
  b: { field: 'jugador', value: 'LEO' },
  c: { field: 'jugador', value: 'BIT' },
  '1': { field: 'mundo', value: '1' },
  '2': { field: 'mundo', value: '2' },
  '3': { field: 'mundo', value: '3' },
  '4': { field: 'mundo', value: '4' },
  d: { field: 'hora', value: '3:07' },
  e: { field: 'hora', value: '3:08' },
  f: { field: 'hora', value: '3:09' },
};
export const SAVE_GOAL: Record<FieldId, string> = { jugador: 'LEO', mundo: '4', hora: '3:08' };
export const START6 = { x: 10, y: 16 };
export const CORRUPTION: [number, number] = [1, 11];
export const CORRUPT_EVERY = 3;
/** Turno en que la corrupción alcanza una casilla */
export const corruptAt = (x: number, y: number) => CORRUPT_EVERY * (Math.abs(x - CORRUPTION[0]) + Math.abs(y - CORRUPTION[1]));
export const BYTES: Record<string, string[]> = {
  '2,6': ['BYTE 0x01 recuperado:', '«JUGADOR = el nombre que no debería estar en los créditos».'],
  '17,6': ['BYTE 0x02 recuperado:', '«MUNDO = el número de esta pantalla, menos dos».'],
  '11,14': ['BYTE 0x03 recuperado:', '«HORA = un minuto después de la primera vez que Leo encendió la consola, a las 3:07».'],
};
