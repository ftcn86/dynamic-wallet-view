/**
 * Balance Service
 * 
 * This service handles fetching Pi Network balance data from various sources.
 * It attempts to get real balance data when possible, falling back to mock data.
 */

import { getPiSDKInstance } from '@/lib/pi-network';
import { authenticatedFetch } from '@/lib/api';

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
  try {
    const res = await authenticatedFetch('/api/user/me');
    if (!res.ok) throw new Error('Failed to fetch balance');
    const data = await res.json();
    return data.user?.balanceBreakdown || {};
  } catch (error) {
    console.error('Failed to fetch balance:', error);
    throw error;
  }
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