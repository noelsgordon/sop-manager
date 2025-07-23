import React, { createContext } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

export const SupabaseContext = createContext<SupabaseClient | null>(null);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
} 