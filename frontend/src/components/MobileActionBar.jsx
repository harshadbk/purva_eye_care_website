import { MessageCircle, Navigation, Phone } from 'lucide-react'
import { content } from '../data/content'
import { clinic, telLink, whatsappLink } from '../data/clinic'
import { useLanguage } from '../i18n/LanguageContext'

// Fixed bottom bar on phones: the three actions local patients need most.
export default function MobileActionBar() {
  const { t } = useLanguage()
  const m = content.mobileBar
  const item = 'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold'

  return (
    <nav
      aria-label="Quick actions"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgb(17_31_77/0.08)] backdrop-blur md:hidden"
    >
      <a href={telLink()} className={`${item} text-navy-800`}>
        <Phone className="size-5" aria-hidden="true" />
        {t(m.call)}
      </a>
      <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className={`${item} text-whatsapp`}>
        <MessageCircle className="size-5" aria-hidden="true" />
        {t(m.whatsapp)}
      </a>
      <a href={clinic.directionsUrl} target="_blank" rel="noopener noreferrer" className={`${item} text-teal-700`}>
        <Navigation className="size-5" aria-hidden="true" />
        {t(m.directions)}
      </a>
    </nav>
  )
}
