import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'

const requiredFiles = [
  'dist/manifest.webmanifest',
  'dist/sw.js',
  'dist/icons/icon-192.png',
  'dist/icons/icon-512.png',
  'dist/icons/icon-512-maskable.png',
  'dist/icons/apple-touch-icon.png',
  'dist/splash/iphone-5.png',
  'dist/splash/iphone-8.png',
  'dist/splash/iphone-x.png',
  'dist/splash/iphone-xr.png',
  'dist/splash/iphone-14.png',
  'dist/splash/iphone-15-pro.png',
  'dist/splash/iphone-14-pro-max.png',
]

await Promise.all(requiredFiles.map(async (path) => {
  const file = await stat(path)
  assert(file.isFile(), `${path} doit être un fichier`)
  assert(file.size > 0, `${path} ne doit pas être vide`)
}))

const manifest = JSON.parse(await readFile('dist/manifest.webmanifest', 'utf8'))
assert.equal(manifest.start_url, '/9adhiya/')
assert.equal(manifest.scope, '/9adhiya/')
assert.equal(manifest.display, 'standalone')
assert.equal(manifest.orientation, 'portrait-primary')
assert.equal(manifest.lang, 'ar-TN')
assert.equal(manifest.dir, 'rtl')
assert(manifest.icons.some((icon) => icon.sizes === '192x192'))
assert(manifest.icons.some((icon) => icon.sizes === '512x512' && icon.purpose === 'maskable'))

console.log(`PWA validée : ${requiredFiles.length} fichiers, manifeste RTL et service worker présents.`)
