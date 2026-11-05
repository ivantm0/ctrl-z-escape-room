import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Empieza ya dentro del mercado (intro vista) */
const skipIntro = (page: Page) =>
  page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('ctrl-escape:faraon:v1', JSON.stringify({ intro: true, start: Date.now() }));
  });

const open = async (page: Page, name: string) => {
  await page.getByRole('button', { name, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return dialog;
};

test.describe('portada', () => {
  test('ofrece los dos escape rooms', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Ctrl \+ Escape: El Origen/ })).toHaveAttribute('href', '/origen');
    await expect(page.getByRole('link', { name: /El Mapa del Faraón/ })).toHaveAttribute('href', '/faraon');
    await page.getByRole('link', { name: /El Origen/ }).click();
    await expect(page.locator('.corridor li')).toHaveCount(6);
    await page.getByRole('link', { name: /Todos los escape rooms/ }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('sin errores de accesibilidad', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});

test.describe('intro', () => {
  test('cuenta la historia en 5 escenas y lleva al mercado', async ({ page }) => {
    await page.goto('/faraon');
    await expect(page.getByText('Tebas · 1250 a. C.')).toBeVisible();
    for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByText(/empieza donde empiezan todos los rumores/)).toBeVisible();
    await page.getByRole('button', { name: /Entrar al mercado/ }).click();
    await expect(page.getByRole('button', { name: 'Puesto de especias', exact: true })).toBeVisible();
    // Ya vista: al volver no se repite
    await page.reload();
    await expect(page.getByRole('button', { name: 'Puesto de especias', exact: true })).toBeVisible();
  });

  test('se puede saltar', async ({ page }) => {
    await page.goto('/faraon');
    await page.getByRole('button', { name: 'Saltar intro' }).click();
    await expect(page.getByRole('button', { name: 'Estela de piedra', exact: true })).toBeVisible();
  });
});

test('el mercado completo: balanza, vasijas, cofre y guardia', async ({ page }) => {
  await skipIntro(page);
  await page.goto('/faraon');

  // Sin sello, el guardia no deja pasar
  let dialog = await open(page, 'Guardia de la necrópolis');
  await expect(dialog).toContainText('sello de Anubis');
  await expect(dialog).toContainText('No llevas nada');
  await dialog.getByRole('button', { name: 'Cerrar' }).click();

  // La estela enseña los números
  dialog = await open(page, 'Estela de piedra');
  await expect(dialog).toContainText('Enseñanzas del escriba');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  // 1 · Balanza: 16 + 4 + 2 + 1 = 23 deben
  dialog = await open(page, 'Puesto de especias');
  await dialog.getByRole('button', { name: '8 deben' }).click();
  await expect(dialog).toContainText('Pesas en el plato: 8 deben');
  await dialog.getByRole('button', { name: '8 deben' }).click();
  for (const w of [16, 4, 2, 1]) await dialog.getByRole('button', { name: `${w} deben`, exact: true }).click();
  await expect(dialog).toContainText('ostracón viejo es tuyo');
  await dialog.getByRole('button', { name: 'Cerrar' }).click();
  await expect(page.getByRole('button', { name: 'Ostracón pintado' })).toBeVisible();

  // El ostracón se ve desde el inventario
  await page.getByRole('button', { name: 'Ostracón pintado' }).click();
  await expect(page.getByLabel(/Dibujo del ostracón/)).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar objeto' }).click();

  // 2 · Vasijas: la del ojo falla, la del loto tiene la llave
  dialog = await open(page, 'Puesto del alfarero');
  await dialog.getByRole('button', { name: /vasija del ojo/ }).click();
  await expect(dialog).toContainText('solo hay arena');
  await dialog.getByRole('button', { name: /vasija del loto/ }).click();
  await expect(dialog).toContainText('una llave de bronce');
  await dialog.getByRole('button', { name: 'Cerrar' }).click();

  // 3 · Cofre: llave + halcón, escarabajo, gato
  dialog = await open(page, 'Escriba real');
  await expect(dialog.getByRole('button', { name: 'Rueda 1: siguiente' })).toBeDisabled();
  await dialog.getByRole('button', { name: /Ostracón pintado/ }).click();
  await expect(dialog).toContainText('no entra en la cerradura');
  await dialog.getByRole('button', { name: /Llave de bronce/ }).click();
  await expect(dialog).toContainText('La llave gira');
  // Orden equivocado (como se ve en el ostracón, sin girar el sentido)
  const setDial = async (k: number, name: string) => {
    for (let n = 0; n < 6; n++) {
      if ((await dialog.getByRole('img', { name: `Rueda ${k}: ${name}` }).count()) > 0) return;
      await dialog.getByRole('button', { name: `Rueda ${k}: siguiente` }).click();
    }
  };
  await setDial(1, 'gato');
  await setDial(2, 'escarabajo');
  await setDial(3, 'halcón');
  await dialog.getByRole('button', { name: 'Levantar la tapa' }).click();
  await expect(dialog).toContainText('hacia donde miran');
  await setDial(1, 'halcón');
  await setDial(3, 'gato');
  await dialog.getByRole('button', { name: 'Levantar la tapa' }).click();
  await expect(dialog).toContainText('Sello de Anubis');
  await dialog.getByRole('button', { name: 'Cerrar' }).click();
  await expect(page.getByRole('button', { name: 'Sello de Anubis' })).toBeVisible();

  // 4 · El guardia acepta el sello y termina el capítulo
  dialog = await open(page, 'Guardia de la necrópolis');
  await dialog.getByRole('button', { name: /Sello de Anubis/ }).click();
  await expect(page.getByRole('heading', { name: 'La puerta de la necrópolis se abre' })).toBeVisible();
  await expect(page.getByLabel('3 de 3 estrellas')).toBeVisible();
});

test('las pistas siguen el progreso y la última es la solución', async ({ page }) => {
  await skipIntro(page);
  await page.goto('/faraon');
  await page.getByRole('button', { name: 'Pistas' }).click();
  const hints = page.getByRole('complementary', { name: 'Pistas' });
  await hints.getByRole('button', { name: 'Ver pista' }).click();
  await hints.getByRole('button', { name: 'Ver pista clara' }).click();
  await hints.getByRole('button', { name: 'Ver solución' }).click();
  await expect(hints).toContainText('16, 4, 2 y 1');
});

test('el progreso del mercado se guarda', async ({ page }) => {
  await skipIntro(page);
  await page.goto('/faraon');
  const dialog = await open(page, 'Puesto del alfarero');
  await dialog.getByRole('button', { name: /vasija del loto/ }).click();
  await dialog.getByRole('button', { name: 'Cerrar' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Llave de bronce' })).toBeVisible();
});

test('el mercado no desborda la página', async ({ page }) => {
  await skipIntro(page);
  await page.goto('/faraon');
  await expect(page.getByRole('button', { name: 'Escriba real', exact: true })).toBeAttached();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

/** Empieza en la pirámide, con el mercado superado y su intro vista */
const atPyramid = (page: Page, seen = true) =>
  page.addInitScript((seen) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem(
      'ctrl-escape:faraon:v1',
      JSON.stringify({
        intro: true,
        chapter: 'piramide',
        seen: seen ? ['mercado', 'piramide'] : ['mercado'],
        start: Date.now() - 600_000,
        ends: { mercado: Date.now() - 60_000 },
        done: ['balanza', 'vasijas', 'cofre', 'puerta'],
        items: ['ostracon', 'llave', 'sello'],
        used: ['llave', 'sello'],
      })
    );
  }, seen);

test('del mercado se pasa a la pirámide con su propia intro', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem(
      'ctrl-escape:faraon:v1',
      JSON.stringify({ intro: true, start: Date.now() - 60_000, end: Date.now(), done: ['balanza', 'vasijas', 'cofre', 'puerta'], items: ['ostracon', 'llave', 'sello'], used: ['llave', 'sello'] })
    );
  });
  await page.goto('/faraon');
  // Partida antigua (con «end»): el mercado sigue contando como superado
  await expect(page.getByRole('heading', { name: 'La puerta de la necrópolis se abre' })).toBeVisible();
  await page.getByRole('button', { name: /Continuar: la pirámide/ }).click();
  await expect(page.getByText('Capítulo II · La necrópolis')).toBeVisible();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: /Acercarse a la pirámide/ }).click();
  await expect(page.getByRole('button', { name: 'Cara de la pirámide', exact: true })).toBeVisible();
  await expect(page.getByRole('banner')).toContainText('II · La pirámide');
});

