// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Image upload helper function
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  created_at: string;
}

export const uploadImage = async (
  file: File,
  folder: string = 'cars'
): Promise<CloudinaryUploadResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'irish_auto_market');
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return response.json();
};

// Generate image URLs with transformations
export const getImageUrl = (
  publicId: string,
  transformation?: string
): string => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;
  return transformation 
    ? `${baseUrl}/${transformation}/${publicId}`
    : `${baseUrl}/${publicId}`;
};

// Common transformations for car marketplace
export const imageTransformations = {
  thumbnail: 'c_thumb,w_150,h_150,g_auto',
  medium: 'c_fill,w_400,h_300,g_auto',
  large: 'c_fill,w_800,h_600,g_auto',
  hero: 'c_fill,w_1200,h_600,g_auto,q_auto',
  avatar: 'c_thumb,w_100,h_100,g_face',
  messageImage: 'c_limit,w_300,h_300,q_auto',
};

// Generate all image variants for database storage
export const generateImageVariants = (publicId: string) => ({
  originalUrl: getImageUrl(publicId),
  thumbnailUrl: getImageUrl(publicId, imageTransformations.thumbnail),
  mediumUrl: getImageUrl(publicId, imageTransformations.medium),
  largeUrl: getImageUrl(publicId, imageTransformations.large),
});