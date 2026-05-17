import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Stamp, PenTool, Hash, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AssetKey = 'seal_url' | 'signature_url' | 'org_logo_url';

const BrandingManager = () => {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({
    seal_url: '',
    signature_url: '',
    org_logo_url: '',
    receipt_prefix: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<AssetKey | null>(null);
  const refs: Record<AssetKey, React.RefObject<HTMLInputElement>> = {
    seal_url: useRef<HTMLInputElement>(null),
    signature_url: useRef<HTMLInputElement>(null),
    org_logo_url: useRef<HTMLInputElement>(null),
  };

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('organization_settings').select('key, value');
    const obj: Record<string, string> = { seal_url: '', signature_url: '', org_logo_url: '', receipt_prefix: '' };
    (data || []).forEach(r => { if (r.key in obj || ['seal_url','signature_url','org_logo_url','receipt_prefix'].includes(r.key)) obj[r.key] = r.value || ''; });
    setValues(obj);
    setLoading(false);
  };

  const upsert = async (key: string, value: string) => {
    await supabase.from('organization_settings').upsert({ key, value }, { onConflict: 'key' });
  };

  const handleUpload = async (key: AssetKey, file: File) => {
    setUploading(key);
    try {
      const ext = file.name.split('.').pop();
      const path = `${key}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('branding').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('branding').getPublicUrl(path);
      await upsert(key, publicUrl);
      setValues(prev => ({ ...prev, [key]: publicUrl }));
      toast({ title: 'അപ്‌ലോഡ് ചെയ്തു' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  };

  const savePrefix = async () => {
    setSaving(true);
    await upsert('receipt_prefix', values.receipt_prefix.trim());
    setSaving(false);
    toast({ title: 'സേവ് ചെയ്തു' });
  };

  if (loading) return <Card><CardContent className="p-6">Loading...</CardContent></Card>;

  const AssetRow = ({ k, label, Icon }: { k: AssetKey; label: string; Icon: any }) => (
    <div className="space-y-2">
      <Label className="flex items-center gap-2"><Icon className="w-4 h-4" />{label}</Label>
      <div className="flex items-center gap-3">
        {values[k] ? (
          <img src={values[k]} alt={label} className="h-16 w-16 object-contain border rounded bg-white" />
        ) : (
          <div className="h-16 w-16 border rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">No image</div>
        )}
        <input
          ref={refs[k]}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(k, f); e.target.value = ''; }}
        />
        <Button variant="outline" size="sm" onClick={() => refs[k].current?.click()} disabled={uploading === k}>
          <Upload className="w-4 h-4 mr-2" />
          {uploading === k ? 'അപ്‌ലോഡ്...' : 'അപ്‌ലോഡ്'}
        </Button>
        {values[k] && (
          <Button variant="ghost" size="sm" onClick={async () => { await upsert(k, ''); setValues(prev => ({ ...prev, [k]: '' })); }}>
            നീക്കം ചെയ്യുക
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stamp className="w-5 h-5 text-primary" />
          റസീറ്റ് & ബ്രാൻഡിംഗ്
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><Hash className="w-4 h-4" />റസീറ്റ് നമ്പർ പ്രിഫിക്സ്</Label>
          <div className="flex gap-2">
            <Input
              placeholder="ഉദാ: AGK/2026/"
              value={values.receipt_prefix}
              onChange={(e) => setValues(prev => ({ ...prev, receipt_prefix: e.target.value }))}
            />
            <Button onClick={savePrefix} disabled={saving}>സേവ്</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            ഉദാഹരണം: "{values.receipt_prefix}00001"
          </p>
        </div>

        <AssetRow k="org_logo_url" label="ലോഗോ" Icon={ImageIcon} />
        <AssetRow k="seal_url" label="സീൽ" Icon={Stamp} />
        <AssetRow k="signature_url" label="ഒപ്പ്" Icon={PenTool} />
      </CardContent>
    </Card>
  );
};

export default BrandingManager;
