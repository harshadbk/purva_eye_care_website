// Word-of-mouth helpers: WhatsApp share text and a downloadable contact card.
import { clinic } from '../data/clinic'

export function shareMessage(baseText, labels) {
  const lines = [baseText, `${labels.map}: ${clinic.directionsUrl}`]
  if (typeof window !== 'undefined') lines.push(`${labels.site}: ${window.location.origin}`)
  return lines.join('\n')
}

// WhatsApp share link with no recipient, so the user picks who to send it to.
export const whatsappShareLink = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`

function buildVCard() {
  const o = clinic.optometrist
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${clinic.name.en}`,
    `ORG:${clinic.name.en};${clinic.name.mr}`,
    `TITLE:${o.name}, ${o.qualification}, ${o.role.en}`,
    ...clinic.phones.map((p, i) => `TEL;TYPE=${i === 0 ? 'CELL,PREF' : 'CELL'}:${p.tel}`),
    `ADR;TYPE=WORK:;;A/3, Saubhagya Arcade, Palkhed Road, near Samarth Fertilizer;Dindori;Maharashtra;${clinic.postalCode};India`,
    `GEO:${clinic.coordinates.replace(',', ';')}`,
    `NOTE:${clinic.tagline.mr} – ${clinic.motto.mr}`,
    'END:VCARD',
  ].join('\r\n')
}

export function downloadVCard() {
  const blob = new Blob([buildVCard()], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'Purva-Eye-Care-Center.vcf'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
