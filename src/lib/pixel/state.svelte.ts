import { browser } from '$app/environment';
import { initialRunes, type ScreenId } from './maps';
import type { Screen2 } from './maps2';
import { MIRRORS, type Screen3 } from './maps3';
import { TWIN_START, type Screen4 } from './maps4';

export type WorldN = 1 | 2 | 3 | 4;

export const ITEMS = {
  farol: { world: 1, name: 'Farol', glyph: '🏮', desc: 'Un farol de aceite del cobertizo. Ilumina la cueva.' },
  pico: { world: 1, name: 'Pico', glyph: '⛏', desc: 'Un pico pequeño, del baúl del anciano. Sirve para romper rocas.' },
  llave: { world: 1, name: 'Llave de Píxel', glyph: '🗝', desc: 'Una llave hecha de píxeles que parpadean. Abre la Puerta del Cartucho.' },
  fragHielo: { world: 2, name: 'Fragmento helado', glyph: '❄', desc: 'Un trozo de la corona del rey, frío como el hielo de la sala oeste.' },
  fragCristal: { world: 2, name: 'Fragmento de cristal', glyph: '◆', desc: 'Un trozo de la corona que cambia de rojo a azul según lo miras.' },
  fragCampana: { world: 2, name: 'Fragmento sonoro', glyph: '♫', desc: 'Un trozo de la corona que aún vibra con la canción del rey.' },
  corona: { world: 2, name: 'Corona de Pixelio', glyph: '♛', desc: 'La corona del rey, entera otra vez. Pesa más de lo que parece.' },
  engEspejos: { world: 3, name: 'Engranaje de cristal', glyph: '⚙', desc: 'Un engranaje transparente que salió del receptor del rayo.' },
  engAlmacen: { world: 3, name: 'Engranaje de bronce', glyph: '⛭', desc: 'Un engranaje pesado, escondido bajo las cajas del almacén.' },
  engEstatuas: { world: 3, name: 'Engranaje de plata', glyph: '✲', desc: 'Un engranaje que brilla como los ojos de las estatuas de noche.' },
  datGemelo: { world: 4, name: 'Fragmento de código A', glyph: '◐', desc: 'Medio fragmento te pertenece; la otra mitad, a tu reflejo.' },
  datNoclip: { world: 4, name: 'Fragmento de código B', glyph: '▒', desc: 'Lo encontraste atravesando paredes que no estaban.' },
  datMemoria: { world: 4, name: 'Fragmento de código C', glyph: '⌗', desc: 'Huele a ceros y unos. Salió de la memoria corrupta.' },
} as const;
export type ItemId = keyof typeof ITEMS;

export const STEPS1 = ['cajas', 'cofre', 'rocas', 'runas', 'puerta'] as const;
export const STEPS2 = ['hielo', 'cristal', 'campanas', 'corona', 'portal'] as const;
export const STEPS3 = ['espejos', 'almacen', 'estatuas', 'reloj', 'tiempo'] as const;
export const STEPS4 = ['gemelo', 'noclip', 'memoria', 'nucleo', 'salida'] as const;
export const STEPS = STEPS1;
export type Step = (typeof STEPS1)[number] | (typeof STEPS2)[number] | (typeof STEPS3)[number] | (typeof STEPS4)[number];
export const stepsOf = (world: WorldN): readonly Step[] => (world === 1 ? STEPS1 : world === 2 ? STEPS2 : world === 3 ? STEPS3 : STEPS4);

