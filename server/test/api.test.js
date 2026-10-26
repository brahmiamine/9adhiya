// Tests d'intégration contre une vraie base MariaDB de test.
// TEST_DB_NAME, TEST_DB_USER, TEST_DB_PASSWORD (+ TEST_DB_SOCKET ou TEST_DB_HOST) ; ignorés sinon.
import { after, before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'
import { createPool, migrate } from '../src/db.js'

const env = {
  DB_NAME: process.env.TEST_DB_NAME,
  DB_USER: process.env.TEST_DB_USER,
  DB_PASSWORD: process.env.TEST_DB_PASSWORD,
  DB_SOCKET: process.env.TEST_DB_SOCKET,
  DB_HOST: process.env.TEST_DB_HOST,
}
const skip = !env.DB_NAME && 'TEST_DB_NAME non défini'

const list = (extra = []) => [
  { id: 'okhra', name: 'Épicerie', collapsed: false, items: [{ id: 'okhra-1', name: 'سكر', checked: false, qty: 1 }, ...extra] },
  { id: 'lham', name: 'Viande', collapsed: true, items: [] },
]

describe('9adhiya API', { skip }, () => {
  let pool
  let server
  let base

  const call = async (method, path, body) => {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const text = await response.text()
    return { status: response.status, data: text ? JSON.parse(text) : null }
  }

  before(async () => {
    pool = createPool(env)
    await pool.query('SET FOREIGN_KEY_CHECKS = 0')
    const [tables] = await pool.query('SHOW TABLES')
    for (const row of tables) await pool.query(`DROP TABLE \`${Object.values(row)[0]}\``)
    await pool.query('SET FOREIGN_KEY_CHECKS = 1')
    await migrate(new URL('../schema.sql', import.meta.url), env)
    await migrate(new URL('../schema.sql', import.meta.url), env) // idempotent
    server = createApp({ pool, env, logger: { error() {} } })
    await new Promise((resolve) => server.listen(0, resolve))
    base = `http://127.0.0.1:${server.address().port}`
  })

  after(async () => {
    await new Promise((resolve) => server.close(resolve))
    await pool.end()
  })

  beforeEach(async () => {
    await pool.query('DELETE FROM shopping_list')
    await pool.query('DELETE FROM shopping_list_history')
  })

  it('renvoie une liste vide au départ puis enregistre la première liste sans authentification', async () => {
    assert.deepEqual((await call('GET', '/list')).data, { list: null, revision: 0, updated_at: null })
    const saved = await call('PUT', '/list', { revision: 0, list: list() })
    assert.equal(saved.status, 200)
    assert.deepEqual(saved.data, { revision: 1 })
    const read = (await call('GET', '/list')).data
    assert.equal(read.revision, 1)
    assert.deepEqual(read.list, list())
    assert.match(read.updated_at, /^\d{4}-\d{2}-\d{2}T.*Z$/)
  })

  it('détecte une modification concurrente et renvoie la version actuelle', async () => {
    await call('PUT', '/list', { revision: 0, list: list() })
    const first = await call('PUT', '/list', { revision: 1, list: list([{ id: 'a', name: 'ماء', checked: true, qty: 2 }]) })
    assert.deepEqual(first.data, { revision: 2 })

    // Un autre appareil écrit encore à partir de la révision 1.
    const stale = await call('PUT', '/list', { revision: 1, list: list([{ id: 'b', name: 'خبز', checked: false, qty: 1 }]) })
    assert.equal(stale.status, 409)
    assert.equal(stale.data.error, 'conflict')
    assert.equal(stale.data.revision, 2)
    assert.equal(stale.data.list[0].items.at(-1).name, 'ماء')
    assert.equal((await call('GET', '/list')).data.revision, 2)
  })

  it('refuse les listes invalides et ne garde que les champs connus', async () => {
    assert.equal((await call('PUT', '/list', { revision: 0, list: [] })).status, 400)
    assert.equal((await call('PUT', '/list', { revision: 0, list: 'x' })).status, 400)
    assert.equal((await call('PUT', '/list', { revision: 0 })).status, 400)
    assert.equal((await call('PUT', '/list', { list: list() })).status, 400)
    const badQty = list([{ id: 'q', name: 'x', checked: false, qty: 0 }])
    assert.equal((await call('PUT', '/list', { revision: 0, list: badQty })).status, 400)
    const long = list([{ id: 'l', name: 'x'.repeat(201), checked: false, qty: 1 }])
    assert.equal((await call('PUT', '/list', { revision: 0, list: long })).status, 400)

    const extra = list(); extra[0].secret = 'x'; extra[0].items[0].evil = '<script>'
    await call('PUT', '/list', { revision: 0, list: extra })
    assert.deepEqual((await call('GET', '/list')).data.list, list())
  })

  it('conserve l’historique des versions et le limite aux 200 dernières', async () => {
    let revision = 0
    for (let i = 0; i < 3; i += 1) {
      revision = (await call('PUT', '/list', { revision, list: list([{ id: `n${i}`, name: `a${i}`, checked: false, qty: 1 }]) })).data.revision
    }
    const [rows] = await pool.query('SELECT revision FROM shopping_list_history ORDER BY revision')
    assert.deepEqual(rows.map((row) => Number(row.revision)), [1, 2, 3])

    await pool.query('UPDATE shopping_list SET revision = 1500 WHERE id = 1')
    await call('PUT', '/list', { revision: 1500, list: list() })
    const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM shopping_list_history')
    assert.equal(Number(count), 1)
    const [[{ latest }]] = await pool.query('SELECT MAX(revision) AS latest FROM shopping_list_history')
    assert.equal(Number(latest), 1501)
  })

  it('limite le nombre d’écritures par adresse', async () => {
    let status = 0
    for (let i = 0; i < 250 && status !== 429; i += 1) status = (await call('PUT', '/list', { revision: 99999, list: list() })).status
    assert.equal(status, 429)
  })
})
