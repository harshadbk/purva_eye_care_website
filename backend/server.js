
import crypto from 'node:crypto'
import dns from 'node:dns'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { MongoClient, ObjectId } from 'mongodb'

const envFile = fileURLToPath(new URL('.env', import.meta.url))

import dotenv from "dotenv";

if (existsSync(envFile)) {
    dotenv.config({ path: envFile });
}

const { MONGODB_URI, MONGODB_DB = 'purva_eye_care', ADMIN_USERNAME, ADMIN_PASSWORD, SESSION_SECRET, PORT = 5000 } = process.env

for (const [key, value] of Object.entries({ MONGODB_URI, ADMIN_USERNAME, ADMIN_PASSWORD, SESSION_SECRET })) {
  if (!value) {
    console.error(`Missing ${key} in .env`)
    process.exit(1)
  }
}

// Some Windows setups can't resolve Atlas SRV records with Node's resolver;
// DNS_SERVERS (e.g. "8.8.8.8,1.1.1.1") points it at public DNS instead.
if (process.env.DNS_SERVERS) dns.setServers(process.env.DNS_SERVERS.split(',').map((s) => s.trim()))

// The API must keep running even when MongoDB is unreachable: the website books through
// WhatsApp on its own, and admin login doesn't need the database. Routes that do need it
// answer 503 until the connection comes back; the connection is retried in the background.
const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
const db = client.db(MONGODB_DB)
const appointments = db.collection('appointments')
const reviews = db.collection('reviews')
let dbReady = false
const DB_RETRY_MS = 30 * 1000

function explainDbError(err) {
  const text = String(err?.message ?? err)
  console.error('\nCould not connect to MongoDB Atlas. The API keeps running; retrying in 30 s.')
  if (/alert internal error|alert number 80|Server selection timed out/i.test(text)) {
    console.error('Most likely this computer\'s IP address is not allowed in Atlas.')
    console.error('Fix: Atlas → Security → Network Access → Add IP Address → "Add Current IP Address".')
  } else if (/querySrv|ENOTFOUND|ECONNREFUSED/i.test(text)) {
    console.error('DNS lookup failed. Add DNS_SERVERS="8.8.8.8,1.1.1.1" to backend/.env.')
  } else if (/auth/i.test(text)) {
    console.error('Wrong MongoDB username or password in MONGODB_URI (backend/.env).')
  }
  console.error(`Details: ${text.split('\n')[0]}`)
}

async function connectDb() {
  try {
    await client.connect()
    await Promise.all([
      appointments.createIndex({ createdAt: -1 }),
      // Lets the website safely retry a booking without creating duplicates.
      appointments.createIndex({ clientId: 1 }, { unique: true, partialFilterExpression: { clientId: { $type: 'string' } } }),
      reviews.createIndex({ status: 1, createdAt: -1 }),
    ])
    dbReady = true
    console.log(`Connected to MongoDB database "${MONGODB_DB}"`)
  } catch (err) {
    dbReady = false
    explainDbError(err)
    setTimeout(connectDb, DB_RETRY_MS).unref()
  }
}
connectDb()

// Once connected, the driver reconnects by itself; these keep `dbReady` accurate meanwhile.
client.on('serverHeartbeatFailed', () => {
  dbReady = false
})
client.on('serverHeartbeatSucceeded', () => {
  if (!dbReady) console.log('MongoDB connection restored')
  dbReady = true
})

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '10kb' }))

const allowedOrigins = new Set(
  (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean)
    .flatMap((o) => {
      const m = o.match(/^https:\/\/(www\.)?(.+)$/)
      return m ? [`https://${m[2]}`, `https://www.${m[2]}`] : [o]
    }),
)
app.use((req, res, next) => {
  const origin = req.get('origin')
  if (origin && allowedOrigins.has(origin)) {
    res.set({
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '600',
      Vary: 'Origin',
    })
  }
  if (req.method === 'OPTIONS') return res.sendStatus(origin && allowedOrigins.has(origin) ? 204 : 403)
  next()
})

