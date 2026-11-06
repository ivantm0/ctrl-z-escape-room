import { expect, test, type Page } from '@playwright/test';

const KEY = 'ctrl-escape:pixel:v1';
const BEFORE = ['cajas', 'cofre', 'rocas', 'runas', 'puerta', 'hielo', 'cristal', 'campanas', 'corona', 'portal'];

/** Empieza en el mundo 3 (1 y 2 superados) */
const inWorld3 = (page: Page, w3: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
  page.addInitScript(
    ([key, w3, extra, before]) => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      const now = Date.now();
      localStorage.setItem(
        key,
        JSON.stringify({
          intro: true,
          intro2: true,
          intro3: true,
          world: 3,
          start: now - 900_000,
          end: now - 600_000,
          end2: now - 1000,
          muted: true,
          done: before,
          ...extra,
          w3: { screen: 'plaza', x: 10, y: 16, dir: 'up', night: false, statues: [], boxesDone: false, running: false, ...w3 },
        })
      );
    },
    [KEY, w3, extra, BEFORE] as const
  );

const KEYS: Record<string, string> = { U: 'ArrowUp', D: 'ArrowDown', L: 'ArrowLeft', R: 'ArrowRight', A: 'Space' };
async function play(page: Page, moves: string) {
  await expect(page.locator('canvas[data-screen]')).toBeVisible();
  await page.waitForTimeout(150);
  for (const m of moves.replace(/\s/g, '')) {
    await page.keyboard.press(KEYS[m]);
    await page.waitForTimeout(125);
  }
}
const game = (page: Page) => page.locator('canvas[data-screen]');
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Diálogo' });

