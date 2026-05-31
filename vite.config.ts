import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: 'demo/portfolio',
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: '../demo-dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Portfolio demo — primary entry, served at /.
        main: resolve(__dirname, 'demo/portfolio/index.html'),
        // Legacy showcase — kept for reference, accessible at /legacy/.
        legacy: resolve(__dirname, 'demo/index.html'),
      },
    },
  },
});
