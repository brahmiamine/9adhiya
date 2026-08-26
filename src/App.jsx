import { useEffect, useMemo, useState } from 'react'
import BasketView from './components/BasketView.jsx'
import CategoryCard from './components/CategoryCard.jsx'
import { STORAGE_KEY, buildShareText, countChecked, createItem, getCheckedItems, loadData, searchCategories } from './lib/shoppingList.js'

function readInitialData() {
  try {
    return loadData(typeof window === 'undefined' ? null : window.localStorage).data
  } catch {
    return loadData(null).data
  }
}

export default function App() {
  const [data, setData] = useState(readInitialData)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [status, setStatus] = useState('')

  const checkedCount = useMemo(() => countChecked(data), [data])
  const checkedItems = useMemo(() => getCheckedItems(data), [data])
  const visibleCategories = useMemo(() => searchCategories(data, searchQuery), [data, searchQuery])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      setStatus('ما نجمتش نحفظ القائمة على الجهاز')
    }
  }, [data])

  useEffect(() => {
    if (!status) return undefined
    const timeout = window.setTimeout(() => setStatus(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [status])

  function updateItem(categoryId, itemId, updater) {
    setData((current) => current.map((category) => category.id !== categoryId
      ? category
      : { ...category, items: category.items.map((item) => item.id === itemId ? updater(item) : item) }))
  }

  function toggleItem(categoryId, itemId) {
    updateItem(categoryId, itemId, (item) => ({ ...item, checked: !item.checked }))
  }

  function changeQuantity(categoryId, itemId, amount) {
    updateItem(categoryId, itemId, (item) => ({ ...item, qty: Math.max(1, item.qty + amount) }))
  }

  function toggleCategory(categoryId) {
    if (searchQuery.trim()) return
    setData((current) => current.map((category) => category.id === categoryId ? { ...category, collapsed: !category.collapsed } : category))
  }

  function addItem(categoryId, name) {
    setData((current) => current.map((category) => category.id === categoryId ? { ...category, items: [...category.items, createItem(name)] } : category))
    setStatus(`${name} تزيدت للقائمة`)
  }

  function deleteItem(categoryId, itemId) {
    setData((current) => current.map((category) => category.id === categoryId
      ? { ...category, items: category.items.filter((item) => item.id !== itemId) }
      : category))
  }

  function clearBasket() {
    setData((current) => current.map((category) => ({
      ...category,
      items: category.items.map((item) => ({ ...item, checked: false, qty: 1 })),
    })))
    setStatus('القفة تفرغت')
  }

  async function shareBasket() {
    const text = buildShareText(checkedItems)
    if (navigator.share) {
      try {
        await navigator.share({ text, title: 'قفتي للتسوق' })
        setStatus('القفة تبعثت')
        return
      } catch (error) {
        if (error.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      setStatus('القائمة تنسخت، تنجم تلصقها و تبعثها لصاحبك')
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
      setStatus('حلّينا واتساب باش تبعث القفة')
    }
  }

  function handleTabKey(event) {
    const nextTab = event.key === 'ArrowLeft' || event.key === 'End'
      ? 'basket'
      : event.key === 'ArrowRight' || event.key === 'Home'
        ? 'all'
        : null
    if (!nextTab) return
    event.preventDefault()
    setActiveTab(nextTab)
    document.getElementById(`tab-${nextTab}`)?.focus()
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="brand-line"><span aria-hidden="true">🧺</span> قفتي للتسوق</div>
          <h1>قائمة الشراء</h1>
          <p>اختار اللي حاجتك فيه من القائمة، اعمل قفتك، و روح تسوق. القائمة تبقى عندك للمرة الجاية.</p>

          <label className="search">
            <span className="sr-only">ابحث في القائمة</span>
            <span className="search__icon" aria-hidden="true">⌕</span>
            <input type="search" value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); if (activeTab !== 'all') setActiveTab('all') }} placeholder="ابحث عن حاجة..." />
          </label>

          <div className="tabs" role="tablist" aria-label="اختار العرض" onKeyDown={handleTabKey}>
            <button id="tab-all" className={`tab${activeTab === 'all' ? ' tab--active' : ''}`} type="button" role="tab" aria-selected={activeTab === 'all'} aria-controls="shopping-panel" onClick={() => setActiveTab('all')}>القائمة الكاملة</button>
            <button id="tab-basket" className={`tab${activeTab === 'basket' ? ' tab--active' : ''}`} type="button" role="tab" aria-selected={activeTab === 'basket'} aria-controls="shopping-panel" onClick={() => setActiveTab('basket')}>قفتي <span className="tab__count">{checkedCount}</span></button>
          </div>
        </div>
      </header>

      <main className="content" id="shopping-panel" role="tabpanel" tabIndex="0" aria-labelledby={activeTab === 'all' ? 'tab-all' : 'tab-basket'}>
        {activeTab === 'all' ? (
          visibleCategories.length > 0 ? visibleCategories.map(({ category, items, forceOpen }) => (
            <CategoryCard key={category.id} category={category} items={items} forceOpen={forceOpen} onToggleCategory={toggleCategory} onToggleItem={toggleItem} onDeleteItem={deleteItem} onAddItem={addItem} />
          )) : (
            <div className="empty-state"><span className="empty-state__icon" aria-hidden="true">⌕</span><h2>ما لقيتش حاجة</h2><p>جرب كلمة أخرى</p></div>
          )
        ) : (
          <BasketView checkedItems={checkedItems} onToggleItem={toggleItem} onQuantity={changeQuantity} onClear={clearBasket} onShare={shareBasket} />
        )}
      </main>

      {status && <div className="status" role="status" aria-live="polite">{status}</div>}

      <footer className="bottom-bar">
        <div className="bottom-bar__inner">
          <div>في القفة: <strong>{checkedCount}</strong> حاجة</div>
          <button type="button" onClick={clearBasket}>قفة جديدة</button>
        </div>
      </footer>
    </div>
  )
}
