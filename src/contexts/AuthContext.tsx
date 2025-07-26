
"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import type { User, UserSettings } from '@/data/schemas';
import { authenticateWithPi, getPiSDKInstance } from '@/lib/pi-network';

// Import the conversion function
function convertPiUserToAppUser(piUser: any, authResult?: any): User {
  const name = piUser.profile 
    ? `${piUser.profile.firstname || ''} ${piUser.profile.lastname || ''}`.trim() || piUser.username
    : piUser.username;

  return {
    id: piUser.uid,
    username: piUser.username,
    name: name,
    email: piUser.profile?.email || '',
    walletAddress: piUser.wallet_address || '',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${piUser.username}`,
    balance: 0, // Will be fetched separately
    miningRate: 0, // Will be fetched separately
    teamSize: 0, // Will be fetched separately
    isNodeOperator: piUser.roles?.some((role: string) => 
      ['node_operator', 'validator', 'super_node', 'node'].includes(role)
    ) || false,
    kycStatus: 'verified', // Default for Pi Network users
    joinDate: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    settings: {
      theme: 'system',
      language: 'en',
      notifications: true,
      emailNotifications: false,
    },
    // Activity metrics (will be calculated by backend)
    userActiveMiningHours_LastWeek: 0,
    userActiveMiningHours_LastMonth: 0,
    activeMiningDays_LastWeek: 0,
    activeMiningDays_LastMonth: 0,
  };
}

interface AuthContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  isLoading: boolean;
  login: () => Promise<User | null>;
  logout: () => void;
  // A simple mechanism to trigger data refetches in components
  dataVersion: number;
  refreshData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Enhanced user comparison to allow updates
const areUsersEqual = (userA: User | null, userB: User | null): boolean => {
  if (!userA && !userB) return true;
  if (!userA || !userB) return false;
  
  // Compare all relevant properties for updates
  return JSON.stringify({
    id: userA.id,
    termsAccepted: userA.termsAccepted,
    settings: userA.settings,
    name: userA.name,
    bio: userA.bio,
    avatar: userA.avatar
  }) === JSON.stringify({
    id: userB.id,
    termsAccepted: userB.termsAccepted,
    settings: userB.settings,
    name: userB.name,
    bio: userB.bio,
    avatar: userB.avatar
  });
};

// Storage key for user data
const DYNAMIC_WALLET_USER_KEY = 'dynamic-wallet-user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        // Check if we're in Pi Browser environment
        const isPiBrowser = typeof window !== 'undefined' && 
          (window as any).Pi && 
          (window as any).Pi.authenticate && 
          typeof (window as any).Pi.authenticate === 'function';

            // Check if we should use real authentication
    // Pi Browser can be detected by checking for Pi SDK availability and user agent
    const isPiBrowserEnvironment = isPiBrowser && (
      window.location.hostname.includes('minepi.com') ||
      window.location.hostname.includes('sandbox.minepi.com') ||
      window.navigator.userAgent.includes('PiBrowser') ||
      window.navigator.userAgent.includes('Pi Network')
    );
    
    const shouldUseRealAuth = isPiBrowserEnvironment;

        if (shouldUseRealAuth) {
          // Check if user is already authenticated with Pi SDK (only in Pi Browser)
          const sdk = getPiSDKInstance();
          if (sdk.isAuthenticated()) {
            const currentUser = sdk.currentUser();
            if (currentUser) {
              const appUser = await authenticateWithPi();
              if (appUser) {
                // Fetch real user data from our API
                try {
                  const response = await fetch('/api/user/me', {
                    headers: {
                      'Authorization': `Bearer ${appUser.accessToken || 'mock-token'}`,
                    },
                  });
                  
                  if (response.ok) {
                    const userData = await response.json();
                    if (userData.success && userData.user) {
                      // Use real data from API
                      const userWithTermsAccepted = { ...userData.user, termsAccepted: true };
                      setUser(userWithTermsAccepted);
                      localStorage.setItem(DYNAMIC_WALLET_USER_KEY, JSON.stringify(userWithTermsAccepted));
                    } else {
                      // Fallback to SDK data
                      const userWithTermsAccepted = { ...appUser, termsAccepted: true };
                      setUser(userWithTermsAccepted);
                      localStorage.setItem(DYNAMIC_WALLET_USER_KEY, JSON.stringify(userWithTermsAccepted));
                    }
                  } else {
                    // Fallback to SDK data
                    const userWithTermsAccepted = { ...appUser, termsAccepted: true };
                    setUser(userWithTermsAccepted);
                    localStorage.setItem(DYNAMIC_WALLET_USER_KEY, JSON.stringify(userWithTermsAccepted));
                  }
                } catch (apiError) {
                  console.error("Error fetching user data from API:", apiError);
                  // Fallback to SDK data
                  const userWithTermsAccepted = { ...appUser, termsAccepted: true };
                  setUser(userWithTermsAccepted);
                  localStorage.setItem(DYNAMIC_WALLET_USER_KEY, JSON.stringify(userWithTermsAccepted));
                }
              }
            }
          }
        } else {
          // Not in Pi Browser - check for stored mock user
          console.log('🖥️ Regular browser: Checking for stored mock user session');
          const storedUserItem = localStorage.getItem(DYNAMIC_WALLET_USER_KEY);
          if (storedUserItem) {
            const storedUser = JSON.parse(storedUserItem) as User;
            if (storedUser.accessToken === 'mock-token') {
              console.log('✅ Found stored mock user session');
              setUser(storedUser);
            }
          }
        }
      } catch (error) {
        console.error("Error checking existing session:", error);
        localStorage.removeItem(DYNAMIC_WALLET_USER_KEY);
      } finally {
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

      if (!areUsersEqual(currentUser, resolvedNewUser)) {
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
      }
      return currentUser;
    });
  }, []);

  const login = useCallback(async (): Promise<User | null> => {
    setIsLoading(true);
    try {
      // Check if we're in Pi Browser environment
      const isPiBrowser = typeof window !== 'undefined' && 
        (window as any).Pi && 
        (window as any).Pi.authenticate && 
        typeof (window as any).Pi.authenticate === 'function';

      // Check if we should use real authentication
      // Pi Browser can be detected by checking for Pi SDK availability and user agent
      const isPiBrowserEnvironment = isPiBrowser && (
        window.location.hostname.includes('minepi.com') ||
        window.location.hostname.includes('sandbox.minepi.com') ||
        window.navigator.userAgent.includes('PiBrowser') ||
        window.navigator.userAgent.includes('Pi Network')
      );
      
      const shouldUseRealAuth = isPiBrowserEnvironment;

      if (shouldUseRealAuth) {
        // Use real Pi Network authentication (only in Pi Browser)
        console.log('🌐 Pi Browser detected: Using real Pi Network authentication');
        console.log('🔍 Environment details:', {
          hostname: window.location.hostname,
          userAgent: window.navigator.userAgent,
          isPiBrowser: isPiBrowser,
          isPiBrowserEnvironment: isPiBrowserEnvironment
        });
        
        const sdk = getPiSDKInstance();
        
        // Check if user is already authenticated
        if (sdk.isAuthenticated()) {
          console.log('✅ User already authenticated, getting current user data');
          const currentUser = sdk.currentUser();
          if (currentUser) {
            const appUser = convertPiUserToAppUser(currentUser);
            const userWithTermsAccepted = { ...appUser, termsAccepted: true };
            setUserInternal(userWithTermsAccepted);
            return userWithTermsAccepted;
          }
        }
        
        // Only authenticate if not already authenticated
        console.log('🔍 User not authenticated, starting authentication...');
        const authenticatedUser = await authenticateWithPi();
        
        if (!authenticatedUser) {
          throw new Error('Authentication failed - no user returned');
        }

        // Fetch real user data from our API
        try {
          const response = await fetch('/api/user/me', {
            headers: {
              'Authorization': `Bearer ${authenticatedUser.accessToken || 'mock-token'}`,
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            if (userData.success && userData.user) {
              // Use real data from API
              const userWithTermsAccepted = { ...userData.user, termsAccepted: true };
              setUserInternal(userWithTermsAccepted);
              return userWithTermsAccepted;
            }
          }
        } catch (apiError) {
          console.error("Error fetching user data from API:", apiError);
        }

        // Fallback to SDK data
        const userWithTermsAccepted = { ...authenticatedUser, termsAccepted: true };
        setUserInternal(userWithTermsAccepted);
        return userWithTermsAccepted;
      } else {
        // Not in Pi Browser - use mock authentication for development
        console.log('🖥️ Regular browser detected: Using mock authentication for development');
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
          termsAccepted: true, // Auto-accept terms for mock users too
          settings: {
            theme: 'system',
            language: 'en',
            notifications: true,
            emailNotifications: false,
            remindersEnabled: true,
            reminderHoursBefore: 1,
          },
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh',
          tokenExpiresAt: Date.now() + 3600000,
        };

        setUserInternal(mockUser);
        return mockUser;
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setUserInternal]);

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

  const value: AuthContextType = {
    user,
    setUser: setUserInternal,
    isLoading,
    login,
    logout,
    dataVersion,
    refreshData,
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

