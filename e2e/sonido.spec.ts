import { expect, test, type Page } from '@playwright/test';

// Política de autoplay real de Chrome: el audio solo arranca tras un gesto del usuario
test.use({ launchOptions: { args: ['--autoplay-policy=user-gesture-required'] } });

/** Engancha un analizador a todo lo que llega a los altavoces */
const tapAudio = (page: Page, sound: boolean) =>
  page.addInitScript((sound) => {
    localStorage.setItem('ctrl-escape:faraon:v1', JSON.stringify({ intro: true, start: Date.now(), muted: !sound }));
    const w = window as unknown as { taps: AnalyserNode[]; ctxs: AudioContext[] };
    w.taps = [];
    w.ctxs = [];
    const connect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (this: AudioNode, dest: AudioNode | AudioParam, ...rest: number[]) {
      if (dest instanceof AudioDestinationNode) {
        const an = this.context.createAnalyser();
        an.fftSize = 2048;
        connect.call(this, an);
        w.taps.push(an);
        w.ctxs.push(this.context as AudioContext);
      }
      return connect.call(this, dest as AudioNode, ...rest) as AudioNode;
    } as typeof AudioNode.prototype.connect;
  }, sound);

/** Nivel máximo (dBFS) durante un intervalo */
const level = (page: Page, ms: number) =>
  page.evaluate(async (ms) => {
    const w = window as unknown as { taps: AnalyserNode[] };
    const an = w.taps[0];
    if (!an) return -Infinity;
    const buf = new Float32Array(an.fftSize);
    let peak = 0;
    const end = performance.now() + ms;
    while (performance.now() < end) {
      an.getFloatTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += v * v;
      peak = Math.max(peak, Math.sqrt(sum / buf.length));
      await new Promise((r) => setTimeout(r, 30));
    }
    return 20 * Math.log10(peak || 1e-9);
  }, ms);

const state = (page: Page) => page.evaluate(() => (window as unknown as { ctxs: AudioContext[] }).ctxs[0]?.state ?? 'none');

test('al activar el sonido se oye el viento y los efectos', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium');
  await tapAudio(page, false);
  await page.goto('/faraon');
  await page.getByRole('button', { name: 'Activar sonido' }).click();
  await expect.poll(() => state(page)).toBe('running');
  // Viento de fondo: claramente audible (por encima de −40 dBFS)
  const wind = await level(page, 1500);
  console.log(`viento: ${wind.toFixed(1)} dBFS`);
  expect(wind).toBeGreaterThan(-40);
  // Un clic en la escena suena más fuerte que el viento
  await page.getByRole('button', { name: 'Estela de piedra', exact: true }).click();
  expect(await level(page, 300)).toBeGreaterThan(-25);
});

test('en una partida nueva suena por defecto desde el primer clic', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium');
  await tapAudio(page, true);
  await page.addInitScript(() => localStorage.removeItem('ctrl-escape:faraon:v1'));
  await page.goto('/faraon');
  // El primer clic (Continuar en la intro) ya pone el sonido en marcha
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect.poll(() => state(page)).toBe('running');
  expect(await level(page, 1500)).toBeGreaterThan(-40);
  await page.getByRole('button', { name: 'Saltar intro' }).click();
  await expect(page.getByRole('button', { name: 'Silenciar' })).toBeVisible();
});

test('con el sonido ya activado, arranca al primer gesto tras recargar', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium');
  await tapAudio(page, true);
  await page.goto('/faraon');
  // En un navegador real arranca en pausa hasta el primer gesto (headless no lo aplica)
  await page.mouse.click(5, 300);
  await expect.poll(() => state(page)).toBe('running');
  expect(await level(page, 1500)).toBeGreaterThan(-40);
});

test('al silenciar, deja de sonar', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium');
  await tapAudio(page, false);
  await page.goto('/faraon');
  await page.getByRole('button', { name: 'Activar sonido' }).click();
  await expect.poll(() => state(page)).toBe('running');
  await page.getByRole('button', { name: 'Silenciar' }).click();
  await page.waitForTimeout(1500);
  expect(await level(page, 800)).toBeLessThan(-60);
});
