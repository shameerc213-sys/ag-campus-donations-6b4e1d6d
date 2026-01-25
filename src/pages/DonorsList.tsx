import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, User, IndianRupee } from 'lucide-react';

interface Donor {
  id: string;
  name: string;
  phone: string | null;
  total_donations: number;
}

const DonorsList = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    try {
      const { data: donorsData } = await supabase
        .from('donors')
        .select('id, name, phone')
        .order('name');

      if (donorsData) {
        // Fetch donation totals for each donor
        const donorsWithTotals = await Promise.all(
          donorsData.map(async (donor) => {
            const { data: donations } = await supabase
              .from('donations')
              .select('amount')
              .eq('donor_id', donor.id);
            
            const total = donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
            return { ...donor, total_donations: total };
          })
        );
        setDonors(donorsWithTotals);
      }
    } catch (error) {
      console.error('Error fetching donors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDonors = donors.filter((donor) =>
    donor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (donor.phone && donor.phone.includes(searchQuery))
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ml-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">ദാതാക്കൾ</h2>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="പേര് അല്ലെങ്കിൽ ഫോൺ നമ്പർ തിരയുക..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Donors List */}
      {filteredDonors.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchQuery ? 'ഫലങ്ങൾ കണ്ടെത്തിയില്ല' : 'ഇതുവരെ ദാതാക്കൾ ഇല്ല'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDonors.map((donor) => (
            <Link key={donor.id} to={`/donor/${donor.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{donor.name}</p>
                        {donor.phone && (
                          <p className="text-sm text-muted-foreground">{donor.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-primary font-bold">
                        <IndianRupee className="w-4 h-4" />
                        <span>{formatCurrency(donor.total_donations).replace('₹', '')}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">ആകെ</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default DonorsList;