test.describe('mundo 3', () => {
  test.skip(({ isMobile }) => isMobile, 'Se juega con teclado; la cruceta se prueba en el mundo 1');

  test('del mundo 2 se pasa al 3 con su intro', async ({ page }) => {
    await page.addInitScript(
      ([key, before]) => {
        if (sessionStorage.getItem('seeded')) return;
        sessionStorage.setItem('seeded', '1');
        const now = Date.now();
        localStorage.setItem(key, JSON.stringify({ intro: true, intro2: true, world: 2, start: now - 90_000, end: now - 60_000, end2: now, muted: true, done: before }));
      },
      [KEY, BEFORE] as const
    );
    await page.goto('/fuera-de-juego');
    await page.getByRole('button', { name: /CONTINUAR: MUNDO 3/ }).click();
    await expect(page.getByText(/ciudad llena de engranajes/)).toBeVisible();
    await page.getByRole('button', { name: 'SALTAR' }).click();
    await expect(game(page)).toHaveAttribute('data-screen', 'plaza');
    await expect(page.getByRole('banner')).toContainText('MUNDO 3');
  });

  test('plaza: de noche se ve el orden de las estatuas y dan un engranaje', async ({ page }) => {
    await inWorld3(page, {});
    await page.goto('/fuera-de-juego');
    // Reloj de sol: cae la noche
    await play(page, 'UUUURRRR UA');
    await expect(dialog(page)).toContainText('cae la noche');
    await play(page, 'A');
    await expect(game(page)).toHaveAttribute('data-night', 'si');
    // Un fallo: empezar por el gato
    await play(page, 'LUUUULLLLLLLL UA');
    await expect(dialog(page)).toContainText('vuelven a su posición');
    await play(page, 'A');
    // Búho, rana, gato y zorro
    await play(page, 'LUUUUR UA A RRRRRRRRR UA A DDLDDLLLLLLLL UA A RRRRRRRRR UA');
    await expect(dialog(page)).toContainText('giran la cabeza');
    await play(page, 'AA');
    await expect(dialog(page)).toContainText('ENGRANAJE DE PLATA');
  });

  test('laboratorio: girar seis de los nueve espejos hasta que el rayo llegue al receptor', async ({ page }) => {
    await inWorld3(page, { screen: 'espejos', x: 10, y: 14, dir: 'up' });
    await page.goto('/fuera-de-juego');
    await expect(game(page)).toHaveAttribute('data-beam', 'no');
    // Girar uno y reiniciar con R
    const initial = (await game(page).getAttribute('data-mirrors'))!;
    await play(page, 'L LA');
    await expect(game(page)).not.toHaveAttribute('data-mirrors', initial);
    await page.keyboard.press('r');
    await expect(dialog(page)).toContainText('vuelven a como estaban');
    await expect(game(page)).toHaveAttribute('data-mirrors', initial);
    await play(page, 'A');
    // Seis espejos; los otros tres son señuelos
    await play(page, 'L LA ULLD LA UL UA RUUUUR UA DDRRRRRRRRRD LA D LA');
    await expect(game(page)).toHaveAttribute('data-beam', 'receptor');
    await expect(dialog(page)).toContainText('El rayo llega al receptor');
    await play(page, 'AA');
    await expect(dialog(page)).toContainText('ENGRANAJE DE CRISTAL');
  });

  test('almacén: cinco cajas sobre cinco marcas', async ({ page }) => {
    test.setTimeout(90_000);
    await inWorld3(page, { screen: 'almacen', x: 9, y: 12, dir: 'up' });
    await page.goto('/fuera-de-juego');
    // Un empuje y R lo recoloca todo
    await play(page, 'U');
    await expect(game(page)).toHaveAttribute('data-boxes', '8,7 8,9 9,7 9,8 9,10');
    await page.keyboard.press('r');
    await expect(dialog(page)).toContainText('vuelven a su sitio');
    await play(page, 'A');
    await play(page, 'UURUULLRRDDLLURRRUUULLDDRDDLLURRLLLURLLUURDRDRRRUULLDLDRUURRDDRUULLLDDRLULLLDRRURURRDRDDRUULULLLDLDDRRURLDLLURRLUURRDRRDDLUULULLDDRRURRDDLULLDR');
    await expect(dialog(page)).toContainText('Las cinco marcas se iluminan');
    await play(page, 'AA');
    await expect(dialog(page)).toContainText('ENGRANAJE DE BRONCE');
  });

  test('torre del reloj: tres engranajes y el portal', async ({ page }) => {
    await inWorld3(
      page,
      { screen: 'reloj', x: 10, y: 14, dir: 'up' },
      { items: ['engEspejos', 'engAlmacen', 'engEstatuas'], done: [...BEFORE, 'espejos', 'almacen', 'estatuas'] }
    );
    await page.goto('/fuera-de-juego');
    await play(page, 'UUUUUUUUU U A');
    await expect(dialog(page)).toContainText('TIC… TAC');
    await play(page, 'AAA DDDD');
    await expect(page.getByRole('heading', { name: '¡EL TIEMPO VUELVE A CORRER!' })).toBeVisible();
    await expect(page.getByRole('button', { name: /CONTINUAR: MUNDO 4/ })).toBeVisible();
  });

  test('las pistas son las de la sala en la que está Leo', async ({ page }) => {
    await inWorld3(page, { screen: 'almacen', x: 9, y: 12, dir: 'up' });
    await page.goto('/fuera-de-juego');
    await expect(game(page)).toHaveAttribute('data-screen', 'almacen');
    await page.getByRole('button', { name: 'Pistas' }).click();
    await page.getByRole('button', { name: 'VER PISTA' }).click();
    await expect(page.getByRole('complementary', { name: 'Pistas' })).toContainText('cinco cajas');
  });

  test('la máquina avisa si faltan engranajes', async ({ page }) => {
    await inWorld3(page, { screen: 'reloj', x: 10, y: 5, dir: 'up' }, { items: ['engEspejos'] });
    await page.goto('/fuera-de-juego');
    await play(page, 'A');
    await expect(dialog(page)).toContainText('Tienes 1 de 3');
  });
});
