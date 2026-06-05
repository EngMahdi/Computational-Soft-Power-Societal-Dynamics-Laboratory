import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    headers: {
      // مطلوب لتحميل WASM في المتصفح
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  optimizeDeps: {
    exclude: ['pixi.js'],
  },
  define: {
    'process.env': {},
  },
  assetsInclude: ['**/*.wasm'],
});
