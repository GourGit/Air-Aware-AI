import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  Search,
  MapPin,
  Smartphone,
  LogIn,
  Download,
} from 'lucide-react';
import { useThemeStore } from '@/store/theme-store';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();
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
            India (CAAQMS Network)
          </span>
        </div>
      </div>

      {/* Center: Search (desktop) - only on public pages */}
      {location.pathname !== '/login' && location.pathname !== '/register' && (
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
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          )}
        </Button>

        {/* Mobile App CTA for authenticated users on web */}
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <Link to="/assistant" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mint/10 border border-mint/20 text-mint hover:bg-mint/20 text-xs font-semibold transition-colors">
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile App</span>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-muted dark:bg-forest/20 text-slate">
              Public AQI View
            </span>
            <Link to="/login" state={{ from: location }}>
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                <span>Sign In</span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}