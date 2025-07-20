"use client"

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './LoadingSpinner';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  dataAiHint?: string;
  priority?: boolean;
  fallbackSrc?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  dataAiHint,
  priority = false,
  fallbackSrc = '/logo.png'
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleError = () => {
    if (!hasError && fallbackSrc !== currentSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(true);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={cn("relative", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 rounded-md">
          <LoadingSpinner size={Math.min(width, height) / 3} />
        </div>
      )}
      <Image
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          "transition-opacity duration-200",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        data-ai-hint={dataAiHint}
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
} 