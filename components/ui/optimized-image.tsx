"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  isCloudinaryUrl, 
  getOptimizedImageUrl, 
  getResponsiveImageUrls,
  getOptimizationStats,
  OPTIMIZATION_PRESETS 
} from '@/lib/cloudinary';

interface OptimizedImageProps {
  src: string;
  alt: string;
  preset?: keyof typeof OPTIMIZATION_PRESETS;
  customTransformations?: Record<string, any>;
  showOptimizationStats?: boolean;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export function OptimizedImage({
  src,
  alt,
  preset = 'gallery',
  customTransformations,
  showOptimizationStats = false,
  className = '',
  fill = false,
  width,
  height,
  sizes,
  priority = false,
  quality,
  placeholder,
  blurDataURL,
  ...props
}: OptimizedImageProps) {
  const [optimizationStats, setOptimizationStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get optimized URL
  const optimizedSrc = isCloudinaryUrl(src) 
    ? customTransformations 
      ? getOptimizedImageUrl(src, 'custom', customTransformations)
      : getOptimizedImageUrl(src, preset)
    : src;

  // Get responsive URLs for srcSet
  const responsiveUrls = isCloudinaryUrl(src) ? getResponsiveImageUrls(src) : null;

  useEffect(() => {
    if (showOptimizationStats && isCloudinaryUrl(src)) {
      getOptimizationStats(src).then(stats => {
        setOptimizationStats(stats);
      }).catch(err => {
        console.error('Failed to get optimization stats:', err);
      });
    }
  }, [src, showOptimizationStats]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load image');
  };

  // Note: Next.js Image component handles responsive images automatically
  // using the 'sizes' prop and its built-in optimization

  return (
    <div className="relative">
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse rounded" />
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
          Failed to load image
        </div>
      )}

      {/* Optimized Image */}
      <Image
        src={optimizedSrc}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        sizes={sizes || (responsiveUrls ? "(max-width: 480px) 480px, (max-width: 768px) 768px, 1200px" : undefined)}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />

      {/* Optimization Stats Overlay */}
      {showOptimizationStats && optimizationStats && (
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          <div>Saved: {optimizationStats.reduction}%</div>
          <div>{(optimizationStats.savings / 1024).toFixed(1)}KB</div>
        </div>
      )}

      {/* Cloudinary Badge */}
      {isCloudinaryUrl(src) && (
        <div className="absolute top-2 right-2 bg-blue-500/80 text-white text-xs px-2 py-1 rounded">
          Optimized
        </div>
      )}
    </div>
  );
}

// Preset-specific components for common use cases
export function GalleryImage(props: Omit<OptimizedImageProps, 'preset'>) {
  return <OptimizedImage {...props} preset="gallery" />;
}

export function ThumbnailImage(props: Omit<OptimizedImageProps, 'preset'>) {
  return <OptimizedImage {...props} preset="thumbnail" />;
}

export function HeroImage(props: Omit<OptimizedImageProps, 'preset'>) {
  return <OptimizedImage {...props} preset="hero" />;
}

export function BlogImage(props: Omit<OptimizedImageProps, 'preset'>) {
  return <OptimizedImage {...props} preset="blog" />;
}