
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://moryseqxhexfoewrlxtm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vcnlzZXF4aGV4Zm9ld3JseHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2ODA4MDQsImV4cCI6MjA0OTI1NjgwNH0.fHNk3IG6Hd9Y-GtQQgJ2Bb_L-F1hbSQMkZT_WmP_w'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      feedbacks: {
        Row: {
          id: string
          user_id: string
          username: string
          sender_email: string
          sender_name: string | null
          subject: string | null
          raw_json: any
          average_rating: number | null
          feedback_summary: string | null
          processed_at: string | null
          received_at: string
        }
        Insert: {
          id?: string
          user_id: string
          username: string
          sender_email: string
          sender_name?: string | null
          subject?: string | null
          raw_json: any
          average_rating?: number | null
          feedback_summary?: string | null
          processed_at?: string | null
          received_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string
          sender_email?: string
          sender_name?: string | null
          subject?: string | null
          raw_json?: any
          average_rating?: number | null
          feedback_summary?: string | null
          processed_at?: string | null
          received_at?: string
        }
      }
      current_issues: {
        Row: {
          id: string
          username: string
          issue_title: string
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          issue_title: string
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          issue_title?: string
          created_at?: string
        }
      }
    }
  }
}
