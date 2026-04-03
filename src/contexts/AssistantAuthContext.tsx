import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AssistantAuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AssistantAuthContext = createContext<AssistantAuthContextType | undefined>(undefined);

export function AssistantAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('assistant_auth');
    if (saved === 'true') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data: usernameData } = await supabase
        .from('organization_settings')
        .select('value')
        .eq('key', 'assistant_username')
        .maybeSingle();

      const { data: passwordData } = await supabase
        .from('organization_settings')
        .select('value')
        .eq('key', 'assistant_password')
        .maybeSingle();

      const correctUsername = usernameData?.value || 'assistant';
      const correctPassword = passwordData?.value || 'assistant123';

      if (username === correctUsername && password === correctPassword) {
        localStorage.setItem('assistant_auth', 'true');
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Assistant login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('assistant_auth');
    setIsAuthenticated(false);
  };

  return (
    <AssistantAuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AssistantAuthContext.Provider>
  );
}

export function useAssistantAuth() {
  const context = useContext(AssistantAuthContext);
  if (!context) throw new Error('useAssistantAuth must be used within AssistantAuthProvider');
  return context;
}
