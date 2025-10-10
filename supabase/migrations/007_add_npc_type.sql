-- Create ENUM type for NPC types
CREATE TYPE npc_type_enum AS ENUM (
  'Ally',
  'Enemy',
  'Boss',
  'Shopkeeper',
  'Innkeeper',
  'Bartender',
  'Quest Giver',
  'Guard',
  'Merchant',
  'Noble',
  'Commoner',
  'Patron',
  'Contact',
  'Informant',
  'Neutral',
  'Other'
);

-- Add NPC type field with ENUM constraint
ALTER TABLE public.npcs
  ADD COLUMN npc_type npc_type_enum;

-- Add location_id field to NPCs (NPCs can be linked to Locations AND/OR POIs)
ALTER TABLE public.npcs
  ADD COLUMN location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;

-- Add indexes for filtering
CREATE INDEX idx_npcs_type ON public.npcs(npc_type);
CREATE INDEX idx_npcs_location ON public.npcs(location_id);

-- Add comments explaining the fields
COMMENT ON COLUMN public.npcs.npc_type IS 'Type of NPC: determines role and which POIs they can be assigned to';
COMMENT ON COLUMN public.npcs.location_id IS 'Optional direct link to a Location (NPCs can be linked to both Locations and POIs)';
