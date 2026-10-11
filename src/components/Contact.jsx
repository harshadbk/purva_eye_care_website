import { Clock, MapPin, MessageCircle, Navigation, Phone, Signpost } from 'lucide-react'
import Reveal from './Reveal'
import SectionHeading from './SectionHeading'
import { content } from '../data/content'
import { clinic, telLink, whatsappLink } from '../data/clinic'
import { useLanguage } from '../i18n/LanguageContext'

function InfoRow({ icon: Icon, title, children }) {
  return (
    <div className="flex gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">{title}</h3>
        <div className="mt-1 text-navy-900">{children}</div>
      </div>
    </div>
  )
}

export default function Contact() {
  const { t } = useLanguage()
  const c = content.contact
  const f = content.findUs

  return (
    <section id="contact" aria-labelledby="contact-title" className="section">
      <div className="container-page">
        <SectionHeading id="contact-title" eyebrow={t(c.eyebrow)} title={t(c.title)} />

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal className="card flex flex-col gap-6 p-5 sm:p-8">
            <InfoRow icon={Phone} title={t(c.phone)}>
              <ul className="flex flex-wrap gap-x-5 gap-y-1">
                {clinic.phones.map((p) => (
                  <li key={p.tel}>
                    <a href={telLink(p)} className="inline-flex min-h-11 items-center text-lg font-bold text-navy-800 hover:text-brand-red">
                      {p.display}
                    </a>
                  </li>
                ))}
              </ul>
            </InfoRow>

            <InfoRow icon={MessageCircle} title={t(c.whatsapp)}>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center font-semibold text-whatsapp hover:underline"
              >
                {t(c.whatsappCta)} · {clinic.phones[0].display}
              </a>
            </InfoRow>

            <InfoRow icon={MapPin} title={t(c.address)}>
              <address className="not-italic">{t(clinic.address)}</address>
            </InfoRow>

            <InfoRow icon={Clock} title={t(c.hours)}>
              <p>{clinic.hours ? t(clinic.hours) : t(c.hoursUnknown)}</p>
            </InfoRow>

            <img
              src="/images/visiting-card.jpg"
              alt={t(c.cardAlt)}
              width="1000"
              height="581"
              loading="lazy"
              decoding="async"
              className="w-full rounded-xl border border-slate-200"
            />

            <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row">
              <a href={clinic.directionsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <Navigation className="size-5" aria-hidden="true" />
                {t(c.directions)}
              </a>
              <a href={telLink()} className="btn btn-outline">
                <Phone className="size-5" aria-hidden="true" />
                {t(content.nav.call)}
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.05} className="flex flex-col gap-6">
            <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-5 sm:p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <Signpost className="size-5 text-teal-700" aria-hidden="true" />
                {t(f.title)}
              </h3>
              <ol className="mt-4 grid gap-3">
                {f.landmarks.map((l, i) => (
                  <li key={l.en} className="flex items-start gap-3 text-navy-900">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-navy-700 text-sm font-bold text-white">{i + 1}</span>
                    <span className="pt-0.5">{t(l)}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-sm text-slate-600">
                {t(f.pin)}: <span className="font-semibold text-navy-900">{clinic.postalCode}</span>
              </p>
              <p className="mt-2 text-sm font-medium text-navy-900">
                {t(f.lost)}{' '}
                <a href={telLink()} className="font-bold whitespace-nowrap text-brand-red hover:underline">
                  {clinic.phones[0].display}
                </a>
              </p>
            </div>
            <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-card">
              <iframe
                title={t(c.mapTitle)}
                src={clinic.mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-80 w-full border-0 sm:h-96 lg:h-full lg:min-h-[22rem]"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
