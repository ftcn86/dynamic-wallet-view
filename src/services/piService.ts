
"use client";

// Mock API call function for development
const mockApiCall = async <T>({ data, delay = 1000 }: { data: T; delay?: number }): Promise<T> => {
  await new Promise(resolve => setTimeout(resolve, delay));
  return data;
};
import { mockUser, mockTeam, mockTransactions, mockNotifications } from '@/data/mocks';
import type { User, TeamMember, Transaction, Notification } from '@/data/schemas';
import { isPiSDKAvailable, getPiSDKInstance } from '@/lib/pi-network';
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
 * Check if Pi SDK is available
 */
function isPiBrowser(): boolean {
  return isPiSDKAvailable();
}

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
    termsAccepted: true, // Auto-accept terms for all users
    settings: {
      theme: 'system',
      language: 'en',
      notifications: true,
      emailNotifications: false,
      remindersEnabled: true,
      reminderHoursBefore: 1,
    },
    accessToken: authResult?.accessToken || authResult?.auth?.accessToken || '',
    refreshToken: authResult?.refreshToken || authResult?.auth?.refreshToken || '',
    tokenExpiresAt: authResult?.expiresAt || authResult?.auth?.expiresAt || (Date.now() + 3600000),
  };
}

/**
 * Authenticate user with Pi Network
 */
export async function getAuthenticatedUser(): Promise<User> {
  console.log("Attempting to authenticate with Pi Network...");

  if (isPiBrowser()) {
    try {
      const piSDK = getPiSDK();
      
      // Check if user is already authenticated
      if (piSDK.isAuthenticated()) {
        console.log("✅ User already authenticated, getting current user data");
        const currentUser = piSDK.currentUser();
        if (currentUser) {
          return convertPiUserToAppUser(currentUser);
        }
      }
      
      // Only authenticate if not already authenticated
      console.log("🔍 User not authenticated, starting authentication...");
      const authResult = await piSDK.authenticate(['username', 'payments', 'wallet_address']);
      return convertPiUserToAppUser(authResult.user, authResult);
    } catch (error) {
      console.error("Pi Network authentication failed, falling back to mock data:", error);
      return mockApiCall({ data: mockUser });
    }
  } else {
    console.log("Pi SDK not available, using mock data");
    return mockApiCall({ data: mockUser });
  }
}

/**
 * Create a Pi Network payment
 */