test('la pirámide completa: campamento, losa, ofrendas, espejo y entrada', async ({ page }) => {
  await atPyramid(page);
  await page.goto('/faraon');

  // La pared no se abre a empujones
  let dialog = await open(page, 'Cara de la pirámide');
  await dialog.getByRole('button', { name: 'Empujar la pared' }).click();
  await expect(dialog).toContainText('no se mueve');
  await dialog.getByRole('button', { name: 'Cerrar' }).click();

  // 1 · Campamento: cepillo y papiro
  dialog = await open(page, 'Tienda de los obreros');
  await dialog.getByRole('button', { name: /cepillo de palma/ }).click();
  await dialog.getByRole('button', { name: /papiro roto/ }).click();
  await expect(dialog.getByRole('region', { name: 'Papiro roto' })).toContainText('lo que brilla como él');
  await dialog.getByRole('button', { name: 'Cerrar' }).click();

  // 2 · Losa: usar el cepillo y barrer
  dialog = await open(page, 'Arena removida');
  await dialog.getByRole('button', { name: /Cepillo de palma/ }).click();
  for (let i = 0; i < 6 && (await dialog.getByRole('button', { name: 'Barrer' }).count()); i++) {
    await dialog.getByRole('button', { name: 'Barrer' }).click();
  }
  await expect(dialog).toContainText('La losa queda limpia');
  await expect(dialog).toContainText('escarabajo');
  await dialog.getByRole('button', { name: 'Cerrar' }).click();

  // 3 · Altar: Ra → disco de oro, Thot → cálamo, Anubis → natrón
  dialog = await open(page, 'Altar de los dioses');
  await dialog.getByRole('button', { name: 'Presentar las ofrendas' }).click();
  await expect(dialog).toContainText('Ninguna estatua reacciona');
  const offer = async (god: string, item: string) => {
    for (let n = 0; n < 6; n++) {
      if ((await dialog.getByRole('status', { name: `Ofrenda para ${god}: ${item}` }).count()) > 0) return;
      await dialog.getByRole('button', { name: `${god}: ofrenda siguiente` }).click();
    }
  };
  await offer('Ra', 'Disco de oro');
  await dialog.getByRole('button', { name: 'Presentar las ofrendas' }).click();
  await expect(dialog).toContainText('Solo un dios parece satisfecho');
  await offer('Thot', 'Cálamo');
  await offer('Anubis', 'Natrón');
  await dialog.getByRole('button', { name: 'Presentar las ofrendas' }).click();
  await expect(dialog).toContainText('espejo de bronce');
  await dialog.getByRole('button', { name: 'Cerrar' }).click();

  // 4 · Espejo: montarlo e inclinarlo hacia el escarabajo (no el ojo)
  dialog = await open(page, 'Poste de bronce');
  await dialog.getByRole('button', { name: /Espejo de bronce/ }).click();
  const tilt = dialog.getByRole('slider');
  await tilt.fill('73.5');
  await expect(dialog).toContainText('La luz ilumina el ojo');
  await tilt.fill('63');
  await expect(dialog).toContainText('La luz se posa sobre el escarabajo');
  await expect(dialog).toContainText('contorno de una piedra');
  await dialog.getByRole('button', { name: 'Cerrar' }).click();

  // 5 · Entrada
  dialog = await open(page, 'Cara de la pirámide');
  await dialog.getByRole('button', { name: 'Empujar la piedra del escarabajo' }).click();
  await expect(page.getByRole('heading', { name: 'La pirámide se abre' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Continuar: la tumba/ })).toBeVisible();
});

