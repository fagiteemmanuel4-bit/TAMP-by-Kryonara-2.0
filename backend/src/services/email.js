import dotenv from 'dotenv'

dotenv.config()

const EMAILJS_SEND_URL = 'https://api.emailjs.com/api/v1.0/email/send'
const REQUEST_TIMEOUT_MS = 10_000

function getEmailJsConfig() {
  const config = {
    serviceId: process.env.EMAILJS_SERVICE_ID,
    templateId: process.env.EMAILJS_TEMPLATE_ID,
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY,
  }

  const missing = Object.entries(config)
    .filter(([, value]) => !value || !value.trim())
    .map(([key]) => key)

  if (missing.length) {
    throw new Error(`Email delivery is not configured. Missing server environment values: ${missing.join(', ')}`)
  }

  return config
}

async function sendTemplateEmail(templateParams) {
  const { serviceId, templateId, publicKey, privateKey } = getEmailJsConfig()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(EMAILJS_SEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey,
        template_params: templateParams,
      }),
    })

    const responseText = await response.text()

    if (!response.ok) {
      // EmailJS returns a useful status message here. Keep it in server logs/errors,
      // but never log verification codes, reset tokens, or private keys.
      throw new Error(`EmailJS rejected the request (HTTP ${response.status}): ${responseText.slice(0, 500)}`)
    }

    return { ok: true, simulated: false }
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('EmailJS request timed out after 10 seconds.')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export function sendEmailCode({ email, code }) {
  return sendTemplateEmail({
    to_email: email,
    code,
  })
}

export function sendPasswordResetEmail({ email, resetUrl }) {
  return sendTemplateEmail({
    to_email: email,
    reset_url: resetUrl,
  })
}