export const HINTS: Record<Step, [string, string, string]> = {
  cajas: [
    'El jardín vallado del suroeste tiene dos cajas y dos baldosas. El cartel de al lado dice algo útil.',
    'Empuja las cajas caminando contra ellas. Si se atascan, pulsa R (o el botón ↺) para recolocarlas.',
    'Empuja la caja de arriba dos veces a la derecha. La de abajo: una vez hacia abajo y dos a la derecha.',
  ],
  cofre: [
    'El anciano guarda algo en su baúl. Su diario, sobre la mesa, explica la combinación.',
    'Cuenta en el pueblo, en este orden: árboles, peces del estanque, flores y casas.',
    'La combinación es 3254.',
  ],
  rocas: [
    'La cueva del noreste está a oscuras y unas rocas cierran el paso.',
    'Necesitas el farol para entrar y el pico del baúl para romper las rocas.',
    'Con el farol y el pico, ponte delante de cada roca de la cueva y pulsa A.',
  ],
  runas: [
    'Hay que encender las nueve runas. Lee la inscripción de la cueva.',
    'Cada runa cambia también a las de arriba, abajo, izquierda y derecha. Ponte encima y pulsa A. Con R (o ↺) vuelven al estado inicial.',
    'Desde el estado inicial (pulsa R si hace falta): la runa de arriba a la izquierda, la del centro y la de abajo a la derecha.',
  ],
  puerta: [
    'La Puerta del Cartucho, al norte del pueblo, es la salida de este mundo.',
    'Coge la Llave de Píxel del pedestal de la cueva y llévala a la puerta.',
    'Ponte delante de la puerta del norte con la llave y pulsa A.',
  ],
  hielo: [
    'La sala de hielo está al oeste del patio. Sobre el hielo no puedes pararte: resbalas hasta chocar con algo.',
    'Piensa cada deslizamiento antes de hacerlo: las rocas son tus frenos. Si te lías, R te devuelve a la entrada.',
    'Desde la entrada: izquierda, izquierda, arriba, derecha, abajo, derecha, arriba, izquierda, arriba, izquierda, abajo, izquierda y mira arriba.',
  ],
  cristal: [
    'En la sala de cristal del este, los bloques rojos y azules suben y bajan al golpear un cristal.',
    'Golpea un cristal (A) para cambiar el color levantado. No puedes hacerlo si estás encima de un bloque del color que va a subir.',
    'Hacen falta cinco cambios de color. Avanza hasta donde puedas, busca el cristal más cercano y vuelve a cambiar. R te devuelve a la entrada.',
  ],
  campanas: [
    'La torre de campanas está al noroeste. La canción del rey está escrita en el libro del atril del patio.',
    'Un glitch ha escrito el libro al revés: léelo de derecha a izquierda.',
    'Toca las campanas en este orden: azul, roja, amarilla, verde y azul.',
  ],
  corona: [
    'En la sala del trono hay un altar con tres huecos.',
    'Consigue los tres fragmentos (hielo, cristal y campanas) y colócalos en el altar.',
    'Con los tres fragmentos, ponte delante del altar y pulsa A.',
  ],
  portal: [
    'El rey Pixelio sigue dormido. Quizá su corona le ayude a despertar.',
    'Dale la corona al rey (ponte delante de él y pulsa A).',
    'Con el rey despierto se abre un portal a la derecha del trono: entra en él.',
  ],
  espejos: [
    'En el laboratorio del oeste, un rayo rebota en los espejos. Tiene que llegar al receptor dorado.',
    'Ponte delante de un espejo y pulsa A para girarlo. Las columnas bloquean el rayo. R devuelve los espejos a como estaban.',
    'Gira el espejo de la derecha del todo (a la altura del emisor), el de la esquina de arriba a la derecha, el de arriba en el centro y el de abajo en el centro.',
  ],
  almacen: [
    'En el almacén del este hay tres cajas y tres marcas en el suelo.',
    'Una caja contra una pared ya no se puede separar de ella. Piensa antes de empujar; R lo recoloca todo.',
    'Empieza llevando la caja de la derecha hacia la marca de arriba y deja para el final la de la esquina de abajo a la izquierda.',
  ],
  estatuas: [
    'Las cuatro estatuas de la plaza guardan un secreto… que solo enseñan de noche.',
    'Usa el reloj de sol para que se haga de noche y mira el orden en que brillan sus ojos. Luego tócalas en ese orden.',
    'El orden es: búho, rana, gato y zorro.',
  ],
  reloj: [
    'La máquina de la torre del reloj necesita tres engranajes.',
    'Consigue los engranajes del laboratorio, del almacén y de las estatuas, y llévalos a la torre del norte.',
    'Con los tres engranajes, ponte delante de la máquina de la torre y pulsa A.',
  ],
  tiempo: [
    'Con el reloj en marcha se ha abierto un portal en la torre.',
    'Entra en el portal del centro de la torre.',
    'Camina hasta el portal que brilla en el centro de la torre.',
  ],
  gemelo: [
    'En la sala del oeste tienes un reflejo que se mueve contigo… pero al revés.',
    'Cuando vas a la izquierda, el clon va a la derecha. Si uno choca con un muro, el otro sigue moviéndose: así se desincronizan. R os devuelve a la entrada.',
    'Desde la entrada: arriba, derecha ×3, arriba ×3, izquierda, arriba, derecha, arriba ×3, izquierda ×2, abajo, derecha ×3, abajo, izquierda, abajo, izquierda, abajo, izquierda, abajo, izquierda, abajo, derecha ×3, arriba ×10 y abajo.',
  ],
  noclip: [
    'En la sala del este, las paredes mienten: algunas se atraviesan y algunos suelos son muros invisibles.',
    'El terminal junto a la entrada activa el modo depuración: enseña lo que es sólido de verdad, pero mientras está activo no te puedes mover. Memoriza el camino.',
    'Desde la entrada: derecha ×2, arriba, derecha ×2, arriba ×2, izquierda ×3, abajo, izquierda ×2, arriba, izquierda, arriba, izquierda ×2, arriba ×3, derecha ×6, arriba ×5 e izquierda ×2.',
  ],
  memoria: [
    'La pantalla del vestíbulo muestra un error: 0x0D. Es un número en hexadecimal.',
    '0x0D es 13, y 13 en binario es 1101. Pero los interruptores tienen un glitch: cada uno cambia su luz y todas las de su derecha. R los apaga.',
    'Desde todo apagado, pulsa los interruptores primero, tercero y cuarto (empezando por la izquierda).',
  ],
  nucleo: [
    'El núcleo del vestíbulo necesita tres fragmentos de código.',
    'Consigue los fragmentos del gemelo, de la sala sin colisiones y de la memoria.',
    'Con los tres fragmentos, ponte delante del núcleo y pulsa A.',
  ],
  salida: [
    'El núcleo reparado ha abierto la salida del juego.',
    'Entra en el portal que ha aparecido debajo del núcleo.',
    'Camina hasta el portal que parpadea justo al sur del núcleo.',
  ],
};

