import { formatItemName, isSexualHealthFood } from '../lib/shoppingList.js'

export default function ShoppingItem({ categoryId, item, inBasket = false, onToggle, onDelete, onQuantity }) {
  const controlId = `item-${categoryId}-${item.id}`
  const isHighlighted = isSexualHealthFood(item.name)

  return (
    <div className="item">
      <input
        className="item__check"
        id={controlId}
        type="checkbox"
        checked={item.checked}
        onChange={() => onToggle(categoryId, item.id)}
      />
      <label
        className={`item__name${isHighlighted ? ' item__name--sexual-health' : ''}`}
        htmlFor={controlId}
        title={isHighlighted ? 'مفيد للصحة الجنسية والدورة الدموية ضمن غذاء متوازن' : undefined}
      >
        {formatItemName(item.name)}
        {isHighlighted && <span className="item__health-marker" aria-label="مفيد للصحة الجنسية">★</span>}
      </label>

      {inBasket ? (
        <div className="quantity" aria-label={`كمية ${item.name}`}>
          <button className="quantity__button" type="button" onClick={() => onQuantity(categoryId, item.id, -1)} aria-label={`نقص من كمية ${item.name}`} disabled={item.qty <= 1}>−</button>
          <output className="quantity__value" aria-live="polite">{item.qty}</output>
          <button className="quantity__button" type="button" onClick={() => onQuantity(categoryId, item.id, 1)} aria-label={`زيد في كمية ${item.name}`}>+</button>
        </div>
      ) : (
        <button className="item__delete" type="button" onClick={() => onDelete(categoryId, item.id)} aria-label={`انحي ${item.name} من القائمة`} title={`انحي ${item.name}`}>×</button>
      )}
    </div>
  )
}
