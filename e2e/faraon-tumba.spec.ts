import { expect, test, type Page } from '@playwright/test';

const DONE_BEFORE = ['balanza', 'vasijas', 'cofre', 'puerta', 'campamento', 'losa', 'ofrendas', 'espejo', 'entrada'];

const seed = (page: Page, state: Record<string, unknown>) =>
  page.addInitScript((state) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    const now = Date.now();
    localStorage.setItem(
      'ctrl-escape:faraon:v1',
      JSON.stringify({ intro: true, start: now - 900_000, ends: { mercado: now - 600_000, piramide: now - 60_000 }, done: [], ...state })
    );
  }, state);

/** Empieza en la tumba, con los capítulos I y II superados */
const atTomb = (page: Page) =>
  seed(page, {
    chapter: 'tumba',
    seen: ['mercado', 'piramide', 'tumba'],
    done: DONE_BEFORE,
    items: ['ostracon', 'llave', 'sello', 'cepillo', 'papiro', 'espejo'],
    used: ['llave', 'sello', 'cepillo', 'espejo'],
  });

const open = async (page: Page, name: string) => {
  await page.getByRole('button', { name, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return dialog;
};

test('de la pirámide se baja a la tumba con su intro', async ({ page }) => {
  await seed(page, { chapter: 'piramide', seen: ['mercado', 'piramide'], done: DONE_BEFORE });
  await page.goto('/faraon');
  await page.getByRole('button', { name: /Continuar: la tumba/ }).click();
  await expect(page.getByText('Capítulo III · El descenso')).toBeVisible();
  await page.getByRole('button', { name: 'Saltar intro' }).click();
  await expect(page.getByRole('button', { name: 'Sarcófago', exact: true })).toBeVisible();
  await expect(page.getByRole('banner')).toContainText('III · La tumba');
});

test('la tumba completa: antorcha, fresco, balanza, canopos y sarcófago', async ({ page }) => {
  await atTomb(page);
  await page.goto('/faraon');

  // A oscuras: la luz es pequeña hasta encender la antorcha
  const dark = page.locator('.dark');
  await expect(dark).toHaveAttribute('style', /--r: 9;/);

  // 1 · Antorcha
  let dialog = await open(page, 'Soporte de la entrada');
  await dialog.getByRole('button', { name: 'Coger la antorcha' }).click();
  for (let i = 0; i < 3; i++) await dialog.getByRole('button', { name: 'Golpear el pedernal' }).click();
  await expect(dialog).toContainText('Por fin puedes ver la cámara');
  await dialog.getByRole('button', { name: 'Cerrar' }).click();
  await expect(dark).toHaveAttribute('style', /--r: 26;/);

  // El sarcófago aún no se abre
  dialog = await open(page, 'Sarcófago');
  await expect(dialog).toContainText('cuatro cerrojos de bronce');
  await dialog.getByRole('button', { name: 'Cerrar' }).click();

  // 2 · Fresco: ordenar los cuatro paneles intercambiándolos
  dialog = await open(page, 'Gran fresco');
  const panels = dialog.getByRole('button', { name: /^Panel/ });
  const want = ['Anubis guía', 'El corazón en la balanza', 'Thot escribe', 'Osiris en su trono'];
  for (let slot = 0; slot < 4; slot++) {
    const names = await panels.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') ?? ''));
    const from = names.findIndex((n) => n.includes(want[slot]));
    if (from !== slot) {
      await panels.nth(slot).click();
      await panels.nth(from).click();
    }
  }
  await expect(dialog).toContainText('una pluma blanca');
  await dialog.getByRole('button', { name: 'Cerrar' }).click();

  // 3 · Balanza de Anubis: la antorcha no sirve, la pluma sí
  dialog = await open(page, 'Estatua de Anubis');
  await dialog.getByRole('button', { name: /Antorcha/ }).click();
  await expect(dialog).toContainText('no es eso lo que se pesa');
  await dialog.getByRole('button', { name: /Pluma de Maat/ }).click();
  await expect(dialog).toContainText('escarabajo de piedra verde');
  await dialog.getByRole('button', { name: 'Cerrar' }).click();

  // Con el escarabajo pero sin los canopos, la tapa sigue bloqueada
  dialog = await open(page, 'Sarcófago');
  await dialog.getByRole('button', { name: /Escarabajo del corazón/ }).click();
  await expect(dialog).toContainText('la tapa sigue bloqueada');
  await dialog.getByRole('button', { name: 'Cerrar' }).click();

  // La inscripción del pilar da la pista de los canopos
  dialog = await open(page, 'Inscripción del pilar');
  await expect(dialog).toContainText('Hapy');
  await dialog.getByRole('button', { name: 'Cerrar' }).click();

  // 4 · Canopos: un fallo y luego cada uno en su sitio
  dialog = await open(page, 'Vasos canopos');
  await dialog.getByRole('button', { name: 'Sellar los vasos' }).click();
  await expect(dialog).toContainText('Ningún guardián está en su sitio');
  const target: Record<string, string> = { Norte: 'babuino', Este: 'chacal', Sur: 'humano', Oeste: 'halcón' };
  const jars = dialog.getByRole('button', { name: /^(Norte|Este|Sur|Oeste):/ });
  for (const [dir, animal] of Object.entries(target)) {
    const names = await jars.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') ?? ''));
    const here = names.findIndex((n) => n.startsWith(dir));
    if (names[here].includes(animal)) continue;
    const from = names.findIndex((n) => n.includes(`vaso del ${animal}`));
    await jars.nth(here).click();
    await jars.nth(from).click();
  }
  await dialog.getByRole('button', { name: 'Sellar los vasos' }).click();
  await expect(dialog).toContainText('cerrojo que se abre');
  await dialog.getByRole('button', { name: 'Cerrar' }).click();

  // 5 · Sarcófago: escarabajo en el pecho y coger el mapa
  dialog = await open(page, 'Sarcófago');
  await dialog.getByRole('button', { name: /Escarabajo del corazón/ }).click();
  await dialog.getByRole('button', { name: 'Coger el mapa' }).click();
  await expect(page.getByRole('heading', { name: 'El Mapa del Oasis es tuyo' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Continuar: la huida/ })).toBeVisible();
});

test('en la tumba la luz sigue al puntero', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Se prueba con ratón');
  await atTomb(page);
  await page.goto('/faraon');
  const box = (await page.locator('.scene').boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.2);
  await expect(page.locator('.dark')).toHaveAttribute('style', /--lx: (9\.9|10)/);
});

test('las pistas de la tumba siguen su capítulo', async ({ page }) => {
  await atTomb(page);
  await page.goto('/faraon');
  await page.getByRole('button', { name: 'Pistas' }).click();
  const hints = page.getByRole('complementary', { name: 'Pistas' });
  await hints.getByRole('button', { name: 'Ver pista' }).click();
  await expect(hints).toContainText('oscuro');
});
