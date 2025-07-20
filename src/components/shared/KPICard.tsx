
import React, { type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUpIcon } from './icons';

interface KPICardProps {
  title: string;
  value: string;
  icon: ReactNode;
  footerValue?: string;
  change?: string;
  badgeText?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "success" | "warning" | "info" | "outline" | null | undefined;
}

export function KPICard({ title, value, icon, footerValue, change, badgeText, badgeVariant = 'default' }: KPICardProps) {
  return (
    <Card className="shadow-sm hover:shadow-lg transition-all duration-300 min-h-[120px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight">
          {title}
        </CardTitle>
        <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-md bg-primary text-primary-foreground flex-shrink-0">
          {React.cloneElement(icon as React.ReactElement, { className: "h-3 w-3 sm:h-5 sm:w-5" })}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="text-lg sm:text-xl md:text-2xl font-bold text-foreground leading-tight break-words">
          {value}
        </div>
        <div className="flex items-center text-xs text-muted-foreground gap-1 sm:gap-2 mt-2">
            <span className="truncate">{footerValue}</span>
            {change && (
                <span className="flex items-center text-green-600 font-semibold flex-shrink-0">
                    <TrendingUpIcon className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5" />
                    {change}
                </span>
            )}
        </div>
        {badgeText && (
          <Badge variant={badgeVariant} className="mt-2 w-fit text-xs">
            {badgeText}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
