import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
  host: "192.168.29.90", // PC-A WiFi IP
  port: 5173
}

})
  