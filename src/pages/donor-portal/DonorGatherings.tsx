import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDonorAuth } from '@/contexts/DonorAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import PortalHeader from '@/components/portal/PortalHeader';
import PortalNav from '@/components/portal/PortalNav';

interface Gathering {
  id: string;
  title: string;
  description: string | null;
  day_of_week: string | null;
  time_info: string | null;
  date_info: string | null;
  recurring: boolean | null;
}

const DonorGatherings = () => {
  const { donor, loading } = useDonorAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [gatherings, setGatherings] = useState<Gathering[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !donor) navigate('/portal');
  }, [donor, loading, navigate]);

  useEffect(() => {
    fetchGatherings();
  }, []);

  const fetchGatherings = async () => {
    try {
      const { data } = await supabase
        .from('spiritual_gatherings')
        .select('*')
        .order('sort_order', { ascending: true });
      setGatherings(data || []);
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
        <Button variant="ghost" size="sm" onClick={() => navigate('/portal/home')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {language === 'ml' ? 'തിരികെ' : 'Back'}
        </Button>

        <h2 className="text-xl font-bold text-foreground">
          {language === 'ml' ? 'ആത്മീയ സദസ്സുകൾ' : 'Spiritual Gatherings'}
        </h2>

        {loadingData ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : gatherings.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {language === 'ml' ? 'സദസ്സുകൾ ഇല്ല' : 'No gatherings'}
          </p>
        ) : (
          <div className="space-y-4">
            {gatherings.map((item) => (
              <Card key={item.id} className="border-l-4 border-l-primary">
                <CardContent className="pt-4 space-y-2">
                  <h3 className="font-bold text-foreground text-lg">{item.title}</h3>
                  
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {item.day_of_week && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {item.day_of_week}
                      </span>
                    )}
                    {item.time_info && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {item.time_info}
                      </span>
                    )}
                  </div>

                  {item.date_info && (
                    <p className="text-sm text-primary font-medium">{item.date_info}</p>
                  )}

                  {item.description && (
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {item.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <PortalNav />
    </div>
  );
};

export default DonorGatherings;
