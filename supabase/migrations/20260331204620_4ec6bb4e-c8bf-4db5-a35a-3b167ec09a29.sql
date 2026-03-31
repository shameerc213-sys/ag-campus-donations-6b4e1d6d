
CREATE TABLE public.dua_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dua_request_id UUID REFERENCES public.dua_requests(id) ON DELETE CASCADE NOT NULL,
  reply_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dua_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access to dua_replies"
ON public.dua_replies FOR SELECT TO anon USING (true);

CREATE POLICY "Allow authenticated full access to dua_replies"
ON public.dua_replies FOR ALL TO authenticated USING (true) WITH CHECK (true);
