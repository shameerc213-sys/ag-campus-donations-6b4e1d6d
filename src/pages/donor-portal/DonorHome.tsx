import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDonorAuth } from '@/contexts/DonorAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Landmark, BookOpen, Phone, HandHeart } from 'lucide-react';
import PortalHeader from '@/components/portal/PortalHeader';
import PortalNav from '@/components/portal/PortalNav';

interface MediaItem {
  id: string;
  type: string;
  url: string;
  title: string | null;
}

const DonorHome = () => {
  const { donor, loading } = useDonorAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

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
        .order('created_at', { ascending: false })
        .limit(10);
      setMedia(data || []);
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  };

  // Auto-slide
  useEffect(() => {
    if (media.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % media.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [media.length]);

  const getYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const getVideoThumbnail = (url: string) => {
    const ytId = getYouTubeId(url);
    if (ytId) return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!donor) return null;

  const actionButtons = [
    {
      to: '/portal/initiatives',
      icon: Landmark,
      label: language === 'ml' ? 'അജ്മീർ ഗേറ്റ് സംരംഭങ്ങൾ' : 'AG Initiatives',
    },
    {
      to: '/portal/gatherings',
      icon: BookOpen,
      label: language === 'ml' ? 'ആത്മീയ സദസ്സുകൾ' : 'Spiritual Gatherings',
    },
    {
      to: '/portal/contacts',
      icon: Phone,
      label: language === 'ml' ? 'ബന്ധപ്പെടേണ്ട നമ്പറുകൾ' : 'Contact Numbers',
    },
    {
      to: '/portal/dua-request',
      icon: HandHeart,
      label: language === 'ml' ? 'ദുആ റിക്വസ്റ്റ്' : 'Dua Request',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader />

      <div className="max-w-lg mx-auto p-4 space-y-5 pb-20">
        {/* Media Slider */}
        {media.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl bg-muted aspect-video">
            {media.map((item, index) => {
              const isVideo = item.type === 'video';
              const thumbnail = isVideo ? getVideoThumbnail(item.url) : null;
              return (
                <div
                  key={item.id}
                  className="absolute inset-0 transition-opacity duration-700"
                  style={{ opacity: index === currentSlide ? 1 : 0, pointerEvents: index === currentSlide ? 'auto' : 'none' }}
                >
                  {isVideo && thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={item.title || 'Video'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const ytId = getYouTubeId(item.url);
                        if (ytId) (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                      }}
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.title || 'Media'}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              );
            })}

            {media.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentSlide(prev => (prev - 1 + media.length) % media.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-black/30 rounded-full text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentSlide(prev => (prev + 1) % media.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-black/30 rounded-full text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {media.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === currentSlide ? 'bg-white' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Dashed separator */}
        <div className="border-t-2 border-dashed border-primary/30" />

        {/* Action Buttons */}
        <div className="space-y-3">
          {actionButtons.map(({ to, label }) => (
            <Link key={to} to={to}>
              <Button
                variant="outline"
                className="w-full py-5 text-lg font-medium border-2 border-primary/40 text-foreground hover:bg-primary/5 rounded-xl"
              >
                {label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      <PortalNav />
    </div>
  );
};

export default DonorHome;
