
"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@/data/schemas';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount (following demo pattern)
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        console.log('🔍 Checking existing session...');
        // Check if user is authenticated by calling the API
        const response = await fetch('/api/user/me', {
          credentials: 'include' // Include session cookies
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            console.log('✅ Existing session found:', data.user.username);
            setUser(data.user);
          } else {
            console.log('⚠️ No valid session found');
          }
        } else {
          console.log('❌ Session check failed:', response.status);
        }
      } catch (error) {
        console.error("❌ Error checking existing session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const signIn = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🚀 Starting Pi Network authentication...');
      
      // Check if Pi SDK is available
      if (typeof window === 'undefined' || !window.Pi) {
        console.error('❌ Pi Network SDK not available');
        setError('Pi Network SDK not available. Please use Pi Browser.');
        setIsLoading(false);
        return;
      }

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Authentication timeout')), 30000); // 30 seconds
      });

      // Follow official demo pattern: use window.Pi.authenticate directly
      const scopes = ['username', 'payments', 'wallet_address'];
      console.log('🔍 Authenticating with scopes:', scopes);
      
      const authResult = await Promise.race([
        window.Pi.authenticate(scopes, onIncompletePaymentFound),
        timeoutPromise
      ]);
      
      console.log('✅ Pi Network authentication successful:', authResult);

      // Send auth result to backend for processing (following demo pattern)
      const response = await fetch('/api/auth/pi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authResult }),
        credentials: 'include' // Include session cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Authentication failed');
      }

      const data = await response.json();
      
      if (data.success && data.user) {
        setUser(data.user);
        console.log('✅ User signed in successfully:', data.user);
      } else {
        throw new Error('Invalid response from server');
      }

    } catch (error) {
      console.error('❌ Authentication error:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // Call logout endpoint to invalidate session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      setUser(null);
      setError(null);
      console.log('✅ User signed out successfully');
      
    } catch (error) {
      console.error('❌ Sign out error:', error);
      // Even if logout fails, clear local state
      setUser(null);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle incomplete payments (following demo pattern)
  const onIncompletePaymentFound = (payment: any) => {
    console.log('⚠️ Incomplete payment found:', payment);
    // Handle incomplete payment - you might want to show a modal or redirect
    // For now, just log it
  };

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

declare global {
  interface Window {
    Pi?: any;
  }
}

