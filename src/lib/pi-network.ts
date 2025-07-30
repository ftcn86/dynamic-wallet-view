/**
 * Pi Network SDK Integration
 * 
 * This module provides a wrapper around the Pi Network SDK
 * and Platform API client for server-side operations.
 */

import { config } from './config';
import type { User } from '@/data/schemas';

// Pi Network types
export interface PiUser {
  uid: string;
  username: string;
  profile?: {
    firstname?: string;
    lastname?: string;
    email?: string;
  };
  wallet_address?: string;
  roles?: string[];
}

export interface PiAuthResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  user: PiUser;
}

export interface PiPayment {
  identifier: string;
  user_uid: string;
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
  to_address?: string;
  from_address?: string;
  direction?: 'user_to_app' | 'app_to_user';
  created_at: string;
  network?: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled' | 'failed';
  transaction?: {
    txid: string;
    verified: boolean;
    _link: string;
  } | null;
}

export interface PiPaymentData {
  amount: number;
  memo: string;
  metadata?: Record<string, unknown>;
  to_address?: string;
}

// Pi Network SDK type definition
export interface PiSDK {
  authenticate: (scopes: string[], onIncompletePaymentFound?: (payment: PiPayment) => void) => Promise<PiAuthResult>;
  createPayment: (paymentData: PiPaymentData, callbacks: Record<string, unknown>) => Promise<PiPayment>;
  completePayment: (payment: PiPayment) => Promise<PiPayment>;
  cancelPayment: (payment: PiPayment) => Promise<PiPayment>;
  isAuthenticated?: () => boolean;
  currentUser?: () => PiUser | null;
}

// Pi Network SDK wrapper class
class PiNetworkSDK {
  private pi: unknown = null;

  constructor() {
    this.initializeSDK();
  }

  private initializeSDK(): void {
    if (typeof window === 'undefined') return;
    
    const checkForPiSDK = () => {
      const win = window as unknown as { Pi?: unknown };
      if (win.Pi && typeof win.Pi === 'object') {
        this.pi = win.Pi as PiSDK;
      }
      if (!this.pi) {
        setTimeout(checkForPiSDK, 100);
      }
    };
    checkForPiSDK();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (this.pi && typeof this.pi === 'object' && 'isAuthenticated' in this.pi && typeof (this.pi as PiSDK).isAuthenticated === 'function') {
      return (this.pi as PiSDK).isAuthenticated!();
    }
    return false;
  }

