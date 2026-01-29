import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDonorAuth } from '@/contexts/DonorAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MapPin, Mail, Heart, LogOut, Info, Image, IndianRupee, Globe, ExternalLink, Youtube, Instagram, Facebook } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface OrgSettings {
  org_name: string;
  org_address: string;
  org_phone: string;
  org_email: string;
  org_description: string;
  org_location_url: string;
  social_youtube: string;
  social_instagram: string;
  social_facebook: string;
}

const DonorAbout = () => {
  const { donor, logout, loading } = useDonorAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    if (!loading && !donor) {
      navigate('/portal');
    }
  }, [donor, loading, navigate]);

  useEffect(() => {
    fetchSettings();
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
        setSettings(settingsObj as unknown as OrgSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/portal');
  };

  const openMap = () => {
    if (settings?.org_location_url) {
      window.open(settings.org_location_url, '_blank');
    } else if (settings?.org_address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.org_address)}`;
      window.open(url, '_blank');
    }
  };

  const hasSocialLinks = settings?.social_youtube || settings?.social_instagram || settings?.social_facebook;

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
        {loadingSettings ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Organization Info Card */}
            <Card className="border-t-4 border-t-primary">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  {t('donor.aboutOrg')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-primary">
                    {settings?.org_name || t('app.name')}
                  </h2>
                </div>
                
                {settings?.org_description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {settings.org_description}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('donor.contact')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {settings?.org_phone && (
                  <a 
                    href={`tel:${settings.org_phone}`}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Phone className="w-5 h-5 text-primary" />
                    <span>{settings.org_phone}</span>
                  </a>
                )}
                
                {settings?.org_email && (
                  <a 
                    href={`mailto:${settings.org_email}`}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Mail className="w-5 h-5 text-primary" />
                    <span>{settings.org_email}</span>
                  </a>
                )}
                
                {settings?.org_address && (
                  <button 
                    onClick={openMap}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors w-full text-left"
                  >
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="flex-1">{settings.org_address}</span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </CardContent>
            </Card>

            {/* Social Media Links Card */}
            {hasSocialLinks && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {language === 'ml' ? 'സോഷ്യൽ മീഡിയ' : 'Social Media'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {settings?.social_youtube && (
                    <a 
                      href={settings.social_youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Youtube className="w-5 h-5 text-destructive" />
                      <span className="flex-1">YouTube</span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  )}
                  
                  {settings?.social_instagram && (
                    <a 
                      href={settings.social_instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Instagram className="w-5 h-5 text-primary" />
                      <span className="flex-1">Instagram</span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  )}
                  
                  {settings?.social_facebook && (
                    <a 
                      href={settings.social_facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Facebook className="w-5 h-5 text-primary" />
                      <span className="flex-1">Facebook</span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

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
              className="flex flex-col items-center py-2 px-3 rounded-lg text-primary bg-accent"
            >
              <Info className="w-5 h-5" />
              <span className="text-xs mt-1">{t('donor.aboutOrg')}</span>
            </Link>
            <Link
              to="/portal/gallery"
              className="flex flex-col items-center py-2 px-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent/50"
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

export default DonorAbout;
