import { CATEGORY_DEFINITIONS, EMOJI_MAP } from '../data/catalog.js'

export const STORAGE_KEY = 'qaimat-shira-data-v1'

const EXTRA_DEFAULTS = {
  okhra: ['زيتون اكحل', 'زيتون اخضر', 'عسل', 'عصير', 'قازوز', 'حكة هريسة', 'حكة طماطم', 'شكلاطو'],
  khobz: ['خبز تركي', 'بريك', 'نواصر'],
  lham: ['كبدة', 'لحم مفروم', 'لحم بقري', 'لحم دجاج', 'تن', 'سردينه', 'شفرات', 'سومون', 'سكالوب'],
  ghalla: ['أناناس', 'مانغا', 'بطيخ'],
  khodhra: ['فلفل حار', 'فلفل حلو', 'فلفل احمر', 'جلبانة'],
  halib: ['فرماج', 'متزارلا', 'كرام فراش'],
  monadhifat: ['لسيف الغسالة', 'بارفان الغسالة', 'بارفان الدار', 'بارفان الأرضية', 'لنجات', 'فرشاة أسنان'],
  moksarat: ['لوز', 'جوز', 'فستق', 'كاوكاو', 'بندق', 'لوبيا', 'حمص', 'قلوب قرع', 'اكاجو', 'سمسم'],
}

const RENAME_MAP = {
  'خيار': 'فقوس', 'الجزر': 'سفنارية', 'فراولة': 'فراز', 'سمك': 'حوت', 'بيض': 'عضم', 'موز': 'بنان',
  'ديتارجان': 'صابون يدين', 'الكرافس': 'سبناخ', 'مكرونة': 'مقرونة', 'سميدة': 'سميد', 'جبن': 'جبن مرحي', 'قمبري': 'شفرات', 'سلمون': 'سومون',
}

export function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `i${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function createItem(name, id = createId()) {
  return { id, name, checked: false, qty: 1 }
}

export function createDefaultData() {
  return CATEGORY_DEFINITIONS.map((category) => ({
    id: category.id,
    name: category.name,
    collapsed: category.collapsed,
    items: category.items.map((name, index) => createItem(name, `${category.id}-${index + 1}`)),
  }))
}

function cloneData(value) {
  return value.map((category) => ({
    ...category,
    items: Array.isArray(category.items) ? category.items.map((item) => ({ ...item })) : [],
  }))
}

function replaceItem(category, oldName, newNames) {
  const index = category.items.findIndex((item) => item.name === oldName)
  if (index === -1) return false
  const oldItem = category.items[index]
  const replacements = newNames.map((name) => ({
    ...createItem(name),
    checked: Boolean(oldItem.checked),
    qty: Number.isFinite(oldItem.qty) ? Math.max(1, oldItem.qty) : 1,
  }))
  category.items.splice(index, 1, ...replacements)
  return true
}

export function migrateData(value) {
  if (!Array.isArray(value)) return { data: createDefaultData(), changed: true }

  const data = cloneData(value)
  let changed = false

  for (const definition of CATEGORY_DEFINITIONS) {
    if (!data.some((category) => category.id === definition.id)) {
      data.push({ id: definition.id, name: definition.name, collapsed: definition.collapsed, items: [] })
      changed = true
    }
  }

  for (const category of data) {
    if (typeof category.collapsed !== 'boolean') {
      category.collapsed = false
      changed = true
    }
    for (const item of category.items) {
      if (RENAME_MAP[item.name]) {
        item.name = RENAME_MAP[item.name]
        changed = true
      }
      if (!item.id) {
        item.id = createId()
        changed = true
      }
      const nextQuantity = Number.isFinite(item.qty) ? Math.max(1, Math.trunc(item.qty)) : 1
      if (item.qty !== nextQuantity) {
        item.qty = nextQuantity
        changed = true
      }
      if (typeof item.checked !== 'boolean') {
        item.checked = Boolean(item.checked)
        changed = true
      }
    }

    changed = replaceItem(category, 'القرعة', ['قرع احمر', 'قرع اخضر']) || changed
    changed = replaceItem(category, 'مناديل', ['مناديل صغيرة', 'مناديل كبيرة']) || changed
    const soapIndex = category.items.findIndex((item) => item.name === 'صابون')
    if (soapIndex !== -1) {
      category.items.splice(soapIndex, 1)
      changed = true
    }
  }

  const khobz = data.find((category) => category.id === 'khobz')
  const lham = data.find((category) => category.id === 'lham')
  if (khobz && lham) {
    const index = khobz.items.findIndex((item) => item.name === 'سكالوب بريك')
    if (index !== -1) {
      const [oldItem] = khobz.items.splice(index, 1)
      khobz.items.splice(index, 0, { ...oldItem, id: createId(), name: 'بريك' })
      if (!lham.items.some((item) => item.name === 'سكالوب')) lham.items.push({ ...oldItem, id: createId(), name: 'سكالوب' })
      changed = true
    }
  }

  const moves = [
    ['نواصر', 'okhra', 'khobz'], ['لوز', 'okhra', 'moksarat'], ['لوبيا', 'khobz', 'moksarat'], ['حمص', 'khobz', 'moksarat'],
  ]
  for (const [name, fromId, toId] of moves) {
    const from = data.find((category) => category.id === fromId)
    const to = data.find((category) => category.id === toId)
    const index = from?.items.findIndex((item) => item.name === name) ?? -1
    if (index !== -1 && to) {
      const [item] = from.items.splice(index, 1)
      if (!to.items.some((candidate) => candidate.name === name)) to.items.push(item)
      changed = true
    }
  }

  for (const [categoryId, names] of Object.entries(EXTRA_DEFAULTS)) {
    const category = data.find((candidate) => candidate.id === categoryId)
    if (!category) continue
    for (const name of names) {
      if (!category.items.some((item) => item.name === name)) {
        category.items.push(createItem(name))
        changed = true
      }
    }
  }

  return { data, changed }
}

export function loadData(storage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return { data: createDefaultData(), shouldPersist: true }
    const migrated = migrateData(JSON.parse(raw))
    return { data: migrated.data, shouldPersist: migrated.changed }
  } catch {
    return { data: createDefaultData(), shouldPersist: true }
  }
}

export function countChecked(data) {
  return data.reduce((total, category) => total + category.items.filter((item) => item.checked).length, 0)
}

export function getCheckedItems(data) {
  return data.flatMap((category) => category.items.filter((item) => item.checked).map((item) => ({ category, item })))
}

export function searchCategories(data, query) {
  const normalized = query.trim()
  if (!normalized) return data.map((category) => ({ category, items: category.items, forceOpen: false }))
  return data
    .map((category) => ({ category, items: category.items.filter((item) => item.name.includes(normalized)), forceOpen: true }))
    .filter(({ items }) => items.length > 0)
}

export function formatItemName(name) {
  return EMOJI_MAP[name] ? `${EMOJI_MAP[name]} ${name}` : name
}

export function buildShareText(checkedItems, date = new Date()) {
  const dateString = date.toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const lines = checkedItems.map(({ item }) => `- ${formatItemName(item.name)} X${item.qty || 1}`)
  return `🧺 قفتي للتسوق - ${dateString}:\n${lines.join('\n')}`
}
