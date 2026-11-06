import { expect, test, type Page } from '@playwright/test';

const KEY = 'ctrl-escape:bastidores:v1';

/** Partida empezada (intro vista) en la pantalla 1 */
const started = (page: Page, extra: Record<string, unknown> = {}) =>
  page.addInitScript(
    ([key, extra]) => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      // La parte 2 solo se abre con la parte 1 terminada
      localStorage.setItem('ctrl-escape:pixel:v1', JSON.stringify({ intro: true, world: 4, start: 1, end: 2, end2: 3, end3: 4, end4: 5, muted: true }));
      localStorage.setItem(key, JSON.stringify({ intro: true, level: 1, start: Date.now() - 60_000, muted: true, ...extra }));
    },
    [KEY, extra] as const
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

test('la portada enlaza la parte 2 y la intro lleva a la pantalla de carga', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('ctrl-escape:pixel:v1', JSON.stringify({ intro: true, world: 4, start: 1, end: 2, end2: 3, end3: 4, end4: 5, muted: true }))
  );
  await page.goto('/');
  await page.getByRole('link', { name: /Entre Bastidores/ }).click();
  await expect(page.getByText(/Leo ha vuelto a casa/)).toBeVisible();
  await page.getByRole('button', { name: 'SALTAR' }).click();
  await expect(game(page)).toHaveAttribute('data-screen', 'carga');
  await expect(page.getByRole('banner')).toContainText('CARGA INFINITA');
});

test.describe('pantalla 1 · carga infinita', () => {
  test.skip(({ isMobile }) => isMobile, 'Se juega con teclado; la cruceta se prueba en Fuera de Juego');

  test('la Ruedecita explica qué falta', async ({ page }) => {
    await started(page);
    await page.goto('/entre-bastidores');
    await play(page, 'R D A');
    await expect(dialog(page)).toContainText('Ruedecita');
  });

  test('R recoloca los archivos', async ({ page }) => {
    await started(page);
    await page.goto('/entre-bastidores');
    await play(page, 'UULLLLLDRR');
    await expect(game(page)).not.toHaveAttribute('data-files', '6,9 8,9 6,13');
    await page.keyboard.press('r');
    await expect(dialog(page)).toContainText('vuelven a su sitio');
    await expect(game(page)).toHaveAttribute('data-files', '6,9 8,9 6,13');
  });

  test('tres archivos en sus huecos, la barra al 100 % y la salida', async ({ page }) => {
    await started(page);
    await page.goto('/entre-bastidores');
    // La compuerta y la salida están cerradas al principio
    await expect(game(page)).toHaveAttribute('data-loaded', 'no');
    await play(page, 'UULLLLLDRRDRULURRDRUUUUULLLDDRULURLLLDRRDRUURURRRR');
    await expect(dialog(page)).toContainText('Texturas… OK');
    await play(page, 'AA');
    await expect(game(page)).toHaveAttribute('data-loaded', 'si');
    await play(page, 'L UUUU RRRR U');
    await expect(page.getByRole('heading', { name: '¡CARGA COMPLETA!' })).toBeVisible();
    await page.getByRole('button', { name: 'REPETIR LA PANTALLA 1' }).click();
    await expect(game(page)).toHaveAttribute('data-loaded', 'no');
  });

  test('un archivo arrinconado avisa de que R reinicia', async ({ page }) => {
    await started(page);
    await page.goto('/entre-bastidores');
    // Empuja el archivo de texturas contra la esquina de la izquierda
    await play(page, 'UUUUUULLLD L');
    await expect(dialog(page)).toContainText('atascado');
    await play(page, 'A');
    await expect(dialog(page)).toContainText('Pulsa R');
  });
});

