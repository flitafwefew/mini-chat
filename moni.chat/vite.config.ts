import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools({
      componentInspector: true,
      launchEditor: 'code'
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server:{
    host: '0.0.0.0', // 允许外部访问
    port: 5175,
    proxy:{
      '/api': {
        target: 'http://10.33.123.133:3002',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://10.33.123.133:3002',
        ws: true,
        changeOrigin: true,
      },
      '/avatars': {
        target: 'http://10.33.123.133:3002',
        changeOrigin: true,
      },
    }
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    }
  }
})
