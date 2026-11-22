import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-mint/10 text-mint border border-mint/20',
        secondary: 'bg-slate/10 text-slate border border-slate/20',
        success: 'bg-aqi-good/10 text-aqi-good border border-aqi-good/20',
        warning: 'bg-aqi-moderate/10 text-aqi-moderate border border-aqi-moderate/20',
        danger: 'bg-aqi-poor/10 text-aqi-poor border border-aqi-poor/20',
        outline: 'border border-border text-charcoal dark:text-mist',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
