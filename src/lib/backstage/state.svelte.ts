import { browser } from '$app/environment';
import { CURSOR_START, FILES, OPTIONS_START, START1, START2, START3, START4, START5, START6, TP_START, type FieldId, type FileId, type LetterId } from './maps';

// Progreso de «Entre Bastidores» (Fuera de Juego 2): seis pantallas, una detrás de otra
export type Level = 1 | 2 | 3 | 4 | 5 | 6;
export const LEVEL_NAMES: Record<Level, string> = {
  1: 'Carga infinita',
  2: 'Menú principal',
  3: 'Opciones',
  4: 'Consola de depuración',
  5: 'Créditos',
  6: 'Memoria de guardado',
};
/** Pantallas ya construidas */
export const LEVELS_READY = 6;

export const STEPS1 = ['archivos', 'carga'] as const;
export const STEPS2 = ['letras', 'opciones'] as const;
export const STEPS3 = ['ajustes', 'consola'] as const;
export const STEPS4 = ['login', 'llave', 'depurar'] as const;
export const STEPS5 = ['nombre', 'fin'] as const;
export const STEPS6 = ['datos', 'guardar'] as const;
export type Step = (typeof STEPS1)[number] | (typeof STEPS2)[number] | (typeof STEPS3)[number] | (typeof STEPS4)[number] | (typeof STEPS5)[number] | (typeof STEPS6)[number];
export const stepsOf = (level: Level): readonly Step[] =>
  level === 1 ? STEPS1 : level === 2 ? STEPS2 : level === 3 ? STEPS3 : level === 4 ? STEPS4 : level === 5 ? STEPS5 : STEPS6;

const SOLUTION2 =
  'derecha ×4, arriba, derecha, arriba ×4, izquierda ×2, arriba, izquierda ×5, abajo, izquierda, arriba, derecha ×3, abajo, derecha ×4, abajo ×2, derecha, abajo ×3, derecha ×2, izquierda ×12, arriba ×2, izquierda, arriba ×3, abajo, izquierda ×2, arriba ×2, abajo ×2, derecha, abajo ×4, derecha ×11, arriba, derecha, arriba ×3, derecha ×2, arriba ×3, izquierda, arriba ×2, izquierda ×5, derecha ×3 y arriba ×3';

const SOLUTION1 =
  'arriba ×2, izquierda ×5, abajo, derecha ×2, abajo, derecha, arriba, izquierda, arriba, derecha ×2, abajo, derecha, arriba ×5, izquierda ×3, abajo ×2, derecha, arriba, izquierda, arriba, derecha, izquierda ×3, abajo, derecha ×2, abajo, derecha, arriba ×2, derecha, arriba y derecha ×4';

