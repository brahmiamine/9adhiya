import ShoppingItem from './ShoppingItem.jsx'

export default function BasketView({ checkedItems, onToggleItem, onQuantity, onClear, onShare }) {
  if (checkedItems.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state__icon" aria-hidden="true">🧺</span>
        <h2>قفتك فارغة</h2>
        <p>ارجع للقائمة الكاملة و اختار اللي حاجتك فيه</p>
      </div>
    )
  }

  return (
    <>
      <div className="basket-actions">
        <button className="button button--secondary" type="button" onClick={onShare}>شارك القفة <span aria-hidden="true">📤</span></button>
        <button className="button button--danger" type="button" onClick={onClear}>فرّغ القفة <span aria-hidden="true">🗑</span></button>
      </div>
      <section className="basket" aria-label="الحوايج اللي في القفة">
        {checkedItems.map(({ category, item }) => (
          <ShoppingItem key={`${category.id}-${item.id}`} categoryId={category.id} item={item} inBasket onToggle={onToggleItem} onQuantity={onQuantity} />
        ))}
      </section>
    </>
  )
}
