import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, clearSessionCookie, invalidateSession } from '@/lib/session';

/**
 * Logout Endpoint
 * 
 * This endpoint invalidates the user's session and clears the session cookie.
 */

export async function POST(request: NextRequest) {
  try {
    // Get session from request cookies
    const session = await getSessionFromRequest(request);
    
    if (session) {
      // Invalidate the session in database
      await invalidateSession(session.sessionId);
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear session cookie
    clearSessionCookie(response);

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    // Create response even if session invalidation fails
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear session cookie anyway
    clearSessionCookie(response);

    return response;
  }
} 