import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Trash2, Edit2, Link as LinkIcon, Upload, X, Save, 
  Youtube, Instagram, Facebook, Globe, ExternalLink 
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SocialLink {
  id: string;
  platform: string;
  title: string;
  url: string;
  thumbnail_url: string | null;
  sort_order: number;
}

const PLATFORMS = [
  { value: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-500' },
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  { value: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { value: 'other', label: 'Other', icon: Globe, color: 'text-muted-foreground' },
];

const SocialLinksManager = () => {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    platform: 'youtube',
    title: '',
    url: '',
    thumbnail_url: '',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching social links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `social-thumbnails/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('org-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('org-media')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, thumbnail_url: urlData.publicUrl }));
      
      toast({
        title: 'അപ്‌ലോഡ് ചെയ്തു',
        description: 'തമ്പ്‌നെയിൽ വിജയകരമായി അപ്‌ലോഡ് ചെയ്തു',
      });
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast({
        title: 'Error',
        description: 'തമ്പ്‌നെയിൽ അപ്‌ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.url.trim()) {
      toast({
        title: 'Error',
        description: 'ടൈറ്റിലും URL ഉം നൽകുക',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from('social_links')
          .update({
            platform: formData.platform,
            title: formData.title.trim(),
            url: formData.url.trim(),
            thumbnail_url: formData.thumbnail_url || null,
          })
          .eq('id', editingId);

        if (error) throw error;
        
        toast({
          title: 'അപ്‌ഡേറ്റ് ചെയ്തു',
          description: 'ലിങ്ക് വിജയകരമായി അപ്‌ഡേറ്റ് ചെയ്തു',
        });
      } else {
        // Create new
        const { error } = await supabase
          .from('social_links')
          .insert({
            platform: formData.platform,
            title: formData.title.trim(),
            url: formData.url.trim(),
            thumbnail_url: formData.thumbnail_url || null,
            sort_order: links.length,
          });

        if (error) throw error;
        
        toast({
          title: 'ചേർത്തു',
          description: 'ലിങ്ക് വിജയകരമായി ചേർത്തു',
        });
      }

      resetForm();
      fetchLinks();
    } catch (error) {
      console.error('Error saving link:', error);
      toast({
        title: 'Error',
        description: 'ലിങ്ക് സേവ് ചെയ്യാൻ കഴിഞ്ഞില്ല',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (link: SocialLink) => {
    setFormData({
      platform: link.platform,
      title: link.title,
      url: link.url,
      thumbnail_url: link.thumbnail_url || '',
    });
    setEditingId(link.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const link = links.find(l => l.id === deleteId);
      
      // Delete thumbnail from storage if exists
      if (link?.thumbnail_url?.includes('org-media')) {
        const path = link.thumbnail_url.split('/org-media/')[1];
        if (path) {
          await supabase.storage.from('org-media').remove([path]);
        }
      }

      const { error } = await supabase
        .from('social_links')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast({
        title: 'നീക്കം ചെയ്തു',
        description: 'ലിങ്ക് വിജയകരമായി നീക്കം ചെയ്തു',
      });
      
      fetchLinks();
    } catch (error) {
      console.error('Error deleting link:', error);
      toast({
        title: 'Error',
        description: 'ലിങ്ക് നീക്കം ചെയ്യാൻ കഴിഞ്ഞില്ല',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      platform: 'youtube',
      title: '',
      url: '',
      thumbnail_url: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getPlatformIcon = (platform: string) => {
    const p = PLATFORMS.find(pl => pl.value === platform);
    if (p) {
      const Icon = p.icon;
      return <Icon className={`w-5 h-5 ${p.color}`} />;
    }
    return <Globe className="w-5 h-5 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            സോഷ്യൽ മീഡിയ ലിങ്കുകൾ ({links.length})
          </span>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" />
              പുതിയ ലിങ്ക്
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add/Edit Form */}
        {showForm && (
          <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                {editingId ? 'ലിങ്ക് എഡിറ്റ് ചെയ്യുക' : 'പുതിയ ലിങ്ക് ചേർക്കുക'}
              </h4>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>പ്ലാറ്റ്ഫോം</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          <span className="flex items-center gap-2">
                            <p.icon className={`w-4 h-4 ${p.color}`} />
                            {p.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ടൈറ്റിൽ</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="ലിങ്കിന്റെ പേര്"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              {/* Thumbnail Upload */}
              <div className="space-y-2">
                <Label>തമ്പ്‌നെയിൽ (ഓപ്ഷണൽ)</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                    placeholder="ഇമേജ് URL അല്ലെങ്കിൽ അപ്‌ലോഡ് ചെയ്യുക"
                    className="flex-1"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {formData.thumbnail_url && (
                  <div className="relative w-20 h-20 mt-2">
                    <img
                      src={formData.thumbnail_url}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, thumbnail_url: '' }))}
                      className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {editingId ? 'അപ്‌ഡേറ്റ് ചെയ്യുക' : 'സേവ് ചെയ്യുക'}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  റദ്ദാക്കുക
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Links List */}
        {links.length > 0 ? (
          <div className="space-y-2">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                {/* Thumbnail or Platform Icon */}
                {link.thumbnail_url ? (
                  <img
                    src={link.thumbnail_url}
                    alt={link.title}
                    className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    {getPlatformIcon(link.platform)}
                  </div>
                )}

                {/* Link Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(link.platform)}
                    <span className="font-medium truncate">{link.title}</span>
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground truncate flex items-center gap-1 hover:text-primary"
                  >
                    {link.url.substring(0, 40)}...
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(link)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(link.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <LinkIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>സോഷ്യൽ മീഡിയ ലിങ്കുകൾ ഇല്ല</p>
            <p className="text-sm">പുതിയ ലിങ്ക് ചേർക്കാൻ മുകളിലെ ബട്ടൺ ഉപയോഗിക്കുക</p>
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>നീക്കം ചെയ്യണോ?</AlertDialogTitle>
            <AlertDialogDescription>
              ഈ ലിങ്ക് ശാശ്വതമായി നീക്കം ചെയ്യപ്പെടും.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>റദ്ദാക്കുക</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              നീക്കം ചെയ്യുക
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default SocialLinksManager;
