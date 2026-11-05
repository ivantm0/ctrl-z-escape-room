import { defineConfig, devices } from '@playwright/test';

// Se prueba el build de producción. Con BASE_URL se prueba una web ya desplegada:
// BASE_URL=https://ctrl-escape.netlify.app npm run test:e2e
const remote = process.env.BASE_URL;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: remote ?? 'http://localhost:5251', locale: 'es-ES' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: remote
    ? undefined
    : {
        command: 'npm run build && npx vite preview --port 5251 --strictPort',
        url: 'http://localhost:5251',
        reuseExistingServer: false,
        timeout: 180_000,
      },
});
