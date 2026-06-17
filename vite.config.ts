import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // 局域网内可通过 http://<本机局域网IP>:5173 访问
    host: true,
    strictPort: false,
    open: false,
    // 关键：允许所有外部域名访问（解决 serveo 链接被拦截的问题）
    allowedHosts: true,
  },
  preview: {
    host: true,
  },
})