
"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import type { User } from '@/data/schemas';

interface AuthContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  isLoading: boolean;
  login: () => Promise<User | null>;
  logout: () => void;
  dataVersion: number;
  refreshData: () => void;
  error: string | null;
  status: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage key for user data
const DYNAMIC_WALLET_USER_KEY = 'dynamic-wallet-user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        // Simple check for stored user session
        const storedUserItem = localStorage.getItem(DYNAMIC_WALLET_USER_KEY);
        if (storedUserItem) {
          const storedUser = JSON.parse(storedUserItem) as User;
          setUser(storedUser);
        }
      } catch (error) {
        console.error("Error checking existing session:", error);
        localStorage.removeItem(DYNAMIC_WALLET_USER_KEY);
      } finally {
        // Complete loading state immediately
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const setUserInternal: Dispatch<SetStateAction<User | null>> = useCallback((newUserValue) => {
    setUser(currentUser => {
      const resolvedNewUser = typeof newUserValue === 'function'
        ? (newUserValue as (prevState: User | null) => User | null)(currentUser)
        : newUserValue;

      try {
        if (resolvedNewUser) {
          localStorage.setItem(DYNAMIC_WALLET_USER_KEY, JSON.stringify(resolvedNewUser));
        } else {
          localStorage.removeItem(DYNAMIC_WALLET_USER_KEY);
        }
      } catch (error) {
        console.error("Error saving user to localStorage:", error);
      }
      return resolvedNewUser;
    });
  }, []);

  const login = useCallback(async (): Promise<User | null> => {
    setIsLoading(true);
    setError(null);
    setStatus('Starting authentication...');
    
    try {
      // Check if Pi SDK is available
      if (typeof window === 'undefined' || !(window as any).Pi) {
        setStatus('Not in Pi Browser, using test mode...');
        console.log('🌐 Pi SDK not available, using mock authentication');
        
        // Fallback to mock auth for development/testing
        const mockUser: User = {
          id: 'test-user-123',
          username: 'testuser',
          name: 'Test User',
          email: 'test@example.com',
          avatar: '',
          bio: 'Test user for development',
          balance: 12345.6789,
          miningRate: 0.2512,
          isNodeOperator: true,
          balanceBreakdown: {
            transferableToMainnet: 5678.1234,
            totalUnverifiedPi: 4206.7890,
            currentlyInLockups: 3210.7665,
          },
          unverifiedPiDetails: {
            fromReferralTeam: 2000.50,
            fromSecurityCircle: 1000.2890,
            fromNodeRewards: 750.00,
            fromOtherBonuses: 456.0000,
          },
          badges: [
            {
              id: 'b001',
              name: 'Early Adopter',
              description: 'Joined Pi Network in its early stages.',
              iconUrl: 'https://placehold.co/128x128.png',
              earned: true,
              earnedDate: '2020-05-15T10:00:00Z',
              dataAiHint: "award medal"
            },
            {
              id: 'b002',
              name: 'Node Runner',
              description: 'Successfully operates a Pi Node.',
              iconUrl: 'https://placehold.co/128x128.png',
              earned: true,
              earnedDate: '2021-11-01T10:00:00Z',
              dataAiHint: "server computer"
            },
            {
              id: 'b004',
              name: 'KYC Verified',
              description: 'Successfully completed KYC verification.',
              iconUrl: 'https://placehold.co/128x128.png',
              earned: true,
              earnedDate: '2022-01-20T10:00:00Z',
              dataAiHint: "verified checkmark"
            }
          ],
          termsAccepted: true,
          settings: {
            theme: 'system',
            language: 'en',
            notifications: true,
            emailNotifications: false,
            remindersEnabled: true,
            reminderHoursBefore: 1,
          },
        };
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        setUserInternal(mockUser);
        setIsLoading(false);
        setStatus(null);
        return mockUser;
      }

      // Real Pi Network authentication following official demo pattern
      setStatus('Authenticating with Pi Network...');
      console.log('📱 Using Pi Network authentication');
      
      return new Promise((resolve, reject) => {
        const Pi = (window as any).Pi;
        const scopes = ['username', 'payments', 'wallet_address'];
        
        console.log('🚀 Calling Pi.authenticate with scopes:', scopes);
        
        // Add timeout for authentication
        const authTimeout = setTimeout(() => {
          console.error('❌ Authentication timeout after 30 seconds');
          setError('Authentication timeout. Please try again.');
          setIsLoading(false);
          reject(new Error('Authentication timeout'));
        }, 30000);
        
        // Official Pi Network demo pattern: delegate to backend
        Pi.authenticate(scopes, async (authResult: any) => {
          try {
            clearTimeout(authTimeout);
            setStatus('Processing authentication...');
            console.log('🔐 Pi authentication successful, sending to backend...');
            
            // Send auth result to backend for processing (official demo pattern)
            const response = await fetch('/api/auth/signin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ authResult })
            });
            
            if (!response.ok) {
              throw new Error(`Backend authentication failed: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success || !data.user) {
              throw new Error(data.message || 'Backend authentication failed');
            }
            
            console.log('✅ Backend authentication successful');
            setUserInternal(data.user);
            setIsLoading(false);
            setStatus(null);
            resolve(data.user);
            
          } catch (error) {
            console.error('❌ Backend authentication error:', error);
            setError(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setIsLoading(false);
            reject(error);
          }
        }, (error: any) => {
          clearTimeout(authTimeout);
          console.error('❌ Pi authentication failed:', error);
          setError(`Pi authentication failed: ${error.message || 'Unknown error'}`);
          setIsLoading(false);
          reject(error);
        });
      });
      
    } catch (error) {
      console.error('Login error:', error);
      setError(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
      throw error;
    }
  }, [setUserInternal, dataVersion]);

  const logout = useCallback(() => {
    try {
      // Clear stored user data
      localStorage.removeItem(DYNAMIC_WALLET_USER_KEY);
      
      // If Pi SDK is available, logout from Pi Network
      if (typeof window !== 'undefined' && (window as any).Pi && (window as any).Pi.logout) {
        (window as any).Pi.logout();
      }
      
      setUserInternal(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [setUserInternal]);

  const refreshData = useCallback(() => {
    setDataVersion(prev => prev + 1);
  }, []);

  // Handle incomplete payments (following official demo pattern)
  const onIncompletePaymentFound = useCallback((payment: any) => {
    console.log("onIncompletePaymentFound", payment);
    // Send to backend for handling
    fetch('/api/payments/incomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment })
    });
  }, []);

  const value: AuthContextType = {
    user,
    setUser: setUserInternal,
    isLoading,
    login,
    logout,
    dataVersion,
    refreshData,
    error,
    status,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

