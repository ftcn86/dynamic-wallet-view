
"use client"

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Sidebar as SidebarContent } from '@/components/layout/Sidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';

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
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-full">
              <div className="w-full max-w-full min-w-0">
                {children}
              </div>
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
