import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDonorAuth } from '@/contexts/DonorAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, IndianRupee, Calendar, Phone, MapPin, Heart, LogOut, Info, Image, Globe } from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Donation {
  id: string;
  amount: number;
  donation_date: string;
  notes: string | null;
}

const DonorHome = () => {
  const { donor, logout, loading } = useDonorAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loadingDonations, setLoadingDonations] = useState(true);

  useEffect(() => {
    if (!loading && !donor) {
      navigate('/portal');
    }
  }, [donor, loading, navigate]);

  useEffect(() => {
    if (donor) {
      fetchDonations();
    }
  }, [donor]);

  const fetchDonations = async () => {
    if (!donor) return;

    try {
      const { data } = await supabase
        .from('donations')
        .select('id, amount, donation_date, notes')
        .eq('donor_id', donor.id)
        .order('donation_date', { ascending: false });

      setDonations(data?.map(d => ({
        ...d,
        amount: Number(d.amount)
      })) || []);
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoadingDonations(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ml-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);

  const handleLogout = () => {
    logout();
    navigate('/portal');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!donor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-4 px-4 sticky top-0 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6" />
            <span className="font-semibold">{t('app.name')}</span>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Globe className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setLanguage('ml')}>
                  മലയാളം
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('en')}>
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4 pb-24">
        {/* Donor Info Card */}
        <Card className="border-t-4 border-t-primary">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">{donor.name}</h2>
                {donor.phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" />
                    {donor.phone}
                  </p>
                )}
                {donor.address && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {donor.address}
                  </p>
                )}
              </div>
            </div>
            
            {/* Thank you message */}
            <div className="mt-4 p-4 bg-accent/50 rounded-lg text-center space-y-2">
              <p className="text-sm text-foreground leading-relaxed">
                {t('donor.thankYouMessage')}
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {t('donor.prayerMessage')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Card */}
        <Card className="bg-gradient-to-r from-secondary/20 to-secondary/10">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">{t('donor.totalDonation')}</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(totalDonations)}</p>
          </CardContent>
        </Card>

        {/* Donation History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {t('donor.donationHistory')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDonations ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : donations.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                {t('donor.noDonations')}
              </p>
            ) : (
              <div className="space-y-3">
                {donations.map((donation, index) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border-l-4 border-l-secondary"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center text-xs font-bold text-secondary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">
                          {formatCurrency(donation.amount)}
                        </p>
                        {donation.notes && (
                          <p className="text-xs text-muted-foreground">{donation.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(donation.donation_date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex justify-around py-2">
            <Link
              to="/portal/home"
              className="flex flex-col items-center py-2 px-3 rounded-lg text-primary bg-accent"
            >
              <IndianRupee className="w-5 h-5" />
              <span className="text-xs mt-1">{t('donor.donationHistory')}</span>
            </Link>
            <Link
              to="/portal/about"
              className="flex flex-col items-center py-2 px-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent/50"
            >
              <Info className="w-5 h-5" />
              <span className="text-xs mt-1">{t('donor.aboutOrg')}</span>
            </Link>
            <Link
              to="/portal/gallery"
              className="flex flex-col items-center py-2 px-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent/50"
            >
              <Image className="w-5 h-5" />
              <span className="text-xs mt-1">{t('donor.gallery')}</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default DonorHome;
