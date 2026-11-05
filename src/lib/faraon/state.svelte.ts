import { browser } from '$app/environment';

export type Chapter = 'mercado' | 'piramide' | 'tumba' | 'huida';
export const ORDER: Chapter[] = ['mercado', 'piramide', 'tumba', 'huida'];

/** Duración de la huida y penalización por cada error (ms) */
export const ESCAPE_MS = 180_000;
export const PENALTY_MS = 10_000;

export const CHAPTERS: Record<Chapter, { n: string; name: string }> = {
  mercado: { n: 'I', name: 'El mercado' },
  piramide: { n: 'II', name: 'La pirámide' },
  tumba: { n: 'III', name: 'La tumba' },
  huida: { n: 'IV', name: 'La huida' },
};

/** Objetos que se pueden llevar en el inventario, por capítulo */
export const ITEMS = {
  ostracon: { chapter: 'mercado', name: 'Ostracón pintado', glyph: '𓏞', desc: 'Un trozo de cerámica con tres animales pintados.' },
  llave: { chapter: 'mercado', name: 'Llave de bronce', glyph: '𓋹', desc: 'Pequeña, verde por el tiempo. Encontrada en una vasija.' },
  sello: { chapter: 'mercado', name: 'Sello de Anubis', glyph: '𓃢', desc: 'El sello del escriba real. Abre las puertas de la necrópolis.' },
  cepillo: { chapter: 'piramide', name: 'Cepillo de palma', glyph: '𓆰', desc: 'Fibras de palma atadas. Los obreros lo usan para limpiar la arena de las piedras.' },
  papiro: { chapter: 'piramide', name: 'Papiro roto', glyph: '𓏛', desc: 'Instrucciones de un sacerdote para las ofrendas.' },
  espejo: { chapter: 'piramide', name: 'Espejo de bronce', glyph: '𓋴', desc: 'Un disco de bronce pulido que refleja el sol como un segundo sol.' },
  antorcha: { chapter: 'tumba', name: 'Antorcha', glyph: '𓊮', desc: 'Lino empapado en resina. Ilumina mucho más que la luz que entra por la puerta.' },
  pluma: { chapter: 'tumba', name: 'Pluma de Maat', glyph: '𓆄', desc: 'La pluma de la verdad y la justicia. Con ella se pesan los corazones.' },
  corazon: { chapter: 'tumba', name: 'Escarabajo del corazón', glyph: '𓆣', desc: 'Un escarabajo de piedra verde que se colocaba sobre el pecho de las momias.' },
  mapa: { chapter: 'tumba', name: 'Mapa del Oasis', glyph: '𓏜', desc: 'El mapa del Oasis Perdido. Por esto has llegado hasta aquí.' },
} as const;
export type ItemId = keyof typeof ITEMS;

/** Pasos de cada capítulo, en el orden en que se sugieren las pistas */
export const STEPS = {
  mercado: ['balanza', 'vasijas', 'cofre', 'puerta'],
  piramide: ['campamento', 'losa', 'ofrendas', 'espejo', 'entrada'],
  tumba: ['antorcha', 'fresco', 'pesaje', 'canopos', 'sarcofago'],
  huida: ['palancas', 'losas', 'rueda'],
} as const;
export type Step = (typeof STEPS)[Chapter][number];

/** Paso que cierra cada capítulo */
const LAST: Record<Chapter, Step> = { mercado: 'puerta', piramide: 'entrada', tumba: 'sarcofago', huida: 'rueda' };

