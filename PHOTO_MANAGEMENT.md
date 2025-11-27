# Car Photo Management Feature

## Overview
This feature allows admins to manage car photos directly from the admin panel. Admins can add, remove, and reorder photos for any car listing.

## Features

### 1. **Add New Photos**
- **Two upload methods:**
  - **Upload from PC**: Select multiple image files directly from your computer
  - **From URL**: Provide image URLs (one per line)
- Supports multiple files/URLs at once
- Automatically processes and optimizes images via Cloudinary
- **File upload supports:**
  - JPG, JPEG, PNG, WEBP, GIF formats
  - Up to 10MB per file
  - Multiple file selection
  - Real-time file validation
- **URL upload supports:**
  - Direct image URLs (jpg, jpeg, png, webp, gif)
  - Unsplash
  - Cloudinary
  - DoneDeal
  - Imgur
  - Pexels

### 2. **Delete Photos**
- Remove unwanted photos with a single click
- Automatic reordering of remaining photos
- Confirmation dialog to prevent accidental deletion

### 3. **Reorder Photos**
- Move photos up or down in the display order
- First photo becomes the main display image
- Visual indicators for photo position
- Real-time updates

### 4. **Photo Limits**
- Maximum 20 photos per car
- Visual indicator of current photo count
- Prevents adding photos when limit is reached

## How to Use

### Accessing Photo Management

1. Navigate to the Admin Cars Management page: `/admin/cars`
2. Click the **Edit** button (green pencil icon) for any car
3. In the edit modal, click on the **"Manage Photos"** tab
4. The photo manager will load all existing photos for that car

### Adding Photos

You can add photos using two methods:

#### Method 1: Upload from PC
1. In the "Add New Photos" section, click the **"Upload from PC"** tab
2. Click on the file input to browse your computer
3. Select one or multiple image files (JPG, PNG, WEBP, or GIF)
4. Review the selected files (shown with file names and sizes)
5. Click the **"Upload Files"** button
6. The system will:
   - Convert files to base64
   - Upload them to Cloudinary
   - Generate optimized variants (thumbnail, medium, large)
   - Save them to the database
7. New photos will appear at the end of the current photo list

#### Method 2: From URL
1. In the "Add New Photos" section, click the **"From URL"** tab
2. Enter image URLs in the textarea (one per line)
3. Click the **"Add from URLs"** button
4. The system will:
   - Download the images from URLs
   - Upload them to Cloudinary
   - Generate optimized variants (thumbnail, medium, large)
   - Save them to the database
5. New photos will appear at the end of the current photo list

### Deleting Photos

1. Hover over any photo to reveal action buttons
2. Click the red **trash** button
3. Confirm the deletion in the dialog
4. The photo will be removed and remaining photos will be reordered

### Reordering Photos

1. Hover over any photo to reveal action buttons
2. Click the **up arrow** to move the photo earlier in the sequence
3. Click the **down arrow** to move the photo later in the sequence
4. The first photo is automatically the main display image for the car listing

## API Endpoints

### GET `/api/admin/cars/[id]/photos`
Retrieves all photos for a specific car.

**Response:**
```json
{
  "success": true,
  "images": [
    {
      "id": "photo-id",
      "carId": "car-id",
      "originalUrl": "https://...",
      "thumbnailUrl": "https://...",
      "mediumUrl": "https://...",
      "largeUrl": "https://...",
      "orderIndex": 0
    }
  ]
}
```

### POST `/api/admin/cars/[id]/photos`
Adds new photos to a car. Supports both URL-based and file upload methods.

**Request Body (URL method):**
```json
{
  "imageUrls": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ]
}
```

**Request Body (File upload method):**
```json
{
  "base64Images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "data:image/png;base64,iVBORw0KGgo..."
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully added 2 images",
  "images": [...]
}
```

### PATCH `/api/admin/cars/[id]/photos`
Updates the order of photos.

**Request Body:**
```json
{
  "imageOrders": [
    { "id": "photo-1", "orderIndex": 0 },
    { "id": "photo-2", "orderIndex": 1 }
  ]
}
```

### DELETE `/api/admin/cars/[id]/photos?imageIds=id1,id2`
Deletes one or more photos.

**Query Parameters:**
- `imageIds`: Comma-separated list of photo IDs to delete

**Response:**
```json
{
  "success": true,
  "message": "Successfully deleted 2 images"
}
```

## Technical Details

### Components
- **CarPhotoManager** (`src/components/admin/CarPhotoManager.tsx`)
  - Main photo management component
  - Handles all photo operations
  - Real-time updates and error handling

### API Routes
- `src/app/api/admin/cars/[id]/photos/route.ts`
  - Complete CRUD operations for car photos
  - Admin authentication and authorization
  - Cloudinary integration
  - Error handling and validation

### Image Processing
- Uses `src/lib/image-processor.ts` for image handling
- Automatically downloads images from URLs
- Uploads to Cloudinary
- Generates optimized variants:
  - **Thumbnail**: 150x150px (for admin preview)
  - **Medium**: 500x400px max (for listings)
  - **Large**: 800x600px max (for detail pages)

### Database Schema
Photos are stored in the `car_images` table with:
- `id`: Unique identifier
- `carId`: Foreign key to car
- `originalUrl`: Full-size Cloudinary URL
- `thumbnailUrl`: Optimized thumbnail
- `mediumUrl`: Medium size variant
- `largeUrl`: Large size variant
- `orderIndex`: Display order
- `uploadedAt`: Timestamp

## Security

- **Admin Only**: All endpoints require admin authentication
- **Token Validation**: JWT tokens verified on every request
- **Role Checking**: Only ADMIN and SUPER_ADMIN roles can manage photos
- **Input Validation**: URL validation and file size limits
- **Audit Logging**: All photo operations are logged with admin user ID

## Error Handling

The system handles various error scenarios:
- Invalid URLs
- Network failures
- Cloudinary upload failures
- Maximum photo limit exceeded
- Invalid image formats
- Authentication errors

All errors are displayed to the user with clear, actionable messages.

## Tips for Best Results

1. **Use High-Quality Images**: Upload the best quality images available
2. **Set Main Image Carefully**: The first photo is the most important
3. **Remove Poor Quality Photos**: Keep only the best images
4. **Consistent Aspect Ratios**: Try to use photos with similar dimensions
5. **Test After Upload**: Always verify photos display correctly

## Future Enhancements

Potential improvements for future versions:
- Direct file upload support (in addition to URLs)
- Bulk photo operations
- Image cropping and editing
- AI-powered photo enhancement
- Automatic main image selection based on quality
- Photo captions and alt text editing
