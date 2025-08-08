import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';
import prisma from '@/lib/db';
import { randomBytes } from 'crypto';

// Use Prisma singleton

/**
 * Official Pi Network Signin Endpoint
 * Following exact pattern from official demo
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔐 [SIGNIN] Authentication endpoint called');
    const { authResult } = await request.json();

    console.log('📋 [SIGNIN] Auth result received:', {
      hasAuthResult: !!authResult,
      hasUser: !!authResult?.user,
      hasAccessToken: !!authResult?.accessToken,
      username: authResult?.user?.username
    });

    if (!authResult || !authResult.user || !authResult.accessToken) {
      console.error('❌ [SIGNIN] Invalid authentication data');
      return NextResponse.json(
        { error: 'Invalid authentication data' },
        { status: 400 }
      );
    }

    // 1. Verify with Pi Platform API (Official Pattern)
    console.log('🔍 [SIGNIN] Verifying with Pi Platform API...');
    try {
      const piPlatformClient = getPiPlatformAPIClient();
      const piUserData = await piPlatformClient.verifyUser(authResult.accessToken);
      console.log('✅ [SIGNIN] Pi Platform API verification successful:', {
        uid: piUserData.uid,
        username: piUserData.username
      });
    } catch (error) {
      console.error('❌ [SIGNIN] Pi Platform API verification error:', error);
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
    }

    // 2. Store user in database (Official Pattern)
    console.log('💾 [SIGNIN] Storing user in database...');
    let currentUser;
    try {
      currentUser = await prisma.user.upsert({
        where: { username: authResult.user.username },
        update: { 
          accessToken: authResult.accessToken,
          walletAddress: authResult.user.wallet_address || null,
          updatedAt: new Date()
        },
        create: {
          uid: authResult.user.uid,
          username: authResult.user.username,
          accessToken: authResult.accessToken,
          walletAddress: authResult.user.wallet_address || null
        }
      });
      console.log('✅ [SIGNIN] User stored/updated in database:', currentUser.id);
    } catch (error) {
      console.error('❌ [SIGNIN] Database error:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // 3. Create session (Official Pattern)
    console.log('🎫 [SIGNIN] Creating session...');
    const sessionToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    try {
      await prisma.userSession.create({
        data: {
          userId: currentUser.id,
          sessionToken,
          expiresAt,
          isActive: true
        }
      });
      console.log('✅ [SIGNIN] Session created successfully');
    } catch (error) {
      console.error('❌ [SIGNIN] Session creation error:', error);
      return NextResponse.json(
        { error: 'Session creation failed' },
        { status: 500 }
      );
    }

    // 4. Set session cookie (Official Pattern)
    const response = NextResponse.json({ 
      message: "User signed in",
      user: {
        id: currentUser.id,
        username: currentUser.username
      }
    });

    // Set cookie with proper cross-origin settings
    response.cookies.set('session-token', sessionToken, {
      httpOnly: true,
      secure: true, // Always secure for cross-origin
      sameSite: 'none', // Allow cross-origin requests
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    console.log('✅ [SIGNIN] Authentication completed successfully');
    return response;

  } catch (error) {
    console.error('❌ [SIGNIN] Authentication error:', error);
    return NextResponse.json(
      { 
        error: 'Authentication failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Method not allowed for GET
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
