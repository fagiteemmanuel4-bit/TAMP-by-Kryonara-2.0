import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { getSupabaseClient, isSupabaseConfigured } from './src/config/supabase.js'
import { sendEmailCode, sendPasswordResetEmail } from './src/services/email.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev-secret-change-me')
if (!JWT_SECRET) throw new Error('JWT_SECRET must be configured in production.')
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

const allowedOrigins = String(process.env.ALLOWED_ORIGINS || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173,http://localhost:5000'))
  .split(',').map((origin) => origin.trim()).filter(Boolean)
if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  throw new Error('ALLOWED_ORIGINS must list the deployed frontend origin in production.')
}
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('Origin not allowed by CORS'))
  },
  credentials: true,
}))
app.use(express.json())

const fallbackDb = {
  users: [],
  verificationCodes: [],
  resetTokens: [],
}

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()
const generateCode = () => String(Math.floor(100000 + Math.random() * 900000))
const makeId = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

async function persistUser(user) {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseClient()
    try {
      const { error } = await supabase.from('users').upsert({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        country: user.country || null,
        nin_last_4: user.ninLast4 || null,
        password_hash: user.passwordHash,
        role: user.role,
        created_at: user.createdAt,
        updated_at: new Date().toISOString(),
      })

      if (!error) return user
    } catch (error) {
      console.warn('Supabase upsert failed, falling back to local memory store:', error.message)
    }
  }

  fallbackDb.users.push(user)
  return user
}

async function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email)

  if (isSupabaseConfigured) {
    const supabase = getSupabaseClient()
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', normalizedEmail)
        .maybeSingle()

      if (!error && data) {
        return data
      }
    } catch (error) {
      console.warn('Supabase lookup failed, falling back to local memory store:', error.message)
    }
  }

  return fallbackDb.users.find((user) => normalizeEmail(user.email) === normalizedEmail) || null
}

async function updateUserPassword(email, passwordHash) {
  const normalizedEmail = normalizeEmail(email)

  if (isSupabaseConfigured) {
    const supabase = getSupabaseClient()
    try {
      const { error } = await supabase
        .from('users')
        .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
        .eq('email', normalizedEmail)

      if (!error) return true
    } catch (error) {
      console.warn('Supabase password update failed, falling back to local memory store:', error.message)
    }
  }

  const user = fallbackDb.users.find((item) => normalizeEmail(item.email) === normalizedEmail)
  if (!user) return false
  user.passwordHash = passwordHash
  return true
}

function getAuthToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role || 'student',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

function requireAdmin(req, res, next) {
  if (!req.user || !['admin', 'super'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Administrator access required.' })
  }
  next()
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'TAMP backend is running',
    mode: isSupabaseConfigured ? 'supabase' : 'local-memory',
    phoneVerification: 'coming_soon',
  })
})

app.post('/api/auth/register', async (req, res) => {
  const { name, email, phone, country, nin, password, acceptedTerms } = req.body || {}

  if (!name || !email || !password || !acceptedTerms) {
    return res.status(400).json({ message: 'Name, email, password and acceptedTerms are required.' })
  }
  if (String(password).length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' })
  }

  const normalizedEmail = normalizeEmail(email)
  const existingUser = await findUserByEmail(normalizedEmail)
  if (existingUser) {
    return res.status(409).json({ message: 'An account already exists for this email.' })
  }

  // Remove expired/used pending codes so stale registrations cannot be verified.
  const now = Date.now()
  fallbackDb.verificationCodes = fallbackDb.verificationCodes.filter(
    (entry) => !entry.used && now - new Date(entry.createdAt).getTime() < 10 * 60 * 1000
  )

  const code = generateCode()
  const passwordHash = await bcrypt.hash(password, 12)
  const registration = {
    name: String(name).trim(),
    email: normalizedEmail,
    phone: phone ? String(phone).trim() : null,
    country: country ? String(country).trim() : null,
    ninLast4: nin ? String(nin).slice(-4) : null,
    passwordHash,
    role: 'student',
    createdAt: new Date().toISOString(),
  }

  try {
    const result = await sendEmailCode({ email: normalizedEmail, code })
    if (result.simulated) {
      throw new Error('EmailJS returned simulated delivery; refusing to claim that an email was sent.')
    }
  } catch (error) {
    console.error('Email verification delivery failed:', error.message)
    return res.status(503).json({
      success: false,
      code: 'EMAIL_DELIVERY_FAILED',
      message: 'We could not send your verification email. Please try again later or contact support.',
    })
  }

  fallbackDb.verificationCodes.push({
    email: normalizedEmail,
    code,
    registration,
    createdAt: new Date().toISOString(),
    used: false,
    attempts: 0,
  })

  return res.status(200).json({
    success: true,
    message: 'Verification code sent to your email.',
    email: normalizedEmail,
    expiresInSeconds: 600,
  })
})

