import { motion } from 'framer-motion'
import { ArrowRight, CalendarCheck, Glasses, HeartHandshake, MapPin, Phone, ScanEye, UserRound } from 'lucide-react'
import { content } from '../data/content'
import { clinic, telLink } from '../data/clinic'
import { useLanguage } from '../i18n/LanguageContext'

const trustIcons = [ScanEye, Glasses, UserRound]

export default function Hero() {
  const { lang, t } = useLanguage()
  const h = content.hero

  return (
    <section id="home" aria-labelledby="hero-title" className="relative overflow-hidden bg-gradient-to-b from-navy-50/70 to-white">
      <div className="container-page grid items-center gap-10 pt-10 pb-16 sm:pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:pt-20 lg:pb-24">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: 'easeOut' }}>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-navy-700 shadow-card">
            <span className="size-2 rounded-full bg-brand-red" aria-hidden="true" />
            {t(clinic.tagline)} · {t(h.eyebrow)}
          </p>

          <h1 id="hero-title" lang="mr" className="text-[1.95rem] font-bold sm:text-4xl lg:text-[2.75rem]">
            तुमच्या डोळ्यांची काळजी, <span className="text-brand-red">आमची जबाबदारी</span>
          </h1>
          {lang === 'en' && <p className="sr-only">{h.title.en}</p>}

          <p lang="en" className="mt-3 text-lg font-semibold text-teal-700 sm:text-xl">
            {h.subtitle}
          </p>

          <p className="mt-5 max-w-xl text-base text-slate-600 sm:text-lg">{t(h.body)}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#appointment" className="btn btn-red px-6">
              <CalendarCheck className="size-5" aria-hidden="true" />
              {t(h.primary)}
            </a>
            <a href={telLink()} className="btn btn-outline px-6">
              <Phone className="size-5" aria-hidden="true" />
              {t(h.secondary)} · {clinic.phones[0].display}
            </a>
          </div>

          <a
            href="#cataract"
            className="group mt-6 flex items-center gap-3 rounded-2xl border border-brand-red/25 bg-brand-red-soft px-4 py-3 transition-colors hover:border-brand-red/50"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-red text-white">
              <HeartHandshake className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold tracking-wide text-brand-red uppercase">{t(content.cataractCare.badge)}</span>
              <span className="block text-sm font-semibold text-navy-900 sm:text-base">{t(content.cataractCare.heroLine)}</span>
            </span>
            <ArrowRight className="size-5 shrink-0 text-brand-red transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </a>

          <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
            <MapPin className="size-4 shrink-0 text-brand-red" aria-hidden="true" />
            <span className="font-medium text-navy-900">{t(content.findUs.heroLine)}</span>
            <a href={clinic.directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center font-semibold text-teal-700 underline-offset-2 hover:underline">
              {t(content.findUs.heroLink)} →
            </a>
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-3">
            {h.trust.map((item, i) => {
              const Icon = trustIcons[i]
              return (
                <li key={item.en} className="flex items-center gap-3 rounded-xl bg-white/80 px-3 py-2.5 shadow-card">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-navy-900">{t(item)}</span>
                </li>
              )
            })}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className="relative mx-auto w-full max-w-md lg:max-w-none"
        >
          <div className="absolute -top-6 -right-6 hidden size-40 rounded-full bg-teal-100/70 blur-2xl sm:block" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-[1.75rem] border-4 border-white shadow-lift">
            <img
              src="/images/eye-examination.jpg"
              alt={t(h.imageAlt)}
              width="800"
              height="1423"
              fetchPriority="high"
              className="aspect-[4/5] w-full object-cover object-[50%_35%]"
            />
          </div>

          <div className="card absolute -bottom-5 left-4 flex items-center gap-3 px-4 py-3 sm:-left-6">
            <img src="/images/clinic-mark.png" alt="" width="240" height="110" className="h-8 w-auto" />
            <div className="leading-tight">
              <p className="text-sm font-bold text-navy-900">{clinic.optometrist.name}</p>
              <p className="text-xs text-slate-600">
                {clinic.optometrist.qualification} · {t(clinic.optometrist.role)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
