import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: {
    outDir: 'build',
    target: 'es2020',
    assetsInlineLimit: 0,
    sourcemap: true,
    manifest: true,
    rolldownOptions: {
      output: {
        entryFileNames: 'static/js/main.[hash].js',
        chunkFileNames: 'static/js/[name].[hash].js',
        assetFileNames: 'static/media/[name].[hash][extname]',
      },
    },
  },
});