  /**
   * Get current authenticated user
   */
  currentUser(): PiUser | null {
    if (this.pi && typeof this.pi === 'object' && 'currentUser' in this.pi && typeof (this.pi as PiSDK).currentUser === 'function') {
      return (this.pi as PiSDK).currentUser!();
    }
    return null;
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

    if (this.pi && typeof this.pi === 'object' && 'authenticate' in this.pi) {
      try {
        const authResult = await (this.pi as PiSDK).authenticate(scopes, onIncompletePaymentFound);
        return authResult;
      } catch (error) {
        console.error('Pi Network authentication failed:', error);
        throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.error('Pi Network SDK authenticate method not found');
      throw new Error('Pi Network SDK authenticate method not available');
    }
  }

  /**
   * Create a payment
   */
  async createPayment(paymentData: PiPaymentData, callbacks: Record<string, unknown>): Promise<PiPayment> {
    if (!this.pi) {
      throw new Error('Pi Network SDK not available');
    }

    try {
      return await (this.pi as PiSDK).createPayment(paymentData, callbacks);
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
      return await (this.pi as PiSDK).completePayment(payment);
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
      return await (this.pi as PiSDK).cancelPayment(payment);
    } catch (error) {
      console.error('Pi Network payment cancellation failed:', error);
      throw new Error(`Payment cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
const piSDKInstance = new PiNetworkSDK();

/**
 * Get Pi SDK instance
 */
export function getPiSDKInstance(): PiNetworkSDK {
  return piSDKInstance;
}

/**
 * Pi Platform API Client for server-side operations
 */
export class PiPlatformAPIClient {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, baseURL: string = 'https://api.minepi.com') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  /**
   * Make a request to Pi Platform API
   */
  async request(endpoint: string, options: RequestInit = {}): Promise<unknown> {
    const url = `${this.baseURL}${endpoint}`;
    // Only set API key if not already set (i.e., not a Bearer token request)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (!headers['Authorization']) {
      headers['Authorization'] = `Key ${this.apiKey}`;
    }
    // Debug log
    console.log('[PiPlatformAPIClient] Request to', url, 'with headers:', headers);
    const response = await fetch(url, {
      ...options,
      headers,
    });
    if (!response.ok) {
      throw new Error(`Pi Platform API request failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Verify user with access token
   */
  async verifyUser(accessToken: string): Promise<PiUser> {
    return this.request('/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }) as Promise<PiUser>;
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string): Promise<PiPayment> {
    return this.request(`/v2/payments/${paymentId}`) as Promise<PiPayment>;
  }

  /**
   * Approve a payment
   */
  async approvePayment(paymentId: string): Promise<unknown> {
    return this.request(`/v2/payments/${paymentId}/approve`, {
      method: 'POST',
    });
  }

  /**
   * Complete a payment
   */
  async completePayment(paymentId: string, txid: string): Promise<unknown> {
    return this.request(`/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ txid }),
    });
  }

  /**
   * Cancel a payment
   */
  async cancelPayment(paymentId: string, reason?: string): Promise<unknown> {
    return this.request(`/v2/payments/${paymentId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  /**
   * Create an App-to-User payment
   */
  async createA2UPayment(paymentData: {
    recipient_uid: string;
    amount: number;
    memo: string;
    metadata?: Record<string, unknown>;
  }): Promise<unknown> {
    return this.request('/v2/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  /**
   * Submit a payment to blockchain
   */
  async submitPayment(paymentId: string): Promise<{ txid: string }> {
    return this.request(`/v2/payments/${paymentId}/submit`, {
      method: 'POST',
    }) as Promise<{ txid: string }>;
  }

  /**
   * Get incomplete server payments
   */
  async getIncompleteServerPayments(): Promise<PiPayment[]> {
    return this.request('/v2/payments/incomplete_server_payments') as Promise<PiPayment[]>;
  }
}

/**
 * Get Pi Platform API client instance
 */
export function getPiPlatformAPIClient(): PiPlatformAPIClient {
  const apiKey = config.piNetwork.apiKey;
  const apiUrl = config.piNetwork.platformApiUrl;
  const appId = config.piNetwork.appId;
  if (!apiKey) {
    throw new Error('Pi Network API key not configured');
  }
  // Add logging for debugging
  console.log('[PiPlatformAPIClient] Using API URL:', apiUrl);
  console.log('[PiPlatformAPIClient] Using App ID:', appId);
  console.log('[PiPlatformAPIClient] API Key present:', apiKey ? '[HIDDEN]' : '[NOT SET]');
  return new PiPlatformAPIClient(apiKey, apiUrl);
}

/**
 * Handle incomplete payment found during authentication
 */
export function handleIncompletePayment(payment: PiPayment): void {
  console.log('🔄 Incomplete payment found:', payment);
  
  // Send to backend for handling
  fetch('/api/payments/incomplete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payment })
  }).catch(error => {
    console.error('❌ Failed to handle incomplete payment:', error);
  });
}

/**
 * Convert Pi Network user to our app's User format
 */
export function convertPiUserToAppUser(piUser: PiUser, authResult?: PiAuthResult): User {
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
    bio: '',
    balance: 0, // Will be fetched separately
    miningRate: 0, // Will be fetched separately
    teamSize: 0,
    isNodeOperator: piUser.roles?.some(role => 
      ['node_operator', 'validator', 'super_node', 'node'].includes(role)
    ) || false,
    kycStatus: 'verified', // Pi Network users are verified
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
    // Store Pi Network tokens for API calls
    accessToken: authResult?.accessToken,
    refreshToken: authResult?.refreshToken,
    tokenExpiresAt: authResult?.expiresAt,
  };
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

    return user;
  } catch (error) {
    console.error('❌ Pi Network authentication failed:', error);
    return null;
  }
} 