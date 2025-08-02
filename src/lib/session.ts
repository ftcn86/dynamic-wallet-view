import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { config } from '@/lib/config';

/**
 * Simple Session Management Utility
 * Uses your existing UserSession model with Prisma
 */

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  walletAddress?: string;
}

/**
 * Get user from session token
 */
export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  try {
    const sessionToken = request.cookies.get('session-token')?.value;
    if (!sessionToken) {
      return null;
    }

    const session = await prisma.userSession.findUnique({
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
      username: session.user.username,
      name: session.user.name,
      email: session.user.email || undefined,
      walletAddress: session.user.walletAddress || undefined,
    };
  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
}

/**
 * Create new session for user
 */
export async function createSession(userId: string, piAccessToken: string): Promise<string> {
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.userSession.create({
    data: {
      userId,
      sessionToken,
      piAccessToken,
      expiresAt,
      isActive: true,
    }
  });

  return sessionToken;
}

/**
 * Invalidate session
 */
export async function invalidateSession(sessionToken: string): Promise<void> {
  await prisma.userSession.updateMany({
    where: { sessionToken },
    data: { isActive: false }
  });
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  await prisma.userSession.updateMany({
    where: { 
      expiresAt: { lt: new Date() },
      isActive: true
    },
    data: { isActive: false }
  });
} 