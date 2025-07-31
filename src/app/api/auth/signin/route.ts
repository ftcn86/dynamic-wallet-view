import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';
import { config } from '@/lib/config';
import { createSession, setSessionCookie } from '@/lib/session';
import type { User } from '@/data/schemas';

/**
 * Authentication Endpoint (Following Official Pi Network Demo Pattern)
 * 
 * This endpoint receives the raw authResult from Pi.authenticate() on the frontend
 * and handles all user data processing on the backend, just like the official demos.
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Authentication endpoint called');
    const { authResult } = await request.json();

    console.log('📋 Auth result received:', {
      hasAuthResult: !!authResult,
      hasAccessToken: !!authResult?.accessToken,
      hasUser: !!authResult?.user,
      username: authResult?.user?.username
    });

    if (!authResult || !authResult.accessToken || !authResult.user) {
      console.error('❌ Invalid authentication data');
      return NextResponse.json(
        { success: false, message: 'Invalid authentication data' },
        { status: 400 }
      );
    }

    let piUser = authResult.user;

    // Validate with Pi Platform API in production
    if (config.isProduction) {
      try {
        console.log('🔍 Validating with Pi Platform API...');
        const piPlatformClient = getPiPlatformAPIClient();
        piUser = await piPlatformClient.verifyUser(authResult.accessToken);
        console.log('✅ Pi Platform API validation successful');
      } catch (error) {
        console.error('❌ Pi Platform API validation failed:', error);
        return NextResponse.json(
          { success: false, message: 'Token validation failed' },
          { status: 401 }
        );
      }
    } else {
      console.log('🔧 Development mode: Using auth result directly');
    }

    console.log('👤 Processing user data:', {
      username: piUser.username,
      uid: piUser.uid,
      hasWalletAddress: !!piUser.wallet_address
    });

    // Convert Pi user to our app user format (backend processing)
    const user: User = {
      id: piUser.uid,
      username: piUser.username,
      name: piUser.username, // Pi doesn't provide separate name, use username
      email: piUser.profile?.email || '',
      walletAddress: piUser.wallet_address || '',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${piUser.username}`,
      bio: '',
      balance: 0, // Will be fetched separately via other endpoints
      miningRate: 0, // Will be fetched separately via other endpoints
      teamSize: 0,
      isNodeOperator: false,
      kycStatus: 'verified', // Pi Network users are verified
      joinDate: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      termsAccepted: true,
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
      badges: [],
      userActiveMiningHours_LastWeek: 0,
      userActiveMiningHours_LastMonth: 0,
      activeMiningDays_LastWeek: 0,
      activeMiningDays_LastMonth: 0,
      // Don't store tokens in user object anymore
      accessToken: '',
      refreshToken: '',
      tokenExpiresAt: 0,
    };

    // Save user to database
    const { UserService } = await import('@/services/databaseService');
    
    try {
      // Check if user already exists
      let existingUser = await UserService.getUserById(piUser.uid);
      
      if (!existingUser) {
        // Check by username as well
        existingUser = await UserService.getUserByUsername(piUser.username);
      }
      
      let dbUser: any;
      if (existingUser) {
        // Update existing user with latest data
        console.log('🔄 Updating existing user in database');
        dbUser = await UserService.updateUser((existingUser as any).id, {
          username: piUser.username,
          name: piUser.username,
          email: piUser.profile?.email || '',
          walletAddress: piUser.wallet_address || '',
          lastActive: new Date().toISOString(),
          // Don't store tokens in user table anymore
        });
      } else {
        // Create new user
        console.log('🆕 Creating new user in database');
        dbUser = await UserService.createUser(user);
      }
      
      console.log('✅ User saved to database:', {
        userId: dbUser.id,
        username: dbUser.username,
        hasWalletAddress: !!dbUser.walletAddress
      });

      // Create session
      console.log('🔐 Creating session for user:', dbUser.id);
      const { sessionToken, expiresAt } = await createSession(
        dbUser.id,
        authResult.accessToken,
        authResult.refreshToken
      );

      // Create response
      const response = NextResponse.json({
        success: true,
        user: {
          ...dbUser,
          // Don't include sensitive tokens in response
          accessToken: undefined,
          refreshToken: undefined,
          tokenExpiresAt: undefined,
        },
        message: 'Authentication successful'
      });

      // Set session cookie
      setSessionCookie(response, sessionToken, expiresAt);

      console.log('✅ Authentication completed successfully');
      return response;
      
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      
      // Even if database save fails, create session for immediate use
      console.log('⚠️ Database save failed, creating session anyway');
      const { sessionToken, expiresAt } = await createSession(
        user.id,
        authResult.accessToken,
        authResult.refreshToken
      );

      const response = NextResponse.json({
        success: true,
        user: {
          ...user,
          // Don't include sensitive tokens in response
          accessToken: undefined,
          refreshToken: undefined,
          tokenExpiresAt: undefined,
        },
        message: 'Authentication successful (database save failed)'
      });

      // Set session cookie
      setSessionCookie(response, sessionToken, expiresAt);
      
      return response;
    }

  } catch (error) {
    console.error('❌ Authentication error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Authentication failed' 
      },
      { status: 500 }
    );
  }
} 