type World4 = {
  screen: Screen4;
  x: number;
  y: number;
  dir: 'up' | 'down' | 'left' | 'right';
  clone: [number, number];
  bits: boolean[];
  debug: boolean;
  fixed: boolean;
};

type World3 = {
  screen: Screen3;
  x: number;
  y: number;
  dir: 'up' | 'down' | 'left' | 'right';
  night: boolean;
  mirrors: string[];
  statues: string[];
  boxesDone: boolean;
  running: boolean;
};

type World2 = {
  screen: Screen2;
  x: number;
  y: number;
  dir: 'up' | 'down' | 'left' | 'right';
  red: boolean;
  song: number[];
  awake: boolean;
};

type World = {
  screen: ScreenId;
  x: number;
  y: number;
  dir: 'up' | 'down' | 'left' | 'right';
  shedOpen: boolean;
  rocks: boolean[];
  runes: boolean[];
  wallOpen: boolean;
  gateOpen: boolean;
  talked: boolean;
};

type State = {
  intro: boolean;
  world: WorldN;
  /** Intro del mundo 2 ya vista */
  intro2: boolean;
  end2: number | null;
  w2: World2;
  intro3: boolean;
  end3: number | null;
  w3: World3;
  intro4: boolean;
  end4: number | null;
  w4: World4;
  start: number | null;
  end: number | null;
  done: Step[];
  items: ItemId[];
  used: ItemId[];
  hints: Partial<Record<Step, number>>;
  muted: boolean;
  w: World;
};

const KEY = 'ctrl-escape:pixel:v1';
export const START: Pick<World, 'screen' | 'x' | 'y' | 'dir'> = { screen: 'pueblo', x: 14, y: 14, dir: 'up' };
const blankWorld = (): World => ({
  ...START,
  shedOpen: false,
  rocks: [false, false],
  runes: initialRunes(),
  wallOpen: false,
  gateOpen: false,
  talked: false,
});
export const START2: Pick<World2, 'screen' | 'x' | 'y' | 'dir'> = { screen: 'patio', x: 9, y: 15, dir: 'up' };
const blankWorld2 = (): World2 => ({ ...START2, red: true, song: [], awake: false });
export const START3: Pick<World3, 'screen' | 'x' | 'y' | 'dir'> = { screen: 'plaza', x: 10, y: 16, dir: 'up' };
const blankWorld3 = (): World3 => ({ ...START3, night: false, mirrors: [...MIRRORS.initial], statues: [], boxesDone: false, running: false });
export const START4: Pick<World4, 'screen' | 'x' | 'y' | 'dir'> = { screen: 'vestibulo', x: 10, y: 15, dir: 'up' };
const blankWorld4 = (): World4 => ({ ...START4, clone: [...TWIN_START.clone], bits: [false, false, false, false], debug: false, fixed: false });
const blank = (): State => ({
  intro4: false,
  end4: null,
  w4: blankWorld4(),
  intro: false,
  intro3: false,
  end3: null,
  w3: blankWorld3(),
  world: 1,
  intro2: false,
  end2: null,
  w2: blankWorld2(),
  start: null,
  end: null,
  done: [],
  items: [],
  used: [],
  hints: {},
  muted: false,
  w: blankWorld(),
});

