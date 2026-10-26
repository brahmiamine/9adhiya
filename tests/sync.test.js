import assert from 'node:assert/strict'
import test from 'node:test'
import { createDefaultData } from '../src/lib/shoppingList.js'
import { createSync, SYNC_KEY } from '../src/lib/sync.js'

// Faux serveur : mêmes règles que l'API (révision, conflit 409 avec la version actuelle).
function fakeServer(initial = null) {
  const server = { list: initial, revision: initial ? 1 : 0, offline: false, calls: [] }
  server.fetch = async (url, { method, body }) => {
    if (server.offline) throw new TypeError('network')
    server.calls.push(method)
    const reply = (status, data) => ({ status, json: async () => data })
    if (method === 'GET') return reply(200, { list: server.list, revision: server.revision })
    const { list, revision } = JSON.parse(body)
    if (revision !== server.revision) return reply(409, { error: 'conflict', list: server.list, revision: server.revision })
    server.list = list; server.revision += 1
    return reply(200, { revision: server.revision })
  }
  return server
}

function memoryStorage() {
  const map = new Map()
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), map }
}

function device(server, data, storage = memoryStorage()) {
  const state = { data }
  const sync = createSync({ getData: () => state.data, setData: (next) => { state.data = next }, fetchImpl: server.fetch, storage, apiUrl: 'http://x' })
  return { state, sync, storage }
}

const clone = (v) => structuredClone(v)

test('le premier appareil envoie sa liste quand le serveur est vide', async () => {
  const server = fakeServer()
  const local = createDefaultData(); local[0].items[0].checked = true
  const a = device(server, clone(local))
  await a.sync.sync()
  assert.equal(server.revision, 1)
  assert.deepEqual(server.list, local)
  assert.equal(JSON.parse(a.storage.getItem(SYNC_KEY)).revision, 1)
})

test('un nouvel appareil récupère la liste du serveur', async () => {
  const shared = createDefaultData(); shared[0].items[0].checked = true; shared[0].items[0].qty = 4
  const server = fakeServer(clone(shared))
  const b = device(server, createDefaultData())
  await b.sync.sync()
  assert.equal(b.state.data[0].items[0].checked, true)
  assert.equal(b.state.data[0].items[0].qty, 4)
  assert.equal(server.revision, 1) // rien à renvoyer
})

test('une liste déjà modifiée sur cet appareil est fusionnée avec celle du serveur à la première synchronisation', async () => {
  const shared = createDefaultData(); shared[1].items[0].checked = true
  const server = fakeServer(clone(shared))
  const mine = createDefaultData(); mine[0].items[0].checked = true // l'ancienne liste du téléphone
  const c = device(server, mine)
  await c.sync.sync()
  assert.equal(c.state.data[0].items[0].checked, true)
  assert.equal(c.state.data[1].items[0].checked, true)
  assert.equal(server.list[0].items[0].checked, true)
  assert.equal(server.list[1].items[0].checked, true)
})

test('deux appareils qui modifient en même temps convergent vers la même liste', async () => {
  const server = fakeServer()
  const a = device(server, createDefaultData())
  const b = device(server, createDefaultData())
  await a.sync.sync(); await b.sync.sync()

  a.state.data[0].items[0].checked = true
  b.state.data[0].items[1].qty = 7
  await a.sync.sync()
  await b.sync.sync() // conflit : fusion puis envoi
  await a.sync.sync()

  for (const d of [a, b]) {
    assert.equal(d.state.data[0].items[0].checked, true)
    assert.equal(d.state.data[0].items[1].qty, 7)
  }
  assert.deepEqual(a.state.data, server.list)
  assert.deepEqual(b.state.data, server.list)
})

test('hors connexion, la liste locale reste intacte puis part au retour du réseau', async () => {
  const server = fakeServer()
  const a = device(server, createDefaultData())
  await a.sync.sync()
  server.offline = true
  a.state.data[0].items[0].checked = true
  const statuses = []
  const offline = createSync({ getData: () => a.state.data, setData: (n) => { a.state.data = n }, fetchImpl: server.fetch, storage: a.storage, apiUrl: 'http://x', onStatus: (s) => statuses.push(s) })
  await offline.sync()
  assert.equal(statuses.at(-1), 'offline')
  assert.equal(a.state.data[0].items[0].checked, true)
  assert.equal(server.list[0].items[0].checked, false)
  server.offline = false
  await offline.sync()
  assert.equal(statuses.at(-1), 'synced')
  assert.equal(server.list[0].items[0].checked, true)
})

test('l’état de synchronisation est conservé après un redémarrage de l’application', async () => {
  const server = fakeServer()
  const storage = memoryStorage()
  const a = device(server, createDefaultData(), storage)
  await a.sync.sync()
  const calls = server.calls.length
  const again = device(server, clone(a.state.data), storage) // même stockage : l'appareil sait où il en était
  await again.sync.sync()
  assert.equal(server.revision, 1)
  assert.equal(server.calls.length - calls, 1) // un seul GET, aucun envoi
})
