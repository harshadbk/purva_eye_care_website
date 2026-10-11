// Appointment booking logic, kept separate from the UI so a backend API
// can replace the WhatsApp flow later without touching the form component.
import { clinic, whatsappLink } from '../data/clinic'
import { API_URL } from './api'

const PHONE_RE = /^[6-9]\d{9}$/

// Accepts "98765 43210", "+91 98765-43210", "098765 43210" etc.
export function normalizePhone(raw) {
  let digits = String(raw).replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  return digits
}

export function todayISO() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

// Returns { field: errorKey } for every invalid field; empty object when valid.
export function validateAppointment(values) {
  const errors = {}
  if (values.name.trim().length < 2) errors.name = 'name'
  if (!PHONE_RE.test(normalizePhone(values.phone))) errors.phone = 'phone'
  if (!values.date || values.date < todayISO()) errors.date = 'date'
  if (!values.time) errors.time = 'time'
  if (!values.reason) errors.reason = 'reason'
  return errors
}

export function formatDate(iso, lang) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(lang === 'en' ? 'en-IN' : 'mr-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// `labels` holds already-translated display values for time and reason.
export function buildAppointmentMessage(values, labels, lang) {
  const phone = normalizePhone(values.phone)
  const lines =
    lang === 'en'
      ? [
          `Hello ${clinic.name.en}, I would like to book an appointment.`,
          '',
          `Name: ${values.name.trim()}`,
          `Mobile: ${phone}`,
          `Preferred date: ${formatDate(values.date, 'en')}`,
          `Preferred time: ${labels.time}`,
          `Reason: ${labels.reason}`,
        ]
      : [
          `नमस्कार ${clinic.name.mr}, मला अपॉइंटमेंट हवी आहे.`,
          '',
          `नाव: ${values.name.trim()}`,
          `मोबाईल: ${phone}`,
          `पसंतीची तारीख: ${formatDate(values.date, 'mr')}`,
          `पसंतीची वेळ: ${labels.time}`,
          `कारण: ${labels.reason}`,
        ]
  if (values.notes.trim()) lines.push(`${lang === 'en' ? 'Details' : 'अधिक माहिती'}: ${values.notes.trim()}`)
  return lines.join('\n')
}

// Records the request in the clinic's database (backend/server.js) so it shows up
// in the admin panel. Failures are swallowed: WhatsApp alone still reaches the clinic.
async function saveAppointment(values, labels, lang) {
  try {
    const res = await fetch(`${API_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, phone: normalizePhone(values.phone), reasonLabel: labels.reason, lang }),
    })
    return res.ok
  } catch {
    return false
  }
}

// Synchronous on purpose: the caller must open WhatsApp inside the click handler,
// or mobile browsers block it. The database save runs in the background.
export function submitAppointment(values, labels, lang) {
  const url = whatsappLink(buildAppointmentMessage(values, labels, lang))
  const saved = saveAppointment(values, labels, lang)
  return { channel: 'whatsapp', url, saved }
}
