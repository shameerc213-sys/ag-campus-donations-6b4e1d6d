import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';
import { z } from 'zod';
import ClusterSelect from '@/components/admin/ClusterSelect';
import DonorMediaFields from '@/components/admin/DonorMediaFields';

const donorSchema = z.object({
  name: z.string().trim().min(1, 'പേര് നൽകുക').max(100, 'പേര് വളരെ നീളമുള്ളതാണ്'),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

const AddDonor = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [clusterId, setClusterId] = useState<string | null>(null);
  const [subClusterId, setSubClusterId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = donorSchema.safeParse({ name, phone, address, notes });
    if (!validation.success) {
      toast({ title: 'Error', description: validation.error.errors[0].message, variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('donors')
        .insert({
          name: name.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          notes: notes.trim() || null,
          cluster_id: clusterId,
          sub_cluster_id: subClusterId,
          photos,
          location: location.trim() || null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'വിജയകരം!', description: 'പുതിയ ദാതാവ് ചേർത്തു' });
      navigate(`/donor/${data.id}`);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">പുതിയ ദാതാവ് ചേർക്കുക</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            ദാതാവിന്റെ വിവരങ്ങൾ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">പേര് *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ദാതാവിന്റെ പേര്" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">ഫോൺ നമ്പർ</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="ഫോൺ നമ്പർ" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">വിലാസം</Label>
              <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="വിലാസം" rows={2} />
            </div>

            <DonorMediaFields
              photos={photos}
              location={location}
              onPhotosChange={setPhotos}
              onLocationChange={setLocation}
            />

            <ClusterSelect
              clusterId={clusterId}
              subClusterId={subClusterId}
              onChange={(c, s) => { setClusterId(c); setSubClusterId(s); }}
            />

            <div className="space-y-2">
              <Label htmlFor="notes">കുറിപ്പുകൾ</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="കൂടുതൽ വിവരങ്ങൾ..." rows={2} />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'കാത്തിരിക്കുക...' : 'ദാതാവിനെ ചേർക്കുക'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddDonor;
