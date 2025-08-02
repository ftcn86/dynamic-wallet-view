import { NextRequest, NextResponse } from 'next/server';

/**
 * Logout Endpoint (Official Demo Pattern)
 * 
 * Simply clears the access token cookie
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚪 Logout endpoint called');

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear the access token cookie (Official Demo Pattern)
    response.cookies.set('pi-access-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    console.log('✅ Logout completed successfully');
    return response;

  } catch (error) {
    console.error('❌ Logout error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Logout failed' 
      },
      { status: 500 }
    );
  }
} 