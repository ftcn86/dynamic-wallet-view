import { NextRequest, NextResponse } from 'next/server';

/**
 * Pi Network Authentication API Endpoint
 * 
 * Following the pure user app pattern:
 * 1. Accept authResult from frontend
 * 2. Store minimal user data (no token validation)
 * 3. Set simple session cookie
 * 4. Return success response
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Authentication endpoint called');
    const { authResult } = await request.json();

    console.log('📋 Auth result received:', {
      hasAuthResult: !!authResult,
      hasUser: !!authResult?.user,
      username: authResult?.user?.username
    });

    if (!authResult || !authResult.user) {
      console.error('❌ Invalid authentication data');
      return NextResponse.json(
        { success: false, message: 'Invalid authentication data' },
        { status: 400 }
      );
    }

    const { user } = authResult;

    console.log('👤 Processing user data:', {
      username: user.username,
      uid: user.uid,
      hasWalletAddress: !!user.wallet_address
    });

    // Store minimal user data in database (optional)
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

    // Create response (pure user app pattern)
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

    // Set simple session cookie (no access token needed)
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