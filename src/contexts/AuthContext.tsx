
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@/data/schemas';
import { AuthService, type AuthResult } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if user is already authenticated with Pi Network
        if (AuthService.isAuthenticated()) {
          console.log('✅ User already authenticated with Pi Network');
          
          // Get current user from backend (Official Demo Pattern)
          const currentUser = await AuthService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            console.log('✅ User session restored:', currentUser);
          } else {
            console.log('⚠️ No user data available, clearing session');
            await signOut();
          }
        } else {
          console.log('ℹ️ No existing Pi Network session found');
        }
      } catch (error) {
        console.error('❌ Session check failed:', error);
        setError('Failed to check existing session');
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const signIn = async () => {
    try {
      // Clear any previous errors and set loading state
      setError(null);
      setIsLoading(true);

      console.log('🚀 Starting Pi Network authentication...');
      
      const result: AuthResult = await AuthService.authenticate();
      
      if (result.success && result.user) {
        setUser(result.user);
        setError(null); // Ensure error is cleared on success
        console.log('✅ User signed in successfully:', result.user);
      } else {
        throw new Error(result.error || 'Authentication failed');
      }

    } catch (error) {
      console.error('❌ Authentication error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setError(errorMessage);
      setUser(null); // Clear user on error
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Clear Pi Network session
      await AuthService.logout();
      
      // Clear local state
      setUser(null);
      
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      // Still clear local state even if backend logout fails
      setUser(null);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (AuthService.isAuthenticated()) {
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          console.log('✅ User data refreshed:', currentUser);
        } else {
          // If no user data, user might be logged out
          setUser(null);
          console.log('⚠️ No user data found during refresh');
        }
      } else {
        setUser(null);
        console.log('ℹ️ User not authenticated during refresh');
      }
    } catch (error) {
      console.error('❌ User refresh failed:', error);
      setError('Failed to refresh user data');
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    signIn,
    signOut,
    refreshUser,
    clearError
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

