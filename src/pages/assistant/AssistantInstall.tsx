import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Share, MoreVertical, PlusSquare, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const AssistantInstall = () => {
  const { language } = useLanguage();

  useEffect(() => {
    const existingManifest = document.querySelector('link[rel="manifest"]');
    const originalHref = existingManifest?.getAttribute('href');
    
    if (existingManifest) {
      existingManifest.setAttribute('href', '/assistant-manifest.json');
    }

    return () => {
      if (existingManifest && originalHref) {
        existingManifest.setAttribute('href', originalHref);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/assistant" className="inline-flex items-center gap-2 text-primary hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" />
          {language === 'ml' ? 'തിരികെ പോകുക' : 'Go Back'}
        </Link>

        <Card className="shadow-xl border-primary/20">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-2">
              <MessageCircle className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              {language === 'ml' ? 'അസിസ്റ്റന്റ് ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യാം' : 'Install Assistant App'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {language === 'ml' 
                ? 'നിങ്ങളുടെ ഫോണിൽ അസിസ്റ്റന്റ് ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യാൻ താഴെയുള്ള നിർദ്ദേശങ്ങൾ പാലിക്കുക'
                : 'Follow the instructions below to install the assistant app on your phone'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Android Instructions */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                🤖 {language === 'ml' ? 'ആൻഡ്രോയിഡ് ഫോണിൽ' : 'On Android Phone'}
              </h3>
              <ol className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="min-w-[20px]">1.</span>
                  <span>{language === 'ml' ? 'Chrome ബ്രൗസറിൽ ഈ പേജ് തുറക്കുക' : 'Open this page in Chrome browser'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="min-w-[20px]">2.</span>
                  <span className="flex items-center gap-1">
                    {language === 'ml' ? 'മുകളിൽ വലതുവശത്തുള്ള ' : 'Tap '}
                    <MoreVertical className="w-4 h-4 inline" />
                    {language === 'ml' ? ' ബട്ടൺ അമർത്തുക' : ' button at top right'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="min-w-[20px]">3.</span>
                  <span>{language === 'ml' ? '"Add to Home screen" അല്ലെങ്കിൽ "Install app" തിരഞ്ഞെടുക്കുക' : 'Select "Add to Home screen" or "Install app"'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="min-w-[20px]">4.</span>
                  <span>{language === 'ml' ? '"Add" അമർത്തുക - ആപ്പ് ഹോം സ്ക്രീനിൽ ചേർക്കപ്പെടും' : 'Tap "Add" - the app will be added to your home screen'}</span>
                </li>
              </ol>
            </div>

            {/* iOS Instructions */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                🍎 {language === 'ml' ? 'iPhone-ൽ' : 'On iPhone'}
              </h3>
              <ol className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="min-w-[20px]">1.</span>
                  <span>{language === 'ml' ? 'Safari ബ്രൗസറിൽ ഈ പേജ് തുറക്കുക (Chrome അല്ല!)' : 'Open this page in Safari browser (not Chrome!)'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="min-w-[20px]">2.</span>
                  <span className="flex items-center gap-1">
                    {language === 'ml' ? 'താഴെയുള്ള ' : 'Tap the '}
                    <Share className="w-4 h-4 inline" />
                    {language === 'ml' ? ' Share ബട്ടൺ അമർത്തുക' : ' Share button at bottom'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="min-w-[20px]">3.</span>
                  <span className="flex items-center gap-1">
                    {language === 'ml' ? 'സ്ക്രോൾ ചെയ്ത് ' : 'Scroll down and tap '}
                    <PlusSquare className="w-4 h-4 inline" />
                    {language === 'ml' ? ' "Add to Home Screen" അമർത്തുക' : ' "Add to Home Screen"'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="min-w-[20px]">4.</span>
                  <span>{language === 'ml' ? '"Add" അമർത്തുക - ആപ്പ് ഹോം സ്ക്രീനിൽ ചേർക്കപ്പെടും' : 'Tap "Add" - the app will be added to your home screen'}</span>
                </li>
              </ol>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-sm text-primary font-medium">
                💡 {language === 'ml' 
                  ? 'ഇൻസ്റ്റാൾ ചെയ്ത ശേഷം, ഹോം സ്ക്രീനിൽ നിന്ന് ആപ്പ് തുറക്കുമ്പോൾ നേരിട്ട് അസിസ്റ്റന്റ് ലോഗിൻ പേജ് കാണാം.'
                  : 'After installation, opening the app from home screen will show the assistant login page directly.'}
              </p>
            </div>

            <div className="pt-4 border-t">
              <Link to="/assistant">
                <Button className="w-full gap-2">
                  <MessageCircle className="w-4 h-4" />
                  {language === 'ml' ? 'അസിസ്റ്റന്റ് ലോഗിൻ പേജിലേക്ക് പോകുക' : 'Go to Assistant Login'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssistantInstall;
