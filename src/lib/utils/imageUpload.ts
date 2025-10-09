import { supabase } from '@/lib/supabase/client';

export interface ImageUploadOptions {
  maxSizeMB?: number;
  maxWidthPx?: number;
  maxHeightPx?: number;
  quality?: number;
  allowedFormats?: string[];
}

export interface ImageUploadResult {
  url: string;
  path: string;
  size: number;
  dimensions: { width: number; height: number };
}

const DEFAULT_OPTIONS: ImageUploadOptions = {
  maxSizeMB: 5,
  maxWidthPx: 1920,
  maxHeightPx: 1080,
  quality: 0.9,
  allowedFormats: ['image/jpeg', 'image/png', 'image/webp']
};

/**
 * Validates image file before upload
 */
export const validateImage = (file: File, options: ImageUploadOptions = {}): string | null => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Check file type
  if (opts.allowedFormats && !opts.allowedFormats.includes(file.type)) {
    return `Invalid file type. Allowed: ${opts.allowedFormats.join(', ')}`;
  }
  
  // Check file size
  const sizeMB = file.size / (1024 * 1024);
  if (opts.maxSizeMB && sizeMB > opts.maxSizeMB) {
    return `File too large. Maximum size: ${opts.maxSizeMB}MB`;
  }
  
  return null; // Valid
};

/**
 * Compresses and resizes image using canvas
 */
export const optimizeImage = async (
  file: File,
  options: ImageUploadOptions = {}
): Promise<Blob> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      let { width, height } = img;
      
      // Calculate new dimensions maintaining aspect ratio
      if (opts.maxWidthPx && width > opts.maxWidthPx) {
        height = (height * opts.maxWidthPx) / width;
        width = opts.maxWidthPx;
      }
      if (opts.maxHeightPx && height > opts.maxHeightPx) {
        width = (width * opts.maxHeightPx) / height;
        height = opts.maxHeightPx;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        file.type,
        opts.quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Gets image dimensions from file
 */
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error('Failed to get dimensions'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Uploads image to Supabase Storage
 */
export const uploadRewardImage = async (
  file: File,
  rewardId: string,
  organizationId: string,
  options: ImageUploadOptions = {}
): Promise<ImageUploadResult> => {
  // Validate
  const validationError = validateImage(file, options);
  if (validationError) {
    throw new Error(validationError);
  }
  
  // Optimize
  const optimizedBlob = await optimizeImage(file, options);
  
  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${organizationId}/${rewardId}_${Date.now()}.${fileExt}`;
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('reward-images')
    .upload(fileName, optimizedBlob, {
      contentType: file.type,
      upsert: true
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('reward-images')
    .getPublicUrl(fileName);
  
  // Get image dimensions
  const dimensions = await getImageDimensions(file);
  
  return {
    url: urlData.publicUrl,
    path: fileName,
    size: optimizedBlob.size,
    dimensions
  };
};

/**
 * Deletes image from Supabase Storage
 */
export const deleteRewardImage = async (filePath: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('reward-images')
    .remove([filePath]);
  
  if (error) throw error;
};
