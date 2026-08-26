import { useState } from 'react'
import ShoppingItem from './ShoppingItem.jsx'

export default function CategoryCard({ category, items, forceOpen, onToggleCategory, onToggleItem, onDeleteItem, onAddItem }) {
  const [newItem, setNewItem] = useState('')
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
        <span className="category__name" id={`${panelId}-title`}><span className="category__marker" aria-hidden="true" />{category.name}</span>
        <span className="category__meta"><span>{checkedCount}/{category.items.length}</span><span className="category__chevron" aria-hidden="true">⌄</span></span>
      </button>

      {isOpen && (
        <div className="category__body" id={`${panelId}-body`}>
          {items.map((item) => (
            <ShoppingItem key={item.id} categoryId={category.id} item={item} onToggle={onToggleItem} onDelete={onDeleteItem} />
          ))}
          <form className="add-item" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor={`${panelId}-new-item`}>زيد حاجة في {category.name}</label>
            <input id={`${panelId}-new-item`} value={newItem} onChange={(event) => setNewItem(event.target.value)} placeholder="زيد حاجة..." autoComplete="off" />
            <button type="submit" disabled={!newItem.trim()}>زيد</button>
          </form>
        </div>
      )}
    </section>
  )
}
