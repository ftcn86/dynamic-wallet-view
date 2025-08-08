import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/session';
import prisma from '@/lib/db';

/**
 * Get Current User API Endpoint
 * 
 * Following the official demo pattern:
 * 1. Get access token from cookie
 * 2. Verify with Pi Platform API
 * 3. Return user data
 */

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getUserFromSession(request);
    if (!sessionUser) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    // Enrich from DB if needed
    const dbUser = await prisma.user.findUnique({ where: { id: sessionUser.id } });

    return NextResponse.json({
      success: true,
      user: {
        id: sessionUser.id,
        username: dbUser?.username ?? sessionUser.username ?? '',
        name: dbUser?.username ?? sessionUser.username ?? '',
        email: '',
        walletAddress: (dbUser as any)?.walletAddress || '',
      },
    });
  } catch (error) {
    console.error('❌ User/me error:', error);
    return NextResponse.json({ error: 'Failed to get user data' }, { status: 500 });
  }
}