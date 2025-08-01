import { NextRequest, NextResponse } from 'next/server';

/**
 * Logout API Endpoint
 * 
 * This endpoint handles user logout by clearing the user's session
 * and invalidating their authentication.
 */

export async function POST(request: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No valid authorization header' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    
    // Get user from database
    const { UserService } = await import('@/services/databaseService');
    const user = await UserService.getUserByAccessToken(accessToken);
    
    if (user) {
      // Clear access token from user record
      await UserService.updateUser((user as any).id, {
        accessToken: undefined,
        refreshToken: undefined,
        tokenExpiresAt: undefined,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'User logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
} 