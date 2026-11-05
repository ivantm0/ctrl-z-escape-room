import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const unlock = async (page: Page, answer: string) => {
  await page.locator('#lock-input').fill(answer);
  await page.getByRole('button', { name: 'Probar' }).click();
  await expect(page.getByText('Desbloqueado')).toBeVisible();
};

/** Simula que el jugador cambia de pestaña y vuelve */
const leaveAndReturn = (page: Page) =>
  page.evaluate(() => {
    for (const state of ['hidden', 'visible']) {
      Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    }
  });

/** Marca La Oficina como superada sin jugarla */
const skipOffice = (page: Page) =>
  page.addInitScript(() => {
    localStorage.setItem('ctrl-escape:v1', JSON.stringify({ oficina: { level: 3, hints: {}, start: 0, end: 60_000 } }));
  });

test.describe('vestíbulo', () => {
  test('muestra las 6 salas: la primera abierta y el resto cerradas', async ({ page }) => {
    await page.goto('/origen');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Escape');
    await expect(page.locator('.corridor li')).toHaveCount(6);
    await expect(page.getByRole('link', { name: /La Oficina/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /El Observatorio/ })).toHaveCount(0);
    await expect(page.getByText('Supera la sala anterior')).toHaveCount(5);
  });

  test('una sala cerrada no deja entrar', async ({ page }) => {
    await page.goto('/sala/observatorio');
    await expect(page.getByText('La puerta no cede.')).toBeVisible();
  });

  test('sin errores de accesibilidad', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/origen');
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});

test('La Oficina se resuelve con la consola, el título y la selección', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', (msg) => logs.push(msg.text()));

  await page.goto('/origen');
  await page.getByRole('link', { name: /La Oficina/ }).click();

  // 1 · La contraseña está en la consola
  await expect(page.getByRole('heading', { name: 'Inicio de sesión' })).toBeVisible();
  await expect.poll(() => logs.join(' ')).toContain('FÓSFORO');
  await page.locator('#lock-input').fill('nope');
  await page.getByRole('button', { name: 'Probar' }).click();
  await expect(page.getByText('Clave incorrecta')).toBeVisible();
  await unlock(page, 'fósforo');

  // 2 · El título de la pestaña deletrea la clave
  await expect(page.getByRole('heading', { name: 'El post-it' })).toBeVisible();
  await expect.poll(() => page.title(), { timeout: 5000 }).toMatch(/^\[\d\/7\] [A-ZÑ]$/);
  await unlock(page, 'PESTAÑA');

  // 3 · El texto invisible aparece al seleccionarlo
  await expect(page.getByRole('heading', { name: 'Documento confidencial' })).toBeVisible();
  await page.locator('.paper').selectText();
  expect(await page.evaluate(() => getSelection()?.toString())).toContain('SUBRAYADO');
  await unlock(page, 'subrayado');

  // Final de sala
  await expect(page.getByRole('heading', { name: /Has escapado de/ })).toBeVisible();
  await expect(page.getByLabel('3 de 3 estrellas')).toBeVisible();
  await page.getByRole('link', { name: /Siguiente sala/ }).click();
  await expect(page).toHaveURL(/\/sala\/observatorio$/);
});

test('las pistas se revelan de una en una y la última es la solución', async ({ page }) => {
  await page.goto('/sala/oficina');
  await page.getByRole('button', { name: /Pistas/ }).click();
  const hints = page.getByRole('complementary', { name: 'Pistas' });
  await hints.getByRole('button', { name: 'Ver pista' }).click();
  await hints.getByRole('button', { name: 'Ver pista clara' }).click();
  await hints.getByRole('button', { name: 'Ver solución' }).click();
  await expect(hints.getByRole('listitem')).toHaveCount(3);
  await expect(hints).toContainText('FÓSFORO');
  await expect(hints.getByRole('button')).toHaveCount(0);
});

test('el progreso se guarda al recargar', async ({ page }) => {
  await page.goto('/sala/oficina');
  await unlock(page, 'fosforo');
  await expect(page.getByRole('heading', { name: 'El post-it' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'El post-it' })).toBeVisible();
  await page.goto('/origen');
  await expect(page.getByRole('link', { name: /La Oficina/ })).toContainText('nivel 2/3');
});

test('El Observatorio se resuelve con el tema, la ventana y las pestañas', async ({ page, isMobile }) => {
  test.skip(isMobile, 'El enfoque por tamaño de ventana se prueba en escritorio');
  await skipOffice(page);

  // 1 · De día no hay estrellas; en modo oscuro aparece la constelación
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/sala/observatorio');
  await expect(page.getByRole('img', { name: /Cielo de día/ })).toBeVisible();
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.getByRole('img', { name: /constelación/ })).toBeVisible();
  await unlock(page, '407');

  // 2 · El telescopio enfoca con la ventana cuadrada
  await expect(page.getByRole('heading', { name: 'El telescopio' })).toBeVisible();
  const meter = page.getByRole('meter', { name: 'Enfoque' });
  expect(Number(await meter.getAttribute('aria-valuenow'))).toBeLessThan(50);
  await page.setViewportSize({ width: 800, height: 800 });
  await expect(meter).toHaveAttribute('aria-valuenow', '100');
  await unlock(page, 'saturno');

  // 3 · Cada vuelta a la pestaña añade una estrella fugaz al registro
  await expect(page.getByRole('heading', { name: 'Estrellas fugaces' })).toBeVisible();
  for (let i = 0; i < 4; i++) await leaveAndReturn(page);
  await expect(page.getByText('El registro está completo.')).toBeVisible();
  await unlock(page, 'lira');

  await expect(page.getByRole('heading', { name: /Has escapado de/ })).toBeVisible();
});

test('en móvil el telescopio enfoca al girar el teléfono', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Solo en móvil');
  await page.addInitScript(() => {
    localStorage.setItem(
      'ctrl-escape:v1',
      JSON.stringify({
        oficina: { level: 3, hints: {}, start: 0, end: 1 },
        observatorio: { level: 1, hints: {}, start: 0, end: null },
      })
    );
  });
  await page.goto('/sala/observatorio');
  const meter = page.getByRole('meter', { name: 'Enfoque' });
  await expect(meter).toHaveAttribute('aria-valuenow', '0');
  await page.setViewportSize({ width: 915, height: 412 });
  await expect(meter).toHaveAttribute('aria-valuenow', '100');
});

test('no hay scroll horizontal en ninguna pantalla', async ({ page }) => {
  test.setTimeout(90_000);
  const ids = ['oficina', 'observatorio', 'radio', 'laboratorio', 'archivo', 'maquina'];
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '/').toBe(true);
  for (const id of ids) {
    for (const level of [0, 1, 2]) {
      // Todas las salas abiertas («end» puesto) y la que se mira en el nivel indicado
      await page.evaluate(
        ([ids, id, level]) => {
          const rooms: Record<string, unknown> = {};
          for (const r of ids as string[]) rooms[r] = { level: r === id ? level : 0, hints: {}, start: 0, end: 1 };
          localStorage.setItem('ctrl-escape:v1', JSON.stringify(rooms));
        },
        [ids, id, level] as const
      );
      await page.goto(`/sala/${id}`);
      await page.waitForLoadState('networkidle');
      const where = `${id} nivel ${level + 1}`;
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), where).toBe(true);
    }
  }
});
