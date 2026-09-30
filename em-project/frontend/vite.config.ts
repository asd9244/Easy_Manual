import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { ProxyOptions } from 'vite';
import { defineConfig, loadEnv } from 'vite';

const DEFAULT_SPRING_ORIGIN = 'http://localhost:8080';
const DEFAULT_AI_ORIGIN = 'http://localhost:8000';

/** 브라우저 Host(localhost:3000)를 Spring에 전달해 OAuth redirect_uri가 공인 URL과 맞게 잡히게 함 */
function springProxyWithForwardedHost(target: string): ProxyOptions {
  return {
    target,
    changeOrigin: true,
    secure: false,
    configure(proxy) {
      proxy.on('proxyReq', (proxyReq, req) => {
        const host = req.headers.host;
        if (host) {
          proxyReq.setHeader('X-Forwarded-Host', host);
          proxyReq.setHeader('X-Forwarded-Proto', 'http');
          const portPart = host.includes(':') ? host.split(':').pop() : '';
          proxyReq.setHeader(
            'X-Forwarded-Port',
            portPart && /^\d+$/.test(portPart) ? portPart : '80',
          );
        }
      });
    },
  };
}

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
        '/api': springProxyWithForwardedHost(springOrigin),
        '/oauth2/authorization': springProxyWithForwardedHost(springOrigin),
        '/login/oauth2': springProxyWithForwardedHost(springOrigin),
        '/uploads': springProxyWithForwardedHost(springOrigin),
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
