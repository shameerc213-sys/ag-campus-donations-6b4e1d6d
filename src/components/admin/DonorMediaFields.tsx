import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  photos: string[];
  location: string;
  onPhotosChange: (photos: string[]) => void;
  onLocationChange: (location: string) => void;
}

const DonorMediaFields = ({ photos, location, onPhotosChange, onLocationChange }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `donors/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage
          .from('org-media')
          .upload(path, file, { contentType: file.type });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('org-media').getPublicUrl(path);
        newUrls.push(publicUrl);
      }
      onPhotosChange([...photos, ...newUrls]);
    } catch (e: any) {
      toast({ title: 'അപ്‌ലോഡ് പിശക്', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removePhoto = (i: number) =>
    onPhotosChange(photos.filter((_, idx) => idx !== i));

  return (
    <>
      <div className="space-y-2">
        <Label>ലൊക്കേഷൻ</Label>
        <Input
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder="വിലാസം / ഗൂഗിൾ മാപ് ലിങ്ക്"
        />
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
          onChange={(e) => handleUpload(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-1" />
          {uploading ? 'അപ്‌ലോഡ്...' : 'ഫോട്ടോ ചേർക്കുക'}
        </Button>
      </div>
    </>
  );
};

export default DonorMediaFields;
