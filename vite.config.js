import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/songsterr': {
        target: 'https://www.songsterr.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/songsterr/, '/api'),
      },
    },
  },
})
