import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string | null
          avatar_url: string | null
          weight_goal: number | null
          current_weight: number | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          avatar_url?: string | null
          weight_goal?: number | null
          current_weight?: number | null
        }
        Update: {
          username?: string | null
          avatar_url?: string | null
          weight_goal?: number | null
          current_weight?: number | null
        }
      }
      activities: {
        Row: {
          id: string
          user_id: string
          type: string
          name: string
          duration_min: number
          calories_burned: number
          date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          type: string
          name: string
          duration_min: number
          calories_burned: number
          date: string
          notes?: string | null
        }
        Update: {
          type?: string
          name?: string
          duration_min?: number
          calories_burned?: number
          date?: string
          notes?: string | null
        }
      }
    }
  }
}
