// Pixel art del mundo 3 «16 bits»: Ciudad Engranaje. Paleta propia de 16 colores.
import { bake, type Pattern } from './art';

export const PALETTE3 = [
  '#141420', // 0 casi negro
  '#f8f4ec', // 1 blanco cálido
  '#c8bca8', // 2 piedra clara
  '#8c8070', // 3 piedra
  '#5a5046', // 4 piedra oscura
  '#e0603c', // 5 rojo anaranjado
  '#3c7cd8', // 6 azul
  '#f4c840', // 7 oro
  '#5cac50', // 8 verde
  '#2e6a3e', // 9 verde oscuro
  '#a86c3c', // a madera
  '#f4c8a4', // b piel
  '#6a3c24', // c madera oscura
  '#86d4f4', // d cristal
  '#c44ca4', // e magenta
  '#4e3a78', // f violeta
];

const T: Record<string, Pattern> = {
  cobble: ['22232223', '32223222', '22222222', '23222322', '22322232', '22222222', '32223222', '22232222'],
  paseo: ['33333333', '32323232', '33333333', '23232323', '33333333', '32323232', '33333333', '23232323'],
  building: ['ffffffff', 'f4444444', 'f4dd4dd4', 'f4dd4dd4', 'f4444444', 'f4dd4dd4', 'f4dd4dd4', 'ffffffff'],
  tree: ['..9999..', '.988899.', '98889889', '98988889', '.998899.', '..9cc9..', '...cc...', '..cccc..'],
  lampDay: ['..444...', '.41114..', '..444...', '...4....', '...4....', '...4....', '...4....', '..444...'],
  lampNight: ['..444...', '.47774..', '..444...', '...4....', '...4....', '...4....', '...4....', '..444...'],
  bench: ['........', 'aaaaaaaa', 'cccccccc', 'aaaaaaaa', 'c......c', 'c......c', '........', '........'],
  fountain: ['33333333', '3dddddd3', '3d6dd6d3', '3dd66dd3', '3d6dd6d3', '3dddddd3', '33333333', '.333333.'],
  sundial: ['..3333..', '.322223.', '32272223', '32277223', '32222223', '.322223.', '..3333..', '...33...'],
  doorTower: ['77777777', '7cccccc7', '7caaaac7', '7caaaac7', '7caa7ac7', '7caaaac7', '7caaaac7', '7cccccc7'],
  doorLab: ['66666666', '6dddddd6', '6d6dd6d6', '6dddddd6', '6dddddd6', '6d6dd6d6', '6dddddd6', '66666666'],
  doorWare: ['cccccccc', 'caaaaaac', 'cacaacac', 'caaaaaac', 'caaaaaac', 'cacaacac', 'caaaaaac', 'cccccccc'],
  // Interiores
  lab: ['11111111', '12111121', '11111111', '11122111', '11122111', '11111111', '12111121', '11111111'],
  labWall: ['ffffffff', 'f6666666', 'f6dddddd', 'f6dddddd', 'f6666666', 'f6666666', 'f6666666', 'ffffffff'],
  column: ['.444444.', '43333334', '43222234', '43222234', '43222234', '43222234', '43333334', '.444444.'],
  emitter: ['44444444', '4555555.', '45775555', '45777777', '45777777', '45775555', '4555555.', '44444444'],
  receiver: ['ffffffff', 'f777777f', 'f700007f', 'f706607f', 'f706607f', 'f700007f', 'f777777f', 'ffffffff'],
  receiverOn: ['ffffffff', 'f777777f', 'f711117f', 'f717717f', 'f717717f', 'f711117f', 'f777777f', 'ffffffff'],
  mirrorA: ['33333333', '3....6d3', '3...6d.3', '3..6d..3', '3.6d...3', '36d....3', '3d.....3', '33333333'],
  mirrorB: ['33333333', '3d6....3', '3.d6...3', '3..d6..3', '3...d6.3', '3....d63', '3.....d3', '33333333'],
  planks: ['aaaaaaaa', 'cccccccc', 'aaaaaaaa', 'aaaacaaa', 'aaaaaaaa', 'cccccccc', 'aaaaaaaa', 'acaaaaaa'],
  crate: ['cccccccc', 'c7aaaa7c', 'cacaacac', 'caaccaac', 'caaccaac', 'cacaacac', 'c7aaaa7c', 'cccccccc'],
  goal: ['aaaaaaaa', 'aeaaaaea', 'aaeaaeaa', 'aaaeeaaa', 'aaaeeaaa', 'aaeaaeaa', 'aeaaaaea', 'aaaaaaaa'],
  wareWall: ['44444444', '43334333', '43334333', '44444444', '33433343', '33433343', '44444444', '43334333'],
  stone: ['33333333', '32223222', '33333333', '22232223', '33333333', '32223222', '33333333', '22232223'],
  machine: ['44444444', '47777774', '47333374', '47377374', '47377374', '47333374', '47777774', '44444444'],
  machineOn: ['44444444', '47777774', '47711774', '47177174', '47177174', '47711774', '47777774', '44444444'],
  exit: ['00000000', '04444440', '04000040', '04000040', '04000040', '04000040', '04000040', '04000040'],
};

const S: Record<string, Pattern> = {
  leoDown: ['..cccc..', '.cbbbbc.', '.b0bb0b.', '.bbbbbb.', '..5555..', '.555555.', '.b6666b.', '..6..6..'],
  leoUp: ['..cccc..', '.cccccc.', '.cccccc.', '.bbbbbb.', '..5555..', '.555555.', '.b6666b.', '..6..6..'],
  leoLeft: ['..cccc..', '.cccbbc.', '.c0bbbb.', '.bbbbbb.', '..5555..', '..5555..', '..6666..', '..6.6...'],
  leoRight: ['..cccc..', '.cbbccc.', '.bbbb0c.', '.bbbbbb.', '..5555..', '..5555..', '..6666..', '...6.6..'],
  inventor: ['.111111.', '.1dd1dd.', '.bbbbbb.', '..b00b..', '.111111.', '11eeee11', '.111111.', '..4..4..'],
  inventorSleep: ['.111111.', '.1dd1dd.', '.bbbbbb.', '..b44b..', '.111111.', '11eeee11', '.111111.', '..4..4..'],
};

/** Estatuas con los ojos encendidos o apagados */
const STATUE: Record<string, Pattern> = {
  u: ['.3....3.', '.333333.', '33EE3EE3', '33333333', '.333333.', '.333333.', '..3333..', '.444444.'],
  g: ['........', '.33..33.', '3EE33EE3', '33333333', '33333333', '.333333.', '.3....3.', '44444444'],
  c: ['.3....3.', '.33..33.', '.333333.', '.3E33E3.', '.333333.', '..3333..', '.333333.', '.444444.'],
  f: ['3......3', '33....33', '.333333.', '.3E33E3.', '..3333..', '...33...', '..3333..', '.444444.'],
};
export const statue = (id: string, lit: boolean) =>
  bake(STATUE[id].map((r) => r.replaceAll('E', lit ? '7' : '4')), PALETTE3);

export const tile3 = (name: keyof typeof T) => bake(T[name], PALETTE3);
export const sprite3 = (name: keyof typeof S) => bake(S[name], PALETTE3);
