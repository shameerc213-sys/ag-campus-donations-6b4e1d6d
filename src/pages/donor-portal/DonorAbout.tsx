import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDonorAuth } from '@/contexts/DonorAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, MapPin, Mail, ExternalLink, Youtube, Instagram, Facebook, Link as LinkIcon, Info } from 'lucide-react';
import PortalHeader from '@/components/portal/PortalHeader';
import PortalNav from '@/components/portal/PortalNav';

interface OrgSettings {
  org_name: string;
  org_address: string;
  org_phone: string;
  org_email: string;
  org_description: string;
  org_location_url: string;
  org_website: string;
}

interface SocialLink {
  id: string;
  platform: string;
  title: string;
  url: string;
  thumbnail_url: string | null;
}

const DonorAbout = () => {
  const { donor, loading } = useDonorAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    if (!loading && !donor) navigate('/portal');
  }, [donor, loading, navigate]);

  useEffect(() => {
    fetchSettings();
    fetchSocialLinks();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('organization_settings').select('key, value');
      if (data) {
        const obj: Record<string, string> = {};
        data.forEach(item => { obj[item.key] = item.value || ''; });
        setSettings(obj as unknown as OrgSettings);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchSocialLinks = async () => {
    try {
      const { data } = await supabase.from('social_links').select('*').order('sort_order', { ascending: true });
      setSocialLinks(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const openMap = () => {
    if (settings?.org_location_url) {
      window.open(settings.org_location_url, '_blank');
    } else if (settings?.org_address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.org_address)}`, '_blank');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube': return <Youtube className="w-5 h-5 text-destructive" />;
      case 'instagram': return <Instagram className="w-5 h-5 text-primary" />;
      case 'facebook': return <Facebook className="w-5 h-5 text-primary" />;
      default: return <LinkIcon className="w-5 h-5 text-muted-foreground" />;
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

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader />

      <div className="max-w-lg mx-auto p-4 space-y-4 pb-24">
        {loadingSettings ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <Card className="border-t-4 border-t-primary">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  {t('donor.aboutOrg')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-primary">{settings?.org_name || t('app.name')}</h2>
                </div>

                {/* Location */}
                {settings?.org_address && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      {language === 'ml' ? 'ലൊക്കേഷൻ' : 'Location'}
                    </h3>
                    <button onClick={openMap} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors w-full text-left">
                      <span className="flex-1 text-sm">{settings.org_address}</span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                )}

                {/* Website */}
                {settings?.org_website && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-primary" />
                      {language === 'ml' ? 'വെബ്സൈറ്റ്' : 'Website'}
                    </h3>
                    <a href={settings.org_website.startsWith('http') ? settings.org_website : `https://${settings.org_website}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <span className="text-sm text-primary">{settings.org_website}</span>
                    </a>
                  </div>
                )}

                {/* Email */}
                {settings?.org_email && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      {language === 'ml' ? 'ഇമെയിൽ' : 'Email'}
                    </h3>
                    <a href={`mailto:${settings.org_email}`} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <span className="text-sm">{settings.org_email}</span>
                    </a>
                  </div>
                )}

                {/* Phone */}
                {settings?.org_phone && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary" />
                      {language === 'ml' ? 'ഫോൺ' : 'Phone'}
                    </h3>
                    <a href={`tel:${settings.org_phone}`} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <span className="text-sm">{settings.org_phone}</span>
                    </a>
                  </div>
                )}

                {/* Description */}
                {settings?.org_description && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">
                      {language === 'ml' ? 'സ്ഥാപനത്തെ കുറിച്ച്' : 'About'}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{settings.org_description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {socialLinks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-primary" />
                    {language === 'ml' ? 'സോഷ്യൽ മീഡിയ' : 'Social Media'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {socialLinks.map((link) => (
                    <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      {link.thumbnail_url ? (
                        <img src={link.thumbnail_url} alt={link.title} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                      ) : getPlatformIcon(link.platform)}
                      <span className="flex-1 truncate">{link.title}</span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <PortalNav />
    </div>
  );
};

export default DonorAbout;
