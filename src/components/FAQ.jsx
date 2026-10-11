import { ChevronDown } from 'lucide-react'
import Reveal from './Reveal'
import SectionHeading from './SectionHeading'
import { content } from '../data/content'
import { useLanguage } from '../i18n/LanguageContext'

export default function FAQ() {
  const { t } = useLanguage()
  const f = content.faq

  // FAQPage structured data so answers can appear directly in Google results.
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: f.items.map((item) => ({
      '@type': 'Question',
      name: t(item.q),
      acceptedAnswer: { '@type': 'Answer', text: t(item.a) },
    })),
  }

  return (
    <section id="faq" aria-labelledby="faq-title" className="section bg-slate-50">
      <div className="container-page max-w-3xl">
        <SectionHeading id="faq-title" eyebrow={t(f.eyebrow)} title={t(f.title)} />
        <Reveal className="grid gap-3">
          {f.items.map((item) => (
            <details key={item.q.en} className="group card overflow-hidden">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-base font-semibold text-navy-900 [&::-webkit-details-marker]:hidden">
                {t(item.q)}
                <ChevronDown className="size-5 shrink-0 text-navy-700 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="border-t border-slate-100 px-5 py-4 text-slate-600">{t(item.a)}</p>
            </details>
          ))}
        </Reveal>
      </div>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </section>
  )
}
