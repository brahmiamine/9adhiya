import { createRouter, createServer } from './http.js'
import { registerRoutes } from './routes.js'

export const DEFAULT_ORIGINS = ['https://brahmiamine.github.io', 'http://localhost:5173', 'http://localhost:4173']

export function createApp({ pool, env = process.env, logger = console }) {
  const router = createRouter()
  router.get('/health', async () => {
    await pool.query('SELECT 1')
    return { ok: true }
  })
  registerRoutes(router, { pool })

  const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',').map((value) => value.trim()) : DEFAULT_ORIGINS
  return createServer({ router, allowedOrigins, bodyLimit: 2 * 1024 * 1024, logger, staticDir: env.STATIC_DIR })
}
