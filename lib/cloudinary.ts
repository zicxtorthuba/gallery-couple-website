// Server-side Cloudinary configuration (only for API routes)
let cloudinary: any = null;

// Initialize Cloudinary only on server-side
if (typeof window === 'undefined') {
  try {
    const { v2 } = require('cloudinary');
    cloudinary = v2;
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  } catch (error) {
    console.warn('Cloudinary server-side initialization failed:', error);
  }
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  bytes: number;
}

export interface UploadOptions {
  folder?: string;
  transformation?: any[];
  tags?: string[];
  context?: Record<string, string>;
  eager?: any[];
  quality?: string;
  format?: string;
}

// Client-side upload function using unsigned upload
export const uploadToCloudinary = async (
  file: File,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'default');
  
  if (options.folder) {
    formData.append('folder', options.folder);
  }
  
  if (options.tags && options.tags.length > 0) {
    formData.append('tags', options.tags.join(','));
  }

  if (options.context) {
    formData.append('context', Object.entries(options.context)
      .map(([key, value]) => `${key}=${value}`)
      .join('|')
    );
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Upload failed');
  }

  return await response.json();
};

// Server-side delete function
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
};

// Extract public ID from Cloudinary URL
export const extractPublicId = (url: string): string | null => {
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) return null;
    
    // Get everything after version (if present) or after upload
    let pathParts = urlParts.slice(uploadIndex + 1);
    
    // Remove version if present (starts with 'v' followed by numbers)
    if (pathParts[0] && /^v\d+$/.test(pathParts[0])) {
      pathParts = pathParts.slice(1);
    }
    
    // Join the remaining parts and remove file extension
    const publicId = pathParts.join('/').replace(/\.[^/.]+$/, '');
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

// Check if URL is from Cloudinary
export const isCloudinaryUrl = (url: string): boolean => {
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
};

// Image optimization presets
export const OPTIMIZATION_PRESETS = {
  thumbnail: {
    width: 300,
    height: 300,
    crop: 'fill',
    quality: 'auto:good',
    fetch_format: 'auto'
  },
  gallery: {
    width: 800,
    crop: 'scale',
    quality: 'auto:good',
    fetch_format: 'auto'
  },
  hero: {
    width: 1200,
    crop: 'scale',
    quality: 'auto:best',
    fetch_format: 'auto'
  },
  blog: {
    width: 1000,
    crop: 'scale',
    quality: 'auto:good',
    fetch_format: 'auto'
  }
};

// Generate optimized URL with transformations
export const getOptimizedImageUrl = (
  url: string,
  preset: keyof typeof OPTIMIZATION_PRESETS | 'custom' = 'gallery',
  customTransformations?: Record<string, any>
): string => {
  if (!isCloudinaryUrl(url)) return url;

  let transformations: Record<string, any>;
  
  if (preset === 'custom' && customTransformations) {
    transformations = customTransformations;
  } else if (preset !== 'custom') {
    transformations = OPTIMIZATION_PRESETS[preset] || OPTIMIZATION_PRESETS.gallery;
  } else {
    // Fallback for custom preset without transformations
    transformations = OPTIMIZATION_PRESETS.gallery;
  }

  // Build transformation string
  const transformString = Object.entries(transformations)
    .map(([key, value]) => `${key}_${value}`)
    .join(',');

  // Insert transformation into URL
  return url.replace('/upload/', `/upload/${transformString}/`);
};

// Generate responsive image URLs for different screen sizes
export const getResponsiveImageUrls = (url: string) => {
  if (!isCloudinaryUrl(url)) {
    return {
      mobile: url,
      tablet: url,
      desktop: url,
      original: url
    };
  }

  return {
    mobile: getOptimizedImageUrl(url, 'custom', {
      width: 480,
      crop: 'scale',
      quality: 'auto:good',
      fetch_format: 'auto'
    }),
    tablet: getOptimizedImageUrl(url, 'custom', {
      width: 768,
      crop: 'scale',
      quality: 'auto:good',
      fetch_format: 'auto'
    }),
    desktop: getOptimizedImageUrl(url, 'gallery'),
    original: url
  };
};

// Enhanced upload function with automatic optimization
export const uploadToCloudinaryOptimized = async (
  file: File,
  options: UploadOptions & {
    preset?: keyof typeof OPTIMIZATION_PRESETS;
    generateThumbnail?: boolean;
    generateResponsive?: boolean;
  } = {}
): Promise<CloudinaryUploadResult & { optimizedUrls?: any }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'default');
  
  // Add basic options
  if (options.folder) {
    formData.append('folder', options.folder);
  }
  
  if (options.tags && options.tags.length > 0) {
    formData.append('tags', options.tags.join(','));
  }

  if (options.context) {
    formData.append('context', Object.entries(options.context)
      .map(([key, value]) => `${key}=${value}`)
      .join('|')
    );
  }

  // Add eager transformations for automatic optimization
  const eagerTransformations = [];
  
  // Add preset-based transformation
  if (options.preset && OPTIMIZATION_PRESETS[options.preset]) {
    const preset = OPTIMIZATION_PRESETS[options.preset];
    eagerTransformations.push(preset);
  }

  // Add thumbnail if requested
  if (options.generateThumbnail) {
    eagerTransformations.push(OPTIMIZATION_PRESETS.thumbnail);
  }

  // Add responsive variants if requested
  if (options.generateResponsive) {
    eagerTransformations.push(
      { width: 480, crop: 'scale', quality: 'auto:good', fetch_format: 'auto' },
      { width: 768, crop: 'scale', quality: 'auto:good', fetch_format: 'auto' },
      { width: 1200, crop: 'scale', quality: 'auto:good', fetch_format: 'auto' }
    );
  }

  // Add custom transformations
  if (options.transformation) {
    eagerTransformations.push(...options.transformation);
  }

  // Add eager transformations to form data
  if (eagerTransformations.length > 0) {
    formData.append('eager', JSON.stringify(eagerTransformations));
  }

  // Add quality and format if specified
  if (options.quality) {
    formData.append('quality', options.quality);
  }
  
  if (options.format) {
    formData.append('format', options.format);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Upload failed');
  }

  const result = await response.json();

  // Generate optimized URLs
  const optimizedUrls = {
    thumbnail: getOptimizedImageUrl(result.secure_url, 'thumbnail'),
    gallery: getOptimizedImageUrl(result.secure_url, 'gallery'),
    hero: getOptimizedImageUrl(result.secure_url, 'hero'),
    blog: getOptimizedImageUrl(result.secure_url, 'blog'),
    responsive: getResponsiveImageUrls(result.secure_url)
  };

  return {
    ...result,
    optimizedUrls
  };
};

// Utility to get file size reduction estimate
export const getOptimizationStats = async (originalUrl: string) => {
  if (!isCloudinaryUrl(originalUrl)) return null;

  try {
    // Get original image info
    const originalResponse = await fetch(originalUrl);
    const originalSize = parseInt(originalResponse.headers.get('content-length') || '0');

    // Get optimized image info
    const optimizedUrl = getOptimizedImageUrl(originalUrl, 'gallery');
    const optimizedResponse = await fetch(optimizedUrl);
    const optimizedSize = parseInt(optimizedResponse.headers.get('content-length') || '0');

    const reduction = originalSize > 0 ? ((originalSize - optimizedSize) / originalSize) * 100 : 0;

    return {
      originalSize,
      optimizedSize,
      reduction: Math.round(reduction),
      savings: originalSize - optimizedSize
    };
  } catch (error) {
    console.error('Error getting optimization stats:', error);
    return null;
  }
};

export default cloudinary;