test('la losa también se barre arrastrando', async ({ page, isMobile }) => {
  test.skip(isMobile, 'El arrastre se prueba con ratón');
  // Sin la animación de zoom, para medir la arena en su sitio definitivo
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await atPyramid(page);
  await page.goto('/faraon');
  const dialog = await open(page, 'Tienda de los obreros');
  await dialog.getByRole('button', { name: /cepillo de palma/ }).click();
  await dialog.getByRole('button', { name: 'Cerrar' }).click();
  const losa = await open(page, 'Arena removida');
  await losa.getByRole('button', { name: /Cepillo de palma/ }).click();
  const box = (await losa.getByLabel('Arena sobre la losa').boundingBox())!;
  for (let row = 0; row < 7; row++) {
    const y = box.y + ((row + 0.5) / 7) * box.height;
    await page.mouse.move(box.x + 2, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 2, y, { steps: 14 });
    await page.mouse.up();
  }
  await expect(losa).toContainText('La losa queda limpia');
});

test('las pistas de la pirámide siguen su capítulo', async ({ page }) => {
  await atPyramid(page);
  await page.goto('/faraon');
  await page.getByRole('button', { name: 'Pistas' }).click();
  const hints = page.getByRole('complementary', { name: 'Pistas' });
  await hints.getByRole('button', { name: 'Ver pista' }).click();
  await expect(hints).toContainText('campamento');
});
