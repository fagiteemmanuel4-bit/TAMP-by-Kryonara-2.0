import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL?.trim()

// Supabase's current API-key model uses a server-only sb_secret_* key.
// Keep supporting the legacy service_role JWT for backwards compatibility.
const configuredServerKey =
  process.env.SUPABASE_SECRET_KEY?.trim() ||
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  ''

const keyIsPublishable = configuredServerKey.startsWith('sb_publishable_')
const supabaseServerKey = keyIsPublishable ? '' : configuredServerKey

export const supabase =
  supabaseUrl && supabaseServerKey
    ? createClient(supabaseUrl, supabaseServerKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseServerKey)
export const isSupabaseServerKeyMisconfigured = Boolean(supabaseUrl && keyIsPublishable)

export function getSupabaseClient() {
  return supabase
}
