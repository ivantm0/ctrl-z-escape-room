import { sfx } from './audio';

/** Caja de diálogo de un mundo: líneas que se avanzan con A */
export class Talk {
  current = $state<{ lines: string[]; i: number; after?: () => void } | null>(null);

  get open() {
    return this.current !== null;
  }

  get line() {
    return this.current ? this.current.lines[this.current.i] : '';
  }

  say(lines: string[], after?: () => void) {
    sfx('talk');
    this.current = { lines, i: 0, after };
  }

  advance() {
    const c = this.current;
    if (!c) return;
    sfx('talk');
    if (c.i < c.lines.length - 1) c.i += 1;
    else {
      this.current = null;
      c.after?.();
    }
  }
}

export type Dir = 'up' | 'down' | 'left' | 'right';
export const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export const DIR_ES: Record<Dir, string> = { up: 'arriba', down: 'abajo', left: 'la izquierda', right: 'la derecha' };