// ---------- validation (mirrors src/lib/booking.js) ----------
const TIME_SLOTS = new Set(['morning', 'afternoon', 'evening'])
const REASONS = new Set(['eye-exam', 'cataract', 'pterygium', 'lasik', 'children', 'squint', 'glaucoma', 'spectacles', 'other'])

function normalizePhone(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  return digits
}

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

function parseAppointment(body) {
  const doc = {
    name: str(body.name, 80),
    phone: normalizePhone(body.phone),
    date: str(body.date, 10),
    time: str(body.time, 20),
    reason: str(body.reason, 30),
    reasonLabel: str(body.reasonLabel, 120),
    notes: str(body.notes, 500),
    lang: body.lang === 'en' ? 'en' : 'mr',
  }
  const clientId = str(body.clientId, 64)
  if (/^[\w-]{8,64}$/.test(clientId)) doc.clientId = clientId
  const ok =
    doc.name.length >= 2 &&
    /^[6-9]\d{9}$/.test(doc.phone) &&
    /^\d{4}-\d{2}-\d{2}$/.test(doc.date) &&
    TIME_SLOTS.has(doc.time) &&
    REASONS.has(doc.reason)
  return ok ? doc : null
}

function parseReview(body) {
  const rating = Number(body.rating)
  const doc = {
    name: str(body.name, 60),
    rating,
    comment: str(body.comment, 600),
    lang: body.lang === 'en' ? 'en' : 'mr',
  }
  return doc.name.length >= 2 && Number.isInteger(rating) && rating >= 1 && rating <= 5 ? doc : null
}

// Where a review came from. 'website' = typed by the patient on the site; the others are
// genuine feedback the clinic received elsewhere and entered from the admin panel.
const REVIEW_SOURCES = new Set(['website', 'whatsapp', 'in-person', 'phone', 'google'])

// ---------- admin auth: signed, short-lived, revocable session ----------
// The website keeps the token only in memory, so the admin signs in every time the panel opens.
// The server also tracks live sessions: logging out (or restarting the server) kills the token
// immediately, and an unused session expires after 15 minutes of inactivity.
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000
const IDLE_TIMEOUT_MS = 15 * 60 * 1000
const sessions = new Map() // session id -> last activity time

const sign = (payload) => crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url')

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest()
  const hb = crypto.createHash('sha256').update(String(b)).digest()
  return crypto.timingSafeEqual(ha, hb)
}

