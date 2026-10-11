import { BadgeCheck, Building2, GraduationCap, HeartHandshake } from 'lucide-react'
import Reveal from './Reveal'
import SectionHeading from './SectionHeading'
import { content } from '../data/content'
import { clinic } from '../data/clinic'
import { useLanguage } from '../i18n/LanguageContext'

export default function About() {
  const { t } = useLanguage()
  const a = content.about
  const o = clinic.optometrist

  return (
    <section id="about" aria-labelledby="about-title" className="section">
      <div className="container-page grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <Reveal className="mx-auto w-full max-w-sm">
          <div className="relative">
            <div className="overflow-hidden rounded-[1.75rem] border-4 border-white shadow-lift">
              <img
                src="/images/clinic-board.jpg"
                alt={t(a.boardAlt)}
                width="720"
                height="1281"
                loading="lazy"
                decoding="async"
                className="aspect-[4/5] w-full object-cover object-top"
              />
            </div>
            <div className="absolute -right-2 -bottom-4 rounded-2xl bg-navy-700 px-4 py-3 text-white shadow-lift sm:-right-8">
              <p className="text-sm font-semibold">{t(clinic.motto)}</p>
            </div>
          </div>
          <figure className="card mt-10 overflow-hidden">
            <img
              src="/images/eye-exam-in-progress.jpg"
              alt={t(a.examAlt)}
              width="308"
              height="158"
              loading="lazy"
              decoding="async"
              className="aspect-[308/158] w-full object-cover"
            />
            <figcaption className="px-4 py-2.5 text-sm font-medium text-navy-900">{t(a.examCaption)}</figcaption>
          </figure>
        </Reveal>

        <div>
          <SectionHeading id="about-title" eyebrow={t(a.eyebrow)} title={t(a.title)} align="left" />
          <Reveal className="space-y-4 text-base text-slate-600 sm:text-lg">
            {a.body.map((p) => (
              <p key={p.en}>{t(p)}</p>
            ))}
          </Reveal>

          <Reveal as="ul" delay={0.05} className="mt-6 grid gap-2 sm:grid-cols-3">
            {a.points.map((p) => (
              <li key={p.en} className="flex items-start gap-2 text-sm font-medium text-navy-900">
                <HeartHandshake className="mt-1 size-4 shrink-0 text-teal-600" aria-hidden="true" />
                {t(p)}
              </li>
            ))}
          </Reveal>

          <Reveal delay={0.1} className="card mt-8 p-5 sm:p-6">
            <p className="text-xs font-semibold tracking-wide text-teal-700 uppercase">{t(a.optometristLabel)}</p>
            <h3 className="mt-1 text-xl font-bold">{o.name}</h3>
            <ul className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <li className="flex items-center gap-2">
                <GraduationCap className="size-5 shrink-0 text-navy-700" aria-hidden="true" />
                {o.qualification}
              </li>
              <li className="flex items-center gap-2">
                <BadgeCheck className="size-5 shrink-0 text-navy-700" aria-hidden="true" />
                {t(o.role)}
              </li>
              <li className="flex items-center gap-2">
                <Building2 className="size-5 shrink-0 text-navy-700" aria-hidden="true" />
                {o.affiliation}
              </li>
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
