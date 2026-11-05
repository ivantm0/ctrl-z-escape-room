// Pixel art de «Entre Bastidores». Cada pantalla tiene su paleta; todas, un poco rotas.
import { bake, type Pattern } from '$lib/pixel/art';

/** Pantalla 1: azul de BIOS, como un ordenador que no termina de arrancar */
export const BIOS = [
  '#000000', // 0 negro
  '#ffffff', // 1 blanco
  '#0000aa', // 2 azul
  '#5555ff', // 3 azul claro
  '#55ffff', // 4 cian
  '#ffff55', // 5 amarillo
  '#aaaaaa', // 6 gris
  '#555555', // 7 gris oscuro
  '#ff5555', // 8 rojo
  '#55ff55', // 9 verde
  '#00006a', // a azul noche
  '#f4c8a4', // b piel
  '#6a3c24', // c pelo
  '#aa00aa', // d magenta
  '#aa5500', // e marrón
  '#ffaaff', // f rosa
];

const T: Record<string, Pattern> = {
  floor: ['22222222', '22222222', '22232222', '22222222', '22222222', '22222222', '22222232', '22222222'],
  wall: ['aaaaaaaa', 'a4444444', 'a4aaaaaa', 'a4aaaaaa', 'a4aaaaaa', 'a4aaaaaa', 'a4aaaaaa', 'aaaaaaaa'],
  barEmpty: ['66666666', '70000007', '70000007', '70000007', '70000007', '70000007', '70000007', '66666666'],
  barFull: ['66666666', '75555557', '75555557', '75555557', '75555557', '75555557', '75555557', '66666666'],
  exitShut: ['66666666', '67777776', '67000076', '67000076', '67000076', '67000076', '67777776', '66666666'],
  exitOpen: ['55555555', '54444445', '54111145', '54111145', '54111145', '54111145', '54444445', '55555555'],
  gate: ['77777777', '76767676', '77777777', '67676767', '77777777', '76767676', '77777777', '67676767'],
  gateOpen: ['22222222', '27222272', '22222222', '22222222', '22222222', '22222222', '27222272', '22222222'],
  sign: ['66666666', '61111116', '61777716', '61111116', '61777116', '61111116', '66666666', '...66...'],
  slotT: ['55.55.55', '5......5', '........', '5......5', '5......5', '........', '5......5', '55.55.55'],
  slotS: ['99.99.99', '9......9', '........', '9......9', '9......9', '........', '9......9', '99.99.99'],
  slotM: ['88.88.88', '8......8', '........', '8......8', '8......8', '........', '8......8', '88.88.88'],
  fileT: ['55555...', '511115..', '5111115.', '51111115', '51111115', '51111115', '51111115', '55555555'],
  fileS: ['99999...', '911119..', '9111119.', '91111119', '91111119', '91111119', '91111119', '99999999'],
  fileM: ['88888...', '811118..', '8111118.', '81111118', '81111118', '81111118', '81111118', '88888888'],
  dead: ['d.......', '........', '....f...', '........', '........', '.d......', '........', '......f.'],
};

const S: Record<string, Pattern> = {
  leoDown: ['..cccc..', '.cbbbbc.', '.b0bb0b.', '.bbbbbb.', '..8888..', '.888888.', '.b3333b.', '..3..3..'],
  leoUp: ['..cccc..', '.cccccc.', '.cccccc.', '.bbbbbb.', '..8888..', '.888888.', '.b3333b.', '..3..3..'],
  leoLeft: ['..cccc..', '.cccbbc.', '.c0bbbb.', '.bbbbbb.', '..8888..', '..8888..', '..3333..', '..3.3...'],
  leoRight: ['..cccc..', '.cbbccc.', '.bbbb0c.', '.bbbbbb.', '..8888..', '..8888..', '..3333..', '...3.3..'],
  // La Ruedecita: el icono de carga, con cara (dos fotogramas)
  wheelA: ['..1111..', '.1....6.', '1.0..0.7', '1......7', '6..00..7', '6......7', '.7....7.', '..7777..'],
  wheelB: ['..6777..', '.6....7.', '6.0..0.7', '7......1', '7..00..1', '7......1', '.7....1.', '..7111..'],
};

export const tileB = (name: keyof typeof T) => bake(T[name], BIOS);
export const spriteB = (name: keyof typeof S) => bake(S[name], BIOS);

