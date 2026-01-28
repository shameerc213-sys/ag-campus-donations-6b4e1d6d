import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Donor {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
}

interface DonorAuthContextType {
  donor: Donor | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const DonorAuthContext = createContext<DonorAuthContextType | undefined>(undefined);

export function DonorAuthProvider({ children }: { children: ReactNode }) {
  const [donor, setDonor] = useState<Donor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if donor is already logged in
    const savedDonorId = localStorage.getItem('donor_id');
    if (savedDonorId) {
      fetchDonor(savedDonorId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchDonor = async (donorId: string) => {
    try {
      const { data, error } = await supabase
        .from('donors')
        .select('id, name, phone, address')
        .eq('id', donorId)
        .maybeSingle();

      if (error || !data) {
        localStorage.removeItem('donor_id');
        setDonor(null);
      } else {
        setDonor(data);
      }
    } catch (error) {
      console.error('Error fetching donor:', error);
      localStorage.removeItem('donor_id');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get password prefix from settings
      const { data: prefixData } = await supabase
        .from('organization_settings')
        .select('value')
        .eq('key', 'password_prefix')
        .maybeSingle();

      const prefix = prefixData?.value || 'OM';

      // Find donor by name
      const { data: donors, error } = await supabase
        .from('donors')
        .select('id, name, phone, address')
        .ilike('name', username.trim());

      if (error) {
        return { success: false, error: 'Login failed' };
      }

      if (!donors || donors.length === 0) {
        return { success: false, error: 'Donor not found' };
      }

      // Check password (prefix + phone)
      const matchedDonor = donors.find(d => {
        const expectedPassword = `${prefix}${d.phone?.replace(/\s+/g, '') || ''}`;
        return password === expectedPassword;
      });

      if (!matchedDonor) {
        return { success: false, error: 'Invalid password' };
      }

      // Save donor session
      localStorage.setItem('donor_id', matchedDonor.id);
      setDonor(matchedDonor);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('donor_id');
    setDonor(null);
  };

  return (
    <DonorAuthContext.Provider value={{ donor, loading, login, logout }}>
      {children}
    </DonorAuthContext.Provider>
  );
}

export function useDonorAuth() {
  const context = useContext(DonorAuthContext);
  if (context === undefined) {
    throw new Error('useDonorAuth must be used within a DonorAuthProvider');
  }
  return context;
}
