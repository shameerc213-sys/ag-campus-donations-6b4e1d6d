import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit2, Save, X, BookOpen } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Gathering {
  id: string;
  title: string;
  description: string | null;
  day_of_week: string | null;
  time_info: string | null;
  date_info: string | null;
  sort_order: number | null;
}

const GatheringsManager = () => {
  const [items, setItems] = useState<Gathering[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [timeInfo, setTimeInfo] = useState('');
  const [dateInfo, setDateInfo] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from('spiritual_gatherings').select('*').order('sort_order', { ascending: true });
    setItems(data || []);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      day_of_week: dayOfWeek.trim() || null,
      time_info: timeInfo.trim() || null,
      date_info: dateInfo.trim() || null,
    };
    try {
      if (editingId) {
        await supabase.from('spiritual_gatherings').update(payload).eq('id', editingId);
      } else {
        await supabase.from('spiritual_gatherings').insert({ ...payload, sort_order: items.length });
      }
      resetForm();
      fetchItems();
      toast({ title: 'സേവ് ചെയ്തു' });
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleEdit = (item: Gathering) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description || '');
    setDayOfWeek(item.day_of_week || '');
    setTimeInfo(item.time_info || '');
    setDateInfo(item.date_info || '');
    setIsAdding(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('spiritual_gatherings').delete().eq('id', deleteId);
    setDeleteId(null);
    fetchItems();
    toast({ title: 'നീക്കം ചെയ്തു' });
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setDayOfWeek(''); setTimeInfo(''); setDateInfo('');
    setEditingId(null); setIsAdding(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          ആത്മീയ സദസ്സുകൾ ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding ? (
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label>ടൈറ്റിൽ</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="സദസ്സിന്റെ പേര്" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>ദിവസം</Label>
                <Input value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} placeholder="ഉദാ: എല്ലാ വെള്ളിയാഴ്ചയും" />
              </div>
              <div className="space-y-2">
                <Label>സമയം</Label>
                <Input value={timeInfo} onChange={(e) => setTimeInfo(e.target.value)} placeholder="ഉദാ: വൈകുന്നേരം 5:00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>തീയതി / അധിക വിവരം</Label>
              <Input value={dateInfo} onChange={(e) => setDateInfo(e.target.value)} placeholder="ഉദാ: 2026 മാർച്ച് 15" />
            </div>
            <div className="space-y-2">
              <Label>വിവരണം</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm"><Save className="w-4 h-4 mr-1" />സേവ്</Button>
              <Button onClick={resetForm} variant="outline" size="sm"><X className="w-4 h-4 mr-1" />റദ്ദാക്കുക</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-2" />പുതിയ സദസ്സ് ചേർക്കുക
          </Button>
        )}

        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between p-3 bg-muted rounded-lg">
            <div className="flex-1">
              <p className="font-medium">{item.title}</p>
              <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                {item.day_of_week && <span>{item.day_of_week}</span>}
                {item.time_info && <span>• {item.time_info}</span>}
              </div>
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
            <AlertDialogDescription>ഈ സദസ്സ് നീക്കം ചെയ്യപ്പെടും.</AlertDialogDescription>
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

export default GatheringsManager;
