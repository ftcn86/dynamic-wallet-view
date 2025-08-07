"use client"

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

interface NavigationProps {
  className?: string;
}

// Define the navigation structure
const NAVIGATION_PAGES = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/dashboard/team', label: 'Team' },
  { path: '/dashboard/node', label: 'Node' },
  { path: '/dashboard/transactions', label: 'Transactions' },
  { path: '/dashboard/settings', label: 'Settings' },
  { path: '/dashboard/donate', label: 'Donate' },
];

export function Navigation({ className = '' }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Find current page index
  useEffect(() => {
    const index = NAVIGATION_PAGES.findIndex(page => page.path === pathname);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [pathname]);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      router.push(NAVIGATION_PAGES[newIndex].path);
    }
  };

  const goToNext = () => {
    if (currentIndex < NAVIGATION_PAGES.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      router.push(NAVIGATION_PAGES[newIndex].path);
    }
  };

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < NAVIGATION_PAGES.length - 1;

  return (
    <div className={`flex items-center justify-between gap-2 p-2 bg-background/50 backdrop-blur-sm border-b ${className}`}>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPrevious}
          disabled={!canGoPrevious}
          className="h-8 w-8 p-0"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        
        <span className="text-sm font-medium text-muted-foreground">
          {NAVIGATION_PAGES[currentIndex]?.label || 'Unknown'}
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNext}
          disabled={!canGoNext}
          className="h-8 w-8 p-0"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-1">
        {NAVIGATION_PAGES.map((page, index) => (
          <div
            key={page.path}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex 
                ? 'bg-primary' 
                : 'bg-muted hover:bg-muted-foreground/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
