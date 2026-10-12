import { MapPin, Search, ShieldCheck } from 'lucide-react'
import Reveal from './Reveal'
import SectionHeading from './SectionHeading'
import { content } from '../data/content'
import { useLanguage } from '../i18n/LanguageContext'

// Local-search section: names the villages patients come from and the phrases they search,
// so Google can match "eye clinic near me" searches around Dindori to this page.
export default function ServiceArea() {
  const { t } = useLanguage()
  const s = content.serviceArea

  return (
    <section id="near-you" aria-labelledby="near-you-title" className="section bg-accent-soft/40">
      <div className="container-page grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div>
          <SectionHeading id="near-you-title" eyebrow={t(s.eyebrow)} title={t(s.title)} intro={t(s.body)} align="left" />
          <Reveal>
            <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-500 uppercase">
              <MapPin className="size-4 text-accent" aria-hidden="true" />
              {t(s.areasLabel)}
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {s.areas.map((a) => (
                <li key={a.en} className="rounded-full border border-accent/20 bg-white px-3.5 py-1.5 text-sm font-semibold text-navy-800">
                  {t(a)}
                </li>
              ))}
            </ul>
            <p className="mt-6 flex gap-2 text-sm text-slate-600">
              <Search className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              {t(s.searches)}
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.05} className="card border-accent/20 p-5 sm:p-6">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <ShieldCheck className="size-6 text-accent" aria-hidden="true" />
            {t(s.safetyTitle)}
          </h3>
          <ul className="mt-4 grid gap-3">
            {s.safety.map((item) => (
              <li key={item.en} className="flex items-start gap-3 text-navy-900">
                <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                {t(item)}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
