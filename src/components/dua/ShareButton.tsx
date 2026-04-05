import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareButtonProps {
  text?: string;
  url?: string;
  title?: string;
}

const ShareButton = ({ text, url, title }: ShareButtonProps) => {
  const handleShare = async () => {
    const shareData: ShareData = {
      title: title || 'ദുആ റിക്വസ്റ്റ്',
      text: text || '',
    };
    if (url) shareData.url = url;

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    } else {
      // Fallback: copy to clipboard
      const copyText = `${shareData.title}\n${shareData.text}${url ? '\n' + url : ''}`;
      await navigator.clipboard.writeText(copyText);
    }
  };

  return (
    <Button type="button" variant="ghost" size="icon" onClick={handleShare} className="w-7 h-7">
      <Share2 className="w-3.5 h-3.5" />
    </Button>
  );
};

export default ShareButton;
