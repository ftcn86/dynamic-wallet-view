import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

/**
 * Pi Network Authentication API Endpoint
 * 
 * Following the OFFICIAL demo pattern:
 * 1. Accept authResult from frontend
 * 2. VERIFY with Pi Platform API (CRITICAL)
 * 3. Store user data only after verification
 * 4. Set session cookie
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
      const piPlatformResponse = await fetch(`${config.piNetwork.platformApiUrl}/v2/me`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${authResult.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!piPlatformResponse.ok) {
        console.error('❌ Pi Platform API verification failed:', piPlatformResponse.status);
        return NextResponse.json(
          { success: false, message: 'Invalid access token - verification failed' },
          { status: 401 }
        );
      }
      
      const piUserData = await piPlatformResponse.json();
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
        // Create new user with minimal data
        console.log('🆕 Creating new user in database');
        const newUser = {
          id: user.uid,
          username: user.username,
          name: user.username,
          email: user.profile?.email || '',
          walletAddress: user.wallet_address || '',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
          bio: '',
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

    // Set session cookie (following official demo pattern)
    response.cookies.set('pi-session', JSON.stringify({
      userId: dbUser.id,
      username: dbUser.username,
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
 * Simple session validation (no token needed)
 */
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('pi-session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    if (!sessionData.userId) {
      return NextResponse.json(
        { error: 'Invalid session data' },
        { status: 401 }
      );
    }

    // Get user from database
    const { UserService } = await import('@/services/databaseService');
    const user = await UserService.getUserById(sessionData.userId);

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