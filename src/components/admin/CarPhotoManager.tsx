'use client';

import React, { useState, useEffect } from 'react';
import { Image, Upload, X, Trash2, MoveUp, MoveDown, Plus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface CarImage {
  id: string;
  originalUrl: string;
  thumbnailUrl: string;
  mediumUrl: string;
  largeUrl: string;
  altText?: string;
  orderIndex: number;
}

interface CarPhotoManagerProps {
  carId: string;
  onPhotosUpdated?: () => void;
}

export default function CarPhotoManager({ carId, onPhotosUpdated }: CarPhotoManagerProps) {
  const [images, setImages] = useState<CarImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newImageUrls, setNewImageUrls] = useState<string>('');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    fetchImages();
  }, [carId]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/cars/${carId}/photos`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch images');
      }
    } catch (err: any) {
      setError('Network error fetching images');
      console.error('Error fetching images:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file types
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      return validTypes.includes(file.type);
    });

    if (validFiles.length !== files.length) {
      setError('Some files were skipped. Only JPG, PNG, WEBP, and GIF images are supported.');
    }

    // Check file sizes (max 10MB per file)
    const oversizedFiles = validFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed 10MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setSelectedFiles(validFiles);
    setError(null);
  };

  const handleAddPhotos = async () => {
    if (uploadMethod === 'url') {
      if (!newImageUrls.trim()) {
        setError('Please enter at least one image URL');
        return;
      }

      try {
        setUploading(true);
        setError(null);
        setSuccess(null);

        // Split by newlines and filter empty lines
        const urls = newImageUrls
          .split('\n')
          .map(url => url.trim())
          .filter(url => url.length > 0);

        if (urls.length === 0) {
          setError('No valid URLs provided');
          return;
        }

        const response = await fetch(`/api/admin/cars/${carId}/photos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ imageUrls: urls }),
        });

        const data = await response.json();

        if (response.ok) {
          setSuccess(`Successfully added ${data.images.length} images`);
          setNewImageUrls('');
          await fetchImages();
          if (onPhotosUpdated) onPhotosUpdated();

          // Clear success message after 3 seconds
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError(data.error || 'Failed to add images');
        }
      } catch (err: any) {
        setError('Network error adding images');
        console.error('Error adding images:', err);
      } finally {
        setUploading(false);
      }
    } else {
      // Handle file upload
      if (selectedFiles.length === 0) {
        setError('Please select at least one file');
        return;
      }

      try {
        setUploading(true);
        setError(null);
        setSuccess(null);

        // Convert files to base64
        const filePromises = selectedFiles.map(file => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        });

        const base64Files = await Promise.all(filePromises);

        const response = await fetch(`/api/admin/cars/${carId}/photos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ base64Images: base64Files }),
        });

        const data = await response.json();

        if (response.ok) {
          setSuccess(`Successfully added ${data.images.length} images`);
          setSelectedFiles([]);
          // Reset file input
          const fileInput = document.getElementById('file-upload') as HTMLInputElement;
          if (fileInput) fileInput.value = '';

          await fetchImages();
          if (onPhotosUpdated) onPhotosUpdated();

          // Clear success message after 3 seconds
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError(data.error || 'Failed to upload images');
        }
      } catch (err: any) {
        setError('Error uploading files');
        console.error('Error uploading files:', err);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDeletePhoto = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      setDeleting(imageId);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/admin/cars/${carId}/photos?imageIds=${imageId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Photo deleted successfully');
        await fetchImages();
        if (onPhotosUpdated) onPhotosUpdated();

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to delete photo');
      }
    } catch (err: any) {
      setError('Network error deleting photo');
      console.error('Error deleting photo:', err);
    } finally {
      setDeleting(null);
    }
  };

  const handleMovePhoto = async (imageId: string, direction: 'up' | 'down') => {
    const currentIndex = images.findIndex(img => img.id === imageId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= images.length) return;

    // Create new order
    const newImages = [...images];
    const [movedImage] = newImages.splice(currentIndex, 1);
    newImages.splice(newIndex, 0, movedImage);

    // Update order indices
    const imageOrders = newImages.map((img, index) => ({
      id: img.id,
      orderIndex: index,
    }));

    // Optimistically update UI
    setImages(newImages);

    try {
      setError(null);

      const response = await fetch(`/api/admin/cars/${carId}/photos`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ imageOrders }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to reorder photos');
        // Revert on error
        await fetchImages();
      } else {
        if (onPhotosUpdated) onPhotosUpdated();
      }
    } catch (err: any) {
      setError('Network error reordering photos');
      console.error('Error reordering photos:', err);
      // Revert on error
      await fetchImages();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading photos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Image className="w-5 h-5" />
          Manage Photos ({images.length}/20)
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Add, remove, or reorder car photos. The first photo will be the main display image.
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800 text-sm">{success}</p>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Current Photos */}
      {images.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Current Photos</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={image.thumbnailUrl || image.originalUrl}
                    alt={`Car photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Main Image Badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">
                    Main
                  </div>
                )}

                {/* Order Badge */}
                <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-75 text-white text-xs font-medium px-2 py-1 rounded">
                  #{index + 1}
                </div>

                {/* Action Buttons */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {/* Move Up */}
                  {index > 0 && (
                    <button
                      onClick={() => handleMovePhoto(image.id, 'up')}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      title="Move up"
                    >
                      <MoveUp className="w-4 h-4 text-gray-700" />
                    </button>
                  )}

                  {/* Move Down */}
                  {index < images.length - 1 && (
                    <button
                      onClick={() => handleMovePhoto(image.id, 'down')}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      title="Move down"
                    >
                      <MoveDown className="w-4 h-4 text-gray-700" />
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => handleDeletePhoto(image.id)}
                    disabled={deleting === image.id}
                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deleting === image.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Photos */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add New Photos
        </h4>

        <div className="space-y-3">
          {/* Upload Method Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => {
                setUploadMethod('file');
                setNewImageUrls('');
                setError(null);
              }}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                uploadMethod === 'file'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Upload from PC
            </button>
            <button
              onClick={() => {
                setUploadMethod('url');
                setSelectedFiles([]);
                setError(null);
              }}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                uploadMethod === 'url'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Image className="w-4 h-4 inline mr-2" />
              From URL
            </button>
          </div>

          {/* File Upload */}
          {uploadMethod === 'file' && (
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Select images from your computer:
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                multiple
                onChange={handleFileChange}
                disabled={uploading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {selectedFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-600 font-medium">Selected files ({selectedFiles.length}):</p>
                  <ul className="text-xs text-gray-500 space-y-0.5">
                    {selectedFiles.map((file, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPG, PNG, WEBP, GIF. Max 10MB per file.
              </p>
            </div>
          )}

          {/* URL Upload */}
          {uploadMethod === 'url' && (
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Enter image URLs (one per line):
              </label>
              <textarea
                value={newImageUrls}
                onChange={(e) => setNewImageUrls(e.target.value)}
                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;https://example.com/image3.jpg"
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                disabled={uploading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Supports URLs from Unsplash, Cloudinary, DoneDeal, Imgur, Pexels, and direct image links
              </p>
            </div>
          )}

          <button
            onClick={handleAddPhotos}
            disabled={
              uploading ||
              images.length >= 20 ||
              (uploadMethod === 'url' ? !newImageUrls.trim() : selectedFiles.length === 0)
            }
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 font-medium"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {uploadMethod === 'file' ? 'Uploading Files...' : 'Processing URLs...'}
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                {uploadMethod === 'file' ? 'Upload Files' : 'Add from URLs'}
              </>
            )}
          </button>

          {images.length >= 20 && (
            <p className="text-sm text-orange-600 text-center">
              Maximum of 20 photos reached. Delete some photos to add more.
            </p>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="text-sm font-medium text-blue-900 mb-2">Tips:</h5>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>The first photo is the main display image for the car listing</li>
          <li>Use the up/down arrows to reorder photos</li>
          <li>Images are automatically processed and optimized</li>
          <li>Maximum 20 photos per car</li>
          <li>Supported formats: JPG, PNG, WEBP, GIF</li>
        </ul>
      </div>
    </div>
  );
}