export const HINTS: Record<Step, [string, string, string]> = {
  balanza: [
    'El mercader de especias solo hace tratos con quien sabe pesar. Mira el saco: el número está en jeroglíficos.',
    'La estela del pozo explica los números: ∩ vale 10 y | vale 1. El saco pesa 23 deben.',
    'Pon en la balanza las pesas de 16, 4, 2 y 1.',
  ],
  vasijas: [
    'El alfarero esconde algo en una de sus vasijas. Lee bien su acertijo.',
    'Descarta las de los extremos y la más alta. Luego busca la que está a la derecha de la del ojo, sin tocarla.',
    'Es la cuarta vasija, la del loto.',
  ],
  cofre: [
    'El cofre del escriba necesita una llave y una combinación de tres animales. ¿Qué dibujo llevas?',
    'El ostracón tiene el orden, pero la estela dice que los jeroglíficos se leen hacia donde miran los animales.',
    'Los animales miran a la derecha, así que se lee de derecha a izquierda: halcón, escarabajo, gato.',
  ],
  puerta: [
    'El guardia no deja pasar a nadie sin el sello adecuado.',
    'Abre el cofre del escriba para conseguir el Sello de Anubis y entrégaselo al guardia.',
    'Pulsa sobre el guardia y elige el Sello de Anubis.',
  ],
  campamento: [
    'Los obreros que trabajan en la pirámide han dejado sus cosas en el campamento.',
    'Mira dentro de la tienda: hay una cesta con herramientas y un papiro.',
    'Coge el cepillo de palma y el papiro roto de la tienda de los obreros.',
  ],
  losa: [
    'Algo asoma bajo la arena, delante de la pirámide.',
    'Usa el cepillo en la arena y barre arrastrando sobre ella (o con el botón «Barrer»).',
    'Barre la losa entera: su inscripción dice qué símbolo debe tocar la luz.',
  ],
  ofrendas: [
    'Los tres dioses del altar esperan sus ofrendas. El papiro roto explica qué quiere cada uno.',
    'Ra quiere lo que brilla como él; Thot, aquello con lo que se escribe; Anubis, lo que conserva los cuerpos.',
    'Ra: disco de oro. Thot: cálamo. Anubis: natrón.',
  ],
  espejo: [
    'El poste de bronce del centro sostenía algo que refleja el sol.',
    'Monta el espejo en el poste e inclínalo hasta que el rayo de sol toque el símbolo que dice la losa.',
    'Inclina el espejo hasta que la luz caiga sobre el escarabajo.',
  ],
  entrada: [
    'La luz ha despertado algo en la cara de la pirámide.',
    'Pulsa sobre la cara de la pirámide.',
    'Empuja la piedra que ha quedado marcada en la pirámide.',
  ],
  antorcha: [
    'Está demasiado oscuro para ver nada. Junto a la entrada había algo para alumbrar.',
    'Coge la antorcha del soporte de la entrada y golpea el pedernal hasta que prenda.',
    'En la antorcha: «Coger la antorcha» y después «Golpear el pedernal» tres veces.',
  ],
  fresco: [
    'El gran fresco de la pared izquierda está desordenado. Lee su inscripción.',
    'La inscripción dice el orden: el guía, la balanza, el escriba y el rey. Intercambia los paneles tocando dos.',
    'Orden: Anubis guiando al difunto, el pesaje del corazón, Thot escribiendo, Osiris en su trono.',
  ],
  pesaje: [
    'La estatua de Anubis sostiene una balanza con un corazón en un plato. Al otro le falta algo.',
    'En el juicio, el corazón se pesaba contra la Pluma de Maat. ¿Dónde la conseguiste?',
    'Usa la Pluma de Maat en la balanza de Anubis.',
  ],
  canopos: [
    'Los cuatro vasos canopos están fuera de su sitio. La inscripción del pilar dice dónde va cada uno.',
    'Cada hijo de Horus guarda un punto cardinal. Toca dos vasos para intercambiarlos.',
    'Norte: babuino (Hapy). Este: chacal (Duamutef). Sur: humano (Imsety). Oeste: halcón (Qebehsenuef).',
  ],
  sarcofago: [
    'El sarcófago tiene un hueco en el pecho. ¿Qué llevas que encaje en él?',
    'Primero coloca bien los vasos canopos; después usa el escarabajo del corazón en el sarcófago.',
    'Usa el Escarabajo del corazón en el sarcófago y coge el mapa.',
  ],
  palancas: [
    'Las placas del techo se encienden en un orden. Las palancas tienen los mismos símbolos.',
    'Pulsa «Ver la secuencia», memoriza el orden y repítelo en las palancas.',
    'Repite exactamente la secuencia que se ilumina; si fallas, vuelve a verla.',
  ],
  losas: [
    'El suelo se hunde. Solo algunas losas aguantan tu peso.',
    'Pisa solo las losas con el ankh, el signo de la vida, y avanza de una en una.',
    'Entra por la derecha de la fila de abajo y sigue los ankh hacia la izquierda, luego arriba, y al final a la derecha y arriba.',
  ],
  rueda: [
    'La losa de salida está atada a una rueda. La arena la empuja hacia abajo.',
    'Gira la rueda muy deprisa (clics seguidos o la barra espaciadora) sin parar.',
    'No dejes de pulsar «Girar la rueda» hasta que la losa llegue arriba del todo.',
  ],
};

