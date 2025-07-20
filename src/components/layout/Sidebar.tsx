
"use client"

import Link from 'next/link';
import {
  Sidebar as RootSidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarNavLink } from './SidebarNavLink';
import { cn } from '@/lib/utils';
import { PI_TEAM_CHAT_URL } from '@/lib/constants';
import { useMobileFocus } from '@/hooks/use-mobile-focus';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Image from 'next/image';
import {
    HomeIcon,
    UsersIcon,
    SettingsIcon,
    MessageSquareIcon,
    GiftIcon,
    HelpCircleIcon,
    CoinsIcon,
    NetworkIcon,
} from '@/components/shared/icons';


export function Sidebar() {
  const { user } = useAuth();
  const { state, setOpenMobile, isMobile } = useSidebar();
  const { handleMobileAction } = useMobileFocus();

  const handleOpenChat = () => {
    window.open(PI_TEAM_CHAT_URL, '_blank');
    // Close mobile sidebar when team chat is opened
    if (isMobile) {
      handleMobileAction(() => {
        setOpenMobile(false);
      });
    }
  };

  if (!user) return null;

  return (
    <RootSidebar>
        <SidebarHeader>
            <Link 
                href="/dashboard" 
                className={cn(
                    "flex items-center justify-center",
                    state === 'collapsed' ? 'justify-center' : 'justify-start'
                )}
                onClick={() => isMobile && setOpenMobile(false)}
            >
                <Image
                    src="/logo.png"
                    alt="Dynamic Wallet View"
                    width={32}
                    height={32}
                    className="h-8 w-8 shrink-0 rounded-lg"
                    data-ai-hint="logo brand"
                />
            </Link>
        </SidebarHeader>

        <SidebarContent>
            <SidebarMenu>
                <p className={cn(
                    "px-4 py-2 text-xs font-semibold uppercase text-muted-foreground/80 transition-opacity duration-200",
                    state === 'collapsed' ? 'text-center' : ''
                )}>
                    {state === 'collapsed' ? 'M' : 'Menu'}
                </p>
                <SidebarMenuItem>
                    <SidebarNavLink href="/dashboard" icon={<HomeIcon />}>
                        Dashboard
                    </SidebarNavLink>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarNavLink href="/dashboard/team" icon={<UsersIcon />}>
                        Team Insights
                    </SidebarNavLink>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarNavLink href="/dashboard/node" icon={<NetworkIcon />}>
                        Node Analysis
                    </SidebarNavLink>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarNavLink href="/dashboard/transactions" icon={<CoinsIcon />}>
                        Transactions
                    </SidebarNavLink>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarNavLink href="/dashboard/donate" icon={<GiftIcon />}>
                        Donate
                    </SidebarNavLink>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarNavLink href="/dashboard/settings" icon={<SettingsIcon />}>
                        Settings
                    </SidebarNavLink>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <SidebarMenuButton tooltip="Team Chat" className="w-full justify-start">
                                <MessageSquareIcon />
                                <span className={cn(state === 'collapsed' && 'hidden')}>Team Chat</span>
                            </SidebarMenuButton>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Open Team Chat?</AlertDialogTitle>
                            <AlertDialogDescription>
                                You are about to be redirected to an external chat application. Do you want to continue?
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleOpenChat}>Open Chat</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarNavLink href="/legal/help" icon={<HelpCircleIcon />}>
                        Help Center
                    </SidebarNavLink>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
            <div className={cn(
                "text-xs text-muted-foreground space-y-1 transition-opacity duration-200",
                state === 'collapsed' ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'
            )}>
                <p>
                    <Link 
                        href="/legal/terms" 
                        className="hover:text-primary"
                        onClick={() => isMobile && setOpenMobile(false)}
                    >
                        Terms
                    </Link> · 
                    <Link 
                        href="/legal/privacy" 
                        className="hover:text-primary"
                        onClick={() => isMobile && setOpenMobile(false)}
                    >
                        Privacy
                    </Link>
                </p>
                <p>Licensed under PIOS · Not an official Pi App</p>
            </div>
        </SidebarFooter>
    </RootSidebar>
  );
}