export const HINTS: Record<Step, [string, string, string]> = {
  archivos: [
    'La carga se ha quedado en el 99 % porque faltan tres archivos. Cada uno tiene su hueco en el registro, arriba: el amarillo, el verde y el rojo.',
    'Los archivos se empujan como cajas y solo encajan en el hueco de su color. Uno arrimado a una pared ya no se separa de ella. R lo recoloca todo.',
    `Desde el inicio (pulsa R): ${SOLUTION1}.`,
  ],
  letras: [
    'Al logo «FUERA DE JUEGO» le faltan tres letras: la U, la D y la G. Están tiradas por el menú.',
    'El cursor da un paso cada vez que tú te mueves (también si chocas), primero en la dirección en la que estás más lejos. Se atasca tras los botones y los bloques. Las letras se colocan solas al pasar justo debajo del logo; si te atrapa, pierdes las que llevabas.',
    `Desde el principio (pulsa R): ${SOLUTION2}.`,
  ],
  opciones: [
    'Con el logo completo, el menú vuelve a responder.',
    'Ahora sí funciona el botón OPCIONES.',
    'Ponte junto al botón OPCIONES (el segundo) y pulsa A.',
  ],
  ajustes: [
    'Cada ajuste cambia algo de la sala. Empuja los tiradores amarillos a izquierda o derecha y fíjate en qué pasa.',
    'Sube el brillo del todo y mira el suelo. El altavoz habla, pero sin subtítulos (o demasiado alto) no se entiende. Y el cartel de la derecha está en otro idioma.',
    'Brillo 1, volumen 3, idioma ??? y subtítulos SÍ. Después, pulsa APLICAR (el botón verde de abajo).',
  ],
  consola: [
    'Los ajustes están guardados: se ha abierto una puerta.',
    'La puerta está en la pared de la derecha, junto al cartel.',
    'La puerta está dos filas por debajo del cartel: camina por esa fila hacia la derecha hasta cruzarla.',
  ],
  login: [
    'Los comentarios del suelo (//) son notas del programador. Ponte encima y pulsa A.',
    'La contraseña es el nombre del jugador 1. Escríbela pisando las teclas del suelo (A en cada una) y pisa OK (ENTER). La tecla < borra.',
    'Escribe L, E y O, y pulsa A sobre OK.',
  ],
  llave: [
    'Con la sesión iniciada funcionan las plataformas de teletransporte: X−, X+, Y−, Y+ y GO.',
    'Arriba a la derecha hay un cofre de pruebas encerrado. Sus coordenadas están en los otros dos comentarios: x en hexadecimal; y, la mitad de x menos cinco. Si saltas dentro de un muro, el juego se cuelga.',
    'Pon X = 16 e Y = 3 (seis veces X+ y siete veces Y−) y pulsa A sobre GO.',
  ],
  depurar: [
    'La llave de depuración desbloquea la puerta del cofre.',
    'La puerta está en la pared derecha del cofre.',
    'Desde el cofre: abajo, derecha, derecha y derecha otra vez para cruzar la puerta.',
  ],
  nombre: [
    'Los créditos suben un renglón cada dos pasos. Solo se pisan letras: el hueco entre nombres es vacío. Entre tantos nombres hay uno que no debería estar ahí.',
    'Baja deprisa para ganar margen: si te quedas en el renglón de arriba, el scroll te saca. Chocar con el borde cuenta como un paso. El nombre raro está hacia la mitad, pegado a la izquierda.',
    'Desde el principio (pulsa R): abajo ×2, izquierda ×2, abajo ×2, derecha, abajo ×4, derecha ×5, abajo ×2, izquierda ×6, abajo ×2, derecha, abajo ×2, izquierda, abajo ×3, derecha ×2, abajo, derecha ×2, abajo ×4, izquierda ×2, abajo ×5, izquierda ×2, abajo ×3, izquierda ×3, abajo ×5, derecha, abajo ×2, derecha ×2, abajo ×3, derecha ×6, abajo, derecha ×2, abajo ×2, izquierda ×2, abajo ×2, izquierda ×5, abajo ×2, izquierda, abajo ×2, izquierda ×3, abajo ×2, derecha ×8, abajo, derecha ×3, abajo ×2, izquierda, abajo ×3.',
  ],
  fin: [
    'Ya has encontrado tu nombre. Ahora llega hasta el final de los créditos.',
    'El último renglón dice «GRACIAS POR JUGAR». Pisarlo termina la pantalla.',
    'Si los créditos ya han pasado de largo, rebobina con R y repite el recorrido completo (pasar otra vez por LEO no estorba). Desde el principio: abajo ×2, izquierda ×2, abajo ×2, derecha, abajo ×4, derecha ×5, abajo ×2, izquierda ×6, abajo ×2, derecha, abajo ×2, izquierda, abajo ×3, derecha ×2, abajo, derecha ×2, abajo ×4, izquierda ×2, abajo ×5, izquierda ×2, abajo ×3, izquierda ×3, abajo ×5, derecha, abajo ×2, derecha ×2, abajo ×3, derecha ×6, abajo, derecha ×2, abajo ×2, izquierda ×2, abajo ×2, izquierda ×5, abajo ×2, izquierda, abajo ×2, izquierda ×3, abajo ×2, derecha ×8, abajo, derecha ×3, abajo ×2, izquierda, abajo ×3.',
  ],
  datos: [
    'La partida de la ranura 3 necesita tres datos: JUGADOR, MUNDO y HORA. Los bytes sueltos (?) dicen cuáles son; leerlos no gasta tiempo, pero caminar sí.',
    'JUGADOR es el nombre de los créditos, MUNDO es 6 − 2 y HORA es 3:08. La corrupción nace a la izquierda: empieza por ese lado. R reinicia.',
    'Desde el principio (pulsa R): arriba ×3, izquierda ×5, arriba ×2, derecha, arriba ×4, izquierda, arriba, derecha ×3, abajo, derecha ×10, abajo ×6 e izquierda ×4. Ojo: pisar BIT después de LEO lo cambiaría.',
  ],
  guardar: [
    'Con los tres datos bien (LEO, 4 y 3:08), solo falta guardar.',
    'Pisa la plataforma verde de GUARDAR antes de que llegue la corrupción. No pises otras opciones por el camino: cambiarían el dato.',
    'GUARDAR está a la derecha, en la misma fila que las horas.',
  ],
  carga: [
    'Con los tres archivos en su sitio, la compuerta del registro se ha abierto.',
    'Sube por la compuerta hasta el pasillo de la barra de carga.',
    'Camina hasta el final de la barra (arriba a la derecha) y entra por la salida.',
  ],
};

