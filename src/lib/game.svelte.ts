import { browser } from '$app/environment';

/** Progreso de una sala: nivel actual, pistas pedidas por nivel y cronómetro */
export type RoomState = {
  level: number;
  hints: Record<number, number>;
  start: number | null;
  end: number | null;
};

const KEY = 'ctrl-escape:v1';
const blank = (): RoomState => ({ level: 0, hints: {}, start: null, end: null });

class Game {
  rooms = $state<Record<string, RoomState>>({});
  ready = $state(false);

  /** Lee el progreso guardado (solo en el navegador) */
  load() {
    if (!browser || this.ready) return;
    try {
      this.rooms = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    } catch {
      this.rooms = {};
    }
    this.ready = true;
  }

  private save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.rooms));
    } catch {
      // Sin almacenamiento (modo privado): se juega igual, sin guardar
    }
  }

  get(id: string): RoomState {
    return this.rooms[id] ?? blank();
  }

  isDone(id: string) {
    return this.get(id).end !== null;
  }

  enter(id: string) {
    const room = this.rooms[id] ?? blank();
    room.start ??= Date.now();
    this.rooms[id] = room;
    this.save();
  }

  solve(id: string, total: number) {
    const room = this.rooms[id];
    if (!room) return;
    room.level += 1;
    if (room.level >= total) room.end = Date.now();
    this.save();
  }

  /** Revela la siguiente pista del nivel (máximo 3: la última es la solución) */
  hint(id: string, level: number) {
    const room = this.rooms[id];
    if (!room) return;
    room.hints[level] = Math.min(3, (room.hints[level] ?? 0) + 1);
    this.save();
  }

  hintsUsed(id: string) {
    return Object.values(this.get(id).hints).reduce((a, b) => a + b, 0);
  }

  reset(id?: string) {
    if (id) delete this.rooms[id];
    else this.rooms = {};
    this.save();
  }
}

export const game = new Game();

export const formatTime = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/** Mayúsculas, sin tildes ni espacios: «fósforo » → «FOSFORO» */
export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase();
