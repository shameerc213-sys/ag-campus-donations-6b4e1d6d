import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDonorAuth } from '@/contexts/DonorAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, LogOut, Info, Image, IndianRupee, Globe, Play, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  title: string | null;
}

const DonorGallery = () => {
  const { donor, logout, loading } = useDonorAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !donor) {
      navigate('/portal');
    }
  }, [donor, loading, navigate]);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const { data } = await supabase
        .from('org_media')
        .select('id, type, url, title')
        .order('sort_order', { ascending: true });

      setMedia((data || []).map(item => ({
        ...item,
        type: item.type as 'photo' | 'video'
      })));
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/portal');
  };

  const photos = media.filter(m => m.type === 'photo');
  const videos = media.filter(m => m.type === 'video');

  const getYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!donor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-4 px-4 sticky top-0 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6" />
            <span className="font-semibold">{t('app.name')}</span>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Globe className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setLanguage('ml')}>
                  മലയാളം
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('en')}>
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4 pb-24">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              {t('donor.gallery')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMedia ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : media.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {language === 'ml' ? 'ഫോട്ടോകളോ വീഡിയോകളോ ഇല്ല' : 'No photos or videos'}
              </p>
            ) : (
              <Tabs defaultValue="photos">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="photos">
                    {t('admin.photos')} ({photos.length})
                  </TabsTrigger>
                  <TabsTrigger value="videos">
                    {t('admin.videos')} ({videos.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="photos" className="mt-4">
                  {photos.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      {language === 'ml' ? 'ഫോട്ടോകൾ ഇല്ല' : 'No photos'}
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {photos.map((photo) => (
                        <button
                          key={photo.id}
                          onClick={() => setSelectedImage(photo.url)}
                          className="aspect-square overflow-hidden rounded-lg bg-muted"
                        >
                          <img
                            src={photo.url}
                            alt={photo.title || 'Photo'}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="videos" className="mt-4">
                  {videos.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      {language === 'ml' ? 'വീഡിയോകൾ ഇല്ല' : 'No videos'}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {videos.map((video) => {
                        const youtubeId = getYouTubeId(video.url);
                        return (
                          <a
                            key={video.id}
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                          >
                            {youtubeId ? (
                              <img
                                src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                                alt={video.title || 'Video'}
                                className="w-20 h-14 object-cover rounded"
                              />
                            ) : (
                              <div className="w-20 h-14 bg-muted rounded flex items-center justify-center">
                                <Play className="w-6 h-6 text-primary" />
                              </div>
                            )}
                            <span className="flex-1 text-sm">
                              {video.title || 'Video'}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-2 right-2 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
          >
            <X className="w-5 h-5" />
          </button>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Full size"
              className="w-full h-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex justify-around py-2">
            <Link
              to="/portal/home"
              className="flex flex-col items-center py-2 px-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent/50"
            >
              <IndianRupee className="w-5 h-5" />
              <span className="text-xs mt-1">{t('donor.donationHistory')}</span>
            </Link>
            <Link
              to="/portal/about"
              className="flex flex-col items-center py-2 px-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent/50"
            >
              <Info className="w-5 h-5" />
              <span className="text-xs mt-1">{t('donor.aboutOrg')}</span>
            </Link>
            <Link
              to="/portal/gallery"
              className="flex flex-col items-center py-2 px-3 rounded-lg text-primary bg-accent"
            >
              <Image className="w-5 h-5" />
              <span className="text-xs mt-1">{t('donor.gallery')}</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default DonorGallery;
