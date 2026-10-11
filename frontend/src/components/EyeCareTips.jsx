import { motion } from 'framer-motion'
import { ArrowRight, Lightbulb } from 'lucide-react'
import SectionHeading from './SectionHeading'
import { content } from '../data/content'
import { useLanguage } from '../i18n/LanguageContext'

export default function EyeCareTips({ onSelect }) {
  const { t } = useLanguage()
  const tp = content.tips

  return (
    <section id="tips" aria-labelledby="tips-title" className="section">
      <div className="container-page">
        <SectionHeading id="tips-title" eyebrow={t(tp.eyebrow)} title={t(tp.title)} intro={t(tp.intro)} />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tp.items.map((item, i) => (
            <motion.li
              key={item.title.en}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.06 }}
              className="flex flex-col rounded-2xl border border-teal-100 bg-teal-50/60 p-5"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-white text-teal-700 shadow-card">
                <Lightbulb className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-bold">{t(item.title)}</h3>
              <p className="mt-2 flex-1 text-[0.95rem] text-slate-600">{t(item.desc)}</p>
              <a
                href="#appointment"
                onClick={() => onSelect(item.service)}
                className="mt-4 inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-teal-700 hover:underline"
              >
                {t(tp.cta)}
                <ArrowRight className="size-4" aria-hidden="true" />
                <span className="sr-only">: {t(item.title)}</span>
              </a>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
