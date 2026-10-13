import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import { getSupabaseClient, isSupabaseConfigured } from './src/config/supabase.js'
import { sendEmailCode, sendPasswordResetEmail } from './src/services/email.js'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT || 5000)
const isProduction = process.env.NODE_ENV === 'production'
const JWT_SECRET = process.env.JWT_SECRET || (isProduction ? '' : 'dev-secret-change-me')
if (!JWT_SECRET) throw new Error('JWT_SECRET must be configured in production.')
if (isProduction && !isSupabaseConfigured) throw new Error('Supabase must be configured in production; in-memory storage is disabled.')

const FRONTEND_URL = String(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')
const allowedOrigins = String(process.env.ALLOWED_ORIGINS || (isProduction ? '' : 'http://localhost:5173,http://localhost:5000'))
  .split(',').map((origin) => origin.trim()).filter(Boolean)
if (isProduction && allowedOrigins.length === 0) throw new Error('ALLOWED_ORIGINS must list exact frontend origins in production.')

app.disable('x-powered-by')
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('Origin not allowed by CORS'))
  },
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json({ limit: '32kb' }))

const fallback = { users: [], pending: [], resets: [] }
const RATE_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT = 12
const rateBuckets = new Map()
app.use('/api/auth', (req, res, next) => {
  const key = `${req.ip || 'unknown'}:${req.path}`
  const now = Date.now()
  let entry = rateBuckets.get(key)
  if (!entry || now >= entry.resetAt) entry = { count: 0, resetAt: now + RATE_WINDOW_MS }
  entry.count += 1
  rateBuckets.set(key, entry)
  if (rateBuckets.size > 5000) {
    for (const [k, v] of rateBuckets) if (now >= v.resetAt) rateBuckets.delete(k)
  }
  res.setHeader('RateLimit-Limit', String(RATE_LIMIT))
  res.setHeader('RateLimit-Remaining', String(Math.max(0, RATE_LIMIT - entry.count)))
  if (entry.count > RATE_LIMIT) return res.status(429).json({ message: 'Too many requests. Please wait and try again.' })
  next()
})

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()
const sha256 = (value) => createHash('sha256').update(String(value)).digest('hex')
const generateCode = () => String(randomInt(100000, 1000000))
const generateToken = () => randomBytes(32).toString('hex')
const makeId = (prefix = 'id') => `${prefix}_${randomBytes(12).toString('hex')}`
const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
const validPassword = (password) => typeof password === 'string' && password.length >= 10 && password.length <= 128
const db = () => {
  const client = getSupabaseClient()
  if (client) return client
  if (isProduction) throw new Error('Persistent database is unavailable.')
  return null
}
const requirePersistentDb = (res) => {
  if (isProduction && !isSupabaseConfigured) {
    res.status(503).json({ message: 'The authentication database is not configured.' })
    return false
  }
  return true
}

async function findUserByEmail(email) {
  const normalized = normalizeEmail(email)
  const client = db()
  if (client) {
    const { data, error } = await client.from('tamp_users').select('*').eq('email', normalized).maybeSingle()
    if (error) throw error
    return data
  }
  return fallback.users.find((user) => normalizeEmail(user.email) === normalized) || null
}

async function saveUser(user) {
  const client = db()
  if (client) {
    const { data, error } = await client.from('tamp_users').insert({
      id: user.id, name: user.name, email: user.email, phone: user.phone,
      country: user.country, password_hash: user.passwordHash, role: user.role,
      created_at: user.createdAt, updated_at: user.createdAt,
    }).select('*').single()
    if (error) throw error
    return data
  }
  if (fallback.users.some((u) => u.email === user.email)) throw new Error('An account already exists for this email.')
  fallback.users.push(user)
  return user
}

async function savePending(email, code, registration) {
  const record = { email, code_hash: sha256(code), registration, attempts: 0, created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() }
  const client = db()
  if (client) {
    const { error } = await client.from('tamp_pending_registrations').upsert(record, { onConflict: 'email' })
    if (error) throw error
    return
  }
  fallback.pending = fallback.pending.filter((item) => item.email !== email)
  fallback.pending.push({ email, codeHash: record.code_hash, registration, attempts: 0, createdAt: Date.now(), expiresAt: Date.now() + 600000 })
}

async function getPending(email) {
  const client = db()
  if (client) {
    const { data, error } = await client.from('tamp_pending_registrations').select('*').eq('email', email).maybeSingle()
    if (error) throw error
    return data ? { email: data.email, codeHash: data.code_hash, registration: data.registration, attempts: data.attempts, expiresAt: new Date(data.expires_at).getTime() } : null
  }
  return fallback.pending.find((item) => item.email === email) || null
}

