import assert from 'node:assert/strict'
import test from 'node:test'
import { mergeLists } from '../src/lib/merge.js'

const item = (id, name, extra = {}) => ({ id, name, checked: false, qty: 1, ...extra })
const category = (id, items, extra = {}) => ({ id, name: id, collapsed: false, items, ...extra })
const names = (list, id) => list.find((c) => c.id === id).items.map((i) => i.name)

const base = [category('a', [item('1', 'pain'), item('2', 'lait')]), category('b', [item('3', 'riz')])]

test('deux appareils qui modifient des articles différents ne s’écrasent pas', () => {
  const local = structuredClone(base); local[0].items[0].checked = true
  const remote = structuredClone(base); remote[0].items[1].qty = 3; remote[1].items[0].checked = true
  const merged = mergeLists(base, local, remote)
  assert.equal(merged[0].items[0].checked, true)
  assert.equal(merged[0].items[1].qty, 3)
  assert.equal(merged[1].items[0].checked, true)
})

test('une modification locale l’emporte sur la même modification distante, mais pas sur le reste', () => {
  const local = structuredClone(base); local[0].items[0].qty = 5
  const remote = structuredClone(base); remote[0].items[0].qty = 2; remote[0].items[0].checked = true
  const merged = mergeLists(base, local, remote)
  assert.equal(merged[0].items[0].qty, 5)
  assert.equal(merged[0].items[0].checked, true)
})

test('les ajouts des deux côtés sont conservés, sans doublon de nom', () => {
  const local = structuredClone(base); local[0].items.push(item('l1', 'oeufs'), item('l2', 'beurre'))
  const remote = structuredClone(base); remote[0].items.push(item('r1', 'beurre'), item('r2', 'sucre'))
  assert.deepEqual(names(mergeLists(base, local, remote), 'a'), ['pain', 'lait', 'beurre', 'sucre', 'oeufs'])
})

test('une suppression locale est appliquée, une suppression distante aussi', () => {
  const local = structuredClone(base); local[0].items.splice(0, 1)
  const remote = structuredClone(base); remote[0].items.splice(1, 1)
  assert.deepEqual(names(mergeLists(base, local, remote), 'a'), [])
  // Modifié ici mais supprimé ailleurs : reste supprimé.
  const edited = structuredClone(base); edited[0].items[1].qty = 9
  assert.deepEqual(names(mergeLists(base, edited, remote), 'a'), ['pain'])
})

test('l’état d’une catégorie (repliée) et son nom suivent les changements locaux', () => {
  const local = structuredClone(base); local[1].collapsed = true; local[0].name = 'Épicerie'
  const merged = mergeLists(base, local, structuredClone(base))
  assert.equal(merged[1].collapsed, true)
  assert.equal(merged[0].name, 'Épicerie')
})

test('sans modification locale, le résultat est exactement la version distante', () => {
  const remote = structuredClone(base); remote[0].items.push(item('r', 'thé'))
  assert.deepEqual(mergeLists(base, structuredClone(base), remote), remote)
})

test('la fusion ne modifie pas ses arguments', () => {
  const local = structuredClone(base); local[0].items[0].checked = true
  const remote = structuredClone(base); remote[0].items.push(item('r', 'thé'))
  const snapshot = JSON.stringify([base, local, remote])
  mergeLists(base, local, remote)
  assert.equal(JSON.stringify([base, local, remote]), snapshot)
})
