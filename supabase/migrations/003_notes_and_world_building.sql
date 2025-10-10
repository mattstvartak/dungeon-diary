-- Notes and World Building Schema
-- This migration adds tables for notes, NPCs, locations, and items

-- Notes table
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[] DEFAULT '{}',
  is_lorebook BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX notes_user_id_idx ON public.notes(user_id);
CREATE INDEX notes_campaign_id_idx ON public.notes(campaign_id);
CREATE INDEX notes_is_lorebook_idx ON public.notes(is_lorebook);

-- Enable Row Level Security
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notes" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON public.notes
  FOR DELETE USING (auth.uid() = user_id);

-- NPCs table
CREATE TABLE public.npcs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  race TEXT,
  class_or_occupation TEXT,
  description TEXT,
  personality TEXT,
  appearance TEXT,
  location TEXT,
  relationship TEXT,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX npcs_user_id_idx ON public.npcs(user_id);
CREATE INDEX npcs_campaign_id_idx ON public.npcs(campaign_id);

-- Enable Row Level Security
ALTER TABLE public.npcs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own npcs" ON public.npcs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own npcs" ON public.npcs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own npcs" ON public.npcs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own npcs" ON public.npcs
  FOR DELETE USING (auth.uid() = user_id);

-- Locations table
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT,
  description TEXT,
  inhabitants TEXT,
  points_of_interest TEXT,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX locations_user_id_idx ON public.locations(user_id);
CREATE INDEX locations_campaign_id_idx ON public.locations(campaign_id);

-- Enable Row Level Security
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own locations" ON public.locations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own locations" ON public.locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own locations" ON public.locations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own locations" ON public.locations
  FOR DELETE USING (auth.uid() = user_id);

-- Items table
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT,
  rarity TEXT,
  description TEXT,
  properties TEXT,
  value TEXT,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX items_user_id_idx ON public.items(user_id);
CREATE INDEX items_campaign_id_idx ON public.items(campaign_id);

-- Enable Row Level Security
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own items" ON public.items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own items" ON public.items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items" ON public.items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own items" ON public.items
  FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at triggers for all new tables
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_npcs_updated_at BEFORE UPDATE ON public.npcs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
