// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

console.log('Environment check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabasePublishableKey,
  envKeys: Object.keys(import.meta.env)
})

if (!supabaseUrl || !supabasePublishableKey) {
  console.error('Missing Supabase environment variables. Check your .env file:', {
    VITE_SUPABASE_URL: supabaseUrl ? 'present' : 'missing',
    VITE_SUPABASE_PUBLISHABLE_KEY: supabasePublishableKey ? 'present' : 'missing'
  })
  throw new Error('Missing required Supabase configuration. Check the console for more details.')
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
