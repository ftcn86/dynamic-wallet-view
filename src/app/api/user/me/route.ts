import { NextRequest, NextResponse } from 'next/server';

/**
 * Get Current User API Endpoint
 * 
 * Following the official demo pattern:
 * 1. Get access token from cookie
 * 2. Verify with Pi Platform API
 * 3. Return user data
 */

export async function GET(request: NextRequest) {
  try {
    console.log('👤 User/me endpoint called');

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
      
      console.log('✅ User data retrieved successfully:', {
        uid: userData.uid,
        username: userData.username
      });

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
    console.error('❌ User/me error:', error);
    return NextResponse.json(
      { error: 'Failed to get user data' },
      { status: 500 }
    );
  }
} 