import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    assetsInclude: ['**/*.splinecode'],
    define: {
      'import.meta.env.VITE_ADMIN_URL': JSON.stringify(env.ADMIN_URL),
      'import.meta.env.VITE_ADMIN_PASS': JSON.stringify(env.ADMIN_PASS)
    },
    server: {
      proxy: {
        '/sarvam-api': {
          target: 'https://api.sarvam.ai',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/sarvam-api/, ''),
        },
      },
    },
  }
})