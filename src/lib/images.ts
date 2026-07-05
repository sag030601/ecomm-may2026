import type { SyntheticEvent } from 'react';

export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=480&q=75';

export const HERO_SLIDE_IMAGES = [
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1280&q=75',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1280&q=75',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1280&q=75',
] as const;

export const CATEGORY_IMAGES: Record<string, string> = {
  men: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=640&q=75',
  women: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=640&q=75',
  accessories: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=640&q=75',
  footwear: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=640&q=75',
  fashion: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=640&q=75',
  lifestyle: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=640&q=75',
  electronics: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=640&q=75',
  home: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=640&q=75',
};

export const PROMO_IMAGES = {
  summer: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1280&q=75',
  bundle: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1280&q=75',
} as const;

export type ImagePreset = 'thumb' | 'cart' | 'card' | 'category' | 'detail' | 'hero';

export const IMAGE_SIZES: Record<ImagePreset, number> = {
  thumb: 96,
  cart: 160,
  card: 480,
  category: 640,
  detail: 960,
  hero: 1280,
};

const SRCSET_WIDTHS: Record<ImagePreset, number[]> = {
  thumb: [96, 128],
  cart: [128, 160, 240],
  card: [320, 480, 640],
  category: [320, 480, 640, 800],
  detail: [480, 640, 960, 1200],
  hero: [640, 960, 1280, 1600],
};

const CLOUDINARY_HOST = 'res.cloudinary.com';
const CLOUDINARY_UPLOAD_MARKER = '/image/upload/';

const isCloudinaryUrl = (url: string) =>
  url.includes(CLOUDINARY_HOST) && url.includes(CLOUDINARY_UPLOAD_MARKER);

const buildTransform = (width: number, height?: number) => {
  const parts = [`w_${width}`, height ? `h_${height}` : null, 'c_limit', 'f_auto', 'q_auto:good', 'dpr_auto'].filter(
    Boolean
  );
  return parts.join(',');
};

/** Strip existing Cloudinary transforms; keep version + public_id path */
const getCloudinaryAssetPath = (url: string): string | null => {
  const markerIndex = url.indexOf(CLOUDINARY_UPLOAD_MARKER);
  if (markerIndex === -1) return null;

  const rest = url.slice(markerIndex + CLOUDINARY_UPLOAD_MARKER.length);
  const segments = rest.split('/');

  let start = 0;
  while (start < segments.length) {
    const segment = segments[start];
    if (/^v\d+$/.test(segment)) break;
    if (/\.(jpe?g|png|webp|gif|avif|svg)$/i.test(segment)) break;
    if (segment.includes(',') || /^[a-z]_/.test(segment)) {
      start += 1;
      continue;
    }
    break;
  }

  return segments.slice(start).join('/');
};

export const applyCloudinaryTransform = (
  url: string,
  width: number,
  height?: number
): string => {
  if (!isCloudinaryUrl(url)) return url;

  const assetPath = getCloudinaryAssetPath(url);
  if (!assetPath) return url;

  const prefix = url.slice(0, url.indexOf(CLOUDINARY_UPLOAD_MARKER) + CLOUDINARY_UPLOAD_MARKER.length);
  return `${prefix}${buildTransform(width, height)}/${assetPath}`;
};

const optimizeUnsplashUrl = (url: string, width: number): string => {
  if (!url.includes('images.unsplash.com')) return url;

  try {
    const parsed = new URL(url);
    parsed.searchParams.set('auto', 'format');
    parsed.searchParams.set('fit', 'crop');
    parsed.searchParams.set('w', String(width));
    parsed.searchParams.set('q', '75');
    return parsed.toString();
  } catch {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}auto=format&fit=crop&w=${width}&q=75`;
  }
};

/** Return a CDN-optimized URL for the requested display width */
export const getOptimizedImageUrl = (url?: string, width = IMAGE_SIZES.card): string => {
  const trimmed = url?.trim();
  if (!trimmed) return PLACEHOLDER_IMAGE;

  if (isCloudinaryUrl(trimmed)) {
    return applyCloudinaryTransform(trimmed, width);
  }

  if (trimmed.includes('images.unsplash.com')) {
    return optimizeUnsplashUrl(trimmed, width);
  }

  return trimmed;
};

export const buildImageSrcSet = (url: string | undefined, preset: ImagePreset = 'card'): string => {
  const trimmed = url?.trim();
  if (!trimmed) return '';

  const widths = SRCSET_WIDTHS[preset];
  return widths.map((w) => `${getOptimizedImageUrl(trimmed, w)} ${w}w`).join(', ');
};

export const getSrcSetWidths = (preset: ImagePreset) => SRCSET_WIDTHS[preset];

export const normalizeImageUrl = (url?: string, width = IMAGE_SIZES.detail): string | undefined => {
  if (!url?.trim()) return undefined;
  return getOptimizedImageUrl(url, width);
};

export const getProductImage = (url?: string, preset: ImagePreset | number = 'card') => {
  const width = typeof preset === 'number' ? preset : IMAGE_SIZES[preset];
  return getOptimizedImageUrl(url, width) ?? PLACEHOLDER_IMAGE;
};

export const getCategoryImage = (slugOrName: string, url?: string) => {
  const key = slugOrName.toLowerCase().replace(/\s+/g, '-');
  if (CATEGORY_IMAGES[key]) {
    return getOptimizedImageUrl(CATEGORY_IMAGES[key], IMAGE_SIZES.category);
  }
  return getOptimizedImageUrl(url, IMAGE_SIZES.category) ?? CATEGORY_IMAGES.fashion;
};

export const getHeroImage = (url: string | undefined, slideIndex = 0) => {
  if (!url?.trim()) {
    return HERO_SLIDE_IMAGES[slideIndex % HERO_SLIDE_IMAGES.length];
  }
  return getOptimizedImageUrl(url, IMAGE_SIZES.hero) ?? HERO_SLIDE_IMAGES[slideIndex % HERO_SLIDE_IMAGES.length];
};

export const onImageError =
  (fallback: string) => (e: SyntheticEvent<HTMLImageElement>) => {
    if (e.currentTarget.src !== fallback) {
      e.currentTarget.src = fallback;
    }
  };