/** Letras de 3 × 5 píxeles para los textos dentro de la pantalla */
const FONT: Record<string, string> = {
  A: '111101111101101', B: '110101110101110', C: '111100100100111', D: '110101101101110', E: '111100111100111',
  F: '111100111100100', G: '111100101101111', H: '101101111101101', I: '111010010010111', J: '001001001101111',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '111101101101111',
  P: '111101111100100', Q: '111101101111001', R: '110101110101101', S: '111100111001111', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111',
  '4': '101101111001001', '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111',
  '9': '111101111001111', '%': '101001010100101', '.': '000000000000010', ':': '000010000010000', '-': '000000111000000',
  '!': '010010010000010', '=': '000111000111000', _: '000000000000111', '+': '000010111010000', '<': '001010100010001', '?': '111001010000010', '/': '001001010100100',
};
export function drawText(g: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, scale = 1) {
  g.fillStyle = color;
  [...text.toUpperCase()].forEach((ch, i) => {
    const f = FONT[ch];
    if (f)
      [...f].forEach((p, k) => p === '1' && g.fillRect(x + (i * 4 + (k % 3)) * scale, y + Math.floor(k / 3) * scale, scale, scale));
  });
}

/** Pantalla 2: menú principal de colores chillones, con trozos de interfaz rotos */
export const MENU_PAL = [
  '#000000', // 0 negro
  '#ffffff', // 1 blanco
  '#1b1035', // 2 fondo
  '#4a6cff', // 3 azul
  '#ff4fa0', // 4 rosa
  '#ffd23f', // 5 amarillo
  '#3ee0d0', // 6 turquesa
  '#7a7a9a', // 7 gris
  '#ff5555', // 8 rojo
  '#6cff6c', // 9 verde
  '#120a24', // a fondo oscuro
  '#f4c8a4', // b piel
  '#6a3c24', // c pelo
  '#2d1b5a', // d violeta
  '#ff9a3c', // e naranja
  '#b48cff', // f lila
];
const TM: Record<string, Pattern> = {
  floor: ['22222222', '2222222d', '22222222', '22222222', '22222222', '22222222', '2d222222', '22222222'],
  wall: ['ffffffff', 'fdddddd4', 'fd4dddd4', 'fdddd4d4', 'fddddd04', 'fd0dddd4', 'fdddddd4', '44444444'],
  wallCrack: ['ffff.fff', 'fddd.dd4', 'fd4dd.d4', 'fdd.d4d4', 'fdd.dd04', 'fd0.ddd4', 'fdd.ddd4', '444.4444'],
  logo: ['aaaaaaaa', 'aaaaaaaa', 'aaaaaaaa', 'aaaaaaaa', 'aaaaaaaa', 'aaaaaaaa', 'aaaaaaaa', 'aaaaaaaa'],
  letter: ['.555555.', '55555555', '55555555', '55555555', '55555555', '55555555', '55555555', '.555555.'],
};
export const tileM = (name: keyof typeof TM) => bake(TM[name], MENU_PAL);
export const spriteM = (name: keyof typeof S | 'cursor' | 'cursorClick') => bake(name === 'cursor' ? CURSOR : name === 'cursorClick' ? CURSOR_CLICK : S[name], MENU_PAL);
const CURSOR: Pattern = ['0.......', '010.....', '0110....', '01110...', '011110..', '0111000.', '0100110.', '00..00..'];
const CURSOR_CLICK: Pattern = ['0.......', '040.....', '0440....', '04440...', '044440..', '0444000.', '0400440.', '00..00..'];

/** Pantalla 3: menú de opciones gris, frío y algo desajustado */
export const OPT_PAL = [
  '#000000', // 0 negro
  '#ffffff', // 1 blanco
  '#3a3d45', // 2 suelo
  '#5a6ea0', // 3 azul grisáceo
  '#8a8f9c', // 4 gris claro
  '#ffd23f', // 5 amarillo
  '#4fc3f7', // 6 azul
  '#2a2c33', // 7 gris oscuro
  '#ff5555', // 8 rojo
  '#6cff6c', // 9 verde
  '#1e2026', // a casi negro
  '#f4c8a4', // b piel
  '#6a3c24', // c pelo
  '#c792ea', // d lila
  '#ff9a3c', // e naranja
  '#e0e3ea', // f blanco roto
];
const TO: Record<string, Pattern> = {
  floor: ['22222222', '22222222', '22222222', '22222227', '22222222', '22222222', '22222222', '27222222'],
  wall: ['77777777', '74444447', '74777747', '74777747', '74777747', '74777747', '74444447', '77777777'],
  panel: ['aaaaaaaa', 'a7777777', 'a7777777', 'a7777777', 'a7777777', 'a7777777', 'a7777777', 'aaaaaaaa'],
  rail: ['22222222', '22222222', '24444442', '44444444', '44444444', '24444442', '22222222', '22222222'],
  handle: ['.555555.', '55111155', '55555555', '55555555', '55555555', '55555555', '55111155', '.555555.'],
  speaker: ['44444444', '47777774', '47044074', '47400474', '47400474', '47044074', '47777774', '44444444'],
  sign: ['dddddddd', 'd111111d', 'd1a1a11d', 'd111111d', 'd1a11a1d', 'd111111d', 'dddddddd', '...dd...'],
  apply: ['99999999', '9aaaaaa9', '9a9999a9', '9a9999a9', '9a9999a9', '9a9999a9', '9aaaaaa9', '99999999'],
  exitShut: ['44444444', '47777774', '47aaaa74', '47aaaa74', '47aaaa74', '47aaaa74', '47aaaa74', '44444444'],
  exitOpen: ['66666666', '61111116', '61111116', '61111116', '61111116', '61111116', '61111116', '66666666'],
};
export const tileO = (name: keyof typeof TO) => bake(TO[name], OPT_PAL);
export const spriteO = (name: keyof typeof S) => bake(S[name], OPT_PAL);

