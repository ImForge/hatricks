import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      'all',
      '1605-2405-201-303b-8025-451-126-ba14-112d.ngrok-free.app',
    ],
  }
})