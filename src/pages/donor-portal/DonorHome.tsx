import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDonorAuth } from '@/contexts/DonorAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, Landmark, BookOpen, Phone, HandHeart } from 'lucide-react';
import PortalHeader from '@/components/portal/PortalHeader';
import PortalNav from '@/components/portal/PortalNav';
import campusImage from '@/assets/campus-building.jpg';
import leader1Image from '@/assets/leader-1.jpg';
import leader2Image from '@/assets/leader-2.jpg';

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

  const handleMediaClick = (item: MediaItem) => {
    if (item.url) {
      window.open(item.url, '_blank');
    }
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
      label: language === 'ml' ? 'അജ്മീർ ഗേറ്റ്\nസംരംഭങ്ങൾ' : 'AG\nInitiatives',
    },
    {
      to: '/portal/gatherings',
      icon: BookOpen,
      label: language === 'ml' ? 'ആത്മീയ സദസ്സുകൾ' : 'Spiritual\nGatherings',
    },
    {
      to: '/portal/contacts',
      icon: Phone,
      label: language === 'ml' ? 'ബന്ധപ്പെടേണ്ട\nനമ്പറുകൾ' : 'Contact\nNumbers',
    },
    {
      to: '/portal/dua-request',
      icon: HandHeart,
      label: language === 'ml' ? 'ദുആ റിക്വസ്റ്റ്' : 'Dua Request',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PortalHeader />

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
        <div className="p-4 space-y-4">
          {/* Media Slider */}
          {media.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl bg-muted aspect-video">
              {media.map((item, index) => {
                const isVideo = item.type === 'video';
                const thumbnail = isVideo ? getVideoThumbnail(item.url) : null;
                return (
                  <div
                    key={item.id}
                    className="absolute inset-0 transition-opacity duration-700 cursor-pointer"
                    style={{ opacity: index === currentSlide ? 1 : 0, pointerEvents: index === currentSlide ? 'auto' : 'none' }}
                    onClick={() => handleMediaClick(item)}
                  >
                    {isVideo && thumbnail ? (
                      <div className="relative w-full h-full">
                        <img
                          src={thumbnail}
                          alt={item.title || 'Video'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const ytId = getYouTubeId(item.url);
                            if (ytId) (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                          }}
                        />
                        {/* Play button overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
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
                    onClick={(e) => { e.stopPropagation(); setCurrentSlide(prev => (prev - 1 + media.length) % media.length); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-black/30 rounded-full text-white z-10"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setCurrentSlide(prev => (prev + 1) % media.length); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-black/30 rounded-full text-white z-10"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {media.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); setCurrentSlide(i); }}
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

          {/* Action Buttons - 2x2 Grid */}
          <div className="grid grid-cols-2 gap-3">
            {actionButtons.map(({ to, label }) => (
              <Link key={to} to={to}>
                <button className="w-full py-4 px-3 text-sm font-medium border-2 border-primary/40 text-foreground hover:bg-primary/5 rounded-xl whitespace-pre-line leading-tight text-center">
                  {label}
                </button>
              </Link>
            ))}
          </div>
        </div>

        {/* Campus building image fills remaining space */}
        <div className="flex-1 min-h-[250px] relative overflow-hidden">
          {/* White gradient overlay at top */}
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-background to-transparent z-10" />
          <img
            src={campusImage}
            alt="Ajmeer Gate Campus"
            className="w-full h-full object-cover scale-125 object-center"
          />
        </div>
      </div>

      <PortalNav />
    </div>
  );
};

export default DonorHome;
