import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart, Users,
  FolderTree, Ticket, BarChart3, Image, Star, LogOut, Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/inventory', icon: Warehouse, label: 'Inventory' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
  { to: '/admin/categories', icon: FolderTree, label: 'Categories' },
  { to: '/admin/coupons', icon: Ticket, label: 'Coupons' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/banners', icon: Image, label: 'Banners' },
  { to: '/admin/reviews', icon: Star, label: 'Reviews' },
];

export function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden lg:flex w-64 flex-col border-r bg-background">
        <div className="flex h-16 items-center border-b px-6">
          <Link to="/admin" className="font-semibold text-lg">LUXE Admin</Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4 space-y-2">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to="/"><Store className="h-4 w-4 mr-2" />View Store</Link>
          </Button>
          <div className="text-xs text-muted-foreground px-1">{user?.email}</div>
          <Button variant="ghost" size="sm" className="w-full text-destructive" onClick={() => logout()}>
            <LogOut className="h-4 w-4 mr-2" />Logout
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="lg:hidden flex h-16 items-center justify-between border-b bg-background px-4">
          <Link to="/admin" className="font-semibold">LUXE Admin</Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild><Link to="/">Store</Link></Button>
          </div>
        </header>
        <div className="lg:hidden overflow-x-auto border-b bg-background">
          <div className="flex gap-1 p-2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'whitespace-nowrap rounded-md px-3 py-1.5 text-xs',
                  location.pathname === item.to || location.pathname.startsWith(item.to + '/')
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
