import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import { flowLog } from '@/lib/flowLogger';
import type { CartItem } from '@/types';

interface CartValidationRemoved {
  productId: string;
  size: string;
  color?: string;
  reason: string;
}

interface CartSyncResult {
  before: CartItem[];
  after: CartItem[];
  removed: CartValidationRemoved[];
  updated: string[];
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string, size: string, color?: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number, color?: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
  validateAndSync: () => Promise<CartSyncResult>;
}

const itemKey = (productId: string, size: string, color?: string) =>
  `${productId}-${size}-${color || 'default'}`;

const mergeValidatedItems = (items: CartItem[]): CartItem[] => {
  const merged = new Map<string, CartItem>();
  for (const item of items) {
    const key = itemKey(item.productId, item.size, item.color);
    const existing = merged.get(key);
    if (existing) {
      merged.set(key, {
        ...existing,
        quantity: Math.min(existing.quantity + item.quantity, item.maxStock),
        price: item.price,
        maxStock: item.maxStock,
        name: item.name,
        image: item.image,
      });
    } else {
      merged.set(key, item);
    }
  }
  return Array.from(merged.values());
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const key = itemKey(item.productId, item.size, item.color);
        set((state) => {
          const existing = state.items.find(
            (i) => itemKey(i.productId, i.size, i.color) === key
          );
          if (existing) {
            const newQty = Math.min(existing.quantity + (item.quantity || 1), item.maxStock);
            return {
              items: state.items.map((i) =>
                itemKey(i.productId, i.size, i.color) === key
                  ? { ...i, quantity: newQty, maxStock: item.maxStock, price: item.price }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: item.quantity || 1 }],
          };
        });
      },

      removeItem: (productId, size, color) => {
        const key = itemKey(productId, size, color);
        set((state) => ({
          items: state.items.filter((i) => itemKey(i.productId, i.size, i.color) !== key),
        }));
      },

      updateQuantity: (productId, size, quantity, color) => {
        const key = itemKey(productId, size, color);
        if (quantity <= 0) {
          get().removeItem(productId, size, color);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            itemKey(i.productId, i.size, i.color) === key
              ? { ...i, quantity: Math.min(quantity, i.maxStock) }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      validateAndSync: async () => {
        const before = get().items;
        if (before.length === 0) {
          return { before, after: [], removed: [], updated: [] };
        }

        try {
          const { data } = await api.post<{
            items: CartItem[];
            removed: CartValidationRemoved[];
            updated: string[];
          }>('/products/validate-cart', {
            items: before.map((i) => ({
              productId: i.productId,
              size: i.size,
              color: i.color,
              quantity: i.quantity,
            })),
          });

          const after = mergeValidatedItems(data.items);
          set({ items: after });

          const result = { before, after, removed: data.removed, updated: data.updated };
          flowLog('cart-merge-result', {
            beforeCount: before.length,
            afterCount: after.length,
            removedCount: data.removed.length,
          });
          return result;
        } catch {
          return { before, after: before, removed: [], updated: [] };
        }
      },
    }),
    { name: 'cart-storage' }
  )
);
