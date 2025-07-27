/**
 * Balance Service
 * 
 * This service handles fetching Pi Network balance data from various sources.
 * It attempts to get real balance data when possible, falling back to mock data.
 */

import { getPiSDKInstance } from '@/lib/pi-network';

export interface BalanceData {
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
  source: 'pi_network' | 'blockchain' | 'mock' | 'error';
}

/**
 * Fetch user balance from Pi Network SDK or fallback to mock data
 */
export async function fetchUserBalance(): Promise<BalanceData> {
  console.log('💰 Starting balance fetch...');

  // Try to get balance from Pi SDK if available
  if (typeof window !== 'undefined' && (window as any).Pi) {
    try {
      console.log('🔍 Attempting to fetch balance from Pi Network SDK...');
      const sdk = getPiSDKInstance();
      
      if (sdk && sdk.isAuthenticated()) {
        // Try to get balance from Pi Network SDK
        // Note: Pi Network SDK may not have a direct balance method
        // This would need to be implemented based on available SDK methods
        console.log('⚠️ Pi Network SDK balance method not available');
        console.log('💡 Real balance fetching requires blockchain API integration');
      } else {
        console.log('⚠️ Pi Network SDK not authenticated');
      }
    } catch (error) {
      console.error('❌ Pi Network SDK balance fetch failed:', error);
    }
  }

  console.log('🔄 Using mock balance data');
  
  // Return mock balance data
  const mockBalance = 12345.6789;
  return {
    totalBalance: mockBalance,
    transferableBalance: mockBalance * 0.45, // ~5678
    unverifiedBalance: mockBalance * 0.34, // ~4206  
    lockedBalance: mockBalance * 0.21, // ~2461
    balanceBreakdown: {
      transferableToMainnet: mockBalance * 0.45, // ~5678
      totalUnverifiedPi: mockBalance * 0.34, // ~4206
      currentlyInLockups: mockBalance * 0.21, // ~2461
    },
    unverifiedPiDetails: {
      fromReferralTeam: mockBalance * 0.162, // ~2000
      fromSecurityCircle: mockBalance * 0.081, // ~1000
      fromNodeRewards: mockBalance * 0.061, // ~750
      fromOtherBonuses: mockBalance * 0.037, // ~456
    },
    source: 'mock'
  };
}

/**
 * Get formatted balance string
 */
export function formatBalance(balance: number): string {
  return balance.toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  });
}

/**
 * Get balance percentage breakdown
 */
export function getBalancePercentages(balanceData: BalanceData): {
  transferable: number;
  unverified: number;
  locked: number;
} {
  const total = balanceData.totalBalance;
  
  if (total === 0) {
    return { transferable: 0, unverified: 0, locked: 0 };
  }
  
  return {
    transferable: Math.round((balanceData.transferableBalance / total) * 100),
    unverified: Math.round((balanceData.unverifiedBalance / total) * 100),
    locked: Math.round((balanceData.lockedBalance / total) * 100),
  };
}

/**
 * Validate balance data
 */
export function validateBalanceData(data: BalanceData): boolean {
  // Check if all required fields are present and valid
  const requiredFields = [
    'totalBalance',
    'transferableBalance', 
    'unverifiedBalance',
    'lockedBalance',
    'balanceBreakdown',
    'unverifiedPiDetails',
    'source'
  ];
  
  for (const field of requiredFields) {
    if (!(field in data)) {
      console.error(`❌ Missing required field: ${field}`);
      return false;
    }
  }
  
  // Check if balances are non-negative
  const balanceFields = [
    data.totalBalance,
    data.transferableBalance,
    data.unverifiedBalance,
    data.lockedBalance
  ];
  
  for (const balance of balanceFields) {
    if (typeof balance !== 'number' || balance < 0) {
      console.error(`❌ Invalid balance value: ${balance}`);
      return false;
    }
  }
  
  return true;
} 