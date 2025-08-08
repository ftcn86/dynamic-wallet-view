
"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoBanner } from '@/components/shared/InfoBanner';
import { Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import type { User } from '@/data/schemas';
import { useViewport } from '@/contexts/ViewportContext';

export default function LoginPage() {
  const { user, signIn, isLoading: isAuthContextLoading, error, clearError } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { isMobile } = useViewport();

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !isAuthContextLoading && !error) {
      router.push('/dashboard');
    }
  }, [user, isAuthContextLoading, error, router]);

  // Clear error when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSignIn = async () => {
    try {
      setIsLoggingIn(true);
      clearError(); // Clear any previous errors
      
      await signIn();
      
      // Only show success if no error occurred
      if (!error) {
        toast({
          title: "Success!",
          description: "You have been signed in successfully.",
        });
        
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      // Don't show toast here as the error is already handled in AuthContext
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isAuthContextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-3 sm:p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_200px_at_0%_-10%,hsl(var(--primary)/0.08),transparent),radial-gradient(900px_200px_at_100%_110%,hsl(var(--accent)/0.07),transparent)]" />
      <Card className="relative z-10 w-full max-w-md bg-card/80 backdrop-blur-xl border border-border/60 shadow-2xl">
        <CardHeader className="text-center pb-3 sm:pb-4">
          <div className="mx-auto mb-3 sm:mb-4 flex justify-center">
            <Image
              src="/logo.png"
              alt="Dynamic Wallet View"
              width={isMobile ? 64 : 80}
              height={isMobile ? 64 : 80}
              className="rounded-xl shadow"
              priority
            />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-semibold">Dynamic Wallet View</CardTitle>
          <CardDescription className="text-muted-foreground">
            Your comprehensive Pi Network dashboard
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <InfoBanner variant="destructive" title={error} />
          )}
          
          <div className="text-center space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-medium mb-1">Welcome Back</h3>
              <p className="text-sm text-muted-foreground">
                Sign in to your Pi Network account to continue
              </p>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={handleSignIn}
                disabled={isLoggingIn || isAuthContextLoading}
                className="w-full"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in with Pi Network'
                )}
              </Button>
              
              {error && (
                <div className="text-sm text-muted-foreground">
                  Authentication timeout. Please try again.
                </div>
              )}
            </div>
          </div>
          
          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>Sign in to access your Pi Network dashboard</p>
            <p>
              By signing in, you agree to our{' '}
              <a href="/legal/terms" className="underline hover:text-foreground">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/legal/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
