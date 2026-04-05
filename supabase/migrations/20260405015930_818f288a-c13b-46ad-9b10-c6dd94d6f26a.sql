
-- Add attachment columns to dua_requests
ALTER TABLE public.dua_requests
ADD COLUMN attachment_url text,
ADD COLUMN attachment_type text;

-- Add attachment columns to dua_replies
ALTER TABLE public.dua_replies
ADD COLUMN attachment_url text,
ADD COLUMN attachment_type text;

-- Create storage bucket for dua attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('dua-attachments', 'dua-attachments', true);

-- Storage policies
CREATE POLICY "Anyone can view dua attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'dua-attachments');

CREATE POLICY "Anyone can upload dua attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'dua-attachments');

CREATE POLICY "Anyone can delete dua attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'dua-attachments');
