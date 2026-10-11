import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'purva-lang'
const LanguageContext = createContext(null)

function readStoredLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'en' || stored === 'mr' ? stored : 'mr'
  } catch {
    return 'mr'
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang)

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // Storage may be unavailable (private mode); language still works for this visit.
    }
  }, [lang])

  const setLang = useCallback((next) => setLangState(next === 'en' ? 'en' : 'mr'), [])

  // t({ mr, en }) picks the string for the active language.
  const t = useCallback((entry) => (entry == null ? '' : typeof entry === 'string' ? entry : entry[lang] ?? entry.mr), [lang])

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}
