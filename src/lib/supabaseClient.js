import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabaseConfigurationError = !url || !publishableKey
  ? 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.'
  : null

// Only the project URL and publishable/anon key belong in browser code.
export const supabase = supabaseConfigurationError
  ? null
  : createClient(url, publishableKey)
