import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (id.includes('lucide-react')) {
            return 'icons'
          }

          if (id.includes('recharts') || id.includes('/d3-')) {
            return 'charts'
          }

          if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/')) {
            return 'react'
          }

          if (id.includes('/axios/')) {
            return 'http'
          }

          return 'vendor'
        },
      },
    },
  },
})
