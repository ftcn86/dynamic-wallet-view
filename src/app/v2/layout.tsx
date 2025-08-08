import type { ReactNode } from 'react';
import { AppShellV2 } from '@/ui-v2/AppShellV2';

export default function Layout({ children }: { children: ReactNode }) {
  return <AppShellV2>{children}</AppShellV2>;
}


