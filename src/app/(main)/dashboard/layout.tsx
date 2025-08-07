
"use client"

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Sidebar as SidebarContent } from '@/components/layout/Sidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { Navigation } from '@/components/shared/Navigation';

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
            {/* Navigation Component */}
            <Navigation />
            {/* FIXED: Improved mobile layout with better padding and overflow handling */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3 md:p-4 lg:p-6 w-full max-w-full min-h-0">
              <div className="w-full max-w-full min-w-0 pb-4 sm:pb-6">
                {children}
              </div>
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
