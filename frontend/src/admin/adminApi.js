// Admin API client. The token is kept only in memory (never in localStorage/sessionStorage),
// so closing the panel, refreshing or closing the tab always asks for the login again.
import { clinic } from '../data/clinic'
import { content } from '../data/content'
import { formatDate } from '../lib/booking'
import { API_URL } from '../lib/api'

let token = null

export const getToken = () => token
export const setToken = (next) => {
  token = next || null
}

// Clean up anything an older version of the site left in storage.
try {
  sessionStorage.removeItem('purva-admin-token')
} catch {
  // storage unavailable: nothing to clean
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
export const setAppointmentStatus = (id, status) =>
  request(`/admin/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })

// Ends the session on the server too, so the token can't be reused. Never throws.
export async function logout() {
  const current = token
  token = null
  if (!current) return
  try {
    await fetch(`${API_URL}/api/admin/logout`, { method: 'POST', headers: { Authorization: `Bearer ${current}` }, keepalive: true })
  } catch {
    // Server unreachable: the session still expires on its own.
  }
}
export const fetchAdminReviews = () => request('/admin/reviews')
export const addReview = (review) => request('/admin/reviews', { method: 'POST', body: JSON.stringify(review) })
export const setReviewStatus = (id, status) => request(`/admin/reviews/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
export const deleteReview = (id) => request(`/admin/reviews/${id}`, { method: 'DELETE' })

// { ok, db } from the backend, or null when the server itself is unreachable.
export async function fetchHealth() {
  try {
    const res = await fetch(`${API_URL}/api/health`)
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}

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
