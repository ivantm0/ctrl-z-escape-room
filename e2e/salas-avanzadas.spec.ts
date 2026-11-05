import { expect, test, type Page } from '@playwright/test';

const ORDER = ['oficina', 'observatorio', 'radio', 'laboratorio', 'archivo', 'maquina'];

const unlock = async (page: Page, answer: string) => {
  await page.locator('#lock-input').fill(answer);
  await page.getByRole('button', { name: 'Probar' }).click();
  await expect(page.getByText('Desbloqueado')).toBeVisible();
};

/** Entra en una sala con todas las anteriores ya superadas (solo en la primera carga) */
const enter = async (page: Page, id: string) => {
  const done = ORDER.slice(0, ORDER.indexOf(id));
  await page.addInitScript((done) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    const rooms: Record<string, unknown> = {};
    for (const r of done) rooms[r] = { level: 3, hints: {}, start: 0, end: 60_000 };
    localStorage.setItem('ctrl-escape:v1', JSON.stringify(rooms));
  }, done);
  await page.goto(`/sala/${id}`);
};

test('La Radio Pirata: sintonizar, morse y pantalla completa', async ({ page }) => {
  await enter(page, 'radio');

  // 1 · Señal máxima en 98.6 y subtítulos con el mensaje
  await page.getByRole('button', { name: 'Encender' }).click();
  await page.getByLabel('Dial de frecuencia').fill('98.6');
  await expect(page.getByRole('meter', { name: 'Intensidad de la señal' })).toHaveAttribute('aria-valuenow', '100');
  await page.getByRole('button', { name: 'CC' }).click();
  await expect(page.getByText(/contraseña de hoy es antena/)).toBeVisible();
  await unlock(page, 'antena');

  // 2 · La bombilla parpadea en morse
  await expect(page.getByRole('heading', { name: 'La luz del estudio' })).toBeVisible();
  await expect(page.locator('.bulb.lit')).toHaveCount(1);
  await expect(page.locator('.bulb.lit')).toHaveCount(0);
  await unlock(page, 'faro');

  // 3 · A pantalla completa aparece la clave
  await expect(page.getByText('SEÑAL DÉBIL')).toBeVisible();
  await page.getByRole('button', { name: 'MAX' }).click();
  await expect(page.getByText('EMISIÓN A PLENA POTENCIA')).toBeVisible();
  await unlock(page, 'eco');
  await expect(page.getByRole('heading', { name: /Has escapado de/ })).toBeVisible();
});

test('El Laboratorio: inspector, zoom y localStorage', async ({ page }) => {
  await enter(page, 'laboratorio');

  // 1 · La etiqueta está oculta en el DOM
  const label = page.locator('[data-contenido]');
  await expect(label).toBeHidden();
  await unlock(page, (await label.getAttribute('data-contenido'))!);

  // 2 · Con zoom del navegador el microscopio enfoca
  await expect(page.getByRole('heading', { name: 'El microscopio' })).toBeVisible();
  await expect(page.getByText('CÉLULA')).toHaveCount(0);
  await page.evaluate(() => {
    Object.defineProperty(window, 'devicePixelRatio', { value: devicePixelRatio * 2, configurable: true });
    dispatchEvent(new Event('resize'));
  });
  await expect(page.getByText('CÉLULA')).toBeVisible();
  await unlock(page, 'celula');

  // 3 · Subiendo el termostato en localStorage, el líquido hierve
  await expect(page.getByRole('status', { name: 'Temperatura' })).toHaveText('20 °C');
  await page.evaluate(() => localStorage.setItem('laboratorio:temperatura', '100'));
  await expect(page.getByText('EBULLICIÓN', { exact: true })).toBeVisible();
  await unlock(page, 'ebullición');
  await expect(page.getByRole('heading', { name: /Has escapado de/ })).toBeVisible();
});

