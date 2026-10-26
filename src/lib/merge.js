// Fusion à trois voies de la liste de courses : `base` est la dernière version connue du serveur, `local` la version
// de cet appareil, `remote` la version actuelle du serveur. Le résultat part de `remote` et y applique ce que cet
// appareil a changé depuis `base` (ajouts, suppressions, cases cochées, quantités, noms).
// Deux appareils qui modifient des articles différents ne s'écrasent donc pas.
const CATEGORY_FIELDS = ['name', 'collapsed']
const ITEM_FIELDS = ['name', 'checked', 'qty']

const clone = (value) => JSON.parse(JSON.stringify(value))
const byId = (list) => new Map((list || []).map((entry) => [entry.id, entry]))

export function mergeLists(base, local, remote) {
  const result = clone(remote)
  const baseCategories = byId(base)
  const resultCategories = byId(result)

  for (const localCategory of local) {
    const baseCategory = baseCategories.get(localCategory.id)
    const resultCategory = resultCategories.get(localCategory.id)

    if (!resultCategory) {
      // Ajoutée ici : on la garde. Supprimée ailleurs : la suppression l'emporte.
      if (!baseCategory) result.push(clone(localCategory))
      continue
    }

    if (baseCategory) {
      for (const field of CATEGORY_FIELDS) {
        if (localCategory[field] !== baseCategory[field]) resultCategory[field] = localCategory[field]
      }
    }

    const baseItems = byId(baseCategory?.items)
    const resultItems = byId(resultCategory.items)
    const localIds = new Set(localCategory.items.map((item) => item.id))

    for (const item of localCategory.items) {
      const baseItem = baseItems.get(item.id)
      const resultItem = resultItems.get(item.id)
      if (!resultItem) {
        // Ajouté ici (et pas déjà présent sous le même nom) : on le garde. Supprimé ailleurs : reste supprimé.
        if (!baseItem && !resultCategory.items.some((other) => other.name === item.name)) resultCategory.items.push(clone(item))
      } else if (baseItem) {
        for (const field of ITEM_FIELDS) {
          if (item[field] !== baseItem[field]) resultItem[field] = item[field]
        }
      }
    }

    // Supprimés ici depuis la dernière synchronisation.
    if (baseCategory) {
      const removed = new Set(baseCategory.items.filter((item) => !localIds.has(item.id)).map((item) => item.id))
      if (removed.size) resultCategory.items = resultCategory.items.filter((item) => !removed.has(item.id))
    }
  }
  return result
}
