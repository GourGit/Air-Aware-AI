import {
  format,
  formatDistanceToNow,
  parseISO,
  isToday,
  isYesterday,
  differenceInMinutes,
} from 'date-fns';

/**
 * Formats an ISO date string to a readable date.
 * Example: "Nov 22, 2024"
 */
export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d, yyyy');
}

/**
 * Formats an ISO date string to a readable date with time.
 * Example: "Nov 22, 2024 at 2:30 PM"
 */
export function formatDateTime(dateStr: string): string {
  return format(parseISO(dateStr), "MMM d, yyyy 'at' h:mm a");
}

/**
 * Formats an ISO date string to just time.
 * Example: "2:30 PM"
 */
export function formatTime(dateStr: string): string {
  return format(parseISO(dateStr), 'h:mm a');
}

/**
 * Returns a human-readable relative time string.
 * Example: "5 minutes ago", "2 hours ago"
 */
export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
}

/**
 * Returns a smart timestamp — "Just now", "5 min ago", "2:30 PM", "Yesterday", or date.
 */
export function formatSmartTimestamp(dateStr: string): string {
  const date = parseISO(dateStr);
  const now = new Date();
  const diffMins = differenceInMinutes(now, date);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return `Yesterday at ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, yyyy');
}

/**
 * Formats a date for chart axis labels.
 * Example: "22 Nov" or "2 PM"
 */
export function formatChartDate(dateStr: string, granularity: 'hour' | 'day' | 'month'): string {
  const date = parseISO(dateStr);
  switch (granularity) {
    case 'hour':
      return format(date, 'h a');
    case 'day':
      return format(date, 'd MMM');
    case 'month':
      return format(date, 'MMM yyyy');
  }
}