async function updatePending(email, patch) {
  const client = db()
  if (client) {
    const update = {}
    if (patch.attempts !== undefined) update.attempts = patch.attempts
    if (patch.remove) {
      const { error } = await client.from('tamp_pending_registrations').delete().eq('email', email)
      if (error) throw error
      return
    }
    const { error } = await client.from('tamp_pending_registrations').update(update).eq('email', email)
    if (error) throw error
    return
  }
  if (patch.remove) fallback.pending = fallback.pending.filter((item) => item.email !== email)
  else {
    const entry = fallback.pending.find((item) => item.email === email)
    if (entry && patch.attempts !== undefined) entry.attempts = patch.attempts
  }
}

async function saveReset(email, token) {
  const record = { token_hash: sha256(token), email, created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), used_at: null }
  const client = db()
  if (client) {
    const { error } = await client.from('tamp_password_resets').insert(record)
    if (error) throw error
    return
  }
  fallback.resets.push({ ...record, expiresAt: Date.now() + 1800000, used: false })
}

async function findReset(token) {
  const hash = sha256(token)
  const client = db()
  if (client) {
    const { data, error } = await client.from('tamp_password_resets').select('*').eq('token_hash', hash).is('used_at', null).maybeSingle()
    if (error) throw error
    if (!data || Date.now() >= new Date(data.expires_at).getTime()) return null
    return { email: data.email, tokenHash: hash }
  }
  const item = fallback.resets.find((r) => r.token_hash === hash && !r.used && Date.now() < r.expiresAt)
  return item ? { email: item.email, tokenHash: hash } : null
}

async function consumeReset(tokenHash) {
  const client = db()
  if (client) {
    const { error } = await client.from('tamp_password_resets').update({ used_at: new Date().toISOString() }).eq('token_hash', tokenHash).is('used_at', null)
    if (error) throw error
    return
  }
  const item = fallback.resets.find((r) => r.token_hash === tokenHash)
  if (item) item.used = true
}

async function updateUserPassword(email, passwordHash) {
  const client = db()
  if (client) {
    const { data, error } = await client.from('tamp_users').update({ password_hash: passwordHash, updated_at: new Date().toISOString() }).eq('email', email).select('id').maybeSingle()
    if (error) throw error
    return Boolean(data)
  }
  const user = fallback.users.find((item) => item.email === email)
  if (!user) return false
  user.passwordHash = passwordHash
  return true
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role || 'student', phone: user.phone || null, country: user.country || null }
}
function getAuthToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role || 'student' }, JWT_SECRET, { expiresIn: '2h', issuer: 'tamp-api', audience: 'tamp-app' })
}
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Authentication required.' })
  try {
    req.user = jwt.verify(token, JWT_SECRET, { issuer: 'tamp-api', audience: 'tamp-app' })
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}
async function requireAdmin(req, res, next) {
  if (!req.user || !['admin', 'super'].includes(req.user.role)) return res.status(403).json({ message: 'Administrator access required.' })
  try {
    const user = await findUserByEmail(req.user.email)
    if (!user || !['admin', 'super'].includes(user.role)) return res.status(403).json({ message: 'Administrator access required.' })
    req.admin = user
    next()
  } catch (error) { next(error) }
}

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'tamp-api', storage: isSupabaseConfigured ? 'persistent' : 'development-memory', emailConfigured: Boolean(process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID && process.env.EMAILJS_PUBLIC_KEY && process.env.EMAILJS_PRIVATE_KEY) }))

app.post('/api/auth/register', async (req, res, next) => {
  try {
    if (!requirePersistentDb(res)) return
    const { name, email, phone, country, password, acceptedTerms } = req.body || {}
    const normalizedEmail = normalizeEmail(email)
    if (!String(name || '').trim() || String(name).trim().length > 100 || !validEmail(normalizedEmail) || !password || !acceptedTerms) {
      return res.status(400).json({ message: 'Enter your name, a valid email, password and accept the Terms and Privacy Policy.' })
    }
    if (!validPassword(password)) return res.status(400).json({ message: 'Password must be 10–128 characters.' })
    if (phone && !/^\+?\d{10,15}$/.test(String(phone).replace(/[\s-]/g, ''))) return res.status(400).json({ message: 'Enter a valid phone number including country code.' })
    const existing = await findUserByEmail(normalizedEmail)
    if (existing) return res.status(409).json({ message: 'An account already exists for this email.' })
    const code = generateCode()
    const registration = {
      id: makeId('user'), name: String(name).trim(), email: normalizedEmail,
      phone: phone ? String(phone).trim() : null, country: String(country || '').slice(0, 80) || null,
      passwordHash: await bcrypt.hash(password, 12), role: 'student', createdAt: new Date().toISOString(),
    }
    await savePending(normalizedEmail, code, registration)
    try {
      await sendEmailCode({ email: normalizedEmail, code })
    } catch (error) {
      await updatePending(normalizedEmail, { remove: true })
      console.error('Email verification delivery failed:', error.message)
      return res.status(503).json({ message: 'We could not send your verification email. Please try again later.' })
    }
    return res.status(200).json({ success: true, message: 'Verification code sent to your email.', email: normalizedEmail, expiresInSeconds: 600 })
  } catch (error) {
    if (error?.message?.includes('EmailJS')) console.error('Email verification delivery failed:', error.message)
    next(error)
  }
})

