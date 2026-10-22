import { useEffect, useMemo, useRef, useState } from 'react'
import BasketView from './components/BasketView.jsx'
import CategoryCard from './components/CategoryCard.jsx'
import { GiBasket } from './components/icons.jsx'
import { LANG_KEY, I18nContext, productName, readLang } from './lib/i18n.js'
import { UI } from './data/translations.js'
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

function BasketIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9h16l-1.4 10H5.4L4 9Z" />
      <path d="m8 9 4-5 4 5M9 13v3m6-3v3" />
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

  const checkedCount = useMemo(() => countChecked(data), [data])
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
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

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

  function toggleBasket() {
    setActiveView((view) => view === 'basket' ? 'list' : 'basket')
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
        <div className="app-header__inner">
          <div className="app-header__row">
            <h1>
              <button className="app-title" type="button" onClick={showList} aria-label={t.backToList}>
                <GiBasket className="app-title__icon" aria-hidden="true" /> {t.appTitle}
              </button>
            </h1>
            <div className="header-actions">
              <button className="header-action header-action--lang" type="button" lang={lang === 'ar' ? 'fr' : 'ar'} aria-label={t.languageLabel} onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}>{t.language}</button>
              <button className={`header-action${searchOpen ? ' header-action--active' : ''}`} type="button" aria-label={searchOpen ? t.closeSearch : t.openSearch} aria-controls="search-panel" aria-expanded={searchOpen} onClick={toggleSearch}>
                <SearchIcon />
              </button>
              <button className={`header-action${activeView === 'basket' ? ' header-action--active' : ''}`} type="button" aria-label={activeView === 'basket' ? t.backToListShort : checkedCount > 0 ? t.viewBasketCount(checkedCount) : t.viewBasket} aria-controls="shopping-panel" aria-pressed={activeView === 'basket'} onClick={toggleBasket}>
                <BasketIcon />
                {checkedCount > 0 && <span className="header-action__count" aria-hidden="true">{checkedCount}</span>}
              </button>
            </div>
          </div>

          {searchOpen && (
            <label className="search" id="search-panel">
              <span className="sr-only">{t.openSearch}</span>
              <span className="search__icon" aria-hidden="true"><SearchIcon /></span>
              <input ref={searchInputRef} type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={t.searchPlaceholder} />
            </label>
          )}
        </div>
      </header>

      <main className="content" id="shopping-panel">
        {activeView === 'list' ? (
          visibleCategories.length > 0 ? visibleCategories.map(({ category, items, forceOpen }) => (
            <CategoryCard key={category.id} category={category} items={items} forceOpen={forceOpen} onToggleCategory={toggleCategory} onToggleItem={toggleItem} onDeleteItem={deleteItem} onAddItem={addItem} />
          )) : (
            <div className="empty-state"><span className="empty-state__icon" aria-hidden="true"><SearchIcon /></span><h2>{t.noResult}</h2><p>{t.tryOther}</p></div>
          )
        ) : (
          <BasketView checkedItems={checkedItems} onToggleItem={toggleItem} onQuantity={changeQuantity} onClear={clearBasket} onShare={shareBasket} />
        )}
      </main>

      {status && <div className="status" role="status" aria-live="polite">{status}</div>}
    </div>
    </I18nContext.Provider>
  )
}
