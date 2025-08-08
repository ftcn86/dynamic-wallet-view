
"use client"

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Sidebar as SidebarContent } from '@/components/layout/Sidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { BottomNav } from '@/components/layout/BottomNav';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || (!isLoading && !user)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar className="hidden md:flex">
        <SidebarContent />
      </Sidebar>
      <SidebarInset>
        <Header>
          <MobileSidebar>
            <SidebarContent />
          </MobileSidebar>
        </Header>
        <main className="relative flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full min-h-0 pb-16 md:pb-0 scroll-smooth">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_200px_at_0%_-10%,hsl(var(--primary)/0.08),transparent),radial-gradient(800px_200px_at_100%_110%,hsl(var(--accent)/0.07),transparent)]" />
          <div className="relative z-10 p-2 sm:p-3 md:p-6 lg:p-8">
            <div className="w-full max-w-full min-w-0">
              {children}
            </div>
          </div>
        </main>
        <BottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
