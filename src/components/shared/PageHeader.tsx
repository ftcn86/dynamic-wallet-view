"use client";

import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  subtitle,
  className,
  right,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className={cn('relative flex items-start justify-between gap-3 pb-2', className)}>
      <div className="pointer-events-none absolute inset-x-0 -top-2 h-px bg-gradient-to-r from-primary/30 via-accent/20 to-transparent" />
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-headline break-words">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {right}
    </div>
  );
}


