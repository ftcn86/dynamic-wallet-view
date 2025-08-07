import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * Official Pi Network Signout Endpoint
 * Following exact pattern from official demo
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🚪 [SIGNOUT] Signout endpoint called');
    
    const sessionToken = request.cookies.get('session-token')?.value;
    
    if (sessionToken) {
      // Invalidate session in database (Official Pattern)
      try {
        await prisma.userSession.updateMany({
          where: { 
            sessionToken,
            isActive: true
          },
          data: { 
            isActive: false,
            updatedAt: new Date()
          }
        });
        console.log('✅ [SIGNOUT] Session invalidated in database');
      } catch (error) {
        console.error('❌ [SIGNOUT] Session invalidation error:', error);
        // Continue with signout even if session invalidation fails
      }
    }

    // Clear session cookie (Official Pattern)
    const response = NextResponse.json({ 
      message: "User signed out" 
    });

    response.cookies.set('session-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    console.log('✅ [SIGNOUT] Signout completed successfully');
    return response;

  } catch (error) {
    console.error('❌ [SIGNOUT] Signout error:', error);
    return NextResponse.json(
      { 
        error: 'Signout failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
