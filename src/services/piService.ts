
"use client";

import { mockUser, mockTeam, mockTransactions, mockNotifications } from '@/data/mocks';
import type { User, TeamMember, Transaction, Notification } from '@/data/schemas';
import { getPiSDKInstance } from '@/lib/pi-network';
import type { PiPayment, PiPaymentData } from '@/lib/pi-network';
import { notifyA2UPaymentSent, notifyA2UPaymentFailed } from '@/services/notificationService';
import { fetchUserBalance, type BalanceData } from '@/services/balanceService';

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
function convertPiUserToAppUser(piUser: any, authResult?: any): User {
  const name = piUser.profile 
    ? `${piUser.profile.firstname || ''} ${piUser.profile.lastname || ''}`.trim() || piUser.username
    : piUser.username;

  return {
    id: piUser.uid,
    username: piUser.username,
    name: name,
    email: piUser.profile?.email || '',
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
  // Fetch from backend API
  const res = await fetch('/api/user/me');
  if (!res.ok) throw new Error('Failed to fetch user');
  const data = await res.json();
  return data.user;
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
 */
export async function createPiPayment(
  paymentData: PiPaymentData,
  callbacks: PaymentCallbacks
): Promise<string> {
  console.log("Creating Pi Network payment:", paymentData);

  // Use Pi SDK if available, otherwise simulate payment
  if (typeof window !== 'undefined' && (window as any).Pi) {
    try {
      const Pi = (window as any).Pi;
      
      const payment = await Pi.createPayment(paymentData, {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log("Payment ready for server approval:", paymentId);
          
          // Store payment info
          activePayments.set(paymentId, {
            paymentId,
            status: 'pending',
            amount: paymentData.amount,
            memo: paymentData.memo,
            createdAt: new Date().toISOString()
          });
          
          try {
            // Call our backend to approve the payment
            const response = await fetch('/api/payments/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, metadata: paymentData.metadata })
            });
            
            if (response.ok) {
              console.log("✅ Payment approved by backend");
              callbacks.onReadyForServerApproval(paymentId);
            } else {
              throw new Error(`Backend approval failed: ${response.status}`);
            }
          } catch (error) {
            console.error("❌ Backend approval failed:", error);
            callbacks.onError(error as Error, payment);
          }
        },
        
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log("Payment ready for server completion:", paymentId, txid);
          
          // Update payment info
          const paymentInfo = activePayments.get(paymentId);
          if (paymentInfo) {
            paymentInfo.status = 'approved';
            paymentInfo.txid = txid;
          }
          
          try {
            // Call our backend to complete the payment
            const response = await fetch('/api/payments/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, txid })
            });
            
            if (response.ok) {
              console.log("✅ Payment completed by backend");
              if (paymentInfo) {
                paymentInfo.status = 'completed';
                paymentInfo.completedAt = new Date().toISOString();
              }
              callbacks.onReadyForServerCompletion(paymentId, txid);
            } else {
              throw new Error(`Backend completion failed: ${response.status}`);
            }
          } catch (error) {
            console.error("❌ Backend completion failed:", error);
            callbacks.onError(error as Error, payment);
          }
        },
        
        onCancel: (paymentId: string) => {
          console.log("Payment cancelled:", paymentId);
          
          // Update payment info
          const paymentInfo = activePayments.get(paymentId);
          if (paymentInfo) {
            paymentInfo.status = 'cancelled';
          }
          
          // Call our backend to handle cancellation
          fetch('/api/payments/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId })
          }).catch(error => {
            console.error("❌ Backend cancellation failed:", error);
          });
          
          callbacks.onCancel(paymentId);
        },
        
        onError: (error: Error, payment: PiPayment) => {
          console.error("❌ Pi Network payment error:", error);
          
          // Update payment info
          if (payment.identifier) {
            const paymentInfo = activePayments.get(payment.identifier);
            if (paymentInfo) {
              paymentInfo.status = 'failed';
            }
          }
          
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
export async function sendA2UPayment(
  recipientUid: string,
  amount: number,
  memo: string,
  metadata?: any
): Promise<{ success: boolean; paymentId?: string; error?: string }> {
  console.log("Sending A2U payment:", { recipientUid, amount, memo });

  try {
    const response = await fetch('/api/payments/a2u', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientUid,
        amount,
        memo,
        metadata
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log("✅ A2U payment sent successfully:", result.paymentId);
      notifyA2UPaymentSent(amount, recipientUid);
      return { success: true, paymentId: result.paymentId };
    } else {
      console.error("❌ A2U payment failed:", result.error);
      notifyA2UPaymentFailed(amount, recipientUid, result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("❌ A2U payment request failed:", errorMessage);
    notifyA2UPaymentFailed(amount, recipientUid, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get user's Pi balance
 */
export async function getUserPiBalance(): Promise<any> {
  const res = await fetch('/api/user/me');
  if (!res.ok) throw new Error('Failed to fetch balance');
  const data = await res.json();
  return data.user?.balanceBreakdown || {};
}

/**
 * Get team members
 */
export async function getTeamMembers(): Promise<any[]> {
  const res = await fetch('/api/user/me');
  if (!res.ok) throw new Error('Failed to fetch team members');
  const data = await res.json();
  return data.user?.teamMembers || [];
}

/**
 * Get node data
 */
export async function getNodeData() {
  const res = await fetch('/api/user/me');
  if (!res.ok) throw new Error('Failed to fetch node data');
  const data = await res.json();
  return data.user?.nodeData || null;
}

/**
 * Get transactions
 */
export async function getTransactions(): Promise<Transaction[]> {
  // Fetch from real backend API
  const res = await fetch('/api/transactions');
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
    ? `https://blockexplorer.minepi.com/testnet/transactions/${transaction.txid}`
    : undefined;

  const newTransaction: Transaction = {
    ...transaction,
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    blockExplorerUrl,
    txid: transaction.txid
  };
  
  // Add to mock data (in real app, this would save to database)
  mockTransactions.unshift(newTransaction);
  
  // Add notification for new transaction
  const { addNotification } = await import('@/services/notificationService');
  
  let notificationTitle = '';
  let notificationDescription = '';
  
  switch (transaction.type) {
    case 'sent':
      notificationTitle = 'Payment Sent';
      notificationDescription = `Successfully sent ${transaction.amount}π to ${transaction.to}`;
      break;
    case 'received':
      notificationTitle = 'Payment Received';
      notificationDescription = `Received ${transaction.amount}π from ${transaction.from}`;
      break;
    case 'mining_reward':
      notificationTitle = 'Mining Reward';
      notificationDescription = `Earned ${transaction.amount}π from mining`;
      break;
    case 'node_bonus':
      notificationTitle = 'Node Bonus';
      notificationDescription = `Received ${transaction.amount}π node operation bonus`;
      break;
  }
  
  addNotification(
    'announcement',
    notificationTitle,
    notificationDescription,
    '/dashboard/transactions'
  );
  
  return newTransaction;
}

/**
 * Get notifications
 */
export async function getNotifications(): Promise<Notification[]> {
  // Fetch from real backend API
  const res = await fetch('/api/notifications');
  if (!res.ok) throw new Error('Failed to fetch notifications');
  const data = await res.json();
  return data.notifications || [];
}

/**
 * Get user badges
 */
export async function getUserBadges(): Promise<any[]> {
  const res = await fetch('/api/user/me');
  if (!res.ok) throw new Error('Failed to fetch badges');
  const data = await res.json();
  return data.user?.badges || [];
}

/**
 * Get balance history
 */
export async function getBalanceHistory(): Promise<any[]> {
  const res = await fetch('/api/user/me');
  if (!res.ok) throw new Error('Failed to fetch balance history');
  const data = await res.json();
  return data.user?.balanceHistory || [];
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
  private pi: any = null;

  constructor() {
    this.initializeSDK();
  }

  private initializeSDK(): void {
    if (typeof window === 'undefined') return;
    
    const checkForPiSDK = () => {
      if ((window as any).Pi) {
        this.pi = (window as any).Pi;
        try {
          // Simple initialization following official demo pattern
          this.pi.init({ version: '2.0' });
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
    return this.pi?.isAuthenticated() || false;
  }

  /**
   * Get current authenticated user
   */
  currentUser(): any {
    return this.pi?.currentUser() || null;
  }

  /**
   * Authenticate user with Pi Network
   */
  async authenticate(
    scopes: string[] = ['username', 'payments', 'wallet_address'],
    onIncompletePaymentFound?: (payment: PiPayment) => void
  ): Promise<any> {
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
   * Create a payment
   */
  async createPayment(paymentData: PiPaymentData, callbacks: any): Promise<PiPayment> {
    if (!this.pi) {
      throw new Error('Pi Network SDK not available');
    }

    try {
      return await this.pi.createPayment(paymentData, callbacks);
    } catch (error) {
      console.error('Pi Network payment creation failed:', error);
      throw new Error(`Payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const piNetworkSDK = new PiNetworkSDK();
