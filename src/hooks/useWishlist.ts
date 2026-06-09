import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'luxe-wishlist';
const EMPTY_WISHLIST: string[] = [];

let cachedRaw: string | null = null;
let cachedSnapshot: string[] = EMPTY_WISHLIST;

function readWishlistFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) {
      return cachedSnapshot;
    }
    cachedRaw = raw;
    if (!raw) {
      cachedSnapshot = EMPTY_WISHLIST;
      return cachedSnapshot;
    }
    const parsed = JSON.parse(raw) as string[];
    cachedSnapshot = Array.isArray(parsed) ? parsed : EMPTY_WISHLIST;
    return cachedSnapshot;
  } catch {
    cachedRaw = null;
    cachedSnapshot = EMPTY_WISHLIST;
    return cachedSnapshot;
  }
}

function getServerSnapshot(): string[] {
  return EMPTY_WISHLIST;
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('wishlist-updated', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('wishlist-updated', callback);
  };
}

function persist(ids: string[]) {
  const raw = JSON.stringify(ids);
  localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedSnapshot = ids.length === 0 ? EMPTY_WISHLIST : ids;
  window.dispatchEvent(new Event('wishlist-updated'));
}

export function useWishlist() {
  const ids = useSyncExternalStore(subscribe, readWishlistFromStorage, getServerSnapshot);

  const toggle = useCallback((productId: string) => {
    const current = readWishlistFromStorage();
    const next = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    persist(next);
  }, []);

  const isWishlisted = useCallback(
    (productId: string) => ids.includes(productId),
    [ids]
  );

  return { ids, toggle, isWishlisted, count: ids.length };
}
