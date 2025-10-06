import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface UseImageUploadReturn {
  uploadImage: (file: File, folder: string) => Promise<string>;
  uploading: boolean;
  error: Error | null;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadImage = async (file: File, folder: string): Promise<string> => {
    try {
      setUploading(true);
      setError(null);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err as Error);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { uploadImage, uploading, error };
};
