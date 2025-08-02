import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { createSession, getSessionUser } from '@/lib/session';

/**
 * Pi Network Authentication API Endpoint
 * 
 * Following the OFFICIAL demo pattern:
 * 1. Accept authResult from frontend
 * 2. VERIFY with Pi Platform API (CRITICAL)
 * 3. Store user data only after verification
 * 4. Create database session
 * 5. Return success response
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Authentication endpoint called');
    const { authResult } = await request.json();

    console.log('📋 Auth result received:', {
      hasAuthResult: !!authResult,
      hasUser: !!authResult?.user,
      hasAccessToken: !!authResult?.accessToken,
      username: authResult?.user?.username
    });

    if (!authResult || !authResult.user || !authResult.accessToken) {
      console.error('❌ Invalid authentication data');
      return NextResponse.json(
        { success: false, message: 'Invalid authentication data' },
        { status: 400 }
      );
    }

    // CRITICAL: Verify with Pi Platform API (Official Demo Pattern)
    console.log('🔍 Verifying with Pi Platform API...');
    try {
      const { getPiPlatformAPIClient } = await import('@/lib/pi-network');
      const piPlatformClient = getPiPlatformAPIClient();
      
      const piUserData = await piPlatformClient.verifyUser(authResult.accessToken);
      console.log('✅ Pi Platform API verification successful:', {
        uid: piUserData.uid,
        username: piUserData.username,
        hasWalletAddress: !!piUserData.wallet_address
      });
      
    } catch (error) {
      console.error('❌ Pi Platform API verification error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to verify with Pi Platform API' },
        { status: 401 }
      );
    }

    const { user } = authResult;

    console.log('👤 Processing verified user data:', {
      username: user.username,
      uid: user.uid,
      hasWalletAddress: !!user.wallet_address
    });

    // Store user data in database (only after verification)
    let dbUser: any = null;
    let useFallback = false;
    
    try {
      const { UserService } = await import('@/services/databaseService');
      
      // Check if user already exists
      let existingUser = await UserService.getUserById(user.uid);
      
      if (!existingUser) {
        // Check by username as well
        existingUser = await UserService.getUserByUsername(user.username);
      }
      
      if (existingUser) {
        // Update existing user with latest data
        console.log('🔄 Updating existing user in database');
        dbUser = await UserService.updateUser((existingUser as any).id, {
          username: user.username,
          name: user.username,
          email: user.profile?.email || '',
          walletAddress: user.wallet_address || '',
          lastActive: new Date().toISOString(),
        });
      } else {
        // Create new user with complete data (FIXED: Added all required fields)
        console.log('🆕 Creating new user in database with complete data');
        const newUser = {
          id: user.uid,
          username: user.username,
          name: user.username,
          email: user.profile?.email || '',
          walletAddress: user.wallet_address || '',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
          bio: '',
          balance: 0,
          miningRate: 0,
          teamSize: 0,
          isNodeOperator: false,
          nodeUptimePercentage: 0,
          kycStatus: 'not_completed' as const,
          joinDate: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          termsAccepted: true,
          accessToken: '',
          refreshToken: '',
          tokenExpiresAt: undefined,
          // CRITICAL: Add all required fields for settings page
          settings: {
            theme: 'system' as const,
            language: 'en',
            notifications: true,
            emailNotifications: false,
            remindersEnabled: true,
            reminderHoursBefore: 1,
          },
          // CRITICAL: Add balance breakdown for dashboard
          balanceBreakdown: {
            transferableToMainnet: 0,
            totalUnverifiedPi: 0,
            currentlyInLockups: 0,
          },
          // CRITICAL: Add unverified Pi details
          unverifiedPiDetails: {
            fromReferralTeam: 0,
            fromSecurityCircle: 0,
            fromNodeRewards: 0,
            fromOtherBonuses: 0,
          },
          // CRITICAL: Add empty arrays for badges and other relations
          badges: [],
          transactions: [],
          notifications: [],
          teamMembers: [],
          balanceHistory: [],
        };
        dbUser = await UserService.createUser(newUser);
      }
      
      console.log('✅ User saved to database:', {
        userId: dbUser.id,
        username: dbUser.username,
        hasWalletAddress: !!dbUser.walletAddress
      });
      
    } catch (dbError) {
      console.error('❌ Database error, using fallback:', dbError);
      useFallback = true;
      
      // Create fallback user object
      dbUser = {
        id: user.uid,
        username: user.username,
        name: user.username,
        email: user.profile?.email || '',
        walletAddress: user.wallet_address || '',
      };
    }

    // Create database session (NEW: Proper session management)
    console.log('🔑 Creating database session...');
    try {
      const sessionToken = await createSession(dbUser.id, authResult.accessToken);
      
      // Create response (following official demo pattern)
      const response = NextResponse.json({
        success: true,
        user: {
          id: dbUser.id,
          username: dbUser.username,
          name: dbUser.name,
          email: dbUser.email,
          walletAddress: dbUser.walletAddress,
        },
        message: 'Authentication successful',
        useFallback: useFallback
      });

      // Set session cookie with database token (NEW: Proper session token)
      response.cookies.set('session-token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/',
      });

      console.log('✅ Authentication completed successfully');
      return response;
    } catch (sessionError) {
      console.error('❌ Failed to create session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create user session' },
        { status: 500 }
      );
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

/**
 * Simple session validation (no token needed)
 */
export async function GET(request: NextRequest) {
  try {
    // FIXED: Use proper session management
    const user = await getSessionUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
      }
    });

  } catch (error) {
    console.error('❌ Session validation error:', error);
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    );
  }
} 