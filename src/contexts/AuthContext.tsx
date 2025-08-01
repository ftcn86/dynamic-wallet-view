
"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import type { User } from '@/data/schemas';

// Define the structure of the Pi SDK object available on window
interface PiSDK {
  authenticate: (scopes: string[], onIncompletePaymentFound: (payment: Payment) => void) => Promise<AuthResult>;
  logout: () => void;
  // Add other Pi SDK methods if they are used
}

// Define the structure of the authentication result from Pi.authenticate
interface AuthResult {
  accessToken: string;
  user: {
    uid: string;
    username: string;
    wallet_address?: string;
    profile?: {
      email?: string;
      // Add other profile fields if they are used
    };
    // Add other user fields if they are used
  };
  expiresAt: number;
  // Add other authResult fields if they are used
}

// Minimal Payment interface to satisfy type checks
interface Payment {
  identifier?: string;
  amount?: number;
  status?: string;
  memo?: string;
  created_at?: string;
}

export type AuthContextType = Record<string, unknown>;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        // Check if user data exists in localStorage
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user');
          const authTimestamp = localStorage.getItem('auth-timestamp');
          
          if (storedUser && authTimestamp) {
            const user = JSON.parse(storedUser);
            const timestamp = parseInt(authTimestamp);
            const now = Date.now();
            
            // Check if session is still valid (24 hours)
            if (now - timestamp < 24 * 60 * 60 * 1000) {
              setUser(user);
              setIsLoading(false);
              return;
            } else {
              // Session expired, clear storage
              localStorage.removeItem('user');
              localStorage.removeItem('auth-timestamp');
            }
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking existing session:", error);
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

      return resolvedNewUser;
    });
  }, []);

  // Handle incomplete payments (following official demo pattern)
  const handleIncompletePayment = useCallback((payment: Payment) => {
    console.log("🔄 Incomplete payment found:", payment);
    // Send to backend for handling
    fetch('/api/payments/incomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment })
    }).catch(console.error);
  }, []);

  const login = useCallback(async (): Promise<User | null> => {
    setIsLoading(true);
    setError(null);
    setStatus('Starting authentication...');
    
    try {
      // Improved Pi Browser detection - focus on Pi SDK availability
      const hasPiSDK = typeof window !== 'undefined' && 
                       (window as Window & typeof globalThis & { Pi: PiSDK }).Pi && 
                       typeof (window as Window & typeof globalThis & { Pi: PiSDK }).Pi.authenticate === 'function';
      
      // Log detection details for debugging
      console.log('🔍 Pi Browser Detection:', {
        hasPiSDK,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
        windowPi: typeof window !== 'undefined' ? !!(window as Window & typeof globalThis & { Pi: PiSDK }).Pi : false,
        piAuthenticate: typeof window !== 'undefined' && (window as Window & typeof globalThis & { Pi: PiSDK }).Pi ? 
          typeof (window as Window & typeof globalThis & { Pi: PiSDK }).Pi.authenticate === 'function' : false
      });
      
      if (!hasPiSDK) {
        setStatus('Pi SDK not available, using test mode...');
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
          walletAddress: '',
          teamSize: 0,
          kycStatus: 'verified' as const,
          joinDate: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          userActiveMiningHours_LastWeek: 0,
          userActiveMiningHours_LastMonth: 0,
          activeMiningDays_LastWeek: 0,
          activeMiningDays_LastMonth: 0,
          accessToken: '',
          refreshToken: '',
          tokenExpiresAt: 0,
        };
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        setUserInternal(mockUser);
        setIsLoading(false);
        setStatus(null);
        return mockUser;
      }

      // Real Pi Network authentication - Pi SDK is available
      setStatus('Authenticating with Pi Network...');
      console.log('📱 Using Pi Network authentication - Pi SDK detected');
      
      return new Promise((resolve, reject) => {
        const Pi = ((window as unknown) as { Pi: PiSDK }).Pi;
        // Use simpler scopes as per official Pi SDK docs
        const scopes = ['payments', 'username'];
        
        console.log('🚀 Calling Pi.authenticate with scopes:', scopes);
        
        // Add timeout for authentication (reduced to 20 seconds)
        const authTimeout = setTimeout(() => {
          console.error('❌ Authentication timeout after 20 seconds');
          setError('Authentication timeout. Please try again.');
          setIsLoading(false);
          reject(new Error('Authentication timeout'));
        }, 20000);
        
        try {
          // Use the official Pi.authenticate pattern with promise
          Pi.authenticate(scopes, handleIncompletePayment) // Use the dedicated handler
            .then(async (authResult: AuthResult) => { // Use AuthResult interface
              try {
                clearTimeout(authTimeout);
                setStatus('Processing authentication...');
                console.log('🔐 Pi authentication successful, sending to backend...', {
                  hasAuthResult: !!authResult,
                  hasAccessToken: !!authResult?.accessToken,
                  hasUser: !!authResult?.user
                });
                
                // Send auth result to backend for processing (official demo pattern)
                const response = await fetch('/api/auth/pi', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ authResult }),
                  credentials: 'include' // Include session cookies
                });
                
                if (!response.ok) {
                  const errorText = await response.text();
                  console.error('Backend response error:', errorText);
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
                clearTimeout(authTimeout);
                console.error('❌ Backend authentication error:', error);
                setError(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                setIsLoading(false);
                reject(error);
              }
            })
            .catch((error: Error) => { // Use Error type for caught errors
              clearTimeout(authTimeout);
              console.error('❌ Pi authentication failed:', error);
              setError(`Pi authentication failed: ${error?.message || 'Unknown error'}`);
              setIsLoading(false);
              reject(error);
            });
            
        } catch (error) {
          clearTimeout(authTimeout);
          console.error('❌ Error calling Pi.authenticate:', error);
          setError(`Failed to start authentication: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setIsLoading(false);
          reject(error);
        }
      });
      
    } catch (error) {
      console.error('Login error:', error);
      setError(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
      throw error;
    }
  }, [setUserInternal, handleIncompletePayment]); 

  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to invalidate session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // If Pi SDK is available, logout from Pi Network
      if (typeof window !== 'undefined' && (window as Window & typeof globalThis & { Pi: PiSDK }).Pi && typeof (window as Window & typeof globalThis & { Pi: PiSDK }).Pi.logout === 'function') {
        (window as Window & typeof globalThis & { Pi: PiSDK }).Pi.logout(); // Cast to PiSDK
      }
      
      setUserInternal(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user state even if logout fails
      setUserInternal(null);
    }
  }, [setUserInternal]);

  const refreshData = useCallback(() => {
    setDataVersion(prev => prev + 1);
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

