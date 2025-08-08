'use client';

import type { User } from '@/data/schemas';
import { getPiSDKInstance } from '@/lib/pi-network';

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export class AuthService {
  private static readonly REQUIRED_SCOPES = ['username', 'payments', 'wallet_address'];

  /**
   * Authenticate with Pi Network following OFFICIAL demo pattern
   */
  static async authenticate(): Promise<AuthResult> {
    try {
      console.log('🚀 Starting Pi Network authentication...');

      const sdk = getPiSDKInstance();
      if (!sdk) {
        return {
          success: false,
          error: 'Pi Network SDK not available. Please use Pi Browser.'
        };
      }

      // Use official authentication pattern (exactly like demo)
      const authResult = await sdk.authenticate(this.REQUIRED_SCOPES, this.handleIncompletePayment);
      
      console.log('✅ Pi Network authentication successful');

      if (!authResult.user) {
        return {
          success: false,
          error: 'No user data received from Pi Network'
        };
      }

      // Send auth result to backend for verification (Official Demo Pattern)
      console.log('📡 Sending auth result to backend for verification...');
      const response = await fetch('/api/user/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authResult }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Backend verification failed:', errorData);
        throw new Error(errorData.message || 'Backend authentication failed');
      }

      const data = await response.json();
      
      if (data.message === "User signed in") {
        console.log('✅ Backend verification successful');
        return {
          success: true,
          user: {
            id: authResult.user.uid,
            username: authResult.user.username,
            name: authResult.user.username,
            email: authResult.user.profile?.email || '',
            walletAddress: authResult.user.wallet_address || '',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authResult.user.username}`,
            bio: '',
            balance: 0,
            miningRate: 0,
            teamSize: 0,
            isNodeOperator: false,
            kycStatus: 'verified',
            joinDate: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            termsAccepted: true,
            settings: {
              theme: 'system',
              language: 'en',
              notifications: true,
              emailNotifications: false,
              remindersEnabled: false,
              reminderHoursBefore: 1,
            },
            balanceBreakdown: {
              transferableToMainnet: 0,
              totalUnverifiedPi: 0,
              currentlyInLockups: 0,
            },
            unverifiedPiDetails: {
              fromReferralTeam: 0,
              fromSecurityCircle: 0,
              fromNodeRewards: 0,
              fromOtherBonuses: 0,
            },
            badges: [],
            userActiveMiningHours_LastWeek: 0,
            userActiveMiningHours_LastMonth: 0,
            activeMiningDays_LastWeek: 0,
            activeMiningDays_LastMonth: 0,
            accessToken: authResult.accessToken,
            refreshToken: authResult.refreshToken,
            tokenExpiresAt: authResult.expiresAt,
          }
        };
      } else {
        throw new Error('Invalid response from backend');
      }

    } catch (error) {
      console.error('❌ Authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    try {
      const sdk = getPiSDKInstance();
      return sdk?.isAuthenticated() || false;
    } catch {
      return false;
    }
  }

  /**
   * Get current user from backend (Official Demo Pattern)
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const response = await fetch('/api/user/me', { credentials: 'include' });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.user || null;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }

  /**
   * Logout user (Official Demo Pattern)
   */
  static async logout(): Promise<void> {
    try {
      // Call backend to clear session
      await fetch('/api/user/signout', {
        method: 'GET',
        credentials: 'include'
      });
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  }

  /**
   * Handle incomplete payments during authentication (Official Pattern)
   */
  private static handleIncompletePayment(payment: unknown): void {
    console.log('⚠️ Incomplete payment found during authentication:', payment);
    
    // Send to backend for handling (Official Pattern)
    fetch('/api/payments/incomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment })
    }).catch(error => {
      console.error('❌ Failed to handle incomplete payment:', error);
    });
  }
} 