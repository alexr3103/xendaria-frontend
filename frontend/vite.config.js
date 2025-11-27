import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/favicon.ico',
        'icons/favicon-96x96.png'
      ],
      manifest: {
        name: 'Xendaria',
        short_name: 'Xendaria',
        theme_color: '#AA63E0',
        background_color: '#FDF6F0',
        description: "Explorá la ciudad y descubrí leyendas urbanas, puntos misteriosos e insignias ocultas.",
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/favicon-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/icons/xendaria-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/xendaria-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],

  server: {
    port: 5173,
    strictPort: true
  }
})
