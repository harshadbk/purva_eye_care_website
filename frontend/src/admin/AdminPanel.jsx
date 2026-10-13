import { useCallback, useEffect, useRef, useState } from 'react'
import { CalendarDays, Check, CheckCircle2, Clock3, Eye, EyeOff, LogOut, MessageCircle, Phone, Plus, RefreshCw, Search, Star, Trash2, Undo2, WifiOff, X } from 'lucide-react'
import {
  AuthError,
  addReview,
  confirmationLink,
  deleteReview,
  fetchAdminReviews,
  fetchAppointments,
  fetchHealth,
  login,
  logout as endSession,
  markConfirmed,
  setAppointmentStatus,
  setReviewStatus,
  setToken,
  slotLabel,
} from './adminApi'
import { formatDate, openWhatsApp, todayISO } from '../lib/booking'
import { stars } from '../lib/reviews'

const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'today', label: 'Today' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'all', label: 'All' },
]

const REVIEW_FILTERS = [
  { id: 'pending', label: 'Waiting' },
  { id: 'approved', label: 'Shown' },
  { id: 'hidden', label: 'Hidden' },
  { id: 'all', label: 'All' },
]

const SOURCE_LABELS = { website: 'Website', whatsapp: 'WhatsApp', 'in-person': 'In person', phone: 'Phone', google: 'Google' }

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
        <p role="alert" className="text-sm font-medium text-accent">
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

function AppointmentCard({ appt, onConfirm, onStatus, busy }) {
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

      <div className="mt-4 flex flex-wrap gap-2">
        {pending ? (
          <>
            <button type="button" onClick={() => onConfirm(appt)} disabled={busy} className="btn btn-whatsapp min-h-10 text-sm">
              <MessageCircle className="size-4" aria-hidden="true" />
              Confirm on WhatsApp
            </button>
            {/* For bookings confirmed by phone or at the counter: no WhatsApp message. */}
            <button type="button" onClick={() => onStatus(appt, 'confirmed')} disabled={busy} className="btn btn-accent min-h-10 text-sm">
              <Check className="size-4" aria-hidden="true" />
              Mark confirmed
            </button>
          </>
        ) : (
          <>
            <a href={confirmationLink(appt)} target="_blank" rel="noopener noreferrer" className="btn btn-outline min-h-10 text-sm">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Send confirmation again
            </a>
            <button type="button" onClick={() => onStatus(appt, 'pending')} disabled={busy} className="btn min-h-10 px-4 text-sm text-slate-600 hover:bg-slate-100">
              <Undo2 className="size-4" aria-hidden="true" />
              Move back to pending
            </button>
          </>
        )}
      </div>
    </li>
  )
}

function ReviewCard({ review, onStatus, onDelete }) {
  const tone = { pending: 'bg-amber-100 text-amber-800', approved: 'bg-emerald-100 text-emerald-800', hidden: 'bg-slate-200 text-slate-700' }[review.status]
  const label = { pending: 'Waiting', approved: 'Shown', hidden: 'Hidden' }[review.status]
  return (
    <li className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-lg tracking-wider text-amber-500" aria-label={`${review.rating} out of 5`}>
            {stars(review.rating)}
          </p>
          <p className="font-bold text-navy-900">{review.name}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{label}</span>
      </div>
      {review.comment && <p className="mt-2 text-sm text-slate-700">{review.comment}</p>}
      <p className="mt-2 text-xs text-slate-500">
        {SOURCE_LABELS[review.source] ?? 'Website'}
        {review.place && ` · ${review.place}`} · {receivedAt(review.createdAt)}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {review.status !== 'approved' && (
          <button type="button" onClick={() => onStatus(review, 'approved')} className="btn btn-primary min-h-10 text-sm">
            <Eye className="size-4" aria-hidden="true" />
            Approve &amp; show
          </button>
        )}
        {review.status !== 'hidden' && (
          <button type="button" onClick={() => onStatus(review, 'hidden')} className="btn btn-outline min-h-10 text-sm">
            <EyeOff className="size-4" aria-hidden="true" />
            Hide
          </button>
        )}
        <button type="button" onClick={() => onDelete(review)} className="btn min-h-10 px-4 text-sm text-slate-600 hover:bg-slate-100">
          <Trash2 className="size-4" aria-hidden="true" />
          Delete
        </button>
      </div>
    </li>
  )
}

