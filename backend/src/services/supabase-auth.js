import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL?.trim()
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '').trim()

export const isSupabaseOtpConfigured = Boolean(supabaseUrl && supabaseAnonKey)

const authClient = isSupabaseOtpConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  : null

function requireAuthClient() {
  if (!authClient) {
    throw new Error('Supabase email OTP is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY on the backend host.')
  }
  return authClient
}

export async function sendSignupOtp({ email, password, metadata }) {
  const { data, error } = await requireAuthClient().auth.signUp({
    email,
    password,
    options: { data: metadata || {} },
  })
  if (error) throw error
  if (!data?.user) throw new Error('Supabase did not create a pending authentication user.')
  // With email confirmation enabled, Supabase sends its email confirmation OTP.
  // The Supabase Auth email template must render {{ .Token }}, never {{ .ConfirmationURL }}.
  return { ok: true }
}

export async function resendSignupOtp(email) {
  const { error } = await requireAuthClient().auth.resend({ type: 'signup', email })
  if (error) throw error
  return { ok: true }
}

export async function verifySignupOtp({ email, token }) {
  const { data, error } = await requireAuthClient().auth.verifyOtp({ email, token, type: 'signup' })
  if (error) throw error
  if (!data?.user?.email_confirmed_at && !data?.user?.confirmed_at) {
    throw new Error('Supabase did not confirm the email address.')
  }
  return { ok: true }
}
