
"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import type { User } from '@/data/schemas';

export default function LoginPage() {
  const { user, signIn, isLoading: isAuthContextLoading, error, clearError } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-2 sm:p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-3 sm:pb-4">
          <div className="mx-auto mb-3 sm:mb-4 flex justify-center">
            <Image
              src="/logo.png"
              alt="Pi Network"
              width={80}
              height={80}
              className="rounded-full"
              priority
            />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold">Dynamic Wallet View</CardTitle>
          <CardDescription>
            Your comprehensive Pi Network dashboard
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3 sm:space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="text-center space-y-3 sm:space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Welcome Back</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Sign in to your Pi Network account to continue
              </p>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={handleSignIn}
                disabled={isLoggingIn || isAuthContextLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
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
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Authentication timeout. Please try again.
                </div>
              )}
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>Sign in to access your Pi Network dashboard</p>
            <p>
              By signing in, you agree to our{' '}
              <a href="/legal/terms" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/legal/privacy" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                Privacy Policy
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
