import { useI18n } from '../lib/i18n.js'
import { FaShareNodes, FaTrashCan, GiBasket } from './icons.jsx'
import ShoppingItem from './ShoppingItem.jsx'

export default function BasketView({ checkedItems, onToggleItem, onQuantity, onClear, onShare }) {
  const { t } = useI18n()
  if (checkedItems.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state__icon" aria-hidden="true"><GiBasket /></span>
        <h2>{t.basketEmpty}</h2>
        <p>{t.basketHint}</p>
      </div>
    )
  }

  return (
    <>
      <div className="basket-actions">
        <button className="button button--secondary" type="button" onClick={onShare}><FaShareNodes aria-hidden="true" /> {t.share}</button>
        <button className="button button--danger" type="button" onClick={onClear}><FaTrashCan aria-hidden="true" /> {t.clear}</button>
      </div>
      <section className="basket" aria-label={t.basketLabel}>
        {checkedItems.map(({ category, item }) => (
          <ShoppingItem key={`${category.id}-${item.id}`} categoryId={category.id} item={item} inBasket onToggle={onToggleItem} onQuantity={onQuantity} />
        ))}
      </section>
    </>
  )
}
