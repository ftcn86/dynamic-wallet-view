"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/v2', label: 'Home' },
  { href: '/v2/team', label: 'Team' },
  { href: '/v2/transactions', label: 'Txns' },
  { href: '/v2/settings', label: 'Settings' },
];

export function AppShellV2({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-3 py-3 flex items-center justify-between">
          <Link href="/v2" className="font-semibold">Dynamic Wallet V2</Link>
          <nav className="hidden md:flex gap-4">
            {nav.map((i) => (
              <Link key={i.href} href={i.href} className={cn('text-sm', pathname?.startsWith(i.href) ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>
                {i.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-7xl px-3 py-4 md:py-6">
        {children}
      </main>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <ul className="grid grid-cols-4">
          {nav.map((i) => (
            <li key={i.href} className="flex">
              <Link href={i.href} className={cn('flex-1 text-xs py-2 text-center', pathname?.startsWith(i.href) ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>{i.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="h-12 md:h-0" />
    </div>
  );
}


