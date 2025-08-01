import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@/data/schemas';

/**
 * User Data API Endpoint
 * 
 * Following the pure user app pattern:
 * 1. Get basic user profile from session
 * 2. Return minimal user data (no Pi Network API calls)
 * 3. Let frontend handle Pi Network data via SDK
 */

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const sessionCookie = request.cookies.get('pi-session');
    
    if (!sessionCookie?.value) {
      console.log('❌ No session cookie found');
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch (error) {
      console.error('❌ Invalid session cookie:', error);
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    if (!sessionData.userId) {
      console.log('❌ No userId in session data');
      return NextResponse.json(
        { error: 'Invalid session data' },
        { status: 401 }
      );
    }

    console.log('✅ Session validated, userId:', sessionData.userId);

    // Get user from database (basic profile only)
    let user: any = null;
    let useFallback = false;

    try {
      const { UserService } = await import('@/services/databaseService');
      user = await UserService.getUserById(sessionData.userId);
      
      if (!user) {
        console.log('⚠️ User not found in database, using fallback data');
        useFallback = true;
      } else {
        console.log('✅ User found in database:', user.username);
      }
    } catch (dbError) {
      console.error('❌ Database error, using fallback data:', dbError);
      useFallback = true;
    }

    // Fallback to session data if database is unavailable
    if (useFallback) {
      user = {
        id: sessionData.userId,
        username: sessionData.username || 'user',
        name: sessionData.username || 'User',
        email: '',
        walletAddress: '',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sessionData.username || 'user'}`,
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
    }

    // Return basic user data (no Pi Network data)
    const responseData = {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        avatar: user.avatar,
        bio: user.bio,
        joinDate: user.joinDate,
        lastActive: user.lastActive,
        termsAccepted: user.termsAccepted,
        settings: user.settings,
      },
      useFallback: useFallback,
      message: 'Use Pi Browser for real-time balance and transaction data'
    };

    console.log('✅ User data returned successfully');
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ User data API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Update user settings
 */
export async function PUT(request: NextRequest) {
  try {
    // Get session from cookie
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
      console.error('❌ Invalid session cookie:', error);
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

    const { settings } = await request.json();

    // Update user settings in database
    try {
      await UserService.updateUser((user as any).id, { settings });
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
} 