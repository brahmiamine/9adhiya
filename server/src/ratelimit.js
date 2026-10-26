/** Limiteur en mémoire : `limit` requêtes par fenêtre de `windowMs` et par clé (adresse IP). */
export function createRateLimiter({ limit, windowMs, onLimit }) {
  const hits = new Map()
  return (key) => {
    const now = Date.now()
    const entry = hits.get(key)
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs })
      if (hits.size > 10_000) {
        for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k)
      }
      return
    }
    entry.count += 1
    if (entry.count > limit) onLimit()
  }
}
