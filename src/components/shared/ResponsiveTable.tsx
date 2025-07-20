"use client"

import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  mobileCardView?: boolean;
  cardViewBreakpoint?: 'sm' | 'md' | 'lg';
}

interface ResponsiveTableRowProps {
  children: React.ReactNode;
  className?: string;
  data?: Record<string, any>;
  renderCard?: (data: Record<string, any>) => React.ReactNode;
}

export function ResponsiveTable({ 
  children, 
  className, 
  mobileCardView = true,
  cardViewBreakpoint = 'md'
}: ResponsiveTableProps) {
  const isMobile = useIsMobile();
  const shouldUseCardView = mobileCardView && isMobile;

  if (shouldUseCardView) {
    return (
      <div className={cn("space-y-3", className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn("relative w-full overflow-auto", className)}>
      {children}
    </div>
  );
}

export function ResponsiveTableRow({ 
  children, 
  className, 
  data = {},
  renderCard
}: ResponsiveTableRowProps) {
  const isMobile = useIsMobile();

  if (isMobile && renderCard) {
    return (
      <div className={cn("p-4 border rounded-lg bg-card shadow-sm", className)}>
        {renderCard(data)}
      </div>
    );
  }

  if (isMobile && !renderCard) {
    // Default mobile card view
    return (
      <div className={cn("p-4 border rounded-lg bg-card shadow-sm space-y-2", className)}>
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child) && child.type === 'td') {
            return (
              <div key={index} className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-medium">
                  {/* You can add labels here if needed */}
                </span>
                <span className="text-sm">{child.props.children}</span>
              </div>
            );
          }
          return child;
        })}
      </div>
    );
  }

  return (
    <tr className={cn("border-b transition-colors hover:bg-muted/50", className)}>
      {children}
    </tr>
  );
}

// Re-export table components for convenience
export { 
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption
} from '@/components/ui/table'; 