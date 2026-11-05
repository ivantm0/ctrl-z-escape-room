import { expect, test, type Page } from '@playwright/test';

const KEY = 'ctrl-escape:faraon:v1';
const BEFORE = [
  'balanza', 'vasijas', 'cofre', 'puerta',
  'campamento', 'losa', 'ofrendas', 'espejo', 'entrada',
  'antorcha', 'fresco', 'pesaje', 'canopos', 'sarcofago',
];

const seed = (page: Page, state: Record<string, unknown>) =>
  page.addInitScript(
    ([key, state]) => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      const now = Date.now();
      localStorage.setItem(
        key,
        JSON.stringify({
          intro: true,
          start: now - 1_200_000,
          ends: { mercado: now - 900_000, piramide: now - 600_000, tumba: now - 30_000 },
          ...state,
          // Valores relativos al momento de cargar
          deadline: state.deadline === 'pasado' ? now - 1000 : state.deadline === 'futuro' ? now + 180_000 : null,
        })
      );
    },
    // Los pasos de los capítulos anteriores, por defecto superados
    [KEY, { done: BEFORE, ...state }] as const
  );

const deadline = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).deadline as number, KEY);

const inEscape = async (page: Page, extra: Record<string, unknown> = {}) => {
  await seed(page, { chapter: 'huida', seen: ['mercado', 'piramide', 'tumba', 'huida'], deadline: 'futuro', ...extra });
  await page.goto('/faraon');
};

test('de la tumba se pasa a la huida y empieza la cuenta atrás', async ({ page }) => {
  await seed(page, { chapter: 'tumba', seen: ['mercado', 'piramide', 'tumba'] });
  await page.goto('/faraon');
  await page.getByRole('button', { name: /Continuar: la huida/ }).click();
  await expect(page.getByText('Capítulo IV · La maldición')).toBeVisible();
  await page.getByRole('button', { name: 'Saltar intro' }).click();
  await expect(page.getByRole('timer')).toHaveText(/^(3:00|2:5\d)$/);
  await expect(page.getByRole('heading', { name: 'El techo que baja' })).toBeVisible();
});

test('la huida completa: palancas, losas y rueda', async ({ page }) => {
  await inEscape(page);

  // 1 · Palancas: un error resta 10 segundos y obliga a ver otra secuencia
  await expect(page.getByRole('button', { name: /Palanca del sol/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Ver la secuencia' }).click();
  await expect(page.getByRole('button', { name: /Palanca del sol/ })).toBeEnabled({ timeout: 8000 });
  let names = ((await page.getByText(/^Se iluminan:/).textContent()) ?? '').replace('Se iluminan: ', '').replace('.', '').split(', ');
  const wrong = ['sol', 'ibis', 'chacal', 'escarabajo'].find((n) => n !== names[0])!;
  const before = await deadline(page);
  await page.getByRole('button', { name: `Palanca del ${wrong}` }).click();
  await expect(page.getByText(/Palanca equivocada/)).toBeVisible();
  expect(before - (await deadline(page))).toBe(10_000);

  await page.getByRole('button', { name: 'Ver la secuencia' }).click();
  await expect(page.getByRole('button', { name: /Palanca del sol/ })).toBeEnabled({ timeout: 8000 });
  names = ((await page.getByText(/^Se iluminan:/).textContent()) ?? '').replace('Se iluminan: ', '').replace('.', '').split(', ');
  for (const n of names) await page.getByRole('button', { name: `Palanca del ${n}` }).click();
  await expect(page.getByRole('heading', { name: 'El suelo que se hunde' })).toBeVisible();

  // 2 · Losas: la cobra se hunde; el camino de ankh lleva a la salida
  await page.getByRole('gridcell', { name: 'Losa fila 1, columna 1: cobra' }).click();
  await expect(page.getByText(/La losa del cobra se hunde/)).toBeVisible();
  for (const [row, col] of [[1, 2], [2, 2], [3, 2], [3, 3], [4, 3]]) {
    await page.getByRole('gridcell', { name: new RegExp(`^Losa fila ${row}, columna ${col}: ankh`) }).click();
  }
  await expect(page.getByRole('heading', { name: 'La losa de salida' })).toBeVisible();

  // 3 · Rueda: girar deprisa hasta abrir
  const wheel = page.getByRole('button', { name: 'Girar la rueda' });
  for (let i = 0; i < 40 && (await wheel.count()) > 0; i++) await wheel.click({ delay: 0, timeout: 2000 }).catch(() => {});

  await expect(page.getByRole('heading', { name: 'Has escapado' })).toBeVisible();
  await expect(page.getByText('Fin de El Mapa del Faraón')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Jugar desde el principio' })).toBeVisible();
});

test('si se acaba el tiempo, se repite solo la huida', async ({ page }) => {
  await inEscape(page, { deadline: 'pasado', done: [...BEFORE, 'palancas'] });
  await expect(page.getByRole('heading', { name: 'La tumba se ha sellado' })).toBeVisible();
  await page.getByRole('button', { name: 'Intentarlo de nuevo' }).click();
  await expect(page.getByRole('heading', { name: 'El techo que baja' })).toBeVisible();
  await expect(page.getByRole('timer')).toHaveText(/^(3:00|2:5\d)$/);
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), KEY);
  expect(saved.fails).toBe(1);
  expect(saved.done).toContain('sarcofago');
  expect(saved.done).not.toContain('palancas');
});

test('la portada indica que el juego está completado', async ({ page }) => {
  await seed(page, { chapter: 'huida', seen: ['mercado', 'piramide', 'tumba', 'huida'], done: [...BEFORE, 'palancas', 'losas', 'rueda'], ends: { huida: Date.now() } });
  await page.goto('/');
  await expect(page.getByRole('link', { name: /El Mapa del Faraón/ })).toContainText('Completado');
});
