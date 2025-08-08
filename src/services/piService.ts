
"use client";

import { mockUser, mockTeam, mockTransactions, mockNotifications } from '@/data/mocks';
import { getBlockExplorerTxUrl } from '@/lib/config';
import type { User, TeamMember, Transaction, Notification } from '@/data/schemas';
import { getPiSDKInstance } from '@/lib/pi-network';
import type { PiPayment, PiPaymentData } from '@/lib/pi-network';
import { notifyA2UPaymentSent, notifyA2UPaymentFailed } from '@/services/notificationService';
import { fetchUserBalance, type BalanceData } from '@/services/balanceService';
import { authenticatedFetch } from '@/lib/api';

// Payment callbacks interface
export interface PaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment: PiPayment) => void;
}

// Active payments tracking
const activePayments = new Map<string, {
  paymentId: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled' | 'failed';
  amount: number;
  memo: string;
  createdAt: string;
  txid?: string;
  completedAt?: string;
}>();

/**
 * Get Pi SDK instance
 */
function getPiSDK() {
  return getPiSDKInstance();
}

/**
 * Convert Pi Network user to our app's User format
 */
function convertPiUserToAppUser(piUser: unknown, authResult?: unknown): User {
  const pi = piUser as Record<string, unknown>;
  const profile = typeof pi.profile === 'object' && pi.profile !== null ? pi.profile as Record<string, unknown> : undefined;
  const name = profile && typeof profile.firstname === 'string' && typeof profile.lastname === 'string'
    ? `${profile.firstname || ''} ${profile.lastname || ''}`.trim() || (typeof pi.username === 'string' ? pi.username : '')
    : (typeof pi.username === 'string' ? pi.username : '');

  return {
    id: typeof pi.uid === 'string' ? pi.uid : '',
    username: typeof pi.username === 'string' ? pi.username : '',
    name: name,
    email: profile && typeof profile.email === 'string' ? profile.email : '',
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
}

/**
 * Authenticate user with Pi Network
 */
export async function getAuthenticatedUser(): Promise<User> {
  // Rely on session cookie; server will read session-token
  const res = await fetch('/api/user/me', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch user');
  const data = await res.json();
  return data.user as User;
}

/**
 * Validate Pi Network access token
 */
export async function validatePiToken(accessToken: string): Promise<boolean> {
  // In a real app, this would validate the token with Pi Network's servers
  console.log("Validating Pi Network access token:", accessToken ? "Present" : "Missing");
  
  // For development, accept any non-empty token
  return !!accessToken && accessToken.length > 0;
}

/**
 * Create a Pi Network payment
 * Following the EXACT official Pi Network documentation pattern
 */
// DEPRECATED: Use PaymentService.createPayment instead
export async function createPiPayment(
  paymentData: PiPaymentData,
  callbacks: PaymentCallbacks
): Promise<string> {
  console.log("Creating Pi Network payment:", paymentData);

  // Use Pi SDK if available, otherwise simulate payment
  if (typeof window !== 'undefined' && typeof (window as { Pi?: unknown }).Pi === 'object') {
    try {
      const Pi = (window as { Pi?: unknown }).Pi as {
        createPayment: (data: PiPaymentData, callbacks: PaymentCallbacks) => Promise<PiPayment & { identifier: string }>;
      };
      
      // FOLLOWING OFFICIAL PI NETWORK PATTERN EXACTLY
      const payment = await Pi.createPayment(paymentData, {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log("Payment ready for server approval:", paymentId);
          
          try {
            // Call our backend to approve the payment (Official Pattern)
            const response = await fetch('/api/payments/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, metadata: paymentData.metadata })
            });
            
            if (response.ok) {
              console.log("✅ Payment approved by backend");
              callbacks.onReadyForServerApproval(paymentId);
            } else {
              const errorData = await response.json();
              console.error("❌ Backend approval failed:", errorData);
              throw new Error(`Backend approval failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }
          } catch (error) {
            console.error("❌ Backend approval failed:", error);
            callbacks.onError(error as Error, payment);
          }
        },
        
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log("Payment ready for server completion:", paymentId, txid);
          
          try {
            // Call our backend to complete the payment (Official Pattern)
            const response = await fetch('/api/payments/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, txid })
            });
            
            if (response.ok) {
              console.log("✅ Payment completed by backend");
              callbacks.onReadyForServerCompletion(paymentId, txid);
            } else {
              const errorData = await response.json();
              console.error("❌ Backend completion failed:", errorData);
              throw new Error(`Backend completion failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }
          } catch (error) {
            console.error("❌ Backend completion failed:", error);
            callbacks.onError(error as Error, payment);
          }
        },
        
        onCancel: (paymentId: string) => {
          console.log("Payment cancelled:", paymentId);
          callbacks.onCancel(paymentId);
        },
        
        onError: (error: Error, payment: PiPayment) => {
          console.error("❌ Pi Network payment error:", error);
          callbacks.onError(error, payment);
        }
      });
      
      return payment.identifier;
    } catch (error) {
      console.error("Pi Network payment creation failed:", error);
      throw error;
    }
  } else {
    // Simulate payment for development
    console.log("Pi SDK not available, simulating payment");
    const mockPaymentId = `mock_payment_${Date.now()}`;
    
    // Simulate payment flow
    setTimeout(() => callbacks.onReadyForServerApproval(mockPaymentId), 1000);
    setTimeout(() => callbacks.onReadyForServerCompletion(mockPaymentId, `mock_tx_${Date.now()}`), 3000);
    
    return mockPaymentId;
  }
}

/**
 * Send App-to-User payment
 */
// A2U moved to server endpoints; rewards handled by /api/ads/view-complete

/**
 * Get user's Pi balance
 */
export async function getUserPiBalance(): Promise<unknown> {
  const res = await fetch('/api/user/me');
  if (!res.ok) throw new Error('Failed to fetch balance');
  const data: { user?: { balanceBreakdown?: Record<string, unknown> } } = await res.json();
  return data.user?.balanceBreakdown || {};
}

/**
 * Get team members
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    const res = await fetch('/api/team/members', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch team members');
    const data = await res.json();
    return (data.members || []) as TeamMember[];
  } catch (error) {
    console.error('Error fetching team members:', error);
    return mockTeam;
  }
}

/**
 * Get node data
 */
export async function getNodeData() {
  const res = await fetch('/api/node/performance', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch node data');
  return await res.json();
}

/**
 * Get transactions
 */
export async function getTransactions(): Promise<Transaction[]> {
  const res = await fetch('/api/transactions', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch transactions');
  const data = await res.json();
  return data.transactions || [];
}

/**
 * Add a new transaction
 */
export async function addTransaction(transaction: Omit<Transaction, 'id'> & { txid?: string }): Promise<Transaction> {
  console.log("Adding new transaction:", transaction);
  
  // Use the correct Pi Testnet explorer URL if txid is present
  const blockExplorerUrl = transaction.txid
    ? getBlockExplorerTxUrl(transaction.txid)
    : undefined;

  const newTransaction: Transaction = {
    ...transaction,
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    blockExplorerUrl,
    txid: transaction.txid
  };
  
  // Add to mock data (in real app, this would save to database)
  mockTransactions.unshift(newTransaction);
  
  // Add notification for new transaction using Pi Network native notifications
  const { notifyPaymentEvent, notifyMiningReward } = await import('@/services/piNotificationService');
  
  switch (transaction.type) {
    case 'sent':
      await notifyPaymentEvent('sent', transaction.amount, transaction.to);
      break;
    case 'received':
      await notifyPaymentEvent('received', transaction.amount, undefined, transaction.from);
      break;
    case 'mining_reward':
      await notifyMiningReward(transaction.amount);
      break;
    case 'node_bonus':
      await notifyMiningReward(transaction.amount); // Treat as mining reward for notifications
      break;
  }
  
  return newTransaction;
}

/**
 * Get notifications
 */
export async function getNotifications(): Promise<Notification[]> {
  // Fetch from real backend API with session cookies
  const res = await fetch('/api/notifications', {
    credentials: 'include' // Include session cookies
  });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  const data = await res.json();
  return data.notifications || [];
}

/**
 * Get user badges
 */
export async function getUserBadges(): Promise<unknown[]> {
  const res = await authenticatedFetch('/api/user/me');
  if (!res.ok) throw new Error('Failed to fetch badges');
  const data = await res.json();
  return data.user?.badges || [];
}

/**
 * Get balance history
 */
export async function getBalanceHistory(period: '3M' | '6M' | '12M' = '6M'): Promise<any[]> {
  const res = await fetch(`/api/user/balance-history?period=${period}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch balance history');
  const data = await res.json();
  return data.points || [];
}

/**
 * Handle incomplete payment found by Pi SDK
 */
export async function handleIncompletePayment(payment: PiPayment) {
  try {
    // Send to backend for handling (cancel or complete)
    await fetch('/api/payments/incomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment })
    });
  } catch (error) {
    console.error('❌ Failed to handle incomplete payment:', error);
  }
}

// PiNetworkSDK class for centralized SDK management
class PiNetworkSDK {
  private pi: unknown = null;

  constructor() {
    this.initializeSDK();
  }

  private initializeSDK(): void {
    if (typeof window === 'undefined') return;
    
    const checkForPiSDK = () => {
      if (typeof (window as { Pi?: unknown }).Pi === 'object') {
        this.pi = (window as { Pi?: unknown }).Pi;
        try {
          // Simple initialization following official demo pattern
          (this.pi as unknown as { init: (args: { version: string }) => void }).init({ version: '2.0' });
          console.log('✅ Pi Network SDK initialized');
        } catch (error) {
          console.error('❌ Failed to initialize Pi Network SDK:', error);
        }
      } else {
        setTimeout(checkForPiSDK, 100);
      }
    };
    checkForPiSDK();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return typeof (this.pi as { isAuthenticated?: () => boolean }).isAuthenticated === 'function'
      ? (this.pi as { isAuthenticated: () => boolean }).isAuthenticated()
      : false;
  }

  /**
   * Get current authenticated user
   */
  currentUser(): unknown {
    return typeof (this.pi as { currentUser?: () => unknown }).currentUser === 'function'
      ? (this.pi as { currentUser: () => unknown }).currentUser()
      : null;
  }

  /**
   * Authenticate user with Pi Network
   */
  async authenticate(
    scopes: string[] = ['username', 'payments', 'wallet_address'],
    onIncompletePaymentFound?: (payment: PiPayment) => void
  ): Promise<unknown> {
    if (!this.pi) {
      throw new Error('Pi Network SDK not available');
    }

    if (typeof (this.pi as { authenticate?: unknown }).authenticate !== 'function') {
      console.error('Pi Network SDK authenticate method not found');
      throw new Error('Pi Network SDK authenticate method not available');
    }

    try {
      const authResult = await (this.pi as { authenticate: (scopes: string[], cb?: (payment: PiPayment) => void) => Promise<unknown> }).authenticate(scopes, onIncompletePaymentFound);
      return authResult;
    } catch (error) {
      console.error('Pi Network authentication failed:', error);
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      return await (this.pi as { createPayment: (data: PiPaymentData, callbacks: Record<string, unknown>) => Promise<PiPayment> }).createPayment(paymentData, callbacks);
    } catch (error) {
      console.error('Pi Network payment creation failed:', error);
      throw new Error(`Payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const piNetworkSDK = new PiNetworkSDK();