function issueToken() {
  const sid = crypto.randomBytes(16).toString('base64url')
  sessions.set(sid, Date.now())
  const payload = Buffer.from(JSON.stringify({ sid, exp: Date.now() + TOKEN_TTL_MS })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

// Returns the session id of a valid token, or null.
function verifyToken(req) {
  const token = (req.get('authorization') ?? '').replace(/^Bearer /, '')
  const [payload, sig] = token.split('.')
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return null
  try {
    const { sid, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString())
    const lastSeen = sessions.get(sid)
    if (!lastSeen || exp <= Date.now() || Date.now() - lastSeen > IDLE_TIMEOUT_MS) {
      sessions.delete(sid)
      return null
    }
    return sid
  } catch {
    return null
  }
}

function requireAdmin(req, res, next) {
  const sid = verifyToken(req)
  if (!sid) return res.status(401).json({ error: 'unauthorized' })
  sessions.set(sid, Date.now())
  next()
}

// Drop expired sessions so the map can't grow forever.
setInterval(() => {
  const now = Date.now()
  for (const [sid, lastSeen] of sessions) if (now - lastSeen > IDLE_TIMEOUT_MS) sessions.delete(sid)
}, 60 * 1000).unref()

// Simple per-IP brute-force guard for the login route.
const failedLogins = new Map()
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const MAX_FAILED = 8

// Per-IP limit on public reviews so the page can't be flooded.
const reviewPosts = new Map()
const REVIEW_WINDOW_MS = 60 * 60 * 1000
const MAX_REVIEWS_PER_WINDOW = 3

function allowReview(ip) {
  const now = Date.now()
  const recent = (reviewPosts.get(ip) ?? []).filter((t) => now - t < REVIEW_WINDOW_MS)
  if (recent.length >= MAX_REVIEWS_PER_WINDOW) return false
  reviewPosts.set(ip, [...recent, now])
  return true
}

// ---------- routes ----------
// Express 4 does not forward rejected promises to the error handler on its own.
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next)

const requireDb = (_req, res, next) => (dbReady ? next() : res.status(503).json({ error: 'db_unavailable' }))

app.get('/api/health', (_req, res) => res.json({ ok: true, db: dbReady }))

app.post('/api/appointments', requireDb, wrap(async (req, res) => {
  const doc = parseAppointment(req.body ?? {})
  if (!doc) return res.status(400).json({ error: 'invalid' })
  const fields = { ...doc, status: 'pending', createdAt: new Date(), confirmedAt: null }
  if (doc.clientId) {
    // A retried request (same clientId) keeps the existing record instead of adding a duplicate.
    const result = await appointments.updateOne({ clientId: doc.clientId }, { $setOnInsert: fields }, { upsert: true })
    return res.status(result.upsertedCount ? 201 : 200).json({ ok: true })
  }
  const result = await appointments.insertOne(fields)
  res.status(201).json({ id: result.insertedId })
}))

// Public: approved reviews and the average rating.
app.get('/api/reviews', requireDb, wrap(async (req, res) => {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 30, 1), 200)
  const [list, groups] = await Promise.all([
    reviews
      .find({ status: 'approved' }, { projection: { name: 1, rating: 1, comment: 1, place: 1, source: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray(),
    reviews.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: '$rating', count: { $sum: 1 } } }]).toArray(),
  ])
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const g of groups) if (distribution[g._id] !== undefined) distribution[g._id] = g.count
  const count = Object.values(distribution).reduce((a, b) => a + b, 0)
  const total = Object.entries(distribution).reduce((sum, [stars, n]) => sum + stars * n, 0)
  res.set('Cache-Control', 'public, max-age=60')
  res.json({ average: count ? Math.round((total / count) * 10) / 10 : 0, count, distribution, reviews: list })
}))

// New reviews appear on the site straight away; the clinic can hide or delete them in the admin panel.
app.post('/api/reviews', requireDb, wrap(async (req, res) => {
  const doc = parseReview(req.body ?? {})
  if (!doc) return res.status(400).json({ error: 'invalid' })
  if (!allowReview(req.ip)) return res.status(429).json({ error: 'too_many_reviews' })
  await reviews.insertOne({ ...doc, place: str(req.body.place, 40), source: 'website', status: 'approved', createdAt: new Date() })
  res.status(201).json({ ok: true })
}))

app.post('/api/admin/login', (req, res) => {
  const ip = req.ip
  const entry = failedLogins.get(ip)
  if (entry && entry.count >= MAX_FAILED && Date.now() - entry.first < LOGIN_WINDOW_MS) {
    return res.status(429).json({ error: 'too_many_attempts' })
  }
  const { username, password } = req.body ?? {}
  if (safeEqual(username ?? '', ADMIN_USERNAME) && safeEqual(password ?? '', ADMIN_PASSWORD)) {
    failedLogins.delete(ip)
    return res.json({ token: issueToken() })
  }
  const fresh = !entry || Date.now() - entry.first >= LOGIN_WINDOW_MS
  failedLogins.set(ip, fresh ? { count: 1, first: Date.now() } : { ...entry, count: entry.count + 1 })
  res.status(401).json({ error: 'invalid_credentials' })
})

app.post('/api/admin/logout', (req, res) => {
  const sid = verifyToken(req)
  if (sid) sessions.delete(sid)
  res.json({ ok: true })
})

app.get('/api/admin/appointments', requireAdmin, requireDb, wrap(async (_req, res) => {
  const list = await appointments.find({}).sort({ createdAt: -1 }).limit(500).toArray()
  const [total, pending, confirmed] = await Promise.all([
    appointments.countDocuments({}),
    appointments.countDocuments({ status: 'pending' }),
    appointments.countDocuments({ status: 'confirmed' }),
  ])
  res.json({ stats: { total, pending, confirmed }, appointments: list })
}))

const APPOINTMENT_STATUSES = new Set(['pending', 'confirmed'])

