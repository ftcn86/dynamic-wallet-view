
"use client";

import React from 'react';
import { Badge as UiBadge } from '@/components/ui/badge';
import type { NodeStatus } from '@/data/schemas';
import { cn } from '@/lib/utils';
import { CheckCircleIcon, ClockIcon, ZapIcon } from '@/components/shared/icons';

interface NodeStatusBadgeProps {
  status: NodeStatus | undefined;
  className?: string;
}

const statusConfig = {
    online: { variant: 'success', icon: CheckCircleIcon, text: "Online" },
    synchronizing: { variant: 'warning', icon: ClockIcon, text: "Syncing" },
    offline: { variant: 'destructive', icon: ZapIcon, text: "Offline" }
} as const;

export function NodeStatusBadge({ status, className }: NodeStatusBadgeProps) {
  if (!status || !statusConfig[status]) return null;

  const { variant, icon: IconComponent, text } = statusConfig[status];

  return (
    <UiBadge variant={variant} className={cn("flex items-center gap-1.5 capitalize text-lg px-3 py-1", className)}>
      <IconComponent className="h-4 w-4" />
      {text}
    </UiBadge>
  );
}