export async function createPiPayment(
  paymentData: PiPaymentData,
  callbacks: PaymentCallbacks
): Promise<PiPayment> {
  // Check if Pi SDK is available
  if (!isPiBrowser()) {
    console.log('Pi SDK not available - using mock payment flow');
    
    // Create mock payment for development
    const mockPayment: PiPayment = {
      identifier: `mock_${Date.now()}`,
      user_uid: 'mock_user',
      amount: paymentData.amount,
      memo: paymentData.memo,
      metadata: paymentData.metadata || {},
      to_address: paymentData.to_address || 'mock_address',
      created_at: new Date().toISOString(),
      status: 'pending',
      transaction: null,
    };

    // Simulate payment flow with delays
    setTimeout(() => {
      callbacks.onReadyForServerApproval(mockPayment.identifier);
    }, 1000);

    setTimeout(() => {
      const txid = `mock_tx_${Date.now()}`;
      mockPayment.status = 'completed';
      mockPayment.transaction = {
        txid,
        verified: true,
        _link: `https://explorer.minepi.com/tx/${txid}`,
      };
      callbacks.onReadyForServerCompletion(mockPayment.identifier, txid);
    }, 3000);

    return mockPayment;
  }

  try {
    const sdk = getPiSDK();
    
    // Create payment using Pi Network SDK
    const payment = await sdk.createPayment(paymentData, {
      onReadyForServerApproval: (paymentId: string) => {
        console.log('Payment ready for server approval:', paymentId);
        
        // Track payment status
        activePayments.set(paymentId, {
          paymentId,
          status: 'pending',
          amount: paymentData.amount,
          memo: paymentData.memo,
          createdAt: new Date().toISOString(),
        });
        
        callbacks.onReadyForServerApproval(paymentId);
      },
      onReadyForServerCompletion: (paymentId: string, txid: string) => {
        console.log('Payment ready for server completion:', paymentId, txid);
        
        // Update payment status
        const paymentStatus = activePayments.get(paymentId);
        if (paymentStatus) {
          paymentStatus.status = 'approved';
          paymentStatus.txid = txid;
        }
        
        callbacks.onReadyForServerCompletion(paymentId, txid);
      },
      onCancel: (paymentId: string) => {
        console.log('Payment cancelled:', paymentId);
        
        // Update payment status
        const paymentStatus = activePayments.get(paymentId);
        if (paymentStatus) {
          paymentStatus.status = 'cancelled';
        }
        
        callbacks.onCancel(paymentId);
      },
      onError: (error: Error, payment: PiPayment) => {
        console.error('Payment error:', error, payment);
        
        // Update payment status
        const paymentStatus = activePayments.get(payment.identifier);
        if (paymentStatus) {
          paymentStatus.status = 'failed';
        }
        
        callbacks.onError(error, payment);
      },
    })
    
    return payment;
  } catch (error) {
    console.error('Failed to create Pi payment:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('SDK not available')) {
        throw new Error('Pi Network SDK not available. Please ensure you are running in the Pi Browser.');
      } else if (error.message.includes('not authenticated')) {
        throw new Error('Please authenticate with Pi Network first.');
      } else {
        throw new Error(`Payment creation failed: ${error.message}`);
      }
    } else {
      throw new Error(`Payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Create App-to-User payment (A2U)
 * Note: This requires the app to have Pi in its wallet to send to users
 */
export async function createAppToUserPayment(
  amount: number,
  memo: string,
  userId: string,
  metadata?: Record<string, any>
): Promise<any> {
  try {
    console.log('🔍 Creating App-to-User payment...');
    console.log(`🔧 Amount: ${amount} Pi`);
    console.log(`🔧 Memo: ${memo}`);
    console.log(`🔧 User ID: ${userId}`);

    // Check if Pi SDK is available for real payments
    if (isPiBrowser()) {
      console.log('✅ Pi SDK available - attempting real A2U payment');
      
      // In a real implementation, you would:
      // 1. Check if the app has sufficient Pi balance
      // 2. Create the payment through Pi Network Platform API
      // 3. Handle the payment flow
      
      // For now, we'll simulate the payment
      const mockPayment = {
        success: true,
        paymentId: `a2u_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount,
        memo,
        userId,
        status: 'completed',
        timestamp: new Date().toISOString(),
        note: 'This is a simulated payment. In production, the app needs Pi in its wallet to send to users.'
      };
      
      console.log('✅ Simulated A2U payment created');
      notifyA2UPaymentSent(amount, userId);
      
      return mockPayment;
    } else {
      console.log('⚠️ Pi SDK not available - using mock A2U payment');
      
      // Mock payment for development
      const mockPayment = {
        success: true,
        paymentId: `mock_a2u_${Date.now()}`,
        amount,
        memo,
        userId,
        status: 'completed',
        timestamp: new Date().toISOString(),
        note: 'Mock payment - Pi SDK not available'
      };
      
      notifyA2UPaymentSent(amount, userId);
      return mockPayment;
    }
  } catch (error) {
    console.error('❌ App-to-User payment creation failed:', error);
    
    // Notify failure
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    notifyA2UPaymentFailed(amount, userId, errorMessage);
    
    throw error;
  }
}

/**
 * Complete a Pi Network payment
 */
