"use client";

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Variant = 'info' | 'success' | 'warning' | 'destructive';

export function InfoBanner({
  variant = 'info',
  title,
  description,
  onRetry,
  className,
}: {
  variant?: Variant;
  title: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const palette: Record<Variant, string> = {
    info: 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-800',
    success: 'bg-green-50 text-green-900 border-green-200 dark:bg-green-950/30 dark:text-green-200 dark:border-green-800',
    warning: 'bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-200 dark:border-yellow-800',
    destructive: 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/30 dark:text-red-200 dark:border-red-800',
  };

  return (
    <div className={cn('w-full rounded-md border p-3 sm:p-4', palette[variant], className)} role="status" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{title}</div>
          {description && <div className="text-sm opacity-90 mt-1">{description}</div>}
        </div>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} className="shrink-0">
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}


