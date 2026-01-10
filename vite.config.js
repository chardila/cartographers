import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/cartographers/',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
  },
});