test.describe('pantalla 2 · menú principal roto', () => {
  test.skip(({ isMobile }) => isMobile, 'Se juega con teclado; la cruceta se prueba en Fuera de Juego');

  const onLevel2 = (page: Page) => started(page, { level: 2, ends: [null, Date.now() - 1000], done: ['archivos', 'carga'] });

  test('de la pantalla 1 se continúa a la 2', async ({ page }) => {
    await started(page, { ends: [null, Date.now()], done: ['archivos', 'carga'] });
    await page.goto('/entre-bastidores');
    await page.getByRole('button', { name: /CONTINUAR: PANTALLA 2/ }).click();
    await expect(game(page)).toHaveAttribute('data-screen', 'menu');
    await expect(page.getByRole('banner')).toContainText('MENÚ PRINCIPAL');
  });

  test('el cursor persigue y, si te atrapa, vuelves al principio', async ({ page }) => {
    await onLevel2(page);
    await page.goto('/entre-bastidores');
    await play(page, 'RRRRRRRUUUU');
    await expect(dialog(page)).toContainText('CLIC');
    await expect(game(page)).toHaveAttribute('data-x', '10');
    await expect(game(page)).toHaveAttribute('data-cursor', '18,4');
  });

  test('SALIR no deja salir', async ({ page }) => {
    await onLevel2(page);
    await page.goto('/entre-bastidores');
    await play(page, 'U A');
    await expect(dialog(page)).toContainText('¿SALIR?');
  });

  test('tres letras al logo y el botón OPCIONES', async ({ page }) => {
    await onLevel2(page);
    await page.goto('/entre-bastidores');
    await play(page, 'RRRRURUUUULLULLLLLDLURRRDRRRRDDRDDDRRLLLLLLLLLLLLUULUUUDLLUUDDRDDDDRRRRRRRRRRRURUUURRUUULUULLLLLRRRUUU');
    await expect(dialog(page)).toContainText('FUERA DE JUEGO');
    await expect(game(page)).toHaveAttribute('data-fixed', 'si');
    await play(page, 'AAA DDDD L D A');
    await expect(page.getByRole('heading', { name: '¡MENÚ REPARADO!' })).toBeVisible();
    await page.getByRole('button', { name: /CONTINUAR: PANTALLA 3/ }).click();
    await expect(game(page)).toHaveAttribute('data-screen', 'opciones');
  });
});

test.describe('pantalla 3 · opciones', () => {
  test.skip(({ isMobile }) => isMobile, 'Se juega con teclado; la cruceta se prueba en Fuera de Juego');

  const onLevel3 = (page: Page) =>
    started(page, { level: 3, ends: [null, Date.now() - 2000, Date.now() - 1000], done: ['archivos', 'carga', 'letras', 'opciones'] });

  test('el altavoz a tope solo suena a distorsión', async ({ page }) => {
    await onLevel3(page);
    await page.goto('/entre-bastidores');
    await play(page, 'UUUUUUUUUUUUU RRR R A');
    await expect(dialog(page)).toContainText('KRRRR');
  });

  test('APLICAR rechaza los ajustes de fábrica', async ({ page }) => {
    await onLevel3(page);
    await page.goto('/entre-bastidores');
    await play(page, 'LLLLLL D A');
    await expect(dialog(page)).toContainText('rechazados');
  });

  test('brillo, volumen, idioma y subtítulos correctos abren la puerta', async ({ page }) => {
    await onLevel3(page);
    await page.goto('/entre-bastidores');
    await expect(game(page)).toHaveAttribute('data-vals', '1400');
    // Brillo al máximo para leer el suelo, y luego de vuelta a 1
    await play(page, 'UUUUUUUUUU LLLLLL U RRR');
    await expect(game(page)).toHaveAttribute('data-vals', '4400');
    await play(page, 'D RR U LLL');
    await expect(game(page)).toHaveAttribute('data-vals', '1400');
    // Volumen 3, idioma ??? y subtítulos
    await play(page, 'D RRR D D L');
    await play(page, 'D LLLLL D D R');
    await expect(game(page)).toHaveAttribute('data-vals', '1310');
    await play(page, 'L D D D R');
    await expect(game(page)).toHaveAttribute('data-vals', '1311');
    await play(page, 'D D D A');
    await expect(dialog(page)).toContainText('AJUSTES GUARDADOS');
    await play(page, 'AA');
    await expect(game(page)).toHaveAttribute('data-applied', 'si');
    await play(page, 'U RRRRRRRRRR UUUUU R');
    await expect(page.getByRole('heading', { name: '¡AJUSTES GUARDADOS!' })).toBeVisible();
    await page.getByRole('button', { name: /CONTINUAR: PANTALLA 4/ }).click();
    await expect(game(page)).toHaveAttribute('data-screen', 'depuracion');
  });

  test('en idioma ??? el cartel se puede leer', async ({ page }) => {
    await onLevel3(page);
    await page.goto('/entre-bastidores');
    await play(page, 'LLLLLLL UUUUU R');
    await expect(game(page)).toHaveAttribute('data-vals', '1410');
    await play(page, 'L UU RRRRRRRRRRR U');
    await expect(game(page)).toHaveAttribute('data-facing', 'Z');
    await play(page, 'A');
    await expect(dialog(page)).toContainText('BRILLO DE LA PARTIDA: 1');
  });
});

