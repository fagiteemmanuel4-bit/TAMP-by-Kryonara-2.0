import dotenv from 'dotenv'

dotenv.config()

const emailjsBaseUrl = 'https://api.emailjs.com/api/v1.0/email/send'

export async function sendEmailCode({ email, code }) {
  const serviceId = process.env.EMAILJS_SERVICE_ID
  const templateId = process.env.EMAILJS_TEMPLATE_ID
  const publicKey = process.env.EMAILJS_PUBLIC_KEY
  const privateKey = process.env.EMAILJS_PRIVATE_KEY

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    console.log(`EmailJS not configured. Simulated verification code for ${email}: ${code}`)
    return { ok: true, simulated: true }
  }

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: privateKey,
    template_params: {
      to_email: email,
      code,
    },
  }

  const response = await fetch(emailjsBaseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const text = await response.text()

  if (!response.ok) {
    throw new Error(`EmailJS request failed: ${text}`)
  }

  return { ok: true, simulated: false, response: text }
}

export async function sendPasswordResetEmail({ email, resetUrl }) {
  const serviceId = process.env.EMAILJS_SERVICE_ID
  const templateId = process.env.EMAILJS_TEMPLATE_ID
  const publicKey = process.env.EMAILJS_PUBLIC_KEY
  const privateKey = process.env.EMAILJS_PRIVATE_KEY

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    console.log(`Reset email simulated for ${email}: ${resetUrl}`)
    return { ok: true, simulated: true }
  }

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: privateKey,
    template_params: {
      to_email: email,
      reset_url: resetUrl,
    },
  }

  const response = await fetch(emailjsBaseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Reset email error: ${text}`)
  }

  return { ok: true, simulated: false }
}
