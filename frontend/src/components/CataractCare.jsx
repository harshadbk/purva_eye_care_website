import { CalendarCheck, HeartHandshake, Phone } from 'lucide-react'
import Reveal from './Reveal'
import SectionHeading from './SectionHeading'
import { content } from '../data/content'
import { telLink } from '../data/clinic'
import { useLanguage } from '../i18n/LanguageContext'

export default function CataractCare({ onSelect }) {
  const { t } = useLanguage()
  const c = content.cataractCare

  return (
    <section id="cataract" aria-labelledby="cataract-title" className="section bg-gradient-to-b from-white to-brand-red-soft/40">
      <div className="container-page grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
        <div>
          <SectionHeading id="cataract-title" eyebrow={t(c.eyebrow)} title={t(c.title)} align="left" />
          <Reveal>
            <p className="text-base text-slate-600 sm:text-lg">{t(c.body)}</p>

            <div className="mt-6 flex gap-4 rounded-2xl border-2 border-brand-red/25 bg-white p-5 shadow-card">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-red text-white">
                <HeartHandshake className="size-6" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-brand-red">{t(c.offerTitle)}</h3>
                <p className="mt-1 font-semibold text-navy-900">{t(c.offer)}</p>
                <p className="mt-1 text-sm text-slate-600">{t(c.offerNote)}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href="#appointment" onClick={() => onSelect('cataract')} className="btn btn-red whitespace-nowrap">
                <CalendarCheck className="size-5" aria-hidden="true" />
                {t(c.cta)}
              </a>
              <a href={telLink()} className="btn btn-outline whitespace-nowrap">
                <Phone className="size-5" aria-hidden="true" />
                {t(c.call)}
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.05}>
          <figure className="card overflow-hidden">
            <img
              src="/images/mics-phaco.jpg"
              alt={t(c.imageAlt)}
              width="1200"
              height="308"
              loading="lazy"
              decoding="async"
              className="w-full"
            />
            <figcaption className="flex items-center gap-2 border-t border-slate-100 px-5 py-3 text-sm font-semibold text-navy-900">
              <span className="size-2 rounded-full bg-brand-red" aria-hidden="true" />
              MICS Phaco · Micro Incision Cataract Surgery
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  )
}
