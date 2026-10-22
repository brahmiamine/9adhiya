import { createContext, useContext } from 'react'
import { CATEGORY_FR, PRODUCT_FR, UI } from '../data/translations.js'

export const LANG_KEY = 'qaimat-shira-lang'
export const I18nContext = createContext({ lang: 'ar', t: UI.ar })

export const useI18n = () => useContext(I18nContext)

export function readLang(storage) {
  try {
    return storage?.getItem(LANG_KEY) === 'fr' ? 'fr' : 'ar'
  } catch {
    return 'ar'
  }
}

export const productName = (name, lang) => (lang === 'fr' && PRODUCT_FR[name]) || name
export const categoryName = (category, lang) => (lang === 'fr' && CATEGORY_FR[category.id]) || category.name
