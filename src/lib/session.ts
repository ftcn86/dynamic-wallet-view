import prisma from '@/lib/db';
import { NextRequest } from 'next/server';

// Use Prisma singleton

/**
 * Session Management Utility
 * Following Official Pi Network Patterns
 */

export interface SessionUser {
  id: string;
  uid: string;
  username: string;
  accessToken: string;
}

/**
 * Get user from session token
 */
export async function getUserFromSession(request: NextRequest): Promise<SessionUser | null> {
  try {
    const sessionToken = request.cookies.get('session-token')?.value;
    
    if (!sessionToken) {
      return null;
    }

    const session = await prisma.userSession.findFirst({
      where: { 
        sessionToken,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!session) {
      return null;
    }

    return {
      id: session.user.id,
      uid: session.user.uid,
      username: session.user.username,
      accessToken: session.user.accessToken || ''
    };
  } catch (error) {
    console.error('❌ Session validation error:', error);
    return null;
  }
}

/**
 * Validate session token
 */
export async function validateSession(sessionToken: string): Promise<boolean> {
  try {
    const session = await prisma.userSession.findFirst({
      where: { 
        sessionToken,
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    });

    return !!session;
  } catch (error) {
    console.error('❌ Session validation error:', error);
    return false;
  }
}

/**
 * Invalidate session
 */
export async function invalidateSession(sessionToken: string): Promise<void> {
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
  } catch (error) {
    console.error('❌ Session invalidation error:', error);
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    await prisma.userSession.updateMany({
      where: { 
        expiresAt: { lt: new Date() },
        isActive: true
      },
      data: { 
        isActive: false,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('❌ Session cleanup error:', error);
  }
} 