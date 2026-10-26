import { HttpError, badRequest } from './http.js'
import { transaction, toIso } from './db.js'
import { createRateLimiter } from './ratelimit.js'

const MAX_CATEGORIES = 100
const MAX_ITEMS = 5000
const MAX_NAME = 200
const KEEP_VERSIONS = 200

const str = (value, field, max = MAX_NAME) => {
  if (typeof value !== 'string' || !value.length || value.length > max) throw badRequest(`Champ ${field} invalide.`)
  return value
}

/** Vérifie la forme de la liste et ne garde que les champs connus (id, name, collapsed, items[id, name, checked, qty]). */
export function validateList(list) {
  if (!Array.isArray(list) || !list.length || list.length > MAX_CATEGORIES) throw badRequest('Liste invalide.')
  let items = 0
  return list.map((category) => {
    if (!category || typeof category !== 'object' || !Array.isArray(category.items)) throw badRequest('Catégorie invalide.')
    items += category.items.length
    if (items > MAX_ITEMS) throw badRequest('Trop d’articles.')
    return {
      id: str(category.id, 'id'),
      name: str(category.name, 'name'),
      collapsed: Boolean(category.collapsed),
      items: category.items.map((item) => {
        if (!item || typeof item !== 'object') throw badRequest('Article invalide.')
        const qty = Number.isInteger(item.qty) ? item.qty : 1
        if (qty < 1 || qty > 999) throw badRequest('Quantité invalide.')
        return { id: str(item.id, 'id'), name: str(item.name, 'name'), checked: Boolean(item.checked), qty }
      }),
    }
  })
}

export function registerRoutes(router, { pool }) {
  // Pas de compte : on freine les écritures abusives par adresse IP.
  const limitWrites = createRateLimiter({
    limit: 240, windowMs: 60_000,
    onLimit: () => { throw new HttpError(429, 'Trop de modifications, réessaie dans une minute.', 'rate_limited') },
  })

  const current = async (db) => {
    const [rows] = await db.execute('SELECT data, revision, updated_at FROM shopping_list WHERE id = 1')
    return rows[0] ? { list: JSON.parse(rows[0].data), revision: Number(rows[0].revision), updated_at: toIso(rows[0].updated_at) } : { list: null, revision: 0, updated_at: null }
  }

  router.get('/list', () => current(pool))

  /**
   * Écriture conditionnelle : `revision` est celle que le client connaît. Si quelqu'un a modifié la liste entre-temps,
   * la réponse 409 contient la version actuelle, que le client fusionne avec ses changements avant de réessayer.
   */
  router.put('/list', async ({ body, ip }) => {
    limitWrites(ip)
    const revision = Number(body?.revision)
    if (!Number.isInteger(revision) || revision < 0) throw badRequest('Champ revision invalide.')
    const data = JSON.stringify(validateList(body?.list))

    const result = await transaction(pool, async (db) => {
      const [rows] = await db.execute('SELECT revision FROM shopping_list WHERE id = 1 FOR UPDATE')
      const stored = rows[0] ? Number(rows[0].revision) : 0
      if (stored !== revision) return { conflict: await current(db) }
      const next = stored + 1
      if (stored === 0) await db.execute('INSERT INTO shopping_list (id, data, revision) VALUES (1, ?, ?)', [data, next])
      else await db.execute('UPDATE shopping_list SET data = ?, revision = ?, updated_at = UTC_TIMESTAMP(3) WHERE id = 1', [data, next])
      await db.execute('INSERT INTO shopping_list_history (revision, data) VALUES (?, ?)', [next, data])
      await db.execute('DELETE FROM shopping_list_history WHERE revision <= ?', [next - KEEP_VERSIONS])
      return { revision: next }
    })
    if (result.conflict) return { status: 409, body: { error: 'conflict', message: 'La liste a été modifiée ailleurs.', ...result.conflict } }
    return result
  })
}
