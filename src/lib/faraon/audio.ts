// Sonido sintetizado con Web Audio: sin archivos externos.
// Ambiente de viento del desierto y efectos cortos para clics y mecanismos.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let wind: AudioBufferSourceNode | null = null;
let enabled = false;
let unlockBound = false;

const ensure = () => {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  }
  // Los navegadores crean el audio en pausa si no hubo un gesto del usuario: se reanuda aquí
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return { ctx, master: master! };
};

/** Reanuda el audio con el primer gesto del jugador (clic, toque o tecla) */
function bindUnlock() {
  if (unlockBound || typeof window === 'undefined') return;
  unlockBound = true;
  const unlock = () => {
    if (enabled) ensure();
  };
  for (const ev of ['pointerdown', 'keydown', 'touchend']) addEventListener(ev, unlock, { capture: true });
}

function startWind(c: AudioContext, m: GainNode) {
  // Ruido blanco filtrado en graves y con el volumen ondulando despacio: ráfagas de viento
  const buffer = c.createBuffer(1, c.sampleRate * 4, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  wind = c.createBufferSource();
  wind.buffer = buffer;
  wind.loop = true;

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 420;
  filter.Q.value = 0.7;

  const gust = c.createGain();
  gust.gain.value = 0.16;
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.12;
  const depth = c.createGain();
  depth.gain.value = 0.09;
  lfo.connect(depth).connect(gust.gain);

  // El silbido del viento: la frecuencia del filtro también se mueve
  const sweep = c.createOscillator();
  sweep.frequency.value = 0.07;
  const sweepDepth = c.createGain();
  sweepDepth.gain.value = 180;
  sweep.connect(sweepDepth).connect(filter.frequency);

  wind.connect(filter).connect(gust).connect(m);
  lfo.start();
  sweep.start();
  wind.start();
}

export function setSound(on: boolean) {
  enabled = on;
  bindUnlock();
  if (!on && !ctx) return;
  const { ctx: c, master: m } = ensure();
  m.gain.cancelScheduledValues(c.currentTime);
  m.gain.setTargetAtTime(on ? 0.9 : 0, c.currentTime, 0.25);
  if (on && !wind) startWind(c, m);
}

/** Efectos cortos: 'click' (madera), 'ok' (acierto), 'no' (fallo), 'stone' (mecanismo) */
export function sfx(kind: 'click' | 'ok' | 'no' | 'stone') {
  if (!enabled) return;
  const { ctx: c, master: m } = ensure();
  const t = c.currentTime + 0.01;
  const g = c.createGain();
  g.connect(m);
  const osc = c.createOscillator();
  osc.connect(g);
  if (kind === 'click') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.08);
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.start(t);
    osc.stop(t + 0.14);
  } else if (kind === 'ok') {
    osc.type = 'triangle';
    [523, 659, 784].forEach((f, i) => osc.frequency.setValueAtTime(f, t + i * 0.12));
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc.start(t);
    osc.stop(t + 0.72);
  } else if (kind === 'no') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.linearRampToValueAtTime(90, t + 0.25);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.start(t);
    osc.stop(t + 0.32);
  } else {
    // Piedra arrastrándose: tono grave más un golpe de ruido
    osc.type = 'square';
    osc.frequency.setValueAtTime(70, t);
    osc.frequency.linearRampToValueAtTime(45, t + 0.5);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.start(t);
    osc.stop(t + 0.62);
  }
}
