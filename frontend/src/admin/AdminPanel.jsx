import { useCallback, useEffect, useRef, useState } from 'react'
import { CalendarDays, CheckCircle2, Clock3, LogOut, MessageCircle, Phone, RefreshCw, X } from 'lucide-react'
import { AuthError, confirmationLink, fetchAppointments, getToken, login, markConfirmed, setToken, slotLabel } from './adminApi'
import { formatDate } from '../lib/booking'

const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'all', label: 'All' },
]

const receivedAt = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

function LoginForm({ onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { token } = await login(username.trim(), password)
      setToken(token)
      onSuccess()
    } catch (err) {
      setError(
        err instanceof AuthError || err.message === 'invalid_credentials'
          ? 'Wrong username or password.'
          : err.message === 'too_many_attempts'
            ? 'Too many attempts. Try again in 15 minutes.'
            : 'Could not reach the server. Is it running?',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto grid w-full max-w-sm gap-4 py-6">
      <h2 className="text-xl font-bold">Admin login</h2>
      <label className="grid gap-1.5 text-sm font-semibold text-navy-900">
        Username
        <input className="field-input" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold text-navy-900">
        Password
        <input className="field-input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error && (
        <p role="alert" className="text-sm font-medium text-brand-red">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn btn-primary">
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

function Stat({ label, value, tone }) {
  return (
    <div className={`rounded-2xl px-4 py-3 ${tone}`}>
      <p className="text-xs font-semibold tracking-wide uppercase opacity-80">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}

function AppointmentCard({ appt, onConfirm }) {
  const pending = appt.status === 'pending'
  return (
    <li className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold text-navy-900">{appt.name}</p>
          <a href={`tel:+91${appt.phone}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:underline">
            <Phone className="size-3.5" aria-hidden="true" />
            {appt.phone}
          </a>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${pending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}
        >
          {pending ? 'Pending' : 'Confirmed'}
        </span>
      </div>

      <dl className="mt-3 grid gap-1.5 text-sm text-slate-700 sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-teal-700" aria-hidden="true" />
          <dt className="sr-only">Preferred date</dt>
          <dd>
            {formatDate(appt.date, 'en')} · {slotLabel(appt.time, 'en')}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <Clock3 className="size-4 text-teal-700" aria-hidden="true" />
          <dt className="sr-only">Received</dt>
          <dd>Received {receivedAt(appt.createdAt)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="inline font-semibold">Reason: </dt>
          <dd className="inline">{appt.reasonLabel || appt.reason}</dd>
        </div>
        {appt.notes && (
          <div className="sm:col-span-2">
            <dt className="inline font-semibold">Notes: </dt>
            <dd className="inline">{appt.notes}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4">
        {pending ? (
          <button type="button" onClick={() => onConfirm(appt)} className="btn btn-whatsapp min-h-10 text-sm">
            <MessageCircle className="size-4" aria-hidden="true" />
            Confirm on WhatsApp
          </button>
        ) : (
          <a href={confirmationLink(appt)} target="_blank" rel="noopener noreferrer" className="btn btn-outline min-h-10 text-sm">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Send confirmation again
          </a>
        )}
      </div>
    </li>
  )
}

function Dashboard({ onLogout }) {
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState('pending')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await fetchAppointments())
    } catch (err) {
      if (err instanceof AuthError) onLogout()
      else setError('Could not load appointments.')
    } finally {
      setLoading(false)
    }
  }, [onLogout])

  useEffect(() => {
    load()
  }, [load])

  const confirm = async (appt) => {
    // Open WhatsApp first, inside the click, so the browser doesn't block it.
    window.open(confirmationLink(appt), '_blank', 'noopener,noreferrer')
    try {
      const updated = await markConfirmed(appt._id)
      setData((d) => ({
        stats: { ...d.stats, pending: d.stats.pending - 1, confirmed: d.stats.confirmed + 1 },
        appointments: d.appointments.map((a) => (a._id === updated._id ? updated : a)),
      }))
    } catch (err) {
      if (err instanceof AuthError) onLogout()
      else setError('WhatsApp opened, but the status could not be saved. Refresh and try again.')
    }
  }

  const list = data?.appointments.filter((a) => filter === 'all' || a.status === filter) ?? []

  return (
    <div className="py-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Appointments</h2>
        <div className="flex gap-2">
          <button type="button" onClick={load} disabled={loading} className="btn btn-outline min-h-10 px-4 text-sm">
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
          <button type="button" onClick={onLogout} className="btn min-h-10 px-4 text-sm text-slate-600 hover:bg-slate-100">
            <LogOut className="size-4" aria-hidden="true" />
            Log out
          </button>
        </div>
      </div>

      {data && (
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Stat label="Total" value={data.stats.total} tone="bg-navy-50 text-navy-900" />
          <Stat label="Pending" value={data.stats.pending} tone="bg-amber-50 text-amber-900" />
          <Stat label="Confirmed" value={data.stats.confirmed} tone="bg-emerald-50 text-emerald-900" />
        </div>
      )}

      <div role="tablist" aria-label="Filter" className="mt-6 inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`min-h-9 rounded-full px-4 text-sm font-semibold ${filter === f.id ? 'bg-navy-700 text-white' : 'text-navy-700'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-brand-red">
          {error}
        </p>
      )}

      {data && list.length === 0 && <p className="mt-8 text-center text-slate-500">No {filter === 'all' ? '' : filter} appointments.</p>}

      <ul className="mt-5 grid gap-4">
        {list.map((appt) => (
          <AppointmentCard key={appt._id} appt={appt} onConfirm={confirm} />
        ))}
      </ul>
    </div>
  )
}

export default function AdminPanel({ onClose }) {
  const [loggedIn, setLoggedIn] = useState(() => Boolean(getToken()))
  const closeRef = useRef(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const logout = useCallback(() => {
    setToken(null)
    setLoggedIn(false)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/60 p-3 sm:p-8" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Admin panel"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl rounded-3xl bg-white p-5 shadow-lift sm:p-8"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close admin panel"
          className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
        {loggedIn ? <Dashboard onLogout={logout} /> : <LoginForm onSuccess={() => setLoggedIn(true)} />}
      </div>
    </div>
  )
}
