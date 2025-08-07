import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * Logout Endpoint (Official Demo Pattern)
 * 
 * Simply clears the access token cookie
 */
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session-token')?.value;
    if (sessionToken) {
      await prisma.userSession.updateMany({
        where: { sessionToken, isActive: true },
        data: { isActive: false, updatedAt: new Date() }
      });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    response.cookies.set('session-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

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