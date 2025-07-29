import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  console.error('Missing Supabase environment variables. Check your .env file:', {
    VITE_SUPABASE_URL: supabaseUrl ? 'present' : 'missing',
    VITE_SUPABASE_PUBLISHABLE_KEY: supabasePublishableKey ? 'present' : 'missing'
  });
  throw new Error('Missing required Supabase configuration. Check the console for more details.');
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey); 