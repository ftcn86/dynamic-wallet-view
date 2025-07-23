/**
 * Pi Network Integration Module
 * 
 * This module provides a clean, type-safe interface for Pi Network SDK integration.
 * It handles authentication, payments, and API calls following the latest Pi Network best practices.
 * 
 * References:
 * - Pi Platform Docs: https://github.com/pi-apps/pi-platform-docs
 * - Pi SDK: https://github.com/pi-apps/PiOS
 * - Node.js SDK: https://github.com/pi-apps/pi-nodejs
 */

import { config } from './config';

// Pi Network SDK Types
export interface PiAuthResult {
  user: PiUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  auth?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
}

export interface PiUser {
  uid: string;
  username: string;
  wallet_address?: string;
  profile?: {
    firstname?: string;
    lastname?: string;
    email?: string;
  };
  roles?: string[];
  credentials?: any;
  app_id?: string;
  receiving_email?: string;
}

export interface PiPayment {
  identifier: string;
  user_uid: string;
  amount: number;
  memo: string;
  metadata?: Record<string, any>;
  to_address?: string;
  created_at: string;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  transaction?: {
    txid: string;
    verified: boolean;
    _link: string;
  } | null;
}

export interface PiPaymentData {
  amount: number;
  memo: string;
  metadata?: Record<string, any>;
  to_address?: string;
}

// Check if Pi SDK is available
export function isPiSDKAvailable(): boolean {
  return typeof window !== 'undefined' && 
    (window as any).Pi && 
    (window as any).Pi.authenticate && 
    typeof (window as any).Pi.authenticate === 'function';
}

// Get Pi SDK instance
export function getPiSDK() {
  if (!isPiSDKAvailable()) {
    throw new Error('Pi Network SDK not available');
  }
  return (window as any).Pi;
}

// Handle incomplete payments
function handleIncompletePayment(payment: PiPayment) {
  console.log('Incomplete payment found:', payment);
  // In a real app, you might want to show a dialog to the user
  // asking if they want to complete the payment
}

class PiNetworkSDK {
  private pi: any = null;

  constructor() {
    this.initializeSDK();
  }

  /**
   * Initialize Pi Network SDK
   */
  private initializeSDK(): void {
    if (typeof window === 'undefined') return;

    const checkForPiSDK = () => {
      if ((window as any).Pi) {
        this.pi = (window as any).Pi;
        
        // Initialize Pi Network SDK
        try {
          // Detect if we're in sandbox environment
          const isSandbox = typeof window !== 'undefined' && 
            window.location.hostname.includes('sandbox.minepi.com');
          
          this.pi.init({
            version: '2.0',
            appId: config.piNetwork.appId,
            environment: isSandbox ? 'sandbox' : 'mainnet'
          });
          console.log('✅ Pi Network SDK initialized');
          console.log('🔧 App ID:', config.piNetwork.appId);
          console.log('🌍 Environment:', isSandbox ? 'sandbox' : 'mainnet');
        } catch (error) {
          console.error('❌ Failed to initialize Pi Network SDK:', error);
        }
      } else {
        // Retry after a short delay
        setTimeout(checkForPiSDK, 100);
      }
    };

    checkForPiSDK();
  }

  /**
   * Check if user is authenticated
   * Note: Pi SDK doesn't have an authenticated() method, so we check differently
   */
  isAuthenticated(): boolean {
    if (!this.pi) return false;
    
    // Check if we have a current user (this indicates authentication)
    try {
      const currentUser = this.currentUser();
      return currentUser !== null;
    } catch (error) {
      console.log('Authentication check failed:', error);
      return false;
    }
  }

