-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on donors" ON public.donors;
DROP POLICY IF EXISTS "Allow all operations on donations" ON public.donations;

-- Create secure policies for authenticated users only
CREATE POLICY "Authenticated users can view donors" 
ON public.donors 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert donors" 
ON public.donors 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update donors" 
ON public.donors 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete donors" 
ON public.donors 
FOR DELETE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view donations" 
ON public.donations 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert donations" 
ON public.donations 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update donations" 
ON public.donations 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete donations" 
ON public.donations 
FOR DELETE 
TO authenticated
USING (true);