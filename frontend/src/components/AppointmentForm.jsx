import { useEffect, useId, useRef, useState } from 'react'
import { CalendarCheck, CheckCircle2, Info, MessageCircle, Phone } from 'lucide-react'
import Reveal from './Reveal'
import SectionHeading from './SectionHeading'
import { content } from '../data/content'
import { services } from '../data/services'
import { clinic, telLink } from '../data/clinic'
import { submitAppointment, todayISO, validateAppointment } from '../lib/booking'
import { useLanguage } from '../i18n/LanguageContext'

const EMPTY = { name: '', phone: '', date: '', time: '', reason: '', notes: '' }
const FIELD_ORDER = ['name', 'phone', 'date', 'time', 'reason']

function Field({ id, label, required, error, requiredText, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-navy-900">
        {label}
        {required && (
          <span className="text-brand-red" aria-hidden="true">
            {' '}*
          </span>
        )}
        {required && <span className="sr-only"> ({requiredText})</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-brand-red">
          {error}
        </p>
      )}
    </div>
  )
}

export default function AppointmentForm({ preselectedReason }) {
  const { lang, t } = useLanguage()
  const a = content.appointment
  const uid = useId()
  const formRef = useRef(null)
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [result, setResult] = useState(null)

  // A service card's "Enquire" button pre-fills the reason.
  useEffect(() => {
    if (preselectedReason?.id) {
      setValues((v) => ({ ...v, reason: preselectedReason.id }))
      setErrors((e) => ({ ...e, reason: undefined }))
      setResult(null)
    }
  }, [preselectedReason])

  const reasonOptions = [...services.map((s) => ({ id: s.id, label: t(s.title) })), { id: 'other', label: t(a.otherReason) }]

  const update = (field) => (e) => {
    const value = e.target.value
    setValues((v) => ({ ...v, [field]: value }))
    if (errors[field]) setErrors((err) => ({ ...err, [field]: undefined }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const found = validateAppointment(values)
    setErrors(found)
    const firstInvalid = FIELD_ORDER.find((f) => found[f])
    if (firstInvalid) {
      formRef.current?.querySelector(`[name="${firstInvalid}"]`)?.focus()
      return
    }

    const labels = {
      time: t(a.timeSlots.find((s) => s.id === values.time)),
      reason: reasonOptions.find((r) => r.id === values.reason)?.label ?? '',
    }
    const res = submitAppointment(values, labels, lang)
    window.open(res.url, '_blank', 'noopener,noreferrer')
    setResult(res)
  }

  const reset = () => {
    setValues(EMPTY)
    setErrors({})
    setResult(null)
  }

  const fid = (name) => `${uid}-${name}`
  const describedBy = (name) => (errors[name] ? `${fid(name)}-error` : undefined)
  const fieldProps = (name) => ({
    id: fid(name),
    name,
    value: values[name],
    onChange: update(name),
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': describedBy(name),
    className: 'field-input',
  })

  return (
    <section id="appointment" aria-labelledby="appointment-title" className="section bg-gradient-to-b from-white to-navy-50/60">
      <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div>
          <SectionHeading id="appointment-title" eyebrow={t(a.eyebrow)} title={t(a.title)} intro={t(a.intro)} align="left" />
          <Reveal className="flex gap-3 rounded-2xl border border-brand-red/20 bg-brand-red-soft p-4 text-sm text-navy-900">
            <Info className="mt-0.5 size-5 shrink-0 text-brand-red" aria-hidden="true" />
            <p className="font-medium">{t(a.notice)}</p>
          </Reveal>
          <Reveal className="mt-6 text-sm text-slate-600">
            <p>{t(a.orCall)}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {clinic.phones.map((p) => (
                <a key={p.tel} href={telLink(p)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 font-semibold text-navy-800 shadow-card hover:bg-navy-50">
                  <Phone className="size-4" aria-hidden="true" />
                  {p.display}
                </a>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.05} className="card p-5 sm:p-8">
          {result ? (
            <div role="status" className="py-6 text-center">
              <CheckCircle2 className="mx-auto size-14 text-whatsapp" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-bold">{t(a.successTitle)}</h3>
              <p className="mx-auto mt-2 max-w-md text-slate-600">{t(a.successBody)}</p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <a href={result.url} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                  <MessageCircle className="size-5" aria-hidden="true" />
                  {t(a.reopen)}
                </a>
                <button type="button" onClick={reset} className="btn btn-outline">
                  {t(a.newRequest)}
                </button>
              </div>
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field id={fid('name')} label={t(a.fields.name)} required requiredText={t(a.required)} error={errors.name && t(a.errors.name)}>
                  <input type="text" autoComplete="name" placeholder={t(a.placeholders.name)} maxLength={80} {...fieldProps('name')} />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field id={fid('phone')} label={t(a.fields.phone)} required requiredText={t(a.required)} error={errors.phone && t(a.errors.phone)}>
                  <input type="tel" inputMode="tel" autoComplete="tel" placeholder={t(a.placeholders.phone)} maxLength={16} {...fieldProps('phone')} />
                </Field>
              </div>

              <Field id={fid('date')} label={t(a.fields.date)} required requiredText={t(a.required)} error={errors.date && t(a.errors.date)}>
                <input type="date" min={todayISO()} {...fieldProps('date')} />
              </Field>

              <Field id={fid('time')} label={t(a.fields.time)} required requiredText={t(a.required)} error={errors.time && t(a.errors.time)}>
                <select {...fieldProps('time')}>
                  <option value="">{t(a.selectPrompt)}</option>
                  {a.timeSlots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {t(s)}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="sm:col-span-2">
                <Field id={fid('reason')} label={t(a.fields.reason)} required requiredText={t(a.required)} error={errors.reason && t(a.errors.reason)}>
                  <select {...fieldProps('reason')}>
                    <option value="">{t(a.selectPrompt)}</option>
                    {reasonOptions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field id={fid('notes')} label={t(a.fields.notes)}>
                  <textarea rows={3} placeholder={t(a.placeholders.notes)} maxLength={500} {...fieldProps('notes')} className="field-input resize-y" />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <button type="submit" className="btn btn-whatsapp w-full text-lg">
                  <CalendarCheck className="size-5" aria-hidden="true" />
                  {t(a.submit)}
                </button>
                <p className="mt-3 text-center text-xs text-slate-500">{t(a.notice)}</p>
              </div>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  )
}
