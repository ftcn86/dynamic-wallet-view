import { NextRequest, NextResponse } from 'next/server';
import { invalidateSession } from '@/lib/session';

/**
 * Logout API Endpoint
 * 
 * Following the official demo pattern:
 * 1. Invalidate session in database
 * 2. Clear session cookie
 * 3. Return success response
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🚪 Logout endpoint called');
    
    // Get session token from cookie
    const sessionToken = request.cookies.get('session-token')?.value;
    
    if (sessionToken) {
      // Invalidate session in database
      await invalidateSession(sessionToken);
      console.log('✅ Session invalidated in database');
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear session cookie
    response.cookies.set('session-token', '', {
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