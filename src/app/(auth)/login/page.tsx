
"use client"

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function LoginPage() {
  const { user, login, isLoading: isAuthContextLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!isAuthContextLoading && user) {
      // All users now have terms accepted, go directly to dashboard
      router.replace('/dashboard');
    }
  }, [user, isAuthContextLoading, router]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    
    try {
      const loggedInUser = await login();
      
      if (loggedInUser) {
        // All users now have terms accepted, go directly to dashboard
        router.push('/dashboard');
      } else {
        toast({
          title: "Authentication failed",
          description: "Could not authenticate with Pi Network. Please try again.",
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Authentication error",
        description: error instanceof Error ? error.message : "An unexpected error occurred during authentication.",
        variant: 'destructive',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  if (isAuthContextLoading || (!isAuthContextLoading && user)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* App Logo and Title */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative h-16 w-16">
            <Image
              src="/logo.png"
              alt="Dynamic Wallet View Logo"
              fill
              sizes="64px"
              className="object-contain"
              priority
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Dynamic Wallet View</h1>
            <p className="text-muted-foreground">
              Your comprehensive Pi Network dashboard
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your Pi Network account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Authentication will be handled automatically by Pi SDK */}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleLogin} 
              disabled={isLoggingIn}
              className="w-full"
            >
              {isLoggingIn ? (
                <>
                  <LoadingSpinner size={16} className="mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign in with Pi Network'
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Environment Info */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>
            Sign in to access your Pi Network dashboard
          </p>
        </div>

        {/* Legal Links */}
        <div className="text-center text-xs text-muted-foreground">
          <p>
            By signing in, you agree to our{' '}
            <a href="/legal/terms" className="underline hover:text-primary">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/legal/privacy" className="underline hover:text-primary">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
