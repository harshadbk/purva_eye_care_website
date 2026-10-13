// Patient ratings: read approved reviews and submit new ones to the backend.
// Every call has a timeout and never throws, so a down server can't break the page.
import { API_URL } from './api'

const TIMEOUT_MS = 8000

async function request(path, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      signal: controller.signal,
    })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, data }
  } catch {
    return { ok: false, status: 0, data: {} }
  } finally {
    clearTimeout(timer)
  }
}

// Resolves to { average, count, reviews } or null when the backend can't be reached.
// Cached per limit, so the hero badge and the reviews section share one request.
// `limit` = how many reviews to return (the summary always covers all approved reviews).
const cache = new Map()
export function fetchReviews(limit = 30) {
  if (!cache.has(limit)) {
    cache.set(
      limit,
      request(`/reviews?limit=${limit}`).then((res) => {
        if (!res.ok) cache.delete(limit)
        return res.ok ? res.data : null
      }),
    )
  }
  return cache.get(limit)
}

// Resolves to 'ok' | 'too_many' | 'offline'. A successful post clears the cache so the
// new review shows up on the next fetch.
export async function submitReview(review) {
  const res = await request('/reviews', { method: 'POST', body: JSON.stringify(review) })
  if (res.ok) {
    cache.clear()
    return 'ok'
  }
  if (res.status === 429) return 'too_many'
  return 'offline'
}

export const stars = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating)
