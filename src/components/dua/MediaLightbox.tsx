import { X } from 'lucide-react';
import { useEffect } from 'react';

interface MediaLightboxProps {
  url: string;
  type?: string | null;
  onClose: () => void;
}

const MediaLightbox = ({ url, type, onClose }: MediaLightboxProps) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <button
        className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 z-50"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>
      <div className="max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
        {type === 'image' ? (
          <img src={url} alt="" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
        ) : type === 'video' ? (
          <video controls autoPlay src={url} className="max-w-full max-h-[90vh] rounded-lg" />
        ) : type === 'audio' ? (
          <audio controls autoPlay src={url} className="w-80" />
        ) : null}
      </div>
    </div>
  );
};

export default MediaLightbox;
