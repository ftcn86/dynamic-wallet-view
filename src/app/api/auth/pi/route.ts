import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';

/**
 * Pi Network Authentication API Endpoint
 * 
 * Following the official Pi Network demo repository pattern:
 * 1. Accept authResult from frontend
 * 2. Validate with /v2/me endpoint
 * 3. Store user in session (not tokens)
 * 4. Return success response
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

    const { accessToken, user } = authResult;

    // Validate with Pi Platform API (following official docs)
    console.log('🔍 Validating with Pi Platform API...');
    const piPlatformClient = getPiPlatformAPIClient();
    
    try {
      const me = await piPlatformClient.request('/v2/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      console.log('✅ Pi Platform API validation successful');
    } catch (error) {
      console.error('❌ Pi Platform API validation failed:', error);
      return NextResponse.json(
        { success: false, message: 'Invalid access token' },
        { status: 401 }
      );
    }

    console.log('👤 Processing user data:', {
      username: user.username,
      uid: user.uid,
      hasWalletAddress: !!user.wallet_address
    });

    // Try to save user to database (with fallback)
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
        // Create new user
        console.log('🆕 Creating new user in database');
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
          kycStatus: 'verified' as const,
          joinDate: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          termsAccepted: true,
          settings: {
            theme: 'system' as const,
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

    // Create response (following demo pattern)
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

    // Set session cookie (following demo pattern)
    response.cookies.set('pi-session', JSON.stringify({
      userId: dbUser.id,
      username: dbUser.username,
      accessToken: accessToken,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    console.log('✅ Authentication completed successfully');
    return response;

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
 * Validate session token
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No valid authorization header' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    
    // Validate token with /v2/me endpoint
    const piPlatformClient = getPiPlatformAPIClient();
    const me = await piPlatformClient.request('/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    // Get user from database
    const { UserService } = await import('@/services/databaseService');
    const user = await UserService.getUserByAccessToken(accessToken);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: (user as any).id,
        username: (user as any).username,
        name: (user as any).name,
        email: (user as any).email,
        walletAddress: (user as any).walletAddress,
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