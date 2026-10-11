import { MessageCircle, Phone } from 'lucide-react'
import Reveal from './Reveal'
import SectionHeading from './SectionHeading'
import { content } from '../data/content'
import { telLink, whatsappLink } from '../data/clinic'
import { useLanguage } from '../i18n/LanguageContext'

function GalleryImage({ item, label, className, imgClass = '' }) {
  return (
    <figure className={`group relative overflow-hidden rounded-2xl bg-slate-100 ${className}`}>
      <img
        src={item.src}
        alt={label}
        width={item.w}
        height={item.h}
        loading="lazy"
        decoding="async"
        className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${imgClass}`}
      />
      <figcaption className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-navy-900 backdrop-blur">
        {label}
      </figcaption>
    </figure>
  )
}

export default function OpticalStore() {
  const { t } = useLanguage()
  const o = content.optical
  const [frames, goggles, tinted, closeup] = o.gallery

  return (
    <section id="optical" aria-labelledby="optical-title" className="section">
      <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <SectionHeading id="optical-title" eyebrow={t(o.eyebrow)} title={t(o.title)} align="left" />
          <Reveal>
            <p className="text-base text-slate-600 sm:text-lg">{t(o.body)}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {o.categories.map((c) => (
                <li key={c.en} className="rounded-full border border-navy-100 bg-navy-50 px-4 py-1.5 text-sm font-semibold text-navy-800">
                  {t(c)}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-slate-500">{t(o.note)}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href={whatsappLink(t(o.whatsappMessage))} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                <MessageCircle className="size-5" aria-hidden="true" />
                {t(o.whatsapp)}
              </a>
              <a href={telLink()} className="btn btn-outline">
                <Phone className="size-5" aria-hidden="true" />
                {t(o.call)}
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.05} className="grid grid-cols-2 gap-3 sm:gap-4">
          <GalleryImage item={frames} label={t(frames)} className="row-span-2" />
          <GalleryImage item={goggles} label={t(goggles)} className="aspect-[4/3]" imgClass="object-[50%_30%]" />
          <GalleryImage item={closeup} label={t(closeup)} className="aspect-[4/3]" />
          <GalleryImage item={tinted} label={t(tinted)} className="col-span-2 aspect-[2/1] sm:aspect-[21/9]" />
        </Reveal>
      </div>
    </section>
  )
}
