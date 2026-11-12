import { browser } from '$app/environment';

/** Progreso de «A Oscuras» (una sola campaña de 100 niveles), guardado en este navegador */
type Save = {
  /** Nivel más lejano alcanzado (0 = el primero) */
  level: number;
  /** Juego terminado */
  done: boolean;
};

const KEY = 'oscuras-progreso';

class OscurasProgress {
  s = $state<Save>({ level: 0, done: false });
  ready = $state(false);

  load() {
    if (!browser || this.ready) return;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const old = JSON.parse(raw);
        if (typeof old.level === 'number') Object.assign(this.s, old);
        else {
          // Partidas guardadas cuando el juego estaba dividido en cuatro partes de 25
          const at = (i: number) => (old[`p${i}`] ?? 0) + (i - 1) * 25;
          this.s.level = old.p4 || old.p3Done ? at(4) : old.p3 || old.p2Done ? at(3) : old.p2 || old.p1Done ? at(2) : at(1);
          this.s.done = !!old.p4Done;
        }
      }
    } catch {}
    this.ready = true;
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.s));
    } catch {}
  }

  /** Al entrar en un nivel: recordar el más lejano para poder continuar */
  reach(i: number) {
    if (i > this.s.level) {
      this.s.level = i;
      this.save();
    }
  }

  finish() {
    this.s.done = true;
    this.save();
  }
}

export const oscuras = new OscurasProgress();
