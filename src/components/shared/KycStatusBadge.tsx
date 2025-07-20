
"use client";

import React from 'react';
import { Badge as UiBadge } from '@/components/ui/badge';
import type { KycStatus } from '@/data/schemas';
import { cn } from '@/lib/utils';
import { ShieldCheckIcon, ShieldAlertIcon, ShieldXIcon } from '@/components/shared/icons';

interface KycStatusBadgeProps {
  status: KycStatus | undefined;
  className?: string;
}

const statusConfig = {
    completed: { variant: 'success', icon: ShieldCheckIcon, text: "Completed" },
    pending: { variant: 'warning', icon: ShieldAlertIcon, text: "Pending" },
    not_completed: { variant: 'secondary', icon: ShieldXIcon, text: "Not Completed" }
} as const;


export function KycStatusBadge({ status, className }: KycStatusBadgeProps) {
  if (!status || !statusConfig[status]) return null;

  const { variant, icon: IconComponent, text } = statusConfig[status];

  return (
    <UiBadge variant={variant} className={cn("flex items-center gap-1.5 capitalize", className)}>
      <IconComponent className="h-3.5 w-3.5" />
      {text}
    </UiBadge>
  );
}
