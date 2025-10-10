-- Add location_id field to NPCs (NPCs can be linked to Locations AND/OR POIs)
ALTER TABLE public.npcs
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;

-- Add index for filtering by location
CREATE INDEX IF NOT EXISTS idx_npcs_location ON public.npcs(location_id);

-- Add comment explaining the field
COMMENT ON COLUMN public.npcs.location_id IS 'Optional direct link to a Location (NPCs can be linked to both Locations and POIs)';
