-- Allow public read access to donors table for public donor view
CREATE POLICY "Public can view donors by ID" 
ON public.donors 
FOR SELECT 
TO anon
USING (true);

-- Allow public read access to donations table for public donor view
CREATE POLICY "Public can view donations by donor ID" 
ON public.donations 
FOR SELECT 
TO anon
USING (true);