type State = {
  intro: boolean;
  chapter: Chapter;
  /** Intro corta de cada capítulo ya vista */
  seen: Chapter[];
  start: number | null;
  ends: Partial<Record<Chapter, number>>;
  done: Step[];
  items: ItemId[];
  used: ItemId[];
  hints: Partial<Record<Step, number>>;
  /** Sonido silenciado por el jugador (por defecto suena) */
  muted: boolean;
  /** Huida: momento en que se sella la tumba e intentos fallidos */
  deadline: number | null;
  fails: number;
};

const KEY = 'ctrl-escape:faraon:v1';
const blank = (): State => ({
  intro: false,
  chapter: 'mercado',
  seen: ['mercado'],
  start: null,
  ends: {},
  done: [],
  items: [],
  used: [],
  hints: {},
  muted: false,
  deadline: null,
  fails: 0,
});

class Faraon {
  s = $state<State>(blank());
  ready = $state(false);
  /** Objeto elegido en el inventario para verlo */
  selected = $state<ItemId | null>(null);

  load() {
    if (!browser || this.ready) return;
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
      // Partidas guardadas antes de los capítulos: «end» era el final del mercado
      if (saved.end && !saved.ends) saved.ends = { mercado: saved.end };
      this.s = { ...blank(), ...saved };
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

  goTo(chapter: Chapter) {
    this.s.chapter = chapter;
    this.selected = null;
    this.save();
  }

  markSeen(chapter: Chapter) {
    if (!this.s.seen.includes(chapter)) this.s.seen.push(chapter);
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
    if (this.selected === id) this.selected = null;
    this.save();
  }

  isDone(step: Step) {
    return this.s.done.includes(step);
  }

  complete(step: Step) {
    if (!this.s.done.includes(step)) this.s.done.push(step);
    for (const [ch, last] of Object.entries(LAST) as [Chapter, Step][]) {
      if (step === last) this.s.ends[ch] ??= Date.now();
    }
    this.save();
  }

  chapterDone(chapter: Chapter) {
    return this.isDone(LAST[chapter]);
  }

  /** Primer paso sin resolver del capítulo actual: a él se refieren las pistas */
  get current(): Step | null {
    return STEPS[this.s.chapter].find((s) => !this.s.done.includes(s)) ?? null;
  }

  /** Inicio y final del capítulo, para su cronómetro */
  chapterTime(chapter: Chapter) {
    const prev = ORDER[ORDER.indexOf(chapter) - 1];
    const from = prev ? this.s.ends[prev] : this.s.start;
    return { from: from ?? null, to: this.s.ends[chapter] ?? null };
  }

  hint(step: Step) {
    this.s.hints[step] = Math.min(3, (this.s.hints[step] ?? 0) + 1);
    this.save();
  }

  hintsIn(chapter: Chapter) {
    return (STEPS[chapter] as readonly Step[]).reduce((a, s) => a + (this.s.hints[s] ?? 0), 0);
  }

  get sound() {
    return !this.s.muted;
  }

  toggleSound() {
    this.s.muted = !this.s.muted;
    this.save();
  }

  /** Vuelve a empezar un capítulo: quita sus pasos, objetos y pistas */
  resetChapter(chapter: Chapter) {
    const steps = STEPS[chapter] as readonly Step[];
    const items = (Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].chapter === chapter);
    this.s.done = this.s.done.filter((d) => !steps.includes(d));
    this.s.items = this.s.items.filter((i) => !items.includes(i));
    this.s.used = this.s.used.filter((i) => !items.includes(i));
    for (const st of steps) delete this.s.hints[st];
    delete this.s.ends[chapter];
    if (chapter === 'mercado') this.s.start = Date.now();
    this.selected = null;
    this.save();
  }

  /** Arranca (o reinicia) la cuenta atrás de la huida */
  startEscape() {
    this.s.deadline = Date.now() + ESCAPE_MS;
    this.save();
  }

  /** Error durante la huida: la tumba se cierra un poco más deprisa */
  penalize() {
    if (this.s.deadline) this.s.deadline -= PENALTY_MS;
    this.save();
  }

  /** La tumba se selló: se repite solo la huida */
  failEscape() {
    this.s.fails += 1;
    this.resetChapter('huida');
    this.s.deadline = null;
    this.save();
  }

  reset() {
    this.s = blank();
    this.selected = null;
    this.save();
  }
}

export const faraon = new Faraon();

/** Números egipcios: 𓍢 = 100, 𓎆 = 10, 𓏺 = 1 */
export const toHieroglyphs = (n: number) =>
  '𓍢'.repeat(Math.floor(n / 100)) + '𓎆'.repeat(Math.floor((n % 100) / 10)) + '𓏺'.repeat(n % 10);
