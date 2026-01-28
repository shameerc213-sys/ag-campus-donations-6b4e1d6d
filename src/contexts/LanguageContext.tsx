import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, t, TranslationKey } from '@/i18n/translations';
import { supabase } from '@/integrations/supabase/client';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ml');

  useEffect(() => {
    // Load default language from org settings
    const loadLanguage = async () => {
      try {
        const { data } = await supabase
          .from('organization_settings')
          .select('value')
          .eq('key', 'default_language')
          .maybeSingle();
        
        if (data?.value === 'en' || data?.value === 'ml') {
          setLanguageState(data.value);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };

    // Also check localStorage for user preference
    const savedLang = localStorage.getItem('app_language') as Language;
    if (savedLang === 'en' || savedLang === 'ml') {
      setLanguageState(savedLang);
    } else {
      loadLanguage();
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const translate = (key: TranslationKey) => t(key, language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
