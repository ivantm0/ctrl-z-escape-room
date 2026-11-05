import { expect, test, type Page } from '@playwright/test';

const KEY = 'ctrl-escape:pixel:v1';
const BEFORE = ['cajas', 'cofre', 'rocas', 'runas', 'puerta', 'hielo', 'cristal', 'campanas', 'corona', 'portal', 'espejos', 'almacen', 'estatuas', 'reloj', 'tiempo'];

/** Empieza en el mundo 4 (1, 2 y 3 superados) */
const inWorld4 = (page: Page, w4: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
  page.addInitScript(
    ([key, w4, extra, before]) => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      const now = Date.now();
      localStorage.setItem(
        key,
        JSON.stringify({
          intro: true,
          intro2: true,
          intro3: true,
          intro4: true,
          world: 4,
          start: now - 900_000,
          end: now - 700_000,
          end2: now - 500_000,
          end3: now - 1000,
          muted: true,
          done: before,
          ...extra,
          w4: { screen: 'vestibulo', x: 10, y: 15, dir: 'up', clone: [15, 15], bits: [false, false, false, false], debug: false, fixed: false, ...w4 },
        })
      );
    },
    [KEY, w4, extra, BEFORE] as const
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

test.describe('mundo 4', () => {
  test.skip(({ isMobile }) => isMobile, 'Se juega con teclado; la cruceta se prueba en el mundo 1');

  test('del mundo 3 se pasa al 4 con su intro', async ({ page }) => {
    await page.addInitScript(
      ([key, before]) => {
        if (sessionStorage.getItem('seeded')) return;
        sessionStorage.setItem('seeded', '1');
        const now = Date.now();
        localStorage.setItem(
          key,
          JSON.stringify({ intro: true, intro2: true, intro3: true, world: 3, start: now - 90_000, end: now - 60_000, end2: now - 30_000, end3: now, muted: true, done: before })
        );
      },
      [KEY, BEFORE] as const
    );
    await page.goto('/fuera-de-juego');
    await page.getByRole('button', { name: /CONTINUAR: MUNDO 4/ }).click();
    await expect(page.getByText(/se rompe a mitad de viaje/)).toBeVisible();
    await page.getByRole('button', { name: 'SALTAR' }).click();
    await expect(game(page)).toHaveAttribute('data-screen', 'vestibulo');
    await expect(page.getByRole('banner')).toContainText('MUNDO 4');
  });

  test('gemelo: el reflejo va al revés y hay que llevar a los dos a sus placas', async ({ page }) => {
    await inWorld4(page, { screen: 'gemelo', x: 4, y: 15, clone: [15, 15] });
    await page.goto('/fuera-de-juego');
    // Leo choca a la izquierda, pero su reflejo sí avanza (a la derecha)
    await play(page, 'L');
    await expect(game(page)).toHaveAttribute('data-x', '4');
    await expect(game(page)).toHaveAttribute('data-clone', '16,15');
    await page.keyboard.press('r');
    await expect(dialog(page)).toContainText('volvéis a la entrada');
    await play(page, 'A');
    await expect(game(page)).toHaveAttribute('data-clone', '15,15');
    await play(page, 'URRRUUULURUUULLDRRRDLDLDLDLDRRRUUUUUUUUUUD');
    await expect(dialog(page)).toContainText('pisáis las dos placas');
    await play(page, 'AA');
    await expect(dialog(page)).toContainText('FRAGMENTO DE CÓDIGO A');
  });

  test('sin colisiones: el modo depuración congela y las paredes falsas se atraviesan', async ({ page }) => {
    await inWorld4(page, { screen: 'noclip', x: 10, y: 15 });
    await page.goto('/fuera-de-juego');
    await play(page, 'R D A');
    await expect(game(page)).toHaveAttribute('data-debug', 'si');
    await play(page, 'A L');
    await expect(dialog(page)).toContainText('congelado');
    await play(page, 'A D A A A L');
    await expect(game(page)).toHaveAttribute('data-debug', 'no');
    await expect(game(page)).toHaveAttribute('data-x', '10');
    await play(page, 'RRURRUULLLDLLULULLUUURRRRRRUUUUULL');
    await expect(dialog(page)).toContainText('bloque de datos');
    await play(page, 'A');
    await expect(dialog(page)).toContainText('FRAGMENTO DE CÓDIGO B');
  });

  test('memoria: cada interruptor cambia también los de su derecha', async ({ page }) => {
    await inWorld4(page, { screen: 'memoria', x: 10, y: 10 });
    await page.goto('/fuera-de-juego');
    await play(page, 'UUUU LLL UA');
    await expect(game(page)).toHaveAttribute('data-bits', '1111');
    await page.keyboard.press('r');
    await expect(dialog(page)).toContainText('se apagan');
    await play(page, 'A');
    await expect(game(page)).toHaveAttribute('data-bits', '0000');
    await play(page, 'UA RRRR UA RR UA');
    await expect(game(page)).toHaveAttribute('data-bits', '1101');
    await expect(dialog(page)).toContainText('0x0D');
    await play(page, 'AA');
    await expect(dialog(page)).toContainText('FRAGMENTO DE CÓDIGO C');
  });

  test('núcleo: avisa si faltan fragmentos', async ({ page }) => {
    await inWorld4(page, {}, { items: ['datGemelo'] });
    await page.goto('/fuera-de-juego');
    await play(page, 'UUUUUU U A');
    await expect(dialog(page)).toContainText('Tienes 1 de 3');
  });

  test('núcleo y salida: final del juego', async ({ page }) => {
    await inWorld4(page, {}, { items: ['datGemelo', 'datNoclip', 'datMemoria'], done: [...BEFORE, 'gemelo', 'noclip', 'memoria'] });
    await page.goto('/fuera-de-juego');
    await play(page, 'UUUUUU U A');
    await expect(dialog(page)).toContainText('COMPILANDO');
    await play(page, 'AAA');
    await expect(game(page)).toHaveAttribute('data-fixed', 'si');
    await play(page, 'DD');
    await expect(page.getByRole('heading', { name: '¡LEO VUELVE A CASA!' })).toBeVisible();
    await expect(page.getByText('JUEGO COMPLETADO')).toBeVisible();
    await page.getByRole('button', { name: 'REPETIR EL MUNDO 4' }).click();
    await expect(game(page)).toHaveAttribute('data-screen', 'vestibulo');
  });
});
