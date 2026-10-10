import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    target: 'es2020',
    sourcemap: false,
    cssCodeSplit: true,
  },
});
