'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Flex, Text, Button } from '@radix-ui/themes';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  currentImage?: string;
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
  onRemove?: () => void;
}

export default function ImageUpload({
  currentImage,
  onUpload,
  uploading,
  onRemove,
}: ImageUploadProps) {
  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        await onUpload(acceptedFiles[0]);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  if (currentImage) {
    return (
      <Box className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300">
        <Image
          src={currentImage}
          alt="Menu item"
          fill
          className="object-cover"
        />
        {onRemove && !uploading && (
          <Button
            size="1"
            color="red"
            variant="solid"
            className="absolute top-2 right-2"
            onClick={onRemove}
          >
            <X size={14} />
          </Button>
        )}
      </Box>
    );
  }

  const { popover: _popover, ...rootProps } = getRootProps() as Record<string, unknown>;
  
  return (
    <Box
      {...(rootProps as React.ComponentProps<typeof Box>)}
      className={`
        w-full h-48 rounded-lg border-2 border-dashed
        flex items-center justify-center cursor-pointer
        transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      <Flex direction="column" align="center" gap="2">
        {uploading ? (
          <>
            <Upload className="animate-pulse" size={32} />
            <Text size="2" weight="medium">Uploading...</Text>
          </>
        ) : (
          <>
            <ImageIcon size={32} className="text-gray-400" />
            <Text size="2" weight="medium">
              {isDragActive ? 'Drop image here' : 'Click or drag image to upload'}
            </Text>
            <Text size="1" color="gray">
              PNG, JPG, JPEG, or WEBP (max 5MB)
            </Text>
          </>
        )}
      </Flex>
    </Box>
  );
}
