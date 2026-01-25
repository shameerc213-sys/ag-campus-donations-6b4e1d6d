import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Calendar, IndianRupee } from 'lucide-react';
import { startOfWeek, startOfMonth, format } from 'date-fns';

interface DashboardStats {
  totalDonors: number;
  totalDonations: number;
  weeklyTotal: number;
  monthlyTotal: number;
  recentDonations: Array<{
    id: string;
    amount: number;
    donation_date: string;
    donor_name: string;
  }>;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalDonors: 0,
    totalDonations: 0,
    weeklyTotal: 0,
    monthlyTotal: 0,
    recentDonations: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 0 });
      const monthStart = startOfMonth(today);

      // Fetch total donors
      const { count: donorCount } = await supabase
        .from('donors')
        .select('*', { count: 'exact', head: true });

      // Fetch all donations
      const { data: allDonations } = await supabase
        .from('donations')
        .select('amount, donation_date');

      const totalAmount = allDonations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const weeklyAmount = allDonations?.filter(d => 
        new Date(d.donation_date) >= weekStart
      ).reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const monthlyAmount = allDonations?.filter(d => 
        new Date(d.donation_date) >= monthStart
      ).reduce((sum, d) => sum + Number(d.amount), 0) || 0;

      // Fetch recent donations with donor names
      const { data: recentData } = await supabase
        .from('donations')
        .select(`
          id,
          amount,
          donation_date,
          donors (name)
        `)
        .order('donation_date', { ascending: false })
        .limit(5);

      const recentDonations = recentData?.map(d => ({
        id: d.id,
        amount: Number(d.amount),
        donation_date: d.donation_date,
        donor_name: (d.donors as any)?.name || 'Unknown',
      })) || [];

      setStats({
        totalDonors: donorCount || 0,
        totalDonations: totalAmount,
        weeklyTotal: weeklyAmount,
        monthlyTotal: monthlyAmount,
        recentDonations,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">ഡാഷ്‌ബോർഡ്</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              ആകെ ദാതാക്കൾ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{stats.totalDonors}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IndianRupee className="w-4 h-4" />
              ആകെ സംഭാവന
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-secondary">{formatCurrency(stats.totalDonations)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent to-accent/50 border-accent-foreground/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              ഈ ആഴ്ച
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-accent-foreground">{formatCurrency(stats.weeklyTotal)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              ഈ മാസം
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">{formatCurrency(stats.monthlyTotal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Donations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">സമീപകാല സംഭാവനകൾ</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentDonations.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              ഇതുവരെ സംഭാവനകൾ ഇല്ല
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentDonations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">{donation.donor_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(donation.donation_date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <p className="font-bold text-primary">{formatCurrency(donation.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/add-donor">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-primary/30 hover:border-primary">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">പുതിയ ദാതാവ്</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/donors">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-secondary/30 hover:border-secondary">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-secondary" />
              <p className="font-medium">എല്ലാ ദാതാക്കളും</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
