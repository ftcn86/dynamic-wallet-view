
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
  const { user, signIn, isLoading: isAuthContextLoading, error } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !isAuthContextLoading) {
      router.push('/dashboard');
    }
  }, [user, isAuthContextLoading, router]);

  const handleSignIn = async () => {
    try {
      setIsLoggingIn(true);
      await signIn();
      
      toast({
        title: "Success!",
        description: "You have been signed in successfully.",
      });
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sign in",
        variant: "destructive",
      });
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
                disabled={isLoggingIn}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                size="lg"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating with Pi Network...
                  </>
                ) : (
                  'Sign in with Pi Network'
                )}
              </Button>
              
              {error && (
                <Button
                  variant="outline"
                  onClick={handleSignIn}
                  disabled={isLoggingIn}
                  className="w-full"
                >
                  Authentication timeout. Please try again.
                </Button>
              )}
            </div>
          </div>
          
          <div className="text-center pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sign in to access your Pi Network dashboard
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              By signing in, you agree to our{' '}
              <a href="/legal/terms" className="underline hover:text-purple-600">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/legal/privacy" className="underline hover:text-purple-600">
                Privacy Policy
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
