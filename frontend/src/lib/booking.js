// Appointment booking logic, kept separate from the UI.
// WhatsApp and the database copy are fully independent: either can fail without affecting the other.
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

// ---------- database copy (independent of WhatsApp) ----------
// WhatsApp is the primary channel and never waits for, or depends on, the backend.
// The database copy is best-effort: if the server or database is down, the request is
// kept in this browser and re-sent later, so the admin list still fills up once it's back.
const QUEUE_KEY = 'purva-pending-appointments'
const QUEUE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const SAVE_TIMEOUT_MS = 8000

function readQueue() {
  try {
    const list = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')
    return Array.isArray(list) ? list.filter((item) => Date.now() - item.queuedAt < QUEUE_MAX_AGE_MS) : []
  } catch {
    return []
  }
}

function writeQueue(list) {
  try {
    if (list.length) localStorage.setItem(QUEUE_KEY, JSON.stringify(list))
    else localStorage.removeItem(QUEUE_KEY)
  } catch {
    // Private mode / storage full: the WhatsApp message already reached the clinic.
  }
}

function newClientId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

// Resolves true/false; never throws, never hangs longer than SAVE_TIMEOUT_MS.
async function postAppointment(payload) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SAVE_TIMEOUT_MS)
  try {
    const res = await fetch(`${API_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
      // Lets the request finish even if the phone switches to the WhatsApp app.
      keepalive: true,
    })
    // 400 means the data itself was rejected; retrying won't help, so drop it.
    return res.ok || res.status === 400
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

async function saveAppointment(payload) {
  const ok = await postAppointment(payload)
  if (!ok) writeQueue([...readQueue().filter((p) => p.clientId !== payload.clientId), { ...payload, queuedAt: Date.now() }])
  return ok
}

// Re-sends requests saved while the backend was unreachable. Safe to call any time;
// the backend ignores a clientId it has already stored.
let flushing = false
export async function flushPendingAppointments() {
  if (flushing) return
  const queue = readQueue()
  if (!queue.length) return
  flushing = true
  try {
    const remaining = []
    for (const item of queue) {
      const { queuedAt, ...payload } = item
      if (!(await postAppointment(payload))) remaining.push(item)
    }
    // Keep anything queued while we were flushing.
    const added = readQueue().filter((q) => !queue.some((o) => o.clientId === q.clientId))
    writeQueue([...remaining, ...added])
  } finally {
    flushing = false
  }
}

// Synchronous on purpose: the caller must open WhatsApp inside the click handler,
// or mobile browsers block it. The database save runs in the background and can't
// delay or break the WhatsApp step.
export function submitAppointment(values, labels, lang) {
  const url = whatsappLink(buildAppointmentMessage(values, labels, lang))
  let saved
  try {
    const payload = { ...values, phone: normalizePhone(values.phone), reasonLabel: labels.reason, lang, clientId: newClientId() }
    saved = saveAppointment(payload)
  } catch {
    saved = Promise.resolve(false)
  }
  return { channel: 'whatsapp', url, saved }
}

// Opens WhatsApp; falls back to navigating in the same tab when pop-ups are blocked.
export function openWhatsApp(url) {
  const win = window.open(url, '_blank', 'noopener,noreferrer')
  if (!win) window.location.href = url
}
