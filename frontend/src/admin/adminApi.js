// Admin API client. The token lives in sessionStorage, so closing the tab logs out.
import { clinic } from '../data/clinic'
import { content } from '../data/content'
import { formatDate } from '../lib/booking'
import { API_URL } from '../lib/api'

const TOKEN_KEY = 'purva-admin-token'

export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // Without storage the admin just logs in again next time.
  }
}

export class AuthError extends Error {}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() ?? ''}`, ...options.headers },
  })
  if (res.status === 401) throw new AuthError('unauthorized')
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? 'request_failed')
  return data
}

export const login = (username, password) => request('/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) })
export const fetchAppointments = () => request('/admin/appointments')
export const markConfirmed = (id) => request(`/admin/appointments/${id}/confirm`, { method: 'PATCH' })

export const slotLabel = (id, lang) => content.appointment.timeSlots.find((s) => s.id === id)?.[lang] ?? id

// WhatsApp message to the patient, in the language they booked in.
export function confirmationLink(appt) {
  const lang = appt.lang === 'en' ? 'en' : 'mr'
  const date = formatDate(appt.date, lang)
  const slot = slotLabel(appt.time, lang)
  const text =
    lang === 'en'
      ? [
          `Hello ${appt.name},`,
          `Your appointment at ${clinic.name.en} is confirmed for ${date} (${slot}).`,
          `Address: ${clinic.address.en}`,
          `Map: ${clinic.directionsUrl}`,
          `Please bring your old spectacles or prescription if you have them. See you soon!`,
          `– ${clinic.optometrist.name}, ${clinic.name.en}`,
        ]
      : [
          `नमस्कार ${appt.name},`,
          `${clinic.name.mr} येथे तुमची अपॉइंटमेंट ${date} (${slot}) रोजी निश्चित झाली आहे.`,
          `पत्ता: ${clinic.address.mr}`,
          `नकाशा: ${clinic.directionsUrl}`,
          `जुना चष्मा किंवा नंबरची चिठ्ठी असल्यास सोबत आणा. लवकरच भेटूया!`,
          `– ${clinic.optometrist.name}, ${clinic.name.mr}`,
        ]
  return `https://wa.me/91${appt.phone}?text=${encodeURIComponent(text.join('\n'))}`
}