app.post('/api/auth/verify', async (req, res, next) => {
  try {
    if (!requirePersistentDb(res)) return
    const email = normalizeEmail(req.body?.email)
    const code = String(req.body?.emailCode || '').trim()
    if (!validEmail(email) || !/^\d{6}$/.test(code)) return res.status(400).json({ message: 'Enter a valid email and 6-digit code.' })
    const pending = await getPending(email)
    if (!pending || Date.now() >= pending.expiresAt) {
      await updatePending(email, { remove: true })
      return res.status(400).json({ message: 'Verification code is invalid or expired. Please sign up again.' })
    }
    if ((pending.attempts || 0) >= 5) {
      await updatePending(email, { remove: true })
      return res.status(429).json({ message: 'Too many attempts. Please sign up again.' })
    }
    const expected = Buffer.from(pending.codeHash, 'hex')
    const received = Buffer.from(sha256(code), 'hex')
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      await updatePending(email, { attempts: (pending.attempts || 0) + 1 })
      return res.status(400).json({ message: 'Incorrect verification code.' })
    }
    if (await findUserByEmail(email)) {
      await updatePending(email, { remove: true })
      return res.status(409).json({ message: 'An account already exists for this email. Please log in.' })
    }
    const registration = pending.registration
    const user = { id: registration.id, name: registration.name, email: registration.email, phone: registration.phone, country: registration.country, passwordHash: registration.passwordHash, role: 'student', createdAt: registration.createdAt }
    const saved = await saveUser(user)
    await updatePending(email, { remove: true })
    return res.status(201).json({ success: true, message: 'Email verified successfully.', token: getAuthToken(saved), user: publicUser(saved) })
  } catch (error) { next(error) }
})

app.post('/api/auth/login', async (req, res, next) => {
  try {
    if (!requirePersistentDb(res)) return
    const email = normalizeEmail(req.body?.email), password = req.body?.password
    if (!validEmail(email) || typeof password !== 'string' || !password) return res.status(400).json({ message: 'Enter your email and password.' })
    const user = await findUserByEmail(email)
    const hash = user?.password_hash || user?.passwordHash
    if (!user || !hash || !(await bcrypt.compare(password, hash))) return res.status(401).json({ message: 'Invalid email or password.' })
    return res.json({ success: true, token: getAuthToken(user), user: publicUser(user) })
  } catch (error) { next(error) }
})

app.post('/api/auth/forgot', async (req, res, next) => {
  try {
    if (!requirePersistentDb(res)) return
    const email = normalizeEmail(req.body?.email)
    if (!validEmail(email)) return res.status(400).json({ message: 'Enter a valid email address.' })
    const user = await findUserByEmail(email)
    if (user) {
      const token = generateToken()
      await saveReset(email, token)
      const resetUrl = `${FRONTEND_URL}/site/reset-password.html?t=${encodeURIComponent(token)}`
      try { await sendPasswordResetEmail({ email, resetUrl }) }
      catch (error) {
        await consumeReset(sha256(token))
        console.error('Password reset email delivery failed:', error.message)
        return res.status(503).json({ message: 'We could not send the reset email. Please try again later.' })
      }
    }
    return res.json({ success: true, message: 'If an account exists, a password reset email will be sent.' })
  } catch (error) { next(error) }
})

app.post('/api/auth/reset', async (req, res, next) => {
  try {
    if (!requirePersistentDb(res)) return
    const token = String(req.body?.token || '')
    const password = req.body?.password
    if (!token || !validPassword(password)) return res.status(400).json({ message: 'Use a valid reset link and a password of 10–128 characters.' })
    const reset = await findReset(token)
    if (!reset) return res.status(400).json({ message: 'Reset link is invalid or expired. Request a new one.' })
    const updated = await updateUserPassword(reset.email, await bcrypt.hash(password, 12))
    if (!updated) return res.status(400).json({ message: 'The account could not be updated. Please contact support.' })
    await consumeReset(reset.tokenHash)
    return res.json({ success: true, message: 'Password updated. Please log in again.' })
  } catch (error) { next(error) }
})

