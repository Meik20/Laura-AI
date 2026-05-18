import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['icon.png', 'logo.png'],
      manifest: {
        name: 'LAURA - Learning AI & Unified Resource Assistant',
        short_name: 'LAURA',
        description: "Plateforme d'apprentissage intelligente avec assistant IA",
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#1f73e8',
        background_color: '#ffffff',
        categories: ['education', 'productivity'],
        icons: [
          {
            src: 'icon.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: 'icon.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: 'icon.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: 'icon.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: 'icon.png',
            sizes: '152x152',
            type: 'image/png'
          },
          {
            src: 'icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: 'icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Chat LAURA',
            short_name: 'Chat',
            description: "Discuter avec l'assistant IA",
            url: '/learn/chat',
            icons: [
              {
                src: 'icon.png',
                sizes: '192x192'
              }
            ]
          },
          {
            name: 'Mes Révisions',
            short_name: 'Révision',
            description: 'Accéder à mes sessions de révision',
            url: '/learn/revision',
            icons: [
              {
                src: 'icon.png',
                sizes: '192x192'
              }
            ]
          }
        ]
      }
    })
  ]
})
