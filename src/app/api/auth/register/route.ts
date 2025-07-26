import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/databaseService';
import { getPiPlatformAPIClient } from '@/lib/pi-network';

export async function POST(request: NextRequest) {
  try {
    const { authResult } = await request.json();

    if (!authResult || !authResult.accessToken) {
      return NextResponse.json(
        { success: false, message: 'Invalid authentication data' },
        { status: 400 }
      );
    }

    // Validate with Pi Network
    const piPlatformClient = getPiPlatformAPIClient();
    const piUser = await piPlatformClient.verifyUser(authResult.accessToken);

    if (!piUser) {
      return NextResponse.json(
        { success: false, message: 'Pi Network authentication failed' },
        { status: 401 }
      );
    }

    // Check if user already exists
    const existingUser = await UserService.getUserByUsername(piUser.username);
    if (existingUser) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'User already exists',
          user: existingUser,
          isNewUser: false
        },
        { status: 200 }
      );
    }

    // Create new user
    const newUser = await UserService.createUser({
      username: piUser.username,
      name: piUser.name || piUser.username,
      email: piUser.email,
      walletAddress: piUser.wallet_address,
      avatar: piUser.avatar_url || '/default-avatar.png',
      balance: 0,
      miningRate: 0,
      teamSize: 0,
      isNodeOperator: false,
      kycStatus: piUser.kyc_status || 'not_completed',
      joinDate: new Date().toISOString(),
      termsAccepted: false,
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken,
      tokenExpiresAt: authResult.tokenExpiresAt,
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
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: newUser,
      isNewUser: true
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Registration failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 