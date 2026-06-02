
-- Restore authenticated-only writes on organization_settings
DROP POLICY IF EXISTS "Anyone can insert org settings" ON public.organization_settings;
DROP POLICY IF EXISTS "Anyone can update org settings" ON public.organization_settings;

CREATE POLICY "Authenticated users can insert org settings"
  ON public.organization_settings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update org settings"
  ON public.organization_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Restrict branding bucket writes to authenticated users only
DROP POLICY IF EXISTS "Branding upload" ON storage.objects;
DROP POLICY IF EXISTS "Branding update" ON storage.objects;
DROP POLICY IF EXISTS "Branding delete" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload branding" ON storage.objects;
DROP POLICY IF EXISTS "Public can update branding" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete branding" ON storage.objects;

CREATE POLICY "Authenticated can upload branding"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'branding');

CREATE POLICY "Authenticated can update branding"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'branding') WITH CHECK (bucket_id = 'branding');

CREATE POLICY "Authenticated can delete branding"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'branding');

-- Restrict dua-attachments DELETE to authenticated users (admins) only.
-- INSERT remains public because donors submit attachments without a Supabase auth session.
DROP POLICY IF EXISTS "Anyone can delete dua attachments" ON storage.objects;

CREATE POLICY "Authenticated can delete dua attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'dua-attachments');
