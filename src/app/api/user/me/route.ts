import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

/**
 * User Data API Endpoint
 * 
 * Following the official demo pattern:
 * 1. Get user from database session
 * 2. Return user data
 * 3. No cookie parsing needed
 */

export async function GET(request: NextRequest) {
  try {
    // Get user from database session (NEW: Proper session management)
    const user = await getSessionUser(request);
    
    if (!user) {
      console.log('❌ No valid session found');
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    console.log('✅ Session validated, userId:', user.id);

    // Return user data from session
    const responseData = {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
      },
      message: 'User data retrieved successfully'
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
    // Get user from database session (NEW: Proper session management)
    const user = await getSessionUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    // Get user from database
    const { UserService } = await import('@/services/databaseService');
    const dbUser = await UserService.getUserById(user.id);
    
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { settings } = await request.json();

    // Update user settings in database
    try {
      await UserService.updateUser((dbUser as any).id, { settings });
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