test.describe('pantalla 4 · consola de depuración', () => {
  test.skip(({ isMobile }) => isMobile, 'Se juega con teclado; la cruceta se prueba en Fuera de Juego');

  const DONE = ['archivos', 'carga', 'letras', 'opciones', 'ajustes', 'consola'];
  const onLevel4 = (page: Page, extra: Record<string, unknown> = {}) =>
    started(page, { level: 4, ends: [null, Date.now() - 3000, Date.now() - 2000, Date.now() - 1000], done: DONE, ...extra });

  test('las plataformas no funcionan sin iniciar sesión, y una contraseña mala se borra', async ({ page }) => {
    await onLevel4(page);
    await page.goto('/entre-bastidores');
    await play(page, 'UUUUUUU A');
    await expect(dialog(page)).toContainText('ACCESO DENEGADO');
    await play(page, 'A DDDD A DD R A');
    await expect(dialog(page)).toContainText('INCORRECTA');
  });

  test('saltar dentro de un muro cuelga el juego', async ({ page }) => {
    await onLevel4(page, { done: [...DONE, 'login'], l4: { x: 10, y: 16, dir: 'up', buffer: '', tp: [15, 3] } });
    await page.goto('/entre-bastidores');
    await play(page, 'UUUUUUU RRR A');
    await expect(dialog(page)).toContainText('TELETRANSPORTE A (15, 3)');
    await play(page, 'A');
    await expect(dialog(page)).toContainText('SEGMENTATION FAULT');
    await play(page, 'AA');
    await expect(game(page)).toHaveAttribute('data-y', '16');
  });

  test('contraseña, teletransporte al cofre y salida', async ({ page }) => {
    await onLevel4(page);
    await page.goto('/entre-bastidores');
    await play(page, 'LLLLLLL U A');
    await expect(dialog(page)).toContainText('primera letra de cada comentario');
    await play(page, 'AA UU RRRRR A RR A RR A');
    await expect(game(page)).toHaveAttribute('data-buffer', 'BUG');
    await play(page, 'DD L A');
    await expect(dialog(page)).toContainText('CONTRASEÑA CORRECTA');
    await play(page, 'AA UUUUU LLL U AAAAAA RR AAAAAAA');
    await expect(game(page)).toHaveAttribute('data-tp', '16,3');
    await play(page, 'RRR A');
    await expect(dialog(page)).toContainText('DEBUG_KEY');
    await play(page, 'AA D RR R');
    await expect(page.getByRole('heading', { name: '¡DEPURACIÓN SUPERADA!' })).toBeVisible();
    await page.getByRole('button', { name: /CONTINUAR: PANTALLA 5/ }).click();
    await expect(game(page)).toHaveAttribute('data-screen', 'creditos');
  });
});

