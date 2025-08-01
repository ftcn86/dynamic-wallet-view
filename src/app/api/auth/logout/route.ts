import { NextRequest, NextResponse } from 'next/server';

/**
 * Logout API Endpoint
 * 
 * Clears the session cookie to log out the user
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🚪 Logout endpoint called');
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear session cookie
    response.cookies.set('pi-session', '', {
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