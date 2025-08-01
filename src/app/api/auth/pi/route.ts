import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';

/**
 * Pi Network Authentication API Endpoint
 * 
 * Following the official Pi Network demo pattern:
 * 1. Accept full authResult from frontend
 * 2. Validate token with /v2/me endpoint
 * 3. Create or update user in database
 * 4. Return success response
 */

export async function POST(request: NextRequest) {
  try {
    const { authResult } = await request.json();

    if (!authResult || !authResult.accessToken) {
      return NextResponse.json(
        { error: 'Auth result with access token is required' },
        { status: 400 }
      );
    }

    const { accessToken, user } = authResult;

    console.log('🔍 Validating Pi Network access token...');
    console.log('🔧 User UID:', user?.uid);
    console.log('🔧 Username:', user?.username);

    // Use Pi Platform API client to verify the token with /v2/me endpoint
    const piPlatformClient = getPiPlatformAPIClient();
    
    try {
      // Follow official demo pattern: use /v2/me endpoint directly
      const me = await piPlatformClient.request('/v2/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      console.log('✅ Pi Network token validation successful');
      console.log('🔧 User data from /v2/me:', me);

      // Create or update user in database
      const { UserService } = await import('@/services/databaseService');
      
      let currentUser = await UserService.getUserByAccessToken(accessToken);
      
      if (currentUser) {
        // Update existing user
        currentUser = await UserService.updateUser((currentUser as any).id, {
          accessToken,
          lastActive: new Date().toISOString(),
        });
      } else {
        // Create new user
        currentUser = await UserService.createUser({
          username: user.username,
          name: user.profile ? `${user.profile.firstname || ''} ${user.profile.lastname || ''}`.trim() || user.username : user.username,
          email: user.profile?.email,
          walletAddress: user.wallet_address,
          accessToken,
          termsAccepted: true,
          joinDate: new Date().toISOString(),
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
      }

      console.log('✅ User authenticated successfully');
      console.log('🔧 User ID:', (currentUser as any).id);

      return NextResponse.json({
        success: true,
        message: "User signed in",
        user: {
          id: (currentUser as any).id,
          username: (currentUser as any).username,
          name: (currentUser as any).name,
          email: (currentUser as any).email,
          walletAddress: (currentUser as any).walletAddress,
        }
      });

    } catch (platformError) {
      console.error('❌ Pi Platform API validation failed:', platformError);
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('❌ Pi Network auth API error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
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