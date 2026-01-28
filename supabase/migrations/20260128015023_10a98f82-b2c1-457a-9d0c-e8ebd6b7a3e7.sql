-- Create organization_settings table for storing org info
CREATE TABLE public.organization_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage org settings
CREATE POLICY "Authenticated users can view org settings"
ON public.organization_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert org settings"
ON public.organization_settings
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update org settings"
ON public.organization_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete org settings"
ON public.organization_settings
FOR DELETE
TO authenticated
USING (true);

-- Allow anonymous users to read org settings (for public donor portal)
CREATE POLICY "Public can view org settings"
ON public.organization_settings
FOR SELECT
TO anon
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_org_settings_updated_at
BEFORE UPDATE ON public.organization_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.organization_settings (key, value) VALUES
('org_name', 'അജ്മീർ ഗേറ്റ് ക്യാമ്പസ് കാരാട്'),
('org_address', ''),
('org_phone', ''),
('org_email', ''),
('org_location_lat', ''),
('org_location_lng', ''),
('org_description', ''),
('password_prefix', 'OM'),
('default_language', 'ml');

-- Create storage bucket for org media
INSERT INTO storage.buckets (id, name, public) VALUES ('org-media', 'org-media', true);

-- Create storage policies for org media
CREATE POLICY "Anyone can view org media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'org-media');

CREATE POLICY "Authenticated users can upload org media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'org-media');

CREATE POLICY "Authenticated users can update org media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'org-media')
WITH CHECK (bucket_id = 'org-media');

CREATE POLICY "Authenticated users can delete org media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'org-media');

-- Create org_media table for storing media references
CREATE TABLE public.org_media (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('photo', 'video')),
    url TEXT NOT NULL,
    title TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for org_media
ALTER TABLE public.org_media ENABLE ROW LEVEL SECURITY;

-- Policies for org_media
CREATE POLICY "Authenticated users can manage org media"
ON public.org_media
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can view org media"
ON public.org_media
FOR SELECT
TO anon
USING (true);