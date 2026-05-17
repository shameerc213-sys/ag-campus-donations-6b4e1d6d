import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Cluster { id: string; name: string; sort_order: number; }
interface SubCluster { id: string; cluster_id: string; name: string; sort_order: number; }

interface Props {
  clusterId: string | null;
  subClusterId: string | null;
  onChange: (clusterId: string | null, subClusterId: string | null) => void;
}

const NONE = '__none__';

const ClusterSelect = ({ clusterId, subClusterId, onChange }: Props) => {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [subClusters, setSubClusters] = useState<SubCluster[]>([]);

  useEffect(() => {
    (async () => {
      const [c, s] = await Promise.all([
        supabase.from('clusters').select('*').order('sort_order'),
        supabase.from('sub_clusters').select('*').order('sort_order'),
      ]);
      setClusters((c.data || []) as Cluster[]);
      setSubClusters((s.data || []) as SubCluster[]);
    })();
  }, []);

  const subs = subClusters.filter(s => s.cluster_id === clusterId);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>ക്ലസ്റ്റർ</Label>
        <Select
          value={clusterId || NONE}
          onValueChange={(v) => onChange(v === NONE ? null : v, null)}
        >
          <SelectTrigger><SelectValue placeholder="ക്ലസ്റ്റർ തിരഞ്ഞെടുക്കുക" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>—</SelectItem>
            {clusters.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>സബ് ക്ലസ്റ്റർ</Label>
        <Select
          value={subClusterId || NONE}
          onValueChange={(v) => onChange(clusterId, v === NONE ? null : v)}
          disabled={!clusterId || subs.length === 0}
        >
          <SelectTrigger><SelectValue placeholder={subs.length ? "സബ് ക്ലസ്റ്റർ" : "—"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>—</SelectItem>
            {subs.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ClusterSelect;
