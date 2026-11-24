import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on 0.0.0.0, 127.0.0.1, and localhost
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://127.0.0.1:4000',
        ws: true
      }
    }
  }
});
