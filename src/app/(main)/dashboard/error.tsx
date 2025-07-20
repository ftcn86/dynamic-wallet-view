
"use client";

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangleIcon } from '@/components/shared/icons';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-col items-center justify-center p-3 sm:p-4">
      <Card className="w-full max-w-sm sm:max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangleIcon width={28} height={28} className="sm:w-9 sm:h-9" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-headline">Something Went Wrong</CardTitle>
          <CardDescription className="text-sm sm:text-base">We encountered an issue while loading this part of the dashboard. Please try again.</CardDescription>
        </CardHeader>
        <CardContent>
          {error?.message && (
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              Error details: {error.message}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={() => reset()} className="w-full text-xs sm:text-sm">
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
