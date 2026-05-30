import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: 'demo',
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: '../demo-dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Full feature showcase — the dev harness exercising every API surface.
        main: resolve(__dirname, 'demo/index.html'),
        // Portfolio prototype — focused single-scroll page intended to be
        // ported into the Next.js portfolio at app/projects/playbook/.
        // See PortfolioPreparation.md.
        portfolio: resolve(__dirname, 'demo/portfolio/index.html'),
      },
    },
  },
});