app.post('/api/auth/logout', (req, res) => res.json({ success: true, message: 'Signed out on this device. Token expires within two hours.' }))

app.get('/api/me', requireAuth, async (req, res, next) => {
  try {
    const user = await findUserByEmail(req.user.email)
    if (!user) return res.status(404).json({ message: 'User not found.' })
    return res.json({ user: publicUser(user) })
  } catch (error) { next(error) }
})

app.post('/api/me/delete', requireAuth, async (req, res, next) => {
  try {
    if (!requirePersistentDb(res)) return
    const email = normalizeEmail(req.user.email)
    const password = req.body?.password
    if (typeof password !== 'string' || !password) return res.status(400).json({ message: 'Enter your current password to confirm account deletion.' })
    const user = await findUserByEmail(email)
    const hash = user?.password_hash || user?.passwordHash
    if (!user || !hash || !(await bcrypt.compare(password, hash))) return res.status(401).json({ message: 'The current password is incorrect.' })
    const client = db()
    if (client) {
      const { error: pendingError } = await client.from('tamp_pending_registrations').delete().eq('email', email)
      if (pendingError) throw pendingError
      const { error: resetError } = await client.from('tamp_password_resets').delete().eq('email', email)
      if (resetError) throw resetError
      const { error: userError } = await client.from('tamp_users').delete().eq('email', email)
      if (userError) throw userError
    } else {
      fallback.pending = fallback.pending.filter((entry) => entry.email !== email)
      fallback.resets = fallback.resets.filter((entry) => entry.email !== email)
      fallback.users = fallback.users.filter((entry) => entry.email !== email)
    }
    return res.json({ success: true, message: 'Your account has been deleted.' })
  } catch (error) { next(error) }
})

app.get('/api/courses', (req, res) => res.json({ courses: [{ id: 'data-analysis', name: 'Data Analysis', status: 'active' }] }))

app.get('/api/dashboard', requireAuth, async (req, res) => res.status(501).json({ message: 'The persistent learning-progress API is not configured yet. Student progress is not being fabricated.' }))

app.post('/api/enrollments', requireAuth, async (req, res) => res.status(501).json({ message: 'Enrollment is unavailable until payment/key verification is connected. No enrollment has been created.' }))

app.post('/api/admin/auth/login', async (req, res, next) => {
  try {
    if (!requirePersistentDb(res)) return
    const email = normalizeEmail(req.body?.email), password = req.body?.password
    const user = validEmail(email) ? await findUserByEmail(email) : null
    const hash = user?.password_hash || user?.passwordHash
    if (!user || !['admin', 'super'].includes(user.role) || !hash || !(await bcrypt.compare(String(password || ''), hash))) {
      return res.status(401).json({ message: 'Invalid admin credentials.' })
    }
    return res.json({ success: true, token: getAuthToken(user), user: publicUser(user) })
  } catch (error) { next(error) }
})

app.get('/api/admin/overview', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const client = db()
    if (!client) return res.status(503).json({ message: 'Persistent admin data is not configured.' })
    const { count, error } = await client.from('tamp_users').select('id', { count: 'exact', head: true })
    if (error) throw error
    return res.json({ students: count || 0, enrollments: null, pendingReview: null, revenue: null, note: 'Enrollment, review and revenue metrics are withheld until their persistent tables are implemented.' })
  } catch (error) { next(error) }
})

app.get('/api/admin/students', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const client = db()
    if (!client) return res.status(503).json({ message: 'Persistent admin data is not configured.' })
    const { data, error } = await client.from('tamp_users').select('id,name,email,role,created_at').order('created_at', { ascending: false }).limit(500)
    if (error) throw error
    return res.json({ students: (data || []).map((user) => ({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.created_at, status: 'active' })) })
  } catch (error) { next(error) }
})

app.use((req, res) => res.status(404).json({ message: 'API endpoint not found.' }))
app.use((error, req, res, next) => {
  console.error('Unhandled API error:', error?.message || error)
  if (res.headersSent) return next(error)
  return res.status(500).json({ message: 'An unexpected server error occurred.' })
})

app.listen(PORT, () => console.log(`TAMP API listening on port ${PORT}; storage=${isSupabaseConfigured ? 'persistent' : 'development-memory'}`))
