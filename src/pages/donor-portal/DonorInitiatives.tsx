import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDonorAuth } from '@/contexts/DonorAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import PortalHeader from '@/components/portal/PortalHeader';
import PortalNav from '@/components/portal/PortalNav';

interface Initiative {
  id: string;
  title: string;
  description: string | null;
}

const DonorInitiatives = () => {
  const { donor, loading } = useDonorAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [selected, setSelected] = useState<Initiative | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !donor) navigate('/portal');
  }, [donor, loading, navigate]);

  useEffect(() => {
    fetchInitiatives();
  }, []);

  const fetchInitiatives = async () => {
    try {
      const { data } = await supabase
        .from('initiatives')
        .select('*')
        .order('sort_order', { ascending: true });
      setInitiatives(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!donor) return null;

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader />

      <div className="max-w-lg mx-auto p-4 space-y-4 pb-24">
        <Button variant="ghost" size="sm" onClick={() => selected ? setSelected(null) : navigate('/portal/home')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {language === 'ml' ? 'തിരികെ' : 'Back'}
        </Button>

        <h2 className="text-xl font-bold text-foreground">
          {selected ? selected.title : (language === 'ml' ? 'അജ്മീർ ഗേറ്റ് സംരംഭങ്ങൾ' : 'AG Initiatives')}
        </h2>

        {loadingData ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : selected ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {selected.description || (language === 'ml' ? 'വിശദാംശങ്ങൾ ലഭ്യമല്ല' : 'No details available')}
              </p>
            </CardContent>
          </Card>
        ) : initiatives.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {language === 'ml' ? 'സംരംഭങ്ങൾ ഇല്ല' : 'No initiatives'}
          </p>
        ) : (
          <div className="space-y-3">
            {initiatives.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="w-full text-left p-4 bg-card border border-border rounded-xl hover:bg-accent/50 transition-colors flex items-center justify-between"
              >
                <span className="font-medium text-foreground">{item.title}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>

      <PortalNav />
    </div>
  );
};

export default DonorInitiatives;
