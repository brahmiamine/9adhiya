import { useI18n } from '../lib/i18n.js'
import ShoppingItem from './ShoppingItem.jsx'

export default function BasketView({ checkedItems, onQuantity, onClear, onShare, onBack }) {
  const { t } = useI18n()
  if (checkedItems.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state__tile" aria-hidden="true">🧺</span>
        <h2>{t.basketEmpty}</h2>
        <p>{t.basketHint}</p>
        <button className="button button--primary" type="button" onClick={onBack}>{t.backToListShort}</button>
      </div>
    )
  }

  return (
    <>
      <h2 className="basket-title">{t.basketTitle} <span>({checkedItems.length})</span></h2>
      <section className="basket" aria-label={t.basketLabel}>
        {checkedItems.map(({ category, item }) => (
          <ShoppingItem key={`${category.id}-${item.id}`} categoryId={category.id} item={item} inBasket onQuantity={onQuantity} />
        ))}
      </section>
      <div className="bottom-bar">
        <button className="button button--danger" type="button" onClick={onClear}>{t.clear}</button>
        <button className="button button--share" type="button" onClick={onShare}>{t.share}</button>
      </div>
    </>
  )
}
