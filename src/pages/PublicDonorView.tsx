import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, IndianRupee, Calendar, Phone, MapPin, Heart } from 'lucide-react';
import { format } from 'date-fns';

interface Donor {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
}

interface Donation {
  id: string;
  amount: number;
  donation_date: string;
  notes: string | null;
}

const PublicDonorView = () => {
  const { id } = useParams<{ id: string }>();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchDonorData();
    }
  }, [id]);

  const fetchDonorData = async () => {
    try {
      // Fetch donor details
      const { data: donorData, error: donorError } = await supabase
        .from('donors')
        .select('id, name, phone, address, created_at')
        .eq('id', id)
        .maybeSingle();

      if (donorError) throw donorError;
      if (!donorData) {
        setError('ദാതാവിനെ കണ്ടെത്തിയില്ല');
        return;
      }

      setDonor(donorData);

      // Fetch donations
      const { data: donationsData } = await supabase
        .from('donations')
        .select('id, amount, donation_date, notes')
        .eq('donor_id', id)
        .order('donation_date', { ascending: false });

      setDonations(donationsData?.map(d => ({
        ...d,
        amount: Number(d.amount)
      })) || []);
    } catch (error: any) {
      console.error('Error fetching donor:', error);
      setError('ഡാറ്റ ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !donor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">{error || 'ദാതാവിനെ കണ്ടെത്തിയില്ല'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-6 h-6" />
            <span className="font-semibold">അജ്മീർ ഗേറ്റ് ക്യാമ്പസ് കാരാട്</span>
          </div>
          <p className="text-sm opacity-90">സംഭാവന രസീത്</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
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
                അജ്മീർ ഗേറ്റിന് താങ്കൾ നൽകിവരുന്ന ഉദാരമായ സംഭാവനകൾക്ക് ഹൃദയം നിറഞ്ഞ നന്ദി അറിയിക്കുന്നു.
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                അല്ലാഹു താങ്കളുടെ സമ്പത്തിലും കുടുംബത്തിലും ബറക്കത്ത് ചെയ്യട്ടെ. പകരമായി പരലോകത്ത് വലിയ പ്രതിഫലം നൽകട്ടെ ആമീൻ
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Donation History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              സംഭാവന ചരിത്രം
            </CardTitle>
          </CardHeader>
          <CardContent>
            {donations.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                ഇതുവരെ സംഭാവനകൾ ഇല്ല
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
    </div>
  );
};

export default PublicDonorView;
