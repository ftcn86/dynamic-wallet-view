import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

/**
 * Pi Network Authentication API Endpoint
 * 
 * OFFICIAL Pi Network Demo Pattern:
 * 1. Accept authResult from frontend
 * 2. Verify with Pi Platform API
 * 3. Return simple success response
 * 4. No complex database operations
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

    // OFFICIAL PATTERN: Simple response with user data (no database operations)
    console.log('✅ Creating simple authentication response...');
    
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.uid,
        username: user.username,
        name: user.username,
        email: user.profile?.email || '',
        walletAddress: user.wallet_address || '',
      },
      message: 'Authentication successful'
    });

    // Set simple session cookie with access token (Official Demo Pattern)
    response.cookies.set('pi-access-token', authResult.accessToken, {
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
 * Simple session validation (Official Demo Pattern)
 */
export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('pi-access-token')?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }

    // Verify token with Pi Platform API
    try {
      const { getPiPlatformAPIClient } = await import('@/lib/pi-network');
      const piPlatformClient = getPiPlatformAPIClient();
      
      const userData = await piPlatformClient.verifyUser(accessToken);
      
      return NextResponse.json({
        success: true,
        user: {
          id: userData.uid,
          username: userData.username,
          name: userData.username,
          email: userData.profile?.email || '',
          walletAddress: userData.wallet_address || '',
        }
      });
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('❌ Session validation error:', error);
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    );
  }
} 