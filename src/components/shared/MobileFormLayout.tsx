"use client"

import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileFormLayoutProps {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3;
  spacing?: 'sm' | 'md' | 'lg';
}

interface FormFieldProps {
  children: React.ReactNode;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

interface FormSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function MobileFormLayout({ 
  children, 
  className, 
  columns = 1,
  spacing = 'md'
}: MobileFormLayoutProps) {
  const isMobile = useIsMobile();
  
  const gridCols = isMobile ? 1 : columns;
  const spacingClasses = {
    sm: 'gap-3 sm:gap-4',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8'
  };

  return (
    <div className={cn(
      "w-full",
      `grid grid-cols-1 sm:grid-cols-${gridCols}`,
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  );
}

export function FormField({ 
  children, 
  label, 
  description, 
  error, 
  required,
  className 
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <div className="space-y-1">
        {children}
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}

export function FormSection({ 
  children, 
  title, 
  description, 
  className 
}: FormSectionProps) {
  return (
    <div className={cn("space-y-4 sm:space-y-6", className)}>
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h3 className="text-lg sm:text-xl font-semibold text-foreground">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4 sm:space-y-6">
        {children}
      </div>
    </div>
  );
}

export function FormActions({ 
  children, 
  className 
}: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "flex flex-col sm:flex-row gap-3 sm:gap-4",
      "pt-4 sm:pt-6",
      className
    )}>
      {children}
    </div>
  );
}

// Mobile-specific form utilities
export function MobileFormField({ 
  children, 
  label, 
  value, 
  className 
}: {
  children: React.ReactNode;
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col space-y-1", className)}>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span className="text-sm font-medium">{value}</span>
      {children}
    </div>
  );
} 