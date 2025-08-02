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
      const response = await fetch('/api/auth/pi', {
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
      
      if (data.success && data.user) {
        console.log('✅ Backend verification successful');
        return {
          success: true,
          user: data.user
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
   * Get current user
   */
  static getCurrentUser(): User | null {
    try {
      const sdk = getPiSDKInstance();
      const currentUser = sdk?.currentUser();
      
      if (!currentUser) return null;

      // Convert Pi user to our User format
      return {
        id: currentUser.uid || '',
        username: currentUser.username || '',
        name: this.getDisplayName(currentUser),
        email: currentUser.profile?.email || '',
        avatar: '',
        bio: '',
        balance: 0,
        miningRate: 0,
        isNodeOperator: false,
        nodeUptimePercentage: 0,
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
        weeklyMiningDaysTarget: 7,
        activeMiningDays_LastMonth: 0,
        monthlyMiningDaysTarget: 30,
        termsAccepted: true,
        settings: {
          theme: 'system',
          language: 'en',
          notifications: true,
          emailNotifications: false,
          remindersEnabled: true,
          reminderHoursBefore: 1,
        },
        walletAddress: currentUser.wallet_address || '',
        accessToken: '',
        tokenExpiresAt: undefined
      };
    } catch {
      return null;
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      // Call backend to clear session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  }

  /**
   * Handle incomplete payments during authentication
   */
  private static handleIncompletePayment(payment: unknown): void {
    console.log('⚠️ Incomplete payment found during authentication:', payment);
    // You can implement custom logic here to handle incomplete payments
  }

  /**
   * Get display name from Pi user
   */
  private static getDisplayName(piUser: any): string {
    if (piUser.profile?.firstname && piUser.profile?.lastname) {
      return `${piUser.profile.firstname} ${piUser.profile.lastname}`.trim();
    }
    return piUser.username || 'Pi User';
  }
} 