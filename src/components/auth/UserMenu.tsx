import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Shield, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function UserMenu() {
  const navigate = useNavigate();
  const { user, logout, isAdmin, isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated() || !user) {
    return (
      <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
        <Link to="/login">Sign In</Link>
      </Button>
    );
  }

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/');
  };

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 rounded-full border px-2 py-1.5 pl-1.5 pr-3 text-sm transition-colors hover:bg-muted',
          open && 'bg-muted'
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {user.avatar ? (
          <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
            {initials}
          </span>
        )}
        <span className="hidden md:inline max-w-[100px] truncate font-medium">{user.name.split(' ')[0]}</span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-lg border bg-background shadow-lg py-1 z-50"
          role="menu"
        >
          <div className="px-3 py-2 border-b">
            <p className="font-medium text-sm truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <Link
            to="/profile"
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            <User className="h-4 w-4" />
            My Account
          </Link>
          {isAdmin() && (
            <Link
              to="/admin"
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              <Shield className="h-4 w-4" />
              Admin Panel
            </Link>
          )}
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            onClick={handleLogout}
            role="menuitem"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