// For genuine feedback the clinic received outside the website (WhatsApp, phone, in person,
// Google). It is published straight away with its source shown, so visitors know where it came from.
const EMPTY_REVIEW = { name: '', place: '', rating: 5, comment: '', source: 'whatsapp' }

function AddReviewForm({ onAdded, onLogout }) {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState(EMPTY_REVIEW)
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: field === 'rating' ? Number(e.target.value) : e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (values.name.trim().length < 2) return setError('Enter the patient\'s name.')
    setBusy(true)
    setError('')
    try {
      onAdded(await addReview({ ...values, name: values.name.trim(), place: values.place.trim(), comment: values.comment.trim() }))
      setValues(EMPTY_REVIEW)
      setConsent(false)
      setOpen(false)
    } catch (err) {
      if (err instanceof AuthError) onLogout()
      else setError('Could not save. Try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-accent min-h-10 text-sm">
        <Plus className="size-4" aria-hidden="true" />
        Add feedback received from a patient
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="card grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
      <p className="text-sm text-slate-600 sm:col-span-2">
        Only enter real feedback a patient actually gave you, in their words, with their permission to show it.
      </p>
      <label className="grid gap-1 text-sm font-semibold text-navy-900">
        Patient name
        <input className="field-input min-h-10" maxLength={60} value={values.name} onChange={set('name')} required />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-navy-900">
        Village / town
        <input className="field-input min-h-10" maxLength={40} value={values.place} onChange={set('place')} placeholder="e.g. Dindori" />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-navy-900">
        Rating
        <select className="field-input min-h-10" value={values.rating} onChange={set('rating')}>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {stars(n)} ({n})
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-navy-900">
        Received via
        <select className="field-input min-h-10" value={values.source} onChange={set('source')}>
          <option value="whatsapp">WhatsApp</option>
          <option value="in-person">In person at the clinic</option>
          <option value="phone">Phone</option>
          <option value="google">Google review</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-navy-900 sm:col-span-2">
        Their feedback
        <textarea className="field-input resize-y" rows={3} maxLength={600} value={values.comment} onChange={set('comment')} />
      </label>
      <label className="flex items-start gap-2 text-sm text-navy-900 sm:col-span-2">
        <input type="checkbox" className="mt-1 size-4" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        This is genuine feedback from this patient, and they agreed to it being shown on the website.
      </label>
      {error && (
        <p role="alert" className="text-sm font-medium text-accent sm:col-span-2">
          {error}
        </p>
      )}
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" disabled={busy || !consent} className="btn btn-primary min-h-10 text-sm">
          {busy ? 'Saving…' : 'Save & show on website'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn min-h-10 px-4 text-sm text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
      </div>
    </form>
  )
}

function DbBanner({ health }) {
  if (health?.db) return null
  return (
    <div role="status" className="mt-4 flex gap-3 rounded-2xl border border-accent/25 bg-accent-soft p-4 text-sm text-navy-900">
      <WifiOff className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
      <p>
        <span className="font-bold">{health ? 'Database is offline.' : 'Server is not reachable.'}</span> Patients can still book: every request
        goes straight to the clinic&apos;s WhatsApp. Requests made during the outage are added here automatically once it is back.
      </p>
    </div>
  )
}

function FilterTabs({ filters, value, onChange }) {
  return (
    <div role="tablist" aria-label="Filter" className="inline-flex self-start rounded-full border border-slate-200 bg-slate-50 p-1">
      {filters.map((f) => (
        <button
          key={f.id}
          type="button"
          role="tab"
          aria-selected={value === f.id}
          onClick={() => onChange(f.id)}
          className={`min-h-9 rounded-full px-3 text-sm font-semibold sm:px-4 ${value === f.id ? 'bg-navy-700 text-white' : 'text-navy-700'}`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

function RefreshButton({ onClick, loading }) {
  return (
    <div className="flex justify-end">
      <button type="button" onClick={onClick} disabled={loading} className="btn btn-outline min-h-10 px-4 text-sm">
        <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
        Refresh
      </button>
    </div>
  )
}

function AppointmentsTab({ onLogout, onDbError }) {
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState('pending')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await fetchAppointments())
    } catch (err) {
      if (err instanceof AuthError) onLogout()
      else {
        onDbError()
        setError('Could not load appointments. New requests still arrive on WhatsApp meanwhile.')
      }
    } finally {
      setLoading(false)
    }
  }, [onLogout, onDbError])

  useEffect(() => {
    load()
  }, [load])

  const [busyId, setBusyId] = useState(null)

  const applyUpdate = (before, updated) =>
    setData((d) => {
      const stats = { ...d.stats }
      if (before.status !== updated.status) {
        stats[before.status] -= 1
        stats[updated.status] += 1
      }
      return { stats, appointments: d.appointments.map((a) => (a._id === updated._id ? updated : a)) }
    })

  const confirm = async (appt) => {
    // Open WhatsApp first, inside the click, so the browser doesn't block it.
    openWhatsApp(confirmationLink(appt))
    setBusyId(appt._id)
    try {
      applyUpdate(appt, await markConfirmed(appt._id))
    } catch (err) {
      if (err instanceof AuthError) onLogout()
      else setError('WhatsApp opened, but the status could not be saved. Refresh and try again.')
    } finally {
      setBusyId(null)
    }
  }

  const changeStatus = async (appt, status) => {
    setBusyId(appt._id)
    setError('')
    try {
      applyUpdate(appt, await setAppointmentStatus(appt._id, status))
    } catch (err) {
      if (err instanceof AuthError) onLogout()
      else setError('Could not save the status. Try again.')
    } finally {
      setBusyId(null)
    }
  }

  const today = todayISO()
  const q = query.trim().toLowerCase()
  const list =
    data?.appointments.filter(
      (a) =>
        (filter === 'all' || (filter === 'today' ? a.date === today : a.status === filter)) &&
        (!q || a.name.toLowerCase().includes(q) || a.phone.includes(q)),
    ) ?? []
  const todayCount = data?.appointments.filter((a) => a.date === today).length ?? 0

  return (
    <div>
      <RefreshButton onClick={load} loading={loading} />

      {data && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total" value={data.stats.total} tone="bg-navy-50 text-navy-900" />
          <Stat label="Today" value={todayCount} tone="bg-accent-soft text-navy-900" />
          <Stat label="Pending" value={data.stats.pending} tone="bg-amber-50 text-amber-900" />
          <Stat label="Confirmed" value={data.stats.confirmed} tone="bg-emerald-50 text-emerald-900" />
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs filters={FILTERS} value={filter} onChange={setFilter} />
        <label className="relative sm:w-56">
          <span className="sr-only">Search by name or phone</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or phone" className="field-input min-h-10 pl-9 text-sm" />
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-accent">
          {error}
        </p>
      )}

      {data && list.length === 0 && <p className="mt-8 text-center text-slate-500">No matching appointments.</p>}

      <ul className="mt-5 grid gap-4">
        {list.map((appt) => (
          <AppointmentCard key={appt._id} appt={appt} onConfirm={confirm} onStatus={changeStatus} busy={busyId === appt._id} />
        ))}
      </ul>
    </div>
  )
}

function ReviewsTab({ onLogout, onDbError }) {
  const [list, setList] = useState(null)
  const [filter, setFilter] = useState('pending')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setList((await fetchAdminReviews()).reviews)
    } catch (err) {
      if (err instanceof AuthError) onLogout()
      else {
        onDbError()
        setError('Could not load reviews.')
      }
    } finally {
      setLoading(false)
    }
  }, [onLogout, onDbError])

  useEffect(() => {
    load()
  }, [load])

  const run = async (action) => {
    setError('')
    try {
      await action()
    } catch (err) {
      if (err instanceof AuthError) onLogout()
      else setError('Could not save the change. Try again.')
    }
  }

  const changeStatus = (review, status) =>
    run(async () => {
      const updated = await setReviewStatus(review._id, status)
      setList((l) => l.map((r) => (r._id === updated._id ? updated : r)))
    })

  const remove = (review) => {
    if (!window.confirm(`Delete the review from ${review.name}? This cannot be undone.`)) return
    run(async () => {
      await deleteReview(review._id)
      setList((l) => l.filter((r) => r._id !== review._id))
    })
  }

  const approved = list?.filter((r) => r.status === 'approved') ?? []
  const average = approved.length ? (approved.reduce((sum, r) => sum + r.rating, 0) / approved.length).toFixed(1) : '–'
  const shown = list?.filter((r) => filter === 'all' || r.status === filter) ?? []

  return (
    <div>
      <RefreshButton onClick={load} loading={loading} />

      {list && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="Average" value={average} tone="bg-amber-50 text-amber-900" />
          <Stat label="Waiting" value={list.filter((r) => r.status === 'pending').length} tone="bg-accent-soft text-navy-900" />
          <Stat label="Shown" value={approved.length} tone="bg-emerald-50 text-emerald-900" />
        </div>
      )}

      <p className="mt-4 text-sm text-slate-600">Reviews written on the website are shown right away. Hide or delete any that are not genuine.</p>

      <div className="mt-4">
        <AddReviewForm onAdded={(review) => setList((l) => [review, ...(l ?? [])])} onLogout={onLogout} />
      </div>

      <div className="mt-3">
        <FilterTabs filters={REVIEW_FILTERS} value={filter} onChange={setFilter} />
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-accent">
          {error}
        </p>
      )}

      {list && shown.length === 0 && <p className="mt-8 text-center text-slate-500">No reviews here.</p>}

      <ul className="mt-5 grid gap-4">
        {shown.map((review) => (
          <ReviewCard key={review._id} review={review} onStatus={changeStatus} onDelete={remove} />
        ))}
      </ul>
    </div>
  )
}

