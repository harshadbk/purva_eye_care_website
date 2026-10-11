// Purva Eye Care API: stores appointment requests in MongoDB and serves the admin panel's data.
// Runs separately from the website (../frontend).
// Secrets come from .env (see .env.example); nothing here is sent to the browser.
import crypto from 'node:crypto'
import dns from 'node:dns'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { MongoClient, ObjectId } from 'mongodb'

// Load backend/.env no matter how or where the server is started (`node server.js`,
// npm scripts, another folder). Hosts without a .env file use their own env settings.
const envFile = fileURLToPath(new URL('.env', import.meta.url))
if (existsSync(envFile)) process.loadEnvFile(envFile)

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

const client = new MongoClient(MONGODB_URI)
try {
  await client.connect()
} catch (err) {
  const text = String(err?.message ?? err)
  console.error('\nCould not connect to MongoDB Atlas.')
  if (/alert internal error|alert number 80|Server selection timed out/i.test(text)) {
    console.error('Most likely this computer\'s IP address is not allowed in Atlas.')
    console.error('Fix: Atlas → Security → Network Access → Add IP Address → "Add Current IP Address".')
  } else if (/querySrv|ENOTFOUND|ECONNREFUSED/i.test(text)) {
    console.error('DNS lookup failed. Add DNS_SERVERS="8.8.8.8,1.1.1.1" to backend/.env.')
  } else if (/auth/i.test(text)) {
    console.error('Wrong MongoDB username or password in MONGODB_URI (backend/.env).')
  }
  console.error(`\nDetails: ${text.split('\n')[0]}`)
  process.exit(1)
}
const appointments = client.db(MONGODB_DB).collection('appointments')
await appointments.createIndex({ createdAt: -1 })
console.log(`Connected to MongoDB database "${MONGODB_DB}"`)

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '10kb' }))

// CORS: only the website's own address(es) may call this API.
// CORS_ORIGIN is a comma-separated list, e.g. "https://purvaeyecare.in,http://localhost:5173".
const allowedOrigins = new Set((process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((o) => o.trim()).filter(Boolean))
app.use((req, res, next) => {
  const origin = req.get('origin')
  if (origin && allowedOrigins.has(origin)) {
    res.set({
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
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
  const ok =
    doc.name.length >= 2 &&
    /^[6-9]\d{9}$/.test(doc.phone) &&
    /^\d{4}-\d{2}-\d{2}$/.test(doc.date) &&
    TIME_SLOTS.has(doc.time) &&
    REASONS.has(doc.reason)
  return ok ? doc : null
}

// ---------- admin auth: signed, expiring token ----------
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000

const sign = (payload) => crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url')

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest()
  const hb = crypto.createHash('sha256').update(String(b)).digest()
  return crypto.timingSafeEqual(ha, hb)
}

function issueToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

function requireAdmin(req, res, next) {
  const token = (req.get('authorization') ?? '').replace(/^Bearer /, '')
  const [payload, sig] = token.split('.')
  if (payload && sig && safeEqual(sig, sign(payload))) {
    try {
      if (JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now()) return next()
    } catch {
      // fall through to 401
    }
  }
  res.status(401).json({ error: 'unauthorized' })
}

// Simple per-IP brute-force guard for the login route.
const failedLogins = new Map()
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const MAX_FAILED = 8

// ---------- routes ----------
// Express 4 does not forward rejected promises to the error handler on its own.
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next)

app.post('/api/appointments', wrap(async (req, res) => {
  const doc = parseAppointment(req.body ?? {})
  if (!doc) return res.status(400).json({ error: 'invalid' })
  const result = await appointments.insertOne({ ...doc, status: 'pending', createdAt: new Date(), confirmedAt: null })
  res.status(201).json({ id: result.insertedId })
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

app.get('/api/admin/appointments', requireAdmin, wrap(async (_req, res) => {
  const list = await appointments.find({}).sort({ createdAt: -1 }).limit(500).toArray()
  const [total, pending, confirmed] = await Promise.all([
    appointments.countDocuments({}),
    appointments.countDocuments({ status: 'pending' }),
    appointments.countDocuments({ status: 'confirmed' }),
  ])
  res.json({ stats: { total, pending, confirmed }, appointments: list })
}))

app.patch('/api/admin/appointments/:id/confirm', requireAdmin, wrap(async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'invalid_id' })
  const result = await appointments.findOneAndUpdate(
    { _id: new ObjectId(req.params.id) },
    { $set: { status: 'confirmed', confirmedAt: new Date() } },
    { returnDocument: 'after' },
  )
  if (!result) return res.status(404).json({ error: 'not_found' })
  res.json(result)
}))

app.get('/', (_req, res) => res.json({ ok: true, service: 'purva-eye-care-api' }))
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
