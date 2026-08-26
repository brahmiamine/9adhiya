import assert from 'node:assert/strict'
import test from 'node:test'
import { STORAGE_KEY, buildShareText, countChecked, createDefaultData, loadData, migrateData, searchCategories } from '../src/lib/shoppingList.js'

test('the default catalog preserves all eight categories and 89 items', () => {
  const data = createDefaultData()
  assert.equal(data.length, 8)
  assert.equal(data.reduce((total, category) => total + category.items.length, 0), 89)
  assert.equal(countChecked(data), 0)
  assert.deepEqual(data.find((category) => category.id === 'monadhifat').items.slice(-2).map((item) => item.name), ['لنجات', 'فرشاة أسنان'])
  assert.deepEqual(data.find((category) => category.id === 'moksarat').items.slice(-3).map((item) => item.name), ['قلوب قرع', 'اكاجو', 'سمسم'])
})

test('legacy names and missing quantities are migrated without losing a checked item', () => {
  const legacy = [{ id: 'khodhra', name: 'خضرة', collapsed: false, items: [{ id: 'old-1', name: 'خيار', checked: true }] }]
  const { data, changed } = migrateData(legacy)
  const cucumber = data.find((category) => category.id === 'khodhra').items.find((item) => item.name === 'فقوس')
  assert.equal(changed, true)
  assert.equal(cucumber.checked, true)
  assert.equal(cucumber.qty, 1)
  assert.equal(data.length, 8)
})

test('migration adds the latest cleaning and nut items to an existing saved list', () => {
  const latestNames = new Set(['لنجات', 'فرشاة أسنان', 'قلوب قرع', 'اكاجو', 'سمسم'])
  const previousData = createDefaultData().map((category) => ({
    ...category,
    items: category.items.filter((item) => !latestNames.has(item.name)),
  }))
  const { data, changed } = migrateData(previousData)
  const migratedNames = new Set(data.flatMap((category) => category.items.map((item) => item.name)))

  assert.equal(changed, true)
  for (const name of latestNames) assert.equal(migratedNames.has(name), true)
})

test('invalid saved JSON safely restores the default catalog', () => {
  const storage = { getItem: (key) => key === STORAGE_KEY ? '{invalid' : null }
  const result = loadData(storage)
  assert.equal(result.shouldPersist, true)
  assert.equal(result.data.length, 8)
})

test('search returns every category containing the Arabic query', () => {
  const matches = searchCategories(createDefaultData(), 'طماطم')
  assert.equal(matches.length, 2)
  assert.equal(matches[0].category.id, 'khodhra')
  assert.deepEqual(matches[0].items.map((item) => item.name), ['طماطم'])
  assert.deepEqual(matches[1].items.map((item) => item.name), ['حكة طماطم'])
  assert.equal(matches.every((match) => match.forceOpen), true)
})

test('share text keeps item quantities and stable formatting', () => {
  const checkedItems = [{ category: { id: 'ghalla' }, item: { name: 'تفاح', qty: 3 } }]
  const text = buildShareText(checkedItems, new Date('2026-08-26T14:30:00Z'))
  assert.match(text, /تفاح X3/)
  assert.match(text, /^🧺 قفتي للتسوق/)
})
