// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gnbkzxcxsbtoynbgopkn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYmt6eGN4c2J0b3luYmdvcGtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMjc2NjEsImV4cCI6MjA2MjYwMzY2MX0.yT4v7tBY24KZmlFlIEtmzPsQAYZYBSIabDFszeGzke0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
