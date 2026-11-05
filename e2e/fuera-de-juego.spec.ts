import { expect, test, type Page } from '@playwright/test';

const KEY = 'ctrl-escape:pixel:v1';

/** Empieza ya dentro del juego (intro vista) */
const skipIntro = (page: Page, extra: Record<string, unknown> = {}) =>
  page.addInitScript(
    ([key, extra]) => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem(key, JSON.stringify({ intro: true, start: Date.now(), muted: true, ...extra }));
    },
    [KEY, extra] as const
  );

const KEYS: Record<string, string> = { U: 'ArrowUp', D: 'ArrowDown', L: 'ArrowLeft', R: 'ArrowRight', A: 'Space' };

/** Pulsa una secuencia de teclas: U D L R para moverse, A para interactuar */
async function play(page: Page, moves: string) {
  // Espera a que el juego esté montado y escuchando el teclado
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

test('la portada ofrece Fuera de Juego', async ({ page }) => {
  await page.goto('/');
  await page.locator('a[href="/fuera-de-juego"]').click();
  await expect(page).toHaveURL(/\/fuera-de-juego$/);
  await expect(page.getByText(/Son las 3:07/)).toBeVisible();
});

test('la intro cuenta la historia y lleva al pueblo', async ({ page }) => {
  await page.goto('/fuera-de-juego');
  for (let i = 0; i < 12 && (await page.getByRole('button', { name: /SIGUIENTE/ }).count()); i++) {
    await page.getByRole('button', { name: /SIGUIENTE/ }).click();
  }
  await expect(page.getByText(/Leo está DENTRO del juego/)).toBeVisible();
  await page.getByRole('button', { name: /EMPEZAR/ }).click();
  await expectAt(page, 'pueblo', 14, 14);
});

test('el mundo 1 completo jugando con el teclado', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Con teclado; el móvil prueba la cruceta aparte');
  test.setTimeout(120_000);
  await skipIntro(page);
  await page.goto('/fuera-de-juego');
  await expectAt(page, 'pueblo', 14, 14);

  // La cueva no deja entrar sin luz
  await play(page, 'UUUU');
  await expectAt(page, 'pueblo', 14, 10);
  await play(page, 'DDDD');

  // 1 · Jardín: dos cajas sobre dos baldosas
  await play(page, 'LLL UUUU LLLLL DD');
  await expectAt(page, 'pueblo', 6, 12);
  await play(page, 'LLL D RR');
  await expect(game(page)).toHaveAttribute('data-crates', '6,13 4,14');
  await play(page, 'L D L D RR');
  await expect(dialog(page)).toContainText('Las dos baldosas se hunden');
  await play(page, 'AA');
  await play(page, 'UUU RRR A');
  await expect(dialog(page)).toContainText('FAROL');
  await play(page, 'AA');
  await expect(page.getByRole('button', { name: 'Farol' })).toBeVisible();

  // 2 · Casa del anciano: historia, diario y baúl
  await play(page, 'LL UU LLL UU');
  await expectAt(page, 'casa', 9, 9);
  await play(page, 'UUUU RRR U A');
  await expect(dialog(page)).toContainText('Otro jugador');
  await play(page, 'AAAAAA');
  await play(page, 'DDD LLLLL U A');
  await expect(dialog(page)).toContainText('diario');
  await play(page, 'AAA');
  await play(page, 'RRRRRR U A');
  const lock = page.getByRole('dialog', { name: 'Candado del baúl' });
  await expect(lock).toBeVisible();
  await lock.getByRole('button', { name: 'ABRIR' }).click();
  await expect(lock).toContainText('NO SE ABRE');
  for (const [wheel, n] of [[1, 3], [2, 2], [3, 5], [4, 4]]) {
    for (let i = 0; i < n; i++) await lock.getByRole('button', { name: `Rueda ${wheel}: subir` }).click();
  }
  await lock.getByRole('button', { name: 'ABRIR' }).click();
  await expect(dialog(page)).toContainText('baúl se abre');
  await play(page, 'AAA');
  await expect(page.getByRole('button', { name: 'Pico' })).toBeVisible();

  // 3 · Cueva: rocas con el pico
  await play(page, 'LLLL D D');
  await expectAt(page, 'pueblo', 3, 9);
  await play(page, 'RRRRRRRRRR UUU RRRRR UUUU U');
  await expectAt(page, 'cueva', 10, 16);
  await play(page, 'UUU U A U A UUU');
  await expectAt(page, 'cueva', 10, 9);

  // 4 · Runas: arriba-izquierda, centro y abajo-derecha
  await expect(game(page)).toHaveAttribute('data-runes', '6');
  await play(page, 'RR U A');
  await play(page, 'U LL U A');
  await play(page, 'L L UU A');
  await expect(dialog(page)).toContainText('nueve runas brillan');
  await play(page, 'AA');
  await play(page, 'U RR U U A');
  await expect(dialog(page)).toContainText('llave hecha de píxeles');
  await play(page, 'AA');

  // 5 · La Puerta del Cartucho
  await play(page, 'DDDDDDDDDDDDDD D');
  await expectAt(page, 'pueblo', 18, 2);
  await play(page, 'DD LLLLLLLLLLL UU U A');
  await expect(dialog(page)).toContainText('LLAVE DE PÍXEL');
  await play(page, 'AAA U');
  await expect(page.getByRole('heading', { name: '¡LEO CRUZA LA PUERTA!' })).toBeVisible();
  await expect(page.getByLabel('3 de 3 estrellas')).toBeVisible();
});

