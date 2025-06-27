'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Plus, Image as ImageIcon } from 'lucide-react';

interface UploadedImage {
  id: string;
  url: string;
  originalUrl: string;
  thumbnailUrl: string;
  mediumUrl: string;
  largeUrl: string;
  publicId: string;
  fileName: string;
  size: number;
}

interface ImageUploadProps {
  maxImages?: number;
  existingImages?: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  acceptedTypes?: string[];
  maxSizeBytes?: number;
  showCamera?: boolean;
  gridCols?: number;
  className?: string;
}

export default function ImageUpload({
  maxImages = 10,
  existingImages = [],
  onImagesChange,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxSizeBytes = 10 * 1024 * 1024, // 10MB (Cloudinary free tier limit)
  showCamera = true,
  gridCols = 3,
  className = ""
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Upload to Cloudinary
  const uploadToCloudinary = async (file: File): Promise<UploadedImage> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'irish_auto_market'); // You'll need to create this
    formData.append('folder', 'cars'); // Organize by folder

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dmynffe63/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    
    // Generate different sizes using Cloudinary transformations
    const baseUrl = `https://res.cloudinary.com/dmynffe63/image/upload`;
    
    return {
      id: result.public_id,
      url: result.secure_url,
      originalUrl: result.secure_url,
      thumbnailUrl: `${baseUrl}/c_thumb,w_150,h_150/${result.public_id}`,
      mediumUrl: `${baseUrl}/c_fill,w_400,h_300/${result.public_id}`,
      largeUrl: `${baseUrl}/c_fill,w_800,h_600/${result.public_id}`,
      publicId: result.public_id,
      fileName: file.name,
      size: file.size,
    };
  };

  // Handle file selection
  const handleFiles = useCallback(async (files: FileList) => {
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!acceptedTypes.includes(file.type)) {
          throw new Error(`File type ${file.type} not supported`);
        }

        // Validate file size
        if (file.size > maxSizeBytes) {
          throw new Error(`File size must be less than ${maxSizeBytes / 1024 / 1024}MB`);
        }

        return uploadToCloudinary(file);
      });

      const uploadedImages = await Promise.all(uploadPromises);
      const newImages = [...images, ...uploadedImages];
      
      setImages(newImages);
      onImagesChange(newImages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [images, maxImages, acceptedTypes, maxSizeBytes, onImagesChange]);

  // Remove image
  const removeImage = (imageId: string) => {
    const newImages = images.filter(img => img.id !== imageId);
    setImages(newImages);
    onImagesChange(newImages);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // File input change
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 lg:grid-cols-5',
  }[gridCols] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`w-full ${className}`}>
      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors
            ${dragActive 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${uploading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <div className="flex justify-center space-x-4 mb-4">
              {/* Camera Button */}
              {showCamera && (
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center space-y-2 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  disabled={uploading}
                >
                  <Camera size={24} />
                  <span className="text-sm font-medium">Camera</span>
                </button>
              )}
              
              {/* Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center space-y-2 p-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                disabled={uploading}
              >
                <Upload size={24} />
                <span className="text-sm font-medium">Upload</span>
              </button>
            </div>
            
            <p className="text-gray-600 mb-2">
              {dragActive ? 'Drop images here' : 'Drag & drop images or click to upload'}
            </p>
            <p className="text-sm text-gray-500">
              Max {maxImages} images • {maxSizeBytes / 1024 / 1024}MB each • JPG, PNG, WebP
            </p>
            
            {uploading && (
              <div className="mt-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                <p className="text-sm text-gray-600 mt-2">Uploading...</p>
              </div>
            )}
          </div>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileInput}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment" // Use back camera on mobile
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className={`mt-6 grid gap-4 ${gridColsClass}`}>
          {images.map((image, index) => (
            <div key={image.id} className="relative group">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={image.mediumUrl}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeImage(image.id)}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
              >
                <X size={16} />
              </button>
              
              {/* Image info */}
              <div className="mt-2 text-xs text-gray-500">
                <p className="truncate">{image.fileName}</p>
                <p>{(image.size / 1024 / 1024).toFixed(1)}MB</p>
              </div>
            </div>
          ))}
          
          {/* Add more button */}
          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 hover:bg-gray-100 transition-colors"
            >
              <Plus size={24} className="text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Add More</span>
            </button>
          )}
        </div>
      )}

      {/* Image count */}
      <div className="mt-4 text-sm text-gray-500 text-center">
        {images.length} of {maxImages} images
      </div>
    </div>
  );
}