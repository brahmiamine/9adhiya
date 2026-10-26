import { useEffect, useMemo, useRef, useState } from 'react'
import BasketView from './components/BasketView.jsx'
import CategoryCard from './components/CategoryCard.jsx'
import { LANG_KEY, I18nContext, productName, readLang } from './lib/i18n.js'
import { UI } from './data/translations.js'
import { createSync } from './lib/sync.js'
import { STORAGE_KEY, buildShareText, countChecked, createItem, getCheckedItems, loadData, searchCategories } from './lib/shoppingList.js'

function readInitialData() {
  try {
    return loadData(typeof window === 'undefined' ? null : window.localStorage).data
  } catch {
    return loadData(null).data
  }
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  )
}

export default function App() {
  const [data, setData] = useState(readInitialData)
  const [activeView, setActiveView] = useState('list')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [status, setStatus] = useState('')
  const [lang, setLang] = useState(() => readLang(typeof window === 'undefined' ? null : window.localStorage))
  const t = UI[lang]
  const i18n = useMemo(() => ({ lang, t }), [lang, t])
  const searchInputRef = useRef(null)
  const dataRef = useRef(data)
  const syncRef = useRef(null)
  dataRef.current = data

  const checkedCount = useMemo(() => countChecked(data), [data])
  const totalCount = useMemo(() => data.reduce((total, category) => total + category.items.length, 0), [data])
  const progress = totalCount ? Math.round((checkedCount / totalCount) * 100) : 0
  const checkedItems = useMemo(() => getCheckedItems(data), [data])
  const visibleCategories = useMemo(() => searchCategories(data, searchQuery), [data, searchQuery])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.title = t.docTitle
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.description)
    try {
      window.localStorage.setItem(LANG_KEY, lang)
    } catch { /* language preference is optional */ }
  }, [lang, t])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      setStatus(t.saveError)
    }
    syncRef.current?.changed()
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  // La liste est partagée via le serveur (MariaDB) ; la copie locale reste utilisable hors connexion.
  useEffect(() => {
    const sync = createSync({
      getData: () => dataRef.current,
      setData: (next) => { dataRef.current = next; setData(next) },
    })
    syncRef.current = sync
    sync.start()
    return () => { sync.stop(); syncRef.current = null }
  }, [])

  useEffect(() => {
    if (!status) return undefined
    const timeout = window.setTimeout(() => setStatus(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [status])

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

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
    setStatus(t.added(productName(name, lang)))
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
    setStatus(t.cleared)
  }

  async function shareBasket() {
    const text = buildShareText(checkedItems, new Date(), lang)
    if (navigator.share) {
      try {
        await navigator.share({ text, title: t.appTitle })
        setStatus(t.sent)
        return
      } catch (error) {
        if (error.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      setStatus(t.copied)
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
      setStatus(t.whatsapp)
    }
  }

  function toggleSearch() {
    setActiveView('list')
    setSearchOpen((open) => {
      if (open) setSearchQuery('')
      return !open
    })
  }

  function showBasket() {
    setActiveView('basket')
    setSearchOpen(false)
    setSearchQuery('')
  }

  function showList() {
    setActiveView('list')
    setSearchOpen(false)
    setSearchQuery('')
  }

  return (
    <I18nContext.Provider value={i18n}>
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__row">
          <h1>
            <button className="app-title" type="button" onClick={showList} aria-label={t.backToList}>
              <span className="app-title__icon" aria-hidden="true">🧺</span><span>{t.appTitle}</span>
            </button>
          </h1>
          <div className="header-actions">
            <button className="header-action header-action--lang" type="button" lang={lang === 'ar' ? 'fr' : 'ar'} aria-label={t.languageLabel} onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}>{t.language}</button>
            <button className={`header-action${searchOpen ? ' header-action--active' : ''}`} type="button" aria-label={searchOpen ? t.closeSearch : t.openSearch} aria-controls="search-panel" aria-expanded={searchOpen} onClick={toggleSearch}>
              <SearchIcon />
            </button>
          </div>
        </div>

        {searchOpen && (
          <label className="search" id="search-panel">
            <span className="sr-only">{t.openSearch}</span>
            <input ref={searchInputRef} type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={t.searchPlaceholder} />
          </label>
        )}

        {activeView === 'list' && (
          <div className="progress">
            <div className="progress__labels"><span>{t.progress}</span><span className="progress__count">{checkedCount} / {totalCount}</span></div>
            <div className="progress__track" role="progressbar" aria-label={t.progressLabel(checkedCount, totalCount)} aria-valuemin={0} aria-valuemax={totalCount} aria-valuenow={checkedCount}>
              <div className="progress__bar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </header>

      <main className="content" id="shopping-panel">
        {activeView === 'list' ? (
          visibleCategories.length > 0 ? visibleCategories.map(({ category, items, forceOpen }) => (
            <CategoryCard key={category.id} category={category} items={items} forceOpen={forceOpen} onToggleCategory={toggleCategory} onToggleItem={toggleItem} onDeleteItem={deleteItem} onAddItem={addItem} />
          )) : (
            <div className="empty-state"><span className="empty-state__icon" aria-hidden="true">🔎</span><h2>{t.noResult}</h2><p>{t.tryOther}</p></div>
          )
        ) : (
          <BasketView checkedItems={checkedItems} onQuantity={changeQuantity} onClear={clearBasket} onShare={shareBasket} onBack={showList} />
        )}
      </main>

      {activeView === 'list' && (
        <div className="fab-wrap">
          <button className="fab" type="button" aria-label={checkedCount > 0 ? t.viewBasketCount(checkedCount) : t.viewBasket} onClick={showBasket}>
            <span className="fab__icon" aria-hidden="true">🧺</span>
            <span>{t.viewBasket}</span>
            <span className="fab__count" aria-hidden="true">{checkedCount}</span>
          </button>
        </div>
      )}

      {status && <div className="status" role="status" aria-live="polite">{status}</div>}
    </div>
    </I18nContext.Provider>
  )
}
