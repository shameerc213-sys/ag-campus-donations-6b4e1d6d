import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit2, Save, X, Phone, ArrowUp, ArrowDown, Upload, MapPin, Image as ImageIcon } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Contact {
  id: string;
  name: string;
  designation: string | null;
  phone: string | null;
  phones: string[];
  photos: string[];
  location: string | null;
  sort_order: number | null;
}

const ContactsManager = () => {
  const [items, setItems] = useState<Contact[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [phones, setPhones] = useState<string[]>(['']);
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from('contacts').select('*').order('sort_order', { ascending: true });
    setItems(((data || []) as any[]).map(r => ({
      ...r,
      phones: Array.isArray(r.phones) && r.phones.length ? r.phones : (r.phone ? [r.phone] : []),
      photos: Array.isArray(r.photos) ? r.photos : [],
    })));
  };

  const handlePhoneChange = (i: number, v: string) => {
    setPhones(prev => prev.map((p, idx) => idx === i ? v : p));
  };
  const addPhone = () => setPhones(prev => [...prev, '']);
  const removePhone = (i: number) => setPhones(prev => prev.filter((_, idx) => idx !== i));

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `contacts/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('org-media').upload(path, file, { contentType: file.type });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('org-media').getPublicUrl(path);
        newUrls.push(publicUrl);
      }
      setPhotos(prev => [...prev, ...newUrls]);
    } catch (e: any) {
      toast({ title: 'അപ്‌ലോഡ് പിശക്', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removePhoto = (i: number) => setPhotos(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    const cleanPhones = phones.map(p => p.trim()).filter(Boolean);
    if (!name.trim() || cleanPhones.length === 0) {
      toast({ title: 'പേരും ഒരു ഫോൺ നമ്പറും ആവശ്യമാണ്', variant: 'destructive' });
      return;
    }
    const payload: any = {
      name: name.trim(),
      designation: designation.trim() || null,
      phone: cleanPhones[0],
      phones: cleanPhones,
      photos,
      location: location.trim() || null,
    };
    try {
      if (editingId) {
        await supabase.from('contacts').update(payload).eq('id', editingId);
      } else {
        await supabase.from('contacts').insert({ ...payload, sort_order: items.length });
      }
      resetForm();
      fetchItems();
      toast({ title: 'സേവ് ചെയ്തു' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleEdit = (item: Contact) => {
    setEditingId(item.id);
    setName(item.name);
    setDesignation(item.designation || '');
    setPhones(item.phones.length ? item.phones : ['']);
    setPhotos(item.photos || []);
    setLocation(item.location || '');
    setIsAdding(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('contacts').delete().eq('id', deleteId);
    setDeleteId(null);
    fetchItems();
    toast({ title: 'നീക്കം ചെയ്തു' });
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    const a = items[index], b = items[newIndex];
    await Promise.all([
      supabase.from('contacts').update({ sort_order: newIndex }).eq('id', a.id),
      supabase.from('contacts').update({ sort_order: index }).eq('id', b.id),
    ]);
    fetchItems();
  };

  const resetForm = () => {
    setName(''); setDesignation(''); setPhones(['']); setPhotos([]); setLocation('');
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
              <Label>ഫോൺ നമ്പറുകൾ</Label>
              {phones.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={p} onChange={(e) => handlePhoneChange(i, e.target.value)} placeholder={`ഫോൺ ${i + 1}`} />
                  {phones.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removePhone(i)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addPhone}>
                <Plus className="w-4 h-4 mr-1" /> ഫോൺ ചേർക്കുക
              </Button>
            </div>

            <div className="space-y-2">
              <Label>ലൊക്കേഷൻ</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="വിലാസം / ഗൂഗിൾ മാപ് ലിങ്ക്" />
            </div>

            <div className="space-y-2">
              <Label>ഫോട്ടോകൾ</Label>
              <div className="flex flex-wrap gap-2">
                {photos.map((u, i) => (
                  <div key={i} className="relative">
                    <img src={u} alt="" className="w-16 h-16 object-cover rounded border" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handlePhotoUpload(e.target.files)}
              />
              <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-1" />
                {uploading ? 'അപ്‌ലോഡ്...' : 'ഫോട്ടോ ചേർക്കുക'}
              </Button>
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

        {items.map((item, index) => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3 min-w-0">
              {item.photos[0] ? (
                <img src={item.photos[0]} alt={item.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.designation ? `${item.designation} • ` : ''}{item.phones.join(', ')}
                </p>
                {item.location && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3" />{item.location}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="sm" onClick={() => handleMove(index, 'up')} disabled={index === 0}>
                <ArrowUp className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleMove(index, 'down')} disabled={index === items.length - 1}>
                <ArrowDown className="w-4 h-4" />
              </Button>
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
