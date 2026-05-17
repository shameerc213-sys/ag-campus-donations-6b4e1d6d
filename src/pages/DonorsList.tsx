import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, User, IndianRupee, Download, MapPin, Layers, ChevronDown, ChevronRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Donor {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  cluster_id: string | null;
  sub_cluster_id: string | null;
  total_donations: number;
  paid_this_month: boolean;
}
interface Cluster { id: string; name: string; sort_order: number; }
interface SubCluster { id: string; cluster_id: string; name: string; sort_order: number; }

type FilterTab = 'all' | 'unpaid' | 'paid';

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const UNGROUPED = '__ungrouped__';

const DonorsList = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [subClusters, setSubClusters] = useState<SubCluster[]>([]);
  const [monthOrders, setMonthOrders] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const month = currentMonth();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [donorsRes, clustersRes, subsRes, ordersRes] = await Promise.all([
        supabase.from('donors').select('id, name, phone, address, cluster_id, sub_cluster_id').order('name'),
        supabase.from('clusters').select('*').order('sort_order'),
        supabase.from('sub_clusters').select('*').order('sort_order'),
        supabase.from('monthly_cluster_orders').select('*').eq('month', month),
      ]);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];

      const donorsList = donorsRes.data || [];
      const enriched = await Promise.all(
        donorsList.map(async (d: any) => {
          const { data: ds } = await supabase
            .from('donations')
            .select('amount, donation_date')
            .eq('donor_id', d.id);
          const total = ds?.reduce((s, x) => s + Number(x.amount), 0) || 0;
          const paid = !!ds?.some(x => x.donation_date >= monthStart && x.donation_date < monthEnd);
          return { ...d, total_donations: total, paid_this_month: paid } as Donor;
        })
      );

      const orders: Record<string, number> = {};
      (ordersRes.data || []).forEach((r: any) => { orders[r.cluster_id] = r.sort_order; });

      setDonors(enriched);
      setClusters((clustersRes.data || []) as Cluster[]);
      setSubClusters((subsRes.data || []) as SubCluster[]);
      setMonthOrders(orders);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('ml-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

  const orderedClusters = useMemo(
    () => [...clusters].sort((a, b) => (monthOrders[a.id] ?? a.sort_order) - (monthOrders[b.id] ?? b.sort_order)),
    [clusters, monthOrders]
  );

  const filteredDonors = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return donors
      .filter(d => filter === 'all' ? true : filter === 'paid' ? d.paid_this_month : !d.paid_this_month)
      .filter(d =>
        !q ||
        d.name.toLowerCase().includes(q) ||
        (d.phone && d.phone.includes(searchQuery)) ||
        (d.address && d.address.toLowerCase().includes(q))
      );
  }, [donors, filter, searchQuery]);

  const paidCount = donors.filter(d => d.paid_this_month).length;
  const unpaidCount = donors.length - paidCount;

  const groups = useMemo(() => {
    const result: Array<{ cluster: Cluster | null; subs: Array<{ sub: SubCluster | null; donors: Donor[] }> }> = [];
    const addCluster = (cluster: Cluster | null) => {
      const clusterDonors = filteredDonors.filter(d => cluster ? d.cluster_id === cluster.id : !d.cluster_id);
      if (clusterDonors.length === 0) return;
      const subs = cluster ? subClusters.filter(s => s.cluster_id === cluster.id).sort((a, b) => a.sort_order - b.sort_order) : [];
      const subGroups: Array<{ sub: SubCluster | null; donors: Donor[] }> = [];
      subs.forEach(s => {
        const ds = clusterDonors.filter(d => d.sub_cluster_id === s.id);
        if (ds.length) subGroups.push({ sub: s, donors: ds });
      });
      const noSub = clusterDonors.filter(d => !d.sub_cluster_id || !subs.find(s => s.id === d.sub_cluster_id));
      if (noSub.length) subGroups.push({ sub: null, donors: noSub });
      result.push({ cluster, subs: subGroups });
    };
    orderedClusters.forEach(c => addCluster(c));
    addCluster(null);
    return result;
  }, [filteredDonors, orderedClusters, subClusters]);

  const toggleCollapse = (key: string) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const downloadFilteredList = () => {
    if (filteredDonors.length === 0) return;
    const rows: string[][] = [['ക്ലസ്റ്റർ', 'സബ് ക്ലസ്റ്റർ', 'പേര്', 'ഫോൺ', 'വിലാസം', 'ആകെ സംഭാവന']];
    groups.forEach(g => {
      g.subs.forEach(s => {
        s.donors.forEach(d => {
          rows.push([
            g.cluster?.name || 'Ungrouped',
            s.sub?.name || '',
            d.name, d.phone || '', d.address || '', String(d.total_donations),
          ]);
        });
      });
    });
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `donors_${filter}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const DonorRow = ({ d }: { d: Donor }) => (
    <Link to={`/donor/${d.id}`}>
      <Card className={`hover:shadow-md transition-shadow cursor-pointer border-l-4 ${d.paid_this_month ? 'border-l-secondary' : 'border-l-primary'}`}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{d.name}</p>
                {d.phone && <p className="text-xs text-muted-foreground">{d.phone}</p>}
                {d.address && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3" />{d.address}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 text-primary font-bold">
                <IndianRupee className="w-4 h-4" />
                <span>{formatCurrency(d.total_donations).replace('₹', '')}</span>
              </div>
              {d.paid_this_month && <p className="text-[10px] text-secondary font-semibold">തന്നു</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

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

      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="പേര്, ഫോൺ, വിലാസം..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="all">എല്ലാവരും ({donors.length})</TabsTrigger>
            <TabsTrigger value="unpaid">ബാക്കി ({unpaidCount})</TabsTrigger>
            <TabsTrigger value="paid">തന്നവർ ({paidCount})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center justify-between bg-accent/40 p-2 rounded-lg">
          <span className="text-xs text-muted-foreground">
            {filteredDonors.length} ഫലങ്ങൾ · {month}
          </span>
          <Button variant="outline" size="sm" onClick={downloadFilteredList} className="flex items-center gap-1">
            <Download className="w-4 h-4" /> CSV
          </Button>
        </div>
      </div>

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
        <div className="space-y-4">
          {groups.map((g) => {
            const cKey = g.cluster?.id || UNGROUPED;
            const isCollapsed = !!collapsed[cKey];
            const totalInCluster = g.subs.reduce((s, x) => s + x.donors.length, 0);
            return (
              <div key={cKey} className="space-y-2">
                <button
                  onClick={() => toggleCollapse(cKey)}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  <Layers className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground flex-1 text-left">
                    {g.cluster?.name || 'മറ്റുള്ളവർ'}
                  </span>
                  <span className="text-xs text-muted-foreground">{totalInCluster}</span>
                </button>

                {!isCollapsed && (
                  <div className="space-y-3 pl-2">
                    {g.subs.map((s, idx) => (
                      <div key={s.sub?.id || `nosub-${idx}`} className="space-y-2">
                        {(g.subs.length > 1 || s.sub) && (
                          <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {s.sub?.name || 'മറ്റുള്ളവർ'} ({s.donors.length})
                          </div>
                        )}
                        <div className="space-y-2">
                          {s.donors.map(d => <DonorRow key={d.id} d={d} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DonorsList;
