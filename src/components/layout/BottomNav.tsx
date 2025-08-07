"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  GaugeIconDashboard as GaugeIcon,
  UsersIcon,
  CoinsIcon,
  SettingsIcon
} from '@/components/shared/icons';

const items = [
  { href: '/dashboard', label: 'Home', Icon: GaugeIcon },
  { href: '/dashboard/team', label: 'Team', Icon: UsersIcon },
  { href: '/dashboard/transactions', label: 'Txns', Icon: CoinsIcon },
  { href: '/dashboard/settings', label: 'Settings', Icon: SettingsIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <ul className="grid grid-cols-4">
        {items.map(({ href, label, Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <li key={href} className="flex">
              <Link
                href={href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-2 text-xs gap-1 outline-none',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
              >
                <Icon className={cn('h-5 w-5', active && 'scale-110')} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}


