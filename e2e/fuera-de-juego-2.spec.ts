import { expect, test, type Page } from '@playwright/test';

const KEY = 'ctrl-escape:pixel:v1';
const WORLD1 = ['cajas', 'cofre', 'rocas', 'runas', 'puerta'];

/** Empieza en el mundo 2 (el 1 ya superado) en la sala y casilla indicadas */
const inWorld2 = (page: Page, w2: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
  page.addInitScript(
    ([key, w2, extra, world1]) => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      const now = Date.now();
      localStorage.setItem(
        key,
        JSON.stringify({
          intro: true,
          intro2: true,
          world: 2,
          start: now - 600_000,
          end: now - 1000,
          muted: true,
          done: world1,
          items: ['farol', 'pico', 'llave'],
          used: ['llave'],
          ...extra,
          w2: { screen: 'patio', x: 9, y: 15, dir: 'up', red: true, song: [], awake: false, ...w2 },
        })
      );
    },
    [KEY, w2, extra, WORLD1] as const
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
const expectAt = async (page: Page, screen: string, x: number, y: number) => {
  await expect(game(page)).toHaveAttribute('data-screen', screen);
  await expect(game(page)).toHaveAttribute('data-x', String(x));
  await expect(game(page)).toHaveAttribute('data-y', String(y));
};
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Diálogo' });

test.describe('mundo 2', () => {
  test.skip(({ isMobile }) => isMobile, 'Se juega con teclado; la cruceta se prueba en el mundo 1');

  test('del mundo 1 se pasa al 2 con su intro', async ({ page }) => {
    await page.addInitScript(
      ([key, world1]) => {
        if (sessionStorage.getItem('seeded')) return;
        sessionStorage.setItem('seeded', '1');
        localStorage.setItem(key, JSON.stringify({ intro: true, start: Date.now() - 60_000, end: Date.now(), muted: true, done: world1 }));
      },
      [KEY, WORLD1] as const
    );
    await page.goto('/fuera-de-juego');
    await page.getByRole('button', { name: /CONTINUAR: MUNDO 2/ }).click();
    await expect(page.getByText(/estalla en colores/)).toBeVisible();
    await page.getByRole('button', { name: 'SALTAR' }).click();
    await expectAt(page, 'patio', 9, 15);
    await expect(page.getByRole('banner')).toContainText('MUNDO 2');
  });

  test('el guardia explica la misión y el libro está escrito al revés', async ({ page }) => {
    await inWorld2(page, {});
    await page.goto('/fuera-de-juego');
    await play(page, 'UUUUUUUU RRRRR U A');
    await expect(dialog(page)).toContainText('Bitópolis');
    await play(page, 'AAAAA');
    await play(page, 'R UU R U A A');
    await expect(dialog(page)).toContainText('yer led nóicnac aL');
  });

  test('sala de hielo: resbalar hasta el fragmento y volver con R', async ({ page }) => {
    await inWorld2(page, { screen: 'hielo', x: 18, y: 9, dir: 'left' });
    await page.goto('/fuera-de-juego');
    // Un deslizamiento recorre todo el hielo hasta chocar con el muro
    await play(page, 'L L');
    await expectAt(page, 'hielo', 2, 9);
    await page.keyboard.press('r');
    await expect(dialog(page)).toContainText('vuelves a la entrada');
    await play(page, 'A');
    await expectAt(page, 'hielo', 18, 9);
    // Solución: 13 pulsaciones
    await play(page, 'LLURDRULULDLU');
    await expect(game(page)).toHaveAttribute('data-facing', 'X');
    await play(page, 'A');
    await expect(dialog(page)).toContainText('trozo de corona');
    await play(page, 'A');
    await expect(dialog(page)).toContainText('FRAGMENTO HELADO');
    await play(page, 'A');
    await expect(page.getByRole('button', { name: 'Fragmento helado' })).toBeVisible();
  });

  test('sala de cristal: cinco cambios de color hasta el fragmento', async ({ page }) => {
    await inWorld2(page, { screen: 'cristal', x: 1, y: 9, dir: 'right' });
    await page.goto('/fuera-de-juego');
    await expect(game(page)).toHaveAttribute('data-color', 'rojo');
    await play(page, 'RRUA');
    await expect(game(page)).toHaveAttribute('data-color', 'azul');
    await play(page, 'RULAULDAURRDRDRRRDRUARULAUUUURRRA');
    await expect(dialog(page)).toContainText('trozo de corona');
    await play(page, 'A');
    await expect(dialog(page)).toContainText('FRAGMENTO DE CRISTAL');
    await play(page, 'A');
    // Con R se vuelve a la entrada aunque la sala ya esté resuelta
    await page.keyboard.press('r');
    await play(page, 'A');
    await expectAt(page, 'cristal', 1, 9);
  });

  test('torre de campanas: la canción del rey (y un intento fallido)', async ({ page }) => {
    await inWorld2(page, { screen: 'campanas', x: 10, y: 15, dir: 'up' });
    await page.goto('/fuera-de-juego');
    await play(page, 'UUUUUUUUU U A');
    await expect(dialog(page)).toContainText('desafina');
    await play(page, 'A');
    await play(page, 'LLLL U A RR U A RRRR U A LL U A');
    await expect(game(page)).toHaveAttribute('data-song', '4');
    await play(page, 'LLLL U A');
    await expect(dialog(page)).toContainText('resuena por toda la torre');
    await play(page, 'AA');
    await expect(dialog(page)).toContainText('FRAGMENTO SONORO');
  });

  test('sala del trono: corona, rey despierto y portal', async ({ page }) => {
    await inWorld2(
      page,
      { screen: 'trono', x: 10, y: 15, dir: 'up' },
      { items: ['farol', 'pico', 'llave', 'fragHielo', 'fragCristal', 'fragCampana'], done: [...WORLD1, 'hielo', 'cristal', 'campanas'] }
    );
    await page.goto('/fuera-de-juego');
    // El rey no despierta sin corona
    await play(page, 'UUUUUUUU L UUU R U A');
    await expect(dialog(page)).toContainText('duerme');
    await play(page, 'AA');
    // Altar: los tres fragmentos forman la corona
    await play(page, 'L DDD R U A');
    await expect(dialog(page)).toContainText('tres fragmentos');
    await play(page, 'AAA');
    await expect(page.getByRole('button', { name: 'Corona de Pixelio' })).toBeVisible();
    // Coronar al rey y cruzar el portal
    await play(page, 'L UUU R U A');
    await expect(dialog(page)).toContainText('corona sobre la cabeza');
    await play(page, 'AAAA RRR U');
    await expect(page.getByRole('heading', { name: '¡EL REY HA DESPERTADO!' })).toBeVisible();
    await expect(page.getByRole('button', { name: /CONTINUAR: MUNDO 3/ })).toBeVisible();
  });

  test('el altar avisa si faltan fragmentos', async ({ page }) => {
    await inWorld2(page, { screen: 'trono', x: 10, y: 7, dir: 'up' }, { items: ['fragHielo', 'fragCristal'] });
    await page.goto('/fuera-de-juego');
    await play(page, 'A');
    await expect(dialog(page)).toContainText('Tienes 2 de 3');
  });

  test('las pistas siguen el mundo 2', async ({ page }) => {
    await inWorld2(page, {});
    await page.goto('/fuera-de-juego');
    await page.getByRole('button', { name: 'Pistas' }).click();
    const hints = page.getByRole('complementary', { name: 'Pistas' });
    await hints.getByRole('button', { name: 'VER PISTA' }).click();
    await expect(hints).toContainText('hielo');
  });
});