test('sin farol no se entra en la cueva', async ({ page, isMobile }) => {
  test.skip(isMobile);
  await skipIntro(page, { w: { screen: 'pueblo', x: 18, y: 2, dir: 'up' } });
  await page.goto('/fuera-de-juego');
  await play(page, 'U');
  await expect(dialog(page)).toContainText('Está oscurísimo');
  await expectAt(page, 'pueblo', 18, 2);
});

test('las cajas atascadas se recolocan con R', async ({ page, isMobile }) => {
  test.skip(isMobile);
  await skipIntro(page, { w: { screen: 'pueblo', x: 3, y: 13, dir: 'right' } });
  await page.goto('/fuera-de-juego');
  await play(page, 'RRRR');
  await expect(game(page)).toHaveAttribute('data-crates', '8,13 4,14');
  // Encima del sitio de una caja no se puede recolocar
  await play(page, 'LLL');
  await page.keyboard.press('r');
  await expect(dialog(page)).toContainText('Apártate');
  await play(page, 'A L');
  await page.keyboard.press('r');
  await expect(game(page)).toHaveAttribute('data-crates', '4,13 4,14');
});

test('en móvil se juega con la cruceta y el botón A', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Solo en móvil');
  await skipIntro(page);
  await page.goto('/fuera-de-juego');
  const tap = async (name: string, times = 1) => {
    for (let i = 0; i < times; i++) {
      const b = page.getByRole('button', { name });
      await b.dispatchEvent('pointerdown');
      await b.dispatchEvent('pointerup');
      await page.waitForTimeout(140);
    }
  };
  await tap('Mover izquierda', 3);
  await tap('Mover arriba', 2);
  await expectAt(page, 'pueblo', 11, 12);
  await tap('Mover derecha');
  await page.getByRole('button', { name: 'Botón A: interactuar' }).click();
  await expect(dialog(page)).toContainText('JARDÍN DEL ANCIANO');
});

test('las pistas siguen el progreso', async ({ page }) => {
  await skipIntro(page);
  await page.goto('/fuera-de-juego');
  await page.getByRole('button', { name: 'Pistas' }).click();
  const hints = page.getByRole('complementary', { name: 'Pistas' });
  await hints.getByRole('button', { name: 'VER PISTA' }).click();
  await expect(hints).toContainText('jardín');
});

test('las runas se reinician con R (y con el botón ↺)', async ({ page, isMobile }) => {
  await skipIntro(page, { items: ['farol', 'pico'], w: { screen: 'cueva', x: 10, y: 6, dir: 'up', rocks: [true, true] } });
  await page.goto('/fuera-de-juego');
  await expect(game(page)).toHaveAttribute('data-runes', '6');
  // Pulsar la runa del centro cambia cinco runas
  if (isMobile) await page.getByRole('button', { name: 'Botón A: interactuar' }).click();
  else await play(page, 'A');
  await expect(game(page)).not.toHaveAttribute('data-runes', '6');
  if (isMobile) await page.getByRole('button', { name: 'Reiniciar las runas' }).click();
  else await page.keyboard.press('r');
  await expect(dialog(page)).toContainText('vuelven a como estaban');
  await expect(game(page)).toHaveAttribute('data-runes', '6');
});
