import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, Search, Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { UserMenu } from '@/components/auth/UserMenu';
import { useState } from 'react';

export function Navbar() {
  const navigate = useNavigate();
  const itemCount = useCartStore((s) => s.getItemCount());
  const { user, logout, isAdmin } = useAuthStore();
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(search.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
            <ShoppingBag className="h-6 w-6" />
            <span className="hidden sm:inline">LUXE</span>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </form>

          <nav className="hidden lg:flex items-center gap-6 text-sm">
            <Link to="/products" className="text-muted-foreground hover:text-foreground transition-colors">Shop</Link>
            <Link to="/products?bestSeller=true" className="text-muted-foreground hover:text-foreground transition-colors">Best Sellers</Link>
            <Link to="/products?crazyDeal=true" className="text-muted-foreground hover:text-foreground transition-colors">Deals</Link>
          </nav>

          <div className="flex items-center gap-2">
            {isAdmin() && (
              <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
                <Link to="/admin">Admin</Link>
              </Button>
            )}
            <UserMenu />
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link to="/cart">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t py-4 space-y-3">
            <form onSubmit={handleSearch}>
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </form>
            <Link to="/products" className="block py-2" onClick={() => setMobileOpen(false)}>Shop</Link>
            {user ? (
              <>
                <Link to="/profile" className="block py-2" onClick={() => setMobileOpen(false)}>My Account</Link>
                <button
                  type="button"
                  onClick={async () => { await logout(); setMobileOpen(false); navigate('/'); }}
                  className="flex items-center gap-2 py-2 text-destructive w-full text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" className="block py-2 font-medium" onClick={() => setMobileOpen(false)}>Sign In</Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