test('El Archivo Perdido: URL, historial y dos pestañas', async ({ page, context }) => {
  await enter(page, 'archivo');

  // 1 · Cambiando el #hash se llega al estante de la ficha
  await expect(page).toHaveURL(/#s1-e1$/);
  await page.evaluate(() => (location.hash = '#s7-e3'));
  await expect(page.getByText('Estás en: Sección 7, Estante 3')).toBeVisible();
  await expect(page.locator('.book.found')).toHaveText('PERGAMINO');
  await unlock(page, 'pergamino');

  // 2 · Las letras aparecen al volver atrás con el navegador
  await expect(page.getByRole('heading', { name: 'Los pasillos' })).toBeVisible();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: /Seguir avanzando/ }).click();
  await expect(page.getByText(/El fondo del archivo/)).toBeVisible();
  const letters = page.getByRole('list', { name: 'Letras encontradas' });
  await expect(letters).not.toContainText('T');
  for (let i = 0; i < 4; i++) await page.goBack();
  await expect(page.getByText('Pasillo 2', { exact: true })).toBeVisible();
  await expect(letters).toHaveText(/T\s*O\s*M\s*O/);
  await unlock(page, 'tomo');

  // 3 · Con una segunda pestaña abierta se completa el mapa
  await expect(page.getByRole('heading', { name: 'El mapa partido' })).toBeVisible();
  await expect(page.getByText('Lectores en el archivo: 1')).toBeVisible();
  const second = await context.newPage();
  await second.goto('/sala/archivo');
  await expect(page.getByText('Lectores en el archivo: 2')).toBeVisible();
  await expect(page.locator('.map .word')).toHaveText(/L\s*A\s*B\s*E\s*R\s*I\s*N\s*T\s*O/);
  await second.close();
  await expect(page.getByText('Lectores en el archivo: 1')).toBeVisible();
  await unlock(page, 'laberinto');
  await expect(page.getByRole('heading', { name: /Has escapado de/ })).toBeVisible();
});

test('La Máquina: portapapeles, impresión y Ctrl + Escape', async ({ page, isMobile }) => {
  await enter(page, 'maquina');

  // 1 · Escribir lo que se ve no vale; lo copiado es otra cosa
  await page.locator('#lock-input').fill('Máquina');
  await page.getByRole('button', { name: 'Probar' }).click();
  await expect(page.getByText(/Eso es lo que ves/)).toBeVisible();
  const copied = await page.locator('.machine-name').evaluate((el) => {
    const dt = new DataTransfer();
    el.dispatchEvent(new ClipboardEvent('copy', { clipboardData: dt, bubbles: true, cancelable: true }));
    return dt.getData('text/plain');
  });
  expect(copied).toBe('ESPEJO');
  await expect(page.getByText(/trozo de mí/)).toBeVisible();
  await unlock(page, copied);

  // 2 · El plano solo existe en la vista de impresión
  await expect(page.getByRole('heading', { name: 'Solo en papel' })).toBeVisible();
  await expect(page.getByText('ENGRANAJE')).toBeHidden();
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByText('ENGRANAJE')).toBeVisible();
  await page.emulateMedia({ media: 'screen' });
  await unlock(page, 'engranaje');

  // 3 · La salida: Ctrl y luego Escape (teclado físico o el de la pantalla)
  await expect(page.getByRole('heading', { name: 'La salida' })).toBeVisible();
  if (isMobile) {
    await page.getByRole('button', { name: 'Esc', exact: true }).click();
    await expect(page.getByText(/Te falta control/)).toBeVisible();
    await page.getByRole('button', { name: 'Ctrl', exact: true }).click();
    await page.getByRole('button', { name: 'Esc', exact: true }).click();
  } else {
    await page.keyboard.press('q');
    await expect(page.getByText(/no es la salida/)).toBeVisible();
    await page.keyboard.press('Control');
    await page.keyboard.press('Escape');
  }
  await expect(page.getByText('Ctrl + Escape. Siempre estuvo en el nombre.')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Has escapado de/ })).toBeVisible();
  await expect(page.getByText(/Las seis salas, superadas/)).toBeVisible();
});