  /**
   * Get current user
   */
  currentUser(): PiUser | null {
    if (!this.pi) return null;
    
    try {
      return this.pi.currentUser ? this.pi.currentUser() : null;
    } catch (error) {
      console.log('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Authenticate user with Pi Network
   */
  async authenticate(
    scopes: string[] = ['username', 'payments', 'wallet_address'],
    onIncompletePaymentFound?: (payment: PiPayment) => void
  ): Promise<PiAuthResult> {
    if (!this.pi) {
      throw new Error('Pi Network SDK not available');
    }

    if (typeof this.pi.authenticate !== 'function') {
      console.error('Pi Network SDK authenticate method not found');
      throw new Error('Pi Network SDK authenticate method not available');
    }

    try {
      const authResult = await this.pi.authenticate(scopes, onIncompletePaymentFound);
      return authResult;
    } catch (error) {
      console.error('Pi Network authentication failed:', error);
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a payment request
   */
  async createPayment(
    paymentData: PiPaymentData,
    callbacks: {
      onReadyForServerApproval: (paymentId: string) => void;
      onReadyForServerCompletion: (paymentId: string, txid: string) => void;
      onCancel: (paymentId: string) => void;
      onError: (error: Error, payment: PiPayment) => void;
    }
  ): Promise<PiPayment> {
    if (!this.pi) {
      throw new Error('Pi Network SDK not available');
    }

    try {
      const payment = await this.pi.createPayment(paymentData, callbacks);
      return payment;
    } catch (error) {
      console.error('Pi Network payment creation failed:', error);
      throw new Error(`Payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Complete a payment
   */
  async completePayment(payment: PiPayment): Promise<PiPayment> {
    if (!this.pi) {
      throw new Error('Pi Network SDK not available');
    }

    try {
      const completedPayment = await this.pi.completePayment(payment);
      return completedPayment;
    } catch (error) {
      console.error('Pi Network payment completion failed:', error);
      throw new Error(`Payment completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cancel a payment
   */
  async cancelPayment(payment: PiPayment): Promise<PiPayment> {
    if (!this.pi) {
      throw new Error('Pi Network SDK not available');
    }

    try {
      const cancelledPayment = await this.pi.cancelPayment(payment);
      return cancelledPayment;
    } catch (error) {
      console.error('Pi Network payment cancellation failed:', error);
      throw new Error(`Payment cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get list of available native features
   */
  async getNativeFeatures(): Promise<string[]> {
    if (!this.pi) {
      throw new Error('Pi Network SDK not available');
    }

    try {
      if (typeof this.pi.nativeFeaturesList === 'function') {
        const features = await this.pi.nativeFeaturesList();
        console.log('✅ Native features detected:', features);
        return features;
      } else {
        console.log('⚠️ Native features detection not available');
        return [];
      }
    } catch (error) {
      console.error('❌ Native features detection failed:', error);
      return [];
    }
  }

  /**
   * Open native share dialog
   */
  async openShareDialog(title: string, message: string): Promise<void> {
    if (!this.pi) {
      throw new Error('Pi Network SDK not available');
    }

    try {
      if (typeof this.pi.openShareDialog === 'function') {
        await this.pi.openShareDialog(title, message);
        console.log('✅ Share dialog opened successfully');
      } else {
        console.log('⚠️ Share dialog not available');
        // Fallback to browser share API
        if (navigator.share) {
          await navigator.share({
            title,
            text: message,
            url: window.location.href
          });
        } else {
          throw new Error('Share functionality not available');
        }
      }
    } catch (error) {
      console.error('❌ Share dialog failed:', error);
      throw error;
    }
  }

  /**
   * Show rewarded ad
   */
  async showRewardedAd(): Promise<{ result: string; adId?: string }> {
    if (!this.pi) {
      throw new Error('Pi Network SDK not available');
    }

    try {
      if (this.pi.Ads && typeof this.pi.Ads.showAd === 'function') {
        const result = await this.pi.Ads.showAd('rewarded');
        console.log('✅ Rewarded ad result:', result);
        return result;
      } else {
        console.log('⚠️ Ads module not available');
        throw new Error('Ads functionality not available');
      }
    } catch (error) {
      console.error('❌ Rewarded ad failed:', error);
      throw error;
    }
  }

  /**
   * Check if rewarded ad is ready
   */
  async isRewardedAdReady(): Promise<boolean> {
    if (!this.pi) {
      throw new Error('Pi Network SDK not available');
    }

    try {
      if (this.pi.Ads && typeof this.pi.Ads.isAdReady === 'function') {
        const result = await this.pi.Ads.isAdReady('rewarded');
        return result.ready;
      } else {
        return false;
      }
    } catch (error) {
      console.error('❌ Ad readiness check failed:', error);
      return false;
    }
  }

  /**
   * Get user balance from Pi Network SDK
   */
  async getBalance(): Promise<any> {
    if (!this.pi) {
      throw new Error('Pi Network SDK not available');
    }

    try {
      if (typeof this.pi.getBalance === 'function') {
        const balance = await this.pi.getBalance();
        console.log('✅ Balance fetched from Pi Network SDK:', balance);
        return balance;
      } else {
        console.log('⚠️ Pi Network SDK getBalance method not available');
        throw new Error('Balance method not available in Pi Network SDK');
      }
    } catch (error) {
      console.error('❌ Pi Network SDK balance fetch failed:', error);
      throw error;
    }
  }
}

// Global SDK instance
let piSDKInstance: PiNetworkSDK | null = null;

/**
 * Get or create Pi SDK instance
 */
export function getPiSDKInstance(): PiNetworkSDK {
  if (!piSDKInstance) {
    piSDKInstance = new PiNetworkSDK();
  }
  return piSDKInstance;
}

// Import our app's User type for mapping
import type { User } from '@/data/schemas';

/**
 * Convert Pi Network user to our app's User format
 */
function convertPiUserToAppUser(piUser: PiUser, authResult?: PiAuthResult): User {
  const name = piUser.profile 
    ? `${piUser.profile.firstname || ''} ${piUser.profile.lastname || ''}`.trim() || piUser.username
    : piUser.username;

  // Debug wallet address access
  console.log('🔍 Pi User data:', {
    uid: piUser.uid,
    username: piUser.username,
    wallet_address: piUser.wallet_address,
    hasWalletAddress: !!piUser.wallet_address,
    roles: piUser.roles,
    profile: piUser.profile
  });

  // Check if wallet address is available
  const walletAddress = piUser.wallet_address;
  if (!walletAddress) {
    console.warn('⚠️ Wallet address not available in Pi User data');
    console.log('💡 This could be due to:');
    console.log('   - User not granting wallet_address permission');
    console.log('   - App not properly configured for wallet_address scope');
    console.log('   - Pi Network SDK not returning wallet address');
  } else {
    console.log('✅ Wallet address found:', walletAddress);
  }

  return {
    id: piUser.uid,
    username: piUser.username,
    name: name,
    email: piUser.profile?.email || '',
    walletAddress: walletAddress || '',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${piUser.username}`,
    balance: 0, // Will be fetched separately
    miningRate: 0, // Will be fetched separately
    teamSize: 0, // Will be fetched separately
    isNodeOperator: piUser.roles?.some(role => 
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

/**
 * Pi Platform API Client - Like demo app
 */
class PiPlatformAPIClient {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = config.piNetwork.platformApiUrl;
    this.apiKey = config.piNetwork.apiKey;
  }

  /**
   * Make authenticated request to Pi Platform API
   */
  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Key ${this.apiKey}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Pi Platform API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Verify user with access token
   */
  async verifyUser(accessToken: string): Promise<any> {
    return this.request('/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  }

  /**
   * Get user balance information
   * Note: Pi Network doesn't provide balance via Platform API
   * This would need to be implemented via blockchain API or other means
   */
  async getUserBalance(accessToken: string): Promise<any> {
    // Pi Network Platform API doesn't provide balance information
    // This would need to be implemented via:
    // 1. Blockchain API calls to get wallet balance
    // 2. Pi Network's internal APIs (if available)
    // 3. Third-party services that track Pi balances
    
    console.log('⚠️ Balance fetching not available via Platform API');
    console.log('💡 Consider implementing via blockchain API or Pi Network internal APIs');
    
    // Return mock data for now
    return {
      balance: 0,
      totalBalance: 0,
      transferableBalance: 0,
      unverifiedBalance: 0,
      lockedBalance: 0,
      message: 'Balance fetching requires blockchain API integration'
    };
  }

  /**
   * Approve payment
   */
  async approvePayment(paymentId: string): Promise<any> {
    return this.request(`/v2/payments/${paymentId}/approve`, {
      method: 'POST',
    });
  }

  /**
   * Complete payment
   */
  async completePayment(paymentId: string, txid: string): Promise<any> {
    return this.request(`/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ txid }),
    });
  }

  /**
   * Cancel payment
   */
  async cancelPayment(paymentId: string): Promise<any> {
    return this.request(`/v2/payments/${paymentId}/cancel`, {
      method: 'POST',
    });
  }

  /**
   * Create App-to-User payment
   */
  async createAppToUserPayment(paymentData: {
    amount: number;
    memo: string;
    metadata?: Record<string, any>;
    uid: string;
  }): Promise<any> {
    return this.request('/v2/payments', {
      method: 'POST',
      body: JSON.stringify({
        payment: paymentData
      }),
    });
  }
}

// Global Pi Platform API client instance
let piPlatformAPIClient: PiPlatformAPIClient | null = null;

/**
 * Get Pi Platform API client instance
 */
export function getPiPlatformAPIClient(): PiPlatformAPIClient {
  if (!piPlatformAPIClient) {
    piPlatformAPIClient = new PiPlatformAPIClient();
  }
  return piPlatformAPIClient;
}

/**
 * Authenticate with Pi Network and convert to our User format
 */
export async function authenticateWithPi(): Promise<User | null> {
  try {
    console.log('🚀 Starting Pi Network authentication...');
    
    const sdk = getPiSDKInstance();
    
    // Check if SDK is available
    if (!sdk) {
      console.error('❌ Pi Network SDK not available');
      return null;
    }

    // Standardize scopes - always request the same set
    const requiredScopes = ['username', 'payments', 'wallet_address'];
    console.log('🔍 Authenticating with scopes:', requiredScopes);
    console.log('💡 Make sure your Pi Network app is configured with these scopes');

    const authResult = await sdk.authenticate(requiredScopes, handleIncompletePayment);
    
    console.log('✅ Authentication successful');
    console.log('🔍 Auth result:', {
      hasUser: !!authResult.user,
      hasAccessToken: !!authResult.accessToken,
      userUid: authResult.user?.uid,
      userUsername: authResult.user?.username,
      hasWalletAddress: !!authResult.user?.wallet_address
    });

    if (!authResult.user) {
      console.error('❌ No user data in authentication result');
      return null;
    }

    // Convert Pi user to our app user format
    const user = convertPiUserToAppUser(authResult.user, authResult);
    
    // If wallet address is not available in auth result, try to get it from current user
    if (!user.walletAddress) {
      console.log('🔄 Wallet address not in auth result, trying current user...');
      try {
        const currentUser = sdk.currentUser();
        if (currentUser?.wallet_address) {
          console.log('✅ Found wallet address in current user:', currentUser.wallet_address);
          user.walletAddress = currentUser.wallet_address;
        } else {
          console.log('⚠️ No wallet address in current user either');
        }
      } catch (error) {
        console.log('⚠️ Could not get current user for wallet address fallback:', error);
      }
    }
    
    console.log('✅ User converted successfully');
    console.log('🔍 Final user data:', {
      id: user.id,
      username: user.username,
      hasWalletAddress: !!user.walletAddress,
      walletAddress: user.walletAddress
    });

    return user;
  } catch (error) {
    console.error('❌ Pi Network authentication failed:', error);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('wallet_address')) {
        console.log('💡 Wallet address permission issue detected');
        console.log('   - Make sure your Pi Network app is configured with wallet_address scope');
        console.log('   - User must grant wallet address permission during authentication');
      }
    }
    
    return null;
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const sdk = getPiSDKInstance();
    const piUser = sdk.currentUser();
    
    if (!piUser) {
      return null;
    }
    
    return convertPiUserToAppUser(piUser);
  } catch (error) {
    console.error('❌ Failed to get current user:', error);
    return null;
  }
} 