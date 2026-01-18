import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dashboard API URL - Set your backend URL here
const DASHBOARDAPI = process.env.DASHBOARDAPI || 'http://localhost:8001'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/dashboard': {
        target: DASHBOARDAPI,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dashboard/, '/api')
      }
    }
  }
})
