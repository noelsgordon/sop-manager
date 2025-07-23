// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Environment check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  envKeys: Object.keys(import.meta.env)
})

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file:', {
    VITE_SUPABASE_URL: supabaseUrl ? 'present' : 'missing',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'present' : 'missing'
  })
  throw new Error('Missing required Supabase configuration. Check the console for more details.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
