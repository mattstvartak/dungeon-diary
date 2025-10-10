-- Enhance world building tables with more D&D specific fields

-- Add new fields to NPCs table
ALTER TABLE public.npcs
  ADD COLUMN alignment TEXT,
  ADD COLUMN level INTEGER,
  ADD COLUMN armor_class INTEGER,
  ADD COLUMN hit_points TEXT,
  ADD COLUMN speed TEXT,
  ADD COLUMN ability_scores JSONB DEFAULT '{"str": null, "dex": null, "con": null, "int": null, "wis": null, "cha": null}',
  ADD COLUMN skills TEXT,
  ADD COLUMN languages TEXT,
  ADD COLUMN challenge_rating TEXT,
  ADD COLUMN abilities TEXT,
  ADD COLUMN backstory TEXT,
  ADD COLUMN goals TEXT,
  ADD COLUMN secrets TEXT,
  ADD COLUMN status TEXT DEFAULT 'alive',
  ADD COLUMN faction TEXT,
  ADD COLUMN voice_mannerisms TEXT;

-- Add new fields to Locations table
ALTER TABLE public.locations
  ADD COLUMN region TEXT,
  ADD COLUMN climate TEXT,
  ADD COLUMN population TEXT,
  ADD COLUMN size TEXT,
  ADD COLUMN government TEXT,
  ADD COLUMN economy TEXT,
  ADD COLUMN defenses TEXT,
  ADD COLUMN notable_npcs TEXT,
  ADD COLUMN hooks TEXT,
  ADD COLUMN secrets TEXT,
  ADD COLUMN history TEXT,
  ADD COLUMN atmosphere TEXT,
  ADD COLUMN dangers TEXT,
  ADD COLUMN map_url TEXT;

-- Add new fields to Items table
ALTER TABLE public.items
  ADD COLUMN attunement BOOLEAN DEFAULT false,
  ADD COLUMN requires_attunement_by TEXT,
  ADD COLUMN weight TEXT,
  ADD COLUMN damage TEXT,
  ADD COLUMN damage_type TEXT,
  ADD COLUMN armor_class_bonus INTEGER,
  ADD COLUMN charges INTEGER,
  ADD COLUMN cursed BOOLEAN DEFAULT false,
  ADD COLUMN history TEXT,
  ADD COLUMN lore TEXT;
