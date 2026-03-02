import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit2, Save, X, Landmark } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Initiative {
  id: string;
  title: string;
  description: string | null;
  sort_order: number | null;
}

const InitiativesManager = () => {
  const [items, setItems] = useState<Initiative[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from('initiatives').select('*').order('sort_order', { ascending: true });
    setItems(data || []);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    try {
      if (editingId) {
        await supabase.from('initiatives').update({ title: title.trim(), description: description.trim() || null }).eq('id', editingId);
      } else {
        await supabase.from('initiatives').insert({ title: title.trim(), description: description.trim() || null, sort_order: items.length });
      }
      resetForm();
      fetchItems();
      toast({ title: 'സേവ് ചെയ്തു' });
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleEdit = (item: Initiative) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description || '');
    setIsAdding(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('initiatives').delete().eq('id', deleteId);
    setDeleteId(null);
    fetchItems();
    toast({ title: 'നീക്കം ചെയ്തു' });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEditingId(null);
    setIsAdding(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="w-5 h-5" />
          സംരംഭങ്ങൾ ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding ? (
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label>ടൈറ്റിൽ</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="സംരംഭത്തിന്റെ പേര്" />
            </div>
            <div className="space-y-2">
              <Label>വിവരണം</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="വിശദാംശങ്ങൾ" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm"><Save className="w-4 h-4 mr-1" />സേവ്</Button>
              <Button onClick={resetForm} variant="outline" size="sm"><X className="w-4 h-4 mr-1" />റദ്ദാക്കുക</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-2" />പുതിയ സംരംഭം ചേർക്കുക
          </Button>
        )}

        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between p-3 bg-muted rounded-lg">
            <div className="flex-1">
              <p className="font-medium">{item.title}</p>
              {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
            </div>
            <div className="flex gap-1 ml-2">
              <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}><Edit2 className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleteId(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>നീക്കം ചെയ്യണോ?</AlertDialogTitle>
            <AlertDialogDescription>ഈ സംരംഭം നീക്കം ചെയ്യപ്പെടും.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>റദ്ദാക്കുക</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>നീക്കം ചെയ്യുക</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default InitiativesManager;