function Dashboard({ onLogout }) {
  const [tab, setTab] = useState('appointments')
  const [health, setHealth] = useState({ ok: true, db: true })

  const checkHealth = useCallback(async () => setHealth(await fetchHealth()), [])

  useEffect(() => {
    checkHealth()
    const id = setInterval(checkHealth, 30000)
    return () => clearInterval(id)
  }, [checkHealth])

  const tabs = [
    { id: 'appointments', label: 'Appointments', icon: CalendarDays },
    { id: 'reviews', label: 'Ratings', icon: Star },
  ]

  return (
    <div className="py-2">
      <div className="flex flex-wrap items-center justify-between gap-3 pr-10">
        <h2 className="text-xl font-bold">Clinic dashboard</h2>
        <button type="button" onClick={onLogout} className="btn min-h-10 px-4 text-sm text-slate-600 hover:bg-slate-100">
          <LogOut className="size-4" aria-hidden="true" />
          Log out
        </button>
      </div>

      <DbBanner health={health} />

      <div role="tablist" aria-label="Section" className="mt-5 grid grid-cols-2 gap-2 border-b border-slate-200">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`-mb-px inline-flex min-h-11 items-center justify-center gap-2 border-b-2 text-sm font-semibold ${
              tab === id ? 'border-accent text-accent' : 'border-transparent text-slate-600 hover:text-navy-800'
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'appointments' ? (
          <AppointmentsTab onLogout={onLogout} onDbError={checkHealth} />
        ) : (
          <ReviewsTab onLogout={onLogout} onDbError={checkHealth} />
        )}
      </div>
    </div>
  )
}

const IDLE_LOGOUT_MS = 10 * 60 * 1000

export default function AdminPanel({ onClose }) {
  // Always starts signed out: the username and password are asked every time the panel opens.
  const [loggedIn, setLoggedIn] = useState(false)
  const [idleNotice, setIdleNotice] = useState(false)
  const closeRef = useRef(null)

  const logout = useCallback(() => {
    endSession()
    setLoggedIn(false)
  }, [])

  // Closing the panel ends the session.
  const close = useCallback(() => {
    endSession()
    onClose()
  }, [onClose])

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    // Leaving or refreshing the page ends the session on the server too.
    window.addEventListener('pagehide', endSession)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pagehide', endSession)
      document.body.style.overflow = prevOverflow
      endSession()
    }
  }, [close])

  // Automatic logout after 10 minutes without any activity.
  useEffect(() => {
    if (!loggedIn) return
    let timer
    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        logout()
        setIdleNotice(true)
      }, IDLE_LOGOUT_MS)
    }
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart']
    events.forEach((e) => window.addEventListener(e, reset, { passive: true, capture: true }))
    reset()
    return () => {
      clearTimeout(timer)
      events.forEach((e) => window.removeEventListener(e, reset, { capture: true }))
    }
  }, [loggedIn, logout])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/60 p-3 sm:p-8">
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
          onClick={close}
          aria-label="Close admin panel"
          className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
        {loggedIn ? (
          <Dashboard onLogout={logout} />
        ) : (
          <>
            {idleNotice && (
              <p role="status" className="mx-auto mt-4 max-w-sm rounded-xl bg-accent-soft p-3 text-sm text-navy-900">
                You were logged out after 10 minutes of inactivity. Please sign in again.
              </p>
            )}
            <LoginForm
              onSuccess={() => {
                setIdleNotice(false)
                setLoggedIn(true)
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}
