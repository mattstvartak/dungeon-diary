-- Create Points of Interest (POIs) table
CREATE TABLE public.pois (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT, -- e.g., Tavern, Shop, Temple, Guild Hall, Residence
  description TEXT,
  services TEXT, -- What services or goods are available here
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create NPC to POI linking table (many-to-many relationship)
CREATE TABLE public.npc_pois (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  npc_id UUID NOT NULL REFERENCES public.npcs(id) ON DELETE CASCADE,
  poi_id UUID NOT NULL REFERENCES public.pois(id) ON DELETE CASCADE,
  role TEXT, -- e.g., Owner, Shopkeeper, Bartender, Patron, Guard, Resident
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(npc_id, poi_id)
);

-- Add POI reference to NPCs table (optional direct link for primary location)
ALTER TABLE public.npcs
  ADD COLUMN poi_id UUID REFERENCES public.pois(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX pois_user_id_idx ON public.pois(user_id);
CREATE INDEX pois_location_id_idx ON public.pois(location_id);
CREATE INDEX pois_campaign_id_idx ON public.pois(campaign_id);
CREATE INDEX npc_pois_npc_id_idx ON public.npc_pois(npc_id);
CREATE INDEX npc_pois_poi_id_idx ON public.npc_pois(poi_id);

-- Enable Row Level Security
ALTER TABLE public.pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.npc_pois ENABLE ROW LEVEL SECURITY;

-- RLS Policies for POIs
CREATE POLICY "Users can view own pois" ON public.pois
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pois" ON public.pois
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pois" ON public.pois
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pois" ON public.pois
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for NPC-POI links
CREATE POLICY "Users can view own npc_pois" ON public.npc_pois
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.npcs
      WHERE npcs.id = npc_pois.npc_id
      AND npcs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own npc_pois" ON public.npc_pois
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.npcs
      WHERE npcs.id = npc_pois.npc_id
      AND npcs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own npc_pois" ON public.npc_pois
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.npcs
      WHERE npcs.id = npc_pois.npc_id
      AND npcs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own npc_pois" ON public.npc_pois
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.npcs
      WHERE npcs.id = npc_pois.npc_id
      AND npcs.user_id = auth.uid()
    )
  );

-- Add updated_at trigger for POIs
CREATE TRIGGER update_pois_updated_at BEFORE UPDATE ON public.pois
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
