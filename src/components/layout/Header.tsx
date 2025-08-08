
"use client"

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getNotifications } from '@/services/piService';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/services/notificationService';
import type { Notification, NotificationType } from '@/data/schemas';
import type { User } from '@/data/schemas';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { formatDistanceToNowStrict } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { 
    BellIcon,
    LogOutIcon,
    AwardIcon,
    UsersIcon,
    SettingsIcon,
    MessageSquareIcon,
    UserCircleIcon,
    CheckCheck,
} from '@/components/shared/icons';
import { RefreshCwIcon } from 'lucide-react';
import ShareButton from '@/components/dashboard/ShareButton';
import { useViewport } from '@/contexts/ViewportContext';


const notificationIcons: Record<NotificationType, React.ElementType> = {
    node_update: SettingsIcon,
    badge_earned: AwardIcon,
    team_update: UsersIcon,
    announcement: BellIcon,
    team_message: MessageSquareIcon,
};

const notificationColors: Record<NotificationType, string> = {
    node_update: 'text-yellow-500',
    badge_earned: 'text-blue-500',
    team_update: 'text-green-500',
    announcement: 'text-primary',
    team_message: 'text-fuchsia-500',
};


function NotificationsDropdown() {
    const { user } = useAuth(); // Data changes handled by session-based authentication
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchNotifications() {
            if (user) {
                setIsLoading(true);
                setError(null);
                try {
                  const fetchedNotifications = await getNotifications();
                  setNotifications(fetchedNotifications);
                } catch (err) {
                  setError('Failed to fetch notifications.');
                }
                setIsLoading(false);
            }
        }
        fetchNotifications();
    }, [user]); // Re-fetch when user changes

    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
    
    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            try {
              await markNotificationAsRead(notification.id);
              // (refreshData as () => void)(); // Trigger a global refresh - REMOVED
            } catch (err) {
              setError('Failed to mark notification as read.');
            }
        }
        if (notification.link) {
            router.push(notification.link);
        }
    }

    const handleMarkAllRead = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent the dropdown from closing
        try {
          await markAllNotificationsAsRead();
          // (refreshData as () => void)(); // Trigger a global refresh - REMOVED
        } catch (err) {
          setError('Failed to mark all notifications as read.');
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
                    <BellIcon className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute top-1.5 right-1.5 h-5 w-5 p-0 flex items-center justify-center text-xs">
                           {unreadCount}
                        </Badge>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 md:w-96" align="end">
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notifications</span>
                    {unreadCount > 0 && <Badge variant="secondary">{unreadCount} New</Badge>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isLoading ? (
                    <div className="p-2 space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto">
                    {notifications.map(notification => {
                        const Icon = notificationIcons[notification.type];
                        const iconColor = notificationColors[notification.type];
                        return (
                             <DropdownMenuItem
                                key={notification.id}
                                className="flex items-start gap-3 cursor-pointer"
                                onSelect={() => handleNotificationClick(notification)}
                             >
                                {!notification.read && <span className="h-2 w-2 rounded-full bg-primary mt-2.5 shrink-0" />}
                                <div className={cn("mt-1.5 shrink-0", notification.read && "ml-4")}>
                                    <Icon className={cn("h-5 w-5", iconColor)} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{notification.title}</p>
                                    <p className="text-xs text-muted-foreground">{notification.description}</p>
                                    <p className="text-xs text-muted-foreground/80 mt-1">
                                        {formatDistanceToNowStrict(new Date(notification.date), { addSuffix: true })}
                                    </p>
                                </div>
                            </DropdownMenuItem>
                        )
                    })}
                    </div>
                ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        You&apos;re all caught up!
                    </div>
                )}
                {unreadCount > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="p-0">
                           <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-center"
                                onClick={handleMarkAllRead}
                            >
                                <CheckCheck className="mr-2 h-4 w-4" />
                                Mark all as read
                            </Button>
                        </DropdownMenuItem>
                    </>
                )}
                {error && (
                  <div className="p-2 text-red-500 text-xs">{error}</div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export function Header({children}: {children?: React.ReactNode}) {
  const { user: rawUser, signOut } = useAuth();
  const user = rawUser as User | null;
  const router = useRouter();
  const { isMobile } = useViewport();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const handleRefresh = () => {
    // Soft refresh: refetch key data endpoints without signing the user out
    try {
      fetch('/api/user/me', { credentials: 'include' }).finally(() => {
        // As a fallback, do a client reload that preserves session via cookie
        window.location.reload();
      });
    } catch {
      window.location.reload();
    }
  };

  const avatarFallback = user ? (user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?') : '';

  return (
    <header
      className={
        "sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur-xl px-3 sm:px-4 md:px-6 lg:px-8 flex items-center justify-between " +
        (isMobile ? "h-14" : "h-16 sm:h-20")
      }
    >
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-primary/40 via-accent/30 to-transparent" />
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        {children}
        {!user ? (
            <div className="flex flex-col gap-2 min-w-0 flex-1">
                <Skeleton className="h-6 w-32 sm:w-48" />
                <Skeleton className="h-4 w-40 sm:w-64" />
            </div>
        ) : (
            <div className="flex flex-col min-w-0 flex-1">
                <h1 className="text-base sm:text-lg lg:text-xl font-semibold truncate">
                    Welcome back, {user.name}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    Manage your Pi Network wallet
                </p>
            </div>
        )}
      </div>

      {!user ? (
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
      ) : (
        <div className="flex items-center gap-2">
          {/* Compact header: notifications + refresh on all; avatar menu only on desktop/tablet */}
          <NotificationsDropdown />
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={handleRefresh}>
            <RefreshCwIcon className="h-5 w-5" />
            <span className="sr-only">Refresh Data</span>
          </Button>
          {!isMobile && (
            <AlertDialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person face" />
                      <AvatarFallback>{avatarFallback}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">@{user.username}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                    <UserCircleIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <LogOutIcon className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                </DropdownMenuContent>
              </DropdownMenu>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to log out? You will need to re-authenticate to log back in.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </header>
  );
}
