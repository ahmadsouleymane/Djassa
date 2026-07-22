import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Découpe les grosses libs en chunks séparés : meilleur cache
        // (le vendor change rarement) et chargement en parallèle.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) return 'charts'
          if (id.includes('gsap')) return 'gsap'
          if (id.includes('@radix-ui')) return 'radix'
          if (id.includes('react-router') || id.includes('/remix-run/')) return 'router'
          if (id.includes('react-dom') || id.includes('/scheduler/')) return 'react-dom'
          return 'vendor'
        },
      },
    },
  },
})
