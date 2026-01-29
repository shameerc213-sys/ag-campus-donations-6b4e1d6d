import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Building, Image, Video, Globe, Trash2, Plus, Upload, Link as LinkIcon, MapPin, Youtube, Instagram, Facebook } from 'lucide-react';
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

interface OrgSettings {
  org_name: string;
  org_address: string;
  org_phone: string;
  org_email: string;
  org_description: string;
  org_location_url: string;
  password_prefix: string;
  default_language: string;
  social_youtube: string;
  social_instagram: string;
  social_facebook: string;
}

interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  title: string | null;
  sort_order: number;
}

const Settings = () => {
  const [settings, setSettings] = useState<OrgSettings>({
    org_name: '',
    org_address: '',
    org_phone: '',
    org_email: '',
    org_description: '',
    org_location_url: '',
    password_prefix: 'OM',
    default_language: 'ml',
    social_youtube: '',
    social_instagram: '',
    social_facebook: '',
  });
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [deleteMediaId, setDeleteMediaId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
    fetchMedia();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('organization_settings')
        .select('key, value');

      if (data) {
        const settingsObj: Record<string, string> = {};
        data.forEach(item => {
          settingsObj[item.key] = item.value || '';
        });
        setSettings(prev => ({ ...prev, ...settingsObj }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedia = async () => {
    try {
      const { data } = await supabase
        .from('org_media')
        .select('*')
        .order('sort_order', { ascending: true });

      setMedia((data || []).map(item => ({
        ...item,
        type: item.type as 'photo' | 'video'
      })));
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await supabase
          .from('organization_settings')
          .upsert({ key, value }, { onConflict: 'key' });
      }

      toast({
        title: 'സേവ് ചെയ്തു',
        description: 'ക്രമീകരണങ്ങൾ വിജയകരമായി സേവ് ചെയ്തു',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'ക്രമീകരണങ്ങൾ സേവ് ചെയ്യാൻ കഴിഞ്ഞില്ല',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('org-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('org-media')
        .getPublicUrl(filePath);

      await supabase.from('org_media').insert({
        type: 'photo',
        url: urlData.publicUrl,
        title: file.name,
        sort_order: media.length,
      });

      fetchMedia();
      toast({
        title: 'അപ്‌ലോഡ് ചെയ്തു',
        description: 'ഫോട്ടോ വിജയകരമായി അപ്‌ലോഡ് ചെയ്തു',
      });
    } catch (error) {
      console.error('Error uploading:', error);
      toast({
        title: 'Error',
        description: 'ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddVideo = async () => {
    if (!videoUrl.trim()) return;

    try {
      await supabase.from('org_media').insert({
        type: 'video',
        url: videoUrl.trim(),
        title: videoTitle.trim() || 'Video',
        sort_order: media.length,
      });

      setVideoUrl('');
      setVideoTitle('');
      fetchMedia();
      toast({
        title: 'ചേർത്തു',
        description: 'വീഡിയോ വിജയകരമായി ചേർത്തു',
      });
    } catch (error) {
      console.error('Error adding video:', error);
      toast({
        title: 'Error',
        description: 'വീഡിയോ ചേർക്കാൻ കഴിഞ്ഞില്ല',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMedia = async () => {
    if (!deleteMediaId) return;

    try {
      const mediaItem = media.find(m => m.id === deleteMediaId);
      
      // If it's a photo, also delete from storage
      if (mediaItem?.type === 'photo') {
        const path = mediaItem.url.split('/org-media/')[1];
        if (path) {
          await supabase.storage.from('org-media').remove([path]);
        }
      }

      await supabase.from('org_media').delete().eq('id', deleteMediaId);
      
      fetchMedia();
      toast({
        title: 'നീക്കം ചെയ്തു',
        description: 'മീഡിയ വിജയകരമായി നീക്കം ചെയ്തു',
      });
    } catch (error) {
      console.error('Error deleting media:', error);
      toast({
        title: 'Error',
        description: 'മീഡിയ നീക്കം ചെയ്യാൻ കഴിഞ്ഞില്ല',
        variant: 'destructive',
      });
    } finally {
      setDeleteMediaId(null);
    }
  };

  const photos = media.filter(m => m.type === 'photo');
  const videos = media.filter(m => m.type === 'video');

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <SettingsIcon className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">ക്രമീകരണങ്ങൾ</h1>
      </div>

      <Tabs defaultValue="org" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="org" className="flex items-center gap-1">
            <Building className="w-4 h-4" />
            <span className="hidden sm:inline">സ്ഥാപനം</span>
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-1">
            <Image className="w-4 h-4" />
            <span className="hidden sm:inline">മീഡിയ</span>
          </TabsTrigger>
          <TabsTrigger value="app" className="flex items-center gap-1">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">ആപ്പ്</span>
          </TabsTrigger>
        </TabsList>

        {/* Organization Settings */}
        <TabsContent value="org">
          <Card>
            <CardHeader>
              <CardTitle>സ്ഥാപന വിവരങ്ങൾ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org_name">സ്ഥാപനത്തിന്റെ പേര്</Label>
                <Input
                  id="org_name"
                  value={settings.org_name}
                  onChange={(e) => setSettings(prev => ({ ...prev, org_name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org_description">വിവരണം</Label>
                <Textarea
                  id="org_description"
                  value={settings.org_description}
                  onChange={(e) => setSettings(prev => ({ ...prev, org_description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org_address">വിലാസം</Label>
                <Textarea
                  id="org_address"
                  value={settings.org_address}
                  onChange={(e) => setSettings(prev => ({ ...prev, org_address: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="org_phone">ഫോൺ</Label>
                  <Input
                    id="org_phone"
                    value={settings.org_phone}
                    onChange={(e) => setSettings(prev => ({ ...prev, org_phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org_email">ഇമെയിൽ</Label>
                  <Input
                    id="org_email"
                    type="email"
                    value={settings.org_email}
                    onChange={(e) => setSettings(prev => ({ ...prev, org_email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="org_location_url">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  ലൊക്കേഷൻ ലിങ്ക് (Google Maps URL)
                </Label>
                <Input
                  id="org_location_url"
                  value={settings.org_location_url}
                  onChange={(e) => setSettings(prev => ({ ...prev, org_location_url: e.target.value }))}
                  placeholder="https://maps.app.goo.gl/..."
                />
                <p className="text-xs text-muted-foreground">
                  Google Maps ലിങ്ക് നേരിട്ട് പേസ്റ്റ് ചെയ്യുക
                </p>
              </div>

              {/* Social Media Links */}
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  സോഷ്യൽ മീഡിയ ലിങ്കുകൾ
                </h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="social_youtube" className="flex items-center gap-2">
                      <Youtube className="w-4 h-4 text-red-500" />
                      YouTube
                    </Label>
                    <Input
                      id="social_youtube"
                      value={settings.social_youtube}
                      onChange={(e) => setSettings(prev => ({ ...prev, social_youtube: e.target.value }))}
                      placeholder="https://youtube.com/@channel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="social_instagram" className="flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-pink-500" />
                      Instagram
                    </Label>
                    <Input
                      id="social_instagram"
                      value={settings.social_instagram}
                      onChange={(e) => setSettings(prev => ({ ...prev, social_instagram: e.target.value }))}
                      placeholder="https://instagram.com/username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="social_facebook" className="flex items-center gap-2">
                      <Facebook className="w-4 h-4 text-blue-600" />
                      Facebook
                    </Label>
                    <Input
                      id="social_facebook"
                      value={settings.social_facebook}
                      onChange={(e) => setSettings(prev => ({ ...prev, social_facebook: e.target.value }))}
                      placeholder="https://facebook.com/page"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? 'സേവ് ചെയ്യുന്നു...' : 'സേവ് ചെയ്യുക'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Settings */}
        <TabsContent value="media" className="space-y-4">
          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                ഫോട്ടോകൾ ({photos.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക
              </Button>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.url}
                        alt={photo.title || 'Photo'}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setDeleteMediaId(photo.id)}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Videos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                വീഡിയോകൾ ({videos.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Input
                  placeholder="വീഡിയോ URL (YouTube, etc.)"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
                <Input
                  placeholder="ടൈറ്റിൽ (ഓപ്ഷണൽ)"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={handleAddVideo}
                  disabled={!videoUrl.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  വീഡിയോ ചേർക്കുക
                </Button>
              </div>

              {videos.length > 0 && (
                <div className="space-y-2">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[200px]">
                          {video.title || video.url}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteMediaId(video.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* App Settings */}
        <TabsContent value="app">
          <Card>
            <CardHeader>
              <CardTitle>ആപ്പ് ക്രമീകരണങ്ങൾ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password_prefix">പാസ്‌വേഡ് പ്രിഫിക്സ്</Label>
                <Input
                  id="password_prefix"
                  value={settings.password_prefix}
                  onChange={(e) => setSettings(prev => ({ ...prev, password_prefix: e.target.value }))}
                  placeholder="OM"
                />
                <p className="text-xs text-muted-foreground">
                  ദാതാക്കളുടെ പാസ്‌വേഡ്: {settings.password_prefix}+ഫോൺ നമ്പർ (ഉദാ: {settings.password_prefix}9876543210)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_language">ഡിഫോൾട്ട് ഭാഷ</Label>
                <select
                  id="default_language"
                  value={settings.default_language}
                  onChange={(e) => setSettings(prev => ({ ...prev, default_language: e.target.value }))}
                  className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background"
                >
                  <option value="ml">മലയാളം</option>
                  <option value="en">English</option>
                </select>
              </div>

              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? 'സേവ് ചെയ്യുന്നു...' : 'സേവ് ചെയ്യുക'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteMediaId} onOpenChange={() => setDeleteMediaId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>നീക്കം ചെയ്യണോ?</AlertDialogTitle>
            <AlertDialogDescription>
              ഈ മീഡിയ ഫയൽ ശാശ്വതമായി നീക്കം ചെയ്യപ്പെടും.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>റദ്ദാക്കുക</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMedia} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              നീക്കം ചെയ്യുക
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