async function setAppointmentStatus(id, status) {
  return appointments.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { status, confirmedAt: status === 'confirmed' ? new Date() : null } },
    { returnDocument: 'after' },
  )
}

app.patch('/api/admin/appointments/:id/confirm', requireAdmin, requireDb, wrap(async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'invalid_id' })
  const result = await setAppointmentStatus(req.params.id, 'confirmed')
  if (!result) return res.status(404).json({ error: 'not_found' })
  res.json(result)
}))

app.patch('/api/admin/appointments/:id/status', requireAdmin, requireDb, wrap(async (req, res) => {
  const status = req.body?.status
  if (!ObjectId.isValid(req.params.id) || !APPOINTMENT_STATUSES.has(status)) return res.status(400).json({ error: 'invalid' })
  const result = await setAppointmentStatus(req.params.id, status)
  if (!result) return res.status(404).json({ error: 'not_found' })
  res.json(result)
}))

app.get('/api/admin/reviews', requireAdmin, requireDb, wrap(async (_req, res) => {
  res.json({ reviews: await reviews.find({}).sort({ createdAt: -1 }).limit(500).toArray() })
}))

const REVIEW_STATUSES = new Set(['pending', 'approved', 'hidden'])

// The clinic enters real feedback it received on WhatsApp, by phone or in person.
app.post('/api/admin/reviews', requireAdmin, requireDb, wrap(async (req, res) => {
  const doc = parseReview(req.body ?? {})
  const source = req.body?.source
  if (!doc || !REVIEW_SOURCES.has(source) || source === 'website') return res.status(400).json({ error: 'invalid' })
  const review = { ...doc, place: str(req.body.place, 40), source, status: 'approved', createdAt: new Date() }
  const result = await reviews.insertOne(review)
  res.status(201).json({ ...review, _id: result.insertedId })
}))

app.patch('/api/admin/reviews/:id', requireAdmin, requireDb, wrap(async (req, res) => {
  const status = req.body?.status
  if (!ObjectId.isValid(req.params.id) || !REVIEW_STATUSES.has(status)) return res.status(400).json({ error: 'invalid' })
  const result = await reviews.findOneAndUpdate({ _id: new ObjectId(req.params.id) }, { $set: { status } }, { returnDocument: 'after' })
  if (!result) return res.status(404).json({ error: 'not_found' })
  res.json(result)
}))

app.delete('/api/admin/reviews/:id', requireAdmin, requireDb, wrap(async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'invalid_id' })
  const result = await reviews.deleteOne({ _id: new ObjectId(req.params.id) })
  if (!result.deletedCount) return res.status(404).json({ error: 'not_found' })
  res.json({ ok: true })
}))


const ENDPOINTS = [
  ['GET', '/api/health', 'Server and database status', 'public'],
  ['POST', '/api/appointments', 'Save an appointment request', 'public'],
  ['GET', '/api/reviews?limit=30', 'Approved reviews, average and star breakdown', 'public'],
  ['POST', '/api/reviews', 'Submit a review (shown right away)', 'public'],
  ['POST', '/api/admin/login', 'Admin login, returns a short-lived token', 'public'],
  ['POST', '/api/admin/logout', 'End the admin session immediately', 'admin'],
  ['GET', '/api/admin/appointments', 'All appointment requests', 'admin'],
  ['PATCH', '/api/admin/appointments/:id/confirm', 'Mark an appointment confirmed', 'admin'],
  ['PATCH', '/api/admin/appointments/:id/status', 'Set status: pending or confirmed', 'admin'],
  ['GET', '/api/admin/reviews', 'All reviews, including waiting and hidden', 'admin'],
  ['POST', '/api/admin/reviews', 'Add feedback received on WhatsApp / phone / in person', 'admin'],
  ['PATCH', '/api/admin/reviews/:id', 'Approve or hide a review', 'admin'],
  ['DELETE', '/api/admin/reviews/:id', 'Delete a review', 'admin'],
]

const escapeHtml = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

