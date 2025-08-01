import { NextRequest, NextResponse } from 'next/server';

/**
 * Logout API Endpoint
 * 
 * Following the official demo repository pattern:
 * Clear session cookie to log out user
 */

export async function POST(request: NextRequest) {
  try {
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'User logged out successfully',
    });

    // Clear session cookie (following demo pattern)
    response.cookies.set('pi-session', '', {
      expires: new Date(0),
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
} 