DROP POLICY IF EXISTS "Authenticated can upload branding" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update branding" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete branding" ON storage.objects;
DROP POLICY IF EXISTS "Public can view branding" ON storage.objects;

CREATE POLICY "Branding view" ON storage.objects FOR SELECT TO public USING (bucket_id = 'branding');
CREATE POLICY "Branding upload" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'branding');
CREATE POLICY "Branding update" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'branding') WITH CHECK (bucket_id = 'branding');
CREATE POLICY "Branding delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'branding');

DROP POLICY IF EXISTS "Authenticated users can insert org settings" ON public.organization_settings;
DROP POLICY IF EXISTS "Authenticated users can update org settings" ON public.organization_settings;
CREATE POLICY "Anyone can insert org settings" ON public.organization_settings FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update org settings" ON public.organization_settings FOR UPDATE TO public USING (true) WITH CHECK (true);