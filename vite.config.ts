import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? '/koala-khaos/' : './',
  build: { sourcemap: false },
  server: { host: '127.0.0.1', port: 47361, strictPort: true },
}));