export async function completePiPayment(payment: PiPayment): Promise<PiPayment> {
  // Check if Pi SDK is available
  if (!isPiBrowser()) {
    console.log('Pi SDK not available - using mock payment completion');
    
    // Return mock completed payment
    const completedPayment = { ...payment };
    completedPayment.status = 'completed';
    
    // Update payment status
    const paymentStatus = activePayments.get(payment.identifier);
    if (paymentStatus) {
      paymentStatus.status = 'completed';
      paymentStatus.completedAt = new Date().toISOString();
    }
    
    return completedPayment;
  }

  try {
    const sdk = getPiSDK();
    
    // Complete payment using Pi Network SDK
    const completedPayment = await sdk.completePayment(payment);
    
    // Update payment status
    const paymentStatus = activePayments.get(payment.identifier);
    if (paymentStatus) {
      paymentStatus.status = 'completed';
      paymentStatus.completedAt = new Date().toISOString();
    }
    
    return completedPayment;
  } catch (error) {
    console.error('Failed to complete Pi payment:', error);
    throw new Error(`Payment completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Cancel a Pi Network payment
 */
export async function cancelPiPayment(payment: PiPayment): Promise<PiPayment> {
  // Check if Pi SDK is available
  if (!isPiBrowser()) {
    console.log('Pi SDK not available - using mock payment cancellation');
    
    // Return mock cancelled payment
    const cancelledPayment = { ...payment };
    cancelledPayment.status = 'cancelled';
    
    // Update payment status
    const paymentStatus = activePayments.get(payment.identifier);
    if (paymentStatus) {
      paymentStatus.status = 'cancelled';
    }
    
    return cancelledPayment;
  }

  try {
    const sdk = getPiSDK();
    
    // Cancel payment using Pi Network SDK
    const cancelledPayment = await sdk.cancelPayment(payment);
    
    // Update payment status
    const paymentStatus = activePayments.get(payment.identifier);
    if (paymentStatus) {
      paymentStatus.status = 'cancelled';
    }
    
    return cancelledPayment;
  } catch (error) {
    console.error('Failed to cancel Pi payment:', error);
    throw new Error(`Payment cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate Pi Network token (simplified)
 */
export async function validatePiToken(accessToken: string): Promise<boolean> {
  // In a real app, this would validate with Pi Network servers
  // For now, we'll just check if the token exists and has a valid format
  return Boolean(accessToken && accessToken.length > 0 && accessToken !== 'mock-token');
}

/**
 * Get user Pi balance with real Pi Network integration
 */
export async function getUserPiBalance(accessToken: string): Promise<{
  totalBalance: number;
  transferableBalance: number;
  unverifiedBalance: number;
  lockedBalance: number;
  balanceBreakdown: {
    transferableToMainnet: number;
    totalUnverifiedPi: number;
    currentlyInLockups: number;
  };
  unverifiedPiDetails: {
    fromReferralTeam: number;
    fromSecurityCircle: number;
    fromNodeRewards: number;
    fromOtherBonuses: number;
  };
  source: string;
}> {
  console.log('💰 Starting balance fetch...');
  console.log('🔍 Access token available:', !!accessToken);
  
  try {
    // Try to fetch real balance first
    const balanceData = await fetchUserBalance();
    console.log('✅ Balance fetched successfully from:', balanceData.source);
    console.log('🔍 Balance data:', {
      totalBalance: balanceData.totalBalance,
      transferableBalance: balanceData.transferableBalance,
      unverifiedBalance: balanceData.unverifiedBalance,
      source: balanceData.source
    });
    
    return balanceData;
  } catch (error) {
    console.error('❌ Real balance fetch failed:', error);
    console.log('🔄 Falling back to mock balance data');
    
    // Fallback to mock data
    const mockBalance = 1234.5678;
    return {
      totalBalance: mockBalance,
      transferableBalance: mockBalance * 0.7,
      unverifiedBalance: mockBalance * 0.3,
      lockedBalance: 0,
      balanceBreakdown: {
        transferableToMainnet: mockBalance * 0.7,
        totalUnverifiedPi: mockBalance * 0.3,
        currentlyInLockups: 0,
      },
      unverifiedPiDetails: {
        fromReferralTeam: mockBalance * 0.18,
        fromSecurityCircle: mockBalance * 0.075,
        fromNodeRewards: mockBalance * 0.03,
        fromOtherBonuses: mockBalance * 0.015,
      },
      source: 'mock_fallback'
    };
  }
}

/**
 * Get app's Pi balance (for App-to-User payments)
 * This represents the Pi the app has available to send to users
 */
export async function getAppPiBalance(): Promise<{
  availableBalance: number;
  totalReceived: number;
  totalSent: number;
  source: string;
}> {
  console.log('🔍 Checking app Pi balance for A2U payments...');
  
  // In a real implementation, this would:
  // 1. Check the app's Pi Network wallet balance
  // 2. Track donations received from users
  // 3. Track payments sent to users
  // 4. Calculate available balance for new payments
  
  // For now, we'll use mock data
  const mockBalance = {
    availableBalance: 0, // App has no Pi to send
    totalReceived: 0,    // No donations received yet
    totalSent: 0,        // No payments sent yet
    source: 'mock'
  };
  
  console.log('⚠️ App Pi balance:', mockBalance);
  console.log('💡 To enable real A2U payments:');
  console.log('   1. Register app with Pi Network');
  console.log('   2. Receive donations from users');
  console.log('   3. Implement proper wallet management');
  
  return mockBalance;
}

/**
 * Check if app can make A2U payment
 */
export async function canMakeA2UPayment(amount: number): Promise<{
  canPay: boolean;
  availableBalance: number;
  reason?: string;
}> {
  console.log('🔍 Checking if app can make A2U payment of', amount, 'Pi...');
  
  try {
    const appBalance = await getAppPiBalance();
    
    if (appBalance.availableBalance >= amount) {
      console.log('✅ App can make A2U payment');
      return {
        canPay: true,
        availableBalance: appBalance.availableBalance
      };
    } else {
      console.log('❌ App cannot make A2U payment - insufficient balance');
      return {
        canPay: false,
        availableBalance: appBalance.availableBalance,
        reason: 'App currently cannot pay rewards. This is normal for development/testing.'
      };
    }
  } catch (error) {
    console.error('❌ Error checking A2U payment capability:', error);
    return {
      canPay: false,
      availableBalance: 0,
      reason: 'Unable to check payment capability'
    };
  }
}

/**
 * Get team members
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  return mockApiCall({ data: mockTeam });
}

/**
 * Get transactions
 */
export async function getTransactions(): Promise<Transaction[]> {
  // Check if Pi SDK is available and user is authenticated
  if (isPiBrowser()) {
    try {
      const sdk = getPiSDK();
      if (sdk.isAuthenticated()) {
        console.log('🔍 Fetching real transactions from Pi Network...');
        
        // Get real transactions from Pi Network
        const piUser = sdk.currentUser();
        if (piUser) {
          // In a real implementation, you would fetch from Pi Network API
          // For now, we'll return mock data but mark it as real
          const realTransactions: Transaction[] = mockTransactions.map(tx => ({
            ...tx,
            // Add real transaction indicators
            isRealTransaction: true,
            source: 'pi-network'
          }));
          
          console.log('✅ Real transactions fetched:', realTransactions.length);
          return realTransactions;
        }
      }
    } catch (error) {
      console.error('❌ Failed to fetch real transactions:', error);
    }
  }
  
  // Fallback to mock data
  console.log('📝 Using mock transactions (Pi Network not available)');
  return mockApiCall({ data: mockTransactions });
}

/**
 * Get notifications
 */
export async function getNotifications(): Promise<Notification[]> {
  // Import here to avoid circular dependencies
  const { getNotifications: getNotificationService } = await import('@/services/notificationService');
  return getNotificationService();
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  // Import here to avoid circular dependencies
  const { markNotificationAsRead: markRead } = await import('@/services/notificationService');
  markRead(notificationId);
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  // Import here to avoid circular dependencies
  const { markAllNotificationsAsRead: markAllRead } = await import('@/services/notificationService');
  markAllRead();
}

/**
 * Send broadcast notification
 */
export async function sendBroadcastNotification(message: string): Promise<{ success: boolean }> {
  // In a real app, this would send to all team members
  console.log('Sending broadcast notification:', message);
  return { success: true };
}

/**
 * Add notification
 */
export async function addNotification(notification: Omit<Notification, 'id' | 'date' | 'read'>): Promise<void> {
  // In a real app, this would add to the database
  console.log('Adding notification:', notification);
}

/**
 * Add transaction
 */
export async function addTransaction(transaction: Omit<Transaction, 'id' | 'date'>): Promise<void> {
  // In a real app, this would add to the database
  console.log('Adding transaction:', transaction);
}

/**
 * Get node data
 */
export async function getNodeData(): Promise<any> {
  // In a real app, this would fetch from Pi Network API
  return mockApiCall({ 
    data: {
      uptimePercentage: 98.5,
      isOnline: true,
      lastSync: new Date().toISOString(),
    }
  });
}
