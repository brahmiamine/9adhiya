import { EMOJI_MAP } from '../data/catalog.js'
import { useI18n, productName } from '../lib/i18n.js'
import { isSexualHealthFood } from '../lib/shoppingList.js'
import { FaHeartPulse, GiBasket } from './icons.jsx'

export default function ShoppingItem({ categoryId, item, inBasket = false, onToggle, onDelete, onQuantity }) {
  const controlId = `item-${categoryId}-${item.id}`
  const isHighlighted = isSexualHealthFood(item.name)
  const { lang, t } = useI18n()
  const label = productName(item.name, lang)
  const emoji = EMOJI_MAP[item.name]

  const content = (
    <>
      <span className="item__emoji" aria-hidden="true">{emoji ?? <GiBasket />}</span>
      <span className={`item__name${isHighlighted ? ' item__name--sexual-health' : ''}`} title={isHighlighted ? t.healthTitle : undefined}>
        {label}
        {isHighlighted && <span className="item__health-marker" role="img" aria-label={t.healthLabel}><FaHeartPulse /></span>}
      </span>
    </>
  )

  if (inBasket) {
    return (
      <div className="item item--basket">
        <span className="item__main">{content}</span>
        <div className="quantity" role="group" aria-label={t.qty(label)}>
          <button className="quantity__button" type="button" onClick={() => onQuantity(categoryId, item.id, -1)} aria-label={t.less(label)} disabled={item.qty <= 1}>−</button>
          <output className="quantity__value" aria-live="polite">{item.qty}</output>
          <button className="quantity__button" type="button" onClick={() => onQuantity(categoryId, item.id, 1)} aria-label={t.more(label)}>+</button>
        </div>
      </div>
    )
  }

  return (
    <div className="item">
      <label className="item__main" htmlFor={controlId}>
        <input className="item__check" id={controlId} type="checkbox" checked={item.checked} onChange={() => onToggle(categoryId, item.id)} />
        {content}
      </label>
      <button className="item__delete" type="button" onClick={() => onDelete(categoryId, item.id)} aria-label={t.remove(label)} title={t.remove(label)}>×</button>
    </div>
  )
}
