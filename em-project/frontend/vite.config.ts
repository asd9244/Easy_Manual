import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

const DEFAULT_SPRING_ORIGIN = 'http://localhost:8080';
const DEFAULT_AI_ORIGIN = 'http://localhost:8000';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const springOrigin =
    (env.VITE_PROXY_SPRING_ORIGIN || '').trim() || DEFAULT_SPRING_ORIGIN;
  const aiOrigin = (env.VITE_PROXY_AI_ORIGIN || '').trim() || DEFAULT_AI_ORIGIN;

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        '/api': {
          target: springOrigin,
          changeOrigin: true,
          secure: false,
        },
        '/oauth2/authorization': {
          target: springOrigin,
          changeOrigin: true,
          secure: false,
        },
        '/login/oauth2': {
          target: springOrigin,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: springOrigin,
          changeOrigin: true,
          secure: false,
        },
        '/manual_images': {
          target: aiOrigin,
          changeOrigin: true,
          secure: false,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