app.get('/', wrap(async (req, res) => {
  if (!req.accepts('html')) return res.json({ ok: true, service: 'purva-eye-care-api', db: dbReady })
  let stats = null
  if (dbReady) {
    try {
      const [appts, pendingAppts, approved, waiting, [avg]] = await Promise.all([
        appointments.countDocuments({}),
        appointments.countDocuments({ status: 'pending' }),
        reviews.countDocuments({ status: 'approved' }),
        reviews.countDocuments({ status: 'pending' }),
        reviews.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: null, a: { $avg: '$rating' } } }]).toArray(),
      ])
      stats = { appts, pendingAppts, approved, waiting, average: avg ? avg.a.toFixed(1) : '–' }
    } catch {
      stats = null
    }
  }
  const card = (label, value) => `<div class="card"><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>`
  const rows = ENDPOINTS.map(
    ([method, path, desc, access]) =>
      `<tr><td><code class="m ${method.toLowerCase()}">${method}</code></td><td><code>${escapeHtml(path)}</code></td><td>${escapeHtml(desc)}</td><td><span class="tag ${access}">${access}</span></td></tr>`,
  ).join('')
  res.type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Purva Eye Care API</title><style>
:root{--bg:#f5f8fd;--fg:#111f4d;--muted:#5b6785;--card:#fff;--line:#dfe6f3;--accent:#0a66c2;--ok:#128c4a;--bad:#b45309}
@media (prefers-color-scheme:dark){:root{--bg:#0b1533;--fg:#e8eefc;--muted:#9fb0d6;--card:#13204a;--line:#24356b}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.6 system-ui,'Segoe UI',sans-serif}
main{max-width:960px;margin:0 auto;padding:32px 16px}h1{margin:0 0 4px;font-size:24px}p{color:var(--muted);margin:0 0 20px}
.status{display:inline-block;padding:4px 12px;border-radius:99px;font-weight:600;color:#fff;background:${dbReady ? 'var(--ok)' : 'var(--bad)'}}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:20px 0 28px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px}.card span{display:block;font-size:12px;text-transform:uppercase;color:var(--muted)}.card b{font-size:26px}
.table{overflow-x:auto;background:var(--card);border:1px solid var(--line);border-radius:14px}table{width:100%;border-collapse:collapse;min-width:620px}
td,th{padding:10px 12px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}tr:last-child td{border-bottom:0}th{font-size:12px;text-transform:uppercase;color:var(--muted)}
code{font:13px ui-monospace,Consolas,monospace}.m{font-weight:700}.get{color:var(--accent)}.post{color:var(--ok)}.patch{color:var(--bad)}.delete{color:#c2410c}
.tag{font-size:12px;padding:2px 8px;border-radius:99px;border:1px solid var(--line)}.tag.admin{background:var(--accent);color:#fff;border-color:transparent}
a{color:var(--accent)}</style></head><body><main>
<h1>Purva Eye Care API</h1><p>Backend for the clinic website. Patient details are only visible in the website's admin panel.</p>
<span class="status">${dbReady ? 'Database connected' : 'Database offline – retrying every 30 s (WhatsApp booking unaffected)'}</span>
${stats ? `<div class="grid">${card('Appointments', stats.appts)}${card('Pending', stats.pendingAppts)}${card('Reviews shown', stats.approved)}${card('Reviews waiting', stats.waiting)}${card('Average rating', stats.average)}</div>` : '<div style="height:24px"></div>'}
<div class="table"><table><thead><tr><th>Method</th><th>Endpoint</th><th>What it does</th><th>Access</th></tr></thead><tbody>${rows}</tbody></table></div>
<p style="margin-top:16px">Try: <a href="/api/health">/api/health</a> · <a href="/api/reviews">/api/reviews</a></p>
</main></body></html>`)
}))
app.use((_req, res) => res.status(404).json({ error: 'not_found' }))

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'server_error' })
})

app
  .listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
  .on('error', (err) => {
    if (err.code !== 'EADDRINUSE') throw err
    console.error(`\nPort ${PORT} is already in use: the backend is probably already running in another terminal.`)
    console.error('Use that one, stop it with Ctrl+C, or set a different PORT in backend/.env.')
    process.exit(1)
  })
