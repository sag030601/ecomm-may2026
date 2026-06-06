import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string, size: string, color?: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number, color?: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

const itemKey = (productId: string, size: string, color?: string) =>
  `${productId}-${size}-${color || 'default'}`;

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
                  ? { ...i, quantity: newQty }
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
    }),
    { name: 'cart-storage' }
  )
);
