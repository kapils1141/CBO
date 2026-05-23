import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
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
      hmr: process.env.DISABLE_HMR !== 'true',
      host: true,
      port: 3000,
      https: {
        key: fs.readFileSync('C:/Apps/certs/lloyds.key'),
        cert: fs.readFileSync('C:/Apps/certs/lloyds.crt'),
      },
      allowedHosts: [
        'cbonline.lloyds.com',
        'cbsecure.lloyds.com',
        'localhost'
      ],
      // Add the proxy rules here
      proxy: {
        '/openam': {
          target: 'http://openam.lloyds.com:8080', // Change 8080 to your actual OpenAM HTTP port if different
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        },
        '/api': {
          target: 'http://cbonline.lloyds.com:8081',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        }
      }
    },
  };
});