type Dir = 'up' | 'down' | 'left' | 'right';
type L1 = { x: number; y: number; dir: Dir; files: Record<FileId, [number, number]> };

type L6 = { x: number; y: number; dir: Dir; turns: number; sel: Record<FieldId, string> };
type L5 = { x: number; y: number; dir: Dir; turns: number };
type L4 = { x: number; y: number; dir: Dir; buffer: string; tp: [number, number] };
type L3 = { x: number; y: number; dir: Dir; vals: number[] };
type L2 = { x: number; y: number; dir: Dir; cursor: [number, number]; carry: LetterId[]; bank: LetterId[] };

type State = {
  intro: boolean;
  level: Level;
  start: number | null;
  /** Momento en que se superó cada pantalla (índice = pantalla) */
  ends: (number | null)[];
  done: Step[];
  hints: Partial<Record<Step, number>>;
  muted: boolean;
  l1: L1;
  l2: L2;
  l3: L3;
  l4: L4;
  l5: L5;
  l6: L6;
};

const KEY = 'ctrl-escape:bastidores:v1';
export const freshFiles = () =>
  Object.fromEntries(Object.entries(FILES).map(([id, f]) => [id, [...f.start]])) as Record<FileId, [number, number]>;
const blankL1 = (): L1 => ({ ...START1, dir: 'up', files: freshFiles() });
export const blankL2 = (): L2 => ({ ...START2, dir: 'up', cursor: [...CURSOR_START], carry: [], bank: [] });
export const blankL3 = (): L3 => ({ ...START3, dir: 'up', vals: [...OPTIONS_START] });
export const blankL6 = (): L6 => ({ ...START6, dir: 'up', turns: 0, sel: { jugador: '', mundo: '', hora: '' } });
export const blankL5 = (): L5 => ({ ...START5, dir: 'down', turns: 0 });
export const blankL4 = (): L4 => ({ ...START4, dir: 'up', buffer: '', tp: [...TP_START] });
const blank = (): State => ({
  intro: false,
  level: 1,
  start: null,
  ends: [],
  done: [],
  hints: {},
  muted: false,
  l1: blankL1(),
  l2: blankL2(),
  l3: blankL3(),
  l4: blankL4(),
  l5: blankL5(),
  l6: blankL6(),
});

class Backstage {
  s = $state<State>(blank());
  ready = $state(false);

