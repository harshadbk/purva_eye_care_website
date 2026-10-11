import { motion } from 'framer-motion'
import { Glasses, MapPin, MessagesSquare, PhoneCall, Users } from 'lucide-react'
import SectionHeading from './SectionHeading'
import { content } from '../data/content'
import { useLanguage } from '../i18n/LanguageContext'

const icons = [MapPin, Users, Glasses, MessagesSquare, PhoneCall]

export default function WhyChooseUs() {
  const { t } = useLanguage()
  const w = content.why

  return (
    <section aria-labelledby="why-title" className="section bg-navy-900 text-navy-100">
      <div className="container-page">
        <SectionHeading id="why-title" eyebrow={t(w.eyebrow)} title={t(w.title)} dark />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {w.items.map((item, i) => {
            const Icon = icons[i]
            return (
              <motion.li
                key={item.title.en}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <Icon className="size-7 text-teal-100" aria-hidden="true" />
                <h3 className="mt-4 text-base font-bold text-white">{t(item.title)}</h3>
                <p className="mt-2 text-sm text-navy-100">{t(item.desc)}</p>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
