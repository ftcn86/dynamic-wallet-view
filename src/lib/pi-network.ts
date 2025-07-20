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

  private initializeSDK(): void {
    if (typeof window !== 'undefined') {
      // Wait for Pi SDK to be available
      const checkForPiSDK = () => {
        if ((window as any).Pi) {
          this.pi = (window as any).Pi;
          
          // Debug: Log available methods
          console.log('Available Pi SDK methods:', Object.keys(this.pi));
          
          // Initialize SDK
          if (this.pi.init) {
            try {
              this.pi.init({ 
                version: "2.0"
              });
              console.log('✅ Pi Network SDK initialized successfully');
            } catch (error) {
              console.error('Failed to initialize Pi SDK:', error);
            }
          }
        } else {
          // Retry after a short delay
          setTimeout(checkForPiSDK, 100);
        }
      };
      
      checkForPiSDK();
    }
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
    scopes: string[] = ['username', 'payments'],
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

  return {
    id: piUser.uid,
    username: piUser.username,
    name: name,
    email: piUser.profile?.email || '',
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
   */
  async getUserBalance(accessToken: string): Promise<any> {
    return this.request('/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
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
    const sdk = getPiSDKInstance();
    const authResult = await sdk.authenticate(['username', 'payments'], handleIncompletePayment);
    
    // Convert Pi user to our app's User format
    const user = convertPiUserToAppUser(authResult.user, authResult);
    
    console.log('✅ Pi Network authentication successful');
    console.log('🔧 User data:', user);
    
    return user;
  } catch (error) {
    console.error('❌ Pi Network authentication failed:', error);
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