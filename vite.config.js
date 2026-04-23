
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { handleProxy } = require('./proxy-handler.cjs')

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'zixtv-proxy-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const pathname = new URL(req.url || '/', 'http://localhost').pathname

          if (pathname !== '/api/proxy') {
            next()
            return
          }

          handleProxy(req, res).catch(next)
        })
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          const pathname = new URL(req.url || '/', 'http://localhost').pathname

          if (pathname !== '/api/proxy') {
            next()
            return
          }

          handleProxy(req, res).catch(next)
        })
      }
    }
  ],
  envPrefix: ['VITE_', 'TMDB_'],
  
  root: path.resolve(__dirname, '.'), 
  publicDir: path.resolve(__dirname, 'public'), 
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@app': path.resolve(__dirname, './src/app'),
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', '@headlessui/react', 'lucide-react'],
          player: ['hls.js'], 
          utils: ['date-fns', 'lodash', 'zustand']
        }
      }
    }
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
  }
})