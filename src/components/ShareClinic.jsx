import { Contact as ContactIcon, Share2, Star } from 'lucide-react'
import Reveal from './Reveal'
import { content } from '../data/content'
import { clinic } from '../data/clinic'
import { downloadVCard, shareMessage, whatsappShareLink } from '../lib/share'
import { useLanguage } from '../i18n/LanguageContext'

// Word-of-mouth band: most new patients for a local clinic come through referrals.
export default function ShareClinic() {
  const { t } = useLanguage()
  const s = content.share
  const message = shareMessage(t(s.message), { map: t(s.mapLabel), site: t(s.siteLabel) })

  return (
    <section aria-labelledby="share-title" className="bg-white py-12 sm:py-16">
      <div className="container-page">
        <Reveal className="flex flex-col items-start gap-6 rounded-3xl bg-gradient-to-br from-navy-700 to-navy-900 p-6 text-white shadow-lift sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 id="share-title" className="text-2xl font-bold text-white sm:text-3xl">
              {t(s.title)}
            </h2>
            <p className="mt-3 text-navy-100">{t(s.body)}</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col xl:flex-row">
            <a href={whatsappShareLink(message)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
              <Share2 className="size-5" aria-hidden="true" />
              {t(s.whatsapp)}
            </a>
            <button type="button" onClick={downloadVCard} className="btn border-2 border-white/70 text-white hover:bg-white/10">
              <ContactIcon className="size-5" aria-hidden="true" />
              {t(s.save)}
            </button>
            {clinic.googleReviewUrl && (
              <a href={clinic.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="btn bg-white text-navy-800 hover:bg-navy-50">
                <Star className="size-5" aria-hidden="true" />
                {t(s.review)}
              </a>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
