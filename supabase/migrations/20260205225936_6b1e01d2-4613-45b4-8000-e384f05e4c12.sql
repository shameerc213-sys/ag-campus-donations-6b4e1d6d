-- Create social_links table for multiple social media links with thumbnails
CREATE TABLE public.social_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL DEFAULT 'other',
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Authenticated users (admin) can do everything
CREATE POLICY "Authenticated users can manage social links"
ON public.social_links
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Public can view social links
CREATE POLICY "Public can view social links"
ON public.social_links
FOR SELECT
TO anon
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_social_links_updated_at
BEFORE UPDATE ON public.social_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();