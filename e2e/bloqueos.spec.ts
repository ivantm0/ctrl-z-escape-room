import { expect, test } from '@playwright/test';

test.describe('El Origen solo en ordenador', () => {
  test('en móvil la tarjeta y las salas aparecen bloqueadas', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Solo en móvil');
    await page.goto('/');
    const card = page.locator('.game.origen');
    await expect(card).toContainText('Solo en ordenador');
    await expect(page.getByRole('link', { name: /El Origen/ })).toHaveCount(0);
    await page.goto('/origen');
    await expect(page.getByRole('heading', { name: 'Solo en ordenador' })).toBeVisible();
    await page.goto('/sala/oficina');
    await expect(page.getByRole('heading', { name: 'Solo en ordenador' })).toBeVisible();
  });

  test('en ordenador se puede entrar', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Solo en ordenador');
    await page.goto('/');
    await page.getByRole('link', { name: /El Origen/ }).click();
    await expect(page.locator('.corridor li')).toHaveCount(6);
  });
});

test.describe('Entre Bastidores necesita la parte 1', () => {
  test('sin terminar Fuera de Juego, la tarjeta y la ruta están bloqueadas', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.game.bastidores')).toContainText('Termina Fuera de Juego');
    await expect(page.getByRole('link', { name: /Entre Bastidores/ })).toHaveCount(0);
    await page.goto('/entre-bastidores');
    await expect(page.getByRole('heading', { name: 'PARTE 2 BLOQUEADA' })).toBeVisible();
    await page.getByRole('link', { name: /JUGAR A FUERA DE JUEGO/ }).click();
    await expect(page).toHaveURL(/fuera-de-juego/);
  });

  test('con los cuatro mundos superados se desbloquea', async ({ page }) => {
    await page.addInitScript(() =>
      localStorage.setItem('ctrl-escape:pixel:v1', JSON.stringify({ intro: true, world: 4, start: 1, end: 2, end2: 3, end3: 4, end4: 5, muted: true }))
    );
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Entre Bastidores/ })).toHaveAttribute('href', '/entre-bastidores');
  });
});
