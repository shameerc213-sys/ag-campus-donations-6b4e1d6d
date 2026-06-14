
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS phones text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS location text;

UPDATE public.contacts
  SET phones = ARRAY[phone]
  WHERE (phones IS NULL OR array_length(phones, 1) IS NULL)
    AND phone IS NOT NULL AND phone <> '';

ALTER TABLE public.contacts ALTER COLUMN phone DROP NOT NULL;
