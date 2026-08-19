import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  /*
   * RELATIVE, and it is the single most important line in this file.
   *
   * A template repository is served from wherever the person who used it put it — most often
   * `user.github.io/their-repo/`, sometimes a custom domain at the root. The default `/`
   * would emit `/assets/…`, which 404s on every project page, so every fork would need
   * configuring before it worked at all. `./` resolves against the document and is correct
   * in all of those places with nothing to set.
   */
  base: './',
  build: {
    // The photographs are the payload; a source map would be the largest thing in the
    // artifact that nobody looks at.
    sourcemap: false,
  },
});
