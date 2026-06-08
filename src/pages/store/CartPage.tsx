import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/lib/utils';
import { getProductImage } from '@/lib/images';

export default function CartPage() {
  const { items, updateQuantity, removeItem, getSubtotal } = useCartStore();
  const subtotal = getSubtotal();

  if (items.length === 0) {
    return (
      <div className="container-custom py-24 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8">Looks like you haven&apos;t added anything yet.</p>
        <Button asChild>
          <Link to="/products">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 md:py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const key = `${item.productId}-${item.size}-${item.color || 'default'}`;
            return (
              <div key={key} className="flex gap-4 border rounded-lg p-4">
                <Link to={`/products/${item.productId}`} className="shrink-0">
                  <img
                    src={getProductImage(item.image)}
                    alt={item.name}
                    className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-md bg-muted"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.productId}`} className="font-medium hover:underline line-clamp-1">
                    {item.name}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1">
                    Size: {item.size}
                    {item.color && ` · Color: ${item.color}`}
                  </p>
                  <p className="font-semibold mt-2">{formatPrice(item.price)}</p>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={item.quantity <= 1}
                        onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1, item.color)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={item.quantity >= item.maxStock}
                        onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1, item.color)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive gap-1"
                      onClick={() => removeItem(item.productId, item.size, item.color)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Remove</span>
                    </Button>
                  </div>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 sticky top-24">
            <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{subtotal >= 100 ? 'Free' : formatPrice(9.99)}</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between font-semibold text-lg mb-6">
              <span>Total</span>
              <span>{formatPrice(subtotal + (subtotal >= 100 ? 0 : 9.99))}</span>
            </div>
            {subtotal < 100 && (
              <p className="text-xs text-muted-foreground mb-4">
                Add {formatPrice(100 - subtotal)} more for free shipping
              </p>
            )}
            <Button className="w-full gap-2" size="lg" asChild>
              <Link to="/checkout">
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full mt-3" asChild>
              <Link to="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
