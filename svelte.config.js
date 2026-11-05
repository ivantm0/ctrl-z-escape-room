import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    // Web estática: todo el juego ocurre en el navegador
    adapter: adapter({ fallback: '404.html' }),
    prerender: { handleHttpError: 'fail' },
  },
};
