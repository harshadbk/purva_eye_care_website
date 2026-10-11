import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // During development, API calls go to the backend (cd ../backend && npm run dev).
  server: {
    proxy: { '/api': 'http://localhost:5000' },
  },
})
