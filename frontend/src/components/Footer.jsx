import { MapPin, Phone } from 'lucide-react'
import Logo from './Logo'
import { content } from '../data/content'
import { clinic, telLink } from '../data/clinic'
import { useLanguage } from '../i18n/LanguageContext'

export default function Footer() {
  const { t } = useLanguage()
  const f = content.footer
  const o = clinic.optometrist
  const year = new Date().getFullYear()

  return (
    <footer className="bg-navy-950 pb-24 text-navy-100 md:pb-0">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_1.2fr]">
        <div>
          <Logo inverted showTagline />
          <p className="mt-5 text-sm">
            <span className="font-semibold text-white">{o.name}</span>, {o.qualification}
            <br />
            {t(o.role)} · {o.affiliation}
          </p>
        </div>

        <nav aria-label={t(f.quickLinks)}>
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">{t(f.quickLinks)}</h2>
          <ul className="mt-4 grid gap-1">
            {content.nav.links.map((l) => (
              <li key={l.id}>
                <a href={`#${l.id}`} className="inline-flex min-h-9 items-center text-sm hover:text-white hover:underline">
                  {t(l)}
                </a>
              </li>
            ))}
            <li>
              <a href="#appointment" className="inline-flex min-h-9 items-center text-sm hover:text-white hover:underline">
                {t(content.nav.book)}
              </a>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">{t(f.reach)}</h2>
          <ul className="mt-4 grid gap-3 text-sm">
            {clinic.phones.map((p) => (
              <li key={p.tel}>
                <a href={telLink(p)} className="inline-flex min-h-9 items-center gap-2 font-semibold text-white hover:underline">
                  <Phone className="size-4" aria-hidden="true" />
                  {p.display}
                </a>
              </li>
            ))}
            <li className="flex gap-2">
              <MapPin className="mt-1 size-4 shrink-0" aria-hidden="true" />
              <address className="not-italic">{t(clinic.address)}</address>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-6 text-xs leading-relaxed text-navy-200">
          <p>{t(f.disclaimer)}</p>
          <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:justify-between">
            <p>
              © {year} {t(clinic.name)}. {t(f.rights)}
            </p>
            <p>
              {t(f.developedBy)} <span className="font-semibold text-white">{t(f.developer)}</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
