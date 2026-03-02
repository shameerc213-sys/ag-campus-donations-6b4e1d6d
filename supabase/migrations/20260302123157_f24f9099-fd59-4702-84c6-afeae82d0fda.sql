
-- Initiatives table (സംരംഭങ്ങൾ)
CREATE TABLE public.initiatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage initiatives" ON public.initiatives FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public can view initiatives" ON public.initiatives FOR SELECT TO anon USING (true);

-- Spiritual Gatherings table (ആത്മീയ സദസ്സുകൾ)
CREATE TABLE public.spiritual_gatherings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  day_of_week text,
  time_info text,
  date_info text,
  recurring boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.spiritual_gatherings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage gatherings" ON public.spiritual_gatherings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public can view gatherings" ON public.spiritual_gatherings FOR SELECT TO anon USING (true);

-- Contacts table (ബന്ധപ്പെടേണ്ട നമ്പറുകൾ)
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  designation text,
  phone text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage contacts" ON public.contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public can view contacts" ON public.contacts FOR SELECT TO anon USING (true);

-- Dua Requests table (ദുആ റിക്വസ്റ്റ്)
CREATE TABLE public.dua_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid REFERENCES public.donors(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  reply text,
  status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dua_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage dua requests" ON public.dua_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public can view own dua requests" ON public.dua_requests FOR SELECT TO anon USING (true);
CREATE POLICY "Public can insert dua requests" ON public.dua_requests FOR INSERT TO anon WITH CHECK (true);
