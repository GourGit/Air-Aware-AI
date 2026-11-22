import { Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  MapPin,
  User,
  Smartphone,
  LogIn,
} from 'lucide-react';
import { useThemeStore } from '@/store/theme-store';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { theme, toggleTheme } = useThemeStore();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 border-b border-border dark:border-forest/30 bg-white dark:bg-charcoal/95 shrink-0">
      {/* Left: Mobile menu + Location */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-2 text-sm text-slate">
          <MapPin className="w-4 h-4 text-mint shrink-0" />
          <span className="hidden sm:inline font-medium text-charcoal dark:text-mist">
            {user?.location?.city ?? 'India (CAAQMS Network)'}
          </span>
        </div>
      </div>

      {/* Center: Search (desktop) */}
      <div className="hidden lg:flex items-center max-w-md w-full mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
          <input
            type="search"
            placeholder="Search city, station, or pollutant (e.g. Delhi, PM2.5)..."
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-border bg-muted text-sm text-charcoal placeholder:text-slate/60 focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-1 dark:bg-forest/10 dark:border-forest/30 dark:text-mist"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </Button>

        {isAuthenticated ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              className="relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-mint rounded-full" />
            </Button>

            <div className="ml-2 flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-mint/10 text-mint">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <span className="hidden md:inline text-sm font-medium text-charcoal dark:text-mist">
                {user?.name ?? 'User'}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-muted dark:bg-forest/20 text-slate">
              Public AQI View
            </span>
            <Link to="/login">
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5">
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
