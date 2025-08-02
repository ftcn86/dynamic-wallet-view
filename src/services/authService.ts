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
   * Get current user from backend (Official Demo Pattern)
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const response = await fetch('/api/auth/pi', {
        method: 'GET',
        credentials: 'include'
      });

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
} 