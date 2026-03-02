import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit2, Save, X, Phone } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Contact {
  id: string;
  name: string;
  designation: string | null;
  phone: string;
  sort_order: number | null;
}

const ContactsManager = () => {
  const [items, setItems] = useState<Contact[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from('contacts').select('*').order('sort_order', { ascending: true });
    setItems(data || []);
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) return;
    const payload = { name: name.trim(), designation: designation.trim() || null, phone: phone.trim() };
    try {
      if (editingId) {
        await supabase.from('contacts').update(payload).eq('id', editingId);
      } else {
        await supabase.from('contacts').insert({ ...payload, sort_order: items.length });
      }
      resetForm();
      fetchItems();
      toast({ title: 'സേവ് ചെയ്തു' });
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleEdit = (item: Contact) => {
    setEditingId(item.id);
    setName(item.name);
    setDesignation(item.designation || '');
    setPhone(item.phone);
    setIsAdding(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('contacts').delete().eq('id', deleteId);
    setDeleteId(null);
    fetchItems();
    toast({ title: 'നീക്കം ചെയ്തു' });
  };

  const resetForm = () => {
    setName(''); setDesignation(''); setPhone('');
    setEditingId(null); setIsAdding(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          ബന്ധപ്പെടേണ്ട നമ്പറുകൾ ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding ? (
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label>പേര്</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="വ്യക്തിയുടെ പേര്" />
            </div>
            <div className="space-y-2">
              <Label>ഡെസിഗ്നേഷൻ</Label>
              <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="ഉദാ: പ്രസിഡന്റ്" />
            </div>
            <div className="space-y-2">
              <Label>ഫോൺ നമ്പർ</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="ഫോൺ നമ്പർ" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm"><Save className="w-4 h-4 mr-1" />സേവ്</Button>
              <Button onClick={resetForm} variant="outline" size="sm"><X className="w-4 h-4 mr-1" />റദ്ദാക്കുക</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-2" />പുതിയ കോൺടാക്ട് ചേർക്കുക
          </Button>
        )}

        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.designation} • {item.phone}</p>
            </div>
            <div className="flex gap-1">
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
            <AlertDialogDescription>ഈ കോൺടാക്ട് നീക്കം ചെയ്യപ്പെടും.</AlertDialogDescription>
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

export default ContactsManager;
