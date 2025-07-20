
"use client"

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import React from 'react';
import { SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import { useMobileFocus } from '@/hooks/use-mobile-focus';

interface SidebarNavLinkProps {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export function SidebarNavLink({ href, children, icon, disabled = false }: SidebarNavLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile, isMobile } = useSidebar();
  const { handleMobileAction } = useMobileFocus();
  const isActive = !disabled && (pathname === href || (href !== '/dashboard' && pathname.startsWith(href)));

  const handleClick = (e: React.MouseEvent) => {
    // Close mobile sidebar when a navigation link is clicked
    if (isMobile) {
      handleMobileAction(() => {
        setOpenMobile(false);
        router.push(href);
      });
    } else {
      router.push(href);
    }
  };

  if (disabled) {
    return (
        <SidebarMenuButton asChild disabled={true} tooltip={{children: "This feature is coming soon!"}}>
            <span className="w-full">
                {icon}
                <span className="truncate">{children}</span>
            </span>
        </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenuButton 
      isActive={isActive} 
      tooltip={{children}}
      onClick={handleClick}
    >
        {icon}
        <span className="truncate">{children}</span>
    </SidebarMenuButton>
  );
}
