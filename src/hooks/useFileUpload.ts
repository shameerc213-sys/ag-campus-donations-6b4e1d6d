import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File | Blob, folder: string): Promise<{ url: string; type: string } | null> => {
    setUploading(true);
    try {
      const ext = file instanceof File ? file.name.split('.').pop() : (file.type === 'audio/webm' ? 'webm' : 'bin');
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const fileType = file instanceof File ? file.type.split('/')[0] : 'audio';

      const { error } = await supabase.storage
        .from('dua-attachments')
        .upload(fileName, file, { contentType: file instanceof File ? file.type : 'audio/webm' });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('dua-attachments')
        .getPublicUrl(fileName);

      return { url: publicUrl, type: fileType };
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading };
};
