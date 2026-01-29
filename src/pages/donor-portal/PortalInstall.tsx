import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Download, Smartphone, Check, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PortalInstall = () => {
  const { t, language, setLanguage } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      {/* Language Selector */}
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Globe className="w-4 h-4 mr-2" />
              {language === 'ml' ? 'മലയാളം' : 'English'}
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
      </div>

      <Card className="w-full max-w-md shadow-xl border-primary/20">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-2">
            <Heart className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            {t('app.name')}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {language === 'ml' 
              ? 'ദാതാക്കളുടെ പോർട്ടൽ ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുക'
              : 'Install Donor Portal App'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <p className="text-primary font-medium">
                {language === 'ml' 
                  ? 'ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്തു!'
                  : 'App Installed!'}
              </p>
              <Link to="/portal">
                <Button className="w-full">
                  {language === 'ml' ? 'പോർട്ടലിലേക്ക് പോകുക' : 'Go to Portal'}
                </Button>
              </Link>
            </div>
          ) : isIOS ? (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <p className="font-medium text-center">
                  {language === 'ml' 
                    ? 'iPhone/iPad-ൽ ഇൻസ്റ്റാൾ ചെയ്യാൻ:'
                    : 'To install on iPhone/iPad:'}
                </p>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>
                    {language === 'ml' 
                      ? 'Safari ബ്രൗസറിൽ ഈ പേജ് തുറക്കുക'
                      : 'Open this page in Safari browser'}
                  </li>
                  <li>
                    {language === 'ml' 
                      ? 'Share ബട്ടൺ ടാപ്പ് ചെയ്യുക (↑)'
                      : 'Tap the Share button (↑)'}
                  </li>
                  <li>
                    {language === 'ml' 
                      ? '"Add to Home Screen" തിരഞ്ഞെടുക്കുക'
                      : 'Select "Add to Home Screen"'}
                  </li>
                  <li>
                    {language === 'ml' 
                      ? '"Add" ടാപ്പ് ചെയ്യുക'
                      : 'Tap "Add"'}
                  </li>
                </ol>
              </div>
              <Link to="/portal">
                <Button variant="outline" className="w-full">
                  {language === 'ml' ? 'പോർട്ടലിലേക്ക് പോകുക' : 'Go to Portal'}
                </Button>
              </Link>
            </div>
          ) : deferredPrompt ? (
            <div className="space-y-4">
              <Button onClick={handleInstall} className="w-full" size="lg">
                <Download className="w-5 h-5 mr-2" />
                {language === 'ml' ? 'ഇൻസ്റ്റാൾ ചെയ്യുക' : 'Install App'}
              </Button>
              <Link to="/portal">
                <Button variant="outline" className="w-full">
                  {language === 'ml' ? 'പോർട്ടലിലേക്ക് പോകുക' : 'Go to Portal'}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  <p className="font-medium">
                    {language === 'ml' 
                      ? 'ഇൻസ്റ്റാൾ ചെയ്യാൻ:'
                      : 'To install:'}
                  </p>
                </div>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>
                    {language === 'ml' 
                      ? 'ബ്രൗസർ മെനു (⋮) തുറക്കുക'
                      : 'Open browser menu (⋮)'}
                  </li>
                  <li>
                    {language === 'ml' 
                      ? '"Install app" അല്ലെങ്കിൽ "Add to Home screen" തിരഞ്ഞെടുക്കുക'
                      : 'Select "Install app" or "Add to Home screen"'}
                  </li>
                </ol>
              </div>
              <Link to="/portal">
                <Button variant="outline" className="w-full">
                  {language === 'ml' ? 'പോർട്ടലിലേക്ക് പോകുക' : 'Go to Portal'}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PortalInstall;
