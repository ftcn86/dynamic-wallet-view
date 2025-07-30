import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/databaseService';
import { getPiPlatformAPIClient } from '@/lib/pi-network';
import type { User } from '@/data/schemas';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Registration endpoint called');
    const { authResult } = await request.json();

    console.log('📋 Auth result received:', {
      hasAuthResult: !!authResult,
      hasAccessToken: !!authResult?.accessToken,
      hasUser: !!authResult?.user,
      username: authResult?.user?.username
    });

    if (!authResult || !authResult.accessToken) {
      console.error('❌ Invalid authentication data');
      return NextResponse.json(
        { success: false, message: 'Invalid authentication data' },
        { status: 400 }
      );
    }

    // Try to validate with Pi Network, but don't fail if it doesn't work
    let piUser = null;
    try {
      console.log('🔍 Attempting to verify user with Pi Platform API...');
      const piPlatformClient = getPiPlatformAPIClient();
      piUser = await piPlatformClient.verifyUser(authResult.accessToken);
      console.log('✅ Pi Platform API verification successful:', {
        username: piUser?.username,
        uid: piUser?.uid
      });
    } catch (error) {
      console.warn('⚠️ Pi Platform API verification failed, using auth result directly:', error);
      // Use the user data from the auth result instead
      piUser = authResult.user;
    }

    if (!piUser) {
      console.error('❌ No user data available');
      return NextResponse.json(
        { success: false, message: 'No user data available' },
        { status: 401 }
      );
    }

    console.log('👤 User data to process:', {
      username: piUser.username,
      uid: piUser.uid,
      hasWalletAddress: !!piUser.wallet_address
    });

    // Check if user already exists
    try {
      console.log('🔍 Checking if user already exists...');
      const existingUser = await UserService.getUserByUsername(piUser.username);
      
      if (existingUser) {
        console.log('✅ User already exists, returning existing user');
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
    } catch (error) {
      console.error('❌ Error checking existing user:', error);
      // Continue to create new user
    }

    // Create new user
    console.log('🆕 Creating new user...');
    try {
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

      console.log('✅ User created successfully:', {
        id: (newUser as User).id,
        username: (newUser as User).username
      });

      return NextResponse.json({
        success: true,
        message: 'User created successfully',
        user: newUser,
        isNewUser: true
      });
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }

  } catch (error) {
    console.error('❌ Registration error:', error);
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