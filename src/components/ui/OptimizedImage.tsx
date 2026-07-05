import type { ImgHTMLAttributes } from 'react';
import {
  buildImageSrcSet,
  getOptimizedImageUrl,
  IMAGE_SIZES,
  onImageError,
  PLACEHOLDER_IMAGE,
  type ImagePreset,
} from '@/lib/images';

const DEFAULT_SIZES: Record<ImagePreset, string> = {
  thumb: '96px',
  cart: '96px',
  card: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px',
  category: '(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 200px',
  detail: '(max-width: 768px) 100vw, 50vw',
  hero: '100vw',
};

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string;
  preset?: ImagePreset;
  width?: number;
  sizes?: string;
  fallback?: string;
  priority?: boolean;
  responsive?: boolean;
}

export function OptimizedImage({
  src,
  preset = 'card',
  width,
  sizes,
  fallback = PLACEHOLDER_IMAGE,
  priority = false,
  responsive = true,
  alt = '',
  className,
  ...rest
}: OptimizedImageProps) {
  const targetWidth = width ?? IMAGE_SIZES[preset];
  const optimizedSrc = getOptimizedImageUrl(src, targetWidth);
  const srcSet = responsive ? buildImageSrcSet(src, preset) : undefined;

  return (
    <img
      src={optimizedSrc}
      srcSet={srcSet || undefined}
      sizes={srcSet ? (sizes ?? DEFAULT_SIZES[preset]) : undefined}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      {...(priority ? { fetchPriority: 'high' as const } : {})}
      className={className}
      onError={onImageError(fallback)}
      {...rest}
    />
  );
}
