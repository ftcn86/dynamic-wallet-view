
"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@/data/schemas';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getPiUserData: () => Promise<any>;
  getPiBalance: () => Promise<number | null>;
  getPiTransactions: () => Promise<any[]>;
  isPiBrowserAvailable: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPiBrowserAvailable, setIsPiBrowserAvailable] = useState(false);

  // Check for existing session on mount
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

    // Check Pi Browser availability
    if (typeof window !== 'undefined' && window.Pi) {
      setIsPiBrowserAvailable(true);
      console.log('✅ Pi Browser detected');
    } else {
      console.log('⚠️ Pi Browser not available');
    }

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

      // Use Pi SDK for authentication (pure user app pattern)
      const scopes = ['username', 'payments', 'wallet_address'];
      console.log('🔍 Authenticating with scopes:', scopes);
      
      const authResult = await Promise.race([
        window.Pi.authenticate(scopes, onIncompletePaymentFound),
        timeoutPromise
      ]);
      
      console.log('✅ Pi Network authentication successful:', authResult);

      // Send auth result to backend for basic profile storage
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
      console.log('🚪 Signing out...');
      
      // Clear session on backend
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Clear local state
      setUser(null);
      setError(null);
      
      console.log('✅ Sign out completed');
    } catch (error) {
      console.error('❌ Sign out error:', error);
    }
  };

  // Get real-time Pi Network user data from SDK
  const getPiUserData = async () => {
    try {
      if (typeof window === 'undefined' || !window.Pi) {
        throw new Error('Pi Network SDK not available');
      }

      const currentUser = window.Pi.currentUser();
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      return currentUser;
    } catch (error) {
      console.error('❌ Error getting Pi user data:', error);
      throw error;
    }
  };

  // Get real-time balance from Pi SDK
  const getPiBalance = async (): Promise<number | null> => {
    try {
      if (typeof window === 'undefined' || !window.Pi) {
        return null;
      }

      const currentUser = window.Pi.currentUser();
      if (!currentUser) {
        return null;
      }

      // Try to get balance from current user
      if (currentUser.balance) {
        return currentUser.balance;
      }

      // If not available, return null (will be handled by UI)
      return null;
    } catch (error) {
      console.error('❌ Error getting Pi balance:', error);
      return null;
    }
  };

  // Get transactions from Pi SDK
  const getPiTransactions = async (): Promise<any[]> => {
    try {
      if (typeof window === 'undefined' || !window.Pi) {
        return [];
      }

      // Pi SDK doesn't provide direct transaction access
      // This would need to be implemented based on available SDK methods
      return [];
    } catch (error) {
      console.error('❌ Error getting Pi transactions:', error);
      return [];
    }
  };

  const onIncompletePaymentFound = (payment: any) => {
    console.log('💰 Incomplete payment found:', payment);
    // Handle incomplete payment
  };

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    signIn,
    signOut,
    getPiUserData,
    getPiBalance,
    getPiTransactions,
    isPiBrowserAvailable,
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

// Global type declaration for Pi Network SDK
declare global {
  interface Window {
    Pi?: any;
  }
}

