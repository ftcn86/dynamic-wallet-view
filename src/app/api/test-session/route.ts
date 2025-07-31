import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, createSession, setSessionCookie } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    // Check if session exists
    const session = await getSessionFromRequest(request);
    
    if (session) {
      return NextResponse.json({
        success: true,
        message: 'Session found',
        session: {
          userId: session.userId,
          expiresAt: session.expiresAt
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No session found',
        cookies: request.cookies.getAll().map(c => ({ name: c.name, value: c.value ? 'present' : 'empty' }))
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error checking session',
      error: (error as Error).message
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Create a test session
    const { sessionToken, expiresAt } = await createSession(
      'test-user-id',
      'test-access-token',
      'test-refresh-token'
    );
    
    // Set the session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Test session created',
      sessionToken: sessionToken.substring(0, 20) + '...'
    });
    
    setSessionCookie(response, sessionToken, expiresAt);
    
    return response;
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error creating test session',
      error: (error as Error).message
    });
  }
} 