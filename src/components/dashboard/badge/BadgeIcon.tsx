
"use client";

import { cn } from "@/lib/utils";
import {
    Award,
    Server,
    Users,
    ShieldCheck,
    Clock,
    Calendar,
    Trophy,
    Star,
    Rabbit,
    Sparkles,
    type LucideIcon,
} from 'lucide-react';

const badgeIconMap: Record<string, {
    Icon: LucideIcon;
    iconClass: string;
    bgClass: string;
}> = {
    // Standard Badges
    b001: { Icon: Award, iconClass: 'text-amber-300', bgClass: 'bg-amber-800' }, // Early Adopter
    b002: { Icon: Server, iconClass: 'text-sky-300', bgClass: 'bg-sky-800' }, // Node Runner
    b003: { Icon: Users, iconClass: 'text-fuchsia-300', bgClass: 'bg-fuchsia-800' }, // Team Builder
    b004: { Icon: ShieldCheck, iconClass: 'text-emerald-300', bgClass: 'bg-emerald-800' }, // KYC Verified

    // Gamification Badges
    b_wmara: { Icon: Clock, iconClass: 'text-rose-300', bgClass: 'bg-rose-800' }, // Weekly Mining Marathoner
    b_mmded: { Icon: Calendar, iconClass: 'text-rose-400', bgClass: 'bg-rose-900' }, // Monthly Mining Dedication
    b_twtm: { Icon: Trophy, iconClass: 'text-yellow-300', bgClass: 'bg-yellow-800' }, // Team's Weekly Top Miner
    b_tmmc: { Icon: Star, iconClass: 'text-yellow-200', bgClass: 'bg-yellow-700' }, // Team's Monthly Mining Champion
    b_otp: { Icon: Rabbit, iconClass: 'text-teal-300', bgClass: 'bg-teal-800' }, // Outpaced the Pack
    b_atl: { Icon: Sparkles, iconClass: 'text-violet-300', bgClass: 'bg-violet-800' }, // Active Team Leader

    // Default
    default: { Icon: Award, iconClass: 'text-slate-300', bgClass: 'bg-slate-800' },
};

const sizeClasses = {
    sm: { container: 'h-8 w-8', icon: 'h-4 w-4' },
    md: { container: 'h-12 w-12', icon: 'h-6 w-6' },
    lg: { container: 'h-16 w-16', icon: 'h-8 w-8' },
    xl: { container: 'h-24 w-24', icon: 'h-12 w-12' },
};

interface BadgeIconProps {
  badgeId: string;
  earned: boolean;
  size?: keyof typeof sizeClasses;
  className?: string;
}

export function BadgeIcon({ badgeId, earned, size = 'lg', className }: BadgeIconProps) {
  const badgeInfo = badgeIconMap[badgeId] || badgeIconMap.default;
  const { Icon, iconClass, bgClass } = badgeInfo;
  const { container: containerSizeClass, icon: iconSizeClass } = sizeClasses[size];

  if (!earned) {
    return (
      <div className={cn(
        "flex items-center justify-center rounded-lg grayscale opacity-50 transition-all",
        containerSizeClass,
        'bg-muted-foreground/20',
        className
      )}>
        <Icon className={cn(iconSizeClass, 'text-muted-foreground/60')} />
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-center rounded-lg transition-all group-hover:scale-110",
      containerSizeClass,
      bgClass,
      className
    )}>
      <Icon className={cn(iconSizeClass, iconClass)} />
    </div>
  );
}

    