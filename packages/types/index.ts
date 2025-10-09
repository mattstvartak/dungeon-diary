// Database types
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
  subscription_tier: 'free' | 'premium'
  subscription_expires_at?: string
}

export interface Campaign {
  id: string
  user_id: string
  name: string
  description?: string
  player_names: string[]
  dm_name: string
  created_at: string
  updated_at: string
  cover_image_url?: string
}

export type SessionStatus = 'recording' | 'processing' | 'completed' | 'failed'

export interface Session {
  id: string
  campaign_id: string
  title: string
  session_number: number
  recorded_at: string
  duration_seconds: number

  // Audio
  audio_url?: string
  audio_size_bytes?: number

  // AI Generated Content
  transcript?: string
  summary?: string
  key_moments?: KeyMoment[]
  npcs_mentioned?: string[]
  locations_mentioned?: string[]
  loot_acquired?: string[]

  // Status
  status: SessionStatus
  processing_started_at?: string
  processing_completed_at?: string
  error_message?: string

  created_at: string
  updated_at: string
}

export interface KeyMoment {
  timestamp: number
  description: string
  type: 'combat' | 'roleplay' | 'discovery' | 'plot' | 'other'
}

export interface SharedSession {
  id: string
  session_id: string
  share_token: string
  created_at: string
  expires_at?: string
  view_count: number
}

export interface UsageTracking {
  id: string
  user_id: string
  month: string
  sessions_recorded: number
  ai_recaps_generated: number
  transcription_minutes: number
  storage_used_mb: number
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
