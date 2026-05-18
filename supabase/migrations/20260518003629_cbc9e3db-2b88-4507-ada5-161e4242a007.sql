DO $$
DECLARE
  v_prefix text;
  r RECORD;
BEGIN
  SELECT value INTO v_prefix FROM public.organization_settings WHERE key='receipt_prefix';
  FOR r IN
    SELECT id FROM public.donations
    WHERE receipt_number IS NULL OR receipt_number=''
    ORDER BY donation_date ASC, created_at ASC
  LOOP
    UPDATE public.donations
       SET receipt_number = COALESCE(v_prefix,'') || lpad(nextval('public.donation_receipt_seq')::text, 5, '0')
     WHERE id = r.id;
  END LOOP;
END $$;