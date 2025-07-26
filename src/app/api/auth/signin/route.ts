import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';
import { config } from '@/lib/config';

/**
 * Simplified Authentication Endpoint (Following Official Demo Pattern)
 * 
 * This endpoint validates Pi Network access tokens and returns user data.
 * It follows the exact same pattern as the official Pi Network demo.
 */

export async function POST(request: NextRequest) {
  try {
    const { authResult } = await request.json();

    if (!authResult || !authResult.accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Validating Pi Network access token...');
    console.log(`🔧 Environment: ${config.isDevelopment ? 'development' : 'production'}`);

    // Use Pi Platform API client to verify the token (following official demo pattern)
    const piPlatformClient = getPiPlatformAPIClient();
    
    try {
      const userData = await piPlatformClient.verifyUser(authResult.accessToken);
      console.log('✅ Pi Network token validation successful');

      // Convert Pi user data to our app's User format
      const appUser = {
        id: userData.uid || authResult.user.uid,
        username: userData.username || authResult.user.username,
        name: userData.username || authResult.user.username, // Use username as name
        email: userData.email || '',
        walletAddress: userData.wallet_address || '',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username || authResult.user.username}`,
        bio: 'Pi Network Pioneer',
        balance: 0, // Will be fetched separately
        miningRate: 0, // Will be fetched separately
        isNodeOperator: userData.roles?.some((role: string) => 
          ['node_operator', 'validator', 'super_node', 'node'].includes(role)
        ) || false,
        kycStatus: 'verified',
        joinDate: new Date().toISOString(),
        lastActive: new Date().toISOString(),
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
        termsAccepted: true,
        settings: {
          theme: 'system',
          language: 'en',
          notifications: true,
          emailNotifications: false,
          remindersEnabled: true,
          reminderHoursBefore: 1,
        },
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken || '',
        tokenExpiresAt: authResult.expiresAt || (Date.now() + 3600000),
      };

      return NextResponse.json({
        success: true,
        user: appUser,
        message: "User signed in successfully"
      });
    } catch (platformError) {
      console.error('❌ Pi Platform API validation failed:', platformError);
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('❌ Authentication API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 