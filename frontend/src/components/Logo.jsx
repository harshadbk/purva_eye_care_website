import { clinic } from '../data/clinic'
import { useLanguage } from '../i18n/LanguageContext'

// Shows the clinic name in full: active language first, the other language below.
export default function Logo({ inverted = false, showTagline = false }) {
  const { lang, t } = useLanguage()
  const other = lang === 'mr' ? 'en' : 'mr'
  return (
    <a href="#home" className="flex shrink-0 items-center gap-2 sm:gap-2.5" aria-label={`${t(clinic.name)}, ${t(clinic.tagline)}`}>
      <span className={`flex h-10 w-11 shrink-0 items-center sm:h-11 sm:w-14 justify-center rounded-xl ${inverted ? 'bg-white p-1.5' : ''}`}>
        <img src="/images/clinic-mark.png" alt="" width="240" height="110" className="h-auto w-full" />
      </span>
      <span className="leading-tight whitespace-nowrap">
        <span className={`block text-base font-bold min-[400px]:text-lg sm:text-xl ${inverted ? 'text-white' : 'text-accent'}`}>{clinic.name[lang]}</span>
        <span lang={other} className={`block text-xs font-semibold min-[400px]:text-[0.8rem] sm:text-sm ${inverted ? 'text-navy-100' : 'text-navy-700'}`}>
          {clinic.name[other]}
        </span>
        {showTagline && <span className={`block text-xs ${inverted ? 'text-navy-200' : 'text-slate-500'}`}>{t(clinic.tagline)}</span>}
      </span>
    </a>
  )
}
