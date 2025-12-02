import { v2 as cloudinary } from 'cloudinary';

/**
 * Initialize Cloudinary with environment variables
 * Requires these environment variables to be set:
 * - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 * - NEXT_PUBLIC_CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 */
export function setupCloudinary() {
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
      !process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || 
      !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary environment variables are not set. Please check your .env file.');
  }

  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return cloudinary;
}

/**
 * Upload an image to Cloudinary
 * @param base64Image - The image data in base64 format or file buffer
 * @param uploadType - Type of upload: 'profile', 'document', 'file', etc.
 * @param userId - User ID for organizing uploads
 * @param customFileName - Optional custom file name (without extension)
 * @returns Promise with upload response containing the secure_url
 */
export async function uploadImageToCloudinary(
  base64Image: string,
  uploadType: string = 'profile',
  userId?: string,
  customFileName?: string
) {
  try {
    const cloudinaryInstance = setupCloudinary();

    // Create organized folder structure: DropDrive/{uploadType}/{userId}/{fileName}
    let folder = 'DropDrive';
    
    if (uploadType) {
      folder = `${folder}/${uploadType}`;
    }
    
    if (userId) {
      folder = `${folder}/${userId}`;
    }

    // Create public ID
    let publicId = customFileName || 'upload';
    if (userId) {
      publicId = `${uploadType}_${userId}_${customFileName || 'image'}`;
    }

    const uploadOptions: any = {
      folder,
      resource_type: 'auto',
      overwrite: true,
      quality: 'auto:good',
      fetch_format: 'auto',
      public_id: publicId,
    };

    const result = await cloudinaryInstance.uploader.upload(base64Image, uploadOptions);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      folderPath: folder,
      data: result,
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns Promise with deletion response
 */
export async function deleteImageFromCloudinary(publicId: string) {
  try {
    const cloudinaryInstance = setupCloudinary();

    const result = await cloudinaryInstance.uploader.destroy(publicId);

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

/**
 * Generate an optimized Cloudinary URL
 * @param publicId - The public ID of the image
 * @param options - Optional transformation options
 * @returns Optimized Cloudinary URL
 */
export function getCloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'crop';
    quality?: string;
  } = {}
) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set');
  }

  const transformations: string[] = [];

  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.quality) transformations.push(`q_${options.quality}`);

  const transformationString = transformations.length > 0 ? `/transform/${transformations.join(',')}` : '';

  return `https://res.cloudinary.com/${cloudName}/image/upload${transformationString}/${publicId}`;
}
