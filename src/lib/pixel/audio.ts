// Efectos chiptune sintetizados con ondas cuadradas, como una consola portátil.
// Suenan por defecto; el navegador los deja en pausa hasta el primer gesto del jugador.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = false;
let bound = false;

const ensure = () => {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return { c: ctx, m: master! };
};

export function setSound(on: boolean) {
  enabled = on;
  if (!bound && typeof window !== 'undefined') {
    bound = true;
    const unlock = () => enabled && ensure();
    for (const ev of ['pointerdown', 'keydown', 'touchend']) addEventListener(ev, unlock, { capture: true });
  }
  if (ctx && master) master.gain.setTargetAtTime(on ? 0.5 : 0, ctx.currentTime, 0.05);
}

type Note = [freq: number, dur: number];
const SOUNDS: Record<string, { wave: OscillatorType; notes: Note[]; vol: number }> = {
  step: { wave: 'square', notes: [[220, 0.03]], vol: 0.05 },
  bump: { wave: 'square', notes: [[90, 0.06]], vol: 0.12 },
  talk: { wave: 'square', notes: [[660, 0.03], [880, 0.03]], vol: 0.08 },
  push: { wave: 'triangle', notes: [[140, 0.08]], vol: 0.25 },
  item: { wave: 'square', notes: [[523, 0.08], [659, 0.08], [784, 0.08], [1047, 0.18]], vol: 0.12 },
  ok: { wave: 'square', notes: [[392, 0.08], [523, 0.08], [659, 0.16]], vol: 0.12 },
  no: { wave: 'square', notes: [[196, 0.1], [147, 0.18]], vol: 0.12 },
  door: { wave: 'triangle', notes: [[330, 0.06], [247, 0.1]], vol: 0.2 },
  rune: { wave: 'square', notes: [[880, 0.05], [1175, 0.08]], vol: 0.07 },
  crack: { wave: 'sawtooth', notes: [[110, 0.05], [70, 0.15]], vol: 0.2 },
};

export function sfx(name: keyof typeof SOUNDS) {
  if (!enabled) return;
  const { c, m } = ensure();
  const s = SOUNDS[name];
  let t = c.currentTime + 0.01;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = s.wave;
  osc.connect(g).connect(m);
  g.gain.setValueAtTime(s.vol, t);
  for (const [f, d] of s.notes) {
    osc.frequency.setValueAtTime(f, t);
    t += d;
  }
  g.gain.setValueAtTime(s.vol, t - 0.02);
  g.gain.linearRampToValueAtTime(0, t);
  osc.start(c.currentTime + 0.01);
  osc.stop(t + 0.02);
}
