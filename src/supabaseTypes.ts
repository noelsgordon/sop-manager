// Placeholder Supabase types
// This file will be auto-generated once API keys are updated

export interface Database {
  public: {
    Tables: {
      // Types will be generated here
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
