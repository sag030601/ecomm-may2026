import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';

function waitForHydration(store: { persist: { hasHydrated: () => boolean; onFinishHydration: (fn: () => void) => () => void } }): Promise<void> {
  return new Promise((resolve) => {
    if (store.persist.hasHydrated()) {
      resolve();
      return;
    }
    const unsub = store.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}

export async function waitForStoreHydration(): Promise<void> {
  await Promise.all([waitForHydration(useCartStore), waitForHydration(useAuthStore)]);
}
