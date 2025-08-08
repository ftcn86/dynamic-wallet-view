import type { ReactNode } from 'react';
import { AppShellV2 } from '@/ui-v2/AppShellV2';
import '@/ui-v2/styles.css';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="v2 v2-bg min-h-dvh">
      <AppShellV2>{children}</AppShellV2>
    </div>
  );
}