test.describe('pantalla 5 · créditos', () => {
  test.skip(({ isMobile }) => isMobile, 'Se juega con teclado; la cruceta se prueba en Fuera de Juego');

  const DONE = ['archivos', 'carga', 'letras', 'opciones', 'ajustes', 'consola', 'login', 'llave', 'depurar'];
  const onLevel5 = (page: Page) =>
    started(page, { level: 5, ends: [null, 1, 2, 3, Date.now() - 1000], done: DONE });

  test('pisar el hueco entre nombres te hace caer', async ({ page }) => {
    await onLevel5(page);
    await page.goto('/entre-bastidores');
    await play(page, 'DDDD');
    await expect(dialog(page)).toContainText('caes fuera');
  });

  test('quedarse arriba hace que el scroll te saque', async ({ page }) => {
    await onLevel5(page);
    await page.goto('/entre-bastidores');
    await play(page, 'UU');
    await expect(dialog(page)).toContainText('por arriba');
    await play(page, 'AA');
    await expect(game(page)).toHaveAttribute('data-turns', '0');
  });

  test('bajar por los créditos, encontrar «TU» y llegar al final', async ({ page }) => {
    test.setTimeout(90_000);
    await onLevel5(page);
    await page.goto('/entre-bastidores');
    await play(page, 'DDLLDDRDDDDRRRRRDDLLLLLLDDRDDLDDDRRDRRDDDDLLDDDDDLLDDDLLLD');
    await expect(dialog(page)).toContainText('«TU»');
    await expect(game(page)).toHaveAttribute('data-found', 'si');
    await play(page, 'AA');
    await play(page, 'DDDDRDDRRDDDRRRRRRDRRDDLLDDLLLLLDDLDDLLLDDRRRRRRRRDRRRDDLDDD');
    await expect(page.getByRole('heading', { name: '¡FIN… O NO!' })).toBeVisible();
    await page.getByRole('button', { name: /CONTINUAR: PANTALLA 6/ }).click();
    await expect(game(page)).toHaveAttribute('data-screen', 'memoria');
  });
});

test.describe('pantalla 6 · memoria de guardado', () => {
  test.skip(({ isMobile }) => isMobile, 'Se juega con teclado; la cruceta se prueba en Fuera de Juego');

  const DONE = ['archivos', 'carga', 'letras', 'opciones', 'ajustes', 'consola', 'login', 'llave', 'depurar', 'nombre', 'fin'];
  const onLevel6 = (page: Page) => started(page, { level: 6, ends: [null, 1, 2, 3, 4, Date.now() - 1000], done: DONE });

  test('los bytes sueltos dan las pistas y GUARDAR rechaza datos incompletos', async ({ page }) => {
    await onLevel6(page);
    await page.goto('/entre-bastidores');
    await play(page, 'U R U A');
    await expect(dialog(page)).toContainText('BYTE 0x03');
    await play(page, 'AA RRR U');
    await expect(dialog(page)).toContainText('datos vacíos o incorrectos');
  });

  test('al reiniciar se borran los datos y las pistas vuelven a ser las de los datos', async ({ page }) => {
    await started(page, {
      level: 6,
      ends: [null, 1, 2, 3, 4, Date.now() - 1000],
      done: [...DONE, 'datos'],
      l6: { x: 10, y: 16, dir: 'up', turns: 0, sel: { jugador: 'TU', mundo: '4', hora: '3:08' } },
    });
    await page.goto('/entre-bastidores');
    const hints = page.getByRole('complementary', { name: 'Pistas' });
    await page.getByRole('button', { name: 'Pistas' }).click();
    await page.getByRole('button', { name: 'VER PISTA' }).click();
    await expect(hints).toContainText('solo falta guardar');
    await page.keyboard.press('r');
    await expect(game(page)).toHaveAttribute('data-sel', '||');
    await expect(hints).not.toContainText('solo falta guardar');
    await page.getByRole('button', { name: 'VER PISTA' }).click();
    await expect(hints).toContainText('ranura 3');
  });

  test('la corrupción alcanza a Leo si se entretiene', async ({ page }) => {
    await onLevel6(page);
    await page.goto('/entre-bastidores');
    await play(page, 'UUULLLLLLLL');
    await expect(dialog(page)).toContainText('La corrupción te alcanza');
    await play(page, 'AA');
    await expect(game(page)).toHaveAttribute('data-turns', '0');
  });

  test('TU, mundo 4 y las 3:08: partida guardada y fin del juego', async ({ page }) => {
    await onLevel6(page);
    await page.goto('/entre-bastidores');
    await play(page, 'UUULLLLLUURUUUULURRRDRRRRRRRRRRDDDDDDLLLL');
    await expect(game(page)).toHaveAttribute('data-sel', 'TU|4|3:08');
    await expect(dialog(page)).toContainText('NO APAGUES LA CONSOLA');
    await play(page, 'AAA');
    await expect(page.getByRole('heading', { name: '¡PARTIDA GUARDADA!' })).toBeVisible();
    await expect(page.getByText('JUEGO COMPLETADO')).toBeVisible();
    await page.getByRole('button', { name: 'REPETIR LA PANTALLA 6' }).click();
    await expect(game(page)).toHaveAttribute('data-sel', '||');
  });
});
