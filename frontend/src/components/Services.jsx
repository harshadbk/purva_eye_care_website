import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import SectionHeading from './SectionHeading'
import { content } from '../data/content'
import { services } from '../data/services'
import { useLanguage } from '../i18n/LanguageContext'

export default function Services({ onSelect }) {
  const { lang, t } = useLanguage()
  const s = content.services
  // Each card also shows its title in the other language, so it reads bilingually.
  const other = lang === 'mr' ? 'en' : 'mr'

  return (
    <section id="services" aria-labelledby="services-title" className="section bg-slate-50">
      <div className="container-page">
        <SectionHeading id="services-title" eyebrow={t(s.eyebrow)} title={t(s.title)} intro={t(s.intro)} />

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((svc, i) => {
            const Icon = svc.icon
            return (
              <motion.li
                key={svc.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: (i % 4) * 0.06 }}
                className="card group flex flex-col p-5 transition-shadow duration-300 hover:shadow-lift"
              >
                <span className="flex size-12 items-center justify-center rounded-xl bg-navy-50 text-navy-700 transition-colors group-hover:bg-navy-700 group-hover:text-white">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{t(svc.title)}</h3>
                <p lang={other} className="mt-0.5 text-sm font-medium text-teal-700">
                  {svc.title[other]}
                </p>
                <p className="mt-3 flex-1 text-[0.95rem] text-slate-600">{t(svc.desc)}</p>
                <a
                  href="#appointment"
                  onClick={() => onSelect(svc.id)}
                  className="mt-5 inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-brand-red hover:underline"
                >
                  {t(s.cta)}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  <span className="sr-only">: {t(svc.title)}</span>
                </a>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
