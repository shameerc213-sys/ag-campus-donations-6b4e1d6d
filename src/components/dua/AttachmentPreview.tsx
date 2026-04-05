import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AttachmentPreviewProps {
  file?: File | Blob | null;
  url?: string | null;
  type?: string | null;
  onRemove?: () => void;
}

const AttachmentPreview = ({ file, url, type, onRemove }: AttachmentPreviewProps) => {
  const previewUrl = file ? URL.createObjectURL(file) : url;
  const attachType = type || (file instanceof File ? file.type.split('/')[0] : '');

  if (!previewUrl) return null;

  return (
    <div className="relative inline-block">
      {onRemove && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 w-5 h-5 z-10 rounded-full"
          onClick={onRemove}
        >
          <X className="w-3 h-3" />
        </Button>
      )}
      {attachType === 'audio' ? (
        <audio controls src={previewUrl} className="h-10 max-w-[200px]" />
      ) : attachType === 'image' ? (
        <img src={previewUrl} alt="" className="h-20 rounded-lg object-cover" />
      ) : attachType === 'video' ? (
        <video controls src={previewUrl} className="h-20 rounded-lg" />
      ) : null}
    </div>
  );
};

export default AttachmentPreview;
