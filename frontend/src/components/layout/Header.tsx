import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  MapPin,
  User,
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
          <MapPin className="w-4 h-4 text-mint" />
          <span className="hidden sm:inline font-medium text-charcoal dark:text-mist">
            {user?.location?.city ?? 'Set location'}
          </span>
        </div>
      </div>

      {/* Center: Search (desktop) */}
      <div className="hidden lg:flex items-center max-w-md w-full mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
          <input
            type="search"
            placeholder="Search locations, pollutants..."
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-border bg-muted text-sm text-charcoal placeholder:text-slate/60 focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-1 dark:bg-forest/10 dark:border-forest/30 dark:text-mist"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
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
            {user?.name ?? 'Guest'}
          </span>
        </div>
      </div>
    </header>
  );
}
