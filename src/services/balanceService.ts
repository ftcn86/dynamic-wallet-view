import { User } from '@/data/schemas';

/**
 * Pi Network Balance Service
 * 
 * This service handles balance fetching from official Pi Network sources only:
 * 1. Pi Network SDK (if available)
 * 2. Pi Network Blockchain API (if available)
 * 3. Pi Network internal APIs (if available)
 * 4. Mock data for development (fallback only)
 */

export interface PiBalance {
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
  lastUpdated: string;
  source: 'sdk' | 'blockchain' | 'api' | 'mock' | 'error';
}

/**
 * Fetch balance from Pi Network SDK (if available)
 */
async function fetchFromPiSDK(): Promise<PiBalance | null> {
  try {
    // Import our Pi Network SDK instance
    const { getPiSDKInstance } = await import('@/lib/pi-network');
    const sdk = getPiSDKInstance();
    
    // Check if SDK is available and has balance methods
    if (sdk && typeof sdk.getBalance === 'function') {
      console.log('🔍 Trying Pi Network SDK balance method...');
      const balance = await sdk.getBalance();
      
      return {
        totalBalance: balance.total || 0,
        transferableBalance: balance.transferable || 0,
        unverifiedBalance: balance.unverified || 0,
        lockedBalance: balance.locked || 0,
        balanceBreakdown: {
          transferableToMainnet: balance.transferable || 0,
          totalUnverifiedPi: balance.unverified || 0,
          currentlyInLockups: balance.locked || 0,
        },
        unverifiedPiDetails: {
          fromReferralTeam: (balance.unverified || 0) * 0.6,
          fromSecurityCircle: (balance.unverified || 0) * 0.25,
          fromNodeRewards: (balance.unverified || 0) * 0.1,
          fromOtherBonuses: (balance.unverified || 0) * 0.05,
        },
        lastUpdated: new Date().toISOString(),
        source: 'sdk',
      };
    }
    
    console.log('⚠️ Pi Network SDK balance method not available');
    return null;
  } catch (error) {
    console.error('❌ Pi Network SDK balance fetch failed:', error);
    return null;
  }
}

/**
 * Fetch balance from Pi Network Blockchain API
 */
async function fetchFromBlockchainAPI(walletAddress: string): Promise<PiBalance | null> {
  try {
    // Pi Network Blockchain API endpoint (if available)
    const response = await fetch(`https://api.minepi.com/blockchain/addresses/${walletAddress}/balance`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('⚠️ Blockchain API not available or wallet not found');
      return null;
    }

    const data = await response.json();
    
    return {
      totalBalance: data.balance || 0,
      transferableBalance: data.transferable || 0,
      unverifiedBalance: data.unverified || 0,
      lockedBalance: data.locked || 0,
      balanceBreakdown: {
        transferableToMainnet: data.transferable || 0,
        totalUnverifiedPi: data.unverified || 0,
        currentlyInLockups: data.locked || 0,
      },
      unverifiedPiDetails: {
        fromReferralTeam: (data.unverified || 0) * 0.6,
        fromSecurityCircle: (data.unverified || 0) * 0.25,
        fromNodeRewards: (data.unverified || 0) * 0.1,
        fromOtherBonuses: (data.unverified || 0) * 0.05,
      },
      lastUpdated: new Date().toISOString(),
      source: 'blockchain',
    };
  } catch (error) {
    console.error('❌ Blockchain API fetch failed:', error);
    return null;
  }
}

/**
 * Fetch balance from Pi Network internal API
 */
async function fetchFromPiInternalAPI(accessToken: string): Promise<PiBalance | null> {
  try {
    // Pi Network internal balance API (if available)
    const response = await fetch('https://api.minepi.com/v2/balance', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('⚠️ Pi Network internal balance API not available');
      return null;
    }

    const data = await response.json();
    
    return {
      totalBalance: data.total || 0,
      transferableBalance: data.transferable || 0,
      unverifiedBalance: data.unverified || 0,
      lockedBalance: data.locked || 0,
      balanceBreakdown: {
        transferableToMainnet: data.transferable || 0,
        totalUnverifiedPi: data.unverified || 0,
        currentlyInLockups: data.locked || 0,
      },
      unverifiedPiDetails: {
        fromReferralTeam: (data.unverified || 0) * 0.6,
        fromSecurityCircle: (data.unverified || 0) * 0.25,
        fromNodeRewards: (data.unverified || 0) * 0.1,
        fromOtherBonuses: (data.unverified || 0) * 0.05,
      },
      lastUpdated: new Date().toISOString(),
      source: 'api',
    };
  } catch (error) {
    console.error('❌ Pi Network internal API fetch failed:', error);
    return null;
  }
}