class Pixel {
  s = $state<State>(blank());
  ready = $state(false);

  load() {
    if (!browser || this.ready) return;
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
      this.s = { ...blank(), ...saved, w: { ...blankWorld(), ...(saved.w ?? {}) }, w2: { ...blankWorld2(), ...(saved.w2 ?? {}) }, w3: { ...blankWorld3(), ...(saved.w3 ?? {}) }, w4: { ...blankWorld4(), ...(saved.w4 ?? {}) } };
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

  has(id: ItemId) {
    return this.s.items.includes(id) && !this.s.used.includes(id);
  }
  give(id: ItemId) {
    if (!this.s.items.includes(id)) this.s.items.push(id);
    this.save();
  }
  use(id: ItemId) {
    if (!this.s.used.includes(id)) this.s.used.push(id);
    this.save();
  }
  isDone(step: Step) {
    return this.s.done.includes(step);
  }
  complete(step: Step) {
    if (!this.s.done.includes(step)) this.s.done.push(step);
    if (step === 'puerta') this.s.end ??= Date.now();
    if (step === 'portal') this.s.end2 ??= Date.now();
    if (step === 'tiempo') this.s.end3 ??= Date.now();
    if (step === 'salida') this.s.end4 ??= Date.now();
    this.save();
  }
  get current(): Step | null {
    return stepsOf(this.s.world).find((s) => !this.s.done.includes(s)) ?? null;
  }

  /** Inicio y fin del mundo actual (el 2 empieza cuando acaba el 1) */
  get timeRange() {
    if (this.s.world === 1) return { from: this.s.start, to: this.s.end };
    if (this.s.world === 2) return { from: this.s.end, to: this.s.end2 };
    if (this.s.world === 3) return { from: this.s.end2, to: this.s.end3 };
    return { from: this.s.end3, to: this.s.end4 };
  }

  hintsIn(world: WorldN) {
    return stepsOf(world).reduce((a, st) => a + (this.s.hints[st] ?? 0), 0);
  }

  goWorld(n: WorldN) {
    this.s.world = n;
    this.save();
  }

  /** Repite solo el mundo 4 */
  resetWorld4() {
    this.s.done = this.s.done.filter((d) => !(STEPS4 as readonly string[]).includes(d));
    const own = (Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].world === 4);
    this.s.items = this.s.items.filter((i) => !own.includes(i));
    this.s.used = this.s.used.filter((i) => !own.includes(i));
    for (const st of STEPS4) delete this.s.hints[st];
    this.s.end4 = null;
    this.s.w4 = blankWorld4();
    this.save();
  }

  /** Repite solo el mundo 3 */
  resetWorld3() {
    this.s.done = this.s.done.filter((d) => !(STEPS3 as readonly string[]).includes(d));
    const own = (Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].world === 3);
    this.s.items = this.s.items.filter((i) => !own.includes(i));
    this.s.used = this.s.used.filter((i) => !own.includes(i));
    for (const st of STEPS3) delete this.s.hints[st];
    this.s.end3 = null;
    this.s.w3 = blankWorld3();
    this.save();
  }

  /** Repite solo el mundo 2 (el 1 se conserva) */
  resetWorld2() {
    this.s.done = this.s.done.filter((d) => !(STEPS2 as readonly string[]).includes(d));
    const own = (Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].world === 2);
    this.s.items = this.s.items.filter((i) => !own.includes(i));
    this.s.used = this.s.used.filter((i) => !own.includes(i));
    for (const st of STEPS2) delete this.s.hints[st];
    this.s.end2 = null;
    this.s.w2 = blankWorld2();
    this.save();
  }
  hint(step: Step) {
    this.s.hints[step] = Math.min(3, (this.s.hints[step] ?? 0) + 1);
    this.save();
  }
  get hintsUsed() {
    return Object.values(this.s.hints).reduce((a, b) => a + (b ?? 0), 0);
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

export const pixel = new Pixel();