  load() {
    if (!browser || this.ready) return;
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
      this.s = { ...blank(), ...saved, l1: { ...blankL1(), ...(saved.l1 ?? {}) }, l2: { ...blankL2(), ...(saved.l2 ?? {}) }, l3: { ...blankL3(), ...(saved.l3 ?? {}) }, l4: { ...blankL4(), ...(saved.l4 ?? {}) }, l5: { ...blankL5(), ...(saved.l5 ?? {}) }, l6: { ...blankL6(), ...(saved.l6 ?? {}) } };
    } catch {
      this.s = blank();
    }
    this.ready = true;
  }
  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.s));
    } catch {
      // Sin almacenamiento: se juega igual
    }
  }
  begin() {
    this.s.intro = true;
    this.s.start ??= Date.now();
    this.save();
  }
  isDone(step: Step) {
    return this.s.done.includes(step);
  }
  complete(step: Step) {
    if (!this.s.done.includes(step)) this.s.done.push(step);
    if (step === 'carga') this.s.ends[1] ??= Date.now();
    if (step === 'opciones') this.s.ends[2] ??= Date.now();
    if (step === 'consola') this.s.ends[3] ??= Date.now();
    if (step === 'depurar') this.s.ends[4] ??= Date.now();
    if (step === 'fin') this.s.ends[5] ??= Date.now();
    if (step === 'guardar') this.s.ends[6] ??= Date.now();
    this.save();
  }
  levelDone(level: Level) {
    return this.s.ends[level] != null;
  }
  get current(): Step | null {
    return stepsOf(this.s.level).find((s) => !this.s.done.includes(s)) ?? null;
  }
  /** Inicio y fin de la pantalla actual (cada una empieza cuando acaba la anterior) */
  get timeRange() {
    const l = this.s.level;
    return { from: l === 1 ? this.s.start : (this.s.ends[l - 1] ?? null), to: this.s.ends[l] ?? null };
  }
  hintsIn(level: Level) {
    return stepsOf(level).reduce((a, st) => a + (this.s.hints[st] ?? 0), 0);
  }
  hint(step: Step) {
    this.s.hints[step] = Math.min(3, (this.s.hints[step] ?? 0) + 1);
    this.save();
  }
  goLevel(level: Level) {
    this.s.level = level;
    this.save();
  }
  /** Repite solo la pantalla 6 */
  resetLevel6() {
    this.s.done = this.s.done.filter((d) => !(STEPS6 as readonly string[]).includes(d));
    for (const st of STEPS6) delete this.s.hints[st];
    this.s.ends[6] = null;
    this.s.l6 = blankL6();
    this.save();
  }
  /** Repite solo la pantalla 5 */
  resetLevel5() {
    this.s.done = this.s.done.filter((d) => !(STEPS5 as readonly string[]).includes(d));
    for (const st of STEPS5) delete this.s.hints[st];
    this.s.ends[5] = null;
    this.s.l5 = blankL5();
    this.save();
  }
  /** Repite solo la pantalla 4 */
  resetLevel4() {
    this.s.done = this.s.done.filter((d) => !(STEPS4 as readonly string[]).includes(d));
    for (const st of STEPS4) delete this.s.hints[st];
    this.s.ends[4] = null;
    this.s.l4 = blankL4();
    this.save();
  }
  /** Repite solo la pantalla 3 */
  resetLevel3() {
    this.s.done = this.s.done.filter((d) => !(STEPS3 as readonly string[]).includes(d));
    for (const st of STEPS3) delete this.s.hints[st];
    this.s.ends[3] = null;
    this.s.l3 = blankL3();
    this.save();
  }
  /** Repite solo la pantalla 2 */
  resetLevel2() {
    this.s.done = this.s.done.filter((d) => !(STEPS2 as readonly string[]).includes(d));
    for (const st of STEPS2) delete this.s.hints[st];
    this.s.ends[2] = null;
    this.s.l2 = blankL2();
    this.save();
  }
  /** Repite solo la pantalla 1 */
  resetLevel1() {
    this.s.done = this.s.done.filter((d) => !(STEPS1 as readonly string[]).includes(d));
    for (const st of STEPS1) delete this.s.hints[st];
    this.s.ends[1] = null;
    this.s.l1 = blankL1();
    this.save();
  }
  get sound() {
    return !this.s.muted;
  }
  toggleSound() {
    this.s.muted = !this.s.muted;
    this.save();
  }
  reset() {
    this.s = blank();
    this.save();
  }
}

export const backstage = new Backstage();