app.post('/api/auth/verify', async (req, res) => {
  const { email, emailCode } = req.body || {}
  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail || !emailCode) {
    return res.status(400).json({ message: 'Email and verification code are required.' })
  }

  const pending = fallbackDb.verificationCodes.find(
    (entry) => entry.email === normalizedEmail && !entry.used
  )

  if (!pending || Date.now() - new Date(pending.createdAt).getTime() >= 10 * 60 * 1000) {
    return res.status(400).json({ message: 'Verification code is invalid or expired. Please sign up again.' })
  }

  pending.attempts = (pending.attempts || 0) + 1
  if (pending.attempts > 5) {
    pending.used = true
    return res.status(429).json({ message: 'Too many incorrect attempts. Please sign up again.' })
  }
  if (pending.code !== String(emailCode).trim()) {
    return res.status(400).json({ message: 'Incorrect verification code.' })
  }

  pending.used = true
  const existingUser = await findUserByEmail(normalizedEmail)
  if (existingUser) {
    const token = getAuthToken(existingUser)
    return res.status(200).json({
      success: true,
      message: 'This account is already registered.',
      token,
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role || 'student',
      },
    })
  }

  const registration = pending.registration
  if (!registration) {
    return res.status(500).json({ message: 'Registration details expired. Please sign up again.' })
  }

  const user = {
    id: makeId('user'),
    ...registration,
  }

  await persistUser(user)
  const token = getAuthToken(user)

  return res.status(201).json({
    success: true,
    message: 'Email verified successfully.',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' })
  }

  const user = await findUserByEmail(normalizeEmail(email))
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' })
  }

  const matches = await bcrypt.compare(password, user.passwordHash || user.password_hash)
  if (!matches) {
    return res.status(401).json({ message: 'Invalid credentials.' })
  }

  const token = getAuthToken(user)

  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'student',
    },
  })
})

app.post('/api/auth/forgot', async (req, res) => {
  const { email } = req.body || {}
  if (!email) return res.status(400).json({ message: 'Email is required.' })

  const normalizedEmail = normalizeEmail(email)
  const user = await findUserByEmail(normalizedEmail)

  const token = makeId('reset')
  fallbackDb.resetTokens.push({
    email: normalizedEmail,
    token,
    expiresAt: Date.now() + 30 * 60 * 1000,
    used: false,
  })

  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`

  try {
    await sendPasswordResetEmail({ email: normalizedEmail, resetUrl })
  } catch (error) {
    console.error('Password reset email failed:', error)
  }

  return res.json({
    success: true,
    message: 'If the email exists, a reset link has been sent.',
  })
})

app.post('/api/auth/reset', async (req, res) => {
  const { token, password } = req.body || {}

  if (!token || !password) {
    return res.status(400).json({ message: 'Token and password are required.' })
  }

  const resetEntry = fallbackDb.resetTokens.find(
    (entry) => entry.token === token && !entry.used && Date.now() < entry.expiresAt
  )

  if (!resetEntry) {
    return res.status(400).json({ message: 'Reset token is invalid or expired.' })
  }

  resetEntry.used = true
  const passwordHash = await bcrypt.hash(password, 10)
  const updated = await updateUserPassword(resetEntry.email, passwordHash)

  if (!updated) {
    return res.status(404).json({ message: 'User not found for reset.' })
  }

  return res.json({ success: true, message: 'Password updated successfully.' })
})

app.get('/api/me', requireAuth, async (req, res) => {
  const existing = await findUserByEmail(req.user.email)
  if (!existing) {
    return res.status(404).json({ message: 'User not found.' })
  }

  return res.json({
    user: {
      id: existing.id,
      name: existing.name,
      email: existing.email,
      role: existing.role || 'student',
      phone: existing.phone || null,
      country: existing.country || null,
    },
  })
})

app.get('/api/courses', requireAuth, async (req, res) => {
  res.json({
    courses: [
      { id: 'data-analysis', name: 'Data Analysis', status: 'active' },
      { id: 'ai-foundations', name: 'AI Foundations', status: 'coming-soon' },
    ],
  })
})

app.get('/api/dashboard', requireAuth, async (req, res) => {
  const user = await findUserByEmail(req.user.email)
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      progress: 38,
      streak: 12,
      course: 'Data Analysis',
    },
  })
})

app.post('/api/enrollments', requireAuth, async (req, res) => {
  const { cohortId, keyOrPaymentRef } = req.body || {}
  res.json({
    success: true,
    enrollment: {
      id: makeId('enrollment'),
      cohortId: cohortId || 'cohort-1',
      keyOrPaymentRef: keyOrPaymentRef || 'demo-ref',
      status: 'active',
    },
  })
})

app.post('/api/admin/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' })
  }

  const adminUser = await findUserByEmail(normalizeEmail(email))
  if (!adminUser || !['admin', 'super'].includes(adminUser.role) ||
      !(await bcrypt.compare(password, adminUser.passwordHash || adminUser.password_hash))) {
    return res.status(401).json({ message: 'Invalid admin credentials.' })
  }

  const token = getAuthToken(adminUser)
  return res.json({ success: true, token, user: { id: adminUser.id, email: adminUser.email, role: 'admin' } })
})

app.get('/api/admin/overview', requireAuth, requireAdmin, async (req, res) => {
  res.json({
    students: 1248,
    enrollments: 3412,
    pendingReview: 29,
    revenue: 87400,
    role: req.user.role || 'admin',
  })
})

app.get('/api/admin/students', requireAuth, requireAdmin, async (req, res) => {
  const users = fallbackDb.users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || 'student',
    status: 'active',
  }))

  res.json({ students: users })
})

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ message: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`TAMP backend listening on http://localhost:${PORT}`)
})
