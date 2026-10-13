import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // The backend (backend/, port 5001). vercel.json does the same in production.
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
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
})
