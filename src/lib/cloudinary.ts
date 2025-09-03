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
  folder: string = 'irish_auto_market/cars'
): Promise<CloudinaryUploadResult> => {
  // Try multiple presets in order of preference
  const presets = ['irish_auto_market', 'ml_default', 'cars_preset', 'unsigned_preset'];
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  for (const preset of presets) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', preset);
      formData.append('folder', folder);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        return response.json();
      } else {
        const errorText = await response.text();
        console.warn(`Upload with preset ${preset} failed:`, errorText);
      }
    } catch (error) {
      console.warn(`Upload with preset ${preset} failed:`, error);
      continue;
    }
  }

  throw new Error('All upload presets failed. Please check your Cloudinary configuration.');
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

// FIXED: Car-friendly transformations that preserve full vehicles
export const imageTransformations = {
  // Thumbnails - square crops are OK for small previews
  thumbnail: 'c_thumb,w_150,h_150,g_auto',
  
  // ✅ FIXED: Use c_limit to preserve car proportions
  medium: 'c_limit,w_500,h_400,q_auto,f_auto',      // Shows full car, max 500x400
  large: 'c_limit,w_800,h_600,q_auto,f_auto',       // Shows full car, max 800x600
  
  // ✅ ALTERNATIVE: Use c_fit to add padding instead of cropping
  mediumFit: 'c_fit,w_400,h_300,b_white,q_auto',    // Fits car in 400x300 with white background
  largeFit: 'c_fit,w_800,h_600,b_white,q_auto',     // Fits car in 800x600 with white background
  
  // Hero images for detail pages - allow wider aspect ratios
  hero: 'c_limit,w_1200,h_800,q_auto,f_auto',       // Full car, max 1200x800
  
  // Other transformations remain the same
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

// ✅ NEW: Car-specific variants with different options
export const generateCarImageVariants = (publicId: string) => ({
  originalUrl: getImageUrl(publicId),
  thumbnailUrl: getImageUrl(publicId, imageTransformations.thumbnail),
  
  // Option 1: Limit size but preserve proportions
  mediumUrl: getImageUrl(publicId, imageTransformations.medium),
  largeUrl: getImageUrl(publicId, imageTransformations.large),
  
  // Option 2: Fit with white background (like DoneDeal)
  mediumFitUrl: getImageUrl(publicId, imageTransformations.mediumFit),
  largeFitUrl: getImageUrl(publicId, imageTransformations.largeFit),
  
  // Hero for detail pages
  heroUrl: getImageUrl(publicId, imageTransformations.hero),
});

// ✅ Quick fix function to convert existing URLs
export const fixExistingImageUrl = (url: string): string => {
  if (!url.includes('cloudinary.com')) return url;
  
  // Remove the cropping transformations from existing URLs
  return url.replace(
    /\/c_fill,w_\d+,h_\d+,g_auto\//g, 
    '/c_limit,w_500,h_400,q_auto,f_auto/'
  );
};