
-- Clusters
CREATE TABLE public.clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clusters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view clusters" ON public.clusters FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated can manage clusters" ON public.clusters FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_clusters_updated BEFORE UPDATE ON public.clusters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sub-clusters
CREATE TABLE public.sub_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id uuid NOT NULL REFERENCES public.clusters(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sub_clusters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view sub_clusters" ON public.sub_clusters FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated can manage sub_clusters" ON public.sub_clusters FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_sub_clusters_updated BEFORE UPDATE ON public.sub_clusters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_sub_clusters_cluster ON public.sub_clusters(cluster_id);

-- Donors: cluster assignment
ALTER TABLE public.donors ADD COLUMN cluster_id uuid REFERENCES public.clusters(id) ON DELETE SET NULL;
ALTER TABLE public.donors ADD COLUMN sub_cluster_id uuid REFERENCES public.sub_clusters(id) ON DELETE SET NULL;
CREATE INDEX idx_donors_cluster ON public.donors(cluster_id);
CREATE INDEX idx_donors_sub_cluster ON public.donors(sub_cluster_id);

-- Monthly ordering (month stored as 'YYYY-MM')
CREATE TABLE public.monthly_cluster_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL,
  cluster_id uuid NOT NULL REFERENCES public.clusters(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(month, cluster_id)
);
ALTER TABLE public.monthly_cluster_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view monthly_cluster_orders" ON public.monthly_cluster_orders FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated can manage monthly_cluster_orders" ON public.monthly_cluster_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.monthly_sub_cluster_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL,
  sub_cluster_id uuid NOT NULL REFERENCES public.sub_clusters(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(month, sub_cluster_id)
);
ALTER TABLE public.monthly_sub_cluster_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view monthly_sub_cluster_orders" ON public.monthly_sub_cluster_orders FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated can manage monthly_sub_cluster_orders" ON public.monthly_sub_cluster_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Receipts
CREATE SEQUENCE IF NOT EXISTS public.donation_receipt_seq START 1;
ALTER TABLE public.donations ADD COLUMN receipt_number text UNIQUE;

CREATE OR REPLACE FUNCTION public.set_donation_receipt_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix text;
  v_seq bigint;
BEGIN
  IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
    SELECT value INTO v_prefix FROM public.organization_settings WHERE key = 'receipt_prefix';
    v_seq := nextval('public.donation_receipt_seq');
    NEW.receipt_number := COALESCE(v_prefix, '') || lpad(v_seq::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_donation_receipt_number
BEFORE INSERT ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.set_donation_receipt_number();

-- Branding storage bucket (seal, signature, logo)
INSERT INTO storage.buckets (id, name, public) VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view branding" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'branding');
CREATE POLICY "Authenticated can upload branding" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'branding');
CREATE POLICY "Authenticated can update branding" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'branding');
CREATE POLICY "Authenticated can delete branding" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'branding');
