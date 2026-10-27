// Synchronisation de la liste avec le serveur (MariaDB). Le navigateur garde une copie locale (hors connexion) ;
// le serveur est la référence partagée entre tous les appareils. Pas de compte : une seule liste pour tous.
import { createDefaultData, migrateData } from './shoppingList.js'
import { mergeLists } from './merge.js'

// Surchargeable via VITE_API_URL (voir .env.example).
export const API_URL = (import.meta.env?.VITE_API_URL ?? 'https://panier.clubika.com/api').replace(/\/+$/, '')
export const SYNC_KEY = 'qaimat-shira-sync-v1'

const POLL_MS = 20_000
const PUSH_DELAY_MS = 700
const REQUEST_TIMEOUT_MS = 10_000
const MAX_CONFLICT_RETRIES = 4

const clone = (value) => JSON.parse(JSON.stringify(value))
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/**
 * getData / setData : lecture et remplacement de la liste affichée (état React).
 * options : { fetchImpl, storage, setTimeoutImpl } pour les tests.
 */
export function createSync({ getData, setData, onStatus = () => {}, fetchImpl = globalThis.fetch?.bind(globalThis), storage = globalThis.localStorage, apiUrl = API_URL }) {
  let state = readState(storage) // { revision, base } : dernière version connue du serveur
  let timer = null
  let poller = null
  let running = false
  let stopped = false

  async function request(method, body) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      const response = await fetchImpl(`${apiUrl}/list`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })
      const data = response.status === 204 ? null : await response.json().catch(() => null)
      return { status: response.status, data }
    } finally {
      clearTimeout(timeout)
    }
  }

  function remember(revision, base) {
    state = { revision, base: clone(base) }
    try { storage?.setItem(SYNC_KEY, JSON.stringify(state)) } catch { /* copie locale facultative */ }
  }

  // Version à utiliser comme point de départ : celle du dernier échange, ou le catalogue d'origine la première fois.
  const baseOf = () => state.base ?? createDefaultData()

  // Reçoit la version du serveur : fusionne les changements locaux, ou l'adopte telle quelle s'il n'y en a pas.
  function integrate(remoteList, remoteRevision) {
    const remote = migrateData(remoteList).data
    const local = getData()
    const merged = same(local, baseOf()) ? remote : mergeLists(baseOf(), local, remote)
    remember(remoteRevision, remoteList)
    if (!same(merged, local)) setData(merged)
    return merged
  }

  async function exchange() {
    for (let attempt = 0; attempt < MAX_CONFLICT_RETRIES; attempt += 1) {
      const current = await request('GET')
      if (current.status !== 200) throw new Error(`HTTP ${current.status}`)
      const { list, revision } = current.data
      let data = getData()

      if (list === null) {
        // Première liste du serveur : celle de cet appareil.
        state = { revision: 0, base: null }
      } else if (state.revision !== revision || state.base === null) {
        data = integrate(list, revision)
      }

      // Rien à envoyer si la liste locale est celle du serveur.
      if (state.base && same(data, state.base)) return
      const saved = await request('PUT', { revision: state.revision, list: data })
      if (saved.status === 200) {
        remember(saved.data.revision, data)
        return
      }
      if (saved.status !== 409) throw new Error(`HTTP ${saved.status}`)
      // Quelqu'un a modifié la liste entre-temps : on fusionne avec sa version, puis le tour suivant réessaie.
      integrate(saved.data.list, saved.data.revision)
    }
    throw new Error('Trop de conflits')
  }

  async function sync() {
    if (running || stopped) return
    running = true
    onStatus('syncing')
    let ok = false
    try {
      await exchange()
      ok = true
      onStatus('synced')
    } catch {
      // Hors connexion : pas de réessai en boucle, le sondage régulier et l'événement « online » reprennent.
      onStatus('offline')
    } finally {
      running = false
    }
    // Des modifications faites pendant l'échange partiront au prochain tour.
    if (ok && !stopped && state.base && !same(getData(), state.base)) schedule()
  }

  function schedule(delay = PUSH_DELAY_MS) {
    clearTimeout(timer)
    timer = setTimeout(sync, delay)
  }

  const onVisible = () => { if (document.visibilityState === 'visible') sync() }

  return {
    /** À appeler à chaque modification de la liste. */
    changed() {
      if (!state.base || !same(getData(), state.base)) schedule()
    },
    start() {
      stopped = false
      sync()
      poller = setInterval(() => { if (typeof document === 'undefined' || document.visibilityState === 'visible') sync() }, POLL_MS)
      if (typeof window !== 'undefined') {
        window.addEventListener('online', sync)
        document.addEventListener('visibilitychange', onVisible)
      }
    },
    stop() {
      stopped = true
      clearTimeout(timer)
      clearInterval(poller)
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', sync)
        document.removeEventListener('visibilitychange', onVisible)
      }
    },
    sync,
  }
}

function readState(storage) {
  try {
    const value = JSON.parse(storage?.getItem(SYNC_KEY) || 'null')
    if (value && Number.isInteger(value.revision) && Array.isArray(value.base)) return value
  } catch { /* copie illisible : on repart du catalogue d'origine */ }
  return { revision: 0, base: null }
}
