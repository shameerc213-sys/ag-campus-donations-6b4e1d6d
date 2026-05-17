import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, ChevronUp, ChevronDown, Layers, Pencil, Save, X } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Cluster { id: string; name: string; sort_order: number; }
interface SubCluster { id: string; cluster_id: string; name: string; sort_order: number; }

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const ClustersManager = () => {
  const { toast } = useToast();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [subClusters, setSubClusters] = useState<SubCluster[]>([]);
  const [monthOrders, setMonthOrders] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [newClusterName, setNewClusterName] = useState('');
  const [newSubName, setNewSubName] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<{ type: 'c' | 's'; id: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'c' | 's'; id: string } | null>(null);
  const month = currentMonth();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [c, s, m] = await Promise.all([
      supabase.from('clusters').select('*').order('sort_order'),
      supabase.from('sub_clusters').select('*').order('sort_order'),
      supabase.from('monthly_cluster_orders').select('*').eq('month', month),
    ]);
    const orders: Record<string, number> = {};
    (m.data || []).forEach((r: any) => { orders[r.cluster_id] = r.sort_order; });
    setMonthOrders(orders);
    setClusters((c.data || []) as Cluster[]);
    setSubClusters((s.data || []) as SubCluster[]);
    setLoading(false);
  };

  const addCluster = async () => {
    if (!newClusterName.trim()) return;
    const { error } = await supabase.from('clusters').insert({
      name: newClusterName.trim(),
      sort_order: clusters.length,
    });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setNewClusterName('');
    fetchAll();
  };

  const addSubCluster = async (clusterId: string) => {
    const name = (newSubName[clusterId] || '').trim();
    if (!name) return;
    const count = subClusters.filter(s => s.cluster_id === clusterId).length;
    const { error } = await supabase.from('sub_clusters').insert({
      cluster_id: clusterId, name, sort_order: count,
    });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setNewSubName(prev => ({ ...prev, [clusterId]: '' }));
    fetchAll();
  };

  const saveEdit = async () => {
    if (!editing) return;
    const table = editing.type === 'c' ? 'clusters' : 'sub_clusters';
    const { error } = await supabase.from(table).update({ name: editing.name.trim() }).eq('id', editing.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setEditing(null);
    fetchAll();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const table = deleteTarget.type === 'c' ? 'clusters' : 'sub_clusters';
    const { error } = await supabase.from(table).delete().eq('id', deleteTarget.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    setDeleteTarget(null);
    fetchAll();
  };

  // Sort clusters using current-month order if set, else default sort_order
  const orderedClusters = [...clusters].sort((a, b) => {
    const ao = monthOrders[a.id] ?? a.sort_order;
    const bo = monthOrders[b.id] ?? b.sort_order;
    return ao - bo;
  });

  const moveCluster = async (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= orderedClusters.length) return;
    const list = [...orderedClusters];
    [list[idx], list[next]] = [list[next], list[idx]];
    // Save as monthly order
    const rows = list.map((c, i) => ({ month, cluster_id: c.id, sort_order: i }));
    await supabase.from('monthly_cluster_orders').delete().eq('month', month);
    await supabase.from('monthly_cluster_orders').insert(rows);
    fetchAll();
  };

  const moveSub = async (clusterId: string, idx: number, dir: -1 | 1) => {
    const subs = subClusters.filter(s => s.cluster_id === clusterId).sort((a, b) => a.sort_order - b.sort_order);
    const next = idx + dir;
    if (next < 0 || next >= subs.length) return;
    [subs[idx], subs[next]] = [subs[next], subs[idx]];
    for (let i = 0; i < subs.length; i++) {
      await supabase.from('sub_clusters').update({ sort_order: i }).eq('id', subs[i].id);
    }
    fetchAll();
  };

  if (loading) return <Card><CardContent className="p-6">Loading...</CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          ക്ലസ്റ്ററുകൾ ({month})
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          ഈ മാസത്തെ ഓർഡർ ഇവിടെ ക്രമീകരിക്കാം. എഡിറ്റ് ചെയ്തില്ലെങ്കിൽ കഴിഞ്ഞ മാസത്തെ/സ്ഥിര ഓർഡർ തന്നെ കാണിക്കും.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="പുതിയ ക്ലസ്റ്റർ പേര്"
            value={newClusterName}
            onChange={(e) => setNewClusterName(e.target.value)}
          />
          <Button onClick={addCluster}><Plus className="w-4 h-4" /></Button>
        </div>

        <div className="space-y-3">
          {orderedClusters.map((c, idx) => {
            const subs = subClusters.filter(s => s.cluster_id === c.id).sort((a, b) => a.sort_order - b.sort_order);
            return (
              <div key={c.id} className="border rounded-lg p-3 bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <button onClick={() => moveCluster(idx, -1)} disabled={idx === 0} className="disabled:opacity-30">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => moveCluster(idx, 1)} disabled={idx === orderedClusters.length - 1} className="disabled:opacity-30">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  {editing?.type === 'c' && editing.id === c.id ? (
                    <>
                      <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="flex-1" />
                      <Button size="icon" variant="ghost" onClick={saveEdit}><Save className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-semibold">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{subs.length} sub</span>
                      <Button size="icon" variant="ghost" onClick={() => setEditing({ type: 'c', id: c.id, name: c.name })}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget({ type: 'c', id: c.id })}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>

                <div className="pl-6 mt-3 space-y-2">
                  {subs.map((s, sIdx) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <button onClick={() => moveSub(c.id, sIdx, -1)} disabled={sIdx === 0} className="disabled:opacity-30">
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button onClick={() => moveSub(c.id, sIdx, 1)} disabled={sIdx === subs.length - 1} className="disabled:opacity-30">
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                      {editing?.type === 's' && editing.id === s.id ? (
                        <>
                          <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="flex-1 h-8" />
                          <Button size="icon" variant="ghost" onClick={saveEdit}><Save className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm">{s.name}</span>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing({ type: 's', id: s.id, name: s.name })}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget({ type: 's', id: s.id })}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="സബ് ക്ലസ്റ്റർ"
                      value={newSubName[c.id] || ''}
                      onChange={(e) => setNewSubName(prev => ({ ...prev, [c.id]: e.target.value }))}
                      className="h-8 text-sm"
                    />
                    <Button size="sm" variant="outline" onClick={() => addSubCluster(c.id)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {orderedClusters.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">ഇതുവരെ ക്ലസ്റ്റർ ഇല്ല</p>
          )}
        </div>
      </CardContent>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>നീക്കം ചെയ്യണോ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'c'
                ? 'ഈ ക്ലസ്റ്റർ നീക്കം ചെയ്താൽ അതിന്റെ സബ് ക്ലസ്റ്ററുകളും നീങ്ങും. ദാതാക്കളുടെ assignment-ഉം ഒഴിയും.'
                : 'സബ് ക്ലസ്റ്റർ നീക്കം ചെയ്യപ്പെടും.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>റദ്ദാക്കുക</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">നീക്കം ചെയ്യുക</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ClustersManager;
