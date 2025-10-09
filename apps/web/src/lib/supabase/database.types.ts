export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          created_at: string
          subscription_tier: 'free' | 'premium'
          subscription_expires_at: string | null
        }
        Insert: {
          id: string
          email: string
          name: string
          avatar_url?: string | null
          created_at?: string
          subscription_tier?: 'free' | 'premium'
          subscription_expires_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          created_at?: string
          subscription_tier?: 'free' | 'premium'
          subscription_expires_at?: string | null
        }
      }
      campaigns: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          player_names: string[]
          dm_name: string
          created_at: string
          updated_at: string
          cover_image_url: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          player_names?: string[]
          dm_name: string
          created_at?: string
          updated_at?: string
          cover_image_url?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          player_names?: string[]
          dm_name?: string
          created_at?: string
          updated_at?: string
          cover_image_url?: string | null
        }
      }
      sessions: {
        Row: {
          id: string
          campaign_id: string
          title: string
          session_number: number
          recorded_at: string
          duration_seconds: number
          audio_url: string | null
          audio_size_bytes: number | null
          transcript: string | null
          summary: string | null
          key_moments: Json | null
          npcs_mentioned: string[] | null
          locations_mentioned: string[] | null
          loot_acquired: string[] | null
          status: 'recording' | 'processing' | 'completed' | 'failed'
          processing_started_at: string | null
          processing_completed_at: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          title: string
          session_number: number
          recorded_at?: string
          duration_seconds?: number
          audio_url?: string | null
          audio_size_bytes?: number | null
          transcript?: string | null
          summary?: string | null
          key_moments?: Json | null
          npcs_mentioned?: string[] | null
          locations_mentioned?: string[] | null
          loot_acquired?: string[] | null
          status?: 'recording' | 'processing' | 'completed' | 'failed'
          processing_started_at?: string | null
          processing_completed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          title?: string
          session_number?: number
          recorded_at?: string
          duration_seconds?: number
          audio_url?: string | null
          audio_size_bytes?: number | null
          transcript?: string | null
          summary?: string | null
          key_moments?: Json | null
          npcs_mentioned?: string[] | null
          locations_mentioned?: string[] | null
          loot_acquired?: string[] | null
          status?: 'recording' | 'processing' | 'completed' | 'failed'
          processing_started_at?: string | null
          processing_completed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shared_sessions: {
        Row: {
          id: string
          session_id: string
          share_token: string
          created_at: string
          expires_at: string | null
          view_count: number
        }
        Insert: {
          id?: string
          session_id: string
          share_token: string
          created_at?: string
          expires_at?: string | null
          view_count?: number
        }
        Update: {
          id?: string
          session_id?: string
          share_token?: string
          created_at?: string
          expires_at?: string | null
          view_count?: number
        }
      }
      usage_tracking: {
        Row: {
          id: string
          user_id: string
          month: string
          sessions_recorded: number
          ai_recaps_generated: number
          transcription_minutes: number
          storage_used_mb: number
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          sessions_recorded?: number
          ai_recaps_generated?: number
          transcription_minutes?: number
          storage_used_mb?: number
        }
        Update: {
          id?: string
          user_id?: string
          month?: string
          sessions_recorded?: number
          ai_recaps_generated?: number
          transcription_minutes?: number
          storage_used_mb?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_session_number: {
        Args: {
          campaign_uuid: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
