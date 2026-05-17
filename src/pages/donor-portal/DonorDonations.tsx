import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDonorAuth } from '@/contexts/DonorAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, User, Phone, MapPin, FileDown, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import PortalHeader from '@/components/portal/PortalHeader';
import PortalNav from '@/components/portal/PortalNav';
import { downloadReceipt } from '@/lib/receipt';
import { useToast } from '@/hooks/use-toast';

interface Donation {
  id: string;
  amount: number;
  donation_date: string;
  notes: string | null;
  receipt_number: string | null;
}

const DonorDonations = () => {
  const { donor, loading } = useDonorAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [busyReceipt, setBusyReceipt] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !donor) navigate('/portal');
  }, [donor, loading, navigate]);

  useEffect(() => {
    if (donor) fetchDonations();
  }, [donor]);

  const fetchDonations = async () => {
    if (!donor) return;
    try {
      const { data } = await supabase
        .from('donations')
        .select('id, amount, donation_date, notes, receipt_number')
        .eq('donor_id', donor.id)
        .order('donation_date', { ascending: false });
      setDonations(data?.map(d => ({ ...d, amount: Number(d.amount) })) || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingDonations(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ml-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
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
        {/* Donor Info */}
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
                    <Phone className="w-3 h-3" />{donor.phone}
                  </p>
                )}
                {donor.address && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />{donor.address}
                  </p>
                )}
              </div>
            </div>

            {/* Prayer message */}
            <div className="mt-4 p-4 bg-accent/50 rounded-lg text-center space-y-2">
              <p className="text-sm text-foreground leading-relaxed">{t('donor.thankYouMessage')}</p>
              <p className="text-sm text-foreground leading-relaxed">{t('donor.prayerMessage')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Donation History - without total */}
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
              <p className="text-center text-muted-foreground py-4">{t('donor.noDonations')}</p>
            ) : (
              <div className="space-y-3">
                {donations.map((donation, index) => (
                  <div key={donation.id} className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg border-l-4 border-l-secondary">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 shrink-0 bg-secondary/20 rounded-full flex items-center justify-center text-xs font-bold text-secondary">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground">{formatCurrency(donation.amount)}</p>
                        {donation.receipt_number && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Receipt className="w-3 h-3" />#{donation.receipt_number}
                          </p>
                        )}
                        {donation.notes && <p className="text-xs text-muted-foreground truncate">{donation.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(donation.donation_date), 'dd/MM/yyyy')}
                      </p>
                      {donation.receipt_number && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-primary"
                          disabled={busyReceipt === donation.id}
                          onClick={async () => {
                            setBusyReceipt(donation.id);
                            try {
                              await downloadReceipt({
                                receipt_number: donation.receipt_number!,
                                donor_name: donor.name,
                                donor_phone: donor.phone,
                                donor_address: donor.address,
                                amount: donation.amount,
                                donation_date: donation.donation_date,
                                notes: donation.notes,
                              });
                            } catch (e: any) {
                              toast({ title: 'Error', description: e.message, variant: 'destructive' });
                            } finally { setBusyReceipt(null); }
                          }}
                        >
                          <FileDown className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PortalNav />
    </div>
  );
};

export default DonorDonations;
