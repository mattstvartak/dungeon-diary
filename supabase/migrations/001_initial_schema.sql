-- Dungeon Diary Initial Schema
-- This migration creates all the necessary tables for the Dungeon Diary application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  player_names TEXT[] NOT NULL DEFAULT '{}',
  dm_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cover_image_url TEXT
);

-- Enable Row Level Security
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Users can only see their own campaigns
CREATE POLICY "Users can view own campaigns" ON public.campaigns
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own campaigns
CREATE POLICY "Users can insert own campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own campaigns
CREATE POLICY "Users can update own campaigns" ON public.campaigns
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own campaigns
CREATE POLICY "Users can delete own campaigns" ON public.campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- Sessions table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  session_number INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds INTEGER NOT NULL DEFAULT 0,

  -- Audio
  audio_url TEXT,
  audio_size_bytes BIGINT,

  -- AI Generated Content
  transcript TEXT,
  summary TEXT,
  key_moments JSONB,
  npcs_mentioned TEXT[] DEFAULT '{}',
  locations_mentioned TEXT[] DEFAULT '{}',
  loot_acquired TEXT[] DEFAULT '{}',

  -- Status
  status TEXT NOT NULL DEFAULT 'recording' CHECK (status IN ('recording', 'processing', 'completed', 'failed')),
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique session numbers per campaign
  UNIQUE(campaign_id, session_number)
);

-- Create index for faster queries
CREATE INDEX sessions_campaign_id_idx ON public.sessions(campaign_id);
CREATE INDEX sessions_status_idx ON public.sessions(status);

-- Enable Row Level Security
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Users can view sessions from their campaigns
CREATE POLICY "Users can view own sessions" ON public.sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = sessions.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Users can insert sessions to their campaigns
CREATE POLICY "Users can insert own sessions" ON public.sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = sessions.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON public.sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = sessions.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions" ON public.sessions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = sessions.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Shared Sessions table (for player access)
CREATE TABLE public.shared_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER NOT NULL DEFAULT 0
);

-- Create index for faster token lookups
CREATE INDEX shared_sessions_token_idx ON public.shared_sessions(share_token);

-- Enable Row Level Security
ALTER TABLE public.shared_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view shared session links for their sessions
CREATE POLICY "Users can view own shared sessions" ON public.shared_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      JOIN public.campaigns ON campaigns.id = sessions.campaign_id
      WHERE sessions.id = shared_sessions.session_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Anyone can view shared sessions with valid token (for public access)
CREATE POLICY "Anyone can view with token" ON public.shared_sessions
  FOR SELECT USING (true);

-- Users can create shared session links for their sessions
CREATE POLICY "Users can create shared sessions" ON public.shared_sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      JOIN public.campaigns ON campaigns.id = sessions.campaign_id
      WHERE sessions.id = shared_sessions.session_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Users can delete their shared session links
CREATE POLICY "Users can delete shared sessions" ON public.shared_sessions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      JOIN public.campaigns ON campaigns.id = sessions.campaign_id
      WHERE sessions.id = shared_sessions.session_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Usage Tracking table (for billing)
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  sessions_recorded INTEGER NOT NULL DEFAULT 0,
  ai_recaps_generated INTEGER NOT NULL DEFAULT 0,
  transcription_minutes INTEGER NOT NULL DEFAULT 0,
  storage_used_mb FLOAT NOT NULL DEFAULT 0,

  -- Ensure one record per user per month
  UNIQUE(user_id, month)
);

-- Create index for faster queries
CREATE INDEX usage_tracking_user_month_idx ON public.usage_tracking(user_id, month);

-- Enable Row Level Security
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Users can only view their own usage
CREATE POLICY "Users can view own usage" ON public.usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-increment session numbers
CREATE OR REPLACE FUNCTION get_next_session_number(campaign_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(session_number), 0) + 1 INTO next_number
  FROM public.sessions
  WHERE campaign_id = campaign_uuid;

  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
