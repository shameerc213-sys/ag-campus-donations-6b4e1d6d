import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Share2, MessageCircle, Heart, Headphones, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PortalLinksCard = () => {
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const links = [
    {
      key: 'donor',
      title: 'ദാതാക്കളുടെ പോർട്ടൽ',
      description: 'ദാതാക്കൾക്ക് ലോഗിൻ ചെയ്യാനുള്ള ലിങ്ക്',
      url: `${baseUrl}/portal`,
      icon: Heart,
      shareText: 'അജ്മീർ ഗേറ്റ് ക്യാമ്പസ് - ദാതാക്കളുടെ പോർട്ടൽ',
    },
    {
      key: 'assistant',
      title: 'അസിസ്റ്റന്റ് പോർട്ടൽ',
      description: 'ദുആ റിക്വസ്റ്റ് അസിസ്റ്റന്റിനുള്ള ലിങ്ക്',
      url: `${baseUrl}/assistant`,
      icon: Headphones,
      shareText: 'അജ്മീർ ഗേറ്റ് ക്യാമ്പസ് - അസിസ്റ്റന്റ് പോർട്ടൽ',
    },
    {
      key: 'admin',
      title: 'അഡ്മിൻ പോർട്ടൽ',
      description: 'അഡ്മിൻമാർക്കുള്ള ലോഗിൻ ലിങ്ക് (ശ്രദ്ധയോടെ ഷെയർ ചെയ്യുക)',
      url: `${baseUrl}/auth`,
      icon: Shield,
      shareText: 'അജ്മീർ ഗേറ്റ് ക്യാമ്പസ് - അഡ്മിൻ പോർട്ടൽ',
    },
  ];

  const handleCopy = async (key: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      toast({ title: 'കോപ്പി ചെയ്തു', description: 'ലിങ്ക് ക്ലിപ്‌ബോർഡിൽ പകർത്തി' });
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast({ title: 'പിശക്', description: 'കോപ്പി ചെയ്യാൻ കഴിഞ്ഞില്ല', variant: 'destructive' });
    }
  };

  const handleWhatsAppShare = (text: string, url: string) => {
    const message = encodeURIComponent(`${text}\n${url}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleNativeShare = async (title: string, url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy(title, url);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-primary" />
          പോർട്ടൽ ലിങ്കുകൾ ഷെയർ ചെയ്യുക
        </CardTitle>
        <CardDescription>
          ആവശ്യമുള്ളവർക്ക് താഴെയുള്ള ലിങ്കുകൾ കോപ്പി ചെയ്ത് അയച്ചു കൊടുക്കാം
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {links.map(({ key, title, description, url, icon: Icon, shareText }) => (
          <div key={key} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Icon className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Label className="font-medium">{title}</Label>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input value={url} readOnly className="font-mono text-xs" onClick={(e) => (e.target as HTMLInputElement).select()} />
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleCopy(key, url)}
                title="കോപ്പി ചെയ്യുക"
              >
                {copiedKey === key ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1"
                onClick={() => handleWhatsAppShare(shareText, url)}
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1"
                onClick={() => handleNativeShare(title, url)}
              >
                <Share2 className="w-4 h-4" />
                ഷെയർ
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PortalLinksCard;
