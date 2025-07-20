"use client"

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './LoadingSpinner';

interface LazyLoadProps {
  children: ReactNode;
  className?: string;
  threshold?: number;
  placeholder?: ReactNode;
  height?: string;
}

export function LazyLoad({
  children,
  className,
  threshold = 0.1,
  placeholder,
  height = "auto"
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div
      ref={ref}
      className={cn("min-h-[100px]", className)}
      style={{ minHeight: height }}
    >
      {!isVisible ? (
        placeholder || (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size={32} />
          </div>
        )
      ) : (
        <div
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={handleLoad}
        >
          {children}
        </div>
      )}
    </div>
  );
} 