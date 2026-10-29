import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Crucial for GitHub Pages to work on any repo subpath
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
