import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // The Coco backend (backend/). middleware.js does the same on Vercel. COCO_BACKEND_URL has no
    // VITE_ prefix, so it stays out of the browser bundle.
    proxy: {
      '/api': {
        target: (loadEnv(mode, process.cwd(), '').COCO_BACKEND_URL || 'http://localhost:5001').trim().replace(/\/+$/, '').replace(/\/api$/, ''),
        changeOrigin: true,
      },
    },
  },
  build: {
    // Vite's default JS target (iOS 16.4) can leave a blank page on older iPhones.
    target: ['es2020', 'safari15', 'ios15'],
    // Kept at Vite's default so the generated CSS (and the design) stays exactly as it was.
    cssTarget: ['chrome111', 'edge111', 'firefox114', 'safari16.4', 'ios16.4'],
  },
}))