/** Pantalla 4: terminal de fósforo verde */
export const TERM_PAL = [
  '#000000', // 0 negro
  '#d8ffd8', // 1 blanco verdoso
  '#001a08', // 2 suelo
  '#0f4a22', // 3 verde oscuro
  '#00ff66', // 4 verde fósforo
  '#ffcc00', // 5 ámbar
  '#00aa44', // 6 verde medio
  '#06240f', // 7 verde noche
  '#ff4444', // 8 rojo
  '#66ffaa', // 9 verde claro
  '#000c04', // a casi negro
  '#f4c8a4', // b piel
  '#6a3c24', // c pelo
  '#00ffee', // d cian
  '#ff8800', // e naranja
  '#88ff99', // f verde pálido
];
const TT: Record<string, Pattern> = {
  floor: ['22222222', '22222222', '22222222', '22272222', '22222222', '22222222', '22222222', '22222222'],
  wall: ['66666666', '63333336', '63777736', '63777736', '63777736', '63777736', '63333336', '66666666'],
  terminal: ['44444444', '40000004', '40400004', '40044004', '40400004', '40000004', '44444444', '.444444.'],
  key: ['33333333', '3......3', '3..4...3', '3.4.4..3', '3......3', '3......3', '3......3', '33333333'],
  pad: ['66666666', '6aaaaaa6', '6aaaaaa6', '6aaaaaa6', '6aaaaaa6', '6aaaaaa6', '6aaaaaa6', '66666666'],
  padOff: ['77777777', '7aaaaaa7', '7aaaaaa7', '7aaaaaa7', '7aaaaaa7', '7aaaaaa7', '7aaaaaa7', '77777777'],
  comment: ['22222222', '22222222', '22922922', '22922922', '29229222', '29229222', '22222222', '22222222'],
  chest: ['........', '.555555.', '5eeeeee5', '55555555', '5ee55ee5', '5eeeeee5', '55555555', '........'],
  exitShut: ['66666666', '67777776', '67888876', '67877876', '67877876', '67888876', '67777776', '66666666'],
  exitOpen: ['44444444', '49999994', '49111194', '49111194', '49111194', '49111194', '49999994', '44444444'],
};
export const tileT = (name: keyof typeof TT) => bake(TT[name], TERM_PAL);
export const spriteT = (name: keyof typeof S) => bake(S[name], TERM_PAL);

/** Pantalla 5: sepia de película vieja */
export const SEPIA_PAL = [
  '#1a120a', // 0 casi negro
  '#f3e6c8', // 1 papel claro
  '#2b1d12', // 2 fondo
  '#5c4430', // 3 marrón
  '#a8875c', // 4 ocre
  '#e8d5b0', // 5 pergamino
  '#7a5a3a', // 6 madera
  '#3d2a1a', // 7 marrón oscuro
  '#9c4a2a', // 8 rojizo
  '#c9a66b', // 9 dorado
  '#120c06', // a negro
  '#e0c09a', // b piel
  '#4a2e1a', // c pelo
  '#d9b98a', // d arena
  '#b86a3a', // e teja
  '#fff4dc', // f blanco
];
export const spriteS = (name: keyof typeof S) => bake(S[name], SEPIA_PAL);

/** Pantalla 6: todos los colores anteriores mezclados y rotos */
export const GLITCH_PAL = [
  '#000000', // 0 negro
  '#ffffff', // 1 blanco
  '#0b0718', // 2 fondo
  '#1d1438', // 3 violeta
  '#3ee0d0', // 4 turquesa
  '#ffd23f', // 5 amarillo
  '#0000aa', // 6 azul BIOS
  '#00ff66', // 7 verde terminal
  '#ff4fa0', // 8 rosa
  '#e8d5b0', // 9 sepia
  '#05030c', // a casi negro
  '#f4c8a4', // b piel
  '#6a3c24', // c pelo
  '#ff5555', // d rojo
  '#8a8f9c', // e gris
  '#c792ea', // f lila
];
export const spriteG = (name: keyof typeof S) => bake(S[name], GLITCH_PAL);
