ALTER TABLE public.donors
  ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS location text;