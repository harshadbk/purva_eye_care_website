import { useEffect, useId, useState } from 'react'
import { CheckCircle2, MapPin, MessageCircle, Quote, Star } from 'lucide-react'
import Reveal from './Reveal'
import SectionHeading from './SectionHeading'
import { content } from '../data/content'
import { clinic, whatsappLink } from '../data/clinic'
import { fetchReviews, stars, submitReview } from '../lib/reviews'
import { useLanguage } from '../i18n/LanguageContext'

const EMPTY = { rating: 0, name: '', place: '', comment: '' }

export function useReviews(limit) {
  const [data, setData] = useState(undefined) // undefined = loading, null = backend unreachable
  useEffect(() => {
    let active = true
    fetchReviews(limit).then((d) => active && setData(d))
    return () => {
      active = false
    }
  }, [limit])
  return data
}

function StarPicker({ value, onChange, label, starsWord, describedBy }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div role="radiogroup" aria-label={label} aria-describedby={describedBy} className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} ${starsWord}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          className="flex size-11 items-center justify-center rounded-lg transition-transform hover:scale-110"
        >
          <Star className={`size-8 ${n <= shown ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}

export function ReviewCard({ review }) {
  const { lang, t } = useLanguage()
  const r = content.reviews
  const date = new Date(review.createdAt).toLocaleDateString(lang === 'en' ? 'en-IN' : 'mr-IN', { month: 'short', year: 'numeric' })
  const source = review.source && review.source !== 'website' ? r.sources[review.source] : null
  return (
    <li className="card flex flex-col p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-base font-bold text-accent" aria-hidden="true">
          {review.name.trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-navy-900">{review.name}</p>
          <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
            {review.place && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="size-3" aria-hidden="true" />
                {review.place} ·
              </span>
            )}
            <span>{date}</span>
            {source && <span>· {t(source)}</span>}
          </p>
        </div>
      </div>
      <p className="mt-3 text-lg tracking-wider text-amber-500" aria-label={`${review.rating} / 5`}>
        {stars(review.rating)}
      </p>
      {review.comment && (
        <p className="mt-2 flex-1 text-slate-700">
          <Quote className="mr-1 inline size-4 -translate-y-0.5 text-accent/60" aria-hidden="true" />
          {review.comment}
        </p>
      )}
    </li>
  )
}

export function RatingSummary({ data, showBars = false }) {
  const { t } = useLanguage()
  const r = content.reviews
  if (!data?.count) return null
  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-white p-5 shadow-card sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        <p className="text-5xl font-bold text-navy-900">{data.average.toFixed(1)}</p>
        <div>
          <p className="text-2xl tracking-wider text-amber-500" aria-hidden="true">
            {stars(Math.round(data.average))}
          </p>
          <p className="text-sm text-slate-600">
            {t(r.average)} · {data.count} {t(r.count)}
          </p>
        </div>
      </div>
      {showBars && data.distribution && (
        <ul className="grid flex-1 gap-1.5 sm:border-l sm:border-slate-100 sm:pl-5" aria-label={t(r.breakdown)}>
          {[5, 4, 3, 2, 1].map((n) => {
            const count = data.distribution[n] ?? 0
            return (
              <li key={n} className="flex items-center gap-2 text-sm">
                <span className="w-8 shrink-0 font-semibold text-navy-900">{n} ★</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <span className="block h-full rounded-full bg-amber-400" style={{ width: `${(count / data.count) * 100}%` }} />
                </span>
                <span className="w-8 shrink-0 text-right text-slate-500">{count}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function EmptyReviews() {
  const { t } = useLanguage()
  return (
    <div className="card flex min-h-40 flex-col items-center justify-center gap-2 p-8 text-center">
      <Star className="size-10 fill-amber-400 text-amber-400" aria-hidden="true" />
      <p className="text-lg font-semibold text-navy-900">{t(content.reviews.empty)}</p>
    </div>
  )
}

export function ReviewForm() {
  const { lang, t } = useLanguage()
  const r = content.reviews
  const uid = useId()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | ok | offline | too_many

  const set = (field, value) => {
    setValues((v) => ({ ...v, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const whatsappReview = whatsappLink(
    [
      `${t(r.whatsappIntro)}:`,
      `${stars(values.rating || 5)} (${values.rating || 5}/5)`,
      values.comment.trim(),
      `– ${values.name.trim()}${values.place.trim() ? `, ${values.place.trim()}` : ''}`,
    ]
      .filter(Boolean)
      .join('\n'),
  )

  const submit = async (e) => {
    e.preventDefault()
    const found = {}
    if (!values.rating) found.rating = 'rating'
    if (values.name.trim().length < 2) found.name = 'name'
    setErrors(found)
    if (Object.keys(found).length) return
    setStatus('sending')
    setStatus(
      await submitReview({ rating: values.rating, name: values.name.trim(), place: values.place.trim(), comment: values.comment.trim(), lang }),
    )
  }

  if (status === 'ok') {
    return (
      <div role="status" className="py-6 text-center">
        <CheckCircle2 className="mx-auto size-12 text-accent" aria-hidden="true" />
        <h3 className="mt-3 text-xl font-bold">{t(r.thanksTitle)}</h3>
        <p className="mt-2 text-slate-600">{t(r.thanksBody)}</p>
        {clinic.googleReviewUrl && (
          <a href={clinic.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-5">
            <Star className="size-5" aria-hidden="true" />
            {t(r.google)}
          </a>
        )}
      </div>
    )
  }

  const errorText = (field, text) =>
    errors[field] && (
      <p id={`${uid}-${field}-error`} className="mt-1 text-sm font-medium text-accent">
        {t(text)}
      </p>
    )

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <h3 className="text-xl font-bold">{t(r.formTitle)}</h3>

      <div>
        <p className="mb-1 text-sm font-semibold text-navy-900">{t(r.ratingLabel)}</p>
        <StarPicker
          value={values.rating}
          onChange={(n) => set('rating', n)}
          label={t(r.ratingLabel)}
          starsWord={t(r.stars)}
          describedBy={errors.rating ? `${uid}-rating-error` : undefined}
        />
        {errorText('rating', r.errors.rating)}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-name`} className="mb-1.5 block text-sm font-semibold text-navy-900">
            {t(r.name)}
          </label>
          <input
            id={`${uid}-name`}
            className="field-input"
            autoComplete="name"
            maxLength={60}
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? `${uid}-name-error` : undefined}
          />
          {errorText('name', r.errors.name)}
        </div>
        <div>
          <label htmlFor={`${uid}-place`} className="mb-1.5 block text-sm font-semibold text-navy-900">
            {t(r.place)}
          </label>
          <input
            id={`${uid}-place`}
            className="field-input"
            maxLength={40}
            placeholder={t(r.placePlaceholder)}
            value={values.place}
            onChange={(e) => set('place', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${uid}-comment`} className="mb-1.5 block text-sm font-semibold text-navy-900">
          {t(r.comment)}
        </label>
        <textarea
          id={`${uid}-comment`}
          rows={3}
          maxLength={600}
          placeholder={t(r.commentPlaceholder)}
          className="field-input resize-y"
          value={values.comment}
          onChange={(e) => set('comment', e.target.value)}
        />
      </div>

      {(status === 'offline' || status === 'too_many') && (
        <div role="alert" className="rounded-xl bg-accent-soft p-3 text-sm text-navy-900">
          <p>{t(status === 'offline' ? r.offlineBody : r.tooMany)}</p>
          {status === 'offline' && (
            <a href={whatsappReview} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-3 min-h-10 w-full text-sm">
              <MessageCircle className="size-4" aria-hidden="true" />
              {t(r.sendWhatsapp)}
            </a>
          )}
        </div>
      )}

      <button type="submit" disabled={status === 'sending'} className="btn btn-accent w-full">
        <Star className="size-5" aria-hidden="true" />
        {status === 'sending' ? t(r.sending) : t(r.submit)}
      </button>

      {clinic.googleReviewUrl && (
        <a href={clinic.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="text-center text-sm font-semibold text-accent hover:underline">
          {t(r.google)} →
        </a>
      )}
    </form>
  )
}

const PAGE_SIZE = 6
const STAR_FILTERS = [0, 5, 4, 3, 2, 1]

// Ratings section on the main page: summary with star breakdown, a star filter, all approved
// reviews (more load in place with "Show more"), and the form to add one.
export default function Reviews() {
  const { t } = useLanguage()
  const r = content.reviews
  const data = useReviews(200)
  const [filter, setFilter] = useState(0)
  const [shown, setShown] = useState(PAGE_SIZE)

  const all = data?.reviews ?? []
  const list = filter ? all.filter((rev) => rev.rating === filter) : all

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="section bg-gradient-to-b from-accent-soft/50 to-white">
      <div className="container-page">
        <SectionHeading id="reviews-title" eyebrow={t(r.eyebrow)} title={t(r.title)} intro={t(r.intro)} />

        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
          <Reveal className="flex flex-col gap-5">
            <RatingSummary data={data} showBars />

            {all.length > 0 && (
              <div role="group" aria-label={t(r.filterLabel)} className="flex flex-wrap gap-2">
                {STAR_FILTERS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={filter === n}
                    onClick={() => {
                      setFilter(n)
                      setShown(PAGE_SIZE)
                    }}
                    className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors ${
                      filter === n ? 'border-navy-700 bg-navy-700 text-white' : 'border-slate-200 bg-white text-navy-800 hover:bg-navy-50'
                    }`}
                  >
                    {n ? `${n} ★` : t(r.filterAll)}
                  </button>
                ))}
              </div>
            )}

            {list.length > 0 ? (
              <ul className="grid gap-4 sm:grid-cols-2">
                {list.slice(0, shown).map((review) => (
                  <ReviewCard key={review._id} review={review} />
                ))}
              </ul>
            ) : (
              <EmptyReviews />
            )}

            {list.length > shown && (
              <button type="button" onClick={() => setShown((n) => n + PAGE_SIZE)} className="btn btn-outline self-center">
                {t(r.showMore)} ({list.length - shown})
              </button>
            )}
          </Reveal>

          <Reveal delay={0.05} className="card p-5 sm:p-6 lg:sticky lg:top-28">
            <ReviewForm />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
