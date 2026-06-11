import type { SyntheticEvent } from 'react';

export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

/** Verified working Unsplash URLs for hero carousel */
export const HERO_SLIDE_IMAGES = [
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1920&q=80',
] as const;

/** Verified category / section images */
export const CATEGORY_IMAGES: Record<string, string> = {
  men: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
  women: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
  accessories: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
  footwear: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
  fashion: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80',
  lifestyle: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
  electronics: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
  home: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
};

export const PROMO_IMAGES = {
  summer: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1920&q=80',
  bundle: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1920&q=80',
} as const;

export const normalizeImageUrl = (url?: string, width = 1200): string | undefined => {
  if (!url?.trim()) return undefined;
  if (url.includes('images.unsplash.com') && !url.includes('auto=format')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}auto=format&fit=crop&w=${width}&q=80`;
  }
  return url;
};

export const getProductImage = (url?: string) =>
  normalizeImageUrl(url, 800) ?? PLACEHOLDER_IMAGE;

export const getCategoryImage = (slugOrName: string, url?: string) => {
  const key = slugOrName.toLowerCase().replace(/\s+/g, '-');
  if (CATEGORY_IMAGES[key]) return CATEGORY_IMAGES[key];
  return normalizeImageUrl(url, 800) ?? CATEGORY_IMAGES.fashion;
};

export const getHeroImage = (url: string | undefined, slideIndex = 0) => {
  if (!url?.trim()) {
    return HERO_SLIDE_IMAGES[slideIndex % HERO_SLIDE_IMAGES.length];
  }
  return normalizeImageUrl(url, 1920) ?? HERO_SLIDE_IMAGES[slideIndex % HERO_SLIDE_IMAGES.length];
};

export const onImageError =
  (fallback: string) => (e: SyntheticEvent<HTMLImageElement>) => {
    if (e.currentTarget.src !== fallback) {
      e.currentTarget.src = fallback;
    }
  };
