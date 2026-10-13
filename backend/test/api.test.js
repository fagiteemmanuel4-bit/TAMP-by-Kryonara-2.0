import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'

process.env.NODE_ENV = 'production'
process.env.VERCEL = '1'
process.env.JWT_SECRET = ''
delete process.env.SUPABASE_URL
delete process.env.SUPABASE_SERVICE_ROLE_KEY
delete process.env.EMAILJS_SERVICE_ID
delete process.env.EMAILJS_PUBLIC_KEY
delete process.env.EMAILJS_PRIVATE_KEY
delete process.env.EMAILJS_VERIFICATION_TEMPLATE_ID
delete process.env.EMAILJS_RESET_TEMPLATE_ID
process.env.ALLOWED_ORIGINS = ''

const { default: app } = await import('../server.js')
let server
let baseUrl

before(async () => {
  server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
})

test('health endpoint reports incomplete production configuration without crashing', async () => {
  const response = await fetch(`${baseUrl}/api/health`)
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.ok, true)
  assert.equal(body.authReady, false)
  assert.equal(body.storage, 'unconfigured')
  assert.equal(body.emailConfigured, false)
})

test('catch-all path normalization accepts paths with and without /api prefix', async () => {
  const direct = await fetch(`${baseUrl}/api/health`)
  const normalized = await fetch(`${baseUrl}/health`)
  assert.equal(direct.status, 200)
  assert.equal(normalized.status, 200)
})

test('course catalogue does not advertise unimplemented courses', async () => {
  const response = await fetch(`${baseUrl}/api/courses`)
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.deepEqual(body.courses.map((course) => course.id), ['data-analysis'])
})

test('registration fails closed when production JWT/database configuration is missing', async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Student', email: 'student@example.com', password: 'StrongPass123', acceptedTerms: true }),
  })
  assert.equal(response.status, 503)
  const body = await response.json()
  assert.match(body.message, /JWT_SECRET/)
})
