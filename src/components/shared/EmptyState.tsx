"use client";

import { Button } from '@/components/ui/button';

export function EmptyState({
  title,
  description,
  actionText,
  onAction,
}: {
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}) {
  return (
    <div className="text-center p-6 sm:p-8">
      <div className="text-base sm:text-lg font-medium">{title}</div>
      {description && <div className="text-sm text-muted-foreground mt-1">{description}</div>}
      {onAction && actionText && (
        <Button className="mt-3" size="sm" onClick={onAction}>{actionText}</Button>
      )}
    </div>
  );
}


