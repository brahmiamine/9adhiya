import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/app-icon.svg',
        'icons/apple-touch-icon.png',
        'icons/favicon-32.png',
      ],
      manifest: {
        id: '/9adhiya/',
        name: 'قفتي للتسوق — قائمة الشراء',
        short_name: 'قفتي',
        description: 'قائمة شراء تونسية تحفظ قفتك على هاتفك وتخليك تشاركها بسهولة.',
        start_url: '/9adhiya/',
        scope: '/9adhiya/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#0b3634',
        theme_color: '#0b3634',
        lang: 'ar-TN',
        dir: 'rtl',
        categories: ['shopping', 'utilities'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  base: '/9adhiya/',
})
