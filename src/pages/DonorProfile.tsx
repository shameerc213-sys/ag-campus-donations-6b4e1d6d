import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, IndianRupee, Calendar, Plus, Phone, MapPin, Share2, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { z } from 'zod';

interface Donor {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

interface Donation {
  id: string;
  amount: number;
  donation_date: string;
  notes: string | null;
}

const donationSchema = z.object({
  amount: z.number().positive('തുക 0-ൽ കൂടുതൽ ആയിരിക്കണം'),
  donation_date: z.string().min(1, 'തീയതി തിരഞ്ഞെടുക്കുക'),
});

const DonorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newNotes, setNewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const getPublicLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/my-donations/${id}`;
  };

  const copyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(getPublicLink());
      setCopied(true);
      toast({
        title: 'ലിങ്ക് കോപ്പി ചെയ്തു!',
        description: 'ദാതാവിന് ഈ ലിങ്ക് ഷെയർ ചെയ്യാം',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'ലിങ്ക് കോപ്പി ചെയ്യാൻ കഴിഞ്ഞില്ല',
        variant: 'destructive',
      });
    }
  };

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
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (donorError) throw donorError;
      if (!donorData) {
        toast({
          title: 'Error',
          description: 'ദാതാവിനെ കണ്ടെത്തിയില്ല',
          variant: 'destructive',
        });
        return;
      }

      setDonor(donorData);

      // Fetch donations
      const { data: donationsData } = await supabase
        .from('donations')
        .select('*')
        .eq('donor_id', id)
        .order('donation_date', { ascending: false });

      setDonations(donationsData?.map(d => ({
        ...d,
        amount: Number(d.amount)
      })) || []);
    } catch (error: any) {
      console.error('Error fetching donor:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDonation = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(newAmount);
    const validation = donationSchema.safeParse({ amount, donation_date: newDate });
    
    if (!validation.success) {
      toast({
        title: 'Error',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('donations')
        .insert({
          donor_id: id,
          amount: amount,
          donation_date: newDate,
          notes: newNotes.trim() || null,
        });

      if (error) throw error;

      toast({
        title: 'വിജയകരം!',
        description: 'സംഭാവന രേഖപ്പെടുത്തി',
      });

      setNewAmount('');
      setNewDate(format(new Date(), 'yyyy-MM-dd'));
      setNewNotes('');
      setShowAddForm(false);
      fetchDonorData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!donor) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">ദാതാവിനെ കണ്ടെത്തിയില്ല</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
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
          
          <div className="mt-4 p-4 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">ആകെ സംഭാവന</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalDonations)}</p>
          </div>

          {/* Share Link Button */}
          <div className="mt-4">
            <Button
              onClick={copyPublicLink}
              variant="outline"
              className="w-full"
              size="sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-secondary" />
                  കോപ്പി ചെയ്തു!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  ദാതാവിന് ലിങ്ക് ഷെയർ ചെയ്യുക
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              ഈ ലിങ്ക് വഴി ദാതാവിന് സ്വന്തം സംഭാവനകൾ കാണാം
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Add Donation Button/Form */}
      {!showAddForm ? (
        <Button 
          onClick={() => setShowAddForm(true)} 
          className="w-full"
          size="lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          പുതിയ സംഭാവന ചേർക്കുക
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">പുതിയ സംഭാവന</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddDonation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">തുക (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">തീയതി *</Label>
                <Input
                  id="date"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="donation-notes">കുറിപ്പുകൾ</Label>
                <Input
                  id="donation-notes"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="ഐച്ഛികം..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? 'കാത്തിരിക്കുക...' : 'സേവ് ചെയ്യുക'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                >
                  റദ്ദാക്കുക
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Donation History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">സംഭാവന ചരിത്രം</CardTitle>
        </CardHeader>
        <CardContent>
          {donations.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              ഇതുവരെ സംഭാവനകൾ ഇല്ല
            </p>
          ) : (
            <div className="space-y-3">
              {donations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                      <IndianRupee className="w-4 h-4 text-secondary" />
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
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
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
  );
};

export default DonorProfile;
