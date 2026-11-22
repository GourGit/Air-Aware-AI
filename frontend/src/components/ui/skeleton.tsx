import { type HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Width of the skeleton. Use Tailwind classes or inline style. */
  width?: string;
  /** Height of the skeleton. Use Tailwind classes or inline style. */
  height?: string;
}

function Skeleton({ className, width, height, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-slate/10 dark:bg-slate/20',
        className,
      )}
      style={{ width, height, ...style }}
      {...props}
    />
  );
}

export { Skeleton };