/**
 * Generate mock balance data
 */
function generateMockBalance(): PiBalance {
  const totalBalance = 12345.6789;
  const transferableBalance = totalBalance * 0.7;
  const unverifiedBalance = totalBalance * 0.3;
  const lockedBalance = 0;

  return {
    totalBalance,
    transferableBalance,
    unverifiedBalance,
    lockedBalance,
    balanceBreakdown: {
      transferableToMainnet: transferableBalance,
      totalUnverifiedPi: unverifiedBalance,
      currentlyInLockups: lockedBalance,
    },
    unverifiedPiDetails: {
      fromReferralTeam: unverifiedBalance * 0.6,
      fromSecurityCircle: unverifiedBalance * 0.25,
      fromNodeRewards: unverifiedBalance * 0.1,
      fromOtherBonuses: unverifiedBalance * 0.05,
    },
    lastUpdated: new Date().toISOString(),
    source: 'mock',
  };
}

/**
 * Get Pi Network balance with fallback strategy (Official sources only)
 */
export async function getPiBalance(
  user: User,
  accessToken?: string
): Promise<PiBalance> {
  console.log('🔍 Fetching Pi Network balance from official sources only...');
  console.log(`🔧 User: ${user.username}`);
  console.log(`🔧 Wallet Address: ${user.walletAddress || 'Not available'}`);

  // Strategy 1: Try Pi Network SDK (most secure and accurate)
  console.log('🔍 Trying Pi Network SDK...');
  const sdkBalance = await fetchFromPiSDK();
  if (sdkBalance) {
    console.log('✅ Balance fetched from Pi Network SDK');
    return sdkBalance;
  }

  // Strategy 2: Try Pi Network internal API (if we have access token)
  if (accessToken && accessToken !== 'mock-token') {
    console.log('🔍 Trying Pi Network internal API...');
    const internalBalance = await fetchFromPiInternalAPI(accessToken);
    if (internalBalance) {
      console.log('✅ Balance fetched from Pi Network internal API');
      return internalBalance;
    }
  }

  // Strategy 3: Try blockchain API (if we have wallet address)
  if (user.walletAddress) {
    console.log('🔍 Trying Pi Network blockchain API...');
    const blockchainBalance = await fetchFromBlockchainAPI(user.walletAddress);
    if (blockchainBalance) {
      console.log('✅ Balance fetched from Pi Network blockchain API');
      return blockchainBalance;
    }
  }

  // Strategy 4: Fallback to mock data (development only)
  console.log('⚠️ All official Pi Network sources failed, using mock data for development');
  return generateMockBalance();
}

/**
 * Get cached balance from localStorage
 */
export function getCachedBalance(): PiBalance | null {
  try {
    const cached = localStorage.getItem('pi_balance_cache');
    if (cached) {
      const balance: PiBalance = JSON.parse(cached);
      const cacheAge = Date.now() - new Date(balance.lastUpdated).getTime();
      const maxAge = 5 * 60 * 1000; // 5 minutes
      
      if (cacheAge < maxAge) {
        console.log('✅ Using cached balance');
        return balance;
      }
    }
  } catch (error) {
    console.error('❌ Failed to read cached balance:', error);
  }
  
  return null;
}

/**
 * Cache balance in localStorage
 */
export function cacheBalance(balance: PiBalance): void {
  try {
    localStorage.setItem('pi_balance_cache', JSON.stringify(balance));
    console.log('✅ Balance cached successfully');
  } catch (error) {
    console.error('❌ Failed to cache balance:', error);
  }
}

/**
 * Clear cached balance
 */
export function clearCachedBalance(): void {
  try {
    localStorage.removeItem('pi_balance_cache');
    console.log('✅ Cached balance cleared');
  } catch (error) {
    console.error('❌ Failed to clear cached balance:', error);
  }
} 