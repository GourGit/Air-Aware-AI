import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Wind,
  Map,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  mobileOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Air Quality', path: '/air-quality', icon: Wind },
  { label: 'Air Map', path: '/map', icon: Map },
  { 
    label: 'Mobile App', 
    path: '/assistant', 
    icon: Smartphone,
    mobileOnly: true 
  },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="hidden md:flex flex-col border-r border-border dark:border-forest/30 bg-white dark:bg-charcoal/95 h-screen relative z-20"
    >
      {/* Logo area */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border dark:border-forest/30">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-mint text-white font-display font-bold text-sm shrink-0">
          AA
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="font-display font-bold text-lg text-charcoal dark:text-mist whitespace-nowrap"
          >
            AirAware AI
          </motion.span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative',
                isActive
                  ? 'bg-mint/10 text-mint'
                  : 'text-slate hover:bg-mist hover:text-charcoal dark:hover:bg-forest/20 dark:hover:text-mist',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-mint rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse button */}
      <div className="border-t border-border dark:border-forest/30 p-2">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full h-9 rounded-lg text-slate hover:bg-mist hover:text-charcoal dark:hover:bg-forest/20 dark:hover:text-mist transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <motion.div className="w-5 h-5" animate={{ rotate: 180 }} transition={{ type: 'spring' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </motion.div>
          ) : (
            <motion.div className="w-5 h-5" animate={{ rotate: 0 }} transition={{ type: 'spring' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </motion.div>
          )}
        </button>
      </div>
    </motion.aside>
  );
}