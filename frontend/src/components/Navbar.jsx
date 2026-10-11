import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarCheck, Menu, Phone, X } from 'lucide-react'
import Logo from './Logo'
import { content } from '../data/content'
import { telLink } from '../data/clinic'
import { useLanguage } from '../i18n/LanguageContext'

function LanguageToggle({ className = '' }) {
  const { lang, setLang, t } = useLanguage()
  const options = [
    { id: 'mr', label: 'मराठी' },
    { id: 'en', label: 'English' },
  ]
  return (
    <div role="group" aria-label={t(content.nav.langLabel)} className={`inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 ${className}`}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          lang={o.id}
          aria-pressed={lang === o.id}
          onClick={() => setLang(o.id)}
          className={`min-h-9 rounded-full px-3 text-sm font-semibold transition-colors ${
            lang === o.id ? 'bg-navy-700 text-white shadow-sm' : 'text-navy-700 hover:bg-white'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function Navbar() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const toggleRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    const onResize = () => window.innerWidth >= 1024 && setOpen(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-white/95 backdrop-blur transition-shadow ${
        scrolled ? 'border-slate-200 shadow-sm' : 'border-transparent'
      }`}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-navy-700 focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      {/* Phones/tablets: logo + menu button. Laptops 1024–1279px: two rows (actions on top, links below). 1280px+: one row. */}
      <nav className="container-page flex h-[4.5rem] flex-wrap items-center justify-between gap-x-3 lg:h-auto lg:pt-2 xl:h-[4.5rem] xl:flex-nowrap xl:pt-0" aria-label="Main">
        <Logo />

        <ul className="hidden items-center lg:order-last lg:mt-2 lg:flex lg:w-full lg:justify-center lg:gap-2 lg:border-t lg:border-slate-100 lg:py-1.5 xl:order-none xl:mt-0 xl:w-auto xl:justify-start xl:gap-0 xl:border-0 xl:py-0 2xl:gap-1">
          {content.nav.links.map((l) => (
            <li key={l.id}>
              <a href={`#${l.id}`} className="rounded-lg px-2.5 py-2 text-[0.95rem] font-medium whitespace-nowrap text-slate-700 transition-colors hover:bg-navy-50 hover:text-navy-800">
                {t(l)}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageToggle />
          <a href={telLink()} aria-label={t(content.nav.call)} className="btn btn-outline min-h-10 px-4 text-sm whitespace-nowrap xl:px-3 2xl:px-4">
            <Phone className="size-4" aria-hidden="true" />
            <span className="xl:hidden 2xl:inline">{t(content.nav.call)}</span>
          </a>
          <a href="#appointment" className="btn btn-red min-h-10 px-4 text-sm whitespace-nowrap">
            <CalendarCheck className="size-4" aria-hidden="true" />
            {t(content.nav.book)}
          </a>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <a href={telLink()} className="hidden size-11 items-center justify-center rounded-full bg-navy-700 text-white md:flex" aria-label={t(content.nav.call)}>
            <Phone className="size-5" aria-hidden="true" />
          </a>
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={t(content.nav.menu)}
            className="flex size-11 items-center justify-center rounded-full border border-slate-200 text-navy-800"
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-200 bg-white lg:hidden"
          >
            <div className="container-page py-4">
              <ul className="grid gap-1">
                {content.nav.links.map((l) => (
                  <li key={l.id}>
                    <a href={`#${l.id}`} onClick={close} className="block rounded-xl px-4 py-3 text-lg font-medium text-navy-900 hover:bg-navy-50">
                      {t(l)}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4">
                <LanguageToggle className="self-start" />
                <a href="#appointment" onClick={close} className="btn btn-red w-full">
                  <CalendarCheck className="size-5" aria-hidden="true" />
                  {t(content.nav.book)}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
