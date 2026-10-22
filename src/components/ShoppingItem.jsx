import { EMOJI_MAP } from '../data/catalog.js'
import { useI18n, productName } from '../lib/i18n.js'
import { isSexualHealthFood } from '../lib/shoppingList.js'
import { FaHeartPulse, FaMinus, FaPlus, FaXmark, GiBasket } from './icons.jsx'

export default function ShoppingItem({ categoryId, item, inBasket = false, onToggle, onDelete, onQuantity }) {
  const controlId = `item-${categoryId}-${item.id}`
  const isHighlighted = isSexualHealthFood(item.name)
  const { lang, t } = useI18n()
  const label = productName(item.name, lang)
  const emoji = EMOJI_MAP[item.name]

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
        title={isHighlighted ? t.healthTitle : undefined}
      >
        <span className="item__emoji" aria-hidden="true">{emoji ?? <GiBasket />}</span>
        {label}
        {isHighlighted && <span className="item__health-marker" role="img" aria-label={t.healthLabel}><FaHeartPulse /></span>}
      </label>

      {inBasket ? (
        <div className="quantity" aria-label={t.qty(label)}>
          <button className="quantity__button" type="button" onClick={() => onQuantity(categoryId, item.id, -1)} aria-label={t.less(label)} disabled={item.qty <= 1}><FaMinus aria-hidden="true" /></button>
          <output className="quantity__value" aria-live="polite">{item.qty}</output>
          <button className="quantity__button" type="button" onClick={() => onQuantity(categoryId, item.id, 1)} aria-label={t.more(label)}><FaPlus aria-hidden="true" /></button>
        </div>
      ) : (
        <button className="item__delete" type="button" onClick={() => onDelete(categoryId, item.id)} aria-label={t.remove(label)} title={t.remove(label)}><FaXmark aria-hidden="true" /></button>
      )}
    </div>
  )
}
