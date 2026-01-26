import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  },
  build: {
    minify: false,  // Désactiver la minification pour debug
    sourcemap: true  // Activer les sourcemaps
  }
})
