import { useState } from 'react'
import { categoryName, useI18n } from '../lib/i18n.js'
import { CATEGORY_ICONS, FaChevronDown, FaPlus } from './icons.jsx'
import ShoppingItem from './ShoppingItem.jsx'

export default function CategoryCard({ category, items, forceOpen, onToggleCategory, onToggleItem, onDeleteItem, onAddItem }) {
  const [newItem, setNewItem] = useState('')
  const { lang, t } = useI18n()
  const CategoryIcon = CATEGORY_ICONS[category.id]
  const name = categoryName(category, lang)
  const isOpen = forceOpen || !category.collapsed
  const checkedCount = category.items.filter((item) => item.checked).length
  const panelId = `category-${category.id}`

  function handleSubmit(event) {
    event.preventDefault()
    const value = newItem.trim()
    if (!value) return
    onAddItem(category.id, value)
    setNewItem('')
  }

  return (
    <section className="category" aria-labelledby={`${panelId}-title`}>
      <button className="category__toggle" type="button" aria-expanded={isOpen} aria-controls={`${panelId}-body`} onClick={() => onToggleCategory(category.id)}>
        <span className="category__name" id={`${panelId}-title`}>{CategoryIcon ? <CategoryIcon className="category__icon" aria-hidden="true" /> : <span className="category__marker" aria-hidden="true" />}{name}</span>
        <span className="category__meta"><span>{checkedCount}/{category.items.length}</span><FaChevronDown className="category__chevron" aria-hidden="true" /></span>
      </button>

      {isOpen && (
        <div className="category__body" id={`${panelId}-body`}>
          {items.map((item) => (
            <ShoppingItem key={item.id} categoryId={category.id} item={item} onToggle={onToggleItem} onDelete={onDeleteItem} />
          ))}
          <form className="add-item" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor={`${panelId}-new-item`}>{t.addTo(name)}</label>
            <input id={`${panelId}-new-item`} value={newItem} onChange={(event) => setNewItem(event.target.value)} placeholder={t.addPlaceholder} autoComplete="off" />
            <button type="submit" disabled={!newItem.trim()} aria-label={t.add} title={t.add}><FaPlus aria-hidden="true" /> <span className="add-item__text">{t.add}</span></button>
          </form>
        </div>
      )}
    </section>
  )
}
